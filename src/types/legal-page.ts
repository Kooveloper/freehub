export type LegalPageSlug = 'privacy' | 'terms';

export interface LegalPage {
  slug: LegalPageSlug;
  title_ko: string;
  title_en: string | null;
  content_ko: string;
  content_en: string | null;
  effective_date: string;
  updated_at: string;
}
