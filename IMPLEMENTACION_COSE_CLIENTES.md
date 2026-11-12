# Implementación COSE — Clientes

**Fecha:** 4 de noviembre de 2026
**Módulo:** `/clientes` → Panel Operativo → sección **COSE**
**Estado:** implementado, validado y detenido para revisión. **Sin commit ni push.**

---

## 1. Resumen ejecutivo

Se reemplazó la sección “Actividad en COPE” por **COSE**, un historial operativo de atenciones construido sobre `public.v_unificado_norm`.

La implementación separa dos capas para no alterar los conteos existentes:

| Capa | Fuente | Deduplicación | Consumidores |
|---|---|---|---|
| **Compatibilidad** | `public.v_unificado_norm` | No | Tabla “Dominios y locales”, drawer local, `/api/localbi/actividad`, `/api/localbi/actividad-local` |
| **COSE** | `public.v_unificado_norm` | Sí, por `(canal, ticket_id)` | Sección COSE, `GET /api/localbi/actividad-cose` |

Resultados clave:

- GLOBAL FUEL: tabla existente **37** · COSE **37** (sin duplicados).
- Masamar: tabla existente **30** · COSE **29** (1 duplicado real consolidado).
- Los indicadores de COSE coinciden exactamente con SQL (promedios y medianas).
- Los filtros no generan falsos duplicados: `duplicados` es independiente de canal, asesor, búsqueda y local.
- `/api/localbi/actividad` conserva su respuesta anterior (total 37, `estados` en inglés y los 10 campos del detalle).
- Pruebas backend: **519/519**. TypeScript y build de backend/frontend correctos.

---

## 2. Decisiones de diseño

### 2.1 Dos capas, un solo universo

`actividadCope.repository.ts` contiene:

1. **Compatibilidad** (`resumenPorDominios`, `actividadPorLocalbiId`, `resumenPorLocalbiIds`, `detallePorDominios`): consultas sin deduplicar y con la semántica original.
2. **COSE** (`actividadCoseAgregada`): consulta deduplicada, con período, filtros y agregados calculados en SQL.

Ningún método de compatibilidad fue reemplazado ni modificado en su comportamiento.

### 2.2 Endpoint explícito

Se agregó `GET /api/localbi/actividad-cose` y se dejó intacto `GET /api/localbi/actividad`.

### 2.3 Deduplicación determinista

Se consolida por `(canal, ticket_id)` con `DISTINCT ON`. El registro elegido prioriza, en este orden:

1. Comentario de cierre no vacío.
2. `localbi_id` no nulo.
3. `primera_respuesta_min_norm` no nulo.
4. `resolucion_min_norm` no nulo.
5. `dominio` no nulo.
6. `WHATMETA` antes que `WHATICKET`.
7. `subcanal ASC` como desempate final.

Esto evita duplicados cuando la misma atención aparece en la hoja de WhatsApp Meta y en la hoja de Whaticket.

### 2.4 `duplicados` independiente de filtros

El cálculo es:

```sql
(SELECT COUNT(*) FROM public.v_unificado_norm WHERE <dominio + período>)
-
(SELECT COUNT(*) FROM base_periodo)
```

Es decir, se calcula sobre el universo del período y dominio **antes** de aplicar filtros de dimensión. Por eso filtrar por canal, asesor, ticket o local no inventa duplicados.

### 2.5 Período en hora de Lima

- Por defecto: **últimos 30 días** (`hasta` = hoy en `America/Lima`; `desde` = `hasta - 29 días`).
- `desde` y `hasta` son fechas `YYYY-MM-DD` y se comparan contra la columna `fecha` (date-only).
- “Todo” envía `desde=2000-01-01` para evitar que el backend aplique el default de 30 días.

### 2.6 Fechas: `fecha` + `hora`, no `tickets_created_at`

`tickets_created_at` es `timestamp without time zone`; su serialización por el driver puede desplazar el día o la hora. La vista ya expone `fecha` (date-only) y `hora` (hora local de Lima). La UI muestra **`fecha` + `hora`** y no infiere nada desde `tickets_updated_at`.

Evidencia (ver `docs/captures/cose-evidencia-sql.txt`):

