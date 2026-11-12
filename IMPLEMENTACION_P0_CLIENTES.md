# Implementación P0 — Auditoría Funcional Clientes COPE

## 1. Alcance

Se implementaron únicamente los hallazgos **P0** aprobados:

- P0.1 Soporte en Línea.
- P0.2 Búsqueda de clientes.
- P0.3 Actualización coordinada.
- P0.4 Asociación de actividad por local.
- P0.5 Navegación a Quejas y Devoluciones.

No se implementaron P1 ni P2. No se crearon tablas ni endpoints nuevos.

---

## 2. Archivos modificados

### Backend

| Archivo | Cambio |
|---|---|
| `backend/src/repositories/soporteOnline.repository.ts` | `esperaN`, `solucionN`, agrupación normalizada de locales y “Sin local asignado” |
| `backend/src/integrations/localbi/services/SoporteOnlineService.ts` | Campos por defecto de los nuevos conteos |
| `backend/src/integrations/localbi/services/LocalbiService.ts` | `totalRegistros` con descubrimientos SQL, deduplicación con `normalizeDomain` |

### Frontend

| Archivo | Cambio |
|---|---|
| `frontend/src/modules/localbi/types/localbi.ts` | Tipos de soporte y `porLocal` |
| `frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts` | Promedios ponderados y `refreshAll` coordinado |
| `frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx` | Uso de `l.local` en “Por local” |
| `frontend/src/modules/localbi/components/secciones/ResumenUnidad.tsx` | Grupo “Sin local asignado”, estado global de Actualizar y errores parciales |
| `frontend/src/modules/quejas-devoluciones/components/QdClienteHistorial.tsx` | Enlace al caso real por ID |
| `frontend/src/pages/quejas-devoluciones/QuejasDevolucionesPage.tsx` | Apertura directa mediante `?caso=<id>` |

### Documentación y capturas

- `IMPLEMENTACION_P0_CLIENTES.md`
- `docs/captures/clientes-p0-grupo-1366.png`
- `docs/captures/clientes-p0-grupo-full.png`
- `docs/captures/clientes-p0-soporte.png`
- `docs/captures/clientes-p0-qd-33671.png`
- Snapshots HTML equivalentes.

---

## 3. Correcciones realizadas

### P0.1 — Soporte en Línea

- El frontend ahora usa el campo real `l.local`; antes usaba `l.nombre` y los nombres aparecían vacíos.
- Los locales se agrupan por nombre normalizado (`trim`, espacios y mayúsculas/minúsculas). Se conserva la variante más frecuente como etiqueta.
- Se añadieron `esperaN` y `solucionN` al resumen de soporte.
- Los promedios del panel ahora son ponderados por cantidad de incidencias con tiempo válido:
  - `Σ(promedio_dominio × n_dominio) / Σ(n_dominio)`.
- Los registros sin `local_nombre` se agrupan como **“Sin local asignado”**.
- Se mantuvieron los períodos 7, 30, 90 y Todo.

### P0.2 — Búsqueda de clientes

- `totalRegistros` ahora considera los resultados directos de LocalBI y los dominios descubiertos por SQL.
- La deduplicación usa `normalizeDomain` en lugar de solo `toLowerCase`.
- Los resultados con dominio y los descubrimientos SQL se consolidan sin duplicados.
- Casos corregidos:
  - `lorenzocafe`: antes 2 resultados / total 0; ahora 2 / 2.
  - `capitalpolleria`: antes 1 / 0; ahora 1 / 1.

### P0.3 — Botón Actualizar

`refreshAll` refresca de forma coordinada:

| Fuente | Query key |
|---|---|
| Ficha | `["localbi","historia",unidad]` |
| Actividad COPE | `["localbi","actividad"]` |
| Actividad por local | `["localbi","actividad-local"]` |
| Soporte | `["localbi","soporte"]` |
| Historia local | `["localbi","historia-local",unidad]` |
| Tareabi | `["tareabi"]` |
| Facturación | `["facturacion","cliente"]` |
| Q/D | `["quejas-devoluciones","lista"]` |

- Se usa `refetchQueries` sobre las claves existentes, sin duplicar consultas.
- El botón se deshabilita mientras actualiza y muestra “Actualizando…”.
- Si alguna consulta termina en error, se muestra “No se pudo actualizar: …”.
- No se muestra un mensaje de éxito.
- Las secciones que nunca se abrieron no tienen consulta en caché; se cargan al abrirlas.

### P0.4 — Actividad por local

- Las atenciones con `localbi_id` se mantienen asignadas al local.
- Las atenciones con `localbi_id` nulo se conservan como actividad del dominio.
- La tabla Dominios y locales muestra una fila explícita **“Sin local asignado”**.
- No se infiere ni se inventa un local.
- La suma de locales + sin local coincide con el total por dominio.

### P0.5 — Navegación a Q/D

