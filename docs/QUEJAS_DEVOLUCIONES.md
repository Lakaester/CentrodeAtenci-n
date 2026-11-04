# Reporte Quejas y Devoluciones — impacto operativo

## 1. Objetivo

Medir los casos clasificados como **queja** o **solicitud de devolución**, su
volumen, evolución, estado, canal, tiempos de atención y distribución por asesor.

Preguntas que responde:

- ¿Cuántos casos Q/D se registraron en el periodo?
- ¿Qué proporción son quejas y qué proporción devoluciones?
- ¿La demanda aumenta o disminuye frente al periodo anterior?
- ¿En qué estado se encuentran los casos?
- ¿Qué tan oportuna es la primera respuesta y la resolución?
- ¿Cómo se distribuyen los casos entre asesores y canales?

No se usa FCR, SLA ni montos del módulo operativo de casos.

---

## 2. Universo

Tickets de `public.v_unificado_norm` que cumplen:

```sql
COALESCE(NULLIF(TRIM(REPLACE(categoria, '_', ' ')), ''), 'Sin categoría') = 'GESTION'
AND cope_scat_normalizada(subcategoria) IN ('queja', 'solicitud de devolucion')
```

- Incluye todos los estados: cerrado, resuelto, abierto, pendiente, en espera,
  sin mapear y otros.
- No se filtra por atenciones finalizadas: el reporte mide la demanda Q/D y su
  estado actual.
- Una fila representa un ticket. Se validó que no hay tickets duplicados en el
  universo de octubre.
- No se mezcla con `qd_casos`: el módulo operativo de casos no tiene datos de
  octubre y responde a otro modelo de seguimiento.

### Fecha

Se usa la **fecha real de creación**:

```sql
CASE
  WHEN tickets_created_at IS NOT NULL
    THEN tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima'
  ELSE fecha::date + hora::time
END
```

- Zendesk: UTC → America/Lima.
- WhatsApp: fecha y hora locales.
- Rango semiabierto: `>= inicio` y `< fin + 1 minuto`.

Octubre 2026:

| Criterio | Casos |
|---|---:|
| Fecha real de creación | **17** |
| `fecha` de reporte | 16 |
| Diferencia | **1** |

La diferencia corresponde a un ticket creado en octubre con fecha de reporte en
otro mes. Se usa creación para alinearse con Operación, Clientes y Zendesk.

---

## 3. Tipos

| Tipo | Criterio |
|---|---|
| Queja | `cope_scat_normalizada(subcategoria) = 'queja'` |
| Devolución | `cope_scat_normalizada(subcategoria) = 'solicitud de devolucion'` |

Invariante:

```text
Total = Quejas + Devoluciones
```

Octubre 2026: **17 = 7 quejas + 10 devoluciones**.

---

## 4. Estados

Siete grupos mutuamente excluyentes:

| Grupo | Criterio |
|---|---|
| Cerrados | `estado_homologado = 'cerrado'` |
| Resueltos | `estado_homologado = 'resuelto'` |
| Abiertos | `estado_homologado = 'abierto'` |
| Pendientes | `estado_homologado = 'pendiente'` |
| En espera | `estado_homologado = 'en_espera'` |
| Sin mapear | `estado_homologado = 'sin_mapear'` |
| Otros | Cualquier otro valor |

Octubre 2026:

```text
Total 17 = Cerrados 14 + Resueltos 3 + Abiertos 0 + Pendientes 0
         + En espera 0 + Sin mapear 0 + Otros 0
```

Los estados `SI`/`NO` de Whaticket se mantienen como **sin mapear**; no se
reinterpretan como resueltos o no resueltos.

---

## 5. Tiempos y cobertura

### Primera respuesta

Un caso es evaluable cuando `primera_respuesta_min_norm IS NOT NULL`.

### Resolución

Se excluye el grupo sin tiempo válido:

```sql
resolucion_min_norm IS NOT NULL
AND NOT (resolucion_min_norm = 0 AND primera_respuesta_min_norm IS NULL)
```

Octubre 2026:

| Métrica | Valor |
|---|---:|
| Primera respuesta: n / cobertura | 16 / 94.1% |
| Primera respuesta: mediana | 498.0 min |
| Primera respuesta: p90 | 3,109.5 min |
| Primera respuesta: promedio | 1,374.0 min |
| Primera respuesta: sin dato | 1 |
| Resolución: n / cobertura | 16 / 94.1% |
| Resolución: mediana | 2,423.1 min |
| Resolución: p90 | 5,922.0 min |
| Resolución: promedio | 2,752.8 min |
| Resolución: sin tiempo válido | 1 |

### Por tipo

| Tipo | n primera | Mediana primera | P90 primera | n resolución | Mediana resolución | P90 resolución |
|---|---:|---:|---:|---:|---:|---:|
| Quejas | 7 | 94.8 min | 2,531.9 min | 7 | 1,377.0 min | 3,724.6 min |
| Devoluciones | 9 | 1,402.8 min | 3,079.8 min | 9 | 3,075.0 min | 8,102.4 min |

