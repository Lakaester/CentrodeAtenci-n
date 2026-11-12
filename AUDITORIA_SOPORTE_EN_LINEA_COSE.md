# Auditoría y rediseño — Soporte en Línea (COSE / Clientes)

**Fecha:** 5 de noviembre de 2026 (America/Lima)
**Alcance:** sección colapsable «Soporte en Línea» de la Historia Clínica en `/clientes`.
**Estado:** rediseño implementado y validado. Sin commit ni push.

> La fuente es dinámica. Las cifras de este documento corresponden al snapshot indicado en cada tabla; el total puede variar entre consultas.

---

## 1. Resumen ejecutivo

Se rediseñó la sección para una lectura gerencial, manteniendo la fuente y las reglas de negocio:

- Se corrigió **Primera incidencia**: ahora usa `resumen.primera_incidencia` (MIN real) y no el mínimo de las 20 incidencias más recientes.
- Se agregó el **desglose real de estados**: cerradas (`terminada`), abiertas (`en_proceso` + `pendiente` + otros).
- Se agregó **cobertura de tiempos**: `n` válidos sobre el total y registros sin dato.
- Se muestran **todas las categorías**, con porcentaje y una fila explícita «Sin categoría».
- Se muestran **todos los locales** del desglose, con cantidad, porcentaje y barra.
- Las **últimas incidencias** ahora son tarjetas legibles con número, categoría, estado, fecha, local, asesor, tiempos y detalle expandible.
- Se muestra el **rango de datos** y el **alcance por dominio**.
- La variante compacta de `/atenciones` conserva el marcado anterior.

No se modificó el backend, el endpoint, el contrato de `public.incidencias`, TAREAS, TICKETS DEV, Módulos utilizados, COSE ni la variante compacta.

---

## 2. Trazabilidad

| Capa | Archivo / función |
|---|---|
| Componente | `frontend/src/modules/localbi/components/secciones/SoporteEnLinea.tsx` |
| Hook de datos | `frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts` |
| Hook de consulta | `frontend/src/modules/localbi/hooks/useHistoriaClinica.ts` → `useSoporteOnline` |
| Servicio frontend | `frontend/src/modules/localbi/services/LocalbiService.ts` → `soporte()` |
| Endpoint | `GET /api/localbi/soporte?dominios=...&periodo=...` |
| Controller | `backend/src/integrations/localbi/controllers/LocalbiController.ts` → `soporte` |
| Service backend | `backend/src/integrations/localbi/services/SoporteOnlineService.ts` |
| Repository | `backend/src/repositories/soporteOnline.repository.ts` |
| Fuente original | `public.incidencias` |

### Relaciones verificadas

- **Cliente:** `incidencias.suscripcion` normalizada contra los dominios de la ficha.
- **Local:** `incidencias.local_nombre` (texto). **No existe `localbi_id` en `incidencias`.**
- **Fecha de creación:** `ticket_timestamp` (`timestamp without time zone`).
- **Estado:** `estado`.
- **Tiempos:** `tiempo_espera_minutos` y `tiempo_solucion_minutos` (enteros, minutos).
- **Identificador de incidencia:** `id_incidencia` (varchar, único en la muestra).

---

## 3. Fórmulas verificadas

| Indicador | Fórmula / campo |
|---|---|
| Total | `COUNT(*)` del dominio y período |
| Cerradas | `COUNT(*) FILTER (WHERE lower(trim(estado)) = 'terminada')` |
| Abiertas | `total - cerradas`; incluye `en_proceso`, `pendiente` y cualquier otro estado |
| Prom. espera | `AVG(tiempo_espera_minutos)` sobre no nulos; ceros incluidos; redondeo entero |
| Prom. solución | `AVG(tiempo_solucion_minutos)` sobre no nulos; ceros incluidos; redondeo entero |
| Primera incidencia | `MIN(ticket_timestamp)` del universo |
| Última incidencia | `MAX(ticket_timestamp)` del universo |
| Categorías | `GROUP BY tipoproblema`; los vacíos/nulos se completan como «Sin categoría» |
| Locales | `GROUP BY local_nombre` normalizado; vacío = «Sin local asignado» |

