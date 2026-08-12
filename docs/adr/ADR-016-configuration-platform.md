# ADR-016: Configuration Platform como fuente única de configuración

**Fecha:** 2026-07-18

**Contexto:** Los módulos del core accedían directamente a process.env y archivos .env, generando dispersión de configuraciones y dificultad para auditarlas.

**Decisión:** Se crea la Configuration Platform con ConfigurationRegistry, SchemaValidator, EnvProvider y soporte para versionado y auditoría. Ningún módulo debe acceder a process.env directamente.

**Consecuencias:** Toda configuración es centralizada, validada, versionada y auditable. Preparado para integrar Secret Managers externos en el futuro.
