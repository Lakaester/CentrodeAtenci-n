# Categoria

## Objetivo
Define la taxonomía principal de clasificación de casos. Cada categoría determina el comportamiento del workspace, los checklists, las herramientas disponibles y los playbooks asociados.

## Responsabilidades
- Clasificar los casos en categorías de negocio
- Definir el icono y color representativo de cada categoría
- Servir como filtro principal para el workspace adaptativo
- Agrupar subcategorías relacionadas

## Relación con otras entidades
- **1:N con Subcategoria** — una categoría tiene muchas subcategorías
- **1:N con Caso** — una categoría puede tener muchos casos
- **1:1 con WorkspaceConfig** — una categoría tiene un workspace asociado
- **1:N con Playbook** — una categoría tiene playbooks asociados

## Flujo dentro de COPE
1. El sistema sugiere una categoría basada en el diagnóstico automático
2. El asesor confirma o cambia la categoría manualmente
3. Al seleccionar la categoría, el workspace se adapta automáticamente
4. Las herramientas y checklists se filtran según la categoría

## Ejemplo práctico
```ts
const categoria: Categoria = {
  id: "CAT-FE",
  nombre: "Facturación Electrónica",
  descripcion: "Problemas con comprobantes, CDT y SUNAT",
  icono: "FileText",
  color: "#2563EB",
  activa: true,
  orden: 1,
};
```