| Ticket | `fecha` + `hora` (Lima) | `tickets_created_at` | Riesgo si se usara el timestamp |
|---|---|---|---|
| #35023 | 28-oct-2026 21:00:31 | 29-oct-2026 02:00:31 | Se mostraría 29-oct |
| #35126 | 02-nov-2026 00:21:38 | 01-nov-2026 05:21:38 | Se mostraría 01-nov |
| #34627 | 14-oct-2026 02:56:33 | 14-oct-2026 07:56:33 | Hora desplazada |

### 2.7 Navegación

- **Zendesk:** el número abre `/atenciones?ticket=<id>&canal=CORREO` solo cuando `canal = CORREO` y `subcanal = ZENDESK`.
- **WhatsApp:** no genera enlace. Sus IDs pueden coincidir con IDs de Zendesk, por lo que se muestra el número como texto y una nota explícita.
- `/atenciones` ignora `ticket` si no recibe `canal=CORREO|ZENDESK`, evitando abrir por accidente el ticket equivocado.
- Si el ticket no existe, se muestra un mensaje funcional en lugar del error técnico.

---

## 3. Backend

### 3.1 Archivos

| Archivo | Cambio |
|---|---|
| `backend/src/repositories/actividadCope.repository.ts` | Capa de compatibilidad restaurada + capa COSE, dedupe, período, filtros, agregados SQL, `duplicados` y chips facetados |
| `backend/src/integrations/localbi/services/ActividadCopeService.ts` | Métodos de compatibilidad + `obtenerActividadCose` |
| `backend/src/integrations/localbi/controllers/LocalbiController.ts` | `actividadCose` con validación de fechas, límite, canal, estado, local, asesor y búsqueda |
| `backend/src/integrations/localbi/routes/localbi.routes.ts` | Ruta `GET /actividad-cose` |

### 3.2 Contrato de `GET /api/localbi/actividad-cose`

| Parámetro | Tipo | Regla |
|---|---|---|
| `dominios` | string | Requerido. Lista separada por comas, máximo 100 |
| `desde` | `YYYY-MM-DD` | Opcional. Fecha válida; no mayor que `hasta` |
| `hasta` | `YYYY-MM-DD` | Opcional. Default: hoy en Lima |
| `limite` | entero | Opcional. 1–500, default 200 |
| `localbi_id` | string | Opcional. `__sin_local__` filtra `localbi_id IS NULL` |
| `canal` | string | Opcional. `WHATSAPP` o `CORREO` |
| `asesor` | string | Opcional. Texto exacto de la vista |
| `estado` | string | Opcional. `cerrado`, `resuelto`, `abierto`, `sin_mapear` |
| `q` | string | Opcional. Busca en `ticket_id`, `contacto` y `dominio`; máx. 100 |

Respuesta:

```json
{
  "ok": true,
  "status": "success",
  "data": {
    "resumen": {
      "total": 37,
      "sin_local": 18,
      "duplicados": 0,
      "canales": [],
      "categorias": [],
      "subcategorias": [],
      "asesores": [],
      "estados": [],
      "locales": [],
      "primera_respuesta": { "n": 29, "promedio": 349.22, "mediana": 14.57, "cobertura": 0.7838 },
      "resolucion": { "n": 37, "promedio": 1118.17, "mediana": 84, "cobertura": 1 },
      "primera_atencion": "…",
      "ultima_atencion": "…"
    },
    "ultimasAtenciones": [],
    "opciones": { "canales": [], "estados": [], "asesores": [], "locales": [], "sin_local": 18 },
    "chips": { "estados": [{ "nombre": "cerrado", "cantidad": 37 }], "sin_local": 18 }
  },
  "warnings": []
}
```

Notas:

- `resumen` y `ultimasAtenciones` usan **el mismo universo deduplicado y filtrado**. Los KPIs nunca se calculan sobre una muestra distinta al listado.
- `opciones` alimenta los desplegables y se calcula sobre el período completo, para que las opciones no desaparezcan al filtrar.
- `chips` alimenta los chips de estado y “sin local”: aplica el resto de filtros e ignora solo su propia dimensión, de modo que sigan siendo navegables.

### 3.3 Validaciones verificadas

Todas devuelven HTTP 400 con mensaje funcional:

