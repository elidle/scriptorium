import { Rating } from "./rating";
import { Report } from "./report";

export interface RawComment {
  id: number;
  content: string | null;
  authorId: number | null;
  createdAt: Date;
  isHidden: boolean;
  isDeleted: boolean;
  author: {
    username: string;
  } | null;
  ratings: Rating[];
  postId: number;
}

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

export interface CommentDetails extends Comment {
  parentId: number;
  isHidden: boolean;
  isDeleted: boolean;
  author: {
    id: number;
    username: string;
  };
  metrics: {
    totalScore: number;
  };
  replies: CommentDetails[];
  ratings: Rating[];
}

export interface CommentReports extends CommentDetails {
  _count: {
    reports: Report[];
  }
}

export interface ReportedComment extends Comment {
  reportCount: number;
}