- `QdClienteHistorial` enlaza a:
  `"/gestion/quejas-devoluciones?caso=<id>"`.
- `QuejasDevolucionesPage` lee `caso` desde `useSearchParams` y abre el detalle con `useQdDetalle`.
- Se usa el ID real del caso; no se inventan parámetros.
- `DEV-33671` abre el expediente específico, no solo el listado.

---

## 4. Evidencias antes/después

### GRUPO NGH

| Control | Antes | Después |
|---|---:|---:|
| Atenciones por dominio | 8 | 8 |
| Asignadas a local | 6 | 6 |
| Sin local asignado | No se mostraban | **2** |
| Suma tabla local + sin local | 6 | **8** |
| Tickets | 8 | 8 |
| Soporte 90d | 53 | 53 |
| “Por local” | Nombres vacíos | Vital Foods Merced 27, Vital Centro 16, Vital Foods Upao 7, VITAL MONTESORI 2, Vital Foods Golf 1 |
| NPS | 6 locales / 6.83 / producto — | Sin cambios P0 |
| Historial Transversal | 36 eventos | 36 eventos |
| Q/D | 0 | 0 |
| Facturación | 0 | 0 |

### Capital Polleria

| Control | Antes | Después |
|---|---:|---:|
| Atenciones por dominio | 7 | 7 |
| Asignadas a local | 2 | 2 |
| Sin local asignado | No se mostraban | **5** |
| Suma tabla local + sin local | 2 | **7** |
| Soporte | 0 | 0 |
| Q/D | DEV-33671 | DEV-33671 |
| Enlace Q/D | `/quejas-devoluciones` | `/gestion/quejas-devoluciones?caso=313adf1e-7e14-487a-b89d-e68bee92d5ef` |
| Facturación | 0 | 0 |

### Búsqueda

| Búsqueda | Antes | Después |
|---|---|---|
| `lorenzocafe` | 2 resultados / total 0 | 2 resultados / **total 2** |
| `capitalpolleria` | 1 resultado / total 0 | 1 resultado / **total 1** |
| `restaurant` | total 468 aprox. | total 473 con descubrimientos SQL incluidos |

### Actualizar

Después de abrir ficha, facturación, Q/D y un detalle Tareabi, una pulsación de Actualizar generó solicitudes para:

- `/api/localbi/historia/GRUPO%20NGH`
- `/api/localbi/actividad`
- `/api/localbi/actividad-local`
- `/api/localbi/soporte`
- `/api/tareabi/logs/...`
- `/api/control-facturacion/intervenciones/cliente`
- `/api/quejas-devoluciones/devoluciones`
- `/api/quejas-devoluciones/quejas`

No se observaron errores de consola ni mensajes de fallo.

---

## 5. Validaciones ejecutadas

| Validación | Resultado |
|---|---|
| TypeScript backend | Limpio |
| TypeScript frontend | Limpio |
| Build backend | Correcto |
| Build frontend | Correcto |
| Pruebas backend | **519/519 OK** en la ejecución final |
| Soporte API vs SQL 7/30/90/todo | 3 / 11 / 53 / 222 |
| `lorenzocafe` | 2 resultados / total 2 |
| `capitalpolleria` | 1 resultado / total 1 |
| GRUPO NGH local + sin local | 6 + 2 = 8 |
| Capital Polleria local + sin local | 2 + 5 = 7 |
| Q/D `DEV-33671` por URL | Abre detalle correcto |
| Captura 1366×768 | Generada |
| Consola frontend | Sin errores |

Nota: una ejecución inicial de pruebas registró un fallo transitorio de conexión; la ejecución final terminó 519/519.

---

## 6. Capturas

- `docs/captures/clientes-p0-grupo-1366.png`: vista superior de la ficha a 1366×768.
- `docs/captures/clientes-p0-grupo-full.png`: tabla completa con “Sin local asignado”.
- `docs/captures/clientes-p0-soporte.png`: sección Soporte con nombres de locales.
- `docs/captures/clientes-p0-qd-33671.png`: expediente `DEV-33671` abierto por ID.
- Snapshots HTML correspondientes en `docs/captures/`.

---

## 7. Pendientes P1/P2

No se abordaron en esta fase:

- Campos faltantes de tickets (asesor/categoría explícita).
- Detalle de tareas fuera del ticket.
- Catálogo real y denominador de módulos.
- Cobertura local de NPS y promedio producto.
- Datos y navegación de facturación.
- Ampliación de fuentes del Historial Transversal.
- Addons e Integraciones (sin fuente).
- Revisión de límite 200 en Q/D y filtrado server-side.

---

## 8. Restricciones respetadas

- No se modificaron reglas de negocio.
- No se alteraron cálculos de otros reportes.
- No se modificaron datos históricos.
- No se crearon asociaciones automáticas sin evidencia.
- No se modificó la presentación compacta de Atenciones.
- No se crearon tablas ni endpoints.
- No se implementaron P1/P2.
