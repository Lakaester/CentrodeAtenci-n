import * as fs from "fs";
import * as path from "path";
import type { IPersistenceAdapter } from "../interfaces/IPersistenceAdapter";

export class JsonFileAdapter<T extends { id?: string }> implements IPersistenceAdapter<T> {
  private items: T[] = [];
  private filePath: string;
  private loaded = false;

  constructor(filename: string) {
    const dir = path.join(__dirname, "..", "..", "..", "..", "data");
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    this.filePath = path.join(dir, filename);
  }

  private load(): void {
    if (this.loaded) return;
    this.loaded = true;
    try {
      if (fs.existsSync(this.filePath)) {
        this.items = JSON.parse(fs.readFileSync(this.filePath, "utf-8"));
      }
    } catch { this.items = []; }
  }

  private persist(): void {
    try { fs.writeFileSync(this.filePath, JSON.stringify(this.items, null, 2), "utf-8"); } catch {}
  }

  async save(entry: T): Promise<void> {
    this.load();
    this.items.push(entry);
    this.persist();
  }

  async list(limit = 100): Promise<T[]> {
    this.load();
    return this.items.slice(-limit).reverse();
  }

  async findBy(field: string, value: string): Promise<T[]> {
    this.load();
    return this.items.filter((e: any) => String(e[field] ?? "") === value);
  }

  async count(): Promise<number> {
    this.load();
    return this.items.length;
  }
}
