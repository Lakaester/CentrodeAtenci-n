# Changelog

## Quejas y Devoluciones — rediseño e incorporación de Alex López

### Datos
- `public.v_unificado` amplió su lista blanca para incluir `alex lopez` en las dos listas del filtro (exacta y `unaccent`).
- Migración reversible en `backend/sql/migrations/` y script `backend/scripts/migrar-vista-alex.ts`.
- Respaldo de la definición original y línea base por asesor.
- Rollback comprobado: Alex 0, total 23,452. Reaplicación: Alex 215, total 23,667.
- Al cierre de la validación la base viva llegó a 23,673 y Alex a 216; el crecimiento adicional no proviene del parche y coincide con las fuentes.
- Sin cambios atribuibles al parche en los conteos de los asesores existentes; sin duplicados.
- La recuperación es retroactiva por corrección de vista: no se insertaron filas ni se duplicaron atenciones.

### Homologación transversal
- `OFFICIAL_FILTER` incluye a Alex en Asesores y Asesores Matrix.
- Equivalencias de Categorías: Alex, Alex Lopez y Alex López → Alex López.
- Asesores agrega a Alex López a la lista oficial y a su color.
- Filtro global de asesor incluye `Alex Lopez`.
- Aportes de Alex en octubre 2026: Resumen 179; Operación 187; País 185; Asesores 185; Categorías 179; Clientes 181; WhatsApp 143; Zendesk 44; Calidad 185; Quejas y Devoluciones 0.
- Alex no registra casos Q/D; no se inventaron casos.

### Backend de Quejas y Devoluciones
- `quejasDevoluciones` reescrito sobre fecha real de creación, con rango semiabierto.
- Universo: `categoria = 'GESTION'` y subcategoría normalizada `queja` / `solicitud de devolucion`.
- Nuevo contrato: KPIs, estados, tipos, canales, tiempos por tipo con `n` y cobertura, asesores, evolución e insights.
- Corregido `totalGeneral`: ahora es la suma Q/D, no todas las atenciones.
- Corregida la variación contra el periodo anterior con el mismo filtro Q/D.
- Resolución excluye `resolucion_min_norm = 0` con primera respuesta nula.
- Retirados FCR, SLA, país, clientes, hora, día de semana y promedios sin `n`.
- Nuevo `backend/scripts/validar-quejas.ts` (43 comprobaciones) y `backend/scripts/perf-quejas.ts`.
- Nuevo `backend/scripts/validar-alex.ts` (31 comprobaciones).

### Frontend
- Quejas y Devoluciones rediseñado: 4 KPI, estados, evolución actual vs. anterior, canal, tiempos por tipo, distribución por asesor e insights.
- Eliminados dona, tabla de variación separada, ranking de clientes, tabla por país, día de semana, hora y KPI de total atenciones.
- Documentación en `docs/QUEJAS_DEVOLUCIONES.md` y `docs/ALEX_LOPEZ.md`.
- Captura en `docs/captures/quejas-general.html`.

### Validación
- Octubre 2026: 17 casos Q/D; 7 quejas; 10 devoluciones; 14 cerrados; 3 resueltos; 15 Correo; 2 WhatsApp.
- Primera respuesta: n 16/17, cobertura 94.1%, mediana 498.0 min, p90 3,109.5 min, promedio 1,374.0 min.
- Resolución: n 16/17, cobertura 94.1%, mediana 2,423.1 min, p90 5,922.0 min, promedio 2,752.8 min; 1 sin tiempo válido.
- Evolución: 17 vs 19 (-10.5%).
- `validar-quejas.ts`: 43/43 OK.
- `validar-alex.ts`: 32/32 OK; conteos por asesor reconciliados contra fuentes y crecimiento vivo separado del parche.
- Asesores existentes sin cambios; total consolidado = línea base + Alex.
- `validar-operacion.ts` sin controles fijos de filas: valida invariantes dinámicas y reconcilia WAMETA contra la fuente.

## Retiro del reporte Tendencias

### Frontend
- Eliminada la opción **Tendencias** del menú de Reportes.
- Eliminada la página `frontend/src/pages/Tendencias.tsx` y sus componentes visuales exclusivos, definidos dentro del mismo archivo.
- La ruta `/reportes/tendencias` ya no muestra el reporte: redirige a `/reportes` para que los enlaces antiguos no queden en blanco.
- Retirado el título de Tendencias del mapa de navegación.

### Backend
- Retirado `GET /api/dashboard/tendencias`, junto con su controlador, servicio y método del repositorio.
- Retirados los tipos `TendenciasKpi`, `TendenciasResponse` y `Alerta`, usados solo por ese endpoint.
- La serie `evolucionPais`, única parte del endpoint que consumía el reporte País, se trasladó a `GET /api/dashboard/pais` como `evolucionPais`.
- País ahora obtiene su evolución en la misma consulta que el resto de sus datos, sin una segunda petición.

### Alcance
- No se eliminaron tablas, vistas, datos históricos, filtros globales ni reglas de negocio compartidas.
- No se agregaron gráficos ni indicadores de reemplazo.
- Otros reportes no fueron modificados.

