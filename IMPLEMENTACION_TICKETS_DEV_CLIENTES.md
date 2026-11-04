# Implementación — TICKETS DEV en Clientes COPE

## 1. Alcance

Se rediseñó la sección antes llamada “Tickets” dentro de `/clientes` como **TICKETS DEV**, exclusiva de tickets de desarrollo (LocalBI → Tareabi). No se mezcló con atenciones de COPE ni con incidencias de Soporte en Línea.

Se implementó:

- Cambio de encabezado a **TICKETS DEV** conservando el contador.
- Tarjetas con número, referencia, título, detalle, estado, desarrollador, fechas y tiempos.
- Reglas de tiempo para tickets abiertos, completados y sin fecha de finalización.
- Enlace del número al expediente oficial del microservicio.
- Detalle expandible con descripción, estado, desarrollador, fechas, referencia, todas las tareas e historial.
- Tipos y DTOs ampliados con campos reales ya presentes en las respuestas.

No se crearon tablas ni endpoints nuevos.

---

## 2. Investigación de fuentes (previa a implementar)

### 2.1 LocalBI — Historia Clínica

- Endpoint real: `GET {LOCALBI_BASE_URL}/public/rest/localbi/getHistoriaClinica/{unidad_negocio}`.
- Proxy COPE: `GET /api/localbi/historia/:unidad`.
- Es la fuente de los tickets y sus tareas.

Campos reales del ticket:

| Campo LocalBI | Uso en la UI |
|---|---|
| `ticket_id` | Número de ticket |
| `titulo` | Referencia externa (código; `-` si no existe) |
| `tipo`, `subcategoria` | Clasificación |
| `estado` | Estado propio del ticket |
| `fecha_creacion` | Fecha de creación |
| `fecha_solucion` | Fecha de finalización (frecuentemente vacía) |
| `fecha_limite_sla` | SLA (no se usa como finalización) |
| `area_responsable` | Área (se muestra aparte del desarrollador) |
| `observaciones` | Observación / conclusión |
| `tareas[]` | Tareas asociadas |

Campos reales de la tarea:

| Campo LocalBI | Uso en la UI |
|---|---|
| `tarea_id` | Identificador de tarea y enlace al microservicio |
| `estado` | Estado de la tarea |
| `responsable` | Desarrollador asignado |
| `detalle` | Descripción funcional/técnica |
| `conclusion` | Conclusión de la tarea |
| `fecha_inicio`, `fecha_fin`, `fecha_solicitud` | Fechas de la tarea |
| `sprint` | Sprint |

### 2.2 Tareabi — microservicio de desarrollo

- Base: `https://microservices.restaurant.pe/backendrestaurantpe`.
- Prefijo: `/public/rest/tareabi`.
- Sin token (API pública).

Rutas verificadas:

| Método | Ruta | Uso |
|---|---|---|
| `GET` | `/public/rest/tareabi/tareabi/{tareabi_id}` | Detalle de tarea (incluye `tarea_referencia`, `tarea_dev`, `tarea_descripcion`, `tarea_fechainicio`, `tarea_fechafin`, `ticketbi_id`) |
| `POST` | `/public/rest/tareabi/obtenerLogsByTareaIdAndTicketId/{tareabi_id}/{ticketbi_id}` | Estado del ticket + historial de cambios de la tarea |
| `GET` | `/public/rest/tareabi/obtenerDatosEstaticos` | Catálogos (no usado aquí) |

Proxy COPE ya existente:

- `POST /api/tareabi/logs/:tareabiId/:ticketbiId`
- `GET /api/tareabi/detalle/:tareabiId`

### 2.3 Hallazgos críticos de identificación

1. **No existe una ruta GET por `ticketbi_id` solo.**
   - Probado: `POST .../obtenerLogsByTareaIdAndTicketId/0/{ticket}` → `"Tarea es requerido"`.
   - Por tanto, todo acceso al microservicio exige un `tareabi_id` real.

2. **`ticket_id` NO es `tareabi_id`.**
   - Probado: `GET /tareabi/23301` devuelve `tareabi_id: 23301` pero `ticketbi_id: 17268` (otro ticket).
   - El enlace usa exclusivamente el `tarea_id` que entrega LocalBI.

3. **No hay UI web ni URL directa del ticket.**
   - La base del microservicio es una API REST; `tareabi.restaurant.pe` respondió `503`.
   - La respuesta de LocalBI/Tareabi no incluye un campo `url`/`link` del ticket.

4. **El estado del ticket sí existe y es propio.**
   - Se usa `ticket.estado` (LocalBI), no el estado de la tarea.
   - El estado de la tarea se muestra solo dentro de cada tarea.

### 2.4 TicketBI

- `POST /public/rest/common/ticketbi/ticketbi` es solo de **creación**.
- No se encontró una ruta de lectura de tickets por ID.
- No se usó para esta sección.

