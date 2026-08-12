export interface QueueProcess {
  name: string;
  pending: number;
  executed: number;
  errors: number;
  lastExecution: string | null;
}

export interface QueuesData {
  processes: QueueProcess[];
  totalPending: number;
  totalErrors: number;
}

export async function fetchQueues(): Promise<QueuesData | null> {
  return {
    processes: [
      { name: "Facturación electrónica", pending: 12, executed: 1450, errors: 3, lastExecution: new Date().toISOString() },
      { name: "Comunicación SUNAT", pending: 5, executed: 890, errors: 1, lastExecution: new Date().toISOString() },
      { name: "Envío de correos", pending: 23, executed: 3200, errors: 0, lastExecution: new Date(Date.now() - 120000).toISOString() },
      { name: "Generación de PDF", pending: 8, executed: 2100, errors: 2, lastExecution: new Date(Date.now() - 300000).toISOString() },
      { name: "Sincronización WhatsApp", pending: 0, executed: 560, errors: 0, lastExecution: new Date(Date.now() - 60000).toISOString() },
    ],
    totalPending: 48,
    totalErrors: 6,
  };
}
