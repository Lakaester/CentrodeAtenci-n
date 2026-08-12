import { useState, useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { CopeSidebar } from "@/components/layout/CopeSidebar";
import { CopeHeader } from "@/components/layout/CopeHeader";
import { BuscadorUniversal } from "@/components/ui/BuscadorUniversal";

const ES_WORKSPACE = (path: string) => path === "/atenciones" || path.startsWith("/atenciones/");

export function CopeLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [buscadorOpen, setBuscadorOpen] = useState(false);
  const location = useLocation();
  const isWorkspace = ES_WORKSPACE(location.pathname);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setBuscadorOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <div className={`flex flex-col bg-light ${isWorkspace ? "h-screen overflow-hidden" : "min-h-screen"}`}>
      {/* Header */}
      <CopeHeader onMenuClick={() => setSidebarOpen(true)} isWorkspace={isWorkspace} />

      <div className="flex flex-1 min-h-0">
        {/* Sidebar */}
        <CopeSidebar mobileOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        {/* Main content */}
        <main className={`flex-1 min-w-0 ${isWorkspace ? "flex flex-col" : "p-4 flex flex-col"}`}>
          <div className={isWorkspace ? "flex-1 flex flex-col overflow-hidden" : "flex-1 bg-white rounded-lg overflow-hidden flex flex-col"}>
            {isWorkspace ? (
              <Outlet />
            ) : (
              <AnimatePresence mode="wait">
                <motion.div
                  key={location.pathname}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  transition={{ duration: 0.18, ease: "easeInOut" }}
                  className="flex flex-col flex-1"
                >
                  <Outlet />
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </main>
      </div>

      <BuscadorUniversal open={buscadorOpen} onClose={() => setBuscadorOpen(false)} />
    </div>
  );
}
