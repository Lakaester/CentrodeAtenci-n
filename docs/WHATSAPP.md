# Reporte WhatsApp — impacto operativo

## 1. Objetivo

Medir la demanda y la capacidad operativa del canal WhatsApp, consolidando
**Wameta + Whaticket** en la lectura principal.

Preguntas que responde:

- ¿Cuánto volumen absorbe WhatsApp?
- ¿La demanda aumenta o disminuye?
- ¿Qué tan oportuna es la primera respuesta y la resolución?
- ¿En qué horas y días se concentra la carga?
- ¿Qué conversaciones requieren revisión operativa?

No se afirma impacto comercial ni riesgo. No se usa FCR.

---

## 2. Universo

Todas las conversaciones de WhatsApp, independientemente de su estado:

- Wameta + Whaticket.
- Abiertas, cerradas y sin estado homologado.
- No se filtra por atenciones finalizadas: el objetivo es demanda y carga
  operativa, no solo conversaciones cerradas.

```sql
(subcanal IN ('whaticket', 'whatmeta') OR canal ILIKE '%what%')
```

---

## 3. Estados

| Grupo | Criterio |
|---|---|
| Cerradas | `estado_homologado IN ('cerrado','resuelto')` |
| Abiertas | `estado_homologado = 'abierto'` |
| Sin estado homologado | `estado_homologado = 'sin_mapear'` |
| Otros | Cualquier otro estado, si aparece |

Invariantes:

```text
Total 2,116 = Wameta 2,044 + Whaticket 72
Total 2,116 = Cerradas 2,042 + Abiertas 2 + Sin estado 72
```

Los estados `SI`/`NO` de Whaticket permanecen como **sin estado homologado**.
No se reinterpretan como resueltas o no resueltas.

---

## 4. Tiempos y cobertura

Un dato es faltante cuando:

```sql
raw IS NULL AND min = 0
```

Se excluye de:

- Promedio.
- Mediana.
- Percentil 90.
- SLA.
- Denominador de cobertura.

Se conserva un cero real (`raw = 0`). La cobertura usa como denominador el total
de conversaciones de cada plataforma, incluyendo las que no tienen dato válido.

Octubre 2026:

| Métrica | Valor |
|---|---:|
| Primera respuesta: n / cobertura | 2,008 / 94.9% |
| Primera respuesta: mediana | 4.8 min |
| Primera respuesta: p90 | 24.0 min |
| Resolución: n / cobertura | 2,089 / 98.7% |
| Resolución: mediana | 52.1 min |
| Resolución: p90 | 126.0 min |

La mediana y el p90 consolidados se calculan sobre **todos los registros válidos
de Wameta + Whaticket**. No son un promedio ponderado de las medianas por
plataforma.

La resolución se calcula sobre todos los registros con tiempo válido,
independientemente del estado, y el estado se mantiene visible. Una conversación
sin estado homologado no se presenta como resuelta.

---

## 5. SLA

Regla aplicada: **primera respuesta ≤ 15 minutos**, la meta explícita de WhatsApp
en `SLA_MINUTOS`.

- Se excluyen los tiempos faltantes.
- Se muestra `cumple / evaluables`.
- Se muestra el porcentaje.
- Se muestra el umbral.

Octubre: **1,632 / 2,008 = 81.3%**.

No se usa la regla de 20 minutos ni la meta provisional de resolución de 120
minutos.

---

## 6. FCR

Se retiró completamente. Una conversación cerrada no implica resolución en el
primer contacto, y Whaticket no tiene un estado homologado que permita una
comparación válida.

En su lugar se muestra la distribución de estados: cerradas, abiertas y sin estado
homologado.

---

## 7. Plataformas

Tabla secundaria:

| Métrica | Wameta | Whaticket |
|---|---:|---:|
| Volumen | 2,044 (96.6%) | 72 (3.4%) |
| Primera respuesta: n / cobertura | 1,957 / 95.7% | 51 / 70.8% |
| Primera respuesta: mediana / p90 | 4.7 / 22.2 min | 43.9 / 292.5 min |
| Resolución: n / cobertura | 2,042 / 99.9% | 47 / 65.3% |
| Resolución: mediana / p90 | 51.5 / 121.7 min | 124.4 / 387.1 min |
| SLA ≤15 min | 1,617/1,957 = 82.6% | 15/51 = 29.4% |
| Cerradas / abiertas / sin estado | 2,042 / 2 / 0 | 0 / 0 / 72 |

