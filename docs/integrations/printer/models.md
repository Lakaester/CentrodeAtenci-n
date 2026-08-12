# Modelos Printer (documentación)

Estos modelos serán implementados en TypeScript en la FASE 2.

## FeatureFlag

```typescript
interface FeatureFlag {
  nombre: string;
  descripcion: string;
  habilitado: boolean;
  enArchivo: boolean;
}
```

## PrinterLog

```typescript
interface PrinterLog {
  contenido: string;
  lineasDevueltas: number;
  nombreArchivo: string;
  rutaCompleta: string;
  totalLineas: number;
  tipoArchivo: "controlado" | "nocontrolado";
  tamañoArchivo: number;
}
```

## GatewayRequest

```typescript
interface GatewayRequest {
  ip: string;
  puerto: number;
  dominio: string;
  local_id: string;
  device_id: string;
  path: string;
  method: "GET" | "POST" | "PUT" | "DELETE";
  body?: unknown;
}
```

## GatewayResponse

```typescript
interface GatewayResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  timingMs: number;
}
```