La mediana y el p90 son la lectura principal. El promedio se muestra como dato
secundario, junto con `n` y cobertura.

---

## 6. Evolución

- Serie diaria de casos creados.
- Comparación contra el periodo anterior equivalente (`rangoAnterior`).
- Selector diario, semanal y mensual.
- Serie actual y anterior completas, con ceros en los días sin casos.
- Variación absoluta y porcentual.

Octubre 2026: **17 actual vs. 19 anterior = -2 (-10.5%)**.

---

## 7. Canal

| Canal | Quejas | Devoluciones | Total | % |
|---|---:|---:|---:|---:|
| WhatsApp | 1 | 1 | 2 | 11.8% |
| Correo | 6 | 9 | 15 | 88.2% |
| **Total** | **7** | **10** | **17** | **100%** |

---

## 8. Asesores

La tabla muestra solo asesores con al menos un caso Q/D en el periodo.

Octubre 2026:

| Asesor | Quejas | Devoluciones | Total | % |
|---|---:|---:|---:|---:|
| Victor | 7 | 2 | 9 | 52.9% |
| Lidia | 0 | 3 | 3 | 17.6% |
| Eveling | 0 | 2 | 2 | 11.8% |
| Lisbeth | 0 | 2 | 2 | 11.8% |
| Danilo | 0 | 1 | 1 | 5.9% |

**Alex López no registra casos Q/D en octubre.** No se crea una fila artificial
con cero: la ausencia se documenta en `docs/ALEX_LOPEZ.md`. Sus atenciones sí
están incluidas en Resumen, Operación, País, Asesores, Categorías, Clientes,
WhatsApp, Zendesk y Calidad de Registro.

---

## 9. Alcance y exclusiones

Se retiraron del reporte:

- Dona Queja/Devolución.
- Tabla de variación separada.
- Ranking de clientes.
- Tabla por país.
- Gráficos por día de semana y hora.
- KPI “Total atenciones” basado en todas las atenciones.
- FCR.
- SLA, por no existir una meta Q/D específica.
- Montos y resultados del módulo operativo `qd_casos`.

Esas dimensiones pertenecen a Clientes, País, Operación, Categorías o al módulo
operativo de casos.

---

## 10. Endpoint

`GET /api/dashboard/quejas-devoluciones`

```ts
{
  kpis: {
    totalCasos, quejas, devoluciones, pctQuejas,
    totalAnterior, variacionAbs, variacionPct,
    primeraN, primeraCobertura, primeraMediana, primeraP90, primeraPromedio, primeraSinDato,
    resolucionN, resolucionCobertura, resolucionMediana, resolucionP90,
    resolucionPromedio, resolucionExcluidas
  },
  estados: { estado, etiqueta, total, pct }[],
  tipos: { tipo, etiqueta, total, pct }[],
  canales: { canal, quejas, devoluciones, total, pct }[],
  tiemposPorTipo: {
    tipo, etiqueta, total,
    primeraN, primeraMediana, primeraP90, primeraPromedio,
    resolucionN, resolucionMediana, resolucionP90, resolucionPromedio
  }[],
  asesores: { asesor, quejas, devoluciones, total, pct }[],
  evolucion: {
    actual, anterior, totalActual, totalAnterior, variacionAbs, variacionPct
  },
  insights: string[]
}
```

No incluye `totalGeneral`, `porPais`, `porCliente`, `porDia`, `porDiaSemana`,
`porHora`, `fcr`, `sla` ni `tiempos` con promedios sin `n`.

---

## 11. Validación

```bash
cd backend
npx tsx scripts/validar-quejas.ts
```

Resultado: **43/43 comprobaciones OK**.

Cubre:

1. Total = quejas + devoluciones.
2. Universo por fecha real de creación.
3. Estados mutuamente excluyentes y porcentajes.
4. Canales y tipos suman el total.
5. Primera respuesta (n, mediana, p90, promedio, sin dato).
6. Resolución válida, excluidas y cobertura.
7. Evolución actual/anterior y serie diaria.
8. Asesores suman el total.
9. Alex López sin casos Q/D.
10. FCR, SLA, país, clientes y hora ausentes.
11. Sin NaN/Infinity.
12. Coberturas ≤100.

Rendimiento del repositorio: ~1.6 s para octubre.

---

## 12. Captura

- `docs/captures/quejas-general.html`: vista completa con KPI, estados, evolución,
  canal, tiempos, asesores e insights.

Captura HTML autocontenida de la interfaz renderizada. La captura PNG del
escritorio no fue posible porque la ventana de la app no estaba visible.

---

## 13. Limitaciones

- El universo depende de la clasificación de origen (`GESTION` + subcategoría).
  Un ticket mal clasificado no entra al reporte.
- Alex López no tiene casos Q/D; no se imputan casos.
- No se incorporan montos, resultados ni estados del módulo operativo `qd_casos`.
- No se aplica SLA porque no existe una meta Q/D específica.
- La resolución excluye casos con resolución 0 y primera respuesta nula.
- No se modifican otros reportes ni reglas compartidas.
