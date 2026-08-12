# Operational Diagnosis v1 — Specification

## Sprint 38

### Objetivo

Crear el primer módulo inteligente de COPE. No usa IA. Ayuda al asesor a pensar.

---

## Componente

`ModuloDiagnosticoOperativo` — `frontend/src/components/zendesk/ModuloDiagnosticoOperativo.tsx`

## Estructura

```
Hipótesis inicial
  ↓
Información recopilada
  ↓
Validaciones realizadas
  ↓
Hipótesis actual
  ↓
Resultado final
```

## Secciones visibles en el módulo

| Sección | Tipo | Descripción |
|---------|------|-------------|
| Estado | Barra de progreso (5 segmentos) | Sin analizar → Analizando → Validando → Escalado → Resuelto |
| Hipótesis actual | Input + botón OK | El asesor escribe su hipótesis actual |
| Información pendiente | Input | El asesor anota qué falta investigar |
| Bitácora | Lista cronológica | Registro automático de cambios de hipótesis |

## Estados del diagnóstico

| Estado | Color | Descripción |
|--------|-------|-------------|
| Sin analizar | `bg-slate-100` | Recién creada, sin intervención |
| Analizando | `bg-blue-50` | El asesor está investigando |
| Validando | `bg-amber-50` | Confirmando hipótesis |
| Escalado | `bg-purple-50` | Requiere otro equipo |
| Resuelto | `bg-emerald-50` | Diagnóstico completado |

## Bitácora

Cada vez que el asesor cambia la hipótesis, se registra automáticamente:
- Hora del cambio
- Hipótesis anterior (tachada)
- Hipótesis nueva
- Motivo (manual por ahora)

Esto permite reconstruir el razonamiento seguido durante la Atención.

## Placeholders

Sin IA. Toda la información es manual. La IA se implementará en una versión futura sin modificar la estructura del módulo.

---

*Documento generado automáticamente por COPE Product Development Standard*
