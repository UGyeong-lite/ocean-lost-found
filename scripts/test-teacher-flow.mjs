// Creates a test item and deletes only that item. Supply OCEAN_TEACHER_CODE via the environment.
import assert from 'node:assert/strict';

const code = process.env.OCEAN_TEACHER_CODE;
if (!code) throw new Error('OCEAN_TEACHER_CODE is required');
const url = 'https://eqvxmopgyeloclytfcux.supabase.co/functions/v1/ocean-teacher';
const png = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl7BNwAAAAASUVORK5CYII=', 'base64');
const form = new FormData();
for (const [key, value] of Object.entries({ action: 'create', code, title: '임시 연결 테스트', category: '기타', storage_office: '2A', found_date: '2026-01-01', found_location: '', description: '', finder_info: '' })) form.set(key, value);
form.set('image', new Blob([png], { type: 'image/png' }), 'test.png');
let id;
try {
  const created = await fetch(url, { method: 'POST', body: form });
  const data = await created.json();
  if (!created.ok) throw new Error(`Create failed: ${created.status} ${data.message}`);
  id = data.item?.id;
  assert.ok(id);
  assert.equal(data.item.storage_office, '2A');
  assert.match(data.item.image_url, /lost_and_found/);
  console.log('Photo upload and office selection: OK');
} finally {
  if (id) {
    const deleted = await fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ action: 'delete', code, id }) });
    if (!deleted.ok) throw new Error(`Test item cleanup failed: ${deleted.status} ${await deleted.text()}`);
    console.log('Test item and photo cleanup: OK');
  }
}