### Validación
- Sin referencias activas a la página, ruta, endpoint o tipos de Tendencias.
- TypeScript limpio en backend y frontend; builds correctos.
- `evolucionPais` conserva 260 filas y 2,845 atenciones para octubre 2026.
- `/api/dashboard/tendencias` responde 404.
- Smoke test OK en Resumen, Operación, País, Asesores, Categorías, Clientes, WhatsApp y Zendesk, sin errores de consola.
- La ruta `/reportes/tendencias` redirige a `/reportes` y la navegación ya no muestra Tendencias.

## Reporte Zendesk — impacto operativo

### Backend
- `zendesk` reescrito sobre la fecha real de creación (`tickets_created_at` UTC → America/Lima), no sobre la `fecha` de reporte.
- Universo: 750 tickets en octubre 2026 vs. 729 por fecha de reporte; diferencia de 21 documentada.
- Estados mutuamente excluyentes: cerrado, resuelto, abierto, pendiente, en espera y otros.
- Resolución válida excluye `resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL` (14 filas); se reporta como “sin tiempo válido”.
- SLA exclusivo de primera respuesta ≤1,440 min, con cumple/evaluables y umbral.
- Retiro de FCR, SLA de resolución, treemap, rankings de asesores, países, dominios, tiempos por categoría/subcategoría/asesor y tendencia histórica de backlog.
- Backlog al corte con `NOW() AT TIME ZONE 'America/Lima'`, sin reconstrucción histórica.
- Evolución actual vs. periodo anterior equivalente, con serie diaria completa.
- Nuevos tipos `ZendeskKpis`, `ZendeskEstado`, `ZendeskEvolucion`, `ZendeskBacklog` y `ZendeskResponse`.
- Nuevo `backend/scripts/validar-zendesk.ts` (15 puertas, 48 comprobaciones) y `backend/scripts/perf-zendesk.ts`.

### Frontend
- Zendesk rediseñado: 4 KPI (tickets, primera respuesta, resolución, SLA), distribución de estados, evolución actual vs. anterior, backlog, capacidad e insights.
- Mediana y p90 como lectura principal; promedio secundario con `n` y cobertura.
- Eliminados FCR, donuts, treemaps, rankings de asesores, países y tiempos por categoría/subcategoría/asesor.
- Documentación en `docs/ZENDESK.md` y captura en `docs/captures/`.

### Validación
- 48/48 comprobaciones SQL OK.
- Octubre 2026: 750 tickets; 691 cerrados; 59 resueltos; 0 abiertos/pendientes/en espera.
- Primera respuesta: mediana 322.5 min, p90 2,354.0 min, n 664, cobertura 88.5%, SLA 81.6%.
- Resolución: mediana 1,128.6 min, p90 4,944.0 min, n 736, cobertura 98.1%, 14 sin tiempo válido.
- Evolución: 750 vs 807 (-7.1%).
- Backlog al corte: 0.

## Reporte WhatsApp — impacto operativo

### Backend
- `whatsapp` reescrito sobre el universo completo del canal (Wameta + Whaticket), incluyendo abiertas, cerradas y sin estado homologado.
- Estados conciliados: cerradas + abiertas + sin estado homologado = total; los `SI`/`NO` de Whaticket no se reinterpretan.
- Tiempos faltantes (`raw IS NULL AND min = 0`) excluidos de mediana, p90, promedio y SLA; cobertura con denominador total por plataforma.
- Percentiles consolidados calculados sobre todos los registros válidos, no promedios ponderados de medianas por plataforma.
- SLA exclusivo de primera respuesta ≤15 min, con cumple/evaluables y umbral.
- Retiro de FCR, espera, regla de 20 min y meta provisional de resolución de 120 min.
- Evolución consolidada actual vs. periodo anterior, serie diaria completa, horas y días.
- Excepciones operativas: abiertas >24 h y cerradas/sin estado >8 h, con estado y tipo de tiempo.
- Nuevo `backend/scripts/validar-whatsapp.ts` (57 comprobaciones) y `backend/scripts/perf-whatsapp.ts`.

### Frontend
- WhatsApp rediseñado: 4 KPI, distribución de estados, evolución consolidada, demanda por hora y por día, tabla de plataformas, excepciones e insights.
- Nombre visible de la plataforma estandarizado como **Wameta**.
- Eliminados el mapa de calor, Paretos, ranking de asesores, panel de riesgos, país → categoría → asesor y la tabla de conversaciones más largas.
- Documentación en `docs/WHATSAPP.md` y captura en `docs/captures/`.

### Validación
- 57/57 comprobaciones SQL OK.
- Octubre 2026: 2,116 conversaciones; 2,044 Wameta; 72 Whaticket; 2,042 cerradas; 2 abiertas; 72 sin estado.
- Primera respuesta: mediana 4.8 min, p90 24.0 min, n 2,008, cobertura 94.9%, SLA 81.3%.
- Resolución: mediana 52.1 min, p90 126.0 min, n 2,089, cobertura 98.7%.
- Evolución: 2,116 vs 2,477 (-14.6%).
- Pruebas backend, TypeScript y builds.

## Reporte Clientes — comportamiento y seguimiento

### Backend
- `clientesV2` reescrito sobre atenciones finalizadas y fecha real de creación (Zendesk UTC → America/Lima; WhatsApp local).
- Identificación de clientes con dominio válido y fallback corporativo desde el correo de Zendesk; exclusión de proveedores gratuitos y trazabilidad de los recuperados.
- Separación explícita del grupo “No identificados”, fuera de rankings, promedios y seguimiento.
- SLA por canal con denominador `conDato`; tiempo con `AVG(resolucion_min_norm)`.
- Nuevos endpoints de clientes paginados, categorías, subcategorías, tickets paginados y evolución.
- Reemplazo del score de riesgo por “Clientes que requieren seguimiento” con cuatro señales y motivos explicables.
- Exportación por nivel: Excel para agregados y CSV para tickets.
- Nuevo `backend/scripts/validar-clientes.ts` (60 comprobaciones) y `backend/scripts/perf-clientes.ts`.

