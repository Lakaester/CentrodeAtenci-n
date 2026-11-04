# Calidad de Registro

Módulo de seguimiento de la calidad del registro de atenciones de soporte para
**WATICKET**, **WAMETA** y **ZENDESK**.

- Ruta frontend: `/reportes/calidad-registro`
- Endpoint: `GET /api/dashboard/calidad-registro`
- Fuente: `public.v_unificado_norm`
- Solo lectura: no modifica vistas, tablas, homologación ni registros históricos.

---

## 1. Fuente de datos

| Dato | Campo real | Observación |
|---|---|---|
| Canal | `subcanal` | `WHATICKET`, `WHATMETA`, `ZENDESK`. El campo `canal` solo distingue WHATSAPP/CORREO. |
| Fecha | `fecha` (`date`) | Criterio de agrupación existente. No se convierte de zona horaria. |
| Hora | `hora` (`text`) | Se usa en los filtros como `fecha::date + hora::time`. |
| Categoría homologada | `categoria` | Una de las 13 categorías del catálogo o los centinelas `SIN HOMOLOGAR` / `SIN CATEGORIA EN ORIGEN`. |
| Categoría de origen | `subcategoria` | Texto original de `CATEGORIA`. No es una subcategoría real. |
| Dominio | `dominio` | `LINK_DOMINIO_1` en Meta/Whaticket; `z.dominio` en Zendesk. |
| Ticket | `ticket_id` | Único por canal, salvo 2 casos Meta/Whaticket. |
| Homologación | `public.vw_homologacion_categorias` | 100 filas, 90 claves, 13 categorías destino. |

La vista ya aplica el filtro de asesores oficiales existente.

---

## 2. Reglas de negocio

### 2.1 Categorización registrada

Una atención tiene categoría registrada si su categoría de origen contiene un
texto válido. Se excluyen:

- `NULL`, cadena vacía o solo espacios.
- `SIN CATEGORIA EN ORIGEN`.
- Marcadores explícitos: `sin categorizar`, `sin categoría`, `sin categoria`,
  `no categorizado`, `no categorizada`, `sin clasificar`, `sin homologar`,
  `sin asignar`, `sin definir`, `n/a`, `na`, `sin dato`, `sin datos`.

`SIN HOMOLOGAR` con una categoría real **sí** cuenta como registrada.

### 2.2 Categorización homologada

Una atención está homologada si su `categoria` existe en el catálogo
`vw_homologacion_categorias` (13 categorías). Por construcción:

```text
cat_homologadas <= cat_registradas <= total
```

La implementación solo permite `cat_homologada = 1` si además
`cat_registrada = 1`.

### 2.3 Dominio informado

Una atención tiene dominio informado si `NULLIF(BTRIM(dominio), '') IS NOT NULL`.
Incluye valores como `0`, `-` o `Consultas`; por eso se reporta también el
dominio válido.

### 2.4 Dominio válido

Se reutiliza la regla canónica del backend:
`backend/src/domain/contacto/normalizacion.ts`.

- `normalizeDomain`: quita protocolo, path, query, fragmento, puntos/slashes
  finales, espacios y mayúsculas.
- `isValidDomainFormat`: exige hostname con al menos un punto, TLD de 2+ letras,
  longitud mínima 4, sin espacios ni caracteres inválidos.

La regla SQL es un espejo exacto y se valida contra la función JS para todos los
valores distintos de `dominio`. Gate de aceptación: **0 discrepancias**.

No se usa `dominioValido` de Quejas y Devoluciones porque solo excluye
`'sin dominio'`, `'s/d'`, `'n/a'` y `'null'`; aceptaría `'0'`, `'-'` y textos.
Tampoco se usa `N_DOMINIO` como validador: solo normaliza para agrupar/filtrar.

Por construcción:

```text
dom_validos <= dom_informados <= total
```

### 2.5 Cumplimiento integral

Una atención cumple integralmente si tiene **categoría homologada** y
**dominio válido**.

Los cuatro escenarios son exhaustivos y mutuamente excluyentes:

| Escenario | Categoría homologada | Dominio válido |
|---|---:|---:|
| `cumpleAmbas` | Sí | Sí |
| `soloCategoriaHomologada` | Sí | No |
| `soloDominioValido` | No | Sí |
| `ningunaCondicion` | No | No |

Invariante:

```text
cumpleAmbas + soloCategoriaHomologada + soloDominioValido + ningunaCondicion = total
```

---

## 3. Deduplicación

- **Por canal:** cada fila es una atención del canal. No se deduplica.
- **Consolidado:** se deduplica por
  `ZENDESK:<ticket_id>` o `WA:<ticket_id>`, conservando la fila más completa
  (`cat_homologada`, `dom_valido`, `cat_registrada`, `dom_informado`, fecha).
- Zendesk nunca se mezcla con WhatsApp por una colisión numérica de ticket.

Al cierre de la auditoría había 2 tickets Meta/Whaticket duplicados.

---

## 4. Periodos y variaciones

- **Semanal:** semana ISO, lunes como inicio.
- **Mensual:** `YYYY-MM`.
- **Trimestral:** `YYYY-Tn`.
- Los periodos se agrupan por `fecha::date`.
- Los periodos intermedios sin registros se devuelven con `total = 0`,
  conteos en 0 y porcentajes `null`.
- Las variaciones se devuelven en **puntos porcentuales (pp)** y relativas (%).
- El límite superior de fecha incluye todos los segundos del minuto final
  mediante `endExclusive`.

---

## 5. Endpoint

