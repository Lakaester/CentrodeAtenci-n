# Auditoría funcional — TAREAS de `/clientes`

**Fase:** auditoría de solo lectura.
**Fecha:** 4 de noviembre de 2026.
**Alcance:** sección TAREAS de la ficha de cliente en `/clientes`.
**Resultado:** no se modificó código, endpoints, consultas ni datos. Este documento es el único artefacto generado.

---

## 1. Resumen ejecutivo

La sección **TAREAS** se alimenta de `tareas_sueltas`, un arreglo que LocalBI entrega **dentro de cada local** de la Historia Clínica. No proviene de COPE ni de Zendesk.

Hallazgos principales:

1. Son **tareas independientes**: `ticket_id` viene vacío en 454 de 455 registros muestreados y `"0"` en 1; no se solapan con las tareas de tickets y Tareabi devuelve `ticketbi_id: null`/`"0"`.
2. La UI actual muestra **solo título y estado**. No muestra identificador, responsable, fechas, descripción, conclusión, local, enlace ni historial.
3. La fuente sí entrega **13 campos** por tarea y Tareabi puede enriquecerla con referencia, proyecto, categoría, tipo, etapa, último comentario e historial.
4. Se pierde el **contexto de local** al aplanar `locales[].tareas_sueltas` en el hook.
5. Hay problemas de calidad de datos: 52 tareas con `fecha_fin < fecha_inicio`, 52 con título `"-"`, 41 con responsable `"Por asignar"`, 48 sin fecha de inicio y 49 sin fecha de fin.
6. En la muestra no apareció ningún estado literal **"En proceso"** en `tareas_sueltas`; los estados observados de trabajo son `Pendiente`, `En pausa` y `Subido a Producción`.
7. El drawer de local mezcla `tareas_sueltas` bajo el encabezado **"TICKETS"**, y el Historial Transversal **no incluye** tareas independientes.

---

## 2. Trazabilidad de fuentes

| Capa | Archivo / símbolo | Función |
|---|---|---|
| Componente | `frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx` | Renderiza la sección `Tareas` |
| Hook de datos | `frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts` | `tareasSueltas = locales.flatMap(l => l.tareas_sueltas ?? [])` |
| Hook de consulta | `frontend/src/modules/localbi/hooks/useHistoriaClinica.ts` | Query `["localbi","historia",unidad]` |
| Servicio frontend | `frontend/src/modules/localbi/services/LocalbiService.ts` | `GET /localbi/historia/{unidad}` |
| Ruta backend | `backend/src/integrations/localbi/routes/localbi.routes.ts` | `GET /historia/:unidadNegocio` |
| Controlador | `backend/src/integrations/localbi/controllers/LocalbiController.ts` | `historia()` |
| Servicio backend | `backend/src/integrations/localbi/services/LocalbiService.ts` | `obtenerHistoria()` → `classifyEnvelope()` |
| Cliente HTTP | `backend/src/integrations/localbi/client/LocalbiClient.ts` | `GET {LOCALBI_BASE_URL}/public/rest/localbi/getHistoriaClinica/{unidad}` |
| Fuente | Microservicio LocalBI (MariaDB) | Devuelve `data.dominios[].locales[].tareas_sueltas[]` |

El backend **no transforma** el contenido: `classifyEnvelope` devuelve `envelope.data` tal cual (solo clasifica `tipo` 1/2/3). Por tanto, la estructura de `tareas_sueltas` es la del microservicio LocalBI.

### Evidencia de pass-through

```ts
// LocalbiService.classifyEnvelope
if (tipo === "1") return { status: "success", data: envelope.data };
```

No hay mapeo, deduplicación ni cálculo de campos para `tareas_sueltas`.

---

## 3. Estructura de datos real

### 3.1 Ubicación

```
LocalbiHistoriaClinica
└─ dominios[]
   └─ locales[]
      ├─ localbi_id
      ├─ nombre
      ├─ tickets[]           ← tickets de desarrollo (sección TICKETS DEV)
      │  └─ tareas[]
      └─ tareas_sueltas[]    ← TAREAS independientes (esta sección)
```