---

## 3. Archivos modificados

### Backend

| Archivo | Cambio |
|---|---|
| `backend/src/integrations/tareabi/types/index.ts` | DTO de logs con `referencia`, `descripcion`, `fecha_inicio`, `fecha_fin` |
| `backend/src/integrations/tareabi/services/TareabiService.ts` | Normaliza esos campos desde `logtabla_valoractual` y llena `responsable` con `tarea_dev` |
| `backend/src/integrations/localbi/types/index.ts` | Tipos de tarea con fechas reales (`fecha_inicio`, `fecha_fin`, `fecha_solicitud`, etc.) |

### Frontend

| Archivo | Cambio |
|---|---|
| `frontend/src/modules/localbi/components/secciones/TicketsDev.tsx` | **Nuevo** componente de la sección TICKETS DEV |
| `frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx` | Reemplaza la sección “Tickets” y elimina el componente anterior |
| `frontend/src/modules/localbi/types/localbi.ts` | Tipos de tarea con fechas reales |
| `frontend/src/modules/tareabi/types.ts` | `TareabiTareaLog` con referencia, descripción y fechas |
| `frontend/src/modules/tareabi/hooks/useTareabi.ts` | `useTareabiLogsMulti` para leer todas las tareas |
| `frontend/src/modules/tareabi/index.ts` | Exporta el nuevo hook |
| `frontend/src/config/env.ts` | `tareabiApiUrl` configurable |
| `frontend/.env.example` | `VITE_TAREABI_API_URL` |

### Evidencias

- `docs/captures/tickets-dev-grupo-ngh.png` (abiertos, en proceso y completados)
- `docs/captures/tickets-dev-marys.png` (completados con referencia, sin tareas)
- `docs/captures/tickets-dev-multitarea.png` (3 tareas + historial)
- Snapshots HTML equivalentes.

---

## 4. Reglas de tiempo implementadas

| Caso | Comportamiento |
|---|---|
| Ticket abierto / en proceso | Muestra **Tiempo transcurrido** desde `fecha_creacion` hasta ahora. Se refresca cada 60 s mientras la ficha está abierta. |
| Ticket completado con `fecha_solucion` | Muestra **Fecha de finalización** y **Tiempo total de resolución**. Ej.: “Mismo día” o “2 días, 4 horas”. |
| Ticket completado sin `fecha_solucion` | Muestra **No disponible** en finalización y tiempo total. No se infiere desde las tareas. |
| Ticket sin fecha de finalización | No se calcula duración final ni se inventa fecha. |

Formato de duración: `X días, Y horas` / `X horas, Y min` / `Y min`. Si solo hay fechas sin hora y ambas coinciden, se muestra `Mismo día` para no inventar precisión.

---

## 5. Enlace al microservicio

### Comportamiento

- El número de ticket abre en una pestaña nueva:
  `{VITE_TAREABI_API_URL}/tareabi/{tarea_id}`
  con `VITE_TAREABI_API_URL` por defecto:
  `https://microservices.restaurant.pe/backendrestaurantpe/public/rest/tareabi`.
- Se usa el `tarea_id` real de la primera tarea del ticket.
- Cada tarea del detalle tiene además su propio enlace `Tarea #{tarea_id}`.
- `target="_blank"` + `rel="noopener noreferrer"` conserva el contexto del cliente en COPE.
- Si el ticket no tiene tareas, el número no es enlace y se indica el motivo; no se inventa una URL.

### Validación de correspondencia

Se comprobó que el enlace devuelve el ticket correcto (`tareabi_id` de entrada → `ticketbi_id` de salida):

| Cliente | Ticket | Tarea enlazada | `ticketbi_id` devuelto | Correcto |
|---|---|---|---:|---|
| GRUPO NGH | 23301 | 34525 | 23301 | ✅ |
| GRUPO NGH | 23444 | 34821 | 23444 | ✅ |
| GRUPO NGH | 22314 | 32000 | 22314 | ✅ |
| GRUPO NGH | 24386 | 38374 | 24386 | ✅ |
| GRUPO NGH | 24040 | 37053 | 24040 | ✅ |
| GRUPO NGH | 24073 | 37188 | 24073 | ✅ |
| GRUPO NGH | 24574 | 39165 | 24574 | ✅ |
| GRUPO NGH | 25231 | 42443 | 25231 | ✅ |
| Bar El Anzuelo | 15825 | 20411 | 15825 | ✅ |

También se abrió en navegador `.../tareabi/20411` y devolvió `ticketbi_id: 15825`.

---

## 6. Escenarios validados

