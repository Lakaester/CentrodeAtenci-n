/**
 * CatalogoTicketService — Catálogos locales de COPE para el formulario de Ticket.
 *
 * Desacoplado: el formulario NO conoce la fuente. Cuando se confirmen los
 * endpoints reales de Micro-Services, solo se reemplaza la implementación de
 * estas funciones sin tocar el componente.
 *
 * Por ahora: sin tablas en BD, sin endpoints inventados. Categoría/Subcategoría/
 * Nivel provienen de aquí; Proyectos/Tipos/Estados/Dev provienen de Tareabi.
 */

export interface CategoriaLocal {
  id: string;
  nombre: string;
  subcategorias: string[];
}

export interface NivelTicket {
  id: string;
  nombre: string;
}

// Lista base de categorías con sus subcategorías (fuente local de COPE).
// Se reemplazará por los catálogos reales de Micro-Services cuando estén disponibles.
const CATEGORIAS: CategoriaLocal[] = [
  { id: "solicitud-operativa", nombre: "Solicitud operativa", subcategorias: ["Operación diaria", "Ajuste de configuración", "Otro"] },
  { id: "solicitud-administrativa", nombre: "Solicitud administrativa", subcategorias: ["Contratos", "Facturación", "Renovación", "Otro"] },
  { id: "error", nombre: "Error", subcategorias: ["Error en producción", "Error en QA", "Error en desarrollo", "Otro"] },
  { id: "solicitud-desarrollo", nombre: "Solicitud de desarrollo", subcategorias: ["Nueva funcionalidad", "Mejora", "Corrección", "Otro"] },
  { id: "queja-atencion", nombre: "Queja atención", subcategorias: ["Atención", "Soporte", "Otro"] },
  { id: "facturacion-electronica", nombre: "Facturación electrónica", subcategorias: ["Emisión", "Anulación", "Comunicación SUNAT", "Otro"] },
  { id: "capacitacion", nombre: "Capacitación", subcategorias: ["Virtual", "Presencial", "Material", "Otro"] },
  { id: "cierre-comercial", nombre: "Cierre Comercial", subcategorias: ["Nuevo cliente", "Renovación", "Ampliación", "Otro"] },
];

const NIVELES: NivelTicket[] = [
  { id: "muy-prioritario", nombre: "Muy Prioritario" },
  { id: "prioritario", nombre: "Prioritario" },
  { id: "mediano", nombre: "Mediano" },
  { id: "normal", nombre: "Normal" },
];

export const catalogoTicketService = {
  /** Lista de categorías (para el selector). */
  categorias(): string[] {
    return CATEGORIAS.map((c) => c.nombre);
  },

  /** Subcategorías de una categoría (dependiente). */
  subcategoriasDe(categoria: string | null | undefined): string[] {
    if (!categoria) return [];
    const c = CATEGORIAS.find((x) => x.nombre.toLowerCase() === categoria.trim().toLowerCase());
    return c?.subcategorias ?? [];
  },

  /** Lista de niveles de ticket. */
  niveles(): string[] {
    return NIVELES.map((n) => n.nombre);
  },

  /** Áreas de tarea (fuente local; el flujo usa Desarrollo). */
  areas(): string[] {
    return ["Desarrollo", "Capacitación", "Implementación", "Operaciones", "Expansión"];
  },
};