# Entorno de pruebas aislado — restaurant_bi_test

**Estado:** PREPARACIÓN PARCIAL — **BLOQUEADO en la creación de BD/roles (requiere DBA)**.
**Fecha:** 2026-09-23 · **Rama:** `remediation/audit` · **Regla:** `pgvector_db` (producción) NO se modifica.

---

## 1. Bloqueante actual (DBA requerido)

El usuario actual `pgvector_user` (rol de conexión de producción) **no tiene `CREATEDB` ni `CREATEROLE`**, y está prohibido elevarle privilegios o usarlo como superusuario. Por tanto **OpenCode no puede crear** la base ni los roles. Se necesita que un **DBA** ejecute exactamente:

```sql
-- 1) Crear la base de test (independiente de pgvector_db)
CREATE DATABASE restaurant_bi_test;

-- 2) Rol de administración/migraciones (solo puede crear objetos dentro de restaurant_bi_test)
CREATE ROLE cope_test_migration LOGIN PASSWORD '<PASSWORD_DE_TEST>';

-- 3) Rol de aplicación/runtime (sin CREATEDB/CREATEROLE/SUPERUSER)
CREATE ROLE cope_test_runtime LOGIN PASSWORD '<PASSWORD_DE_TEST>';

-- 4) Privilegios sobre la base
GRANT CONNECT ON DATABASE restaurant_bi_test TO cope_test_migration, cope_test_runtime;
GRANT CREATE ON DATABASE restaurant_bi_test TO cope_test_migration; -- solo migración

-- 5) Esquema público y permisos (se aplican conectado a restaurant_bi_test)
\c restaurant_bi_test
CREATE SCHEMA IF NOT EXISTS public;
GRANT ALL ON SCHEMA public TO cope_test_migration;
GRANT USAGE, CREATE ON SCHEMA public TO cope_test_migration;
GRANT USAGE ON SCHEMA public TO cope_test_runtime;
GRANT SELECT, INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO cope_test_runtime;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT, INSERT, UPDATE, DELETE ON TABLES TO cope_test_runtime;
```

> Los `<PASSWORD_DE_TEST>` son placeholders; el DBA debe definirlos. No se usan credenciales de producción.

**Verificación que hará el DBA (read-only) tras crear:**
```sql
SELECT current_database(), current_user, inet_server_addr(), inet_server_port();
SELECT rolname, rolsuper, rolcreatedb, rolcreaterole FROM pg_roles WHERE rolname IN ('cope_test_migration','cope_test_runtime');
```

---

## 2. Orden de migraciones (esquema de test)

Aplicar **solo sobre `restaurant_bi_test`** (ninguna migración referencia otra BD — verificado). Orden propuesto:

**A. `backend/sql/migrations` (Gestión/Actas/Google):**
1. `gestion-agendas.sql` · `gestion-agendas-ticket.sql` · `gestion-agendas-tiempo-real.sql` · `gestion-agendas-resultado.sql` · `gestion-agendas-acta.sql` · `gestion-agendas-meet-link.sql`
2. `gestion-apoyos.sql` · `gestion-apoyos-ticket.sql`
3. `google-oauth-tokens.sql`

**B. `backend/prisma/migrations` (Auth/QyD/Facturación/Contactos/Atenciones):**
4. `admin-config.sql` (cope_usuarios/roles/permisos/equipos/sessions) · `cope-usuarios-personabi.sql`
5. `quejas-devoluciones.sql` + subsiguientes `quejas-devoluciones-*.sql` (en orden alfabético)
6. `control-facturacion.sql` · `control-facturacion-fase1.sql`
7. `contacto-dominio.sql` · `contacto-dominio-trazabilidad.sql`
8. `atencion-operativa.sql`

**C. Objetos fuera de banda (NO versionados — AUD-120) que deben recrearse en test** (definiciones tomadas de la auditoría, para copiar a la BD test):
- Extensiones: `CREATE EXTENSION IF NOT EXISTS unaccent; CREATE EXTENSION IF NOT EXISTS uuid-ossp;`
- Funciones: `normalizar_texto(text)`, `safe_to_numeric(text)`, `safe_to_boolean(text)` (definiciones en auditoría FASE 11 11.32 / consulta pg_get_functiondef).
- Vistas: `v_unificado`, `v_unificado_norm` (definiciones en auditoría FASE 11 11.6; apuntan a tablas `Whatmeta`, `Whaticket`, `Categorización_zendesk`, `homologacion_categorias`).
- Tablas fuente ETL (creadas fuera de migraciones): `Whatmeta`, `Whaticket`, `Categorización_zendesk`, `homologacion_categorias` (+ `asesores`, `asesores_lista` si los usa el código) — para la vista.
- Tablas ETL no necesarias para O1.5 (se omiten): `estado_actual_tickets`, `resumen_diario`, `metricas_atencion_whatsapp`, `informe_*`, `vista_bi_*`, `n8n_*`, `manuales_restaurantpe`, `tiempos_raw`, etc.

