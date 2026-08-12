import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { Mail, Phone, AlertCircle, User, Settings } from "lucide-react";
import { Button, Badge, Card, CardHeader, CardBody, CardFooter } from "@/components/ui";
import { Input, Textarea, Select, Checkbox, Switch, SearchInput } from "@/components/ui";
import { KpiCard } from "@/components/ui";
import { colors } from "@/theme";

const SECTIONS = [
  { id: "colores", label: "Colores" },
  { id: "tipografia", label: "Tipografía" },
  { id: "botones", label: "Botones" },
  { id: "badges", label: "Badges" },
  { id: "inputs", label: "Inputs" },
  { id: "cards", label: "Cards" },
  { id: "kpi", label: "KPI Cards" },
  { id: "tabla", label: "Tabla" },
];

const MOCK_TABLE_DATA = [
  { id: "1", cliente: "Carlos Mendoza", canal: "WhatsApp", estado: "En curso", sla: 98, prioridad: "Alta" },
  { id: "2", cliente: "María López", canal: "Correo", estado: "Pendiente", sla: 72, prioridad: "Media" },
  { id: "3", cliente: "Andrea García", canal: "WhatsApp", estado: "Resuelto", sla: 100, prioridad: "Baja" },
  { id: "4", cliente: "Pedro Sánchez", canal: "Correo", estado: "En curso", sla: 85, prioridad: "Alta" },
  { id: "5", cliente: "Lucía Fernández", canal: "WhatsApp", estado: "Pendiente", sla: 45, prioridad: "Crítica" },
];

