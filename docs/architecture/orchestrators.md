# Orchestrators

## ¿Qué es un Orchestrator?

Un Orchestrator coordina múltiples adaptadores y servicios para resolver un problema del cliente.

Ejemplo: un diagnóstico de impresora puede requerir:

1. PrinterAdapter → logs
2. PrinterAdapter → feature flags
3. CustomerResolver → datos del cliente
4. TimelineService → registrar el evento

## Interfaz

```typescript
interface Orchestrator {
  getName(): string;
  canHandle(context: CustomerContext, problem: string): boolean;
  execute(context: CustomerContext, params: unknown): Promise<DiagnosisResult>;
}
```

## Registry

Los orquestadores se registran igual que los adaptadores:

```
OrchestratorRegistry.register(new PrinterDiagnosisOrchestrator())
```
