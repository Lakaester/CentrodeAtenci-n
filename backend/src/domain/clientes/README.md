# Cliente

## Objetivo
Entidad que agrupa toda la información demográfica, contractual y operativa del cliente final. Es la fuente de verdad sobre quién es el cliente y qué productos/servicios tiene contratados.

## Responsabilidades
- Almacenar datos de identificación (nombre, RUC, email, teléfono)
- Clasificar al cliente según su tipo (High Touch, Low Touch, Tech Touch)
- Registrar estado contractual (Activo, Suspendido, Baja)
- Mantener información de producto y versión instalada

## Relación con otras entidades
- **1:N con Caso** — un cliente puede tener muchos casos
- **N:1 con Canal** — un cliente puede tener múltiples canales de contacto

## Flujo dentro de COPE
1. Cuando llega un ticket, se busca o crea el `Cliente` por dominio/email
2. El cliente se asocia al `Caso` creado
3. Durante la atención, el asesor consulta los datos del cliente en el Centro del Cliente
4. El tipo de cliente (High Touch) afecta la prioridad del caso

## Ejemplo práctico
```ts
const cliente: Cliente = {
  id: "CLI-001",
  nombre: "Carlos Mendoza",
  dominio: "carlos.m@email.com",
  email: "carlos.mendoza@email.com",
  telefono: "+51 999 888 777",
  pais: "Perú",
  ruc: "20123456789",
  tipoCliente: "high_touch",
  estado: "activo",
  productoPrincipal: "Restaurant Web + Blue Android",
  facturacionElectronica: true,
};
```
