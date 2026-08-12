import { useState } from "react";
import {
  User, Building2, Globe, Clock,
  Package, CreditCard, History, AlertTriangle,
  Brain, Zap, Link, ExternalLink, Plus,
} from "lucide-react";
import type { CustomerInfo } from "@/hooks/useTicketDetail";

interface Props {
  customer: CustomerInfo | null;
  loading: boolean;
}

function InfoND() {
  return <span className="text-black-10 italic">—</span>;
}

function CustomerSkeleton() {
  return (
    <div className="animate-pulse space-y-3 p-4">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-full bg-black-10" />
        <div className="space-y-1.5">
          <div className="h-3 w-28 rounded bg-black-10" />
          <div className="h-2.5 w-20 rounded bg-black-10" />
        </div>
      </div>
      {Array.from({ length: 6 }).map((_, i) => (
        <div key={i} className="rounded-lg border border-black-10 p-3">
          <div className="mb-2 h-2.5 w-20 rounded bg-black-10" />
          <div className="space-y-1.5">
            {Array.from({ length: 3 }).map((_, j) => (
              <div key={j} className="flex items-center justify-between">
                <div className="h-2 w-12 rounded bg-black-10" />
                <div className="h-2 w-20 rounded bg-black-10" />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function SectionCard({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-black-10 bg-white mx-3 mb-2">
      <div className="flex items-center gap-1.5 border-b border-black-10 px-3 py-1.5">
        {icon}
        <span className="text-[10px] font-semibold uppercase tracking-wider text-black-45">{title}</span>
      </div>
      <div className="p-3 space-y-1.5">{children}</div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between py-0.5 text-[11px]">
      <span className="text-black-25">{label}</span>
      <span className="max-w-[55%] truncate text-right font-medium text-black-85">
        {children}
      </span>
    </div>
  );
}

export function Customer360Panel({ customer, loading }: Props) {
  const [dominioVinculado, setDominioVinculado] = useState(false);

  if (loading) return <CustomerSkeleton />;

  if (!customer) {
    return (
      <div className="flex h-full items-center justify-center px-4">
        <div className="text-center">
          <User size={24} className="mx-auto text-black-10" />
          <p className="mt-2 text-xs text-black-25">Seleccione un ticket para ver el cliente</p>
        </div>
      </div>
    );
  }

  const tiempoCliente = customer.fechaCreacion
    ? (() => {
        const dias = Math.floor(
          (Date.now() - new Date(customer.fechaCreacion).getTime()) / 86400000,
        );
        if (dias < 30) return `${dias} días`;
        const meses = Math.floor(dias / 30);
        return meses < 12 ? `${meses} meses` : `${Math.floor(meses / 12)} años`;
      })()
    : null;

  return (
    <div className="space-y-2 pb-4">
      {/* Header */}
      <div className="border-b border-black-10 p-3">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary-10 text-sm font-bold text-primary">
            {customer.nombre.split(" ").map((s) => s[0]).join("").slice(0, 2).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-black-85">{customer.nombre}</p>
            {customer.empresa && (
              <p className="truncate text-[10px] text-black-45">{customer.empresa}</p>
            )}
          </div>
        </div>
      </div>

      {/* Cliente */}
      <SectionCard title="Cliente" icon={<User size={11} className="text-primary" />}>
        <Field label="Nombre">{customer.nombre}</Field>
        <Field label="Correo">{customer.correo || <InfoND />}</Field>
        <Field label="Teléfono">{customer.telefono ?? <InfoND />}</Field>
        <Field label="ID Cliente">#{customer.id}</Field>
        <Field label="País"><InfoND /></Field>
      </SectionCard>

      {/* Empresa */}
      <SectionCard title="Empresa" icon={<Building2 size={11} className="text-primary" />}>
        <Field label="Razón social">{customer.empresa ?? <InfoND />}</Field>
        <Field label="RUC"><InfoND /></Field>
        <Field label="Rubro"><InfoND /></Field>
        <Field label="Estado"><InfoND /></Field>
      </SectionCard>

      {/* Dominio Inteligente */}
      <SectionCard title="Dominio" icon={<Globe size={11} className="text-primary" />}>
        {dominioVinculado ? (
          <>
            <Field label="Dominio">midominio.com</Field>
            <Field label="Vinculado el">15/07/2026</Field>
            <Field label="Tipo">Principal</Field>
          </>
        ) : (
          <div className="space-y-2">
            <div className="flex items-center gap-1.5 rounded-md bg-warning-5 px-2 py-1.5">
              <AlertTriangle size={11} className="shrink-0 text-warning" />
              <span className="text-[10px] text-warning-65">Dominio no identificado</span>
            </div>
            <button
              type="button"
              onClick={() => setDominioVinculado(true)}
              className="inline-flex w-full items-center justify-center gap-1 rounded-md border border-black-10 bg-white px-2 py-1 text-[10px] font-medium text-primary hover:bg-black-5"
            >
              <Link size={11} />
              Vincular dominio
            </button>
          </div>
        )}
      </SectionCard>

      {/* Productos */}
      <SectionCard title="Productos" icon={<Package size={11} className="text-primary" />}>
        <Field label="Plan actual"><InfoND /></Field>
        <Field label="Productos contratados"><InfoND /></Field>
        <Field label="Addons"><InfoND /></Field>
        <Field label="Versión"><InfoND /></Field>
      </SectionCard>

      {/* Facturación */}
      <SectionCard title="Facturación" icon={<CreditCard size={11} className="text-primary" />}>
        <Field label="Método de pago"><InfoND /></Field>
        <Field label="Ciclo de fact."><InfoND /></Field>
        <Field label="Monto mensual"><InfoND /></Field>
        <Field label="Estado"><InfoND /></Field>
      </SectionCard>

      {/* Historial */}
      <SectionCard title="Historial" icon={<History size={11} className="text-primary" />}>
        <Field label="Tiempo como cliente">{tiempoCliente ?? <InfoND />}</Field>
        <Field label="Última atención">
          {customer.ultimaActividad
            ? new Date(customer.ultimaActividad).toLocaleDateString("es-PE", {
                day: "numeric", month: "short",
              })
            : <InfoND />}
        </Field>
        <Field label="Total tickets">{customer.totalTickets > 0 ? customer.totalTickets : <InfoND />}</Field>
        <Field label="Canal origen">Correo / Zendesk</Field>
      </SectionCard>

      {/* Incidencias */}
      <SectionCard title="Incidencias" icon={<AlertTriangle size={11} className="text-primary" />}>
        <Field label="Abiertas"><InfoND /></Field>
        <Field label="Pendientes"><InfoND /></Field>
        <Field label="Resueltas"><InfoND /></Field>
        <Field label="SLA cumplido"><InfoND /></Field>
      </SectionCard>

      {/* IA */}
      <SectionCard title="IA" icon={<Brain size={11} className="text-primary" />}>
        <Field label="Categoría sugerida"><InfoND /></Field>
        <Field label="Tono emocional"><InfoND /></Field>
        <Field label="Tiempo estimado"><InfoND /></Field>
        <Field label="Confianza"><InfoND /></Field>
      </SectionCard>

      {/* Acciones */}
      <SectionCard title="Acciones" icon={<Zap size={11} className="text-primary" />}>
        <div className="space-y-1">
          <button type="button" className="inline-flex w-full items-center gap-1.5 rounded-md border border-black-10 bg-white px-2 py-1 text-[10px] text-black-45 hover:bg-black-5">
            <ExternalLink size={11} /> Ver en Zendesk
          </button>
          <button type="button" className="inline-flex w-full items-center gap-1.5 rounded-md border border-black-10 bg-white px-2 py-1 text-[10px] text-black-45 hover:bg-black-5">
            <Clock size={11} /> Historial completo
          </button>
          <button type="button" className="inline-flex w-full items-center gap-1.5 rounded-md border border-black-10 bg-white px-2 py-1 text-[10px] text-black-45 hover:bg-black-5">
            <Plus size={11} /> Nueva nota interna
          </button>
        </div>
      </SectionCard>
    </div>
  );
}
