import { TypeDetector } from "./TypeDetector";
import { MergeEngine } from "./MergeEngine";
import { RankingEngine } from "./RankingEngine";
import type { ISearchProvider } from "../interfaces/ISearchProvider";
import type { SearchResult } from "../types";

export class SearchEngine {
  private typeDetector = new TypeDetector();
  private mergeEngine = new MergeEngine();
  private rankingEngine = new RankingEngine();
  private providers: ISearchProvider[] = [];

  registerProvider(provider: ISearchProvider): void {
    this.providers.push(provider);
  }

  async search(raw: string): Promise<{ results: SearchResult[]; type: string }> {
    const query = this.typeDetector.detect(raw);
    const relevant = this.providers.filter((p) => p.supports(query.detectedType));
    const batches = await Promise.all(relevant.map((p) => p.search(query)));
    const merged = this.mergeEngine.merge(batches);
    const ranked = this.rankingEngine.rank(merged);
    return { results: ranked, type: query.detectedType };
  }
}
