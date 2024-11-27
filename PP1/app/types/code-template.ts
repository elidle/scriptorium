import {Tag} from "@/app/types/tag";

export interface Author {
  id: string;
  username: string;
  avatar: string;
}

interface ParentFork {
  id: string;
  title: string;
  author: { username: string };
}

export interface CodeTemplate {
  id: string;
  title: string;
  code: string;
  language: string;
  explanation: string;
  tags: Tag[];
  author: Author;
  isForked: boolean;
  parentFork?: {
    id: string;
    title: string;
    author: {
      username: string;
    };
  };
  forkCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface CodeEditorProps {
  code: string;
  language: string;
  onChange: (value: string) => void;
  disabled?: boolean;
}

export interface ForkLabelProps {
    parentTemplate?: ParentFork;
}