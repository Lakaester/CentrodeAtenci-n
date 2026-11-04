# Reporte Categorías

## 1. Objetivo

Reporte gerencial de categorías sobre atenciones finalizadas. Responde:

- Qué categorías concentran la demanda.
- Qué subcategorías explican cada categoría.
- Dónde se concentra el tiempo de resolución.
- Qué categorías incumplen la meta de SLA.
- Cómo se distribuye la carga entre asesores.

---

## 2. Universo

El reporte usa **atenciones finalizadas**: `estado_homologado IN ('cerrado', 'resuelto')`.

| `estado` | `estado_homologado` | Filas | ¿Entra? |
|---|---|---:|---|
| `closed` | `cerrado` | 21,310 | Sí |
| `solved` | `resuelto` | 1,467 | Sí |
| `open` | `abierto` | 321 | No |
| `NO` / `SI` | `sin_mapear` | 287 | No |

- Total del rango: **23,385**.
- Total evaluable: **22,777**.
- Excluidas: **608** (321 abiertas + 287 sin homologar).

La misma condición se aplica a todas las consultas del endpoint:

```ts
const whereBase = construirWhere(filters, { fechaRangoSargable: true });
const whereActual = whereConCanal(whereBase, FINALIZADAS);
```

`FINALIZADAS` es la constante existente que también usa Resumen. No se modifica
`construirWhere` para otros reportes: la opción `fechaRangoSargable` es aditiva y
solo la usa Categorías.

### Notas de calidad

- 321 atenciones `open` tienen `resolucion_min_norm` poblado; no son evaluables.
- 287 atenciones WHATICKET tienen `estado = 'SI'/'NO'` y quedan `sin_mapear`; no
  hay evidencia para reclasificarlas, por lo que se excluyen y se reportan.
- No se deduplica: Resumen tampoco lo hace. Existen 2 tickets (9108 y 9230) en
  WHATMETA y WHATICKET (4 filas); deduplicar rompería la reconciliación con
  Resumen. La diferencia con Operación, que sí deduplica, es de 2 tickets.

---

## 3. SLA

Se usa la configuración declarada del sistema, por canal:

| Meta | WhatsApp | Correo/Zendesk | Otro |
|---|---:|---:|---:|
| Primera respuesta | 15 min | 1,440 min | 60 min |
| Resolución | 120 min | 1,440 min | 480 min |

Para Categorías se evalúa **resolución**:

```text
evaluables  = resolucion_min_norm IS NOT NULL
cumple      = resolucion_min_norm <= umbral(canal)
noCumple    = evaluables - cumple
pctIncumple = noCumple / evaluables * 100
```

Se elimina el literal `<= 20` que usaba el reporte. El denominador es `conDato`,
no `COUNT(*)`: las 24 atenciones sin tiempo no se cuentan como incumplimiento.

Resultado actual:

| Concepto | Valor |
|---|---:|
| Evaluables | 22,753 |
| Cumplen | 18,143 (79.7%) |
| Incumplen | 4,610 (20.3%) |

---

## 4. Asesores

### Tabla explícita de equivalencias

La consolidación es determinística: clave = nombre original exacto (trim). No se
usan coincidencias parciales, fuzzy matching ni truncamiento al primer nombre.

| Original | Consolidado |
|---|---|
| Eveling | Eveling Lovera |
| Eveling Lovera | Eveling Lovera |
| Danilo | Danilo Pena |
| Danilo Pena | Danilo Pena |
| Danilo P | Danilo Pena |
| Victor | Victor Guevara |
| Victor Guevara | Victor Guevara |
| Lisbeth | Lisbeth Huaman |
| Lisbeth Huaman | Lisbeth Huaman |
| Sheyla | Sheyla Guevara |
| Sheyla Guevara | Sheyla Guevara |
| Lidia | Lidia Ceferino |
| Lidia Ceferino | Lidia Ceferino |
| Andrés | Andres Espinoza Franco |
| Andres Espinoza Franco | Andres Espinoza Franco |

- Un nombre no listado permanece como grupo propio.
- Nulo o vacío → `Sin asignar`.
- La tabla vive en `backend/src/utils/asesorEquivalencias.ts` y solo la usa
  Categorías. No se modificó `consolidarNombres()` ni la consolidación de otros
  reportes.
- El endpoint expone `asesorTrazabilidad` con los 15 originales y su volumen para
  auditoría.

### Resultado

