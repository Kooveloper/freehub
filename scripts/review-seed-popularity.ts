import { randomInt } from 'node:crypto';

const MAX_REVIEWS = 7;

/** 서비스별 시드 리뷰 목표 수 (0~7). 인지도·사용자 규모 기준 */
const REVIEW_COUNT_BY_SLUG: Record<string, number> = {
  // 7 — 대중적으로 가장 많이 쓰이는 서비스
  chatgpt: 7,
  claude: 7,
  figma: 7,
  canva: 7,
  notion: 7,
  gemini: 7,
  'github-copilot': 7,

  // 6
  'google-translate': 6,
  zoom: 6,
  'capcut-video': 6,
  'microsoft-teams': 6,
  cursor: 6,
  perplexity: 6,
  obsidian: 6,
  trello: 6,

  // 5
  deepl: 5,
  grammarly: 5,
  unsplash: 5,
  pexels: 5,
  pixabay: 5,
  'adobe-express': 5,
  elevenlabs: 5,
  runway: 5,
  'leonardo-ai': 5,
  suno: 5,
  'remove-bg': 5,
  photopea: 5,
  vercel: 5,
  supabase: 5,
  zapier: 5,
  calendly: 5,
  loom: 5,

  // 4
  'copy-ai': 4,
  quillbot: 4,
  rytr: 4,
  gamma: 4,
  ideogram: 4,
  'adobe-firefly': 4,
  pixlr: 4,
  'davinci-resolve': 4,
  hotjar: 4,
  buffer: 4,
  clickup: 4,
  make: 4,
  'otter-ai': 4,
  miricanvas: 4,
  papago: 4,

  // 3
  krisp: 3,
  netlify: 3,
  mailchimp: 3,
  'microsoft-designer': 3,
  flaticon: 3,
  icons8: 3,
  iconscout: 3,
  lottiefiles: 3,
  jitter: 3,
  penpot: 3,
  upscayl: 3,
  'lets-enhance': 3,
  magnific: 3,
  pika: 3,
  udio: 3,
  'wrtn-text': 3,
  'clova-note': 3,
  lark: 3,

  // 2 — 틈새·도구 성격
  storyset: 2,
  undraw: 2,
  'feather-icons': 2,
  lordicon: 2,
  uiverse: 2,
  'animated-backgrounds': 2,
  'get-waves': 2,
  clipdrop: 2,
  'hyper3d-rodin': 2,
  'devin-desktop': 2,
  blackkiwi: 2,
  daglo: 2,
  mangoboard: 2,
  'veed-io': 2,
};

/** 0 또는 1개만 두는 소규모·니치 서비스 */
const VARIABLE_LOW_SLUGS = new Set([
  'animxyz',
  'css-gradient',
  'css-loaders',
  'contentsquare',
  'google-analytics',
  'google-search-console',
  'mapia-net',
  'draph-art',
  'vrew',
  'clova-dubbing',
  'adobe-podcast',
]);

export function getSeedReviewTargetCount(slug: string): number {
  if (VARIABLE_LOW_SLUGS.has(slug)) {
    return randomInt(0, 2);
  }

  const count = REVIEW_COUNT_BY_SLUG[slug] ?? 0;
  return Math.min(Math.max(count, 0), MAX_REVIEWS);
}

/** 시드 리뷰 평점 — 4점 또는 5점만 (5점 비중 높음) */
export function randomSeedRating(): number {
  return randomInt(0, 10) < 7 ? 5 : 4;
}

/** 올해 6월 1일 ~ 기준 시각 사이 랜덤 작성일 */
export function randomReviewCreatedAt(referenceDate = new Date()): string {
  const year = referenceDate.getFullYear();
  const start = new Date(year, 5, 1, 0, 0, 0, 0);
  const endMs = referenceDate.getTime();
  const startMs = start.getTime();

  if (endMs <= startMs) {
    return referenceDate.toISOString();
  }

  return new Date(startMs + randomInt(0, endMs - startMs + 1)).toISOString();
}
