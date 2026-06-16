-- Ensure legal_pages exists (idempotent; safe if 20250609 already applied)

CREATE TABLE IF NOT EXISTS legal_pages (
  slug text PRIMARY KEY CHECK (slug IN ('privacy', 'terms')),
  title_ko text NOT NULL,
  title_en text,
  content_ko text NOT NULL,
  content_en text,
  effective_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO legal_pages (slug, title_ko, title_en, content_ko, content_en, effective_date)
VALUES
  ('privacy', '개인정보처리방침', 'Privacy Policy', '콘텐츠를 어드민에서 수정해주세요.', 'Please edit content in admin.', CURRENT_DATE),
  ('terms', '이용약관', 'Terms of Service', '콘텐츠를 어드민에서 수정해주세요.', 'Please edit content in admin.', CURRENT_DATE)
ON CONFLICT (slug) DO NOTHING;