La cobertura se muestra como `n / total`; los nulos se excluyen y los ceros se incluyen.

---

## 4. Hallazgos de la auditoría

1. **Primera incidencia incorrecta.** El hook usaba el mínimo de `ultimasIncidencias` (máximo 20 por dominio). En Global Fuel 90d, el resumen devolvía `2026-08-07` y la UI mostraba `2026-11-01` (mínimo de las 20 recientes). Corregido usando `resumen.primera_incidencia`.
2. **Estados mezclados.** «Abiertas» sumaba `total - terminadas` sin explicar que incluía `en_proceso` y `pendiente`. Ahora se muestra el desglose.
3. **Promedios sin muestra.** No se indicaba cuántos registros alimentaban los promedios. Ahora se muestra `n=.../total` y los sin dato.
4. **Categorías incompletas.** Se cortaban en 8 y no se mostraba el faltante sin categoría. Ahora se muestran todas y «Sin categoría».
5. **Locales poco visibles.** Eran chips de 8–9 px sin porcentaje. Ahora son filas con cantidad, porcentaje y barra.
6. **Últimas incidencias pobres.** Solo 5, texto de 8 px, sin número ni tiempos, descripción truncada. Ahora son tarjetas con número, badges, tiempos y detalle.
7. **Sin rango ni alcance.** No se mostraba el rango de datos ni los dominios consultados. Ahora se muestran ambos.
8. **Sin relación local confiable.** `incidencias` no tiene `localbi_id`; el desglose es por `local_nombre`. No se implementó filtro local por nombre.
9. **Sin enlace al expediente.** No existe una ruta válida; no se inventó.
10. **Categorías numéricas.** La fuente contiene valores como `"13"`; se muestran tal cual. No se homologan sin autorización.

---

## 5. Implementación

### Componente

`frontend/src/modules/localbi/components/secciones/SoporteEnLinea.tsx`

- `SoporteEnLinea`: elige variante comfortable o compacta.
- `SoporteCompacto`: conserva el marcado anterior para `/atenciones`.
- `SoporteGerencial`: nueva vista para `/clientes`.
- `SoporteKpis`: siete tarjetas.
- `DistribucionBarras`: categorías y locales.
- `UltimasIncidencias` / `IncidenciaCard`: tarjetas y detalle.
- `EstadoIncidenciaBadge`: colores semánticos.
- `DatoTiempo`: espera y solución con «No disponible» para nulos.

### Hook

`useHistoriaClinicaData` ahora calcula:

- `soporteCerradas`, `soporteAbiertas`.
- `soporteEstados` (distribución real).
- `soporteEsperaN`, `soporteSolucionN`.
- `soportePrimeraISO`, `soporteUltimaISO` desde el resumen.
- `soporteCategoriasDetalle` con «Sin categoría».
- `soportePorLocalDetalle` con porcentajes y «Sin local asignado».
- `soporteError`, `soporteRefetch`.

### UI

- Tipografía 15–16 px en el título, 13–14 px en KPIs/filtros, 24–26 px en valores.
- Tarjetas blancas, bordes visibles, colores semánticos discretos.
- Períodos 7/30/90/Todo con estado activo y rango de datos.
- Categorías y locales con barras horizontales y porcentaje de un decimal.
- Últimas incidencias: 8 por defecto, hasta 20; número destacado; descripción con saltos de línea; detalle expandible.
- Sin porcentajes de adopción, SLA, alertas ni enlaces inventados.

### Compatibilidad

- `SeccionColapsable` recibió un prop opcional `titleClassName`, usado solo por Soporte. El resto de secciones no cambia.
- La variante compacta (`/atenciones`) conserva el marcado y los tamaños anteriores.

---

## 6. Archivos modificados

