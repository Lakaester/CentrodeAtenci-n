# SLA

## Objetivo
Define las políticas de nivel de servicio (Service Level Agreement) y calcula el cumplimiento de SLA para cada caso. El SLA determina la prioridad y las alertas del sistema.

## Responsabilidades
- Definir políticas de SLA por canal y tipo de cliente
- Calcular el porcentaje de SLA transcurrido para un caso
- Determinar el semáforo (verde/amarillo/rojo) basado en umbrales
- Indicar si el SLA está vencido

## Relación con otras entidades
- **N:1 con Canal** — cada política de SLA pertenece a un canal
- **1:N con Caso** — cada caso tiene un cálculo de SLA

## Flujo dentro de COPE
1. Cuando se crea un caso, se calcula el SLA según el canal y tipo de cliente
2. Periódicamente, se recalcula el SLA y se actualiza el semáforo
3. Si el SLA entra en riesgo (rojo), se emite una alerta
4. El asesor ve el SLA en el header de la conversación

## Ejemplo práctico
```ts
const calculo: CalculoSLA = {
  casoId: "CASO-001",
  tiempoTranscurridoMinutos: 14,
  tiempoMaximoMinutos: 15,
  porcentaje: 93,
  semaforo: "rojo",
  estaVencido: false,
};
```
