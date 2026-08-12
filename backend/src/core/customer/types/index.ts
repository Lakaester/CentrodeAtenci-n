/**
 * CustomerIdentity — Datos comerciales del cliente.
 * Identifica quién es el cliente, no cómo conectarse.
 */
export interface CustomerIdentity {
  dominio: string;
  razonSocial: string | null;
  producto: string | null;
  pais: string | null;
  estado: string | null;
}

/**
 * CustomerConnection — Datos técnicos de conexión.
 * El frontend nunca debe conocer estos valores.
 */
export interface CustomerConnection {
  ip: string;
  puerto: number;
  deviceId: string;
  localId: string;
}

/**
 * CustomerContext — Contexto completo resuelto para una integración.
 * Es lo que recibe cualquier integración (Printer, Microservice, etc.).
 */
export interface CustomerContext {
  identity: CustomerIdentity;
  connection: CustomerConnection;
  metadata: Record<string, unknown>;
}

/**
 * CustomerResolution — Resultado del proceso de resolución.
 */
export interface CustomerResolution {
  success: boolean;
  context?: CustomerContext;
  error?: string;
}