### 3.2 Campos de `tareas_sueltas`

| Campo | Tipo observado | Ejemplo |
|---|---|---|
| `tarea_id` | string | `"27855"` |
| `ticket_id` | string | `""` o `"0"` |
| `titulo` | string | `"reunion de seguimiento TCI"` o `"-"` |
| `estado` | string | `"Pendiente"` |
| `responsable` | string | `"Wilmar"` / `"Por asignar"` |
| `detalle` | string | descripción completa |
| `conclusion` | string | `"Se confirmó..."` / `"-"` |
| `sprint` | string | `"restpe-2025-28"` |
| `fecha_inicio` | string vacío o fecha | `"2025-12-13 10:18:44"` |
| `fecha_fin` | string vacío o fecha | `"2025-12-13 10:18:44"` |
| `fecha_tentativa` | string vacío o fecha | `"2025-12-13 10:18:44"` |
| `fecha_solicitud` | string fecha | `"2025-12-12 18:11:02"` |
| `registrado_por` | string | `"Vanesa Moscoso Ayllon"` |

### 3.3 Ejemplo real (Restaurante San Blas)

```json
{
  "tarea_id": "27855",
  "ticket_id": "",
  "titulo": "El cliente reporta que, al realizar una venta dividida...",
  "estado": "Pendiente",
  "responsable": "Por asignar",
  "detalle": "El cliente reporta que, al realizar una venta dividida...",
  "conclusion": "Se crea este ticket le corrijan al cliente los montos...",
  "sprint": "POR DEFINIR",
  "fecha_inicio": "",
  "fecha_fin": "",
  "fecha_tentativa": "2025-08-05 00:00:00",
  "fecha_solicitud": "2025-08-05 16:38:22",
  "registrado_por": "María Montero"
}
```

### 3.4 Tipos del proyecto

- Backend: `backend/src/integrations/localbi/types/index.ts` → `LocalbiTarea` y `LocalbiLocal.tareas_sueltas`.
- Frontend: `frontend/src/modules/localbi/types/localbi.ts` → `LocalbiTarea` y `LocalbiLocal.tareas_sueltas`.

El tipo incluye los campos de fecha, pero la UI no los usa.

---

## 4. Diferenciación de tipos de tareas

### A. Tareas independientes (`tareas_sueltas`)

- Se anidan bajo un local.
- `ticket_id` **vacío** (454/455) o `"0"` (1/455).
- Tareabi devuelve `ticketbi_id: null` o `"0"`.
- No se solapan con `tickets[].tareas[]` (0/455).
- No se duplican entre locales del mismo cliente (0/455).

### B. Tareas de tickets de desarrollo (`tickets[].tareas[]`)

- Se anidan bajo un ticket.
- `ticket_id` contiene el ticket real.
- Tareabi devuelve `ticketbi_id` real.
- Se muestran en **TICKETS DEV**, no en TAREAS.

### Evidencia de separación

| Prueba | Resultado |
|---|---|
| `tareas_sueltas` con `ticket_id` no vacío | 1/455, valor `"0"` (centinela, no ticket real) |
| Solapamiento `tarea_id` entre `tareas_sueltas` y `tickets[].tareas` | 0/455 |
| Duplicados de `tarea_id` entre locales del mismo cliente | 0/455 |
| `ticketbi_id` en Tareabi para tareas sueltas | `null` o `"0"` |
| Tareas totales de tickets revisadas | 1,607 |

**Conclusión:** las tareas de TAREAS no pertenecen a tickets de desarrollo. No deben mezclarse sus indicadores ni duplicarse en TICKETS DEV.

---

## 5. Inventario de campos

Clasificación:

- **D** = disponible directamente en LocalBI.
- **T** = disponible solo consultando Tareabi.
- **P** = parcial/incompleto (vacío, `"-"` o centinela en parte de los registros).
- **X** = inexistente en las fuentes actuales.
- **N/A** = no aplica por ser tarea independiente.

