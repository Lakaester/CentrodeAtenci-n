import type { KnowledgeArticle } from "../types";

export class KnowledgeRegistry {
  private articles = new Map<string, KnowledgeArticle>();

  register(article: KnowledgeArticle): void {
    this.articles.set(article.id, article);
  }

  get(id: string): KnowledgeArticle | undefined {
    return this.articles.get(id);
  }

  list(): KnowledgeArticle[] {
    return Array.from(this.articles.values());
  }

  search(query: string): KnowledgeArticle[] {
    const q = query.toLowerCase();
    return this.list().filter(
      (a) =>
        a.title.toLowerCase().includes(q) ||
        a.content.toLowerCase().includes(q) ||
        a.tags.some((t) => t.toLowerCase().includes(q)) ||
        a.keywords.some((k) => k.toLowerCase().includes(q)),
    );
  }

  findByCategory(category: string): KnowledgeArticle[] {
    return this.list().filter((a) => a.category === category);
  }

  count(): number {
    return this.articles.size;
  }
}
