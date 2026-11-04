# Reporte Clientes

## 1. Objetivo

Convertir Clientes en un tablero gerencial del comportamiento de cada cliente frente al
soporte:

- Cuántas atenciones genera y cómo varía frente al periodo anterior.
- Qué categorías, subcategorías y tickets explican su demanda.
- Qué clientes requieren seguimiento por señales objetivas.
- Qué clientes son multicanal.
- Qué tickets individuales sustentan cada agregado.

No se usa un score opaco ni se afirma riesgo comercial: los datos de soporte no
contienen satisfacción, bajas o cancelación.

---

## 2. Universo

Atenciones finalizadas, con fecha real de creación:

```sql
estado_homologado IN ('cerrado', 'resuelto')
```

```sql
CASE
  WHEN tickets_created_at IS NOT NULL
    THEN (tickets_created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Lima')
  ELSE (fecha::date + hora::time)
END
```

### Evidencia de zona horaria

- `tickets_created_at` es `timestamp without time zone` y almacena UTC.
- Se contrastaron 5 tickets contra la API de Zendesk; el valor almacenado coincide
  exactamente con `created_at` UTC.
- Casos cerca de medianoche:
  - Ticket 35177: almacenado `2026-11-03 01:09:32` → Lima `2026-11-02 20:09:32`.
  - Ticket 35175: almacenado `2026-11-02 23:17:30` → Lima `2026-11-02 18:17:30`.
- `fecha`/`hora` de Zendesk no son la fecha local: para 35175, `fecha=2026-11-03` y
  `hora=23:17:30` (UTC), por lo que `fecha + hora` sería incorrecto.

Script de evidencia: `backend/scripts/check-zendesk-time.ts`.
Validación: `backend/scripts/validar-clientes.ts` (puerta de zona horaria).

---

## 3. Identificación de clientes

Reglas:

1. Dominio normalizado válido: punto, TLD de ≥2 letras, sin `@` y sin valores
   técnicos (`—`, `0`, `-`, `sin dominio`, `sindominio`, `sinlocal`, `informativo`,
   `inforamativo`, `ttp:`).
2. Fallback Zendesk: si el dominio es inválido y `numero` contiene un correo, se usa
   el dominio corporativo del correo.
3. Se excluyen proveedores gratuitos (`gmail`, `hotmail`, `outlook`, `yahoo`, `live`,
   `icloud`).
4. Los clientes recuperados por correo se registran con `identificadoPorCorreo`.
5. Correos personales y teléfonos no se convierten en clientes.
6. Dominios malformados quedan como **Identificación incompleta**; no se fusionan
   automáticamente.
7. El grupo **No identificados** está disponible en el explorador, pero no entra en
   rankings, promedios ni seguimiento.

Octubre 2026:

| Concepto | Valor |
|---|---:|
| Atenciones finalizadas | 2,792 |
| Clientes identificados | 907 |
| Atenciones identificadas | 2,480 |
| Atenciones no identificadas | 312 (11.2%) |
| Números/correos distintos no identificados | 199 |
| Dominios inválidos | 6 |
| Clientes recuperados por correo | 12 |
| Promedio por cliente identificado | 2.73 |

---

## 4. Canales

| Grupo | Clientes |
|---|---:|
| Solo WhatsApp | 494 |
| Solo correo | 260 |
| Ambos | 153 |
| **Total** | **907** |

La mezcla no suma canales: un cliente puede usar ambos. Por eso se muestra la
combinación, no una suma de canales.

---

## 5. Clientes que requieren seguimiento

Sin score. Cuatro señales objetivas:

| Señal | Regla |
|---|---|
| Incumplimiento SLA | > 30% con ≥ 3 evaluables |
| Tiempo elevado | > 24 h con ≥ 3 evaluables |
| Aumento de demanda | ≥ 2× el periodo anterior y ≥ 10 atenciones |
| Reincidencia | ≥ 4 tickets en la misma subcategoría |

- Se incluyen clientes con ≥ 2 señales y ≥ 3 atenciones.
- Octubre 2026: **43 clientes**.
- Cada fila muestra los motivos que la activaron y sus valores reales.
- “Aumento de demanda” se muestra en azul y no implica deterioro del servicio.
- La comparación usa `rangoAnterior` (periodo equivalente), no un mes fijo.
- No se usa la palabra “riesgo comercial”.

---

## 6. Estructura

1. Cuatro KPI: clientes identificados, atenciones finalizadas, promedio por cliente
   y clientes con seguimiento.
