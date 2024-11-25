import { Tag } from './tag';
import {CodeTemplate} from "@/app/types/code-template";

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
  codeTemplates: CodeTemplate[];
}

export interface ReportedPost extends Post {
  reportCount: number;
}