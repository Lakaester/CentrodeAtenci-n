# Rediseño visual y corrección de overflow — TICKETS DEV

**Fecha:** 4 de noviembre de 2026.
**Alcance:** TICKETS DEV de `/clientes`.
**Estado:** implementado y validado. Sin commit ni push.

---

## 1. Resumen

Se homologó la presentación de TICKETS DEV con el diseño de TAREAS independientes y se corrigió el desbordamiento de textos largos, tomando como caso principal **#19437** (Grupo Pardos Chicken · Pardos Bellavista).

Se implementó:

- Encabezado con chips de estados reales y cantidades.
- Filtros por estado, desarrollador, área responsable y búsqueda.
- Tarjetas con la jerarquía visual de TAREAS.
- Referencia y título sin duplicación.
- Detalle expandible con descripción, observaciones, tareas, desarrolladores, referencias e historial.
- Reglas de wrapping para todos los textos.
- Corrección verificada de overflow en #19437 y en tickets con referencias/descripciones largas.

No se modificaron TAREAS, endpoints, contratos, datos, `TareabiService` ni `/atenciones`.

---

## 2. Archivos modificados

| Archivo | Cambio |
|---|---|
| `frontend/src/modules/localbi/components/secciones/TicketsDev.tsx` | Rediseño, filtros, chips, layout y corrección de overflow |

Sin otros cambios de código. Se reutilizaron helpers de `frontend/src/modules/localbi/utils/tareasFechas.ts` **sin modificarlo**.

---

## 3. Encabezado y filtros

### Encabezado

- Título **TICKETS DEV** y total original (`tickets.length`).
- Chips con estados reales del ticket y cantidades:
  - Grupo Pardos Chicken: `Pendiente · 97`, `Completo · 96`, `Proceso · 8`, `Rechazado · 4`.
  - GLOBAL FUEL: `Completo · 157`, `Pendiente · 13`, `Rechazado · 13`.
- Sin estados en cero ni estados inventados.
- Chips clicables para filtrar por estado.
- El estado mostrado es siempre `ticket.estado`; nunca el estado de una tarea.

### Filtros

- Búsqueda por número de ticket, referencia/título y descripción de tareas.
- Estado.
- Desarrollador: un ticket con varias tareas coincide si cualquiera de sus desarrolladores coincide.
- Área responsable.
- Botón **Limpiar**.
- Contador `Mostrando X de Y tickets`.
- Filtros en memoria; no alteran la consulta ni los datos.

### Referencia vs título

No se clasifica cualquier texto corto como referencia. Se aplica:

- URL (`http/https`) → referencia.
- Código sin espacios, de hasta 40 caracteres y con al menos un dígito → referencia.
- Cualquier otro texto → título. Ante ambigüedad, se conserva como título.

Resultado en **#19437**: su `titulo` es un párrafo largo, por lo que **ya no se muestra como `Ref.`**; se presenta como título/descripción. Los tickets con referencias cortas (por ejemplo `#427` → `Ref. 7473`) mantienen su badge compacto.

---

## 4. Tarjeta

### Encabezado

- `#ticket_id` como enlace externo, usando el `tarea_id` real.
- Badge del estado del ticket.
- Área responsable visible y separada del desarrollador.
- Tipo y subcategoría.
- Referencia verificada, en badge compacto que envuelve texto y no desborda.

### Información principal

- Título con hasta 3 líneas.
- Descripción resumida con hasta 3 líneas.
- Botón **Ver detalle completo** como acción explícita para el contenido completo.
- Desarrollador asignado.
- Fecha de creación.
- Fecha de finalización solo si existe.
- Tiempo transcurrido o duración registrada.
- Tickets sin tareas: visibles, sin enlace y con `Sin detalle disponible`.

### Detalle expandible

- Descripción completa.
- Observaciones / conclusión del ticket.
- Todas las tareas relacionadas.
- Desarrollador de cada tarea.
- Fechas por tarea.
- Referencias de tarea (URLs envueltas).
- Conclusión de cada tarea.
- Historial de cambios.
- Mensajes de carga/error de Tareabi.

---

## 5. Corrección de overflow

### Diagnóstico #19437 (antes)

| Métrica | Valor |
|---|---:|
| Ancho de la tarjeta | 569 px |
| `scrollWidth` de la tarjeta | **1,399 px** |
| Ancho del badge `Ref.` | **1,294 px** |
| Desbordamiento | **Sí** |

Causas:

1. `ticket.titulo` es un párrafo largo y se trataba como referencia.
2. El bloque izquierdo del encabezado usaba `shrink-0`.
3. `Dato` y `Referencia` usaban `truncate`.
4. El título y la referencia podían duplicar el mismo texto.

### Resultado después

