import { ZendeskClient } from "../zendesk/infrastructure/ZendeskClient";

interface AgentInfo {
  id: number;
  nombre: string;
  correo: string;
  rol: string;
  activo: boolean;
  avatar: string | null;
  ultimaSync: string;
}

let cache: AgentInfo[] = [];
let lastSync = 0;
const TTL = 5 * 60 * 1000; // 5 min

export const AgentStore = {
  async sincronizar(): Promise<AgentInfo[]> {
    const client = new ZendeskClient();
    const users = await client.listarAgentes();
    cache = users
      .filter((u) => u.role === "agent" || u.role === "admin")
      .map((u) => ({
        id: u.id,
        nombre: u.name,
        correo: u.email,
        rol: u.role,
        activo: true,
        avatar: null,
        ultimaSync: new Date().toISOString(),
      }));
    lastSync = Date.now();
    return cache;
  },

  async obtenerAgentes(forzarSync = false): Promise<AgentInfo[]> {
    if (forzarSync || Date.now() - lastSync > TTL || cache.length === 0) {
      try {
        await this.sincronizar();
      } catch {
        if (cache.length === 0) throw new Error("No se pudieron obtener agentes");
      }
    }
    return cache;
  },

  buscar(query: string): AgentInfo[] {
    const q = query.toLowerCase();
    return cache.filter(
      (a) =>
        a.nombre.toLowerCase().includes(q) ||
        a.correo.toLowerCase().includes(q),
    );
  },

  obtenerPorId(id: number): AgentInfo | undefined {
    return cache.find((a) => a.id === id);
  },
};
