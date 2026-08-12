# Subcategoria

## Objetivo
Nivel de detalle dentro de una categoría. Permite clasificar con mayor precisión el problema del cliente (ej: dentro de Facturación, las subcategorías son "Cobro indebido", "Nota de crédito", etc.).

## Responsabilidades
- Especificar el tipo exacto de problema dentro de una categoría
- Permitir reportes más precisos por subcategoría
- Ayudar al diagnóstico automático a ser más específico

## Relación con otras entidades
- **N:1 con Categoria** — una subcategoría pertenece a una categoría
- **1:N con Caso** — una subcategoría puede tener muchos casos

## Flujo dentro de COPE
1. El sistema asigna una categoría al caso
2. El asesor selecciona la subcategoría más específica
3. La subcategoría se usa para reportes y tendencias

## Ejemplo práctico
```ts
const subcategoria: Subcategoria = {
  id: "SUBCAT-FE-001",
  categoriaId: "CAT-FE",
  nombre: "Cobro indebido",
  descripcion: "Cargos no autorizados en la facturación del cliente",
  activa: true,
  orden: 1,
};
```
