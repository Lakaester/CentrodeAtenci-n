# Reporte Zendesk — impacto operativo

## 1. Objetivo

Medir volumen, evolución, primera respuesta, resolución y backlog del canal
**Zendesk/Correo** sin duplicar los reportes de Categorías, Asesores o País.

Preguntas que responde:

- ¿Cuántos tickets ingresaron realmente en el periodo?
- ¿La demanda aumenta o disminuye frente al periodo anterior?
- ¿Qué tan oportuna es la primera respuesta y la resolución?
- ¿Cuántos tickets permanecen abiertos, pendientes o en espera al corte?

No se afirma impacto comercial ni riesgo. No se usa FCR ni SLA de resolución.

---

## 2. Universo

Tickets de Zendesk/Correo identificados por canal:

```sql
(canal ILIKE '%zendesk%' OR canal ILIKE '%correo%')
```

La fecha del universo es la **fecha real de creación** del ticket, no la fecha de
reporte:

```sql
CASE
  WHEN tickets_created_at IS NOT NULL
    THEN tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima'
  ELSE fecha::date + hora::time
END
```

- `tickets_created_at` es `timestamp without time zone` y almacena UTC.
- Se convierte a `America/Lima` antes de comparar con el rango del filtro.
- El rango es semiabierto: `>= inicio` y `< fin + 1 minuto`.
- El universo incluye todos los estados actuales del ticket; no se filtra por
  atenciones finalizadas.

### Diferencia contra la fecha de reporte

Octubre 2026:

| Criterio | Tickets |
|---|---:|
| Fecha real de creación | **750** |
| `fecha` de reporte | 729 |
| Diferencia | **21** |

Los 21 tickets restantes se crearon en octubre pero tienen fecha de reporte en
otro mes (o viceversa). La fecha de reporte no se usa para el volumen ni para la
evolución.

---

## 3. Estados

Seis grupos mutuamente excluyentes. Cada ticket pertenece a uno solo:

| Grupo | Criterio |
|---|---|
| Cerrados | `estado_homologado = 'cerrado'` |
| Resueltos | `estado_homologado = 'resuelto'` |
| Abiertos | `estado_homologado = 'abierto'` |
| Pendientes | `estado_homologado = 'pendiente'` |
| En espera | `estado_homologado = 'en_espera'` |
| Otros | Cualquier otro valor |

Invariante de octubre 2026:

```text
Total 750 = Cerrados 691 + Resueltos 59 + Abiertos 0
          + Pendientes 0 + En espera 0 + Otros 0
```

Cerrado y resuelto se muestran por separado. En la vista actual no existen
tickets abiertos, pendientes ni en espera; se muestran en 0 para no ocultar la
estructura del estado.

---

## 4. Tiempos y cobertura

### Primera respuesta

Un ticket es evaluable cuando `primera_respuesta_min_norm IS NOT NULL`.

Se excluyen de mediana, p90, promedio, SLA y denominador de cobertura los
tickets sin primera respuesta.

Octubre 2026:

| Métrica | Valor |
|---|---:|
| n / cobertura | 664 / 88.5% |
| Mediana | 322.5 min (5.4 h) |
| P90 | 2,354.0 min (1.6 d) |
| Promedio (secundario) | 865.9 min |
| Sin dato | 86 |

### Resolución

Se excluye el grupo sin tiempo válido:

```sql
resolucion_min_norm IS NOT NULL
AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
```

Los 14 tickets con resolución 0 y primera respuesta nula no representan una
resolución real; se reportan como **sin tiempo válido** y no entran en mediana,
p90, promedio ni cobertura.

Octubre 2026:

| Métrica | Valor |
|---|---:|
| n / cobertura | 736 / 98.1% |
| Mediana | 1,128.6 min (18.8 h) |
| P90 | 4,944.0 min (3.4 d) |
| Promedio (secundario) | 1,895.9 min |
| Sin tiempo válido | 14 |

La mediana y el p90 son la lectura principal. El promedio se muestra como dato
secundario, siempre junto con `n` y cobertura.

---

## 5. SLA

Regla aplicada: **primera respuesta ≤ 1,440 minutos** (configuración de correo en
`SLA_MINUTOS.primeraRespuesta.correo`).

- Se excluyen los tickets sin primera respuesta.
- Se muestra `cumple / evaluables`.
- Se muestra el porcentaje y el umbral.
- No se aplica SLA de resolución.

Octubre 2026: **542 / 664 = 81.6%**.

El SLA de resolución se retiró: la resolución válida depende de datos que no
siempre están poblados y una meta provisional induciría una lectura falsa.

---

## 6. FCR

Se retiró completamente. El cálculo anterior era una tasa de cierre
(`cerrado + resuelto / total`), no una resolución en el primer contacto.

En su lugar se muestra la distribución de estados.

---

## 7. Backlog

