# CasoRepository

## ¿Qué representa un Caso?
Un `Caso` es la entidad raíz del sistema COPE. Representa todo el proceso de resolución del problema de un cliente, desde que se recibe el ticket hasta que se cierra. No es un ticket de dashboard: **es un caso de operaciones**.

## Responsabilidades del repositorio
- Persistir y recuperar `Casos` desde la base de datos
- Ejecutar las transiciones de estado del flujo del caso
- Registrar eventos en el `Timeline` asociado
- Asegurar la integridad de las transiciones de estado
- Proveer métodos de filtrado y búsqueda para el workspace del asesor

## Lo que NO debe hacer este repositorio
- ❌ **No ejecuta consultas de dashboard/KPIs** (eso pertenece al módulo de Reportes)
- ❌ **No calcula métricas agregadas** (promedios, rankings, tendencias)
- ❌ **No genera insights ni texto generado** (eso es responsabilidad de servicios)
- ❌ **No accede directamente a vistas del BI** (usa las tablas del dominio)
- ❌ **No mezcla lógica de negocio con consultas** (solo persistencia)

## Relación con unificado.repository.ts
El archivo `unificado.repository.ts` actual contiene consultas SQL directamente contra la vista `v_unificado_norm` del BI. Ese repositorio **no se modifica**. `CasoRepository` es un repositorio nuevo que operará sobre tablas nuevas del dominio (Casos, Timeline, Clientes, etc.).

Ambos coexistirán durante la migración progresiva.

## Métodos del repositorio

| Método | Propósito | Estado |
|--------|-----------|--------|
| `obtenerCaso` | Obtiene un caso con datos completos | 🔴 Sin implementar |
| `listarCasos` | Lista casos con filtros | 🔴 Sin implementar |
| `obtenerTimeline` | Timeline de eventos del caso | 🔴 Sin implementar |
| `aceptarCaso` | Cambia estado a "aceptado" | 🔴 Sin implementar |
| `asignarCaso` | Asigna a un asesor | 🔴 Sin implementar |
| `transferirCaso` | Reasigna a otro asesor | 🔴 Sin implementar |
| `cambiarEstado` | Avanza en el flujo de estados | 🔴 Sin implementar |
| `categorizarCaso` | Asigna categoría | 🔴 Sin implementar |
| `resolverCaso` | Marca como resuelto | 🔴 Sin implementar |
| `cerrarCaso` | Cierra el caso | 🔴 Sin implementar |
| `obtenerWorkspace` | Workspace adaptativo | 🔴 Sin implementar |
| `obtenerDiagnostico` | Diagnóstico del caso | 🔴 Sin implementar |