| Caso | Respuesta |
|---|---|
| `desde=2026-13-01` | `desde inválido (formato YYYY-MM-DD)` |
| `desde=2026-11-05&hasta=2026-11-04` | `desde no puede ser mayor que hasta` |
| `limite=0` / `limite=501` | `limite debe ser un entero entre 1 y 500` |
| `canal=TELEGRAM` | `canal inválido (WHATSAPP o CORREO)` |
| `estado=pendiente` | `estado inválido (cerrado, resuelto, abierto, sin_mapear)` |
| Sin `dominios` | `dominios requerido (lista separada por comas)` |

---

## 4. Frontend

### 4.1 Archivos

| Archivo | Cambio |
|---|---|
| `frontend/src/modules/localbi/components/secciones/CoseUnidad.tsx` | Componente COSE completo (nuevo) |
| `frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx` | Integra `<CoseUnidad />`; elimina el componente antiguo `ActividadCope` |
| `frontend/src/modules/localbi/types/localbi.ts` | Tipos `CoseAtencion`, `CoseIndicadorTiempo`, `CoseResumen`, `CoseOpciones`, `CoseChips`, `CoseAgregada` |
| `frontend/src/modules/localbi/index.ts` | Exporta hook, tipos y servicio COSE |
| `frontend/src/modules/localbi/services/LocalbiService.ts` | `actividadCose(dominios, params)` |
| `frontend/src/modules/localbi/hooks/useHistoriaClinica.ts` | Hook `useActividadCose` |
| `frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts` | Etiquetas de refresco “COSE histórico” y “COSE” |
| `frontend/src/modules/localbi/components/HistoriaLocalDrawer.tsx` | Etiqueta visible “COSE” |
| `frontend/src/pages/cope/Atenciones.tsx` | Deep link Zendesk, guarda de canal y mensaje de ticket inexistente |

### 4.2 Composición de la sección

- Encabezado **COSE** con contador del universo filtrado.
- Período: `7d`, `30d`, `90d`, `Todo` (default `30d`). En “Todo” se muestra “Historial completo”.
- Chips: estados homologados + “Sin local asignado”, con conteos facetados.
- KPIs:
  - Total.
  - Primera respuesta: promedio, mediana y cobertura (`n/total · %`).
  - Tiempo de resolución: promedio, mediana y cobertura.
- Filtros: búsqueda, local, canal, asesor, estado y “Limpiar”.
- Aviso de duplicados consolidados en el período (solo si `duplicados > 0`).
- Listado limitado a 200 tarjetas; los KPIs usan todo el universo.
- Detalle expandible por atención.

### 4.3 Campos mostrados

Solo se muestran campos existentes en la vista:

`ticket_id`, `fecha`, `hora`, `canal`, `subcanal`, `estado_homologado`, `localbi_id`, `dominio`, `categoria`, `subcategoria`, `asesor`, `primera_respuesta_min_norm`, `resolucion_min_norm`, `rango_atencion`, `comentario_cierre`, `contacto`, `numero`.

No se muestra “tiempo de atención”, “resultado” ni “descripción” porque no existen como campos del universo. No se infiere cierre desde `tickets_updated_at`.

---

## 5. Evidencia SQL

Archivo completo: `docs/captures/cose-evidencia-sql.txt`.

### 5.1 Universo completo (sin filtros de fecha)

| Dominio | Crudas | COSE | Duplicados | n 1.ª resp. | Prom. | Mediana | n resolución | Prom. | Mediana | Sin local |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---:|
| `globalfuelsa.restaurant.pe` | 37 | 37 | 0 | 29 | 349.22 | 14.57 | 37 | 1118.17 | 84.00 | 18 |
| `masamar.restaurant.pe` | 30 | 29 | 1 | 28 | 47.30 | 6.83 | 29 | 486.80 | 71.13 | 5 |

### 5.2 Últimos 30 días — GLOBAL FUEL

Rango: `2026-10-06` → `2026-11-04`.

| COSE | n 1.ª resp. | Prom. | Mediana | n resolución | Prom. | Mediana | Sin local |
|---:|---:|---:|---:|---:|---:|---:|---:|
| 7 | 7 | 362.30 | 15.93 | 7 | 407.03 | 84.00 | 3 |

### 5.3 Duplicado real de Masamar

