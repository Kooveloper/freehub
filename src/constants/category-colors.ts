export const CATEGORY_COLOR_OPTIONS = [
  { value: 'blue', label: 'Blue', hex: '#3B82F6' },
  { value: 'green', label: 'Green', hex: '#10B981' },
  { value: 'red', label: 'Red', hex: '#EF4444' },
  { value: 'purple', label: 'Purple', hex: '#8B5CF6' },
  { value: 'orange', label: 'Orange', hex: '#F97316' },
  { value: 'gray', label: 'Gray', hex: '#6B7280' },
] as const;

export type CategoryColor = (typeof CATEGORY_COLOR_OPTIONS)[number]['value'];

const COLOR_HEX_MAP = Object.fromEntries(
  CATEGORY_COLOR_OPTIONS.map((option) => [option.value, option.hex]),
) as Record<CategoryColor, string>;

export function getCategoryColorHex(color: string): string {
  return COLOR_HEX_MAP[color as CategoryColor] ?? COLOR_HEX_MAP.gray;
}

export const CATEGORY_COLOR_VALUES = CATEGORY_COLOR_OPTIONS.map(
  (option) => option.value,
);
