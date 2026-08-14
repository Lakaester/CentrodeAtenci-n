import { SeccionNoConfigurada } from "./SeccionNoConfigurada";

const PLACEHOLDERS: Record<string, { titulo: string; descripcion: string }> = {
  preferencias: {
    titulo: "Preferencias",
    descripcion: "Preferencias generales de COPE se administrarán aquí en una futura etapa.",
  },
  atencion: {
    titulo: "Configuración de Atención",
    descripcion: "Canales, colas, estados y parámetros operativos de Atención se centralizarán aquí. Actualmente COPE no dispone de un catálogo administrable para esta sección.",
  },
  reporteria: {
    titulo: "Configuración de Reportería",
    descripcion: "SLA, metas y umbrales de los reportes se centralizarán aquí sin modificar las reglas actuales.",
  },
  conocimiento: {
    titulo: "Configuración de Conocimiento",
    descripcion: "Categorías y parámetros de guías se administrarán aquí en una futura etapa.",
  },
  notificaciones: {
    titulo: "Configuración de Notificaciones",
    descripcion: "Alertas y preferencias de notificación se administrarán aquí en una futura etapa.",
  },
  auditoria: {
    titulo: "Auditoría",
    descripcion: "Registro de cambios por usuario y módulo. COPE aún no dispone de un sistema de auditoría; no se fabrican registros.",
  },
};

export default function ConfigPlaceholder({ section }: { section: keyof typeof PLACEHOLDERS | string }) {
  const cfg = PLACEHOLDERS[section] ?? { titulo: "Sección de configuración", descripcion: "Esta sección aún no está configurada." };
  return <SeccionNoConfigurada titulo={cfg.titulo} descripcion={cfg.descripcion} />;
}