---

## 3. Seed sintético mínimo (NO datos de producción — regla 7)

| Módulo | Datos sintéticos |
|---|---|
| Auth | 1 usuario `admin.test@cope.local` (bcrypt de un password de test), rol admin, permisos completos, 1 equipo. |
| QyD | Catálogos mínimos (`qd_estados`, `qd_resultados`, `qd_areas`, `qd_productos`, `qd_tipos_queja`), 1-2 casos sintéticos (`qd_casos`) con ticket sintético. |
| Agendas | 2-3 agendas sintéticas en estados `PENDIENTE`, `ACTIVA`, `FINALIZADA`, `CANCELADA` (validar transiciones AUD-036/B1). |
| Acta | Mínimo para form/PDF (agenda FINALIZADA sin acta; campos `acta_*` null). |
| Facturación | Catálogos `facturacion_estados`/`facturacion_subcategorias`; **sin** inventar flujo de negocio. |
| Dashboard | Muestra mínima sintética en `Whatmeta`/`Whaticket`/`Categorización_zendesk` + `homologacion_categorias` para que `v_unificado_norm` produzca datos (o aceptar vista vacía y probar solo la cadena técnica). |
| Contactos | 1 `contacto_dominio` sintético si se prueba Cliente360. |

**Regla:** ningún dato real (clientes, tickets, usuarios, sesiones, tokens, contraseñas, PII).

---

## 4. Configuración de conexión de test (no tocar `backend/.env`)

- Mecanismo: **`.env.test`** en `backend/` (nuevo, NO versionar credenciales) o **variables de entorno del proceso** al arrancar O1.5.
- `DATABASE_URL` producción ≠ `TEST_DATABASE_URL`. En test se usará `TEST_DATABASE_URL` apuntando a `restaurant_bi_test`.
- **Bootstrap:** en `.env.test` dejar `BOOTSTRAP_ADMIN_EMAIL`/`BOOTSTRAP_ADMIN_PASSWORD` **vacíos** → `auth.service.ts:113-115` impide el INSERT automático.
- **CustomerMemoryMigrator:** pre-crear el flag `backend/data/.migracion_cope_010` (solo en test; NO copiar el de producción) → `CustomerMemoryMigrator.ts:40-43` omite el procesamiento.
- **ACTA_STORAGE_PATH:** apuntar a directorio de test exclusivo (p. ej. `./storage/actas-test`), nunca el de producción. **Todavía NO generar PDF.**
- **CORS_ORIGIN** de test: `http://localhost:5173`.

---

## 5. Integraciones externas para O1.5 (todo MOCK/BLOCKED)

- Zendesk WRITE = BLOCKED/MOCK · Calendar/Meet WRITE = BLOCKED/MOCK · LocalBI/TareaBI/TicketBI/Integraciones = MOCK/BLOCKED · Printer = BLOCKED.
- No crear eventos ni modificar tickets reales.

---

## 6. Verificación de aislamiento (read-only, al final)

1. `restaurant_bi_test` existe · 2. roles existen · 3. runtime sin `SUPERUSER` · 4. runtime sin `CREATEDB` · 5. tablas existen · 6. vistas existen · 7. funciones existen · 8. extensiones existen · 9. vistas no referencian producción (solo tablas de `restaurant_bi_test`) · 10. seed presente · 11. `pgvector_db` intacto. Comparar `restaurant_bi_test` vs `pgvector_db` solo por lectura.

---

## 7. Git

- Estos cambios de preparación quedan **separados** de los commits O0 (`288ffad`, `c7e480e`) y O1 (`76dffe7`); sin rebase/squash/reset.
- Archivos propuestos (evaluar antes de commit): `docs/test-environment/` (este), `backend/.env.test` (placeholders, sin secretos), `scripts/seed-test.*` (pendiente de aprobación).
- **No commitear secretos.**

## 8. Acciones pendientes de autorización
1. DBA ejecuta el runbook de la sección 1.
2. Aplicar migraciones y objetos out-of-band sobre `restaurant_bi_test`.
3. Crear seed sintético.
4. Configurar `.env.test` / variables de test.
5. Solo entonces: ejecución dinámica de O1.5.