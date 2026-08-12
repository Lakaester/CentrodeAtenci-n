import { Shield, Wrench, Monitor, Users, Truck } from "lucide-react";

interface WorkspaceDef {
  id: string;
  nombre: string;
  icono: React.ReactNode;
  categorias: string[];
  render: () => React.ReactNode;
}

const PLACEHOLDER = (_nombre: string) => (
  <div className="grid grid-cols-2 gap-1">
    {["Widget 1", "Widget 2", "Widget 3", "Widget 4"].map((w) => (
      <div key={w} className="rounded border border-dashed border-black-10 px-2 py-2 text-center">
        <p className="text-[10px] text-black-25">{w}</p>
        <p className="text-[8px] text-black-10">Integración pendiente</p>
      </div>
    ))}
  </div>
);

const WORKSPACES: WorkspaceDef[] = [
  {
    id: "facturacion",
    nombre: "Facturación",
    icono: <Shield size={14} className="text-primary" />,
    categorias: ["facturación", "facturacion", "fe", "cdt", "comprobante"],
    render: () => (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-black-85">Diagnóstico FE</p>
        {PLACEHOLDER("Facturación")}
        <p className="text-[9px] text-black-25">CDT · SUNAT · Restafact · Dashboard FE</p>
      </div>
    ),
  },
  {
    id: "integraciones",
    nombre: "Integraciones",
    icono: <Monitor size={14} className="text-primary" />,
    categorias: ["integración", "integraciones", "pedidosya", "rappi", "uber"],
    render: () => (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-black-85">Monitor de integraciones</p>
        {PLACEHOLDER("Integraciones")}
        <p className="text-[9px] text-black-25">PedidosYa · Rappi · Uber · Didi</p>
      </div>
    ),
  },
  {
    id: "software",
    nombre: "Software",
    icono: <Wrench size={14} className="text-[#6366F1]" />,
    categorias: ["software", "versión", "actualización", "error sistema"],
    render: () => (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-black-85">Estado del software</p>
        {PLACEHOLDER("Software")}
        <p className="text-[9px] text-black-25">Versión · Configuración · Actualizaciones</p>
      </div>
    ),
  },
  {
    id: "administrativo",
    nombre: "Administrativo",
    icono: <Users size={14} className="text-success" />,
    categorias: ["administrativo", "contrato", "pago", "factura", "cobro"],
    render: () => (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-black-85">Gestión administrativa</p>
        {PLACEHOLDER("Administrativo")}
        <p className="text-[9px] text-black-25">Contratos · Pagos · LTV · Estado comercial</p>
      </div>
    ),
  },
  {
    id: "logistica",
    nombre: "Logística",
    icono: <Truck size={14} className="text-warning" />,
    categorias: ["logística", "logistica", "inventario", "entrega", "envío"],
    render: () => (
      <div className="space-y-2">
        <p className="text-[10px] font-medium text-black-85">Operaciones logísticas</p>
        {PLACEHOLDER("Logística")}
        <p className="text-[9px] text-black-25">Inventarios · Sincronización · Entregas</p>
      </div>
    ),
  },
];

export function WorkspaceFactory({ categoria }: { categoria: string | null | undefined }) {
  const ws = WORKSPACES.find(
    (w) => categoria && w.categorias.some((c) => categoria.toLowerCase().includes(c)),
  );

  if (!ws) return null;

  return (
    <div className="rounded-lg border border-black-10 bg-white p-2.5">
      <div className="flex items-center gap-1.5 mb-2">
        {ws.icono}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">{ws.nombre}</span>
      </div>
      {ws.render()}
    </div>
  );
}
