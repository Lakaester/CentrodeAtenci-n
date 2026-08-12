# Módulo Printer — Integración COPE

## Objetivo

Integrar la plataforma [https://printer.restaurant.pe](https://printer.restaurant.pe) como un gateway para operar sobre el servicio local del cliente mediante túneles ngrok.

## Arquitectura

```
React (Frontend)
       │
       │ dominio
       ▼
COPE API (Express)
       │
       ▼
CustomerResolver.resolve(dominio)
       │
       ├── CustomerRepository (BD / API local)
       │
       └── CustomerContext { identity, connection }
                │
                ▼
PrinterAdapter (implementa IntegrationAdapter)
       │
       ▼
PrinterGatewayClient.execute(req)
       │
       ▼
Printer Gateway (https://printer.restaurant.pe/ngrok)
       │
       ▼
Túnel ngrok → Servicio local del cliente
       │
       ▼
API REST del dispositivo/impresora
```

## Flujo

1. COPE construye una petición con los parámetros del dispositivo destino (ip, puerto, dominio, local_id, device_id).
2. Envía la petición al gateway `https://printer.restaurant.pe/ngrok`.
3. El gateway redirige al túnel ngrok activo del cliente.
4. La respuesta viaja de vuelta por la misma ruta.

## Estado

FASE 1 — Estructura documental y base de integración. Sin lógica de negocio implementada.
