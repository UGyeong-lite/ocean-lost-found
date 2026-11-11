import { createClient } from 'npm:@supabase/supabase-js@2.119.0';

const cors = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};
const offices = ['1층 본교무실', '2A', '2B', '3A', '3B', '4A', '4B'];
const categories = ['전자기기', '의류/잡화', '학용품/도서', '지갑/카드', '기타'];
const response = (message: string, status: number, extra = {}) =>
  new Response(JSON.stringify({ message, ...extra }), { status, headers: { ...cors, 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } });

Deno.serve(async (request: Request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: cors });
  if (request.method !== 'POST') return response('허용되지 않는 요청입니다.', 405);
  try {
    const url = Deno.env.get('SUPABASE_URL')!;
    const keys = Deno.env.get('SUPABASE_SECRET_KEYS');
    const key = (keys ? JSON.parse(keys).default : null) || Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
    if (!url || !key) return response('서버 설정 오류입니다.', 500);
    const admin = createClient(url, key, { auth: { persistSession: false } });
    const isForm = request.headers.get('content-type')?.includes('multipart/form-data');
    const input = isForm ? await request.formData() : await request.json();
    const get = (name: string) => isForm ? (input as FormData).get(name) : input[name];
    const code = get('code');
    const action = get('action');
    if (typeof code !== 'string' || !code || code.length > 100) return response('교사 코드를 입력해 주세요.', 400);
    const { data: verified, error: verifyError } = await admin.rpc('ocean_check_teacher_code', { candidate: code });
    if (verifyError) return response('인증 서버에 연결하지 못했습니다.', 500);
    if (verified === 'locked') return response('인증 시도가 너무 많습니다. 5분 후 다시 시도해 주세요.', 429);
    if (verified !== 'ok') return response('교사 코드가 올바르지 않습니다.', 401);
    if (action === 'verify') return response('인증되었습니다.', 200);

    if (action === 'create' && isForm) {
      const file = get('image');
      const title = String(get('title') || '').trim();
      const category = String(get('category') || '');
      const office = String(get('storage_office') || '');
      const foundDate = String(get('found_date') || '');
      const location = String(get('found_location') || '').trim();
      const description = String(get('description') || '').trim();
      const finder = String(get('finder_info') || '').trim();
      const mimeExtensions: Record<string, string> = { 'image/jpeg': 'jpg', 'image/png': 'png', 'image/webp': 'webp', 'image/gif': 'gif' };
      if (!(file instanceof File) || !file.size || file.size > 10 * 1024 * 1024 || !mimeExtensions[file.type] || !title || title.length > 200 || !offices.includes(office) || !categories.includes(category) || !/^\d{4}-\d{2}-\d{2}$/.test(foundDate) || location.length > 200 || description.length > 2000 || finder.length > 200) return response('사진 또는 분실물 정보를 확인해 주세요. 사진은 JPG, PNG, WebP 또는 GIF 형식으로 10MB 이하여야 합니다.', 400);
      const path = `items/${crypto.randomUUID()}.${mimeExtensions[file.type]}`;
      const { error: uploadError } = await admin.storage.from('lost_and_found').upload(path, file, { contentType: file.type, upsert: false });
      if (uploadError) return response('사진 업로드에 실패했습니다.', 500);
      const { data: publicUrl } = admin.storage.from('lost_and_found').getPublicUrl(path);
      const { data: item, error: itemError } = await admin.from('lost_items').insert({ title, category, storage_office: office, found_location: location, found_date: foundDate, description, finder_info: finder, image_url: publicUrl.publicUrl, status: '보관중' }).select().single();
      if (itemError) {
        await admin.storage.from('lost_and_found').remove([path]);
        return response('분실물 등록에 실패했습니다.', 500);
      }
      return response('등록되었습니다.', 200, { item });
    }
    if (action === 'delete' && !isForm) {
      const id = get('id');
      if (typeof id !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)) return response('물품 번호가 올바르지 않습니다.', 400);
      const { data: item, error: readError } = await admin.from('lost_items').select('id,image_url').eq('id', id).maybeSingle();
      if (readError || !item) return response('분실물을 찾을 수 없습니다.', 404);
      const { error: deleteError } = await admin.from('lost_items').delete().eq('id', id);
      if (deleteError) return response('분실물 삭제에 실패했습니다.', 500);
      const prefix = `${url}/storage/v1/object/public/lost_and_found/`;
      if (item.image_url?.startsWith(prefix)) {
        const path = decodeURIComponent(item.image_url.slice(prefix.length).split('?')[0]);
        const { error: imageError } = await admin.storage.from('lost_and_found').remove([path]);
        if (imageError) return response('목록은 삭제됐지만 사진 정리에 실패했습니다. 관리자에게 문의해 주세요.', 500);
      }
      return response('삭제되었습니다.', 200);
    }
    return response('올바르지 않은 요청입니다.', 400);
  } catch {
    return response('요청을 처리하지 못했습니다.', 500);
  }
});