```text
GET /api/dashboard/calidad-registro
  ?fechaHoraInicio=YYYY-MM-DD HH:mm
  &fechaHoraFin=YYYY-MM-DD HH:mm
  &subcanal=WHATICKET,WHATMETA,ZENDESK
  &granularidad=semana|mes|trimestre
```

Respuesta:

```ts
{
  rango: { inicio, fin, comparadoCon },
  granularidad,
  resumen: {
    actual: CalidadResumen,
    anterior: CalidadResumen | null,
    variacion: CalidadVariaciones
  },
  evolucion: CalidadPeriodo[],
  evolucionPorCanal: { canal, canalLabel, periodos }[],
  comparativo: CalidadCanal[],
  tabla: CalidadFila[],
  generadoEn: string
}
```

`CalidadResumen`:

```ts
{
  total,
  categorizacion: {
    registradas, noRegistradas, pctRegistrada,
    homologadas, registradasNoHomologadas, noHomologadasTotal, pctHomologada,
    brechaHomologacionPp, brechaHomologacionCount
  },
  dominio: {
    informados, noInformados, pctInformado,
    validos, informadosNoValidos, noValidosTotal, pctValido,
    brechaDominioPp, brechaDominioCount
  },
  integral: {
    cumpleAmbas, soloCategoriaHomologada, soloDominioValido, ningunaCondicion,
    pctCumplimientoIntegral
  }
}
```

---

## 6. Frontend

La vista principal es un dashboard ejecutivo de cumplimiento operativo, no una
auditoría de calidad de datos:

1. **Cumplimiento de categorización**: tarjeta principal con porcentaje,
   cantidad de atenciones categorizadas, variación en pp y pendientes.
2. **Cumplimiento de vinculación de dominio**: tarjeta principal con porcentaje,
   cantidad de atenciones con dominio vinculado, variación en pp y pendientes.
3. **Pendientes de categorizar**: tarjeta secundaria con cantidad y porcentaje
   del total.
4. **Pendientes de vincular dominio**: tarjeta secundaria con cantidad y
   porcentaje del total.
5. **Evolución de categorización**: barras de categorizadas/pendientes y línea
   de porcentaje.
6. **Evolución de vinculación de dominio**: barras con/sin dominio y línea de
   porcentaje.
7. **Comparativo por canal**: tabla ordenable con total, % categorizadas,
   pendientes, % con dominio y pendientes de dominio. Verde = mejor
   cumplimiento relativo; naranja = mayor pendiente.

El **total analizado** se muestra como chip contextual, no como tarjeta.

Secciones secundarias colapsadas, renderizadas solo al abrirlas:

- **Detalle histórico por periodo**: tabla completa con vistas Base/Calidad/
  Integral/Completa y exportación.
- **Diagnóstico técnico**: homologación, dominio válido, brechas, cumplimiento
  integral y cuatro escenarios.

Filtros:

- Fecha: filtro global.
- Canal: control rápido `Todos / WATICKET / WAMETA / ZENDESK`, sincronizado con
  `subcanal`.
- Periodicidad: `Semanal / Mensual / Trimestral`.
- Rango inicial: últimos 12 meses.

Exportación Excel:

- Resumen ejecutivo.
- Evolución.
- Por canal.
- Diagnóstico.
- Detalle histórico.
- Filtros aplicados.

---

## 7. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-calidad-registro.ts
```

Cubre:

- Invariantes de categorización, dominio y escenarios.
- Comparación directa contra SQL para el consolidado y por canal.
- Equivalencia SQL de dominio válido contra `isValidDomainFormat`.
- Catálogo de homologación (solo 13 categorías, sin centinelas).
- Consistencia semanal/mensual/trimestral.
- Rango vacío.
- Rango anterior.
- Totales de la tabla y de la evolución.

Resultado al cierre: **835/835 comprobaciones OK**, **0 discrepancias** en
2,701 valores distintos de dominio.

Pruebas unitarias:

```bash
cd backend
npx vitest run src/__tests__/calidadRegistro.test.ts src/__tests__/calidadRegistro.dominio.test.ts
```

Builds:

```bash
cd backend && npm run build
cd frontend && npm run build
```

---

## 8. Rendimiento

La vista `v_unificado_norm` aplica `unaccent` sobre el asesor en cada fila y es
la principal fuente de costo. La consulta se optimizó para leer la vista una
sola vez (rango actual + anterior), usar el catálogo como array y evitar
`unaccent` en las reglas del módulo.

Medición local: **~2.6–2.8 s** de extremo a extremo para 12 meses; la consulta
SQL ronda **1.8 s**. No se alcanzó el objetivo ideal de 500 ms sin modificar la
vista o crear índices, lo que queda fuera del alcance de este módulo.

---

## 9. Limitaciones

- Cobertura histórica desigual: 2025-10 a 2026-02 tiene poco volumen.
- El periodo anterior de los últimos 12 meses puede tener muy pocos registros;
  las variaciones porcentuales pueden ser muy altas.
- `isValidDomainFormat` rechaza dominios con `_`, `ñ` o TLD de 1 letra; es el
  comportamiento existente del backend.
- La regla de dominio válido no verifica que el dominio exista en LocalBI; solo
  valida formato.
- `normalizar_texto` y `cope_scat_normalizada` existen en la BD pero no están
  versionadas en migraciones. La vista ya depende de ellas.
- La fecha de Zendesk es `fecha_reporte`, no `tickets_created_at`.
- Los datos están vivos; el dashboard muestra `generadoEn` y la validación usa
  un rango fijo hasta `2026-10-31`.
