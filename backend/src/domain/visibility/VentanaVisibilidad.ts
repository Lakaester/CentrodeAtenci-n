export interface VentanaVisibilidad {
  canal: string;
  etiqueta: string;
  horas: number;
}

const VENTANAS_DEFAULT: VentanaVisibilidad[] = [
  { canal: "wameta",    etiqueta: "WhatsApp Meta",     horas: 48 },
  { canal: "whaticket", etiqueta: "Whaticket",          horas: 48 },
  { canal: "zendesk",   etiqueta: "Zendesk",            horas: 120 },
  { canal: "correo",    etiqueta: "Correo electrónico", horas: 168 },
  { canal: "chat",      etiqueta: "Chat en línea",      horas: 24 },
  { canal: "default",   etiqueta: "General",            horas: 72 },
];

export class VentanaVisibilidadStore {
  private ventanas: Map<string, VentanaVisibilidad> = new Map();

  constructor() {
    for (const v of VENTANAS_DEFAULT) {
      this.ventanas.set(v.canal, v);
    }
  }

  obtener(canal: string): VentanaVisibilidad {
    return this.ventanas.get(canal) ?? this.ventanas.get("default")!;
  }

  actualizar(canal: string, horas: number): void {
    const existente = this.ventanas.get(canal);
    if (existente) {
      this.ventanas.set(canal, { ...existente, horas });
    }
  }

  listar(): VentanaVisibilidad[] {
    return Array.from(this.ventanas.values());
  }
}