```
frontend/src/modules/localbi/components/secciones/SoporteEnLinea.tsx   (nuevo)
frontend/src/modules/localbi/components/secciones/ActividadUnidad.tsx  (importa el nuevo componente)
frontend/src/modules/localbi/hooks/useHistoriaClinicaData.ts           (agregados y cobertura)
frontend/src/modules/localbi/components/HistoriaClinicaUI.tsx          (titleClassName opcional)
AUDITORIA_SOPORTE_EN_LINEA_COSE.md                                     (nuevo)
docs/captures/soporte-antes-1366x768.png
docs/captures/soporte-antes-1440x900.png
docs/captures/soporte-despues-1366x768.png
docs/captures/soporte-despues-1440x900.png
docs/captures/soporte-global-1366x768.png
docs/captures/soporte-categorias-global-1366x768.png
docs/captures/soporte-ultimas-1366x768.png
docs/captures/soporte-detalle-1366x768.png
docs/captures/soporte-error-1366x768.png
docs/captures/soporte-vacio-1366x768.png
```

**Backend:** sin cambios en esta tarea. Los archivos `SoporteOnlineService.ts` y `soporteOnline.repository.ts` que aparecen modificados en el árbol de trabajo son cambios previos ajenos a este rediseño y no fueron tocados.

---

## 7. Comparación API vs interfaz

### Pardos Chicken — 90 días (agregado de los 8 dominios de la ficha)

| Dato | API | UI |
|---|---:|---:|
| Total | 9 | 9 |
| Cerradas | 9 | 9 |
| Abiertas | 0 | 0 |
| Espera n | 9/9 | 9/9 |
| Solución n | 9/9 | 9/9 |
| Primera | 17 ago 2026 | 17 ago 2026 |
| Última | 2 nov 2026 | 2 nov 2026 |
| Categorías | 3 | 3 |
| Locales | 7 | 7 |

### Global Fuel — 90 días (snapshot de la captura, 2026-11-05)

| Dato | API | UI |
|---|---:|---:|
| Total | 216 | 216 |
| Cerradas (`terminada`) | 210 | 210 |
| Abiertas | 6 | 6 |
| En proceso / Pendientes | 4 / 2 | 4 / 2 |
| Espera n | 216/216 | 216/216 |
| Solución n | 214/216 | 214/216 |
| Sin solución | 2 | 2 |
| Sin categoría | 6 | 6 |
| Locales | 16 | 16 |
| Primera | 7 ago 2026 | 7 ago 2026 |
| Última | 5 nov 2026 | 5 nov 2026 |
| IDs distintos | 216/216 | — |

La corrección de Primera incidencia es visible: el valor anterior (mínimo de las 20 recientes) era **1 nov 2026**; el valor correcto es **7 ago 2026**.

### Períodos (Pardos, agregado de dominios)

| Período | API | UI |
|---|---:|---:|
| 7 días | 1 | 1 |
| 30 días | 2 | 2 |
| 90 días | 9 | 9 |
| Todo | 16 | 16 |

Global Fuel: 90d 216 en la captura; la fuente es dinámica y los valores pueden variar.

---

## 8. Validaciones

| Validación | Resultado |
|---|---|
| TypeScript frontend | Sin errores |
| Build frontend | Correcto (solo advertencia de tamaño de chunk) |
| Build backend | Correcto |
| Pruebas backend | 28 archivos, 519 pruebas aprobadas |
| Overflow horizontal 1366×768 | `false` |
| Overflow horizontal 1440×900 | `false` |
| Consola `/clientes` | Sin errores de aplicación; solo 404 de `/favicon.ico` (preexistente) |
| Consola `/atenciones` | Sin errores de aplicación; sin overflow |
| Cambio de período | 7d/30d/90d/Todo actualizan totales; sin datos del período anterior |
| Categorías vacías | Global 90d: «Sin categoría» 6 |
| Tiempos nulos | Global 90d: solución 214/216, 2 sin dato; se muestra «No disponible» en la tarjeta |
| Tiempos cero | Global 90d: 28 esperas en 0; se muestran como `0 min` y se incluyen en el promedio |
| Error de servicio | Endpoint de soporte abortado en el navegador: aparece «No se pudo cargar Soporte en Línea» y el badge «No disponible»; «Reintentar» recupera los datos |
| Sin local | No hay registros con `local_nombre` vacío en la fuente actual; el componente soporta «Sin local asignado» |
| Sin incidencias | Restaurante Los Cuates 90d: 0; muestra estado vacío con alcance, período y fuente |
| Local con cero incidencias | La fuente no lista locales en cero; se documenta la limitación |
| Enlaces | No se agregaron; no existe ruta válida |

