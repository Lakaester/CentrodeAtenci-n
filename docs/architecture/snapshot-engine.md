# Snapshot Engine — COPE

> Comparativa de estrategias para calcular el estado historico de tickets.

---

## Alternativa A: Snapshots Diarios

### Descripcion

Un job programado (cron) ejecuta diariamente una consulta que captura el estado de cada ticket activo al cierre del dia y lo persiste en `ticket_status_snapshot`. Las consultas historicas leen directamente de esta tabla precalculada.

### Ventajas

| Aspecto | Valoracion |
|---------|-----------|
| Rendimiento en lectura | **Excelente.** Las consultas de backlog/estado son O(1) contra la tabla de snapshots. |
| Simplicidad | **Alta.** El job diario es una unica consulta SQL. |
| Reporteria | **Directa.** `WHERE fecha = '2026-07-31'` devuelve el estado exacto al cierre. |
| Debugging | **Facil.** Los snapshots son inmutables. Se puede reconstruir cualquier fecha. |

### Desventajas

| Aspecto | Valoracion |
|---------|-----------|
| Granularidad | **Dia.** No se puede consultar el estado a una hora especifica (ej: 3:15 PM). |
| Precision intra-dia | **Baja.** Si un ticket cambio 3 veces en un dia, solo se captura el estado final. |
| Almacenamiento | **Medio.** ~500 filas/dia × 365 dias = ~182,500 filas/ano. Despreciable. |
| Ventana de datos | **Solo desde activacion.** No se puede reconstruir el pasado anterior a la activacion del job. |

### Query del job diario

```sql
INSERT INTO ticket_status_snapshot (fecha, ticket_id, canal, estado, ultima_transicion)
SELECT
    CURRENT_DATE - 1 AS fecha,
    t.ticket_id,
    t.canal,
    t.estado,
    MAX(t.fecha_evento) AS ultima_transicion
FROM ticket_status_history t
WHERE t.fecha_evento < CURRENT_DATE
GROUP BY t.ticket_id, t.canal, t.estado
ON CONFLICT (fecha, ticket_id) DO NOTHING;
```

---

## Alternativa B: Event Sourcing

### Descripcion

Cada cambio de estado se persiste como un evento inmutable en `ticket_status_history`. El estado en cualquier momento se calcula "reproduciendo" los eventos desde el inicio hasta la fecha consultada. No se almacenan snapshots precalculados.

### Ventajas

| Aspecto | Valoracion |
|---------|-----------|
| Precision | **Excelente.** Se puede reconstruir el estado a cualquier segundo del dia. |
| Auditoria completa | **Nativa.** Cada transicion queda registrada con timestamp, usuario y origen. |
| Flexibilidad | **Alta.** Se pueden agregar nuevas consultas sin modificar la estructura de datos. |
| Reconstruccion | **Total.** Se puede regenerar cualquier estado en cualquier momento. |

### Desventajas

| Aspecto | Valoracion |
|---------|-----------|
| Rendimiento en lectura | **Bajo-Moderado.** Consultar el estado al cierre de mes requiere procesar todas las transiciones hasta esa fecha. |
| Complejidad | **Alta.** Requiere logica de proyeccion (replay de eventos) para cada consulta historica. |
| Volumen de datos | **Alto.** ~2,000 eventos/dia × 365 = ~730,000 eventos/ano. |
| Curva de aprendizaje | **Alta.** El equipo debe entender el patron Event Sourcing. |

### Query de estado en fecha

```sql
-- Encontrar el estado de un ticket al 31 de julio a las 23:59
SELECT estado
FROM ticket_status_history
WHERE ticket_id = $1
  AND fecha_evento <= '2026-07-31 23:59:59'
ORDER BY fecha_evento DESC
LIMIT 1;
```

### Query de backlog en fecha (sin snapshot)

```sql
-- Calcular backlog al 31 de julio. Escala O(n) con el numero de tickets.
WITH ultimo_estado AS (
    SELECT DISTINCT ON (ticket_id)
        ticket_id, estado
    FROM ticket_status_history
    WHERE fecha_evento <= '2026-07-31 23:59:59'
    ORDER BY ticket_id, fecha_evento DESC
)
SELECT estado, COUNT(*) AS total
FROM ultimo_estado
WHERE estado != 'cerrado'
GROUP BY estado;
```

---

## Comparativa

| Dimension | Snapshots Diarios (A) | Event Sourcing (B) |
|-----------|----------------------|-------------------|
| **Rendimiento lectura** | 9/10 | 4/10 |
| **Precision temporal** | 4/10 (dia) | 10/10 (segundo) |
| **Complejidad implementacion** | 3/10 | 8/10 |
| **Almacenamiento** | Bajo (snapshots) | Medio (eventos) |
| **Escalabilidad** | 9/10 | 6/10 |
| **Mantenimiento** | 7/10 | 4/10 |
| **Auditoria** | 5/10 (solo fin de dia) | 10/10 (cada cambio) |
| **Costo de migracion** | Bajo | Alto |

---

## Recomendacion: Modelo HIBRIDO (A + B)

### Estrategia

1. **Event Sourcing** como fuente de verdad (`ticket_status_history`): cada cambio de estado se persiste como evento inmutable con timestamp, usuario y origen.

2. **Snapshots diarios** como cache de lectura (`ticket_status_snapshot`): un job diario precalcula el estado de cada ticket al cierre del dia.

3. **Consultas de dashboard** leen de `ticket_status_snapshot` (rendimiento).
4. **Consultas de auditoria** leen de `ticket_status_history` (precision).
5. **Consultas intra-dia** leen de `ticket_status_history` (flexibilidad).

### Por que

- El 95% de las consultas del dashboard son "backlog al cierre de mes" o "estado al 31 de julio" → snapshots cubren este caso con rendimiento excelente.
- El 5% restante son auditorias ("quien cambio el estado a las 3 PM") o metricas avanzadas ("tiempo en cada estado") → eventos cubren este caso con precision total.
- El modelo hibrido es el patron estandar en sistemas BI: ETL diario para dashboards + eventos para trazabilidad.
- La complejidad adicional del hibrido es marginal (un job diario + queries directas cuando se necesita detalle).
