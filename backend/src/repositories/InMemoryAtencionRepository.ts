import type { IAtencionRepository, FiltrosAtencion } from "../contracts/atencion/IAtencionRepository";
import type { AtencionData } from "../domain/atencion/Atencion";

export class InMemoryAtencionRepository implements IAtencionRepository {
  private items: Map<string, AtencionData> = new Map();

  async findById(id: string): Promise<AtencionData | null> {
    return this.items.get(id) ?? null;
  }

  async findAll(filtros?: FiltrosAtencion): Promise<{ items: AtencionData[]; total: number }> {
    let resultados = Array.from(this.items.values());

    if (filtros?.ticketOriginalStatus) resultados = resultados.filter((a) => a.origen.ticketOriginalStatus === filtros.ticketOriginalStatus);
    if (filtros?.canal) resultados = resultados.filter((a) => a.contexto.canal === filtros.canal);
    if (filtros?.asesorId) resultados = resultados.filter((a) => a.asesorId === filtros.asesorId);
    if (filtros?.clienteId) resultados = resultados.filter((a) => a.cliente.id === filtros.clienteId);
    if (filtros?.categoria) resultados = resultados.filter((a) => a.contexto.categoria === filtros.categoria);
    if (filtros?.search) {
      const q = filtros.search.toLowerCase();
      resultados = resultados.filter(
        (a) =>
          a.contexto.asunto.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q) ||
          a.cliente.nombre.toLowerCase().includes(q),
      );
    }

    resultados.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    const total = resultados.length;
    const pagina = filtros?.pagina ?? 1;
    const limite = filtros?.limite ?? 20;
    const desde = (pagina - 1) * limite;
    resultados = resultados.slice(desde, desde + limite);

    return { items: resultados, total };
  }

  async save(data: AtencionData): Promise<AtencionData> {
    this.items.set(data.id, { ...data });
    return data;
  }
}