| Asesor | Volumen | Participación |
|---|---:|---:|
| Eveling Lovera | 3,725 | 16.4% |
| Sheyla Guevara | 3,671 | 16.1% |
| Victor Guevara | 3,589 | 15.8% |
| Lisbeth Huaman | 3,459 | 15.2% |
| Danilo Pena | 3,277 | 14.4% |
| Lidia Ceferino | 3,063 | 13.4% |
| Andres Espinoza Franco | 1,993 | 8.8% |
| **Total** | **22,777** | **100%** |

Hoy no hay registros sin asesor. El bloque `Sin asignar` se calcula y valida
siempre, y solo se muestra si su volumen es mayor que cero.

---

## 5. Categorías técnicas

`SIN HOMOLOGAR` (4,426) y `SIN CATEGORIA EN ORIGEN` (386) permanecen en Pareto,
subcategorías, tiempos, SLA, asesores y tabla jerárquica.

- Subtotal: **4,812 (21.1%)**.
- Se marcan en gris y con la etiqueta «técnica».
- Lideran tiempo y SLA; los KPI muestran el dato real y una línea contextual sin
  técnicas.

---

## 6. Estructura del reporte

1. Cuatro KPI: atenciones analizadas, categoría líder, mayor tiempo, mayor
   incumplimiento SLA.
2. Pareto de categorías: barras, línea acumulada, referencia 80%.
3. Pareto contextual de subcategorías: selector de categoría; % y acumulado
   dentro de la categoría.
4. Ranking de tiempo de resolución: `AVG(resolucion_min_norm)`.
5. Ranking de incumplimiento SLA: `%`, `noCumple` y evaluables.
6. Análisis por asesor: filtros de categoría/subcategoría, barras horizontales,
   participación y bloque `Sin asignar` condicional.
7. Tabla jerárquica: Categoría → Subcategoría → Dominio, colapsada, header
   sticky, altura máxima 480 px.

No hay mapas de calor, burbujas ni gráficos de subcategorías por tiempo/SLA.

---

## 7. Contrato

`GET /api/dashboard/categorias-v2`

```ts
{
  universo: { total, totalRango, excluidas, abiertas, sinEstado },
  totalCategorias: number,
  totalSubcategorias: number, // incluye "Sin subcategoría"
  categoriaLider: { nombre, volumen } | null,
  subcategoriaLider: { nombre, volumen } | null,
  paretoCategorias: { categoria, volumen, pct, acumulado, tecnica }[],
  paretoSubcategorias: { categoria, subcategoria, volumen }[],
  jerarquia: { categoria, subcategoria, dominio, volumen }[],
  categoriasTiempo: { categoria, volumen, conDato, tiempo_atencion, tecnica }[],
  categoriasSLA: {
    categoria, volumen, conDato, cumple, noCumple,
    pctCumple, pctIncumple, tecnica
  }[],
  slaMetas: { whatsapp, correo, otro },
  asesorDetalle: { asesor, categoria, subcategoria, volumen }[],
  asesorTrazabilidad: { original, consolidado, volumen }[],
  totalSinAsesor: number
}
```

El total de subcategorías es **126**: 125 claves no nulas + el grupo
`Sin subcategoría` (386 atenciones). El Pareto y la jerarquía siempre incluyeron
ese grupo; ahora el contador es consistente con lo mostrado.

---

## 8. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-categorias.ts
```

Cubre 47 comprobaciones contra SQL independiente:

- Universo: 22,777 finalizadas, 23,385 del rango, 608 excluidas.
- Pareto de categorías, subcategorías, jerarquía, tiempo, SLA y asesores suman
  22,777.
- Evaluables SLA: 22,753; `cumple + noCumple = conDato`.
- Equivalencias: 15 originales → 7 consolidados; suma 22,777.
- Categorías técnicas: 4,812.
- Filtros globales de categoría y subcategoría.
- Rangos de fecha completo, parcial y de un día contra la expresión original.
- 2 tickets duplicados documentados.

Resultado: **47/47 OK**.

Rendimiento: ~2.9–3.0 s para el universo completo (22,777 atenciones y 8,744
filas de jerarquía); la consulta con filtros reducidos responde en ~1 s.

---

## 9. Limitaciones

- La cifra del reporte depende del ETL; durante la validación el universo pasó de
  22,776 a 22,777 por una atención que cambió de estado.
- 287 registros WHATICKET sin homologar quedan fuera; es una brecha de ETL.
- No se deduplican los 2 tickets presentes en más de un canal para mantener la
  reconciliación con Resumen.
- La consolidación de asesores requiere confirmar que las variantes
  corresponden a la misma persona.
- El reporte respeta los filtros globales; no impone un rango inicial propio.
