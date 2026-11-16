# Seguimiento Proactivo — submódulo de Clientes

## 1. Objetivo

Convertir la tabla **“Clientes que requieren seguimiento”** del reporte Clientes en casos
operativos con dueño, estado, bitácora y backlog. El reporte sigue siendo la fuente de la
señal; el submódulo es la fuente de la gestión.

```
Reportes → Clientes                 Gestión → Seguimiento proactivo
(tabla en vivo)          ────────►  (casos persistidos)
                                           │
                              ┌────────────┼────────────┐
                              ▼            ▼            ▼
                       Semana actual   Backlog      Historial
                       (por contactar) (meses prev.) (atenciones)
```

## 2. Flujo operativo

1. Cada semana se calculan los clientes con la misma regla del reporte: **≥ 3 atenciones y
   ≥ 2 señales** (SLA > 30 %, tiempo promedio > 24 h, aumento ≥ 2× o reincidencia ≥ 4).
2. El asesor entra a **Gestión → Seguimiento proactivo** y presiona **“Traer a seguimiento”**.
3. Se crea el lote semanal y un caso por cliente. La operación es **idempotente**: si el lote
   ya existe, solo actualiza; nunca duplica un caso abierto.
4. El asesor registra **hora de contacto + resumen** y mueve el estado.
5. Al cambiar el mes, la vista se refresca al período nuevo. Los casos no finalizados pasan al
   **Backlog**; no se borran.

## 3. Reglas de negocio

| Regla | Definición |
|---|---|
| Universo | Clientes identificados (se excluye “No identificados”). |
| Ventana de evaluación | 30 días móviles contra los 30 anteriores al generar el lote. |
| Caso por cliente | Índice único parcial: un solo caso abierto por `clave_cliente`. |
| Snapshot | Las métricas se congelan al detectar; la evolución semanal queda en `sp_caso_semanas`. |
| Estados | `sin_seguimiento` → `con_pendientes` → `finalizado`. Reapertura: `finalizado` → `con_pendientes`. |
| Contacto | Hora real (no futura), resumen ≥ 10 caracteres y estado nuevo. |
| Con pendientes | Exige próximo contacto. Si vence, el caso aparece como pendiente vencido. |
| Finalizado | Exige resumen y cierra el caso. |
| Backlog | Casos abiertos con detección anterior a la semana actual o pendientes vencidos. |
| Permisos | El tab vive en Gestión y usa el permiso del módulo `Clientes`. Asesor: ve todo, edita solo sus casos. Supervisor/admin: edita y reasigna todo. |

## 4. Modelo de datos

Migración: `backend/prisma/migrations/seguimiento-proactivo.sql` (idempotente).

| Tabla | Contenido |
|---|---|
| `sp_lotes` | Semana ISO, período `YYYY-MM`, ventana evaluada, autor y totales. |
| `sp_casos` | Caso vivo: cliente, estado, asesor, snapshot de métricas, motivos y fechas. |
| `sp_caso_semanas` | Aparición del caso en cada lote, con métricas de la semana. |
| `sp_gestiones` | Bitácora 1:N de contactos (hora, resumen, estado anterior/nuevo, usuario). |
| `sp_auditoria` | Creación, actualización, asignación, gestión, cierre y reapertura. |

## 5. API

Prefijo: `/api/clientes/seguimiento` (el dato es de clientes; la ubicación funcional es Gestión).
Todas las rutas requieren sesión y permiso del módulo `Clientes`.

| Método | Ruta | Permiso |
|---|---|---|
| `GET` | `/resumen?semana=&periodo=` | `ver` |
| `GET` | `/candidatos?desde=&hasta=` | `ver` |
| `GET` | `/casos?scope=semana\|mes\|backlog\|todos&estado=&asesorId=&senal=&search=&page=` | `ver` |
| `GET` | `/casos/:id` | `ver` |
| `GET` | `/casos/:id/atenciones?page=` | `ver` |
| `POST` | `/lotes` | `crear` |
| `POST` | `/casos/:id/gestiones` | `editar` |
| `PATCH` | `/casos/:id` | `editar` |

La detección reutiliza `unificadoRepository.clientesV2`, por lo que los números coinciden con
el reporte Clientes. El historial de atenciones usa la misma vista y la misma clave de cliente.

## 6. Interfaz

- Ruta: `/gestion/seguimiento`, dentro del módulo Gestión.
- Tabs del módulo: **Quejas y Devoluciones** | **Seguimiento proactivo** | **Apoyos** | **Agendas**.
- La ruta `/clientes` conserva únicamente la ficha e Historia Clínica del cliente.
- Cabecera: selector de mes y semana, actualizar y “Traer a seguimiento”.
- KPIs: por contactar, con pendientes, finalizados y backlog.
- Pulso de señales: filtro rápido por motivo.
- Bandeja: cliente, estado, asesor, señales, atenciones, variación, reincidencia, tiempo,
  incumplimiento SLA, último contacto y acción.
- Drawer del caso: métricas, motivos, asignación, y tabs **Gestión / Atenciones / Historial**.
- El detalle de atenciones muestra ticket, canal, fecha, categoría, subcategoría, asesor,
  tiempo, SLA y enlace a Zendesk cuando aplica.

## 7. Migración y validación

Aplicar la migración una vez:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f backend/prisma/migrations/seguimiento-proactivo.sql
```

Validación integral:

```bash
cd backend
npx tsx scripts/validar-seguimiento-proactivo.ts
```

Cubre 25 comprobaciones: candidatos, regla del reporte, creación e idempotencia del lote,
resumen, bandeja, detalle, atenciones, transiciones, bitácora, backlog y asesores.
Resultado de la ejecución de referencia (16/11/2026): **25 OK · 0 FAIL**.

## 8. Limitaciones conocidas

- La generación es **manual**. No hay scheduler en el backend; se puede automatizar después
  con un job que invoque `POST /lotes`.
- La ventana es móvil de 30 días. No se recalcula el histórico al cambiar de mes.
- Un caso finalizado no se reabre automáticamente: si el cliente vuelve a cumplir señales,
  se crea un caso nuevo.
- El enlace a Zendesk solo se genera para tickets Zendesk con subdominio válido.
- El submódulo no modifica el ticket, no envía mensajes y no crea SLA ni calendarios.
