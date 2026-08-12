# Resolucion

## Objetivo
Entidad que almacena el resultado final del caso una vez que se ha completado la atención. Captura el desenlace, las herramientas utilizadas y las lecciones aprendidas.

## Responsabilidades
- Registrar el resultado final del caso (resuelto, parcial, escalado, etc.)
- Almacenar un resumen ejecutivo de la resolución
- Listar las herramientas que se utilizaron durante el caso
- Capturar lecciones aprendidas para mejora continua

## Relación con otras entidades
- **1:1 con Caso** — un caso tiene una resolución
- **N:M con Herramienta** — la resolución referencia herramientas usadas

## Flujo dentro de COPE
1. Cuando el asesor marca el caso como resuelto, se crea una `Resolucion`
2. El asesor completa el resumen ejecutivo y las lecciones aprendidas
3. La resolución se vincula al caso y al timeline
4. Los datos alimentan reportes de métricas y tendencias

## Ejemplo práctico
```ts
const resolucion: Resolucion = {
  id: "RES-001",
  casoId: "CASO-001",
  resultado: "resuelto",
  resumen: "Se gestionó la reversión del cargo de S/100.00 y se corrigió la factura del cliente.",
  herramientasUtilizadas: ["Restafact", "Dashboard FE", "NotebookLM"],
  lecciones: ["Verificar autorización antes de procesar cargos adicionales"],
  tiempoTotal: "45 min",
  creadoEn: "2025-07-10T11:00:00Z",
};
```
