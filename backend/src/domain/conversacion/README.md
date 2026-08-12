# Conversacion

## Objetivo
Entidad que agrupa todos los mensajes intercambiados entre el cliente y el asesor dentro de un caso. Es el hilo de comunicación completo.

## Responsabilidades
- Agrupar los mensajes de una atención en un hilo ordenado
- Mantener el estado de lectura (mensajes no leídos)
- Vincular el canal por el que se desarrolla la conversación
- Servir como contenedor para los mensajes del caso

## Relación con otras entidades
- **1:1 con Caso** — una conversación pertenece a un caso
- **1:N con Mensaje** — una conversación tiene muchos mensajes
- **N:1 con Canal** — una conversación pertenece a un canal

## Flujo dentro de COPE
1. Cuando se crea un caso, se crea automáticamente una `Conversacion`
2. Los mensajes del cliente y del asesor se agregan a la conversación
3. El asesor ve la conversación en el panel central
4. Los eventos del sistema también se muestran en la conversación

## Ejemplo práctico
```ts
const conversacion: Conversacion = {
  id: "CONV-001",
  casoId: "CASO-001",
  canalId: "CANAL-WHATSAPP",
  mensajes: [],
  ultimoMensaje: "Gracias por su ayuda.",
  ultimoMensajeEn: "2025-07-10T10:46:00Z",
  noLeido: 2,
  activa: true,
  abiertaEn: "2025-07-10T10:15:00Z",
};
```
