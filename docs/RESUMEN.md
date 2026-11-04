# Reporte Resumen — universo de atenciones finalizadas

## 1. Objetivo

El reporte **Resumen** es un dashboard ejecutivo de gestión. Todas sus métricas
se calculan exclusivamente sobre atenciones **finalizadas**:

```sql
estado_homologado IN ('cerrado', 'resuelto')
```

No se mezclan atenciones abiertas, pendientes ni estados sin mapear.

---

## 2. Estados auditados

| `estado_homologado` | Origen | ¿Finalizada? |
|---|---|---|
| `cerrado` | `closed` | Sí |
| `resuelto` | `solved` | Sí |
| `abierto` | `open` | No |
| `sin_mapear` | `NO`, `SI` | No |

Al cierre de la implementación, el universo finalizado era **22,765**
atenciones. El valor puede variar por nuevas atenciones o cambios legítimos.

---

## 3. KPIs

| Tarjeta | Valor | Denominador / detalle |
|---|---|---|
| Atenciones finalizadas | Total de cerradas + resueltas | Universo finalizado. |
| Cumplimiento de primera respuesta | `pr_dentro / pr_con_dato` | Solo atenciones con tiempo de primera respuesta. |
| Cumplimiento de resolución | `res_dentro / res_con_dato` | Solo atenciones con tiempo de resolución. |
| Tiempo promedio de resolución | `AVG(resolucion_min_norm)` | Ignora valores nulos; no los convierte en cero. |

Las tarjetas de cumplimiento muestran:

- Porcentaje.
- Cantidad que cumple.
- Cantidad que incumple.
- Cantidad con dato.
- Variación en puntos porcentuales contra el periodo anterior.

Las metas SLA se mantienen sin cambios:

```ts
primeraRespuesta: { whatsapp: 15, correo: 1440, otro: 60 }
resolucion:       { whatsapp: 120, correo: 1440, otro: 480 }
```

---

## 4. Tiempos por canal

Se agrupan por **`subcanal`** para no mezclar WHATMETA y WHATICKET dentro de
WhatsApp:

- WATICKET
- WAMETA
- ZENDESK

Solo se incluyen atenciones finalizadas. Los promedios usan únicamente registros
con tiempo válido.

---

## 5. Distribución por canal

Se unificó la participación por canal en una sola sección basada en
**`subcanal`**. `canal` (WHATSAPP/CORREO) representa el transporte; `subcanal`
es el canal operativo.

Se muestra cantidad y porcentaje sobre el total de atenciones finalizadas.

---

## 6. Ranking de asesores

El ranking usa solo atenciones finalizadas y conserva la fórmula existente:

```text
score = 100 × (
  0.40 × cumplimiento_1ra_respuesta
+ 0.30 × velocidad_1ra_respuesta
+ 0.30 × volumen
)
```

- `cumplimiento_1ra = pr_dentro / pr_con_dato`.
- `velocidad = (maxT - promPrimera) / (maxT - minT)`.
- `volumen = total / maxTotal`.
- Mínimo 5 atenciones finalizadas para entrar al podio.

No se modificaron pesos, metas ni el criterio de consolidación de nombres. Se
agrega visualmente el **cumplimiento de resolución** como dato informativo, sin
incluirlo en el score.

---

## 7. País y categoría

- País: cantidad y porcentaje sobre el total finalizado.
- Categoría: cantidad de atenciones finalizadas.
- Se muestran los primeros 8 registros, sin scroll interno.
- Se mantiene la normalización actual de país y categoría.

---

## 8. Detalle de atenciones

El endpoint `/api/dashboard/detalle` acepta:

```text
universo=final
```

El Resumen envía siempre ese parámetro. El detalle y su exportación Excel
incluyen únicamente atenciones cerradas o resueltas.

Se mantienen:

- Filtros locales de fecha.
- Filtros globales del dashboard.
- Paginación.
- Descarga Excel.

Cuando no hay filtros locales de fecha, el total del detalle coincide con el KPI
de atenciones finalizadas.

---

## 9. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-resumen.ts
```

Comprueba contra SQL independiente:

- Total finalizado.
- Primera respuesta: con dato, dentro, fuera y porcentaje.
- Resolución: con dato, dentro, fuera y porcentaje.
- Promedios que ignoran nulos.
- Tiempos y distribución por subcanal.
- País y categoría.
- `porEstado` solo contiene `cerrado`/`resuelto`.
- Ranking con mínimo de atenciones finalizadas.
- Detalle `universo=final` = KPI total.
- Detalle sin `universo` incluye más registros.
- Filtro por subcanal.
- Rango de fechas y periodo anterior.

Resultado al cierre: **40/40 comprobaciones OK**. La línea base de **22,765**
coincidió con el universo finalizado en la validación inicial; luego el dato
pasó a 22,766 por una nueva atención finalizada, manteniendo la igualdad entre
KPI, detalle y SQL.

---

## 10. Limitaciones

- El periodo anterior de un rango de 12 meses puede tener poca cobertura
  histórica; las variaciones porcentuales pueden ser muy altas.
- La normalización de país mantiene etiquetas duplicadas como
  `Dominican Republic` y `Republica Dominicana`.
- La categoría `SIN HOMOLOGAR` se conserva como categoría de origen; no se
  modifica la regla de homologación.
- La consolidación de nombres de asesores promedia subgrupos; es el
  comportamiento existente y no se alteró.
