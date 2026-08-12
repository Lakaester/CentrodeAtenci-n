import type { Playbook } from "../../domain/playbooks/Playbook";

export interface IPlaybookProvider {
  obtenerPlaybook(categoria: string): Promise<Playbook | null>;
  recomendarPlaybook(categoria: string, canal?: string): Promise<Playbook | null>;
  obtenerPlaybooksPorCategoria(categoria: string): Promise<Playbook[]>;
  validarProgreso(playbookId: string): Promise<number>;
}
