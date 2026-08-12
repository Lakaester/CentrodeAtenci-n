import { TimelineEvent } from "./TimelineEvent";
import { TimelineBuilder } from "./TimelineBuilder";
import type { TipoEventoTimeline } from "./TimelineTypes";

export class Timeline {
  private eventos: TimelineEvent[] = [];
  private builder: TimelineBuilder;

  constructor(eventosIniciales?: TimelineEvent[]) {
    this.eventos = eventosIniciales ?? [];
    this.builder = new TimelineBuilder();
  }

  get todos(): TimelineEvent[] {
    return [...this.eventos].sort((a, b) => a.fecha.localeCompare(b.fecha));
  }

  get ultimos(): TimelineEvent[] {
    return [...this.eventos].sort((a, b) => b.fecha.localeCompare(a.fecha));
  }

  get cantidad(): number {
    return this.eventos.length;
  }

  agregar(evento: TimelineEvent): void {
    this.eventos.push(evento);
  }

  agregarBuilder(): TimelineBuilder {
    return this.builder;
  }

  aplicarBuilder(): void {
    const nuevos = this.builder.construir();
    this.eventos.push(...nuevos);
    this.builder.limpiar();
  }

  filtrarPorTipo(tipo: TipoEventoTimeline): TimelineEvent[] {
    return this.eventos.filter((e) => e.tipo === tipo);
  }

  filtrarPorCategoria(categoria: string): TimelineEvent[] {
    return this.eventos.filter((e) => e.categoria === categoria);
  }

  filtrarPorUsuario(usuarioId: string): TimelineEvent[] {
    return this.eventos.filter((e) => e.usuarioId === usuarioId);
  }

  desde(hasta: string): TimelineEvent[] {
    return this.eventos.filter((e) => e.fecha >= hasta);
  }

  entre(inicio: string, fin: string): TimelineEvent[] {
    return this.eventos.filter((e) => e.fecha >= inicio && e.fecha <= fin);
  }

  limpiar(): void {
    this.eventos = [];
  }

  toJSON(): ReturnType<TimelineEvent["toJSON"]>[] {
    return this.eventos.map((e) => e.toJSON());
  }
}
