export type SortByTypes = 'new' | 'old' | 'most_relevant';

export interface SearchParams {
  query?: string;
  sortBy?: string;
  username?: string;
  page: number;
  tags: string[];
}