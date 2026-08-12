# Historial de Sprints

## Sprint 32 — Zendesk Provider (Preparación)

### Estado: Completado
### Fecha: 2026-07-15

---

## Arquitectura entregada

```
modules/zendesk/
├── index.ts
├── domain/
│   ├── ZendeskTypes.ts             # Modelos internos (ZendeskTicket, ZendeskUser, ZendeskComment)
│   ├── ZendeskConfig.ts            # Config desde .env (subdomain, email, token)
│   ├── ZendeskErrorHandler.ts      # 6 códigos de error tipados
│   └── index.ts
├── application/
│   ├── ZendeskProvider.ts          # Interface con 13 métodos
│   ├── MockZendeskProvider.ts      # Implementación mock (sin HTTP)
│   ├── dto/
│   │   └── ZendeskDTOs.ts          # 5 DTOs de frontera (Ticket, Mensaje, Cliente, Bandeja, Conversacion)
│   └── mapper/
│       └── ZendeskMapper.ts        # Traducción modelos → DTOs
├── infrastructure/
│   ├── ZendeskClient.ts            # Shell (lanza error "no configurado")
│   └── ZendeskRepository.ts        # Orquesta Provider según configuración
└── presentation/
    ├── ZendeskController.ts        # 4 endpoints REST
    └── ZendeskRoutes.ts            # Rutas montadas en /api/zendesk
```

---

## Contratos

| Contrato | Archivo | Versión |
|----------|---------|---------|
| Integration Contract | `docs/architecture/02_ZENDESK_INTEGRATION_CONTRACT.md` | v1.0 |
| Architecture Decision Record | `docs/adr/ADR-001.md` | Aprobado |

---

## Interfaces entregadas

| Interface | Métodos | Estado |
|-----------|---------|--------|
| `ZendeskProvider` | 13 métodos | ✓ Completada |
| `InternalZendeskClient` | 3 métodos | ✓ Shell |
| `ZendeskError` | 4 campos | ✓ Completada |

---

## DTOs entregados

| DTO | Validación Zod | Uso |
|-----|---------------|-----|
| `TicketZendeskDTO` | ✓ | Cruza el ACL hacia COPE |
| `MensajeZendeskDTO` | ✓ | Mensajes de conversación |
| `ClienteZendeskDTO` | ✓ | Datos del usuario Zendesk |
| `BandejaZendeskDTO` | ✓ | Lista paginada de tickets |
| `ConversacionZendeskDTO` | ✓ | Conversación completa |

---

## Mappers

| Mapper | Métodos | Estado |
|--------|---------|--------|
| `ZendeskMapper` | `ticketToDTO`, `commentToDTO`, `userToDTO`, `ticketsToBandejaDTO`, `commentsToConversacionDTO` | ✓ Traducción completa |

---

## Deuda técnica identificada

| Tipo | Descripción | Severidad |
|------|-------------|-----------|
| **Sin implementar** | `ZendeskClient` es un shell que lanza error. No hay llamadas HTTP reales. | Baja (sprint preparatorio) |
| **Mock** | `MockZendeskProvider` devuelve datos estáticos de ejemplo. | Baja (previsto) |
| **Sin pruebas** | No hay tests unitarios para el módulo. | Media |
| **Configuración** | Las variables `.env` no se usan hasta que se autorice el consumo. | Baja |

---

## Riesgos detectados

| Riesgo | Impacto | Mitigación |
|--------|---------|------------|
| El ACL no se probó contra Zendesk real | Alto | Sprint 33 debe habilitar ZendeskClient real con flag de feature |
| Los mappers asumen campos que Zendesk podría no enviar | Medio | Las validaciones Zod mitigan errores de formato |
| Rate limit (429) no se ha probado | Medio | `ZendeskErrorHandler` ya lo contempla |

---

## Provider Swap: Mock → Real

El cambio de `MockZendeskProvider` a `ZendeskRealProvider` se hace en una sola línea:

```typescript
// En ZendeskRepository.ts — constructor
if (isZendeskConfigurado(config)) {
  this.provider = new ZendeskRealProvider(config);  // ← Sprint 33
} else {
  this.provider = new MockZendeskProvider();
}
```

El Workspace de COPE no requiere ninguna modificación. El controlador y las rutas son independientes del provider.

---

## Validación del Sprint

| Criterio | Estado |
|----------|--------|
| ✓ Existe el módulo Zendesk completamente desacoplado | ✓ |
| ✓ Existe el contrato de integración | ✓ |
| ✓ Existen todas las interfaces necesarias | ✓ |
| ✓ El dominio no conoce Zendesk | ✓ (0 referencias en domain/) |
| ✓ El Workspace puede cambiar de MockProvider a ZendeskProvider sin modificaciones | ✓ |

---

## Recomendaciones para Sprint 33

1. **Implementar `ZendeskRealProvider`** con llamadas HTTP reales usando `fetch`.
2. **Agregar tests unitarios** para `ZendeskMapper`, `MockZendeskProvider` y `ZendeskErrorHandler`.
3. **Configurar variable de feature flag** `ZENDESK_ENABLED` para habilitar/deshabilitar llamadas reales.
4. **Implementar `getTicketFields`** con campos personalizados reales de Zendesk.
5. **Conectar el provider con `Atencion`**: crear Atencion automáticamente cuando se recibe un ticket de Zendesk.
