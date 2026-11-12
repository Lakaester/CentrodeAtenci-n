# Implementación — TAREAS independientes en `/clientes`

**Fecha:** 4 de noviembre de 2026.
**Base:** `AUDITORIA_TAREAS_CLIENTES.md`.
**Alcance:** sección TAREAS de la ficha de cliente, separada de TICKETS DEV.
**Estado:** implementado y validado. Sin commit ni push.

---

## 1. Resumen

Se convirtió TAREAS en un panel de seguimiento de actividades independientes asociadas a los locales del cliente.

Se implementó:

- Conservación de `localbi_id`, nombre del local y dominio por tarea.
- Listado con identificador, título, estado, responsable, local, fechas, sprint y detalle resumido.
- Filtros por local, estado, responsable y búsqueda por título/identificador.
- Encabezado con total y resumen por estados reales.
- Detalle expandible con campos de Tareabi y historial de cambios.
- Reglas explícitas para fechas ausentes e inconsistentes.
- Integración de tareas independientes al Historial Transversal como área **Tarea**.
- Separación total de TICKETS DEV.

No se modificó la presentación compacta de `/atenciones`, no se crearon tablas ni endpoints, y no se alteraron datos.

---

## 2. Archivos modificados

### Frontend

| Archivo | Cambio |
|---|---|
| `frontend/src/modules/localbi/types/localbi.ts` | Nuevo tipo `TareaIndependiente` con `localbi_id`, `local_nombre` y `dominio` |
| `frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts` | Construye `tareasIndependientes` conservando el local; añade eventos transversales |
| `frontend/src/modules/localbi/components/secciones/TareasIndependientes.tsx` | **Nuevo** componente: encabezado, filtros, tarjetas, detalle e historial |
| `frontend/src/modules/localbi/utils/tareasFechas.ts` | **Nuevo**: parseo de fechas, duración, estados finales y reglas de calidad |
| `frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx` | Renderiza `TareasIndependientes`; TICKETS DEV intacto |
| `frontend/src/modules/localbi/components/secciones/HistorialTransversalSeccion.tsx` | Color semántico para el área `Tarea` |
| `frontend/src/modules/tareabi/types.ts` | Campos reales de `TareabiDetalleTarea` (solo tipos) |

### Backend

| Archivo | Cambio |
|---|---|
| `backend/src/integrations/tareabi/services/TareabiService.ts` | Guarda defensiva cuando `logsTicket` viene vacío (tareas sin ticket) |

> **Desviación necesaria:** el plan aprobado indicaba “sin cambios de backend”. El proxy COPE fallaba con `Cannot read properties of undefined (reading 'logtabla_valoractual')` al consultar historial de tareas independientes, porque `logsTicket` llega vacío. El microservicio sí devuelve `logsTarea`; el defecto estaba en el proxy. Se aplicó una corrección mínima de una condición. No cambia contratos, endpoints ni datos; el comportamiento de tareas de ticket permanece igual. Sin esta corrección, el historial de TAREAS no podía cargarse.

### Evidencias

- `docs/captures/tareas-listing-global-fuel.png` + `.html`
- `docs/captures/tareas-detalle-40082.png` + `.html`
- `docs/captures/tareas-inconsistente-40237.png` + `.html`
- `docs/captures/tareas-sin-datos-27855.png` + `.html`

---

## 3. Fase 1 — Estructura y asociación

### Modelo

```ts
export interface TareaIndependiente extends LocalbiTarea {
  localbi_id: string;
  local_nombre: string;
  dominio: string;
}
```

### Construcción

```ts
const tareasIndependientes: TareaIndependiente[] = locales.flatMap((l) =>
  (l.tareas_sueltas ?? []).map((t) => ({
    ...t,
    localbi_id: l.localbi_id,
    local_nombre: l.nombre,
    dominio: l.dominio,
  })),
);
```

- La relación se conserva por `localbi_id`.
- No se usa `tarea_localbi_id` (placeholder).
- La clave de render es `${localbi_id}-${tarea_id}`.
- El total coincide con la suma de `tareas_sueltas` de LocalBI.

---

## 4. Fase 2 — Listado, encabezado y filtros

### Encabezado

- Título **TAREAS** y badge con el total.
- Resumen por estados reales: `Completo · 24`, `Rechazado - Mal analisis · 1`, etc.
- Los chips son clicables para filtrar por estado.
- Sin estados en cero ni contadores inventados.
- Si no hay tareas: `Sin tareas independientes registradas`.

