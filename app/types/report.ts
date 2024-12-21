export interface Report {
  id: number;
  reason: string;
  reporterId: number;
  reporterUsername: string;
  createdAt: string;
}

export interface ReportRequest {
  reporterId: number;
  reason: string;
}

export interface CommentReportRequest extends ReportRequest {
  commentId: number;
}

export interface PostReportRequest extends ReportRequest {
  postId: number;
}

export interface ApiResponse {
  status: 'success' | 'error';
  message?: string;
}