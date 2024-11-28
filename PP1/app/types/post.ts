import { Tag } from './tag';
import { Report } from './report';
import { CodeTemplate } from './code-template';

export interface BlogPostRequest {
  authorId: number | string;
  title: string;
  content: string;
  tags?: string[];
  codeTemplateIds?: (number | string)[];
}

export interface Post {
  id: number;
  title: string;
  content: string;
  authorId: number;
  author: {
    id: number;
    username: string;
  };
  authorUsername: string;
  tags: Tag[];
  createdAt: string;
  score: number;
  userVote: number;
  allowAction: boolean;
  codeTemplates: CodeTemplate[];
}

export interface PostReports extends Post {
  _count: {
    reports: Report[];
  };
}

export interface PostWithMetrics extends Post {
  metrics: {
    totalScore: number;
  };
}

export interface ReportedPost extends Post {
  reportCount: number;
}

export interface PaginatedResponse {
  posts: Post[];
  hasMore: boolean;
  nextPage: number | null;
}