### Frontend
- Clientes rediseñado: 4 KPI, franja de calidad, seguimiento, explorador Cliente → Categoría → Subcategoría → Tickets, ranking Top 20 con “Ver todos”, mezcla multicanal y evolución actual vs. anterior.
- Eliminados los gráficos de categorías/subcategorías del cliente, el donut de canales y la tabla de score.
- Ticket visible y enlace externo a Zendesk solo con subdominio válido.
- Documentación en `docs/CLIENTES.md` y capturas en `docs/captures/`.

### Validación
- 60/60 comprobaciones SQL OK.
- Octubre 2026: 2,792 atenciones; 907 clientes identificados; 2,480 identificadas; 312 no identificadas; 43 clientes con seguimiento.
- Zona horaria validada con tickets de medianoche (35177, 35175).
- Pruebas backend, TypeScript y builds.

## Reporte Categorías — atenciones finalizadas

### Backend
- `categoriasV2` ahora usa el universo de atenciones finalizadas (`cerrado` + `resuelto`), el mismo de Resumen, y expone `universo` con total, rango, excluidas, abiertas y sin estado.
- SLA por canal desde `SLA_MINUTOS.resolucion` (120 / 1,440 / 480 min), con denominador `conDato` y campos `cumple`, `noCumple`, `pctCumple`, `pctIncumple`.
- Ranking de tiempo con `AVG(resolucion_min_norm)`; se deja de usar la suma de primera respuesta + resolución.
- Pareto de subcategorías contextual agrupado por categoría.
- Análisis por asesor con tabla explícita de equivalencias (15 originales → 7 consolidados), `asesorDetalle` y `asesorTrazabilidad`.
- Retiro de matrices, impacto y subcategorías de tiempo/SLA del contrato.
- Opción aditiva `fechaRangoSargable` en `construirWhere`, usada solo por Categorías; reduce el tiempo de consulta del rango completo de ~6.9 s a ~3.0 s.
- Nuevo `backend/scripts/validar-categorias.ts` (47 comprobaciones) y `backend/scripts/perf-categorias.ts`.

### Frontend
- Categorías rediseñado: 4 KPI, Pareto de categorías con referencia 80%, Pareto contextual de subcategorías, rankings de tiempo e incumplimiento, análisis de asesor con filtros y tabla jerárquica.
- Eliminados los mapas de calor Categoría × Asesor y Subcategoría × Asesor, la burbuja de impacto y los gráficos de subcategorías por tiempo/SLA.
- Categorías técnicas identificadas visualmente; bloque `Sin asignar` solo si existe.
- Documentación en `docs/CATEGORIAS.md`.

### Validación
- 47/47 comprobaciones SQL OK; total 22,777; evaluables SLA 22,753; técnicas 4,812; 7 asesores; 2 tickets duplicados documentados.
- 519 pruebas backend OK, TypeScript limpio y builds OK.

## Reporte Operación — planificación de capacidad

### Backend
- Nueva base de demanda para Operación: fecha/hora de creación real, con Zendesk convertido de UTC a America/Lima y WhatsApp en hora local.
- Deduplicación condicional de tickets Meta/Whaticket para no ocultar filas al filtrar un canal individual.
- KPI de total, promedio por día calendario, día pico y hora pico con comparación contra periodo anterior.
- Heatmap con dimensión día × hora, días observados por DOW y soporte para celdas sin datos.
- Evolución diaria, semanal, mensual y trimestral con serie actual y anterior, además de desagregación por subcanal.
- Top de asesores y categorías sobre demanda recibida.
- Nuevo `backend/scripts/validar-operacion.ts` y `backend/scripts/check-zendesk-time.ts`.

### Frontend
- Operación rediseñado: 4 KPI, mapa de calor protagonista, hallazgos, evolución con granularidad, canal, asesor y categoría.
- Eliminados los gráficos redundantes de curva horaria y carga por día.
- Rango inicial de últimos 90 días.
- Aviso de muestra corta y ocultamiento de evolución para rangos de un día.
- Reconciliación visible entre consolidado y suma de canales.

### Validación
- Zendesk: `tickets_created_at` coincide con el `created_at` UTC de la API en 5 tickets contrastados.
- `validar-operacion.ts`: 27/27 comprobaciones OK.
- Base cruda 23,381; consolidada 23,379; 2 duplicados entre canales.
- 519 pruebas backend OK; TypeScript y builds OK.

## Reporte Resumen — universo de atenciones finalizadas

### Backend
- El reporte Resumen calcula todos sus indicadores sobre `estado_homologado IN ('cerrado','resuelto')`.
- Nuevos KPI en `/dashboard/resumen`: cumplimiento de primera respuesta y resolución con conteos dentro/fuera/con dato, además de promedios que ignoran tiempos nulos.
- Tiempos promedio agrupados por `subcanal` (WATICKET, WAMETA, ZENDESK), sin mezclar canales.
- Ranking de asesores calculado solo con atenciones finalizadas; se agrega cumplimiento de resolución sin cambiar la fórmula del score.
- `/dashboard/detalle` acepta `universo=final`; el Resumen lo envía siempre.
- Periodo anterior del Resumen corregido para incluir el día completo.
- Nuevo script `backend/scripts/validar-resumen.ts`.

