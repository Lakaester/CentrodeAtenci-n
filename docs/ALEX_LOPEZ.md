# Incorporación transversal de Alex López

## 1. Resumen

Alex López existía en las fuentes originales, pero `public.v_unificado` aplicaba una
lista blanca de asesores que no lo incluía. Por eso sus registros no llegaban a
`public.v_unificado_norm` ni a ningún reporte.

La corrección se hizo en la capa de datos, no con agregados manuales ni cargas
duplicadas: se amplió la lista blanca de la vista. La migración es reversible y
fue probada con rollback.

Cifras al corte de la auditoría (2026-11-03). La base es viva; los totales pueden
incrementarse con nuevas atenciones.

---

## 2. Auditoría de origen

| Fuente | Total | Octubre | Noviembre | Nombre almacenado |
|---|---:|---:|---:|---|
| `Whatmeta` | 158 | 137 | 21 | `Alex Lopez` |
| `Whaticket` | 6 | 6 | 0 | `Alex Lopez` |
| `Categorización_zendesk` | 52 | 44 | 8 | `Alex Lopez` |
| **Total** | **216** | **187** | **29** | |

- Primera atención: **2026-10-11** (Zendesk).
- Canales: **164 WhatsApp** (158 Wameta + 6 Whaticket) y **52 Correo**.
- Duplicados Meta/Whaticket: **0**.
- Duplicados Zendesk: **0**.
- Registros sin ticket: **0**.
- Estados: Meta cerradas; 1 Whaticket `SI` y 5 `NO`; Zendesk 40 cerradas y 12 resueltas.

### Casos de Quejas y Devoluciones

**Alex no registra casos Q/D** en las fuentes. Ninguno de sus tickets cumple:

```sql
categoria = 'GESTION'
AND cope_scat_normalizada(subcategoria) IN ('queja', 'solicitud de devolucion')
```

No se inventaron casos. Quejas y Devoluciones lo documenta como ausencia de
evidencia, no como un registro descartado.

---

## 3. Causa raíz

La vista `public.v_unificado` filtraba por una lista blanca hardcodeada:

```sql
lower(trim(asesor)) = ANY (ARRAY[... 'cesar espinoza'])
OR unaccent(lower(trim(asesor))) = ANY (ARRAY[... unaccent('cesar espinoza')])
```

La lista no incluía `alex lopez`. `v_unificado_norm` heredaba el filtro.

También se encontraron exclusiones específicas:

- `OFFICIAL_FILTER` del backend, usado por Asesores y Asesores Matrix.
- `OFFICIAL_ADVISORS` de la página Asesores.
- Tabla de equivalencias de Categorías.
- Mapa de colores de asesores.

---

## 4. Corrección aplicada

### 4.1 Vista

Archivos:

- `backend/sql/migrations/backup-v-unificado-2026-11-03.sql`: definición original.
- `backend/sql/migrations/v-unificado-incluir-alex.sql`: vista con Alex.
- `backend/sql/migrations/baseline-asesores-2026-11-03.json`: línea base por asesor.
- `backend/scripts/migrar-vista-alex.ts`: respaldo, aplicación, rollback y verificación.

La vista se reemplazó dentro de una transacción. Antes de aplicar se guardó el
total y el conteo por asesor. Después se comprobó:

- Alex: **0 → 215** en la ventana de migración.
- Total pre-migración: **23,452**.
- Total inmediatamente después de aplicar: **23,667**.
- Al cierre de la validación, la base viva llegó a **23,673** y Alex a **216**.
- El parche aportó exactamente **215** filas en su aplicación. Las filas adicionales son cambios vivos de las fuentes, no del parche.
- Asesores existentes: **0 cambios atribuibles al parche**; sus conteos actuales coinciden con las fuentes.
- Claves de Alex: **216 filas / 216 claves**, sin duplicados.

Rollback comprobado en la ventana de migración:

```text
Rollback verificado. Alex=0; total=23452.
```

Después se volvió a aplicar la migración:

```text
Aplicado. Alex=215; total=23667.
```