### Filtros

- **Local:** por `localbi_id`, mostrando el nombre del local.
- **Estado:** estados reales presentes.
- **Responsable:** responsables reales; `Por asignar` se muestra tal cual.
- **Búsqueda:** por título o `tarea_id`.
- **Limpiar:** aparece cuando hay filtros activos.
- Contador `Mostrando X de Y tareas`.

### Tarjeta

- `#tarea_id` como enlace externo a Tareabi.
- Sprint.
- Estado con badge semántico.
- Local asociado.
- Título: `titulo` si es válido; si no, primera línea de `detalle`; si no, `Tarea #id`.
- Responsable (`Sin asignar` si el valor está vacío; `Por asignar` se conserva).
- Fechas: solicitud, inicio, tentativa, fin registrado.
- Tiempo: duración, transcurrido, inconsistencia o “No disponible”.
- Detalle resumido a 2 líneas.
- Botón `Ver detalle`.

---

## 5. Fase 3 — Detalle e historial Tareabi

### Endpoints utilizados

| Endpoint | Uso |
|---|---|
| `GET /api/tareabi/detalle/:tareabi_id` | Detalle de la tarea |
| `POST /api/tareabi/logs/:tareabi_id/0` | Historial de la tarea independiente |

El detalle muestra, solo si existe:

- Referencia (URL o código; múltiples URLs se muestran como enlaces separados).
- Proyecto.
- Categoría.
- Tipo.
- Etapa.
- Prioridad.
- Responsable.
- Registrado por.
- Fechas.
- Descripción.
- Conclusión.
- Comentario de Tareabi.
- Historial de cambios.

Al pie se indica: **“Tarea independiente · Sin ticket asociado”**.

Si Tareabi falla, se conservan los datos de LocalBI y se muestra un aviso discreto. El historial se consulta al expandir, no en la vista inicial.

---

## 6. Fase 4 — Fechas y calidad de datos

| Caso | Comportamiento |
|---|---|
| Sin `fecha_inicio` | `No disponible` |
| Sin `fecha_tentativa` | `No disponible`; no se inventa vencimiento |
| `fecha_fin < fecha_inicio` | Badge **“Fechas inconsistentes”**; no se calcula duración |
| No finalizada con inicio válido | Tiempo transcurrido desde inicio, actualizado cada 60 s |
| No finalizada sin inicio | `No disponible (sin inicio)` |
| Finalizada con fechas válidas | **Duración registrada** inicio → fin |
| Finalizada sin fin | `No disponible (sin fin registrado)` |
| Sin fechas | `No disponible` |

- `fecha_fin` se etiqueta como **“Fin registrado”**, no como cierre definitivo.
- La finalización usa el catálogo verificado `estadosFinalesList` de Tareabi.
- Los estados desconocidos se muestran con color neutro; no se crean estados.
- Las tareas con información incompleta siguen visibles.

---

## 7. Fase 5 — Historial Transversal

- Cada tarea independiente genera un evento con:
  - Área: **Tarea**.
  - Título: `#id · título`.
  - Detalle: `local · responsable`.
  - Fecha y estado.
- Fecha de orden: `fecha_fin` válida → `fecha_inicio` → `fecha_solicitud`.
- Si no hay una fecha confiable, no se genera el evento.
- No se incluyen tareas de ticket, por lo que no hay duplicados con TICKETS DEV.
- Se mantiene el tope existente de 40 eventos.

---

## 8. Validaciones realizadas

### 8.1 Escenarios funcionales

| # | Escenario | Caso real | Resultado |
|---|---|---|---|
| 1 | Todos los campos | GLOBAL FUEL · 40082 | Referencia, proyecto, categoría, tipo, etapa, prioridad, dev, fechas, descripción, conclusión e historial |
| 2 | Sin responsable | San Blas · 27855 / Tingo · 32191 | `Por asignar` visible; no se inventa responsable |
| 3 | Sin fechas | Central Park · 19557 / San Blas · 27855 | Inicio y fin `No disponible`; tiempo `No disponible (sin inicio)` |
| 4 | Fechas inconsistentes | Macchia · 40237 | Badge “Fechas inconsistentes”; sin duración |
| 5 | Completada | GLOBAL FUEL · 30895 / 40082 | Duración registrada correcta |
| 6 | Pendiente | San Blas · 27855 | Estado Pendiente; sin fechas |
| 7 | En pausa | Macchia · 40237 | Estado En pausa; inconsistencia detectada |
| 8 | Subida a producción | Central Park · 19557 | Estado Subido a Producción; sin fechas |
| 9 | Sin descripción | INFUSIONISTA · Cachina Bar · 19350 | Título `Tarea #19350`; sin bloque de descripción |
| 10 | Local con múltiples tareas | GLOBAL FUEL · Dark Kitchen (18) | Todas las tareas conservan su local |