| Campo | LocalBI | Tareabi detalle | Clasificación | Observación |
|---|---|---|---|---|
| Identificador | `tarea_id` | `tareabi_id` | **D** | Coinciden |
| Título | `titulo` | `tarea_descripcion` | **P** | 52/455 con `"-"`; usar primera línea de `detalle` |
| Descripción | `detalle` | `tarea_descripcion` | **D** | Siempre presente en la muestra |
| Estado | `estado` | `tarea_estado` | **D** | Estado propio de la tarea |
| Responsable | `responsable` | `tarea_dev` | **P** | 41/455 con `"Por asignar"` |
| Fecha de creación | — | `tarea_fechasolicitud` | **P** | No hay `created_at`; `fecha_solicitud` es la mejor aproximación |
| Fecha de vencimiento | `fecha_tentativa` | `tarea_fechaentrega` | **P** | Es fecha tentativa/entrega, no vencimiento formal |
| Fecha de finalización | `fecha_fin` | `tarea_fechafin` | **P** | 49/455 vacías |
| Última actualización | — | — | **X/P** | No hay campo canónico; se deriva del último log |
| Observaciones | `conclusion` | `tarea_comentario` | **P** | `conclusion` vacía/`"-"` en 63/455 |
| Conclusión | `conclusion` | `tarea_comentario` | **P** | Mismo campo anterior |
| Historial de cambios | — | logs (`logsTarea`) | **T** | Disponible con `ticketbi_id = 0` |
| Ticket relacionado | `ticket_id` | `ticketbi_id` | **N/A** | Vacío o `"0"`; no hay ticket |
| Referencia | — | `tarea_referencia` | **T** | URL o código; `"-"` si no existe |
| Sprint | `sprint` | `tarea_sprint` | **D** | — |
| Proyecto | — | `tarea_proyecto` | **T** | — |
| Categoría | — | `tarea_categoria` | **T** | — |
| Tipo | — | `tarea_tipo` | **T** | — |
| Etapa | — | `tarea_etapa` | **T** | — |
| Prioridad | — | `tarea_prioridad` | **T** | — |
| Local | anidado por local | `localbi_id` + objeto `localbi` | **D/T** | El objeto de tarea no trae el local; se pierde al aplanar |
| Registrado por | `registrado_por` | `tarea_personaregistronombre` | **D** | — |

### Conclusión del inventario

LocalBI ya entrega lo esencial para una ficha de tarea. Tareabi aporta referencia, proyecto, categoría, tipo, etapa, último comentario e historial. No se requiere inventar ningún campo para una primera versión.

---

## 6. Relaciones disponibles

| Relación | Evidencia | Uso |
|---|---|---|
| Tarea → Local | La tarea está anidada en `locales[]`; Tareabi devuelve `localbi_id` igual al del local | Mostrar el local y agrupar |
| Tarea → Ticket | `ticket_id` vacío/`"0"`; Tareabi `ticketbi_id` null/`"0"` | **No existe relación** |
| Tarea → Tareabi | `tarea_id` = `tareabi_id` | Detalle e historial |
| Tarea → Dominio | El local pertenece a un dominio | Contexto de cliente |

### Advertencia sobre `tarea_localbi_id`

En las cuatro tareas inspeccionadas, `tarea_localbi_id` vale `"-1-restaurant.pe-1362"` (placeholder). **No debe usarse** para asociar la tarea a un local. La relación válida es `localbi_id` (y el anidamiento de LocalBI).

### Verificación de `localbi_id`

| Tarea | `localbi_id` Tareabi | Local LocalBI | Coincide |
|---|---|---|---|
| 14137 | `5568-restaurant.pe-7820` | GLOBAL FUEL · Centro De Producción - Dark Kitchen | ✅ |
| 28533 | `7618-restaurant.pe-10742` | INVERSIONES CREAR SAS · OKAPOLLO | ✅ |
| 27855 | `7845-restaurant.pe-11080` | Restaurante San Blas · CONDOMINIO RECREACIONAL SAN BLAS | ✅ |
| 40237 | `9255-restaurant.pe-13275` | Macchia · CAVENECIA | ✅ |

