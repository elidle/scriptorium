import {Tag} from "@/app/types/tag";

interface Author {
  username: string;
  avatar: string;
}

export interface CodeTemplate {
  id: string;
  author: Author;
  title: string;
  code: string;
  language: string;
  explanation: string;
  input?: string;
  tags: Tag[];
  createdAt: string;
  updatedAt: string;
  isForked: boolean;
  forkCount?: number;
  viewCount?: number;
}