2. Franja de calidad de identificación.
3. Clientes que requieren seguimiento.
4. Explorador: Cliente → Categoría → Subcategoría → Tickets.
5. Ranking Top 20 por demanda, con “Ver todos” paginado.
6. Mezcla de canales.
7. Evolución del cliente seleccionado: actual vs. periodo anterior.

Se eliminaron los gráficos de categorías/subcategorías del cliente, el donut de
canales y el score de riesgo anterior.

---

## 7. Explorador y tickets

- La lista de clientes está paginada y es buscable.
- El grupo “No identificados” se muestra separado, con su total.
- Cada nivel muestra cantidades, porcentaje, tiempo promedio e incumplimiento SLA.
- Al llegar a la subcategoría se muestran los tickets reales:
  ticket, canal, fecha, categoría, subcategoría, dominio, asesor, estado, tiempo y
  SLA.
- Para el grupo no identificado se agrega la columna “Contacto” (nombre, teléfono o
  correo), sin convertirlo en cliente.
- El número de ticket es visible. El enlace a Zendesk se genera solo si
  `ZENDESK_SUBDOMAIN` es válido; no se inventan enlaces para otros canales.
- La paginación de tickets es de 25 por página.
- La exportación respeta el nivel seleccionado:
  - Excel para clientes, categorías y subcategorías.
  - CSV para tickets.
  - No exporta la jerarquía completa cuando se consulta una subcategoría.

---

## 8. Endpoints

| Endpoint | Contenido |
|---|---|
| `GET /api/dashboard/clientes-v2` | KPI, calidad, canales, ranking y seguimiento |
| `GET /api/dashboard/clientes-v2/clientes` | Lista paginada y buscable de clientes |
| `GET /api/dashboard/clientes-v2/categorias?clave=` | Categorías del cliente |
| `GET /api/dashboard/clientes-v2/subcategorias?clave=&cat=` | Subcategorías de la categoría |
| `GET /api/dashboard/clientes-v2/tickets?clave=&cat=&subcat=&page=` | Tickets paginados |
| `GET /api/dashboard/clientes-v2/evolucion?clave=&granularidad=` | Actual vs. anterior |
| `GET /api/dashboard/clientes-v2/exportar?nivel=&clave=&cat=&subcat=` | Exportación por nivel |

`cat` y `subcat` se separaron de los filtros globales `categoria`/`subcategoria`
para que el drill-down use la etiqueta normalizada sin aplicarla sobre el valor crudo.
Los filtros globales se respetan en todos los niveles.

---

## 9. Validación

Script:

```bash
cd backend
npx tsx scripts/validar-clientes.ts
```

Cubre 60 comprobaciones:

- Zona horaria y tickets de medianoche.
- Universo = identificadas + no identificadas.
- Clientes = claves válidas; `—` no es cliente.
- Canales suman clientes.
- Promedio = atenciones identificadas / clientes.
- Ranking: primer cliente, total, sin no identificados, % sobre identificadas.
- Lista: total, paginación y todas las filas.
- Explorador: categorías, subcategorías y tickets reconciliados.
- Tickets: pertenencia al nivel, paginación y SLA por canal.
- Seguimiento: ≥3 atenciones, ≥2 señales, motivos reproducibles y periodo anterior.
- Calidad: no identificadas, números, dominios y recuperados por correo.
- Exportación: total de cada nivel y tipo de archivo.
- Filtros globales de subcanal y categoría.

Resultado: **60/60 OK**.

Rendimiento del resumen: ~2.5 s para 2,792 atenciones y 907 clientes.

---

## 10. Capturas

- `docs/captures/clientes-general.html`: vista general con KPI, calidad,
  seguimiento, explorador, ranking, canales y evolución.
- `docs/captures/clientes-tickets.html`: explorador en el nivel de tickets.

Son capturas HTML autocontenidas de la interfaz renderizada (incluyen los gráficos
SVG y los estilos). Se generaron porque la ventana del navegador de escritorio no
estaba visible para una captura PNG.

---

## 11. Limitaciones

- La identificación de clientes depende de la calidad de `dominio` y del correo de
  Zendesk. Los dominios malformados no se fusionan automáticamente.
- El grupo no identificado sigue siendo una limitación de origen; en octubre es
  11.2% de las atenciones.
- No hay datos de satisfacción, bajas o actividad comercial; no se afirma riesgo.
- Los umbrales de seguimiento son reglas de negocio explícitas y deben validarse
  con el área.
- No se modifican otros reportes ni la homologación global.
