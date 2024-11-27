export interface Comment {
  id: number;
  content: string;
  authorId: number;
  authorUsername: string;
  createdAt: string;
  score: number;
  replies: Comment[];
  allowAction: boolean;
  userVote: number;
  postId: number;
}

export interface ReportedComment extends Comment {
  reportCount: number;
}