---

## 7. Pruebas y evidencias

### 7.1 Muestra analizada

| Muestra | Unidades | Tareas sueltas | Uso |
|---|---:|---:|---|
| Barrido inicial por búsquedas | 609 | 228 | Estructura, estados, solapamiento |
| Muestra sistemática (cada 11.ª unidad) | 417 | 455 | Completitud de campos, estados, calidad |
| Muestra adicional (cada 9.ª unidad, offset 3) | 509 | 444 | Búsqueda de `En proceso` / `En pruebas` |

Las muestras se solapan entre sí; no se suman como registros únicos.

### 7.2 Distribución de estados (455 tareas)

| Estado | Cantidad |
|---|---:|
| Completo | 332 |
| Rechazado | 42 |
| No necesita | 30 |
| Pendiente | 19 |
| Subido a Producción | 16 |
| Rechazado - Mal análisis | 12 |
| Ticket duplicado | 2 |
| En pausa | 1 |
| Falta de información | 1 |
| **En proceso** | **0** |
| **En pruebas** | **0** |

El catálogo de Tareabi sí incluye `En proceso`, `En pruebas`, `Pendiente de diseño`, `No replicable`, entre otros. En las muestras revisadas no apareció una tarea suelta en `En proceso` ni `En pruebas`; los estados de trabajo observados son `Pendiente`, `En pausa` y `Subido a Producción`.

### 7.3 Completitud de campos (455 tareas)

| Situación | Cantidad | % |
|---|---:|---:|
| Sin `fecha_inicio` | 48 | 10.5% |
| Sin `fecha_fin` | 49 | 10.8% |
| Sin `fecha_tentativa` | 17 | 3.7% |
| Sin `fecha_solicitud` | 0 | 0% |
| Título `"-"` o vacío | 52 | 11.4% |
| Detalle vacío | 0 | 0% |
| Conclusión `"-"` o vacía | 63 | 13.8% |
| Responsable `"Por asignar"` | 41 | 9.0% |
| `fecha_fin < fecha_inicio` | 52 | 11.4% |
| `ticket_id` no vacío | 1 (`"0"`) | 0.2% |
| Solapamiento con tareas de ticket | 0 | 0% |

### 7.4 Comparación API vs pantalla

#### GLOBAL FUEL

- API: **26** tareas sueltas repartidas en 4 locales:
  - Centro De Producción - Dark Kitchen: 18
  - Punche Pezet: 5
  - PRUEBAS TCI: 2
  - PUNCHE ESPINAR: 1
- Pantalla: badge **26**, sin desglose por local.
- Por tarea, la API entrega 13 campos; la pantalla muestra **2** (`titulo`, `estado`).
- Estados visibles: Completo, Subido a Producción, Rechazado - Mal análisis.
- No muestra: `tarea_id`, responsable, fechas, detalle, conclusión, referencia, local, enlace.

#### Restaurante San Blas

- API: **1** tarea (27855).
- Estado: Pendiente.
- Responsable: `"Por asignar"`.
- `fecha_inicio` y `fecha_fin`: vacías.
- Conclusión: presente.
- Pantalla: título + `Pendiente`. No muestra el identificador, el responsable ni la ausencia de fechas.

#### Macchia

- API: **7** tareas.
- Incluye `En pausa` (40237), `Rechazado - Mal análisis` y `Completo`.
- Pantalla: título + estado. No muestra la referencia, el responsable ni las fechas.

#### Chifa Restaurante Pollería Plaza Tingo

- API: **1** tarea (32191).
- Estado: `Rechazado - Mal análisis`.
- Responsable: `"Por asignar"`.
- Fechas de inicio/fin presentes.
- Pantalla: título + estado, sin responsable ni fechas.

#### 037 Bar Restaurant

- API: **0** tareas sueltas.
- Pantalla: `Sin tareas registradas`. ✅

### 7.5 Historial en Tareabi para tareas independientes

Se verificó el detalle y el historial con el microservicio:

