import type { SearchResult } from "../types";

export class MergeEngine {
  merge(results: SearchResult[][]): SearchResult[] {
    const seen = new Set<string>();
    const merged: SearchResult[] = [];

    for (const batch of results) {
      for (const item of batch) {
        if (!seen.has(item.id)) {
          seen.add(item.id);
          merged.push(item);
        }
      }
    }

    return merged;
  }
}
