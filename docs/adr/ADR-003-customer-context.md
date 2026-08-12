# ADR-003: CustomerContext como contrato único

**Fecha:** 2026-07-18

**Contexto:** Cada integración necesita datos del cliente, pero no debe resolverlos por sí misma.

**Decisión:** CustomerContext es el contrato único que recibe cualquier adaptador. Contiene identity + connection + metadata.

**Consecuencias:** Ninguna integración conoce cómo obtener los datos técnicos. CustomerResolver es el único responsable.
