/**
 * Componente temporal de FASE 1: cada dashboard muestra su nombre y
 * un aviso de "en construcción". Se reemplazará por el dashboard real
 * en las FASES 4-5.
 */
import { motion } from "framer-motion";

export function PagePlaceholder({ title, phase }: { title: string; phase: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
    >
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-1 text-sm text-muted">Dashboard del área de Soporte Especializado.</p>
      <div className="mt-6 rounded-xl border border-dashed border-border bg-surface p-10 text-center">
        <p className="text-muted">Este módulo se construye en la <span className="text-primary font-medium">{phase}</span>.</p>
        <p className="mt-1 text-xs text-muted">La estructura ya está lista; aquí entrarán KPIs, gráficos y tablas.</p>
      </div>
    </motion.div>
  );
}
