export type AccionPlaybook =
  | "ABRIR_HERRAMIENTA"
  | "CONSULTAR_API"
  | "ENVIAR_MENSAJE"
  | "ACTUALIZAR_CAMPO"
  | "EJECUTAR_SCRIPT";

export interface PasoPlaybook {
  orden: number;
  accion: AccionPlaybook;
  herramientaId?: string;
  parametros: Record<string, string>;
}

export interface Playbook {
  id: string;
  nombre: string;
  descripcion: string;
  categoriaId: string;
  activo: boolean;
  pasos: PasoPlaybook[];
  createdAt: string;
  updatedAt: string;
}

export interface EjecucionPlaybook {
  id: string;
  playbookId: string;
  casoId: string;
  usuarioId: string;
  estado: "completado" | "fallido" | "en_curso";
  resultado?: string;
  ejecutadoEn: string;
}