### Frontend
- Resumen reducido a 4 KPI: atenciones finalizadas, cumplimiento de primera respuesta, cumplimiento de resolución y tiempo promedio de resolución.
- Se eliminan las tarjetas de atenciones cerradas y cumplimiento SLA duplicado.
- Una sola distribución por canal operativo, con cantidad y porcentaje.
- Top 3 asesores con cumplimiento de primera respuesta y resolución.
- País y categoría compactos, top 8 sin scroll interno.
- Detalle de atenciones sin selector de estados; solo cerradas/resueltas.

### Validación
- `npx tsx backend/scripts/validar-resumen.ts`: 40/40 comprobaciones OK.
- Línea base 22,765 finalizadas verificada; el dato posterior pasó a 22,766 por una nueva atención finalizada.
- 519 pruebas backend OK.
- TypeScript y builds backend/frontend OK.

## Calidad de Registro — reestructuración UX/UI ejecutiva

### Frontend
- Resumen ejecutivo reducido a 4 tarjetas: cumplimiento de categorización, cumplimiento de vinculación de dominio y dos tarjetas de pendientes.
- Total analizado como chip contextual; se eliminó la tarjeta de total.
- Dos gráficos de evolución simplificados: categorizadas/pendientes y con dominio/sin dominio, con el porcentaje como línea principal.
- Comparativo por canal en una única tabla ordenable con indicadores visuales de mejor/peor cumplimiento.
- Terminología ejecutiva: se ocultaron homologación, dominio válido, brechas y cumplimiento integral de la vista principal.
- Indicadores técnicos movidos a la sección colapsada **Diagnóstico técnico**.
- Tabla histórica completa movida a la sección colapsada **Detalle histórico por periodo**.
- Exportación Excel reorganizada: Resumen ejecutivo, Evolución, Por canal, Diagnóstico, Detalle histórico y Filtros.
- Sin cambios en backend, endpoint, SQL, reglas de negocio, 835 validaciones ni 519 pruebas.

## Calidad de Registro — seguimiento de categorización y dominios

### Backend
- Nuevo endpoint `GET /api/dashboard/calidad-registro` con filtros globales de fecha, canal (`subcanal`) y granularidad (`semana`, `mes`, `trimestre`).
- Nuevo repositorio `calidadRegistro.repository.ts`: una sola lectura de `v_unificado_norm` para rango actual y anterior, deduplicación consolidada Meta/Whaticket y separación de Zendesk.
- Indicadores independientes:
  - categoría registrada (texto de origen válido) y categoría homologada (catálogo de 13 categorías);
  - dominio informado (no vacío) y dominio válido (`isValidDomainFormat`);
  - cumplimiento integral (homologada + dominio válido) con cuatro escenarios mutuamente excluyentes.
- Regla SQL de dominio válido espejo de `isValidDomainFormat`; validación de 0 discrepancias contra la función JS.
- Invariantes reforzadas en SQL y en TypeScript: `cat_homologadas <= cat_registradas <= total`, `dom_validos <= dom_informados <= total`, escenarios = total.
- `construirWhere` acepta `endExclusive` opcional para no excluir los segundos del minuto final.

### Frontend
- Nueva pestaña **Calidad de Registro** en Reportes (`/reportes/calidad-registro`).
- Resumen ejecutivo con 8 KPIs, brechas de homologación/dominio y comparativo contra el periodo anterior.
- Evolución de categorización y dominio con barras apiladas y líneas de porcentaje; vista consolidada o por canal.
- Comparativo por canal, distribución de los cuatro escenarios y hallazgos automáticos.
- Tabla histórica con vistas Base/Calidad/Integral/Completa, orden, filtros y exportación a Excel.
- Rango inicial de últimos 12 meses; sincronización de la barra global de filtros.

### Validación
- `npx tsx backend/scripts/validar-calidad-registro.ts`: 835/835 comprobaciones OK contra PostgreSQL.
- `vitest`: 519 pruebas OK (incluye 42 nuevas pruebas del módulo).
- Builds backend y frontend OK.
- Documentación: `docs/CALIDAD_REGISTRO.md`.

## AT-002 — Tickets y Tareas estilo Micro-Services en el Panel Operativo

### Backend
- **Catálogos locales de COPE** desacoplados (categoría/subcategoría/nivel) en `CatalogoTicketService`, sin tablas ni endpoints inventados. Endpoints: `/api/atenciones/ticket-catalogos/{categorias,subcategorias,niveles,areas}`.
- **Catálogos reales de Micro-Services** para tareas: se exponen `/api/tareabi/{proyectos,tipos,dev}` usando `obtenerDatosEstaticos` de Tareabi (69 proyectos, 8 tipos, etc.).
- `TicketbiService` ampliado: acepta el payload del formulario (asunto obligatorio, categoría, varias tareas) y mapea al contrato documentado (`localbi_id`, `personabi_id`, `ticketbi_asunto`, `ticketbi_categoria`, `detalleList`). `tarea_nombre` se construye de forma clara (proyecto + tipo). Valida ≥1 tarea con descripción.

