import { createClient } from '@supabase/supabase-js';
import type { LostItem } from '../types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://eqvxmopgyeloclytfcux.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImVxdnhtb3BneWVsb2NlyXRmY3V4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTQzNzIwMzcsImV4cCI6MjEwOTk0ODAzN30.3_SstPDQIj_e6pNiYDVE4P_J64C0Um7_g1Ts0aJP-E8';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function teacherRequest(body: FormData | Record<string, unknown>): Promise<{ message: string; item?: LostItem }> {
  const headers: Record<string, string> = { apikey: supabaseAnonKey };
  if (!(body instanceof FormData)) headers['Content-Type'] = 'application/json';
  const res = await fetch(`${supabaseUrl}/functions/v1/ocean-teacher`, {
    method: 'POST', headers, body: body instanceof FormData ? body : JSON.stringify(body),
  });
  const result = await res.json();
  if (!res.ok) throw new Error(result.message || '요청을 처리하지 못했습니다.');
  return result;
}

export async function verifyTeacherCode(code: string): Promise<void> {
  await teacherRequest({ action: 'verify', code });
}

export async function createItemWithCode(code: string, item: Omit<LostItem, 'id' | 'created_at' | 'image_url'>, image: File): Promise<LostItem> {
  const file = await compressImage(image);
  const form = new FormData();
  form.set('action', 'create');
  form.set('code', code);
  form.set('image', file, image.name);
  form.set('title', item.title);
  form.set('category', item.category);
  form.set('storage_office', item.storage_office);
  form.set('found_location', item.found_location);
  form.set('found_date', item.found_date);
  form.set('description', item.description);
  form.set('finder_info', item.finder_info || '');
  const result = await teacherRequest(form);
  if (!result.item) throw new Error('분실물 등록 결과를 확인하지 못했습니다.');
  return result.item;
}

export async function deleteItemWithCode(code: string, id: string): Promise<void> {
  await teacherRequest({ action: 'delete', code, id });
}

/**
 * Fetch lost items with optional filters
 */
export async function getLostItems(options?: {
  search?: string;
  category?: string;
  office?: string;
  status?: string;
}): Promise<LostItem[]> {
  let query = supabase
    .from('lost_items')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.category && options.category !== 'all') {
    query = query.eq('category', options.category);
  }

  if (options?.office && options.office !== 'all') {
    query = query.eq('storage_office', options.office);
  }

  if (options?.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options?.search && options.search.trim() !== '') {
    const term = `%${options.search.trim()}%`;
    query = query.or(`title.ilike.${term},description.ilike.${term},storage_office.ilike.${term},found_location.ilike.${term}`);
  }

  const { data, error } = await query;
  if (error) {
    console.error('Error fetching lost items:', error);
    throw error;
  }
  return data || [];
}

/**
 * Register a new lost item
 */
export async function createLostItem(item: Omit<LostItem, 'id' | 'created_at'>): Promise<LostItem> {
  const { data, error } = await supabase
    .from('lost_items')
    .insert([
      {
        title: item.title,
        category: item.category,
        storage_office: item.storage_office,
        found_location: item.found_location || '',
        found_date: item.found_date || new Date().toISOString().split('T')[0],
        description: item.description || '',
        image_url: item.image_url || '',
        status: item.status || '보관중',
        finder_info: item.finder_info || '교사 등록'
      }
    ])
    .select()
    .single();

  if (error) {
    console.error('Error creating lost item:', error);
    throw error;
  }
  return data;
}

/**
 * Mark item status (e.g. '반환완료' or '보관중')
 */
export async function updateLostItemStatus(id: string, status: '보관중' | '반환완료'): Promise<LostItem> {
  const updatePayload: Record<string, unknown> = {
    status,
    updated_at: new Date().toISOString()
  };

  if (status === '반환완료') {
    updatePayload.returned_at = new Date().toISOString();
  } else {
    updatePayload.returned_at = null;
  }

  const { data, error } = await supabase
    .from('lost_items')
    .update(updatePayload)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    console.error('Error updating lost item status:', error);
    throw error;
  }
  return data;
}

