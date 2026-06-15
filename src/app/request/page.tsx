import { redirect } from 'next/navigation';

/** 서비스 추가 요청 페이지 → 제보하기(새 툴 제보)로 통합 */
export default function RequestPage() {
  redirect('/submit?tab=new_tool');
}