| Tarea | `GET /tareabi/{id}` | `POST /logs/{id}/0` |
|---|---|---|
| 40237 | `ticketbi_id: null`, estado `En pausa` | **5 logsTarea** |
| 30895 | `ticketbi_id: null` | 1 log |
| 40082 | `ticketbi_id: null` | 2 logs |
| 40197 | `ticketbi_id: null` | 2 logs |
| 40198 | `ticketbi_id: null` | 2 logs |
| 40231 | `ticketbi_id: null` | 2 logs |
| 32681 | `ticketbi_id: null` | 3 logs |
| 32575 | `ticketbi_id: null` | 2 logs |
| 19557 | `ticketbi_id: null` | 1 log |
| 32191 | `ticketbi_id: null` | 1 log |
| 18459 | `ticketbi_id: null` | 1 log |

**Conclusión:** el detalle y el historial son recuperables para tareas independientes. El historial se obtiene pasando `ticketbi_id = 0` al endpoint existente. Es un comportamiento verificado, pero **no está documentado oficialmente**; se recomienda solicitar una ruta de logs por tarea o hacer opcional el ticket.

### 7.6 Evidencia de base de datos

- La base PostgreSQL de COPE **no contiene** tablas ni vistas de Tareabi (`information_schema.tables` no devuelve `tareabi`/`tarea`).
- `v_unificado_norm` no tiene columnas de tareas; sus columnas `ticket_id`, `tickets_created_at` y `tickets_updated_at` pertenecen a las atenciones de COPE/Zendesk, no a Tareabi.
- `estado_actual_tickets` es una tabla de seguimiento de etapas de COPE, no de Tareabi.
- Por tanto, `tareas_sueltas` **no se persiste en COPE**; se consume en tiempo real desde LocalBI.

---

## 8. Funcionalidades existentes

### 8.1 Sección TAREAS (`/clientes`)

- Sección colapsable, cerrada por defecto.
- Badge con el total de tareas (aplanado de todos los locales).
- Cada fila muestra:
  - `titulo` (o `"—"` si está vacío).
  - `estado`.
- No muestra identificador, responsable, fechas, descripción, conclusión, sprint, local ni enlace.
- No permite expandir ni consultar Tareabi.
- No incluye historial.
- No distingue tareas independientes de tareas de ticket (aunque la fuente sí las separa).

### 8.2 Drawer de local

- `HistoriaLocalDrawer` renderiza `tareasSueltas` **dentro de la sección “TICKETS”**, junto a los tickets del local.
- Solo muestra título y estado.
- Mezcla conceptualmente tareas independientes con tickets de desarrollo.

### 8.3 Historial Transversal

- `useHistoriaClinicaData` construye los eventos con Soporte en Línea, Atenciones COPE y **solo tickets**.
- Las `tareas_sueltas` **no se incluyen**.
- Verificado en GLOBAL FUEL: el Historial Transversal muestra 40 eventos y no aparece ninguna tarea suelta.

---

## 9. Hallazgos

1. **Fuente única:** `tareas_sueltas` de LocalBI. No hay tabla COPE ni endpoint propio de tareas.
2. **Tareas independientes confirmadas:** `ticket_id` vacío/`"0"`, sin solapamiento con tickets, `ticketbi_id` nulo/`"0"`.
3. **UI incompleta:** solo título y estado; se desperdicia el 85% de los campos disponibles.
4. **Pérdida de local:** el hook aplana los locales y descarta el contexto; la UI no puede mostrar a qué local pertenece cada tarea.
5. **Sin enlace a Tareabi:** el `tarea_id` no se muestra ni se enlaza, aunque el detalle existe y es verificable.
6. **Sin historial:** no se consulta Tareabi; el historial es recuperable con `ticket 0`, pero no se usa.
7. **Título deficiente:** 52/455 (11.4%) tienen `titulo = "-"`; la UI muestra `"—"` aunque `detalle` siempre existe.
8. **Responsable invisible:** 41/455 (9.0%) están `"Por asignar"` y la UI no lo refleja.
9. **Fechas incompletas:** 48/455 sin inicio y 49/455 sin fin; la UI no informa la ausencia.
10. **Fechas inconsistentes:** 52/455 (11.4%) tienen `fecha_fin < fecha_inicio`; cualquier cálculo de duración debe protegerse.
11. **Mezcla en drawer:** las tareas sueltas se muestran bajo “TICKETS”.
12. **Exclusión del historial:** las tareas sueltas no aparecen en el Historial Transversal.
13. **Estado “En proceso”:** el catálogo lo incluye, pero no se encontró en las muestras de tareas sueltas; no debe asumirse que existirá.
14. **Relación de local:** usar `localbi_id`; `tarea_localbi_id` es un placeholder `-1-restaurant.pe-1362`.