export default function DesignSystem() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mx-auto max-w-6xl space-y-16 p-8"
    >
      <header className="border-b border-black-10 pb-8">
        <h1 className="text-3xl font-bold text-black-85">COPE Design System</h1>
        <p className="mt-2 text-black-45">
          Centro de Operaciones de Soporte Especializado &mdash; Guía de Estilos
        </p>
        <nav className="mt-6 flex flex-wrap gap-2">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              className="rounded-lg border border-black-10 px-3 py-1.5 text-xs font-medium text-black-45 transition-colors hover:border-[#2563EB] hover:text-primary"
            >
              {s.label}
            </a>
          ))}
        </nav>
      </header>

      {/* ────────── COLORES ────────── */}
      <section id="colores">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Colores</h2>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Object.entries(colors).map(([name, hex]) => (
            <div key={name} className="rounded-xl border border-black-10 p-3 text-center">
              <div
                className="mx-auto mb-2 h-16 w-full rounded-lg"
                style={{ backgroundColor: hex }}
              />
              <p className="text-xs font-medium text-black-85">{name}</p>
              <p className="text-[10px] text-black-25">{hex}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ────────── TIPOGRAFÍA ────────── */}
      <section id="tipografia">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Tipografía</h2>
        <div className="space-y-4 rounded-xl border border-black-10 bg-white p-6">
          <p className="text-3xl font-bold">Inter Bold 700 — Título principal</p>
          <p className="text-xl font-semibold">Inter Semibold 600 — Subtítulo</p>
          <p className="text-base font-medium">Inter Medium 500 — Cuerpo destacado</p>
          <p className="text-sm font-normal">Inter Regular 400 — Cuerpo de texto normal</p>
          <p className="text-xs text-black-45">Inter 400 — Texto secundario / metadata</p>
          <p className="text-[10px] text-black-25">Inter 400 — Texto terciario / etiquetas</p>
        </div>
      </section>

      {/* ────────── BOTONES ────────── */}
      <section id="botones">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Botones</h2>
        <div className="space-y-6 rounded-xl border border-black-10 bg-white p-6">
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-black-45">Variantes</p>
            <div className="flex flex-wrap gap-3">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
              <Button variant="success">Success</Button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-black-45">Tamaños</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase text-black-45">Estados</p>
            <div className="flex flex-wrap gap-3">
              <Button disabled>Disabled</Button>
              <Button loading>Loading</Button>
            </div>
          </div>
        </div>
      </section>

      {/* ────────── BADGES ────────── */}
      <section id="badges">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Badges</h2>
        <div className="rounded-xl border border-black-10 bg-white p-6">
          <div className="flex flex-wrap gap-2">
            <Badge variant="whatsapp">WhatsApp</Badge>
            <Badge variant="correo">Correo</Badge>
            <Badge variant="meta">Meta</Badge>
            <Badge variant="zendesk">Zendesk</Badge>
            <Badge variant="highTouch">High Touch</Badge>
            <Badge variant="lowTouch">Low Touch</Badge>
            <Badge variant="techTouch">Tech Touch</Badge>
            <Badge variant="sla">SLA</Badge>
            <Badge variant="vencido">Vencido</Badge>
            <Badge variant="nuevo">Nuevo</Badge>
            <Badge variant="pendiente">Pendiente</Badge>
            <Badge variant="resuelto">Resuelto</Badge>
            <Badge variant="enProceso">En Proceso</Badge>
          </div>
        </div>
      </section>

      {/* ────────── INPUTS ────────── */}
      <section id="inputs">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Inputs</h2>
        <div className="space-y-6 rounded-xl border border-black-10 bg-white p-6">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black-45">Input</p>
              <Input placeholder="Escribe algo..." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black-45">Input con error</p>
              <Input placeholder="Correo electrónico" error="Ingrese un correo válido" />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black-45">Select</p>
              <Select options={[{ value: "1", label: "Opción 1" }, { value: "2", label: "Opción 2" }]} placeholder="Seleccione..." />
            </div>
            <div className="space-y-2">
              <p className="text-xs font-semibold text-black-45">Search</p>
              <SearchInput placeholder="Buscar..." />
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold text-black-45">Textarea</p>
            <Textarea placeholder="Escriba un mensaje..." />
          </div>
          <div className="flex flex-wrap items-center gap-6">
            <Checkbox label="Acepto términos" checked={true} onChange={() => {}} />
            <Checkbox label="Opción deshabilitada" checked={false} onChange={() => {}} />
            <div className="flex items-center gap-2">
              <span className="text-xs text-black-45">Switch</span>
              <Switch checked={true} onChange={() => {}} />
            </div>
          </div>
        </div>
      </section>

      {/* ────────── CARDS ────────── */}
      <section id="cards">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Cards</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <Card>
            <CardHeader title="Título de Card" subtitle="Subtítulo descriptivo" icon={<Mail size={18} />} />
            <CardBody>
              <p className="text-sm text-black-45">
                Contenido del cuerpo de la card. Puede contener cualquier elemento.
              </p>
            </CardBody>
            <CardFooter>
              <Button size="sm" variant="ghost">Acción</Button>
            </CardFooter>
          </Card>

          <Card hover>
            <CardHeader title="Card con hover" subtitle="Pasa el mouse" icon={<Phone size={18} />} action={<Badge variant="nuevo">Nuevo</Badge>} />
            <CardBody>
              <p className="text-sm text-black-45">Esta card tiene efecto hover y un badge de acción.</p>
            </CardBody>
          </Card>
        </div>
      </section>

      {/* ────────── KPI ────────── */}
      <section id="kpi">
        <h2 className="mb-6 text-xl font-semibold text-black-85">KPI Cards</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <KpiCard icon={<Mail size={20} />} value="1,234" label="Atenciones Hoy" trend={{ value: 12, goodUp: true }} />
          <KpiCard icon={<AlertCircle size={20} />} value="47" label="Pendientes" trend={{ value: -8, goodUp: true }} />
          <KpiCard icon={<User size={20} />} value="94.2%" label="SLA Global" trend={{ value: 2, goodUp: true }} />
          <KpiCard icon={<Settings size={20} />} value="8" label="Alertas Activas" subtext="3 de alta prioridad" trend={{ value: 15, goodUp: false }} />
        </div>
      </section>

      {/* ────────── TABLA ────────── */}
      <section id="tabla">
        <h2 className="mb-6 text-xl font-semibold text-black-85">Tabla de Datos</h2>
        <Card>
          <CardBody>
            <p className="mb-4 text-sm text-black-45">
              DataTable con búsqueda, ordenamiento, paginación, filas seleccionables y expandibles.
            </p>
            {/* Inline DataTable example using basic JSX to avoid complex generics */}
            <div className="overflow-x-auto rounded-xl border border-black-10">
              <table className="w-full text-sm">
                <thead className="bg-light">
                  <tr className="text-left text-xs font-semibold uppercase tracking-wider text-black-45">
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Canal</th>
                    <th className="px-3 py-3">Estado</th>
                    <th className="px-3 py-3 text-right">SLA</th>
                    <th className="px-3 py-3">Prioridad</th>
                  </tr>
                </thead>
                <tbody>
                  {MOCK_TABLE_DATA.map((row, i) => (
                    <tr key={row.id} className={cn("border-t border-black-5", i % 2 === 1 && "bg-light")}>
                      <td className="px-3 py-2.5 font-medium text-black-85">{row.cliente}</td>
                      <td className="px-3 py-2.5">
                        <Badge variant={row.canal === "WhatsApp" ? "whatsapp" : "correo"}>{row.canal}</Badge>
                      </td>
                      <td className="px-3 py-2.5">
                        <Badge variant={row.estado === "Resuelto" ? "resuelto" : row.estado === "Pendiente" ? "pendiente" : "enProceso"}>
                          {row.estado}
                        </Badge>
                      </td>
                      <td className="px-3 py-2.5 text-right font-medium text-black-85">{row.sla}%</td>
                      <td className="px-3 py-2.5">
                        <Badge
                          variant={row.prioridad === "Crítica" ? "vencido" : row.prioridad === "Alta" ? "highTouch" : row.prioridad === "Media" ? "sla" : "lowTouch"}
                        >
                          {row.prioridad}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </section>
    </motion.div>
  );
}

