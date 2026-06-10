import {
  BarChart3,
  Code2,
  Image,
  MessageSquare,
  Mic,
  Palette,
  PenLine,
  TrendingUp,
  Video,
  Zap,
  type LucideIcon,
} from 'lucide-react';

/** 카테고리 아이콘 이름 → Lucide 컴포넌트 */
export const CATEGORY_ICON_MAP: Record<string, LucideIcon> = {
  MessageSquare,
  Image,
  PenLine,
  Video,
  Mic,
  Zap,
  Palette,
  Code2,
  TrendingUp,
  BarChart3,
};

export function getCategoryIcon(iconName: string): LucideIcon {
  return CATEGORY_ICON_MAP[iconName] ?? Zap;
}
