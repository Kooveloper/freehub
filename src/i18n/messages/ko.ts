export const ko = {
  nav: {
    home: '홈',
    categories: '카테고리',
    blog: '블로그',
    compare: '비교하기',
    submit: '제보하기',
    login: '로그인',
    favorites: '즐겨찾기',
    logout: '로그아웃',
    profileMenu: '프로필 메뉴',
    openMenu: '메뉴 열기',
    closeMenu: '메뉴 닫기',
  },
  footer: {
    tagline: '돈 내기 전에 무료로 써봐',
    categories: '카테고리',
    about: '소개',
    privacy: '개인정보처리방침',
    terms: '이용약관',
    inquiry: '문의하기',
    report: '제보하기',
    copyright: 'All rights reserved.',
  },
  home: {
    heroTitleLine1: '무료로 쓸 수 있는 모든 서비스',
    heroTitleLine2: '한곳에서 모아보자!',
    heroSubtitle: 'FREEHUB에서 필요한 서비스를 찾아보세요!',
    searchPlaceholder: 'ChatGPT, Notion, Midjourney...',
    categoriesTitle: '카테고리별 탐색',
    mostPopular: '가장 많이 찾은 서비스',
    stats: '{categoryCount}개 카테고리 · {toolCount}개 서비스',
    statsPrefix: '현재',
    requestCtaTitle: '등록되지 않은 서비스가 있나요?',
    requestCtaDescription: '추가되었으면 하는 서비스가 있다면 요청해주세요!',
    requestCtaButton: '서비스 추가 요청하기',
  },
  request: {
    title: '등록되지 않은 서비스가 있나요?',
    description: '추가되었으면 하는 서비스가 있다면 요청해주세요!',
    pageDescription: '요청하신 서비스는 검토 후 FreeHub에 추가됩니다.',
  },
  search: {
    placeholder: 'AI·SaaS 도구 검색...',
    clear: '검색어 지우기',
  },
  tool: {
    favorite: '즐겨찾기',
    noCardRequired: '카드 불필요',
    viewDetails: '자세히 보기',
    freeSuffix: '무료',
    toolCount: '{count}개 서비스',
  },
  freeLimit: {
    unlimited: '무제한',
    daily: '매일 {amount}{unit}',
    monthly: '매월 {amount}{unit}',
    total: '총 {amount}{unit}',
  },
  common: {
    loading: '로딩 중…',
    save: '저장',
    cancel: '취소',
    register: '등록',
    saving: '저장 중…',
    noTools: '등록된 서비스가 없습니다.',
  },
  category: {
    all: '전체',
  },
  metadata: {
    defaultTitle: '{appName} - 무료 AI·SaaS 서비스 큐레이션',
    defaultDescription:
      '돈 내기 전에 무료로 써봐. AI·SaaS 서비스의 무료 플랜, 한도, 기능을 한곳에서 비교하고 찾아보세요.',
  },
};

export type Messages = typeof ko;
