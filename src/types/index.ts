export interface LostItem {
  id: string;
  title: string;
  category: string;
  storage_office: string;
  found_location: string;
  found_date: string;
  description: string;
  image_url: string;
  status: '보관중' | '반환완료';
  finder_info?: string;
  returned_at?: string | null;
  created_at: string;
  updated_at?: string;
}

export const CATEGORIES = [
  { id: 'all', label: '전체', icon: 'Sparkles' },
  { id: '전자기기', label: '전자기기', icon: 'Smartphone' },
  { id: '의류/잡화', label: '의류/잡화', icon: 'Shirt' },
  { id: '학용품/도서', label: '학용품/도서', icon: 'BookOpen' },
  { id: '지갑/카드', label: '지갑/카드', icon: 'CreditCard' },
  { id: '기타', label: '기타 물품', icon: 'Box' },
] as const;

export const DEFAULT_OFFICES = [
  '1층 본교무실',
  '2A',
  '2B',
  '3A',
  '3B',
  '4A',
  '4B',
] as const;