La línea base post-migración (`baseline-asesores-post-alex-2026-11-03.json`)
registra el estado actual, incluida la fila viva adicional. La validación
transversal compara contra esa línea y contra las fuentes.

### 4.2 Homologación

- `backend/src/repositories/unificado.repository.ts`: `OFFICIAL_FILTER` incluye `Alex`.
- `backend/src/utils/asesorEquivalencias.ts`: `Alex`, `Alex Lopez` y `Alex López` se consolidan como **Alex López**.
- `frontend/src/pages/Asesores.tsx`: Alex López agregado a la lista oficial.
- `frontend/src/lib/advisorColors.ts`: color propio `#6FAFB0`.

Presentación:

- Agrupaciones por primer nombre: **Alex**.
- Asesores y Categorías: **Alex López**.

---

## 5. Matriz por reporte — octubre 2026

Cada reporte aplica su propio universo y su propia fecha. Por eso el aporte de
Alex no es idéntico entre reportes.

| Reporte | Aportes de Alex | Total del reporte | Total SQL | Resultado |
|---|---:|---:|---:|---|
| Resumen | 179 | 2,950 | 2,950 | OK |
| Operación | 187 | 3,054 | 3,054 | OK |
| País | 185 | 3,030 | 3,030 | OK |
| Asesores | 185 | 3,030 | 3,030 | OK |
| Categorías | 179 | 2,950 | 2,950 | OK |
| Clientes | 181 | 2,974 | 2,974 | OK |
| WhatsApp | 143 | 2,259 | 2,259 | OK |
| Zendesk | 44 | 795 | 795 | OK |
| Calidad de Registro | 185 | 3,030 | 3,030 | OK |
| Quejas y Devoluciones | 0 | 17 | 17 | OK |
| Tendencias | — | — | — | Retirado |

### Explicación de las diferencias

- **Resumen y Categorías (179):** usan `fecha` de reporte y solo atenciones finalizadas. Alex aporta 137 de WhatsApp/Meta y 42 de Zendesk por fecha de reporte. Los 6 Whaticket sin estado homologado quedan fuera.
- **Clientes (181):** usa creación real y finalizadas. Alex aporta 137 de WhatsApp/Meta y 44 de Zendesk por creación.
- **Operación (187):** usa creación real y todo el universo. Aporta 137 + 6 + 44.
- **País, Asesores y Calidad (185):** usan `fecha` de reporte y todo el universo. Aportan 137 + 6 + 42.
- **WhatsApp (143):** 137 Meta + 6 Whaticket.
- **Zendesk (44):** tickets por creación.
- **Quejas y Devoluciones (0):** Alex no tiene casos Q/D.

---

## 6. Matriz de reconciliación

| Concepto | Cantidad |
|---|---:|
| Encontrados en origen al cierre | 216 |
| Presentes en consolidado antes | 0 |
| Recuperados por la vista | 216 |
| Descartados | 0 |
| Duplicados | 0 |
| Casos Q/D | 0 |

| Mes | Fuente | Consolidado |
|---|---:|---:|
| 2026-10 | 187 | 187 |
| 2026-11 | 29 | 29 |

---

## 7. Validación

```bash
cd backend
npx tsx scripts/validar-alex.ts
```

Resultado: **32/32 comprobaciones OK**.

El script valida:

- Fuente total = consolidado.
- Totales mensuales.
- Sin duplicados.
- Conteos por asesor = fuente original.
- Total consolidado contra la línea base post-migración.
- Alex en el consolidado = fuente.
- Crecimiento adicional de la base viva separado del parche.
- Aportes por reporte contra SQL.
- Alex en filtros, Asesores, Resumen y Categorías.
- Alex ausente en Q/D.
- Matriz mensual.

También se verificó el rollback y la reaplicación de la vista.

---

## 8. Limitaciones

- La vista es un objeto de base de datos; si un ETL externo la recrea, debe conservar `alex lopez` en ambas listas. `validar-alex.ts` falla si desaparece.
- Las cifras son de una base viva y pueden cambiar con nuevas atenciones.
- Alex no tiene casos Q/D; no se imputan ni se crean casos.
- No se modificaron tablas, datos históricos, filtros globales ni reglas compartidas.
