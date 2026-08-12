import type { KnowledgeVersion } from "../types";

export class VersionManager {
  private versions = new Map<string, KnowledgeVersion[]>();

  createVersion(articleId: string, content: string, author: string, changelog: string): KnowledgeVersion {
    const existing = this.versions.get(articleId) ?? [];
    const major = existing.length + 1;
    const version: KnowledgeVersion = {
      id: `v${major}.0.0`,
      articleId,
      version: `${major}.0.0`,
      content,
      author,
      changelog,
      createdAt: new Date().toISOString(),
    };
    existing.push(version);
    this.versions.set(articleId, existing);
    return version;
  }

  getVersions(articleId: string): KnowledgeVersion[] {
    return this.versions.get(articleId) ?? [];
  }

  getVersion(articleId: string, version: string): KnowledgeVersion | undefined {
    return this.getVersions(articleId).find((v) => v.version === version);
  }
}