| Canal | Ticket | Filas | Subcanales | Local |
|---|---|---:|---|---|
| WHATSAPP | 9108 | 2 | `WHATICKET`, `WHATMETA` | `6897-restaurant.pe-9486` |

La regla elige `WHATMETA`. Por eso la tabla de compatibilidad suma 30 y COSE suma 29.

---

## 6. Evidencia API

Archivo completo: `docs/captures/cose-evidencia-api.txt`.

### 6.1 Compatibilidad preservada

| Endpoint | Resultado |
|---|---|
| `/api/localbi/actividad?dominios=globalfuelsa.restaurant.pe` | total **37**; `estados: [{ nombre: "closed", cantidad: 37 }]`; 8 campos de resumen y 10 campos de detalle |
| `/api/localbi/actividad?dominios=masamar.restaurant.pe` | total **30**; `estados: closed 29, SI 1` |
| `/api/localbi/actividad-local?ids=6897-restaurant.pe-9486` | `{ total: 25, ultima_atencion: "2026-11-04T00:00:00.000Z" }` |

La tabla “Dominios y locales” de GLOBAL FUEL suma **37** (37 locales + 1 fila “Sin local asignado”) y la de Masamar suma **30** (25 + 5 sin local), igual que antes de COSE.

### 6.2 `duplicados` independiente de los filtros

| Consulta | Total | Duplicados |
|---|---:|---:|
| GLOBAL sin filtros | 37 | 0 |
| GLOBAL `canal=WHATSAPP` | 19 | 0 |
| GLOBAL `asesor=Sheyla` | 8 | 0 |
| GLOBAL `q=35023` | 1 | 0 |
| GLOBAL `local=Punche Pezet` | 9 | 0 |
| GLOBAL `local+canal` | 9 | 0 |
| GLOBAL `estado=cerrado` | 37 | 0 |
| MASAMAR sin filtros | 29 | 1 |
| MASAMAR `canal=WHATSAPP` | 25 | 1 |
| MASAMAR `q=9108` | 1 | 1 |
| MASAMAR `local=Casa Loop` | 24 | 1 |

Los filtros cambian el total, pero nunca el número de duplicados reales.

### 6.3 Coincidencia API ↔ SQL

| Indicador | API COSE | SQL | Δ |
|---|---:|---:|---:|
| Total (GLOBAL, todo) | 37 | 37 | 0 |
| Duplicados (GLOBAL) | 0 | 0 | 0 |
| 1.ª respuesta n (GLOBAL) | 29 | 29 | 0 |
| 1.ª respuesta promedio | 349.2184 | 349.22 | 0.0016 (redondeo) |
| 1.ª respuesta mediana | 14.5667 | 14.57 | 0.0033 (redondeo) |
| Resolución n | 37 | 37 | 0 |
| Resolución promedio | 1118.1698 | 1118.17 | 0.0002 (redondeo) |
| Resolución mediana | 84 | 84.00 | 0 |
| Sin local | 18 | 18 | 0 |
| Total (Masamar, todo) | 29 | 29 | 0 |
| Duplicados (Masamar) | 1 | 1 | 0 |
| 1.ª respuesta promedio (Masamar) | 47.30 | 47.30 | 0 |
| Resolución promedio (Masamar) | 486.80 | 486.80 | 0 |

Las diferencias son solo de redondeo a dos decimales en la consulta SQL de control.

---

## 7. Regresión verificada

| Elemento | Resultado |
|---|---|
| **TAREAS** | Presente. GLOBAL FUEL: 26. Masamar: 1. |
| **TICKETS DEV** | Presente. GLOBAL FUEL: 183 (Completo 157 · Pendiente 13 · Rechazado 13). Masamar: 15 (Completo 10 · Pendiente 5). |
| **Historial Transversal** | Presente y operativo; GLOBAL FUEL muestra 40 eventos. |
| **`/atenciones` compacta** | Sin desbordamiento horizontal a 1366×768 y 1440×900; filtros y bandeja visibles; sin errores de consola. |
| **Tabla de locales** | GLOBAL FUEL 37; Masamar 30 (25 + 5 sin local). Sin cambios. |
| **19 asesores oficiales** | Sin cambios: la vista y `ASESOR_EQUIVALENCIAS` (19 alias → 8 personas) no fueron modificadas. COSE muestra y filtra los valores de la vista. |
| **Fechas cercanas a medianoche** | #35023 (21:00 Lima / 29-oct UTC), #34627 (02:56), #35126 (00:21 del 02-nov) se muestran con fecha y hora correctas. |
| **Filtros combinados** | Local + canal + asesor + estado + búsqueda devuelven el mismo universo para KPIs y listado. |
| **`/api/localbi/actividad`** | Total 37, `estados` en inglés y estructura anterior intacta. |

