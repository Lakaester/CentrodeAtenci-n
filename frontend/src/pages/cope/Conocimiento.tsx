import { motion } from "framer-motion";
import { BookOpen } from "lucide-react";

export default function Conocimiento() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      className="p-8"
    >
      <div className="flex items-center gap-3">
        <BookOpen size={28} className="text-primary" />
        <h1 className="text-2xl font-semibold text-black-85">Conocimiento</h1>
      </div>
      <p className="mt-2 text-sm text-black-45">Base de conocimiento del centro de soporte.</p>
      <div className="mt-8 rounded-xl border border-dashed border-black-10 bg-white p-16 text-center">
        <p className="text-lg font-medium text-black-85">Próximamente</p>
        <p className="mt-2 text-sm text-black-45">Este módulo estará disponible en una próxima versión.</p>
      </div>
    </motion.div>
  );
}
