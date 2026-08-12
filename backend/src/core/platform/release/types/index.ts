export interface Release {
  version: string;
  date: string;
  features: string[];
  fixes: string[];
  breaking: string[];
  migrations: string[];
  rollback: string;
}
