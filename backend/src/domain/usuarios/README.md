# Usuario

## Objetivo
Entidad que representa a cualquier persona que interactúa con COPE: asesores, supervisores y administradores. Define la identidad, el rol y el equipo al que pertenece.

## Responsabilidades
- Autenticar y autorizar el acceso al sistema
- Definir el rol y permisos del usuario
- Agrupar usuarios por equipos de trabajo
- Registrar la última actividad del usuario

## Relación con otras entidades
- **1:N con Caso** — un usuario puede tener muchos casos asignados
- **1:N con EventoTimeline** — un usuario genera eventos en el timeline
- **1:N con AuditLog** — un usuario genera logs de auditoría
- **N:1 con Equipo** — un usuario pertenece a un equipo

## Flujo dentro de COPE
1. El usuario inicia sesión y ve su Inicio de Jornada personalizado
2. Se le asignan casos según su equipo y disponibilidad
3. Cada acción que realiza queda registrada en auditoría
4. Los supervisores pueden ver el tablero de su equipo

## Ejemplo práctico
```ts
const usuario: Usuario = {
  id: "USR-001",
  nombre: "Ana Torres",
  email: "ana@restaurant.pe",
  rol: "agente",
  equipo: "Facturación",
  estado: "activo",
  ultimoAcceso: "2025-07-10T10:00:00Z",
};
```
