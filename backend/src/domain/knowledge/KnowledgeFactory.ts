/** @deprecated Usar la implementaci�n en src/core/ en su lugar. Este archivo se eliminar� en M2. */
import { KnowledgeArticle, type KnowledgeArticleData, type NivelConocimiento } from "./KnowledgeArticle";
import { KnowledgeSource, type KnowledgeSourceData } from "./KnowledgeSource";
import { KnowledgeCategory, type KnowledgeCategoryData } from "./KnowledgeCategory";
import { KnowledgeSearch } from "./KnowledgeSearch";

export class KnowledgeFactory {
  static crearArticulo(data: KnowledgeArticleData): KnowledgeArticle {
    return new KnowledgeArticle(data);
  }

  static crearFuente(data: KnowledgeSourceData): KnowledgeSource {
    return new KnowledgeSource(data);
  }

  static crearCategoria(data: KnowledgeCategoryData): KnowledgeCategory {
    return new KnowledgeCategory(data);
  }

  static crearBuscador(articulos?: KnowledgeArticle[]): KnowledgeSearch {
    return new KnowledgeSearch(articulos);
  }

  static crearFuentesPorDefecto(): KnowledgeSource[] {
    return ([
      { id: "src_notebooklm", tipo: "notebooklm" as const, nombre: "NotebookLM", descripcion: "Documentación y guías en NotebookLM", prioridad: 1 },
      { id: "src_manual", tipo: "manual_pdf" as const, nombre: "Manual COPE", descripcion: "Manual de usuario del sistema COPE", prioridad: 2 },
      { id: "src_procedimiento", tipo: "procedimiento" as const, nombre: "Procedimientos", descripcion: "Procedimientos operativos estándar", prioridad: 3 },
      { id: "src_faq", tipo: "faq" as const, nombre: "Preguntas Frecuentes", descripcion: "FAQ del sistema", prioridad: 4 },
      { id: "src_casos", tipo: "caso_resuelto" as const, nombre: "Casos Resueltos", descripcion: "Historial de casos resueltos similares", prioridad: 5 },
      { id: "src_errores", tipo: "error_conocido" as const, nombre: "Errores Conocidos", descripcion: "Base de errores conocidos y soluciones", prioridad: 6 },
      { id: "src_docs", tipo: "documentacion_tecnica" as const, nombre: "Documentación Técnica", descripcion: "Documentación técnica del producto", prioridad: 7 },
      { id: "src_wiki", tipo: "wiki" as const, nombre: "Wiki Interna", descripcion: "Wiki de conocimiento interno", prioridad: 8 },
      { id: "src_macro", tipo: "macro" as const, nombre: "Macros", descripcion: "Macros y automatizaciones disponibles", prioridad: 9 },
    ] as KnowledgeSourceData[]).map((s) => new KnowledgeSource(s));
  }

  static crearCategoriasPorDefecto(): KnowledgeCategory[] {
    return [
      { id: "cat_fe", nombre: "Facturación Electrónica", descripcion: "Problemas de facturación, CDT y SUNAT", icono: "FileText" },
      { id: "cat_log", nombre: "Logística", descripcion: "Inventarios, sincronización y pedidos", icono: "Truck" },
      { id: "cat_int", nombre: "Integraciones", descripcion: "Conexión con plataformas externas", icono: "Grid3X3" },
      { id: "cat_sw", nombre: "Software", descripcion: "Versiones, configuraciones y bugs", icono: "Cpu" },
      { id: "cat_cap", nombre: "Capacitación", descripcion: "Cursos, manuales y material de aprendizaje", icono: "GraduationCap" },
      { id: "cat_adm", nombre: "Administrativo", descripcion: "Pagos, contratos y facturación", icono: "Building2" },
    ].map((c) => new KnowledgeCategory(c));
  }

  static crearArticulosMock(): KnowledgeArticle[] {
    const data: KnowledgeArticleData[] = [
      {
        id: "art_001", titulo: "Resolución de errores de CDT", descripcion: "Guía paso a paso para resolver errores de CDT en facturación electrónica",
        categoria: "Facturación Electrónica", tags: ["CDT", "FE", "error"], palabrasClave: ["CDT", "vencimiento", "renovación"],
        nivel: "intermedio", autor: "Ana Torres", fecha: "2025-01-15", ultimaActualizacion: "2025-06-20",
        fuente: "notebooklm", url: "/knowledge/art_001", tiempoLectura: "5 min",
        productos: ["Restaurant Web", "Blue Android"], paises: ["Perú"],
        contenido: "Para resolver errores de CDT, primero verifique el estado actual...",
      },
      {
        id: "art_002", titulo: "Solución de problemas de conexión con Uber Eats", descripcion: "Pasos para diagnosticar y resolver errores de conexión con Uber Eats",
        categoria: "Integraciones", tags: ["Uber", "integración", "conexión"], palabrasClave: ["Uber Eats", "timeout", "token"],
        nivel: "avanzado", autor: "Carlos Ruiz", fecha: "2025-02-10", ultimaActualizacion: "2025-07-01",
        fuente: "error_conocido", url: "/knowledge/art_002", tiempoLectura: "8 min",
        productos: ["Restaurant Web"], paises: ["Perú", "Chile"],
        contenido: "El error de conexión con Uber Eats generalmente es causado por...",
      },
      {
        id: "art_003", titulo: "Verificación de inventarios en Logística", descripcion: "Procedimiento para verificar y conciliar inventarios",
        categoria: "Logística", tags: ["inventario", "logística", "sincronización"], palabrasClave: ["inventario", "stock", "productos"],
        nivel: "principiante", autor: "María López", fecha: "2025-03-01", ultimaActualizacion: "2025-06-15",
        fuente: "procedimiento", url: "/knowledge/art_003", tiempoLectura: "3 min",
        productos: ["Blue Android"], paises: ["Perú"],
        contenido: "Para verificar inventarios, acceda al módulo de Logística...",
      },
    ];
    return data.map((d) => new KnowledgeArticle(d));
  }
}