---

## 8. Capturas

Todas en `docs/captures/`.

| Archivo | Contenido |
|---|---|
| `cose-clientes-1366x768.png` | COSE 30 días a 1366×768: encabezado, período, chips, KPIs, filtros y listado |
| `cose-clientes-1440x900.png` | COSE 30 días a 1440×900 |
| `cose-clientes-todo-1366x768.png` | COSE “Todo” (37) a 1366×768 |
| `cose-clientes-todo-1440x900.png` | COSE “Todo” (37) a 1440×900 |
| `cose-lista-1366x768.png` | Listado de tarjetas y enlaces |
| `cose-filtros-1366x768.png` | Filtros combinados Local + Canal; chips facetados |
| `cose-masamar-duplicados-1366x768.png` | Masamar: 29 COSE y aviso “1 duplicado consolidado en el período” |
| `cose-detalle-zendesk-1366x768.png` | Detalle de atención Zendesk (#35023) con enlace |
| `cose-detalle-whatsapp-1366x768.png` | Detalle WhatsApp (#27104) sin enlace y con la limitación explicada |
| `atenciones-zendesk-deeplink-1366x768.png` | Deep link válido a `/atenciones?ticket=35023&canal=CORREO` |
| `atenciones-whatsapp-sin-enlace-1366x768.png` | `/atenciones?ticket=27104` sin abrir el ticket equivocado |
| `atenciones-ticket-inexistente-1366x768.png` | Mensaje funcional para ticket inexistente |
| `atenciones-compacta-1366x768.png` | Bandeja compacta a 1366×768 |
| `atenciones-compacta-1440x900.png` | Bandeja compacta a 1440×900 |
| `cose-evidencia-api.txt` | Salida cruda de la validación API |
| `cose-evidencia-sql.txt` | Consultas y resultados SQL de control |

---

## 9. Pruebas y build

| Verificación | Resultado |
|---|---|
| `npm test -w backend` | **28 archivos, 519 pruebas, todas aprobadas** |
| `npx tsc --noEmit` (backend) | Sin errores |
| `npx tsc --noEmit` (frontend) | Sin errores |
| `npm run build -w backend` | Correcto |
| `npm run build -w frontend` | Correcto (solo advertencia de tamaño de chunk, preexistente) |
| Consola del navegador en COSE y `/atenciones` | Sin errores |

---

## 10. Archivos modificados

### 10.1 Propios de COSE

```
backend/src/repositories/actividadCope.repository.ts
backend/src/integrations/localbi/services/ActividadCopeService.ts
backend/src/integrations/localbi/controllers/LocalbiController.ts
backend/src/integrations/localbi/routes/localbi.routes.ts
frontend/src/modules/localbi/components/secciones/CoseUnidad.tsx        (nuevo)
frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx
frontend/src/modules/localbi/types/localbi.ts
frontend/src/modules/localbi/index.ts
frontend/src/modules/localbi/services/LocalbiService.ts
frontend/src/modules/localbi/hooks/useHistoriaClinica.ts
frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts
frontend/src/modules/localbi/components/HistoriaLocalDrawer.tsx
frontend/src/pages/cope/Atenciones.tsx
docs/captures/cose-*.png
docs/captures/atenciones-*.png
docs/captures/cose-evidencia-api.txt
docs/captures/cose-evidencia-sql.txt
IMPLEMENTACION_COSE_CLIENTES.md
```

### 10.2 Cambios previos ajenos a COSE (preservados, no descartados)

El repositorio ya tenía cambios sin commit de P0, TAREAS, TICKETS DEV, rediseño y marca. Se conservaron:

```
CHANGELOG.md
backend/data/clientes.json
backend/data/clientes_cope.json
backend/src/integrations/localbi/services/LocalbiService.ts
backend/src/integrations/localbi/services/SoporteOnlineService.ts
backend/src/integrations/tareabi/services/TareabiService.ts
backend/src/repositories/soporteOnline.repository.ts
frontend/src/modules/localbi/components/HistoriaClinicaUI.tsx
frontend/src/modules/localbi/components/HistoriaClinicaView.tsx
frontend/src/modules/localbi/components/LocalesDrawer.tsx
frontend/src/modules/localbi/components/secciones/HistorialTransversalSeccion.tsx
frontend/src/modules/localbi/components/secciones/ResumenUnidad.tsx
frontend/src/modules/localbi/components/secciones/TicketsDev.tsx
frontend/src/modules/localbi/components/secciones/TareasIndependientes.tsx
frontend/src/modules/localbi/utils/
frontend/src/modules/quejas-devoluciones/components/QdClienteHistorial.tsx
frontend/src/modules/tareabi/types.ts
frontend/src/pages/cope/Clientes.tsx
frontend/src/pages/quejas-devoluciones/QuejasDevolucionesPage.tsx
AUDITORIA_TAREAS_CLIENTES.md
IMPLEMENTACION_P0_CLIENTES.md
IMPLEMENTACION_TAREAS_CLIENTES.md
REDISENO_TICKETS_DEV_CLIENTES.md
docs/captures/ (capturas previas)
```

> `LocalbiService.ts` y `useHistoriaClinicaData.ts` contienen cambios previos y también el agregado COSE; no se revirtió nada.

---

## 11. Limitaciones y observaciones

1. **WhatsApp sin enlace.** No se genera deep link porque el `ticket_id` de WhatsApp puede coincidir con un ID de Zendesk. Se muestra como texto y con una nota en el detalle.
2. **`tickets_created_at` no se usa para mostrar.** Es `timestamp without time zone` y su serialización desplaza fecha/hora. La fuente visual es `fecha` + `hora`.
3. **`duplicados` es del período y dominio**, no del subconjunto filtrado. Es intencional: los filtros no deben inventar duplicados. La UI lo rotula como “en el período”.
4. **Listado limitado a 200.** Los KPIs y el total usan todo el universo; la UI lo advierte cuando hay más de 200.
5. **Ticket inexistente en `/atenciones`.** El endpoint de detalle responde 500 (comportamiento preexistente de la integración). La UI ahora muestra “El ticket no existe o no está disponible en la bandeja” en lugar del error técnico.
6. **`PanelOperativo.tsx`.** Muestra el texto literal `Esta atenci\u00f3n no tiene dominio.` Es un defecto preexistente en un componente compartido; no se modificó por estar fuera del alcance de COSE.
7. **Drawer de local.** La sección “COSE” del drawer muestra el conteo por `localbi_id` sin deduplicar (capa de compatibilidad) y lo indica explícitamente para no confundirlo con el COSE del cliente.
8. **Sin commit ni push.** Todo queda en el árbol de trabajo para revisión.

---

## 12. Cómo validar manualmente

1. Levantar backend (`npm run dev -w backend`, puerto 4000) y frontend (`npm run dev -w frontend`, puerto 5173).
2. Entrar a `/clientes`, buscar `GLOBAL FUEL` y abrir la ficha.
3. Verificar la tabla “Dominios y locales”: la columna ATENC. suma **37**.
4. Abrir **COSE**: por defecto muestra **7** (últimos 30 días).
5. Pulsar **Todo**: muestra **37**; primera respuesta 29/37 (78 %), mediana 16 min; resolución 37/37, mediana 1 h 24 min.
6. Filtrar Local = Punche Pezet y Canal = WHATSAPP: total **9**, sin chip de “sin local”, chips y KPIs consistentes.
7. Abrir Masamar y pulsar **Todo**: COSE **29**, aviso “1 duplicado consolidado en el período”; la tabla suma **30**.
8. Abrir el detalle de `#35023`: enlace a Zendesk y fecha 28 oct 2026, 09:00 p. m.
9. Abrir el detalle de `#27104`: sin enlace, nota de limitación de WhatsApp y fecha 03 nov 2026, 05:19 p. m.
10. Ir a `/atenciones?ticket=35023&canal=CORREO`: abre el ticket correcto. Probar `/atenciones?ticket=27104`: no abre el ticket equivocado.
