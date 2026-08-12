export interface SearchResult {
  id: string;
  tipo: "CLIENTES" | "DOMINIOS" | "ATENCIONES" | "DEV" | "DOCUMENTOS" | "NOTEBOOKS" | "CONFIGURACIONES";
  icon: string;
  nombre: string;
  descripcion: string;
  ultimaActualizacion: string;
  accion: string;
}

export const MOCK_RESULTADOS: SearchResult[] = [
  { id: "c1", tipo: "CLIENTES", icon: "👤", nombre: "Carlos Mendoza", descripcion: "carlos.m@email.com · High Touch · Perú", ultimaActualizacion: "10:32", accion: "Abrir Cliente" },
  { id: "c2", tipo: "CLIENTES", icon: "👤", nombre: "María López", descripcion: "maria.l@empresa.com · High Touch · Chile", ultimaActualizacion: "10:15", accion: "Abrir Cliente" },
  { id: "c3", tipo: "CLIENTES", icon: "👤", nombre: "Andrea García", descripcion: "andrea.g@outlook.com · Low Touch · Perú", ultimaActualizacion: "09:58", accion: "Abrir Cliente" },
  { id: "d1", tipo: "DOMINIOS", icon: "🌐", nombre: "carlos.mendoza@email.com", descripcion: "Cliente: Carlos Mendoza · Producto: Restaurant Web", ultimaActualizacion: "10:32", accion: "Copiar Dominio" },
  { id: "d2", tipo: "DOMINIOS", icon: "🌐", nombre: "maria.l@empresa.com", descripcion: "Cliente: María López · Producto: Blue Android", ultimaActualizacion: "10:15", accion: "Copiar Dominio" },
  { id: "t1", tipo: "ATENCIONES", icon: "🎫", nombre: "T-2024-0891", descripcion: "Carlos Mendoza · Facturación · SLA rojo", ultimaActualizacion: "10:32", accion: "Abrir Ticket" },
  { id: "t2", tipo: "ATENCIONES", icon: "🎫", nombre: "T-2024-0890", descripcion: "María López · Contratos · SLA amarillo", ultimaActualizacion: "10:15", accion: "Abrir Ticket" },
  { id: "t3", tipo: "ATENCIONES", icon: "🎫", nombre: "T-2024-0889", descripcion: "Andrea García · Reclamos · SLA amarillo", ultimaActualizacion: "09:58", accion: "Abrir Ticket" },
  { id: "dev1", tipo: "DEV", icon: "🐛", nombre: "DEV-2024-0891", descripcion: "Error en cálculo de IGV · Alta · Jorge Castillo", ultimaActualizacion: "2 días", accion: "Abrir DEV" },
  { id: "dev2", tipo: "DEV", icon: "🐛", nombre: "DEV-2024-0876", descripcion: "No genera XML de factura · Media · María López", ultimaActualizacion: "5 días", accion: "Abrir DEV" },
  { id: "dev3", tipo: "DEV", icon: "🐛", nombre: "DEV-2024-0842", descripcion: "Fallo en sincronización de stock · Baja", ultimaActualizacion: "12 días", accion: "Abrir DEV" },
  { id: "doc1", tipo: "DOCUMENTOS", icon: "📄", nombre: "Factura_202507.png", descripcion: "Cliente: Carlos Mendoza · 245 KB", ultimaActualizacion: "10/07", accion: "Abrir Documento" },
  { id: "doc2", tipo: "DOCUMENTOS", icon: "📄", nombre: "sistema_fe_log_20250710.txt", descripcion: "Log de facturación · 12 KB", ultimaActualizacion: "10/07", accion: "Abrir Documento" },
  { id: "nb1", tipo: "NOTEBOOKS", icon: "📘", nombre: "Guía FE — Errores comunes", descripcion: "Documentación de Facturación Electrónica", ultimaActualizacion: "Actualizado", accion: "Abrir NotebookLM" },
  { id: "nb2", tipo: "NOTEBOOKS", icon: "📘", nombre: "Manual COPE v3.2", descripcion: "Guía de usuario del sistema COPE", ultimaActualizacion: "Actualizado", accion: "Abrir NotebookLM" },
  { id: "conf1", tipo: "CONFIGURACIONES", icon: "⚙️", nombre: "Facturación Electrónica", descripcion: "Configuración de FE · Cliente: Carlos Mendoza", ultimaActualizacion: "—", accion: "Abrir Configuración" },
  { id: "conf2", tipo: "CONFIGURACIONES", icon: "⚙️", nombre: "Notificación SMS", descripcion: "Configuración de SMS · Cliente: Carlos Mendoza", ultimaActualizacion: "—", accion: "Abrir Configuración" },
];

export const MOCK_RECIENTES: SearchResult[] = [
  MOCK_RESULTADOS[0], MOCK_RESULTADOS[3], MOCK_RESULTADOS[6], MOCK_RESULTADOS[9],
];

export const MOCK_FAVORITOS: SearchResult[] = [
  MOCK_RESULTADOS[0], MOCK_RESULTADOS[6], MOCK_RESULTADOS[12],
];

export const GRUPOS = ["CLIENTES", "DOMINIOS", "ATENCIONES", "DEV", "DOCUMENTOS", "NOTEBOOKS", "CONFIGURACIONES"] as const;
