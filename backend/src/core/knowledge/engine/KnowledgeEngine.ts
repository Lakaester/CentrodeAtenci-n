import { KnowledgeRegistry } from "../registry/KnowledgeRegistry";
import { VersionManager } from "../versioning/VersionManager";
import { ApprovalService } from "../approval/ApprovalService";
import type { KnowledgeArticle, ArticleStatus } from "../types";

export class KnowledgeEngine {
  registry = new KnowledgeRegistry();
  versions = new VersionManager();
  approval = new ApprovalService();

  createArticle(article: KnowledgeArticle): void {
    this.registry.register(article);
    this.versions.createVersion(article.id, article.content, article.author, "Versión inicial");
  }

  updateStatus(articleId: string, status: ArticleStatus): KnowledgeArticle | null {
    const article = this.registry.get(articleId);
    if (!article) return null;
    article.status = status;
    article.updatedAt = new Date().toISOString();
    return article;
  }

  search(query: string): KnowledgeArticle[] {
    return this.registry.search(query);
  }

  listByCategory(category: string): KnowledgeArticle[] {
    return this.registry.findByCategory(category);
  }

  getArticle(id: string): KnowledgeArticle | undefined {
    return this.registry.get(id);
  }

  getStats() {
    const all = this.registry.list();
    return {
      total: all.length,
      byCategory: {
        articles: all.filter((a) => a.category === "article").length,
        playbooks: all.filter((a) => a.category === "playbook").length,
        procedures: all.filter((a) => a.category === "procedure").length,
        faqs: all.filter((a) => a.category === "faq").length,
        knownIssues: all.filter((a) => a.category === "known_issue").length,
      },
      byStatus: {
        draft: all.filter((a) => a.status === "draft").length,
        published: all.filter((a) => a.status === "published").length,
        archived: all.filter((a) => a.status === "archived").length,
      },
    };
  }
}
