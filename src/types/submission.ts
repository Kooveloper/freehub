/** 제보 유형 */
export type SubmissionType =
  | 'new_tool'
  | 'limit_change'
  | 'bug'
  | 'inquiry';

/** 새 툴 제보 */
export interface NewToolPayload {
  toolName: string;
  url: string;
  freeLimit: string;
  description: string;
}

/** 한도 변경 신고 */
export interface LimitChangePayload {
  toolId: string;
  toolName: string;
  changeContent: string;
  evidenceUrl: string;
}

/** 버그/오류 신고 */
export interface BugPayload {
  description: string;
  pageUrl?: string;
}

/** 기타 문의 */
export interface InquiryPayload {
  title: string;
  content: string;
}

export type SubmissionPayload =
  | NewToolPayload
  | LimitChangePayload
  | BugPayload
  | InquiryPayload;

export interface SubmissionRequest {
  type: SubmissionType;
  /** 기타 문의 시 필수 */
  email?: string;
  payload: SubmissionPayload;
}

/** 툴 선택 드롭다운용 */
export interface ToolOption {
  id: string;
  name: string;
}
