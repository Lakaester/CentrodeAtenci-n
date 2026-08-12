# Customer Identity — Arquitectura de Identidad

## Principio

El **dominio** es el identificador único y oficial de un cliente en COPE.

Ninguna integración debe conocer IP, puerto, device_id o local_id directamente.
Esos datos son responsabilidad exclusiva del backend y se resuelven a través de `CustomerResolver`.

## Diagrama de flujo

```
Frontend
   │
   │  dominio (ej: "cliente.restaurant.pe")
   ▼
CustomerResolver.resolve(dominio)
   │
   ├── CustomerRepository (BD / API / Cache)
   │       │
   │       └── Devuelve: CustomerConnection { ip, puerto, deviceId, localId }
   │
   └── CustomerContext { identity, connection, metadata }
           │
           ▼
    PrinterGatewayClient.execute(context.connection)
```

## Reglas

| Regla | Descripción |
|---|---|
| El frontend solo conoce el dominio | Nunca envía IP, puerto, device_id o local_id |
| CustomerResolver es el único autorizado | Ninguna integración resuelve conexiones por sí misma |
| Las integraciones reciben un `CustomerContext` | Contienen toda la información técnica necesaria |
| El repositorio puede cambiar de fuente | Puede ser BD local, API de microservice, cache o Zendesk |

## Integraciones que usarán CustomerResolver

| Integración | Identificador de entrada | Datos resueltos |
|---|---|---|
| Printer | dominio | ip, puerto, deviceId, localId |
| Microservice | dominio | URL, token, versión |
| RestaFact | dominio | endpoint, apiKey |
| Facturación Electrónica | dominio | configuración FE |
| Licencias | dominio | productos contratados |
| Diagnóstico IA | dominio | historial, logs |

## Contrato

```typescript
interface CustomerContext {
  identity: CustomerIdentity;   // datos comerciales del cliente
  connection: CustomerConnection; // datos técnicos de conexión
  metadata: Record<string, unknown>; // información adicional
}
```
