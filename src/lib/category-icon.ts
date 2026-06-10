import { CATEGORY_ICON_MAP } from '@/lib/category-icons';

export type CategoryIconType = 'emoji' | 'image' | 'lucide';

export function isCategoryIconImage(icon: string): boolean {
  const value = icon.trim();
  return /^https?:\/\//i.test(value);
}

export function getCategoryIconType(icon: string): CategoryIconType {
  const value = icon.trim();
  if (!value) return 'emoji';
  if (isCategoryIconImage(value)) return 'image';
  if (value in CATEGORY_ICON_MAP) return 'lucide';
  return 'emoji';
}

export function isValidCategoryIcon(icon: string): boolean {
  const value = icon.trim();
  if (!value) return false;
  if (isCategoryIconImage(value)) {
    if (value.length > 500) return false;
    try {
      const url = new URL(value);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }
  if (value in CATEGORY_ICON_MAP) return true;
  return value.length <= 8;
}