### Frontend (PanelOperativo)
- Modal grande (880px) estilo Micro-Services con pasos: **Datos → Tareas → Resumen → Éxito**.
- **Datos del ticket**: asunto (obligatorio), categoría, subcategoría (dependiente), nivel, fecha tentativa, descripción, conclusión; cliente/local/canal precargados.
- **Tareas**: estado vacío + "+ Agregar tarea" → modal **Agregar Tarea** con Área (Desarrollo), grilla (proyecto, versión, tipo, etapa error, fecha entrega, referencia, descripción, casos), múltiples tareas.
- **Resumen** previo al POST; estados de carga ("Creando ticket…"), éxito ("Ticket #N creado correctamente") y errores claros. Previene doble envío.
- Catálogos cargados desde capa desacoplada (`modules/ticketbi/ticketbiService`); Categoría/Subcategoría/Nivel locales, Proyectos/Tipos desde Tareabi.

### Decisiones aplicadas
- No se crearon tablas en BD ni endpoints de Micro-Services inventados.
- POST respeta estrictamente el contrato documentado (sin campos extra).
- `personabi_id` de la sesión (`cope_usuarios`); `localbi_id` del cliente/unidad.
- Trazabilidad ticket↔atención: no se crea tabla; el `ticketbi_id` se devuelve al flujo.

## AT-001 — Crear ticket a Desarrollo desde el Panel Operativo (Atenciones)

### Nuevo (backend)
- Integración `ticketbi`: cliente HTTP (`TicketbiClient`) hacia `POST /public/rest/common/ticketbi/ticketbi` de Microservicios (API pública, sin token). Solo POST.
- `TicketbiService` con validaciones de negocio y mensajes claros:
  - Sin cliente/local: "No se puede crear el ticket porque la atención no tiene un cliente/local identificado."
  - Sin asesor homologado: "No se pudo identificar correctamente al asesor. Verifica tu sesión."
  - Sin asunto / sin descripción: mensajes específicos.
  - Procesa respuesta `tipo=1` (éxito → `ticketbi_id`) y `tipo=3` (error → mensaje amigable).
- `personabi_id` en `cope_usuarios` (nueva columna, se llena manualmente por el admin) y expuesto en `AuthMe`/login. NO se hardcodea.
- Endpoint interno: `POST /api/atenciones/ticket-desarrollo` (requiere auth).

### Nuevo (frontend — PanelOperativo)
- Botón **"+ Crear ticket a Desarrollo"** en el header del Panel Operativo (modo expandido).
- Modal con formulario: Asunto (*), Descripción/tarea (*), Plataforma (WEB/DESKTOP/ANDROID, opcional). Área y Categoría quedan automáticamente `DESARROLLO`.
- Pre-carga automática: `localbi_id` desde la ficha del cliente (por dominio de la atención) y `personabi_id` desde el usuario autenticado.
- Paso de confirmación (resumen) antes del POST.
- Estados: carga ("Creando ticket…"), éxito ("Ticket #N creado correctamente para Desarrollo."), errores claros.
- Previene doble clic (botón deshabilitado mientras se envía).

### Notas / limitaciones
- No existe estructura previa en BD para persistir la relación ticket↔atención; no se creó tabla nueva (según requisito). El `ticketbi_id` se devuelve y muestra al asesor.
- El `personabi_id` de cada asesor debe completarse manualmente en `cope_usuarios` (columna nueva) para que el envío sea válido.

## QD-015 — Agregar "Soporte Especializado" al catálogo de Área causante

### Cambios
- Se agrega **"Soporte Especializado"** al catálogo oficial de ÁREAS CAUSANTES (`qd_areas`), al final del orden:
  1. Implementaciones
  2. Comercial
  3. Soporte en Linea
  4. Customer Success
  5. Desarrollo
  6. Temas del cliente
  7. **Soporte Especializado**
- No se eliminó ni modificó ninguna opción existente.
- El campo `area` es TEXT en `qd_casos` (sin enum de Prisma ni validación cerrada en backend), por lo que el nuevo valor se acepta y persiste sin cambios en backend/frontend de validación.
- El select de Área causante (que filtra por `activo` y toma valores del catálogo) muestra la nueva opción automáticamente.
- Migración: `quejas-devoluciones-area-soporte-especializado.sql` (idempotente).

### Verificación
- Catálogo vía API: 7 áreas activas, incluida "Soporte Especializado".
- Guardado real: `PATCH` con `area="Soporte Especializado"` → 200 OK; persiste al reabrir el caso (DEV-33068) y se restauró su valor original tras la prueba.

## QD-014 — Moneda del caso (PEN/USD) + Dominio como combobox con input libre

### Moneda (PEN/USD)
- Nueva columna `qd_casos.moneda` (TEXT, default 'PEN') — cada caso de devolución define su moneda.
- Se agrega `moneda` al `QdCasoRow`, `CrearCasoInput`, `crear`, `actualizar` (repositorio) y al `actualizarSchema`/`crearSchema` (controlador, validado con `z.enum(["PEN","USD"])`).
- Selector de moneda (PEN — Soles / USD — Dólares) en el detalle de Devolución y en el formulario de nuevo caso.
- `fmtMoneda` ahora acepta la moneda y muestra el símbolo correcto (S/ o $) en tabla y detalle.
- Exportación Excel: nueva columna "Moneda".
- **Sin conversión automática** entre monedas (la moneda es una propiedad del caso, no una conversión).
- Los casos existentes conservan PEN por defecto (no se modificó su información).

