# Historical KPIs — COPE

> Nuevos indicadores habilitados por el Historical Ticket Engine. Hoy NO son posibles porque solo existe `estado_homologado` (estado actual).

---

## 1. Backlog Historico

### Definicion

Cantidad de tickets abiertos (no cerrados) al cierre de un periodo especifico.

### Query

```sql
SELECT estado, COUNT(*) AS total
FROM ticket_status_snapshot
WHERE fecha = '2026-07-31' AND estado != 'cerrado'
GROUP BY estado;
```

### Dashboard destino

Resumen Ejecutivo (nueva seccion "Backlog Historico"), Asesores.

### Valor de negocio

Permite comparar el backlog mes a mes. Responde: "¿Estamos mejorando o empeorando?"

---

## 2. Reaperturas

### Definicion

Cantidad de veces que un ticket paso de `cerrado`/`resuelto` a `abierto`/`pending`.

### Query

```sql
SELECT
    ticket_id,
    COUNT(*) AS reaperturas,
    MIN(fecha_evento) AS primera_apertura,
    MAX(fecha_evento) AS ultima_apertura
FROM ticket_status_history
WHERE estado_anterior IN ('cerrado', 'resuelto')
  AND estado IN ('abierto', 'pending')
  AND fecha_evento BETWEEN $1 AND $2
GROUP BY ticket_id
HAVING COUNT(*) > 0
ORDER BY reaperturas DESC;
```

### Dashboard destino

Asesores, Supervisor, Pais.

### Valor de negocio

Identifica tickets problematicos y patrones de reapertura por asesor o categoria.

---

## 3. Tiempo en Espera del Cliente

### Definicion

Tiempo acumulado que un ticket permanecio en estado `pending` (esperando respuesta del cliente).

### Query

```sql
SELECT
    ticket_id,
    SUM(
        EXTRACT(EPOCH FROM (
            LEAD(fecha_evento) OVER (PARTITION BY ticket_id ORDER BY fecha_evento)
            - fecha_evento
        )) / 3600
    ) AS horas_espera_cliente
FROM ticket_status_history
WHERE estado = 'pending'
  AND fecha_evento BETWEEN $1 AND $2
GROUP BY ticket_id;
```

### Dashboard destino

Asesores, Tendencias.

---

## 4. Tiempo en Espera del Asesor

### Definicion

Tiempo acumulado que un ticket permanecio en estado `open` sin respuesta del asesor.

### Query

```sql
SELECT
    ticket_id,
    SUM(
        EXTRACT(EPOCH FROM (
            LEAD(fecha_evento) OVER (PARTITION BY ticket_id ORDER BY fecha_evento)
            - fecha_evento
        )) / 3600
    ) AS horas_espera_asesor
FROM ticket_status_history
WHERE estado = 'open' OR estado = 'abierto'
  AND fecha_evento BETWEEN $1 AND $2
GROUP BY ticket_id;
```

### Dashboard destino

Asesores, SLA.

---

## 5. Tiempo por Estado (State Duration)

### Definicion

Desglose del tiempo total que un ticket paso en cada estado.

```
Ticket #12345:
  open:     2.5 h
  pending:  8.0 h
  solved:   0.5 h
  closed:   —
  TOTAL:   11.0 h
```

### Query

```sql
SELECT
    estado,
    SUM(duracion_horas) AS horas_totales,
    COUNT(*) AS transiciones,
    AVG(duracion_horas) AS promedio_horas
FROM (
    SELECT
        estado,
        EXTRACT(EPOCH FROM (
            LEAD(fecha_evento) OVER (PARTITION BY ticket_id ORDER BY fecha_evento)
            - fecha_evento
        )) / 3600 AS duracion_horas
    FROM ticket_status_history
    WHERE ticket_id = $1
) sub
WHERE duracion_horas IS NOT NULL
GROUP BY estado
ORDER BY horas_totales DESC;
```

### Dashboard destino

Supervisor, Live Operations, Asesores.

---

## 6. Aging Real

### Definicion

Tiempo desde la creacion hasta el cierre (o hasta hoy si sigue abierto), usando fechas historicas reales.

### Query