| Caso | Tarjeta `clientWidth` | Tarjeta `scrollWidth` | Overflow |
|---|---:|---:|---|
| #19437 | 511 | 511 | **No** |
| #427 | 511 | 511 | **No** |
| #21043 | 511 | 511 | **No** |
| #15825 | 511 | 511 | **No** |
| Página completa | — | — | **No** |

### Reglas aplicadas

- `min-w-0`, `max-w-full` en tarjeta, encabezado, grids y valores.
- `white-space: normal`.
- `overflow-wrap: anywhere`.
- `word-break: normal` (predeterminado).
- Sin `truncate` en títulos, descripciones, referencias, desarrolladores, áreas ni historial.
- Referencias en bloque compacto con `w-fit`, `flex-wrap` y `max-w-full`.
- Metadatos apilados en pantallas estrechas y en dos columnas desde `md`.
- Descripción y título con `line-clamp-3` y acción explícita **Ver detalle completo**.
- Historial con chips `inline-block max-w-full whitespace-normal break-words`.

### Responsividad

- Verificado a 1366×768 y 1440×900.
- La tarjeta aumenta de altura, no de ancho.
- Sin scroll horizontal de página.

---

## 6. Validaciones funcionales

| # | Caso | Evidencia | Resultado |
|---|---|---|---|
| 1 | Ticket completo | #19437 / #427 | Estado, área, fechas y detalle correctos |
| 2 | Ticket pendiente | #21043 (GLOBAL FUEL) | `Tiempo transcurrido: 417 días, 16 horas` |
| 3 | Sin desarrollador | #427 | `Sin asignar` |
| 4 | Sin referencia | #19437 | Sin badge `Ref.`; título largo envuelto |
| 5 | Sin tareas | #427 | Visible, sin enlace, `Sin detalle disponible` |
| 6 | Múltiples tareas | #15825 | 3 tareas y 3 desarrolladores |
| 7 | Filtros combinados | Pardos Bellavista | `1 de 205` con estado + desarrollador + área + búsqueda |
| 8 | Enlace al microservicio | #19437 | `.../tareabi/26769`, `target="_blank"`, `rel="noopener noreferrer"` |
| 9 | Historial | #19437 / #15825 | Cambios visibles y envueltos |
| 10 | Tiempos y fechas | #427 / #21043 / #19437 | `Mismo día`, transcurrido y `No disponible` |

### Filtros probados

| Prueba | Resultado |
|---|---|
| Buscar `19437` | `Mostrando 1 de 205 tickets` |
| Chip `Pendiente · 97` | `Mostrando 97 de 205 tickets` |
| Estado + desarrollador + área + búsqueda | `Mostrando 1 de 205 tickets` |
| Limpiar | `Mostrando 205 de 205 tickets` |

### Totales antes/después

| Cliente | Antes | Después |
|---|---:|---:|
| Grupo Pardos Chicken | 205 | **205** |
| GLOBAL FUEL | 183 | **183** |
| RESTAURANT MARY'S | 6 | **6** |
| Bar Y Restaurante El Anzuelo | 1 | **1** |

Los totales no cambiaron.

---

## 7. Validaciones técnicas

| Validación | Resultado |
|---|---|
| TypeScript frontend | Limpio |
| TypeScript backend | Limpio |
| Build frontend | Correcto |
| Build backend | Correcto |
| Pruebas backend | **519/519** |
| Smoke test `/atenciones` | Correcto, sin errores de consola |

---

## 8. Capturas

| Archivo | Contenido |
|---|---|
| `tickets-dev-antes-19437.png` | Estado anterior: `Ref.` largo desbordando la tarjeta |
| `tickets-dev-despues-19437-1366.png` | Nuevo layout a 1366 px |
| `tickets-dev-despues-19437-1440.png` | Nuevo layout a 1440 px |
| `tickets-dev-despues-19437-1366-alto.png` | Tarjeta completa con título envuelto |
| `tickets-dev-despues-19437-1440-alto.png` | Tarjeta completa a 1440 px |
| `tickets-dev-detalle-19437.png` | Detalle expandido con tareas e historial |
| `tickets-dev-listing-marys.png` | Listado con chips, filtros, referencias cortas y tickets sin tareas |

Snapshots HTML equivalentes en `docs/captures/`.

---

## 9. Restricciones respetadas

- No se modificó TAREAS.
- No se modificaron endpoints ni contratos API.
- No se modificó `TareabiService` en esta tarea.
- No se alteraron datos ni contadores.
- No se modificó la variante compacta de `/atenciones`.
- No se cambió la navegación al microservicio.
- No se cambió la estructura ni las asociaciones de TICKETS DEV.

---

## 10. Estado de versionado

- Sin commit.
- Sin push.
- Cambios en el árbol de trabajo para revisión.
