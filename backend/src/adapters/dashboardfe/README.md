# adapters/dashboardfe

## Responsabilidad
Cliente HTTP para el Dashboard FE (el sistema actual de BI). Proporciona acceso a los KPIs, métricas y datos agregados que se muestran en el módulo de Reportes.

## Qué implementará
- `DashboardFeClient`
- Consulta de KPIs: resumen ejecutivo, operación, asesores, categorías
- Consulta de detalle: tabla paginada con filtros
- Consulta de tendencias, SLA, país

## Dependencias
- Dashboard FE API (el backend actual en `controllers/dashboard.controller.ts`)

## Relación con el dominio
- Este adapter se retirará progresivamente a medida que los datos migren a los nuevos repositorios del dominio
- Por ahora, el adapter consume los endpoints existentes del dashboard

## Estado actual
🧭 Por implementar — estructura de carpeta creada
