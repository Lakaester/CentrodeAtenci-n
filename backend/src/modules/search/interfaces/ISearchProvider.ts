import type { SearchResult, SearchQuery } from "../types";

export interface ISearchProvider {
  getName(): string;
  supports(type: string): boolean;
  search(query: SearchQuery): Promise<SearchResult[]>;
}
