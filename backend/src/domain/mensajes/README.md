# Mensaje

## Objetivo
Entidad que representa cada interacción individual dentro de una conversación. Puede ser un mensaje del cliente, del asesor, del sistema o un evento automático.

## Responsabilidades
- Almacenar el contenido de cada interacción
- Clasificar el mensaje por tipo (cliente, agente, sistema, evento)
- Registrar el estado de entrega/lectura
- Vincular cada mensaje a su conversación y caso

## Relación con otras entidades
- **N:1 con Conversacion** — un mensaje pertenece a una conversación
- **N:1 con Caso** — un mensaje pertenece a un caso

## Flujo dentro de COPE
1. El cliente envía un mensaje → se crea un `Mensaje` de tipo `cliente`
2. El asesor responde → se crea un `Mensaje` de tipo `agente`
3. El sistema ejecuta una acción → se crea un `Mensaje` de tipo `evento`
4. Los mensajes se muestran en orden cronológico en la conversación

## Ejemplo práctico
```ts
const mensaje: Mensaje = {
  id: "MSG-001",
  conversacionId: "CONV-001",
  casoId: "CASO-001",
  emisor: "Carlos Mendoza",
  contenido: "Hola, tengo un problema con mi facturación.",
  tipo: "cliente",
  timestamp: "2025-07-10T10:15:00Z",
  estado: "leido",
};
```