---

## 10. Propuesta de implementación

> Esta propuesta no se implementó. Queda a la espera de aprobación.

### Fase 1 — UI de TAREAS con datos ya disponibles (sin backend nuevo)

- Mantener la sección separada de **TICKETS DEV**.
- Mostrar por tarea:
  - `tarea_id` como enlace a Tareabi.
  - Título: `titulo` si es válido; si no, primera línea de `detalle`.
  - Estado con color semántico.
  - Responsable (`"Por asignar"` tratado como no asignado).
  - Local (nombre y `localbi_id`) usando el anidamiento actual.
  - Fechas de solicitud, inicio, fin y tentativa, con `No disponible` explícito.
  - Duración solo si ambas fechas son válidas y `fin >= inicio`.
  - Descripción y conclusión en un detalle expandible.
  - Sprint.
- Contador separado del de TICKETS DEV.
- No inferir ticket relacionado.

### Fase 2 — Enriquecimiento con Tareabi (detalle)

- Al expandir, consultar `GET /api/tareabi/detalle/:tarea_id` (proxy existente).
- Mostrar:
  - `tarea_referencia` (URL o código).
  - `tarea_proyecto`, `tarea_categoria`, `tarea_tipo`, `tarea_etapa`, `tarea_prioridad`.
  - `tarea_comentario`.
  - `localbi` (nombre del local, dominio) como validación.
- Mantener `No disponible` cuando el campo venga `"-"` o vacío.

### Fase 3 — Historial

- Opción recomendada: solicitar al microservicio una ruta de logs por tarea (`POST /obtenerLogsByTareaId/{tarea_id}`) o hacer opcional `ticketbi_id`.
- Opción inmediata verificada: usar el endpoint existente con `ticketbi_id = "0"` y mostrar `logsTarea`.
- Mostrar fecha, persona, acción y cambios.
- No mostrar `logsTicket` (no existe ticket).

### Fase 4 — Consistencia

- Añadir `tareas_sueltas` al Historial Transversal como eventos de área “Desarrollo”, sin mezclarlas con tickets.
- En el drawer de local, separar “Tickets” y “Tareas independientes”.
- Revisar el badge y el conteo para que no se confundan con TICKETS DEV.

### Criterios de aceptación propuestos

1. Cada tarea muestra identificador, título/descripción, estado, responsable, local y fechas.
2. Las tareas sin fecha o sin responsable muestran `No disponible`/`Sin asignar`.
3. No se calcula duración con `fecha_fin < fecha_inicio`.
4. El enlace de la tarea abre el expediente correcto en Tareabi.
5. El detalle expandible muestra todas las tareas y el historial disponible.
6. TICKETS DEV y TAREAS tienen contadores y contenidos independientes.
7. No se duplica ninguna tarea entre ambas secciones.
8. El Historial Transversal incluye las tareas independientes.

---

## 11. Requerimientos técnicos al microservicio

Para eliminar dependencias de comportamiento no documentado y completar los campos faltantes:

1. **Logs por tarea independiente**
   - Ruta oficial tipo `POST /public/rest/tareabi/obtenerLogsByTareaId/{tareabi_id}` o `ticketbi_id` opcional.
   - Hoy funciona con `ticketbi_id = 0`, pero no está documentado.