```sql
SELECT
    ticket_id,
    MIN(fecha_evento) AS fecha_creacion,
    MAX(CASE WHEN estado = 'cerrado' THEN fecha_evento END) AS fecha_cierre,
    EXTRACT(EPOCH FROM (
        COALESCE(
            MAX(CASE WHEN estado = 'cerrado' THEN fecha_evento END),
            NOW()
        ) - MIN(fecha_evento)
    )) / 3600 AS horas_vida
FROM ticket_status_history
WHERE ticket_id = $1
GROUP BY ticket_id;
```

### Dashboard destino

Resumen Ejecutivo, Supervisor.

---

## 7. SLA Historico

### Definicion

Porcentaje de tickets que cumplieron el SLA de primera respuesta, calculado con fechas historicas reales (no con el estado actual).

### Query

```sql
WITH primera_respuesta AS (
    SELECT DISTINCT ON (ticket_id)
        ticket_id,
        fecha_evento AS fecha_respuesta,
        EXTRACT(EPOCH FROM (fecha_evento - LAG(fecha_evento) OVER (PARTITION BY ticket_id ORDER BY fecha_evento))) / 60 AS minutos_primera_respuesta
    FROM ticket_status_history
    WHERE origen = 'asesor'
      AND fecha_evento BETWEEN $1 AND $2
    ORDER BY ticket_id, fecha_evento ASC
)
SELECT
    COUNT(*) FILTER (WHERE minutos_primera_respuesta <= $umbral) AS dentro_sla,
    COUNT(*) AS total,
    ROUND(100.0 * COUNT(*) FILTER (WHERE minutos_primera_respuesta <= $umbral) / COUNT(*), 1) AS pct_cumplimiento
FROM primera_respuesta;
```

### Dashboard destino

SLA, Resumen Ejecutivo, Asesores.

---

## 8. Curva de Backlog Diario

### Definicion

Evolucion diaria del backlog (tickets abiertos) a lo largo del mes.

### Query

```sql
SELECT fecha, COUNT(*) AS backlog
FROM ticket_status_snapshot
WHERE fecha BETWEEN $1 AND $2
  AND estado != 'cerrado'
GROUP BY fecha
ORDER BY fecha;
```

### Visualizacion

Area Chart (similar al grafico de evolucion de Pais). Eje X: dias del mes. Eje Y: cantidad de tickets abiertos.

### Dashboard destino

Resumen Ejecutivo, Tendencias.

---

## 9. Conversion Funnel (Embudo de Estados)

### Definicion

Embudo que muestra cuantos tickets avanzan por cada etapa del ciclo de vida.

```
Creados:      1,200  (100%)
Asignados:    1,150  (96%)
Respondidos:  1,080  (90%)
Pendientes:     420  (35%)
Resueltos:      980  (82%)
Cerrados:       950  (79%)
Reabiertos:      45  (4%)
```

### Query

```sql
SELECT
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado IS NOT NULL) AS creados,
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado_anterior = 'pendiente') AS asignados,
    COUNT(DISTINCT ticket_id) FILTER (WHERE origen = 'asesor') AS respondidos,
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado = 'pending') AS pendientes,
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado = 'resuelto') AS resueltos,
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado = 'cerrado') AS cerrados,
    COUNT(DISTINCT ticket_id) FILTER (WHERE estado_anterior IN ('cerrado','resuelto') AND estado IN ('abierto','pending')) AS reabiertos
FROM ticket_status_history
WHERE fecha_evento BETWEEN $1 AND $2;
```

### Dashboard destino

Supervisor, Resumen Ejecutivo.

---

## 10. Mapa de KPIs → Dashboards

| KPI | Resumen Ejecutivo | Asesores | Pais | Tendencias | SLA | Supervisor | Live Ops |
|-----|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| Backlog Historico | X | X | | | | | |
| Reaperturas | | X | X | | | X | |
| Tiempo Espera Cliente | | X | | X | | | |
| Tiempo Espera Asesor | | X | | | X | | |
| Tiempo por Estado | | X | | | | X | X |
| Aging Real | X | | | | | X | |
| SLA Historico | X | X | | | X | | |
| Curva Backlog Diario | X | | | X | | | |
| Conversion Funnel | X | | | | | X | |
