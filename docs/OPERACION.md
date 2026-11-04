# Reporte Operación — Planificación de capacidad

## 1. Objetivo

Convertir Operación en un dashboard de demanda y capacidad operativa:

- Cuánto trabajo se recibe.
- Qué días y horarios concentran la demanda.
- Cómo evoluciona el volumen por día, semana, mes y trimestre.
- Qué canales concentran el trabajo.
- Cómo se distribuye la demanda por asesor y categoría.

El reporte mide **demanda recibida**; no mide capacidad disponible ni infiere
capacidad ociosa.

---

## 2. Universo

Se incluyen todas las atenciones recibidas, independientemente de su estado
actual. **No se aplica** el filtro de atenciones finalizadas del Resumen.

La fecha utilizada es la de **creación** de la atención:

```sql
CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END AS creacion
```

- WhatsApp/Whaticket: `fecha` + `hora` local.
- Zendesk: `tickets_created_at` UTC convertido a America/Lima.
- No se usa `fecha_reporte`, fecha de cierre ni `tickets_updated_at`.

---

## 3. Evidencia de zona horaria Zendesk

Se contrastaron cinco tickets de `Categorización_zendesk` contra la API real de
Zendesk (`GET /api/v2/tickets/{id}.json`). La columna de la BD coincide
exactamente con el `created_at` UTC de la API:

| Ticket | DB `tickets_created_at` | API `created_at` |
|---|---|---|
| 35186 | 2026-11-03T15:00:49Z | 2026-11-03T15:00:49Z |
| 35177 | 2026-11-03T01:09:32Z | 2026-11-03T01:09:32Z |
| 35175 | 2026-11-02T23:17:30Z | 2026-11-02T23:17:30Z |
| 35173 | 2026-11-02T21:35:36Z | 2026-11-02T21:35:36Z |
| 35170 | 2026-11-02T20:45:36Z | 2026-11-02T20:45:36Z |

Conclusión: `tickets_created_at` está almacenado en UTC. La conversión a
America/Lima es correcta. `fecha_reporte` es una fecha local de reporte y no la
fecha de creación: difiere de `tickets_created_at::date` en 1,006 filas.

Script de evidencia:

```bash
cd backend
npx tsx scripts/check-zendesk-time.ts
```

---

## 4. Deduplicación y atribución por canal

### Regla

- Clave: `ZENDESK:<ticket_id>` o `WA:<ticket_id>`.
- Se conserva el registro con `creacion` más temprana.
- Si empatan, se elige el `subcanal` alfabéticamente.
- Sin filtro de canal: se deduplica.
- Un solo canal seleccionado: se conservan sus filas reales, sin ocultar el
  ticket duplicado.
- Varios canales que incluyen WHATMETA y WHATICKET: se deduplican.

### Reconciliación actual

| Concepto | Valor |
|---|---:|
| Filas crudas | 23,381 |
| Tickets únicos / consolidado | 23,379 |
| Duplicados entre canales | 2 |
| WAMETA | 16,750 |
| WHATICKET | 1,347 |
| ZENDESK | 5,284 |
| Suma de canales | 23,381 |

Los dos tickets duplicados son 9108 y 9230, presentes en WHATMETA y WHATICKET
con la misma fecha/hora de creación.

La interfaz muestra el consolidado y la suma de canales. Si la suma excede el
consolidado, se indica cuántos tickets están en más de un canal. Al filtrar
WAMETA o WHATICKET individualmente, se muestran sus filas reales.

---

## 5. KPI

| KPI | Cálculo |
|---|---|
| Atenciones recibidas | Total del universo seleccionado. |
| Promedio por día calendario | Total / días calendario del rango. |
| Día de mayor demanda | DOW con mayor volumen agregado. |
| Hora de mayor demanda | Hora con mayor volumen agregado. |

Cada KPI compara contra el periodo anterior equivalente. Total y promedio
muestran variación absoluta y porcentual. Los picos muestran el valor actual y
el del periodo anterior.

---

## 6. Mapa de calor

- Eje Y: Lun–Dom.
- Eje X: 00:00–23:00.
- Intensidad: atenciones recibidas en el rango.
- Tooltip: total, días observados y promedio por día observado.
- Celdas grises: día sin ocurrencias en el rango.
- Celdas claras: día observado sin atenciones en esa hora.
- Aviso de muestra corta si el rango tiene menos de 14 días o si algún día de la
  semana aparece una sola vez.

El mapa usa la fecha/hora de creación, no `fecha`/`hora` crudas de Zendesk.

---

## 7. Evolución

Series para diaria, semanal (ISO), mensual y trimestral:

- Actual vs periodo anterior.
- Periodos completos con ceros.
- Si el rango es de un día, se oculta el gráfico y se muestra un aviso.
- La serie anterior se alinea por posición de periodo.

La granularidad inicial se sugiere según el rango:

| Días | Granularidad |
|---:|---|
| ≤ 31 | Diaria |
| 32–120 | Semanal |
| 121–730 | Mensual |
| > 730 | Trimestral |

El usuario puede cambiarla.

---

## 8. Canal, asesor y categoría

- Canal: `subcanal` WAMETA/WATICKET/ZENDESK.
- Distribución actual con cantidad y porcentaje.
- Evolución por canal en la granularidad seleccionada.
- Asesor: `asesor` de la fuente, contado por fecha de creación.
  - Es volumen **asignado en origen**, no resuelto por el asesor.
  - Se conserva la consolidación actual de nombres.
- Categoría: `categoria`, top 8, cantidad y porcentaje del total recibido.

---

## 9. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-operacion.ts
```

Cubre:

- Total KPI = SQL deduplicado.
- Días con datos = SQL.
- Suma del heatmap = total.
- Suma de días por DOW = días con datos.
- Canales crudos = 16,750 + 1,347 + 5,284 = 23,381.
- Duplicados = 2.
- Consolidado = 23,381 − 2 = 23,379.
- Filtro WAMETA = 16,750, sin duplicados.
- Evolución diaria/semanal/mensual/trimestral: suma = total.
- Evolución por canal: suma = 23,381.
- Hora pico, día pico y rango contra SQL.
- Registros con fecha/hora inválida = 0.
- Rendimiento del repositorio ≈ 2.0 s.

Resultado al cierre: **27/27 comprobaciones OK**.

---

## 10. Limitaciones

- La conversión Zendesk UTC → America/Lima depende de que la fuente mantenga
  `tickets_created_at` en UTC; la evidencia actual lo confirma.
- La suma de canales puede exceder el consolidado por los tickets duplicados;
  se muestra la reconciliación.
- El “día de mayor demanda” usa volumen total del rango, no promedio por
  ocurrencia.
- No hay datos de turnos, dotación o disponibilidad, por lo que no se infiere
  capacidad ociosa.
- La normalización de país/categoría mantiene sus reglas actuales.
