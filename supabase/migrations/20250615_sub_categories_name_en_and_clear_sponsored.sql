-- 서브카테고리 영문명 + 스폰서드 전체 해제

ALTER TABLE sub_categories
  ADD COLUMN IF NOT EXISTS name_en text;

UPDATE sub_categories SET name_en = 'TTS' WHERE slug = 'audio-tts';
UPDATE sub_categories SET name_en = 'Transcription' WHERE slug = 'audio-transcript';
UPDATE sub_categories SET name_en = 'Music' WHERE slug = 'audio-music';
UPDATE sub_categories SET name_en = 'Noise Removal' WHERE slug = 'audio-noise';
UPDATE sub_categories SET name_en = 'AI Coding' WHERE slug = 'code-ai';
UPDATE sub_categories SET name_en = 'IDE' WHERE slug = 'code-ide';
UPDATE sub_categories SET name_en = 'Deployment' WHERE slug = 'code-deploy';
UPDATE sub_categories SET name_en = 'Database' WHERE slug = 'code-db';
UPDATE sub_categories SET name_en = 'UI/UX' WHERE slug = 'design-uiux';
UPDATE sub_categories SET name_en = 'Presentation' WHERE slug = 'design-ppt';
UPDATE sub_categories SET name_en = 'Assets' WHERE slug = 'design-assets';
UPDATE sub_categories SET name_en = 'Color' WHERE slug = 'design-color';
UPDATE sub_categories SET name_en = 'Background Removal' WHERE slug = 'image-bg-remove';
UPDATE sub_categories SET name_en = 'Image Generation' WHERE slug = 'image-generation';
UPDATE sub_categories SET name_en = 'Image Editing' WHERE slug = 'image-editing';
UPDATE sub_categories SET name_en = 'Assets' WHERE slug = 'image-assets';
UPDATE sub_categories SET name_en = 'Upscale' WHERE slug = 'image-upscale';
UPDATE sub_categories SET name_en = 'SEO' WHERE slug = 'marketing-seo';
UPDATE sub_categories SET name_en = 'Email' WHERE slug = 'marketing-email';
UPDATE sub_categories SET name_en = 'Social Media' WHERE slug = 'marketing-sns';
UPDATE sub_categories SET name_en = 'Analytics' WHERE slug = 'marketing-analytics';
UPDATE sub_categories SET name_en = 'Notes' WHERE slug = 'productivity-note';
UPDATE sub_categories SET name_en = 'Automation' WHERE slug = 'productivity-auto';
UPDATE sub_categories SET name_en = 'Project Management' WHERE slug = 'productivity-pm';
UPDATE sub_categories SET name_en = 'Meetings' WHERE slug = 'productivity-meet';
UPDATE sub_categories SET name_en = 'Chatbot' WHERE slug = 'text-chatbot';
UPDATE sub_categories SET name_en = 'Translation' WHERE slug = 'text-translation';
UPDATE sub_categories SET name_en = 'Writing' WHERE slug = 'text-writing';
UPDATE sub_categories SET name_en = 'Grammar' WHERE slug = 'text-grammar';
UPDATE sub_categories SET name_en = 'Video Generation' WHERE slug = 'video-generation';
UPDATE sub_categories SET name_en = 'Video Editing' WHERE slug = 'video-editing';
UPDATE sub_categories SET name_en = 'Subtitles' WHERE slug = 'video-subtitle';
UPDATE sub_categories SET name_en = 'Short-form' WHERE slug = 'video-shorts';

UPDATE tools SET is_sponsored = false WHERE is_sponsored = true;
