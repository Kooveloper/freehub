import type { Locale } from '@/i18n/config';
import type { Category, Tool } from '@/types/tool';

function pickLocalizedString(
  locale: Locale,
  primary: string,
  english?: string | null,
): string {
  if (locale === 'en' && english?.trim()) {
    return english;
  }
  return primary;
}

function pickLocalizedNullable(
  locale: Locale,
  primary: string | null,
  english?: string | null,
): string | null {
  if (locale === 'en' && english?.trim()) {
    return english;
  }
  return primary;
}

function pickLocalizedArray(
  locale: Locale,
  primary: string[],
  english?: string[],
): string[] {
  if (locale === 'en' && english && english.length > 0) {
    return english;
  }
  return primary;
}

export function localizeTool(tool: Tool, locale: Locale): Tool {
  if (locale === 'ko') return tool;

  return {
    ...tool,
    name: pickLocalizedString(locale, tool.name, tool.name_en),
    description: pickLocalizedString(locale, tool.description, tool.description_en),
    free_limit_unit: pickLocalizedNullable(
      locale,
      tool.free_limit_unit,
      tool.free_limit_unit_en,
    ),
    free_description: pickLocalizedNullable(
      locale,
      tool.free_description,
      tool.free_description_en,
    ),
    free_features: pickLocalizedArray(
      locale,
      tool.free_features,
      tool.free_features_en,
    ),
    paid_only_features: pickLocalizedArray(
      locale,
      tool.paid_only_features,
      tool.paid_only_features_en,
    ),
    tags: pickLocalizedArray(locale, tool.tags, tool.tags_en),
    tip: pickLocalizedNullable(locale, tool.tip, tool.tip_en),
  };
}

export function localizeTools(tools: Tool[], locale: Locale): Tool[] {
  return tools.map((tool) => localizeTool(tool, locale));
}

export function localizeCategory(
  category: Category,
  locale: Locale,
): Category {
  if (locale === 'ko') return category;

  return {
    ...category,
    name: pickLocalizedString(locale, category.name, category.name_en),
    description: pickLocalizedString(
      locale,
      category.description,
      category.description_en,
    ),
  };
}

export function localizeCategories(
  categories: Category[],
  locale: Locale,
): Category[] {
  return categories.map((category) => localizeCategory(category, locale));
}
