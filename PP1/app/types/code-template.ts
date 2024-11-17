import {Tag} from "@/app/types/tag";

export interface CodeTemplate {
  title: string;
  explanation: string;
  code: string;
  isForked: boolean;
  authorId: number;
  tags: Tag[];
}

