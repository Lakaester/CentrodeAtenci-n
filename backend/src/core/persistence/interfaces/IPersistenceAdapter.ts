export interface IPersistenceAdapter<T> {
  save(entry: T): Promise<void>;
  list(limit?: number): Promise<T[]>;
  findBy(field: string, value: string): Promise<T[]>;
  count(): Promise<number>;
}
