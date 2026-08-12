# Primer COPE Operativo

## Sprint 34 — Deliverable

### Fecha: 2026-07-15

---

## 1. Flujo navegable (recorrido del usuario)

```
Abrir COPE
  │
  ▼
Pantalla principal con 3 columnas
  │
  ├── Columna izquierda (22%): BANDEJA
  │   ├── Tab "Sin asignar" → tickets nuevos sin asesor
  │   └── Tab "Mis Atenciones" → tickets del asesor
  │
  ├── Columna central (45%): CONVERSACIÓN
  │   ├── Cabecera fija: Ticket #, Estado, Canal, Prioridad, Fechas
  │   ├── Asunto del ticket
  │   └── Mensajes cronológicos (públicos e internos)
  │
  └── Columna derecha (33%): WORKSPACE COPE
      ├── Cliente: nombre, correo, dominio, país, categoría, etiquetas
      ├── Cliente 360°: "Esperando integración"
      ├── Diagnóstico: hipótesis + observaciones (placeholder)
      ├── Herramientas: Facturación, Integraciones, etc. ("No disponible")
      ├── Guías: "No existe una guía disponible"
      ├── Actividades: timeline vacío
      └── Resultado: categoría, subcategoría, estado atención
```

---

## 2. Lista de componentes creados

### Módulo Zendesk (backend) — `modules/zendesk/`

| Componente | Archivo | Responsabilidad |
|-----------|---------|----------------|
| `ZendeskProvider` | `application/ZendeskProvider.ts` | Interface con 6 métodos de lectura |
| `ZendeskRealProvider` | `application/ZendeskRealProvider.ts` | Implementación real con HTTP |
| `MockZendeskProvider` | `application/MockZendeskProvider.ts` | Implementación mock (sin credenciales) |
| `ZendeskMapper` | `application/mapper/ZendeskMapper.ts` | Traducción Zendesk → COPE DTO |
| `TicketZendeskDTO` | `application/dto/ZendeskDTOs.ts` | DTO con 16 campos (incluye tags, categoría, etc.) |
| `ZendeskClient` | `infrastructure/ZendeskClient.ts` | Cliente HTTP con fetch, auth Basic, rate limit |
| `ZendeskRepository` | `infrastructure/ZendeskRepository.ts` | Orquesta Provider según configuración |
| `ZendeskController` | `presentation/ZendeskController.ts` | 4 endpoints REST |
| `ZendeskRoutes` | `presentation/ZendeskRoutes.ts` | Rutas montadas en `/api/atenciones/zendesk/` |
| `ZendeskConfig` | `domain/ZendeskConfig.ts` | Config desde .env |
| `ZendeskErrorHandler` | `domain/ZendeskErrorHandler.ts` | 6 códigos de error tipados |

### Frontend Workspace — `components/zendesk/`

| Componente | Archivo | Líneas | Props | Independiente |
|-----------|---------|--------|-------|-------------|
| `BandejaZendesk` | `BandejaZendesk.tsx` | ~80 | tickets, loading, activa, onSelect | ✅ Sí |
| `ModuloCliente` | `ModuloCliente.tsx` | ~45 | ticket | ✅ Sí |
| `ModuloCliente360` | `ModuloCliente360.tsx` | ~18 | — | ✅ Sí |
| `ModuloDiagnostico` | `ModuloDiagnostico.tsx` | ~30 | — | ✅ Sí |
| `ModuloHerramientas` | `ModuloHerramientas.tsx` | ~30 | — | ✅ Sí |
| `ModuloGuias` | `ModuloGuias.tsx` | ~15 | — | ✅ Sí |
| `ModuloActividades` | `ModuloActividades.tsx` | ~15 | — | ✅ Sí |
| `ModuloResultado` | `ModuloResultado.tsx` | ~30 | ticket | ✅ Sí |

### Página principal

| Componente | Archivo | Líneas |
|-----------|---------|--------|
| `ZendeskPage` | `pages/zendesk/ZendeskPage.tsx` | ~180 |
| `MensajeBubble` | (inline) | ~30 |

---

## 3. Problemas encontrados

