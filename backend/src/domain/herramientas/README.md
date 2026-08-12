# Herramienta

## Objetivo
Catálogo de herramientas internas que el asesor puede utilizar durante la atención de un caso. Cada herramienta tiene un contexto de uso, una URL y está asociada a categorías específicas.

## Responsabilidades
- Definir las herramientas disponibles en el sistema
- Asociar herramientas a categorías (qué herramientas aplicar según el caso)
- Proporcionar la URL y tipo de cada herramienta
- Permitir abrir herramientas desde el workspace adaptativo

## Relación con otras entidades
- **N:M con Categoria** — las herramientas se asocian a categorías
- **N:M con WorkspaceConfig** — el workspace lista herramientas disponibles
- **N:M con Playbook** — los playbooks ejecutan acciones sobre herramientas

## Flujo dentro de COPE
1. Las herramientas se configuran en el catálogo del sistema
2. Según la categoría del caso, se muestran herramientas relevantes
3. El asesor abre herramientas desde el Centro del Cliente o el workspace
4. El uso de herramientas se registra en el timeline del caso

## Ejemplo práctico
```ts
const herramienta: Herramienta = {
  id: "HERR-RESTAFACT",
  nombre: "Restafact",
  tipo: "restafact",
  url: "https://restafact.restaurant.pe",
  icono: "FileText",
  descripcion: "Sistema de facturación electrónica",
  categoriaIds: ["CAT-FE", "CAT-FACT"],
  activa: true,
};
```
