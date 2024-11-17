import { Tag } from './tag';

export interface BlogPost {
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