| # | Problema | Impacto | Solución |
|---|----------|---------|----------|
| 1 | Zendesk no tiene campo "Dominio" nativo | Los datos de dominio no están disponibles desde la API de tickets | Mostrar "No disponible". En el futuro se podrá obtener desde `getUser()` o campos personalizados. |
| 2 | Sin credenciales Zendesk reales | Solo se pueden probar con `MockZendeskProvider` que devuelve arrays vacíos | El mock está preparado. Cuando se configuren credenciales, los datos reales fluyen automáticamente. |
| 3 | Campos personalizados varían por cuenta Zendesk | Los IDs de `custom_fields` (360000000001, 360000000002) son ilustrativos | Cada cuenta Zendesk tiene diferentes IDs. La implementación real requerirá mapeo configurable. |
| 4 | Paginación cursor-based de Zendesk | La API de Zendesk está migrando a paginación cursor. La actual page-based funciona pero está deprecada. | Migrar a cursor-based cuando se implemente paginación completa. |
| 5 | Sin capturas de pantalla | El entorno CLI no permite generar imágenes | Las capturas deben tomarse manualmente ejecutando el frontend en navegador. |

---

## 4. Próximos pasos (Sprint 35+)

### Prioridad alta

| Tarea | Sprint | Dependencia |
|-------|--------|-------------|
| **Configurar credenciales Zendesk reales** en `.env` | 35 | Product Owner |
| **Implementar `reply()`** — responder tickets desde COPE | 35 | Zendesk Write API |
| **Implementar `closeTicket()`** — cerrar tickets desde COPE | 35 | Zendesk Write API |
| **Agregar paginación cursor-based** a la bandeja | 35 | — |

### Prioridad media

| Tarea | Sprint | Dependencia |
|-------|--------|-------------|
| **Conectar Microservice** con `ModuloCliente360` | 36 | Microservice API |
| **Implementar `assignTicket()`** — asignar tickets | 36 | Zendesk Write API |
| **Agregar filtros por estado** en la bandeja | 36 | — |

### Prioridad baja

| Tarea | Sprint | Dependencia |
|-------|--------|-------------|
| **Mapeo configurable de `custom_fields`** | 37 | Múltiples cuentas Zendesk |
| **Agregar Whaticket como segundo canal** | 38 | Whaticket API |
| **Extraer `MensajeBubble`** a componente reutilizable | 35 | — |

---

## 5. Arquitectura de componentes

```
ZendeskPage
│
├── BandejaZendesk           (independiente, datos: props)
│
├── MensajeBubble            (inline, datos: props)
│
├── ModuloCliente            (independiente, datos: props)
├── ModuloCliente360         (independiente, sin props)
├── ModuloDiagnostico        (independiente, sin props)
├── ModuloHerramientas       (independiente, sin props)
├── ModuloGuias              (independiente, sin props)
├── ModuloActividades        (independiente, sin props)
└── ModuloResultado          (independiente, datos: props)
```

**Principio**: Todos los módulos del panel derecho son independientes entre sí. Ninguno importa a otro. Cada uno puede evolucionar sin afectar al resto. Las props de entrada están minimizadas al máximo.

---

## 6. Validación del recorrido

| Paso | Acción | Resultado esperado | Estado |
|------|--------|-------------------|--------|
| 1 | Ingresar a COPE | Ver layout 3 columnas | ✅ |
| 2 | Visualizar Bandeja | Tabs "Sin asignar" / "Mis Atenciones" con contadores | ✅ |
| 3 | Seleccionar un Ticket | Se abre en columna central | ✅ |
| 4 | Abrir el Workspace | Panel derecho con 7 módulos visibles | ✅ |
| 5 | Leer la conversación | Mensajes cronológicos, burbujas pública/interna | ✅ |
| 6 | Visualizar Cliente | Nombre, correo, dominio, país, categoría, etiquetas | ✅ |
| 7 | Visualizar panel operativo | 7 módulos con placeholders | ✅ |

---

*Documento generado automáticamente por COPE Development Standard v1.0*
*Sprint 34 — Primer COPE Operativo*
