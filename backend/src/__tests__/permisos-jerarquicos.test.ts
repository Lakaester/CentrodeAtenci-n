/**
 * Tests: Permisos jerárquicos del módulo Gestión
 *
 * Valida que el sistema de permisos funciona correctamente con la
 * estructura jerárquica: Gestión → {Quejas y Devoluciones, Apoyos, Agendas}
 */
import { describe, it, expect } from "vitest";

// ─── Normalización (replica la lógica de auth.service.ts) ───
function norm(s: string | null | undefined): string {
  return (s ?? "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();
}

interface Permiso {
  modulo: string;
  accion: string;
  permitido: boolean;
}

function hasPermiso(permisos: Permiso[], modulo: string, accion: string): boolean {
  const p = permisos.find(
    (x) => norm(x.modulo) === norm(modulo) && norm(x.accion) === norm(accion),
  );
  return Boolean(p?.permitido);
}

function moduloVisible(permisos: Permiso[], modulo: string): boolean {
  return hasPermiso(permisos, modulo, "ver") || hasPermiso(permisos, modulo, "administrar");
}

// ─── Test data ───
const permisosAdmin: Permiso[] = [
  // Gestión (navegación)
  { modulo: "Gestión", accion: "ver", permitido: true },
  // Agendas
  { modulo: "Agendas", accion: "ver", permitido: true },
  { modulo: "Agendas", accion: "crear", permitido: true },
  { modulo: "Agendas", accion: "editar", permitido: true },
  { modulo: "Agendas", accion: "eliminar", permitido: true },
  { modulo: "Agendas", accion: "exportar", permitido: true },
  { modulo: "Agendas", accion: "administrar", permitido: true },
  // Apoyos
  { modulo: "Apoyos", accion: "ver", permitido: true },
  { modulo: "Apoyos", accion: "crear", permitido: true },
  { modulo: "Apoyos", accion: "editar", permitido: true },
  { modulo: "Apoyos", accion: "eliminar", permitido: true },
  { modulo: "Apoyos", accion: "exportar", permitido: true },
  { modulo: "Apoyos", accion: "administrar", permitido: true },
  { modulo: "Apoyos", accion: "cerrar", permitido: true },
  // Quejas y Devoluciones
  { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "editar", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "eliminar", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "exportar", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "administrar", permitido: true },
];

const permisosSoloVerAgendas: Permiso[] = [
  { modulo: "Gestión", accion: "ver", permitido: true },
  { modulo: "Agendas", accion: "ver", permitido: true },
];

const permisosSinAgendas: Permiso[] = [
  { modulo: "Gestión", accion: "ver", permitido: true },
  { modulo: "Apoyos", accion: "ver", permitido: true },
  { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
];

// ─── Tests ───
describe("Permisos jerárquicos Gestión", () => {
  describe("Administrador - acceso total", () => {
    it("puede ver módulo Gestión (navegación)", () => {
      expect(moduloVisible(permisosAdmin, "Gestión")).toBe(true);
    });

    it("puede ver Agendas", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "ver")).toBe(true);
    });

    it("puede crear Agenda", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "crear")).toBe(true);
    });

    it("puede editar Agenda", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "editar")).toBe(true);
    });

    it("puede eliminar Agenda", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "eliminar")).toBe(true);
    });

    it("puede exportar Agenda", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "exportar")).toBe(true);
    });

    it("puede administrar Agenda", () => {
      expect(hasPermiso(permisosAdmin, "Agendas", "administrar")).toBe(true);
    });

    it("puede ver Apoyos", () => {
      expect(hasPermiso(permisosAdmin, "Apoyos", "ver")).toBe(true);
    });

    it("puede crear Apoyo", () => {
      expect(hasPermiso(permisosAdmin, "Apoyos", "crear")).toBe(true);
    });

    it("puede cerrar Apoyo", () => {
      expect(hasPermiso(permisosAdmin, "Apoyos", "cerrar")).toBe(true);
    });

    it("puede ver Quejas y Devoluciones", () => {
      expect(hasPermiso(permisosAdmin, "Quejas y Devoluciones", "ver")).toBe(true);
    });

    it("puede crear Queja/Devolución", () => {
      expect(hasPermiso(permisosAdmin, "Quejas y Devoluciones", "crear")).toBe(true);
    });

    it("puede eliminar Queja/Devolución", () => {
      expect(hasPermiso(permisosAdmin, "Quejas y Devoluciones", "eliminar")).toBe(true);
    });

    it("puede exportar Quejas y Devoluciones", () => {
      expect(hasPermiso(permisosAdmin, "Quejas y Devoluciones", "exportar")).toBe(true);
    });
  });

  describe("Usuario con solo VER Agendas", () => {
    it("puede ver Agendas", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "ver")).toBe(true);
    });

    it("NO puede crear Agenda", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "crear")).toBe(false);
    });

    it("NO puede editar Agenda", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "editar")).toBe(false);
    });

    it("NO puede eliminar Agenda", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "eliminar")).toBe(false);
    });

    it("NO puede exportar Agenda", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "exportar")).toBe(false);
    });

    it("NO puede administrar Agenda", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Agendas", "administrar")).toBe(false);
    });

    it("puede ver módulo Gestión (navegación)", () => {
      expect(moduloVisible(permisosSoloVerAgendas, "Gestión")).toBe(true);
    });
  });

  describe("Usuario sin permisos de Agendas", () => {
    it("NO puede ver Agendas", () => {
      expect(hasPermiso(permisosSinAgendas, "Agendas", "ver")).toBe(false);
    });

    it("NO puede crear Agenda", () => {
      expect(hasPermiso(permisosSinAgendas, "Agendas", "crear")).toBe(false);
    });

    it("puede ver módulo Gestión (tiene Apoyos y QyD)", () => {
      expect(moduloVisible(permisosSinAgendas, "Gestión")).toBe(true);
    });

    it("puede ver Apoyos", () => {
      expect(hasPermiso(permisosSinAgendas, "Apoyos", "ver")).toBe(true);
    });

    it("puede ver Quejas y Devoluciones", () => {
      expect(hasPermiso(permisosSinAgendas, "Quejas y Devoluciones", "ver")).toBe(true);
    });
  });

  describe("Independencia de permisos entre submódulos", () => {
    it("permisos de Agendas no afectan Apoyos", () => {
      expect(hasPermiso(permisosSoloVerAgendas, "Apoyos", "ver")).toBe(false);
      expect(hasPermiso(permisosSoloVerAgendas, "Apoyos", "crear")).toBe(false);
    });

    it("permisos de Apoyos no afectan Quejas y Devoluciones", () => {
      expect(hasPermiso(permisosSinAgendas, "Quejas y Devoluciones", "crear")).toBe(false);
    });

    it("permisos de Quejas y Devoluciones son independientes", () => {
      const permisosQyD: Permiso[] = [
        { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
        { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
      ];
      expect(hasPermiso(permisosQyD, "Agendas", "ver")).toBe(false);
      expect(hasPermiso(permisosQyD, "Apoyos", "ver")).toBe(false);
    });
  });

  describe("Normalización de strings", () => {
    it("Gestión = gestion (case-insensitive, accent-insensitive)", () => {
      expect(hasPermiso(permisosAdmin, "gestion", "ver")).toBe(true);
      expect(hasPermiso(permisosAdmin, "GESTIÓN", "ver")).toBe(true);
    });

    it("Agendas = agendas (case-insensitive, accent-insensitive)", () => {
      expect(hasPermiso(permisosAdmin, "agendas", "ver")).toBe(true);
    });

    it("Quejas y Devoluciones = quejas y devoluciones", () => {
      expect(hasPermiso(permisosAdmin, "quejas y devoluciones", "ver")).toBe(true);
    });
  });

  describe("Acciones CRUD independientes", () => {
    const permisosCrearSinEditar: Permiso[] = [
      { modulo: "Gestión", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "crear", permitido: true },
    ];

    it("puede crear pero NO editar", () => {
      expect(hasPermiso(permisosCrearSinEditar, "Agendas", "crear")).toBe(true);
      expect(hasPermiso(permisosCrearSinEditar, "Agendas", "editar")).toBe(false);
    });

    const permisosEditarSinCrear: Permiso[] = [
      { modulo: "Gestión", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "editar", permitido: true },
    ];

    it("puede editar pero NO crear", () => {
      expect(hasPermiso(permisosEditarSinCrear, "Agendas", "editar")).toBe(true);
      expect(hasPermiso(permisosEditarSinCrear, "Agendas", "crear")).toBe(false);
    });

    const permisosExportSinDelete: Permiso[] = [
      { modulo: "Gestión", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "exportar", permitido: true },
    ];

    it("puede exportar pero NO eliminar", () => {
      expect(hasPermiso(permisosExportSinDelete, "Agendas", "exportar")).toBe(true);
      expect(hasPermiso(permisosExportSinDelete, "Agendas", "eliminar")).toBe(false);
    });
  });

  describe("Sin permisos de Gestión", () => {
    const sinGestion: Permiso[] = [
      { modulo: "Dashboard", accion: "ver", permitido: true },
    ];

    it("no puede ver módulo Gestión", () => {
      expect(moduloVisible(sinGestion, "Gestión")).toBe(false);
    });

    it("no puede ver Agendas", () => {
      expect(hasPermiso(sinGestion, "Agendas", "ver")).toBe(false);
    });
  });

  describe("Gestión es módulo raíz independiente de Control de Facturación", () => {
    const permisosSinFacturacion: Permiso[] = [
      { modulo: "Gestión", accion: "ver", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "editar", permitido: true },
      { modulo: "Apoyos", accion: "ver", permitido: true },
      { modulo: "Apoyos", accion: "crear", permitido: true },
      { modulo: "Agendas", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "crear", permitido: true },
      { modulo: "Agendas", accion: "editar", permitido: true },
    ];

    it("puede ver Gestión sin tener Control de Facturación", () => {
      expect(hasPermiso(permisosSinFacturacion, "Control de Facturación", "ver")).toBe(false);
      expect(moduloVisible(permisosSinFacturacion, "Gestión")).toBe(true);
    });

    it("puede acceder a QyD sin Control de Facturación", () => {
      expect(hasPermiso(permisosSinFacturacion, "Quejas y Devoluciones", "ver")).toBe(true);
    });

    it("puede acceder a Apoyos sin Control de Facturación", () => {
      expect(hasPermiso(permisosSinFacturacion, "Apoyos", "ver")).toBe(true);
    });

    it("puede acceder a Agendas sin Control de Facturación", () => {
      expect(hasPermiso(permisosSinFacturacion, "Agendas", "ver")).toBe(true);
    });

    it("Gestión y Control de Facturación son independientes", () => {
      const soloFacturacion: Permiso[] = [
        { modulo: "Control de Facturación", accion: "ver", permitido: true },
      ];
      expect(moduloVisible(soloFacturacion, "Gestión")).toBe(false);
      expect(moduloVisible(permisosSinFacturacion, "Control de Facturación")).toBe(false);
    });
  });

  describe("Caso Asesor — escenario crítico", () => {
    const permisosAsesor: Permiso[] = [
      // Gestión (navegación) — REQUERIDO para que Gestión aparezca
      { modulo: "Gestión", accion: "ver", permitido: true },
      // QyD
      { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "crear", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "editar", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "administrar", permitido: true },
      // Apoyos
      { modulo: "Apoyos", accion: "ver", permitido: true },
      { modulo: "Apoyos", accion: "crear", permitido: true },
      { modulo: "Apoyos", accion: "editar", permitido: true },
      { modulo: "Apoyos", accion: "administrar", permitido: true },
      // Agendas
      { modulo: "Agendas", accion: "ver", permitido: true },
      { modulo: "Agendas", accion: "crear", permitido: true },
      { modulo: "Agendas", accion: "editar", permitido: true },
      { modulo: "Agendas", accion: "administrar", permitido: true },
      // SIN Control de Facturación
    ];

    it("Gestión es visible", () => {
      expect(moduloVisible(permisosAsesor, "Gestión")).toBe(true);
    });

    it("Control de Facturación NO es visible", () => {
      expect(moduloVisible(permisosAsesor, "Control de Facturación")).toBe(false);
    });

    it("QyD es visible", () => {
      expect(hasPermiso(permisosAsesor, "Quejas y Devoluciones", "ver")).toBe(true);
    });

    it("Apoyos es visible", () => {
      expect(hasPermiso(permisosAsesor, "Apoyos", "ver")).toBe(true);
    });

    it("Agendas es visible", () => {
      expect(hasPermiso(permisosAsesor, "Agendas", "ver")).toBe(true);
    });

    it("Acceso a crear en QyD", () => {
      expect(hasPermiso(permisosAsesor, "Quejas y Devoluciones", "crear")).toBe(true);
    });

    it("NO puede eliminar en QyD", () => {
      expect(hasPermiso(permisosAsesor, "Quejas y Devoluciones", "eliminar")).toBe(false);
    });

    it("NO puede exportar en Agendas", () => {
      expect(hasPermiso(permisosAsesor, "Agendas", "exportar")).toBe(false);
    });
  });

  describe("Caso Consulta — solo ver y exportar QyD", () => {
    const permisosConsulta: Permiso[] = [
      { modulo: "Gestión", accion: "ver", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "ver", permitido: true },
      { modulo: "Quejas y Devoluciones", accion: "exportar", permitido: true },
    ];

    it("Gestión es visible", () => {
      expect(moduloVisible(permisosConsulta, "Gestión")).toBe(true);
    });

    it("QyD es visible", () => {
      expect(hasPermiso(permisosConsulta, "Quejas y Devoluciones", "ver")).toBe(true);
    });

    it("Apoyos NO es visible", () => {
      expect(hasPermiso(permisosConsulta, "Apoyos", "ver")).toBe(false);
    });

    it("Agendas NO es visible", () => {
      expect(hasPermiso(permisosConsulta, "Agendas", "ver")).toBe(false);
    });

    it("NO puede crear en QyD", () => {
      expect(hasPermiso(permisosConsulta, "Quejas y Devoluciones", "crear")).toBe(false);
    });

    it("Puede exportar QyD", () => {
      expect(hasPermiso(permisosConsulta, "Quejas y Devoluciones", "exportar")).toBe(true);
    });
  });
});
