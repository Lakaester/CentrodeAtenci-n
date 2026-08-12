# ADR-017: Health Monitoring Platform

**Fecha:** 2026-07-18

**Contexto:** No existía un mecanismo unificado para conocer el estado operativo de todos los componentes del sistema.

**Decisión:** Se crea la Health Monitoring Platform con HealthRegistry, HealthAggregator, HeartbeatService y checks desacoplados. La plataforma expone endpoints de liveness, readiness y reportes consolidados.

**Consecuencias:** Cualquier componente puede registrar su health check. Los endpoints son compatibles con Kubernetes (liveness/readiness). Preparado para Prometheus y OpenTelemetry.
