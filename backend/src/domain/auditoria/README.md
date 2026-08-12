# Auditoria

## Objetivo
Registro inmutable de todas las acciones realizadas por los usuarios sobre las entidades del sistema. Cada modificación debe quedar registrada para trazabilidad, cumplimiento y seguridad.

## Responsabilidades
- Registrar cada acción del usuario sobre cualquier entidad
- Almacenar el valor anterior y nuevo para detectar cambios
- Capturar información de contexto (IP, user agent)
- Proporcionar una fuente de verdad para auditorías externas

## Relación con otras entidades
- **N:1 con Usuario** — cada log pertenece a un usuario
- **N:1 con Caso** — cada log puede referenciar un caso
- Escucha eventos del Event Bus para registrar automáticamente

## Flujo dentro de COPE
1. Un usuario realiza una acción (asignar caso, enviar mensaje, cambiar estado)
2. El módulo correspondiente emite un evento de dominio
3. Auditoria escucha el evento y crea un `AuditLog`
4. Los logs son consultables por supervisores y administradores

## Ejemplo práctico
```ts
const log: AuditLog = {
  id: "AUD-001",
  usuarioId: "USR-001",
  usuarioNombre: "Ana Torres",
  accion: "ASIGNAR",
  entidad: "Caso",
  entidadId: "CASO-001",
  valorNuevo: { agenteAsignadoId: "USR-001" },
  ip: "192.168.1.100",
  timestamp: "2025-07-10T10:17:00Z",
};
```