/**
 * Delete a lost item (and optionally remove its image from storage)
 */
export async function deleteLostItem(id: string, imageUrl?: string): Promise<void> {
  // 1. Delete DB record
  const { error } = await supabase
    .from('lost_items')
    .delete()
    .eq('id', id)
    .select('id')
    .single();

  if (error) {
    console.error('Error deleting lost item:', error);
    throw error;
  }

  // 2. Clean up storage if stored in our bucket
  if (imageUrl) await removeLostItemImage(imageUrl);
}

export async function removeLostItemImage(imageUrl: string): Promise<void> {
  const prefix = `${supabaseUrl}/storage/v1/object/public/lost_and_found/`;
  if (!imageUrl.startsWith(prefix)) return;
  const path = decodeURIComponent(imageUrl.slice(prefix.length).split('?')[0]);
  const { error } = await supabase.storage.from('lost_and_found').remove([path]);
  if (error) throw new Error('물품 기록은 삭제됐지만 사진 삭제에 실패했습니다. 관리자에게 문의해 주세요.');
}

/**
 * Client-side image compression:
 * Resizes large camera photos (e.g. 12MP 4000x3000) to max 1200px width/height
 * and compresses to JPEG ~85% quality. This turns 5~10MB uploads into ~150~300KB
 * without quality loss for screen viewing.
 */
async function compressImage(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const supported = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'].includes(file.type);
    // If it's a small file or not an image, resolve directly
    if (file.size < 400 * 1024 && supported) {
      resolve(file);
      return;
    }

    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.src = e.target?.result as string;
    };

    img.onload = () => {
      const maxDimension = 1200;
      let width = img.width;
      let height = img.height;

      if (width > maxDimension || height > maxDimension) {
        if (width > height) {
          height = Math.round((height * maxDimension) / width);
          width = maxDimension;
        } else {
          width = Math.round((width * maxDimension) / height);
          height = maxDimension;
        }
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        if (supported) resolve(file);
        else reject(new Error('이 사진을 변환할 수 없습니다. JPG 또는 PNG 사진을 선택해 주세요.'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => {
          if (blob && (!supported || blob.size < file.size)) {
            resolve(blob);
          } else if (!supported) {
            reject(new Error('이 사진을 변환할 수 없습니다. JPG 또는 PNG 사진을 선택해 주세요.'));
          } else {
            resolve(file);
          }
        },
        'image/jpeg',
        0.85
      );
    };

    img.onerror = () => supported ? resolve(file) : reject(new Error('이 사진을 열 수 없습니다. JPG 또는 PNG 사진을 선택해 주세요.'));
    reader.onerror = () => reject(new Error('사진을 읽지 못했습니다. 다시 선택해 주세요.'));
    reader.readAsDataURL(file);
  });
}

/**
 * Upload a photo to the Supabase Storage bucket 'lost_and_found'
 */
export async function uploadLostItemImage(file: File): Promise<string> {
  const compressedBlob = await compressImage(file);
  const fileExt = compressedBlob.type === 'image/jpeg' ? 'jpg' : (file.name.split('.').pop() || 'jpg');
  const cleanExt = fileExt.toLowerCase().replace(/[^a-z0-9]/g, '') || 'jpg';
  const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 9)}.${cleanExt}`;
  const filePath = `items/${fileName}`;

  const { error: uploadError } = await supabase.storage
    .from('lost_and_found')
    .upload(filePath, compressedBlob, {
      cacheControl: '3600',
      upsert: false,
      contentType: compressedBlob.type || file.type || 'image/jpeg'
    });

  if (uploadError) {
    console.error('Error uploading image to storage:', uploadError);
    throw uploadError;
  }

  const { data } = supabase.storage
    .from('lost_and_found')
    .getPublicUrl(filePath);

  return data.publicUrl;
}