2. **Fechas canónicas**
   - `created_at` (fecha de creación real, distinta de `fecha_solicitud`).
   - `updated_at` (última actualización).
   - `due_date` (vencimiento formal, distinta de `fecha_tentativa`).
   - `closed_at` (fin real, con validación `>= created_at`).

3. **Observaciones separadas de conclusión**
   - Campo de observaciones y campo de conclusión independientes.

4. **Calidad de datos**
   - Corregir los 52 casos con `fecha_fin < fecha_inicio`.
   - Normalizar títulos `"-"` y responsables `"Por asignar"`.

5. **Relación de local**
   - Confirmar que `localbi_id` es la relación oficial.
   - Descartar `tarea_localbi_id` (placeholder).

6. **Confirmación de estados**
   - Confirmar si `En proceso` y `En pruebas` aplican a tareas independientes o solo a tareas de ticket.

---

## 12. Evidencias técnicas

### Endpoints consultados

| Endpoint | Uso |
|---|---|
| `GET /public/rest/localbi/getHistoriaClinica/{unidad}` | `tareas_sueltas` |
| `GET /public/rest/localbi/getListaUnidadesNegocio` | Universo de unidades |
| `GET /public/rest/tareabi/tareabi/{tarea_id}` | Detalle de tarea independiente |
| `POST /public/rest/tareabi/obtenerLogsByTareaIdAndTicketId/{tarea_id}/0` | Historial de tarea independiente |
| `GET /public/rest/tareabi/obtenerDatosEstaticos` | Catálogo de estados y desarrolladores |

### Evidencia de base de datos

```sql
-- No existen tablas/vistas de Tareabi en COPE
SELECT table_schema, table_name, table_type
FROM information_schema.tables
WHERE table_name ILIKE '%tarea%' OR table_name ILIKE '%ticket%' OR table_name ILIKE '%localbi%';
-- Resultado: Whaticket, estado_actual_tickets, qd_relaciones_ticket (ninguna es Tareabi)

-- v_unificado_norm no contiene campos de tareas
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'v_unificado_norm'
  AND (column_name ILIKE '%tarea%' OR column_name ILIKE '%ticket%' OR column_name ILIKE '%localbi%');
-- Resultado: ticket_id, localbi_id, tickets_created_at, tickets_updated_at
```

### Evidencia de pass-through

```ts
// backend/src/integrations/localbi/services/LocalbiService.ts
private classifyEnvelope<T>(envelope: LocalbiEnvelope<T>): LocalbiResult<T> {
  const tipo = String(envelope.tipo ?? "3");
  if (tipo === "1") return { status: "success", data: envelope.data };
  // ...
}
```

### Evidencia de UI

```tsx
// frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx
{tareasSueltas.map((ta) => (
  <div key={ta.tarea_id} ...>
    <span ...>{ta.titulo || "—"}</span>
    <span ...>{ta.estado}</span>
  </div>
))}
```

### Evidencia de aplanado

```ts
// frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts
const tareasSueltas = locales.flatMap((l) => l.tareas_sueltas ?? []);
```

El objeto resultante ya no conserva `local` ni `localbi_id`.

---

## 13. Restricciones respetadas

- No se modificó ningún archivo de código.
- No se modificaron endpoints ni consultas.
- No se modificaron datos.
- No se crearon tablas ni registros.
- No se inventaron campos, relaciones ni estados.
- No se asumió que las tareas independientes pertenecen a tickets.
- La auditoría se basó en respuestas reales de LocalBI/Tareabi y en el esquema real de PostgreSQL.

---

## 14. Conclusión

La sección TAREAS tiene una fuente sólida y suficiente para convertirse en un seguimiento completo de tareas independientes. El problema actual no es de datos: es de **presentación y alcance**. La fuente ya entrega 13 campos, Tareabi aporta detalle e historial, y la relación con el local es verificable. La implementación propuesta puede hacerse sin inventar información y sin mezclar estas tareas con TICKETS DEV.

**Estado:** auditoría finalizada. Pendiente de aprobación para iniciar la implementación.
