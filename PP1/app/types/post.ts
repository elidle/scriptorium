import { Tag } from './tag';

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: string;
  authorUsername: string;
  tags: Tag[];
  createdAt: string;
  score: number;
  userVote: number;
  allowAction: boolean;
}

export interface ReportedPost extends Post {
  reportCount: number;
}