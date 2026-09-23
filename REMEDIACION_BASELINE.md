# REMEDIACION_BASELINE — restaurant-bi

**Fecha:** 2026-09-23 · **Propósito:** baseline técnico y de Git previo a la remediación controlada (FASE 14). No se modificó código en la creación de este baseline; solo inspección read-only. **Inicio de remediación (fecha/hora):** 2026-09-23 (sesión de cierre O0).

---

## 1. Estado de Git (baseline)

| Ítem | Valor |
|---|---|
| **BASELINE COMMIT PREEXISTENTE** (anterior a la remediación; NO generado por esta) | `e07f21c` (feat: modulo de atenciones operativas...) |
| Branch original | `main` |
| Branch de remediación | `remediation/audit` (creada desde `main`, no destructiva) |
| **COMMIT BASELINE (remediación)** | **`288ffad`** (chore(baseline): estado preexistente de desarrollo (145 cambios) + REMEDIACION_BASELINE.md [O0]) |
| **COMMIT O0-D (contención de seguridad)** | **`c7e480e`** (security(o0-d): contencion minima [O0]) — 5 archivos, +48/−16 |
| Archivos modificados (M) | 85 |
| Archivos nuevos (untracked, ??) | 60 |
| Archivos eliminados (D) | 0 |
| **Total cambios locales preexistentes** | **145** (preservados íntegramente) |
| Stash | ninguno |
| Remote | `origin → https://github.com/Lakaester/CentrodeAtenci-n.git` |
| Líneas agregadas (trackeados) | 3.325 |
| Líneas eliminadas (trackeadas) | 541 |
| Working tree tras O0 | **LIMPIO** (sin cambios pendientes) |

**Inventario de los 145 cambios (O0-B):**
- 85 modificados: `backend/src/routes/index.ts` (agrega `/gestion`), `middlewares/auth.middleware.ts` (503 ante errores DB), `repositories/prisma.ts` (errorFormat), `index.ts` (handlers globales + graceful shutdown), `config/env.ts` (ACTA_STORAGE_PATH), `dto/filters.dto.ts` + `types/index.ts` (selectedPais, PaisDominioFila), `package.json` backend (pdfmake, googleapis, google-auth-library), `.env.example`×2 (Google Calendar), repos/services/localbi/zendesk-test/frontend varios.
- 60 nuevos (untracked): módulo Gestión completo (`agendas.controller.ts`, `agendas.service.ts`, `agendas.repository.ts`, `apoyos.*`, `actaPdf.service.ts`, `gestion.routes.ts`), scripts de QyD/backfill (`restaurar-qyd-desde-excel.ts`, `apply-excel-fecha.ts`, etc.), scripts de diagnóstico/test (`test-api.ts`, `test-proxy.ts`, `test-db.ts`, `test-flow.ts`...), `docs/google-calendar-integration.md`, `backend/sql/`, archivos de log (`backend-log*.txt`).
- **Análisis:** los cambios corresponden al **estado de desarrollo legítimo actual** del proyecto (coherente con lo auditado en FASE 1-13). **No** se detectaron cambios accidentales ni corrupción. **Riesgo de proceso:** una parte importante del código núcleo (módulo Gestión, actas) está sin commitear (untracked) — ver AUD-190.

**Contención O0-D (5 archivos, commit `c7e480e`):** `backend/src/routes/index.ts` (9 líneas requireAuth/requirePermission), `backend/src/core/security/routes/security.routes.ts` (gate producción), `backend/src/core/security/services/AuthService.ts` (sin fallback `cope-dev-token`), `backend/src/core/configuration/controllers/ConfigurationController.ts` (redacción de secretos), `backend/src/middlewares/error.middleware.ts` (masking errores en producción).

**Notas de cierre O0:** sin cambios de BD ni migraciones en O0 · ninguna AUD cerrada (todas EN PROGRESO: AUD-127…135, 226, 228).

---

## 2. Baseline técnico

| Ítem | Valor |
|---|---|
| Node | v24.18.0 |
| npm | 11.16.0 |
| Python | 3.12.10 |
| Backend TypeScript (`tsc --noEmit`) | **66 errores** (21 archivos) |
| Frontend TypeScript (`tsc --noEmit`) | **20 errores** (2 archivos: ActaForm.tsx 14, AgendasPage.tsx 6) |
| Total TypeScript | **86** |
| Tests backend (`vitest run`) | **312/312 PASS** (10 archivos) |
| Tests frontend | **0** |
| Build (`npm run build`) | **FAIL** (falla en `tsc` backend y frontend) |
| AUD | AUD-001 → AUD-232 |
| Estructura | `restaurant-bi/` (backend src 32.651 líneas · frontend src 46.801 líneas) |

---

## 3. Conteos de BD (READ-ONLY, obtenidos durante la auditoría)

| Tabla | Conteo |
|---|---:|
| v_unificado_norm (vista oficial) | 19.528 filas / 19.526 tickets únicos |
| Whatmeta (vista) | 13.995 |
| Whaticket (vista) | 1.246 |
| Zendesk/Categorización (vista) | 4.287 |
| facturacion_intervenciones | 0 |
| facturacion_casos | 7 |
| facturacion_caso_intervenciones | 0 |
| facturacion_caso_snapshots | 0 |
| qd_casos | 80 (15 con ticket fuera de la vista) |
| qd_auditoria | 544 |
| agendas | 17 |
| apoyos | 12 |
| atencion | 62 |
| metricas_atencion_whatsapp | 47.692 (stale, máx 2026-08-20) |
| estado_actual_tickets | 498.200 (stale, máx 2026-08-20) |
| resumen_diario | 212.731 (al día 2026-09-22) |
| cope_sessions | 204 |
| homologacion_categorias | 100 |

## 4. Métricas críticas conocidas (baseline)

| Métrica | Valor baseline |
|---|---|
| SLA Resumen (resolución ≤ 20 min) | 15,4% (3.003/19.504) |
| SLA pestaña WhatsApp (≤ 120 min) | 85,1% (11.910/13.995) |
| SLA documentado w15&r25 | 18,3% (3.495/19.126) |
| Categoría sin homologar | 25,4% (4.959/19.528) |
| Dominio vacío | 38,8% (7.569/19.528) |
| Duplicados cross-fuente | 2 (tickets 9108, 9230) |
| Anomalías `resolucion < primera_respuesta` | 363 |
| EXPLAIN COUNT(*) v_unificado_norm | ~401 ms (Seq Scan, 3 fuentes) |

## 5. Estado de integraciones (baseline)

| Integración | Estado |
|---|---|
| Zendesk | REAL (sin timeout en fetch, retry solo 429) |
| Google Calendar/OAuth | REAL (state en memoria) |
| LocalBI | REAL (timeout 60 s, retry transitorio) |
| TareaBI / TicketBI | REAL (timeout 60 s) |
| Integraciones (monitor) | PARCIAL (token vacío) |
| Printer | ROTO (stub) |
| Meta / WhatsApp | MOCK (sin backend) |
| AI / Notifications / Microservices / Plugins | STUB (sin consumidores) |

## 6. Fuentes del baseline

- `AUDITORIA_TECNICA_COMPLETA.md` (Fases 1-13, AUD-001…AUD-232).
- Verificación directa en esta sesión: `git` (branch/status/log/stash), `node -v`, `npm -v`, `npx tsc --noEmit` (backend y frontend), `vitest run` (312/312, sesión previa), conteos BD read-only (Fase 11).