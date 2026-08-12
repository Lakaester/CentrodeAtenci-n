# ADR-008: Universal Search como punto único de entrada

**Fecha:** 2026-07-18

**Contexto:** Los asesores necesitan buscar clientes usando cualquier identificador sin seleccionar el tipo de búsqueda previamente.

**Decisión:** Se crea el Universal Search con detección automática de tipo, consulta multi-provider, fusión y ranking. La búsqueda se ejecuta con debounce y solo bajo demanda del usuario.

**Consecuencias:** El asesor escribe y COPE determina automáticamente qué buscar y dónde.
