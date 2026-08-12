import type { Release } from "../types";

export interface IReleaseService {
  create(release: Release): Promise<void>;
  current(): Release | null;
  list(): Release[];
}
