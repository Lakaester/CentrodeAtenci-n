# Platform Services

## Visión general

Los servicios de plataforma son componentes transversales que cualquier módulo, adaptador u orquestador puede utilizar. No pertenecen a ninguna integración específica.

## Servicios

| Servicio | Responsabilidad |
|---|---|
| PlatformLogger | Logging estructurado con niveles, requestId, usuario, dominio |
| AuditService | Registro de operaciones modificadoras para trazabilidad |
| RollbackManager | Estrategia de reversión ante fallos |
| ReleaseService | Gestión de versiones y despliegues |
| HealthService | Verificación de salud de todos los componentes |
| TimelineService | Registro de eventos funcionales del cliente |

## Principios

- Todos los servicios implementan una interfaz.
- Ningún servicio depende de implementaciones concretas.
- Pueden ser reemplazados sin modificar consumidores.