### Smoke tests

- `/clientes`: ficha Pardos, COSE, Módulos, TAREAS, TICKETS DEV y Soporte renderizan; sin overflow ni errores de aplicación.
- `/atenciones`: bandeja y layout sin overflow ni errores de aplicación. El ticket de prueba no tenía cliente/dominio vinculado, por lo que el panel no cargó la ficha; la variante compacta conserva el JSX anterior.

---

## 9. Capturas

| Archivo | Contenido |
|---|---|
| `soporte-antes-1366x768.png` | Antes: Pardos, 9 incidencias, 90d (HTML guardado de la UI anterior) |
| `soporte-antes-1440x900.png` | Antes a 1440×900 |
| `soporte-despues-1366x768.png` | Después: Pardos, cabecera, KPIs, categorías y locales |
| `soporte-despues-1440x900.png` | Después a 1440×900 |
| `soporte-global-1366x768.png` | Global Fuel: 216, 210/6, cobertura 214/216, primera 7 ago |
| `soporte-categorias-global-1366x768.png` | Categorías (incluye «Sin categoría» 6) y locales |
| `soporte-ultimas-1366x768.png` | Tarjetas de últimas incidencias |
| `soporte-detalle-1366x768.png` | Detalle expandido de una incidencia |
| `soporte-error-1366x768.png` | Estado de error y acción «Reintentar» |
| `soporte-vacio-1366x768.png` | Estado sin incidencias en el período |

---

## 10. Limitaciones de la fuente

1. **No hay `localbi_id` en `incidencias`.** Solo `local_nombre`. El desglose por local agrupa por ese nombre en todos los dominios; si dos dominios comparten el mismo nombre, sus conteos se suman. No se implementó filtro por local para no atribuir por coincidencia de texto.
2. **No hay un `selectedLocalbiId` global en `/clientes`.** La sección muestra el agregado de todos los dominios de la ficha.
3. **Ventana móvil.** El backend usa `now() - interval 'N days'`; no devuelve el timestamp exacto de corte. La UI muestra el rango de los datos devueltos y lo advierte.
4. **Últimas incidencias limitadas.** El backend entrega hasta 20 recientes por dominio; la UI muestra 8 y permite ver hasta 20.
5. **Sin enlace al expediente.** No existe una ruta válida; no se inventó.
6. **Categorías numéricas.** La fuente contiene valores como `"13"`; se muestran sin homologar.
7. **Locales en cero.** `porLocal` solo incluye locales con incidencias; no se pueden mapear locales en cero a `localbi_id`.
8. **Zona horaria.** `ticket_timestamp` es `timestamp without time zone`; se muestra la fecha. Cualquier hora exacta requeriría confirmar la zona de la fuente.

---

## 11. Oportunidades futuras

1. Agregar `localbi_id` a `public.incidencias` o una tabla de mapeo incidencia ↔ local.
2. Implementar `selectedLocalbiId` en la ficha y un parámetro `localbi_id` en `/api/localbi/soporte`.
3. Aceptar `desde`/`hasta` y devolver `rango_aplicado` para un rango exacto.
4. Exponer una ruta válida al expediente de la incidencia, si existe.
5. Homologar categorías numéricas o vacías solo con autorización del dueño de la fuente.
6. Evaluar alertas de seguimiento únicamente con reglas y umbrales aprobados (no hay SLA en la fuente).

---

## 12. Estado

- Sin commit ni push.
- Sin cambios de backend en esta tarea.
- Sin modificaciones a TAREAS, TICKETS DEV, Módulos utilizados, COSE, Reportes, `/atenciones` (variante compacta) ni Microservice.
- Cambios previos ajenos a esta tarea conservados.