### Dominio como combobox + input libre
- El campo Dominio funciona como COMBOBOX + INPUT LIBRE: el catálogo sirve de autocompletado, pero el asesor puede escribir manualmente cualquier dominio y guardarlo aunque no exista en la BD.
- Al escribir en el input se sincroniza el valor a guardar (`dominioSel`); si no coincide con el catálogo igualmente se guarda.
- Verificado: asignar `bokitas.restaurant.pe` (no catalogado) persiste al reabrir el caso.

### Fix técnico
- `actualizarSchema` era un objeto independiente que no heredaba `casoBase`; se agregó `moneda` explícitamente (zod descartaba el campo silenciosamente).

## QD-013 — Agregar "Temas del cliente" al catálogo de Área causante

### Cambios
- Se agrega **"Temas del cliente"** al catálogo oficial de ÁREAS CAUSANTES (`qd_areas`), al final del orden:
  1. Implementaciones
  2. Comercial
  3. Soporte en Linea
  4. Customer Success
  5. Desarrollo
  6. **Temas del cliente**
- No se eliminó ninguna opción existente (los valores inactivos se conservan para trazabilidad).
- El valor se selecciona y guarda igual que las demás opciones (persiste en `qd_casos.area`).
- El frontend ya filtra por `activo`, por lo que "Temas del cliente" aparece automáticamente en el selector.
- Migración: `quejas-devoluciones-area-temas-cliente.sql` (idempotente).

### Verificación
- Guardado real: `PATCH` con `area="Temas del cliente"` → 200 OK; persiste al reabrir el caso (DEV-33068) y se restauró su valor original tras la prueba.
- Catálogo: 6 activos (con el nuevo al final) + inactivos conservados.

## QD-012 — Fix: inconsistencia % devolución vs resultado "Procede 100%"

### Causa raíz
- La columna `porcentaje` (y los montos) es `NUMERIC` en PostgreSQL. El driver de Prisma la devuelve como **string** (ej. `"100"`).
- Al actualizar sin enviar `porcentaje` (p. ej. guardando solo la sección Gestión), el backend usaba el valor de BD como string y `validarCaso` comparaba `"100" !== 100` (comparación estricta), lanzando el falso error "Para 'Procede 100%' el porcentaje debe ser 100".

### Corrección
- En `qdService.actualizar` se normalizan `porcentaje`, `monto_pagado` y `monto_devuelto` a número (con `Number()`) tanto al leerlos de la BD como del patch, antes de validar y guardar.
- La validación de coherencia se mantiene (es correcta); solo se corrige el tipo de dato.
- Al guardar también se normalizan los valores en BD (string → número).

### Verificación
- Caso real DEV-32492 (porcentaje `"100"` string, devuelto `"1813"`, resultado "Procede 100%"): el PATCH de Gestión ahora devuelve 200 OK y `porcentaje=100` (número) sin error. No se perdió información.

## QD-011 — UX: Selector de dominio con búsqueda + Catálogo oficial de Áreas causantes

### Cambios
- **Selector de dominio con autocompletado**: se reemplaza el `<select>` con lista extensa por un input de búsqueda que filtra los dominios mientras se escribe (limita a 50 resultados) y muestra un dropdown con la opción "SIN DOMINIO" y las coincidencias. Botones Guardar/Cancelar.
- **Catálogo oficial de ÁREAS CAUSANTES** en `qd_areas`:
  - Nuevos valores activos: **Implementaciones, Comercial, Soporte en Linea, Customer Success, Desarrollo**.
  - Valores anteriores (Soporte, Ventas, Facturación, Tecnología, Otra) marcados como inactivos (se conservan para trazabilidad).
  - Los selects de Área (Devolución, Queja-Servicio y formulario de nuevo caso) ahora solo muestran el catálogo oficial (filtran por `activo`), y conservan el valor actual del caso si no está en el catálogo.
- Migración: `quejas-devoluciones-areas-causantes.sql` (idempotente).

### Archivos
- `backend/prisma/migrations/quejas-devoluciones-areas-causantes.sql` (nuevo).
- `frontend/src/pages/quejas-devoluciones/QuejasDevolucionesPage.tsx`.

## QD-010 — UI: Historial desglosable (accordion) + sección Gestión editable

### Cambios
- **Historial** convertido en sección ABATIBLE (accordion) colapsado por defecto al abrir el caso:
  - Encabezado clickeable completo: `HISTORIAL (N) ▶` / `▼ Ocultar historial`.
  - Muestra el contador de eventos cuando existen (`Historial (12)`).
  - Contenido con `max-height` + scroll interno (no infla el panel lateral).
  - No se elimina ni limita ninguna entrada; no se modifica la lógica de auditoría.
- **Sección Gestión** ahora editable (permiso existente `Quejas y Devoluciones → editar`):
  - Estado del caso (con acciones Cerrar/Reabrir), Estado (catálogo), Resultado (catálogo) y Observación (textarea) editables con **Descartar/Guardar**.
  - Sin permiso `editar` → vista de solo lectura.
- Se elimina el modo "Editar" del encabezado (ya no era necesario: los campos son editables directamente con permiso).

### Verificación
- Auditoría intacta: 94 eventos en 59 casos (DEV-33068 con 22 tras ediciones reales previas) — confirma que se siguen registrando todas las modificaciones.
- Build frontend OK.