| # | Escenario | Caso real | Resultado |
|---|---|---|---|
| 1 | Completado con creación y finalización | RESTAURANT MARY'S #427, #1082 | Fechas + “Mismo día” |
| 2 | Abierto sin finalización | GRUPO NGH #22314 | “335 días, 12 horas” |
| 3 | En proceso con desarrollador | GRUPO NGH #24040 | Pendiente + Cesar + tiempo |
| 4 | Sin desarrollador asignado | RESTAURANT MARY'S (sin tareas) | “Sin asignar” |
| 5 | Varias tareas | Bar El Anzuelo #15825 | 3 tareas, 3 desarrolladores, historial |
| 6 | Sin tareas asociadas | RESTAURANT MARY'S #427 | “Sin tareas asociadas” |
| 7 | Sin referencia | GRUPO NGH (todos) | No se muestra badge |
| 8 | Información parcial | RESTAURANT MARY'S #6261 | “No disponible” explícito |
| 9 | Sin tickets | 037 Bar Restaurant | “Sin tickets de desarrollo registrados” |

Consola del navegador: sin errores en todos los casos.
Peticiones de logs: 3 tareas → 3 solicitudes (sin duplicados).

---

## 7. Campos disponibles y campos faltantes

### Disponibles

- Número, referencia externa, clasificación, estado del ticket.
- Descripción (desde tareas).
- Desarrollador (desde tareas).
- Fecha de creación, fecha de finalización (si existe).
- Tareas e historial de cambios.
- Referencias de tarea (URL/código).

### Faltantes en las fuentes actuales

| Dato | Situación | Fuente que debe proporcionarlo |
|---|---|---|
| Descripción a nivel de ticket | No está en el ticket de LocalBI; solo en `tareas[].detalle` o en `tickectbi_resumen` de los logs | Microservicio: exponer `ticketbi_resumen` en la lectura del ticket |
| Desarrollador a nivel de ticket | Solo existe por tarea (`tarea_dev`/`responsable`) | Microservicio: `ticketbi_dev` o tarea activa canónica |
| Fecha real de finalización del ticket | `fecha_solucion` suele venir vacía; no hay `ticketbi_fechafin` | Microservicio: `ticketbi_fechafin`/`ticketbi_fechacierre` |
| Última actualización del ticket | Se calcula desde logs de tareas | Microservicio: `ticketbi_fechaactualizacion` |
| URL/expediente del ticket | No hay campo `url` ni ruta GET por `ticketbi_id` | Microservicio: ruta GET de ticket + URL estable |
| Tickets sin tareas | No se puede consultar Tareabi (exige `tarea_id`) | Microservicio: permitir consulta por `ticketbi_id` |

---

## 8. Requerimiento técnico al microservicio

Para completar los casos que hoy quedan como “No disponible” y para enlazar **todos** los tickets (incluidos los que no tienen tareas), se requiere:

1. **Lectura de ticket por ID**
   - `GET /public/rest/tareabi/ticket/{ticketbi_id}` (o equivalente) que devuelva:
     - cabecera del ticket: `ticketbi_id`, `ticketbi_resumen`, `ticketbi_estado`, `ticketbi_dev`, `ticketbi_fecha`, `ticketbi_fechafin`, `ticketbi_fechaactualizacion`, `ticketbi_ticket`;
     - todas las tareas asociadas.
   - Con esa ruta, el número de ticket podría enlazar al ticket completo incluso sin tareas, sin depender de `tareas[0]`.

2. **URL estable del ticket**
   - Devolver en la respuesta un campo `ticketbi_url` (o publicar una ruta web) para abrir el expediente del ticket directamente.

3. **Fecha de finalización real**
   - Exponer `ticketbi_fechafin`/`ticketbi_fechacierre`, distinta de `ticketbi_fechatentativasolucion` (SLA).

Mientras esas rutas/campos no existan, la implementación actual:

- usa la ruta oficial verificada por `tareabi_id`;
- muestra “No disponible” en lugar de inventar;
- deja constancia de los tickets sin tarea enlazable.

---

## 9. Validaciones técnicas

| Validación | Resultado |
|---|---|
| TypeScript backend | Limpio |
| TypeScript frontend | Limpio |
| Build backend | Correcto |
| Build frontend | Correcto |
| Pruebas backend | **519/519** |
| Consola frontend | Sin errores |
| Correspondencia de enlaces | 9/9 correctos |
| Solicitudes de logs por ticket | Sin duplicados |
| `/atenciones` compacta | Sin cambios |

---

## 10. Restricciones respetadas

- No se modificó la lógica de Actividad en COPE.
- No se mezclaron tickets de desarrollo con incidencias de soporte.
- No se alteró la información original de LocalBI ni Tareabi.
- No se inventaron desarrolladores, fechas, referencias ni estados.
- No se usó `area_responsable` como desarrollador.
- No se usó el estado de una tarea como estado del ticket.
- No se eliminaron tickets incompletos.
- No se modificó la presentación compacta de `/atenciones`.
- No se crearon tablas ni endpoints nuevos.