### 8.2 Filtros

| Prueba | Resultado |
|---|---|
| Local `PRUEBAS TCI` | `Mostrando 2 de 26 tareas`; ambas con local correcto |
| Estado `Rechazado - Mal analisis` | `Mostrando 1 de 26 tareas`; #40231 visible |
| Búsqueda `40231` | `Mostrando 1 de 26 tareas` |
| Limpiar | Vuelve a `Mostrando 26 de 26 tareas` |

### 8.3 Totales y locales

| Cliente | LocalBI | Pantalla |
|---|---:|---:|
| GLOBAL FUEL | 26 | 26 |
| Macchia | 7 | 7 |
| Restaurante San Blas | 1 | 1 |
| 037 Bar Restaurant | 0 | “Sin tareas independientes registradas” |

GLOBAL FUEL conserva 4 locales:
- Centro De Producción - Dark Kitchen: 18
- Punche Pezet: 5
- PRUEBAS TCI: 2
- PUNCHE ESPINAR: 1

### 8.4 Tareabi

| Tarea | Detalle | Historial |
|---|---|---|
| 40082 | OK | 2 entradas |
| 40237 | OK | 5 entradas |
| 32191 | OK | 1 entrada |
| 27855 | OK | 0 entradas → “Sin historial” |

### 8.5 Historial Transversal

- GLOBAL FUEL muestra eventos de área **Tarea**, por ejemplo `#40198`.
- El detalle del evento incluye `Punche Pezet · Davis` y estado `Completo`.
- Macchia muestra el evento `#40239` junto a eventos de Desarrollo/Soporte.
- No se duplican tareas de TICKETS DEV.

### 8.6 Regresiones

- TICKETS DEV: sin cambios; GLOBAL FUEL mantiene 183 tickets y San Blas 2.
- `/atenciones` compacta: carga correcta (121 botones, sin errores de consola).
- Consola del navegador: sin errores en las pruebas de TAREAS.

---

## 9. Validaciones técnicas

| Validación | Resultado |
|---|---|
| TypeScript backend | Limpio |
| TypeScript frontend | Limpio |
| Build backend | Correcto |
| Build frontend | Correcto |
| Pruebas backend | **519/519** |
| Smoke test `/atenciones` | Correcto, sin errores |

---

## 10. Capturas

| Archivo | Contenido |
|---|---|
| `tareas-listing-global-fuel.png` | Listado, resumen por estados, filtros y tarjetas con local/fechas |
| `tareas-detalle-40082.png` | Detalle expandido con campos Tareabi e historial |
| `tareas-inconsistente-40237.png` | Fechas inconsistentes, sin duración, y evento Tarea en Historial Transversal |
| `tareas-sin-datos-27855.png` | Tarea pendiente, `Por asignar`, sin fechas, separada de TICKETS DEV |

---

## 11. Restricciones respetadas

- No se modificó TICKETS DEV.
- No se alteró la presentación compacta de `/atenciones`.
- No se crearon tablas PostgreSQL.
- No se crearon endpoints nuevos.
- No se inventaron relaciones, responsables, estados, fechas ni conclusiones.
- No se alteraron datos originales de LocalBI ni Tareabi.
- El drawer de local queda para una fase posterior, según lo aprobado.

---

## 12. Pendientes / follow-ups

- Drawer de local: aún mezcla tareas bajo “TICKETS”; queda para fase posterior.
- Requerimiento al microservicio: ruta oficial de logs por tarea (hoy se usa `ticketbi_id = 0`) y campos canónicos `created_at`, `updated_at`, `due_date`, `closed_at`.
- Calidad de datos: 52 casos con `fecha_fin < fecha_inicio` y títulos `"-"`; la UI ya los protege.

---

## 13. Estado de versionado

- No se realizó commit.
- No se realizó push.
- Los cambios quedan en el árbol de trabajo para revisión.