## QD-009 — Fix: campos de DEVOLUCIÓN/QUEJA editables directamente desde el detalle

### Cambios
- Corrección del bug: los campos de la sección DEVOLUCIÓN y QUEJA se mostraban como texto estático y solo aparecía el botón "Editar".
- Ahora, cuando el usuario tiene permiso `Quejas y Devoluciones → editar`, los campos se renderizan **siempre como controles de edición** (Opción A: inputs visibles), sin requerir una acción previa:
  - **Devolución**: Monto solicitado (`<input number>`), Tipo (`<select>` ARR/MRR), % devolución (`<input number>` 0–100), Monto real a devolver (`<input number>`), Área causante (`<select>` catálogo `qd_areas`), Motivo (`<textarea>`).
  - **Queja**: Tipo de queja (`<select>` catálogo), Área/Producto condicionales, Motivo (`<textarea>`).
- Botones **Descartar / Guardar** al final de la sección.
- Si el usuario NO tiene permiso `editar`, se muestra la vista de solo lectura (valores estáticos).
- Se elimina el modo intermedio `editandoDatos`; el formulario está siempre activo para quien puede editar.
- Se agrega sincronización del formulario con el caso cuando se refresca (React Query invalida y actualiza los inputs).

### Validación real (DEV-33068, caso BACKFILL)
- Guardado vía `PATCH /casos/:id` confirmado (200): `montoPagado=1000, %=50, devuelto=500, tipo=ARR, area=Soporte, motivo=...`.
- Al reabrir el caso, los valores persisten.
- Coherencia bidireccional verificada: editar monto real a 250 → %=25; editar % a 100 → monto real=1000.
- Valores de prueba restaurados (DEV-33068 vuelve a NULL).

## QD-008 — Monto solicitado vs Monto real a devolver (coherencia de devolución)

### Cambios
- Se clarifica la semántica de los campos existentes en `qd_casos` (sin crear columnas nuevas):
  - `monto_pagado` = **Monto solicitado** (lo que pide el cliente).
  - `porcentaje` = **% devolución / conciliación**.
  - `monto_devuelto` = **Monto real a devolver** (monto conciliado/aprobado).
- Los dos montos se conservan por separado: nunca se sobrescribe el solicitado con el conciliado (habilita reportería futura de solicitado vs aprobado).
- **Coherencia bidireccional** en `qdService.actualizar` (devolución):
  - Si cambia el % → se recalcula el monto real a devolver.
  - Si se edita directamente el monto real → se recalcula el %.
  - Si se editan ambos → manda el %.
  - Cálculos redondeados a 2 decimales; acotado 0–100%.
- NULL ≠ 0: si falta un valor permanece NULL (no se inventa 0). Solo se guarda 0 cuando se concilió y se aprobó 0.
- Tabla principal: la columna Monto/Detalle de devoluciones muestra "Solicitado: S/ X" / "A devolver: S/ Y" / "% conciliado" (NULL → "—").
- Detalle del caso: sección Devolución con campos "Monto solicitado", "% devolución/conciliación" y "Monto real a devolver", editables con coherencia automática.
- Exportación Excel: encabezados renombrados a "Monto solicitado", "% conciliación" y "Monto real a devolver".
- Los 55 casos históricos no se modificaron: se conserva su información tal cual (NULL donde no hay dato).

## QD-007 — Edición de la información propia del caso desde el detalle