El backlog es una foto al corte actual, no una serie histórica:

- Abiertos, pendientes y en espera al momento de la consulta.
- Fecha de corte explícita: `NOW() AT TIME ZONE 'America/Lima'`.
- No se reconstruye un backlog pasado con la fecha de creación.
- No se inventa una tendencia que la fuente no sustenta.

Octubre 2026, al corte 2026-11-03 16:34 (America/Lima):

| Grupo | Tickets |
|---|---:|
| Abiertos | 0 |
| Pendientes | 0 |
| En espera | 0 |
| **Total** | **0** |

La vista Zendesk solo contiene tickets `closed` y `solved`; por eso no hay
backlog. El bloque igualmente informa la fecha de corte y explica la ausencia de
tendencia.

---

## 8. Evolución

- Serie diaria de tickets creados.
- Comparación contra el periodo anterior equivalente (`rangoAnterior`).
- Selector diario, semanal y mensual.
- Serie actual y anterior completas, con ceros en los días sin tickets.
- Variación absoluta y porcentual.

Octubre 2026: **750 actual vs. 807 anterior = -57 (-7.1%)**.

El periodo anterior se calcula por la misma fecha real de creación, no por la
fecha de reporte.

---

## 9. Alcance y exclusiones

El reporte no incluye:

- FCR.
- Gráficos de dona o treemap.
- Rankings de asesores.
- Países o dominios.
- Tiempos por categoría, subcategoría o asesor.
- SLA de resolución.
- Tendencia histórica de backlog.

Esas vistas pertenecen a Categorías, Asesores o País y se evita duplicarlas.

---

## 10. Endpoint

`GET /api/dashboard/zendesk`

```ts
{
  kpis: {
    totalTickets, cerrados, resueltos, abiertos, pendientes, enEspera, otros,
    primeraN, primeraCobertura, primeraMediana, primeraP90, primeraPromedio,
    primeraSinDato,
    resolucionN, resolucionCobertura, resolucionMediana, resolucionP90,
    resolucionPromedio, resolucionExcluidas,
    slaPrimeraCumple, slaPrimeraEvaluables, slaPrimeraPct, slaPrimeraUmbral,
    totalAnterior, variacionAbs, variacionPct
  },
  estados: { estado, etiqueta, total, pct }[],
  evolucion: {
    actual, anterior, totalActual, totalAnterior, variacionAbs, variacionPct
  },
  backlog: { abiertos, pendientes, enEspera, total, fechaCorte },
  insights: string[]
}
```

No incluye `fcr`, `slaResolucion`, `tiempoPromedioTicket`, `treemap`,
`topSubcategorias`, `asesores`, `paises`, `dominios`, `clientes`,
`slaCategoria`, `tiemposCategoria`, `tiemposSubcategoria`, `tiemposAsesor`,
`ticketsAntiguos`, `incumplimientos`, `categoriasCriticas` ni `tendencia`.

---

## 11. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-zendesk.ts
```

Cubre 15 puertas y 48 comprobaciones:

1. Total y suma de estados contra SQL.
2. Estados mutuamente excluyentes y porcentajes.
3. Demanda por fecha real de creación.
4. Primera respuesta (n, mediana, p90, promedio, sin dato).
5. Resolución válida y excluidas.
6. Cobertura sobre el universo correcto.
7. SLA 1,440 min con cumple/evaluables.
8. FCR y promedio duplicado ausentes.
9. SLA de resolución y regla de 20 min ausentes.
10. Evolución actual/anterior y variación.
11. Backlog con fecha de corte válida.
12. Filtros globales (subcanal y rango).
13. Sin NaN/Infinity.
14. Pruebas y TypeScript se ejecutan aparte.
15. Revisión visual se realiza aparte.

Resultado: **48/48 OK**.

Rendimiento del repositorio: ~1.4–2.0 s para octubre.

---

## 12. Capturas

- `docs/captures/zendesk-general.html`: vista completa con KPI, estados,
  evolución, backlog, capacidad e insights.

Captura HTML autocontenida de la interfaz renderizada (estilos y gráficos). La
captura PNG del escritorio no fue posible porque la ventana de la app no estaba
visible.

---

## 13. Limitaciones

- 86 tickets no tienen primera respuesta; su cobertura es 88.5% y no se imputan
  valores.
- 14 tickets tienen resolución 0 y primera respuesta nula; se excluyen y se
  reportan.
- No hay tickets abiertos, pendientes ni en espera en la vista; el backlog es 0 y
  no se puede validar una tendencia histórica.
- La fecha de reporte difiere de la fecha de creación en 21 tickets de octubre;
  no se usa para el volumen.
- `MAX(fecha_carga)` está desactualizado (2026-07-08); no se usa como corte.
- No hay datos de satisfacción, ventas o retención; no se afirma impacto
  comercial.
- No se modifican otros reportes ni reglas compartidas.