La cobertura se calcula sobre el total de cada plataforma. La comparación de
tiempos es válida para los registros con dato; la diferencia de cobertura se
muestra explícitamente.

El nombre visible de la plataforma es **Wameta** en todo el reporte.

---

## 8. Evolución

- Serie consolidada Wameta + Whaticket.
- Comparación contra el periodo anterior equivalente (`rangoAnterior`).
- Selector diario, semanal y mensual.
- Variación absoluta y porcentual.
- Serie diaria completa, con ceros en los días sin conversaciones.

Octubre 2026: 2,116 actual vs. 2,477 anterior = **-14.6% (-361)**.

---

## 9. Demanda por hora y por día

Dos gráficos independientes, sin mapa de calor:

- Demanda por hora: 24 barras; pico 11:00 con 224 conversaciones.
- Demanda por día: 7 barras ordenadas de lunes a domingo; pico jueves con 412.

Ambos suman 2,116 y muestran el porcentaje del total en el tooltip.

---

## 10. Excepciones operativas

Criterios:

- Abiertas con más de 24 h.
- Cerradas o sin estado con más de 8 h de resolución.

Octubre: 2 abiertas + 6 cerradas + 4 sin estado = **12**.

Columnas: contacto, asesor, plataforma, tiempo, fecha y estado. El tiempo se
etiqueta como “transcurrido” para abiertas y “resolución” para cerradas/sin
estado. No es un incumplimiento SLA.

---

## 11. Endpoint

`GET /api/dashboard/whatsapp`

```ts
{
  kpis: {
    totalConversaciones, totalWhaticket, totalWameta,
    pctWhaticket, pctWameta,
    primeraN, primeraCobertura, primeraPromedio, primeraMediana, primeraP90,
    resolucionN, resolucionCobertura, resolucionPromedio, resolucionMediana, resolucionP90,
    slaPrimeraCumple, slaPrimeraEvaluables, slaPrimeraPct, slaPrimeraUmbral,
    cerradas, abiertas, sinEstado, otros,
    totalAnterior, variacionAbs, variacionPct
  },
  estados, plataformas, evolucion, horas, dias, excepciones, insights
}
```

No incluye `fcr`, `tiempoEspera` ni `tiempoPromedioAsesor`.

---

## 12. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-whatsapp.ts
```

Cubre 57 comprobaciones:

- Total = Wameta + Whaticket.
- Estados suman el total.
- KPI consolidados y por plataforma contra SQL.
- Medianas y p90 sobre registros válidos.
- Cobertura con denominador total por plataforma.
- SLA 15 min con cumple/evaluables.
- FCR ausente.
- Evolución actual/anterior y variación.
- Horas y días suman el total.
- Excepciones por umbral y estado.
- Filtros globales.
- Sin NaN/Infinity.

Resultado: **57/57 OK**.

Rendimiento del repositorio: ~1.5 s para octubre.

---

## 13. Capturas

- `docs/captures/whatsapp-general.html`: vista completa con KPI, estados,
  evolución, demanda por hora/día, plataformas, excepciones e insights.

Captura HTML autocontenida de la interfaz renderizada (estilos y gráficos SVG).
La captura PNG del escritorio no fue posible porque la ventana de la app no estaba
visible.

---

## 14. Limitaciones

- Whaticket mantiene 72 conversaciones con estado `SI`/`NO` sin homologar; no se
  reclasifican.
- La cobertura de Whaticket es menor (70.8% primera respuesta, 65.3% resolución);
  la comparación debe considerar el `n`.
- La resolución no se usa como sinónimo de conversación resuelta cuando el estado
  no está homologado.
- No hay datos de satisfacción, ventas o retención; no se afirma impacto
  comercial.
- No se modifican otros reportes ni reglas compartidas.
