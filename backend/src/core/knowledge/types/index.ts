export type ArticleStatus = "draft" | "in_review" | "approved" | "published" | "archived";
export type ArticleCategory = "playbook" | "procedure" | "faq" | "known_issue" | "article";

export interface KnowledgeArticle {
  id: string;
  title: string;
  content: string;
  category: ArticleCategory;
  tags: string[];
  status: ArticleStatus;
  version: string;
  author: string;
  approver?: string;
  createdAt: string;
  updatedAt: string;
  publishedAt?: string;
  keywords: string[];
}

export interface KnowledgeVersion {
  id: string;
  articleId: string;
  version: string;
  content: string;
  author: string;
  changelog: string;
  createdAt: string;
}

export interface ApprovalRequest {
  id: string;
  articleId: string;
  requestedBy: string;
  approvedBy?: string;
  status: "pending" | "approved" | "rejected";
  comment?: string;
  createdAt: string;
  resolvedAt?: string;
}