### Cambios
- Los campos de la sección **DEVOLUCIÓN** son editables desde el detalle del caso: Monto solicitado, Tipo (ARR/MRR), % devolución, Monto devuelto, Área causante (catálogo `qd_areas`) y Motivo (texto).
- Los campos de la sección **QUEJA** también son editables: Tipo de queja (catálogo `qd_tipos_queja`), Área/Producto (catálogos existentes) y Motivo.
- Mismo patrón visual que la edición de Gestión: edición in-place con **Guardar**/**Cancelar**, sin convertir la pantalla en un formulario.
- Se reutiliza el endpoint existente `PATCH /casos/:id` (permiso `editar`), que ya realiza actualización parcial, valida montos ≥ 0 y porcentaje 0–100, actualiza `updated_at`, registra auditoría por campo y no convierte NULL en 0.
- Los valores vacíos permanecen vacíos (NULL); no se inventan datos (0/N/A/Desconocido).
- Funciona para casos de origen BACKFILL (no se bloquea la edición por origen) y para casos MANUAL/CATEGORIZACION.
- El detalle se refresca de inmediato tras Guardar (React Query invalida la query del detalle).

## QD-006 — Gestión operativa del CASO (cierre, reapertura, dominio, consolidación, vinculación)

### Nuevo (backend)
- `POST /casos/:id/reabrir` — reabre un caso cerrado (`caso_cerrado=FALSE`, limpia `cerrado_at`/`cerrado_por`, audita). Reutiliza la estructura existente.
- `GET /catalogo/dominios` — catálogo de dominios homologados (solo lectura) desde `v_unificado_norm` + `qd_casos.dominio`, normalizados con `normalizarDominio`, únicos y ordenados. NO crea tabla configurable.

### Nuevo (frontend — QuejasDevolucionesPage)
- Badge de estado ABIERTO/CERRADO en tabla y detalle (sección "Cierre" con `cerrado_at`/`cerrado_por`).
- Acciones **Cerrar caso** y **Reabrir caso** en el detalle, con modal de confirmación (permiso `editar`).
- Badge **SIN DOMINIO** en tabla y detalle; asignación de dominio desde el catálogo (select, sin texto libre). Asignar dominio NO fusiona.
- **Consolidar casos** (permiso `administrar`): selección por checkboxes, modal que muestra tipo/dominio/cliente/tickets/fecha apertura, radio de caso principal + motivo. Valida mismo tipo, casos abiertos y no consolidados. Los secundarios se marcan `consolidado_en` (no se eliminan).
- **Vincular ticket** desde el detalle (permiso `editar`): ticket + canal → `qd_caso_interacciones` (caso abierto recibe nuevos tickets). No crea un caso nuevo.
- Contador de tickets por caso en la tabla (caso multi-ticket = 1 fila).

### Validación
- Escenarios de gestión validados dentro de una transacción con ROLLBACK (no se persistió nada): cierre, reapertura, caso cerrado NO reutilizado, asignar dominio NO fusiona, consolidación conserva tickets/canal/fecha, vincular ticket a caso abierto.
- Reconciliación: 55 casos / 68 tickets / 0 huérfanos / 0 duplicados / 0 mixtos.

## QD-005 — Corrección conceptual: CASO → N TICKETS (Quejas y Devoluciones)

### Cambios
- El ticket es el contacto; el CASO es la unidad de gestión (1 caso → N tickets).
- El backfill ya NO crea 1 caso por ticket: reconstruye casos reales con evidencia.
- Nueva tabla `qd_relaciones_ticket` que cachea el identificador relacional real de Zendesk (`via.source.from.ticket_id` y `followup_ids`).
- Regla de evidencia documentada en `backend/src/services/quejasCasos.service.ts`:
  1. Relación explícita `follow_up` de Zendesk (prioridad 1).
  2. Identidad real (email/teléfono) + dominio normalizado + tipo (prioridad 2).
  3. Sin relación → caso independiente (sin agrupación ciega).
- Reconstrucción idempotente: elimina casos BACKFILL previos y reconstruye (respaldo previo en `scripts/respaldo-quejas-devoluciones.json`).
- Reconciliación final: 68 tickets Q/D históricos → 55 casos (37 quejas + 18 devoluciones).
- Ejemplos de casos con múltiples tickets: QUE-30092 (5), DEV-30843 (4), QUE-32682 (3), DEV-05646/DEV-32273/DEV-32492/DEV-33068 (2 c/u).
- Frontend: pestañas Todas/Quejas/Devoluciones muestran contador de CASOS (no tickets).
- Eliminados barrels corruptos e inservibles de `src/core/*/index.ts` que rompían el build.

## AGENT-001 — Sincronización de Agentes + Asignación

### Nuevo
- `GET /api/zendesk/agents` — endpoint con cache de 5 min que lista agentes activos de Zendesk
- `AgentStore.ts` — caché local de agentes con sincronización automática al iniciar backend
- `AssignModal.tsx` — modal moderno con buscador, avatar, rol y estado para asignar tickets
- Asignación escribe directamente en Zendesk vía PUT /tickets/{id}/assign
- `assigneeName` ahora se resuelve en la bandeja (inbox) desde el assignee_id de Zendesk
- Botón "Asignar" en WorkspaceArea ya no usa `prompt()`

### Técnico
- Eliminado completamente el `prompt()` del navegador para IDs de agente
- 11 agentes sincronizados desde Zendesk (admins + agents)
- Cache con TTL de 5 minutos, refrescable vía `?sync=true`

## WKS-001 — Workspace de Atención (Primera versión funcional)

### Nuevo
- Layout de 3 columnas en `/atenciones`: Bandeja | Workspace | Cliente 360
- Al hacer clic en un ticket de la bandeja se abre el Workspace en la columna central
- Workspace muestra: asunto, estado, prioridad, canal, ID, fechas, cliente, email
- Conversación estilo chat (cliente izquierda, agente derecha) con hora, autor, tipo, adjuntos
- Chips de estado, prioridad, canal e ID sobre la conversación
- Customer360Panel con datos del cliente (nombre, email, empresa, teléfono, ID, etc.)
- Skeleton mientras carga el ticket
- Componente Retry en caso de error
- Cancelación de petición anterior al cambiar de ticket (AbortController)
- Ticket seleccionado permanece resaltado en la bandeja
- Componentes independientes: `TicketWorkspace`, `ConversationPanel`, `ConversationMessage`, `ConversationSkeleton`, `Customer360Panel`, `ConversationHeader`, `WorkspaceEmptyState`, `WorkspaceErrorState`

### Técnico
- Nuevo hook `useTicketDetail` con AbortController para cancelación
- Consume `/api/zendesk/tickets/{id}` y `/api/zendesk/tickets/{id}/comments`

## ZD-004 — Migración a Zendesk Views API

### Cambios
- `GET /api/zendesk/inbox` ahora consulta vistas oficiales en vez de `/api/v2/tickets.json`
- Nueva fuente: `views/360199057454/tickets.json` (no resueltos)
- Nuevas fuente: `views/360199057434/tickets.json` (recién resueltos)
- Clasificación automática: Pendientes (new/pending), Abiertos (open/hold), Recién resueltos (solved)
- Constantes de vistas en `ZendeskViewIds.ts`
- Documentación técnica en `modules/zendesk/README.md`
