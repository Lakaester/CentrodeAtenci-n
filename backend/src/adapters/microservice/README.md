# adapters/microservice

## Responsabilidad
Cliente HTTP para Microservice interno de Restaurant.pe. Implementa `IMicroserviceClient` del contrato. Proporciona acceso a datos del cliente, configuraciones y operaciones administrativas.

## Qué implementará
- `MicroserviceClient implements IMicroserviceClient`
- Consulta de datos de cliente (perfil, productos, configuraciones)
- Actualización de configuraciones
- Consulta de estado de servicios

## Dependencias
- `contracts/servicios/IMicroserviceClient`
- Microservice REST API interna

## Relación con el dominio
- Proporciona datos para la entidad `Cliente`
- Permite ejecutar acciones desde el `Workspace` y `Playbooks`

## Estado actual
🧭 Por implementar — estructura de carpeta creada
