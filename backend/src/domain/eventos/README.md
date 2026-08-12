# Evento

## Objetivo
Event Bus interno del dominio. Permite desacoplar los módulos mediante eventos. Cuando ocurre una acción importante en un módulo, se emite un evento que otros módulos pueden consumir sin acoplamiento directo.

## Responsabilidades
- Definir los tipos de evento del dominio
- Transportar payloads entre módulos de forma desacoplada
- Permitir suscripciones para reaccionar a eventos
- Mantener un correlationId para trazabilidad entre eventos

## Relación con otras entidades
- Es el pegamento desacoplado entre todos los módulos del dominio

## Flujo dentro de COPE
1. Un módulo (ej. casos) emite un evento (`caso_creado`)
2. El Event Bus distribuye el evento a los suscriptores
3. auditoria/ escucha y registra el log
4. timeline/ escucha y crea un evento de timeline
5. Cada suscriptor procesa el evento de forma independiente

## Ejemplo práctico
```ts
const evento: EventoDominio = {
  id: "EVT-DOM-001",
  tipo: "caso_creado",
  payload: { casoId: "CASO-001", clienteId: "CLI-001", canal: "whatsapp" },
  origen: "adapters/whaticket",
  timestamp: "2025-07-10T10:15:00Z",
  correlationId: "CORR-001",
};
```
