import type { ApprovalRequest } from "../types";

export class ApprovalService {
  private requests = new Map<string, ApprovalRequest>();

  requestApproval(articleId: string, requestedBy: string): ApprovalRequest {
    const req: ApprovalRequest = {
      id: `apr_${Date.now()}`,
      articleId,
      requestedBy,
      status: "pending",
      createdAt: new Date().toISOString(),
    };
    this.requests.set(req.id, req);
    return req;
  }

  approve(requestId: string, approvedBy: string, comment?: string): ApprovalRequest | null {
    const req = this.requests.get(requestId);
    if (!req || req.status !== "pending") return null;
    req.status = "approved";
    req.approvedBy = approvedBy;
    req.comment = comment;
    req.resolvedAt = new Date().toISOString();
    return req;
  }

  reject(requestId: string, approvedBy: string, comment: string): ApprovalRequest | null {
    const req = this.requests.get(requestId);
    if (!req || req.status !== "pending") return null;
    req.status = "rejected";
    req.approvedBy = approvedBy;
    req.comment = comment;
    req.resolvedAt = new Date().toISOString();
    return req;
  }

  getByArticle(articleId: string): ApprovalRequest[] {
    return Array.from(this.requests.values()).filter((r) => r.articleId === articleId);
  }
}
