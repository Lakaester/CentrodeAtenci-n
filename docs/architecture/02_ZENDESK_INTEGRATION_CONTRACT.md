# Zendesk Integration Contract v1.0

## Propósito

Este contrato define la integración entre COPE y Zendesk. Todo el código del módulo `modules/zendesk/` debe cumplir lo aquí especificado. Ningún otro módulo de COPE debe conocer los modelos internos de Zendesk.

---

## 1. Arquitectura del módulo

```
modules/zendesk/
├── index.ts                        # Export público
├── domain/
│   ├── ZendeskTypes.ts             # Modelos internos (no exportados fuera del ACL)
│   ├── ZendeskConfig.ts            # Configuración desde .env
│   └── ZendeskErrorHandler.ts      # Manejo tipado de errores
├── application/
│   ├── ZendeskProvider.ts          # Interface del Provider (contrato)
│   ├── MockZendeskProvider.ts      # Implementación mock (datos de prueba)
│   ├── dto/
│   │   └── ZendeskDTOs.ts          # DTOs de frontera ACL → COPE
│   └── mapper/
│       └── ZendeskMapper.ts        # Traducción modelos Zendesk ↔ DTOs COPE
├── infrastructure/
│   ├── ZendeskClient.ts            # Shell HTTP (sin implementación real)
│   └── ZendeskRepository.ts        # Orquesta Provider + Mapper
└── presentation/
    ├── ZendeskController.ts        # Controlador REST
    └── ZendeskRoutes.ts            # Rutas Express
```

---

## 2. Provider Interface (ZendeskProvider)

El `ZendeskProvider` es el contrato que define todas las operaciones que COPE puede ejecutar sobre Zendesk:

| Método | Entrada | Salida | Estado |
|--------|---------|--------|--------|
| `getPendingTickets` | `page?: number` | `BandejaZendeskDTO` | Mock |
| `getAssignedTickets` | `page?: number` | `BandejaZendeskDTO` | Mock |
| `getClosedTickets` | `page?: number` | `BandejaZendeskDTO` | Mock |
| `getTicket` | `id: number` | `TicketZendeskDTO \| null` | Mock |
| `getConversation` | `ticketId: number` | `ConversacionZendeskDTO` | Mock |
| `getUser` | `userId: number` | `ClienteZendeskDTO \| null` | Mock |
| `getOrganization` | `orgId: number` | `{ id, name } \| null` | Mock |
| `getTicketFields` | — | `{ id, title, type }[]` | Mock |
| `assignTicket` | `ticketId, assigneeId` | `TicketZendeskDTO \| null` | Mock |
| `reply` | `ticketId, message, isPublic` | `TicketZendeskDTO \| null` | Mock |
| `updateCustomFields` | `ticketId, fields[]` | `TicketZendeskDTO \| null` | Mock |
| `changeStatus` | `ticketId, status` | `TicketZendeskDTO \| null` | Mock |
| `closeTicket` | `ticketId` | `TicketZendeskDTO \| null` | Mock |

---

## 3. Providers disponibles

| Provider | Cuándo se usa | Implementación |
|----------|---------------|----------------|
| `MockZendeskProvider` | Siempre (por ahora) | Datos mock, sin HTTP |
| `ZendeskRealProvider` | Futuro Sprint | Llamadas HTTP reales |

**Regla**: El Workspace de COPE debe funcionar igual con cualquier Provider. El cambio se hace en `ZendeskRepository` sin modificar controladores ni frontend.

---

## 4. Modelos Zendesk (internos del ACL — nunca expuestos)

### ZendeskTicket

```typescript
interface ZendeskTicket {
  id: number; subject: string; description: string;
  status: "new" | "open" | "pending" | "solved" | "closed";
  priority: "low" | "normal" | "high" | "urgent";
  type: "problem" | "incident" | "question" | "task";
  created_at: string; updated_at: string;
  requester_id: number; assignee_id: number | null; group_id: number;
  tags: string[];
  custom_fields: { id: number; value: string }[];
}
```

### ZendeskUser

```typescript
interface ZendeskUser {
  id: number; name: string; email: string; phone: string | null;
  organization_id: number | null;
  role: "end_user" | "agent" | "admin";
  created_at: string; updated_at: string;
}
```

### ZendeskComment

```typescript
interface ZendeskComment {
  id: number; body: string; author_id: number;
  type: "Comment" | "VoiceComment"; created_at: string;
  public: boolean;
  attachments: { id: number; file_name: string; content_url: string }[];
}
```

---

## 5. DTOs de frontera (cruzan el ACL hacia COPE)

| DTO | Campos | Procedencia |
|-----|--------|-------------|
| `TicketZendeskDTO` | `id, ticketOriginalId, ticketOriginalStatus, asunto, clienteNombre, clienteEmail, clienteTelefono, createdAt, updatedAt` | `ZendeskTicket` + `ZendeskUser` |
| `MensajeZendeskDTO` | `id, contenido, emisor, tipo (cliente/agente/sistema), timestamp` | `ZendeskComment` + `ZendeskUser` |
| `ClienteZendeskDTO` | `id, nombre, email, telefono` | `ZendeskUser` |
| `BandejaZendeskDTO` | `tickets: TicketZendeskDTO[], total, pagina` | Agregación |
| `ConversacionZendeskDTO` | `ticketId, mensajes: MensajeZendeskDTO[], total` | Agregación |

---

## 6. Mapeo Zendesk → COPE

| Zendesk | COPE ACL DTO | Destino final en COPE |
|---------|--------------|----------------------|
| `ticket.id` | `TicketZendeskDTO.ticketOriginalId` | `Atencion.origen.ticketOriginalId` |
| `ticket.status` | `TicketZendeskDTO.ticketOriginalStatus` | `Atencion.origen.ticketOriginalStatus` |
| `ticket.subject` | `TicketZendeskDTO.asunto` | `Atencion.contexto.asunto` |
| `user.name` | `ClienteZendeskDTO.nombre` | `Atencion.cliente.nombre` |
| `user.email` | `ClienteZendeskDTO.email` | `Atencion.cliente.email` |
| `user.phone` | `ClienteZendeskDTO.telefono` | `Atencion.cliente.telefono` |
| `comment.body` | `MensajeZendeskDTO.contenido` | `Actividad` (tipo comunicacion) |

---

## 7. Códigos de error

| Código interno | HTTP | Significado | Reintentable |
|----------------|------|-------------|--------------|
| `AUTH_ERROR` | 503 | Zendesk no configurado | No |
| `NOT_FOUND` | 404 | Recurso no existe | No |
| `RATE_LIMIT` | 429 | Límite de peticiones alcanzado | Sí |
| `NETWORK_ERROR` | 502 | Error de conexión | Sí |
| `VALIDATION_ERROR` | 400 | Datos inválidos | No |
| `UNKNOWN_ERROR` | 500 | Error inesperado | No |

---

## 8. Configuración (.env)

```
ZENDESK_SUBDOMAIN = "midominio"
ZENDESK_EMAIL     = "cope@midominio.com"
ZENDESK_TOKEN     = "tu_token_api"
```

---

## 9. Dependencias

| Dependencia | Uso actual | Uso futuro |
|-------------|------------|------------|
| `zod` | Validación de DTOs | Validación de respuestas HTTP |
| `MockZendeskProvider` | Datos mock para desarrollo | — |
| — | — | `fetch` o `axios` para HTTP |

---

## 10. Preparación para otros canales

Para agregar un nuevo canal (Whaticket, WAMeta), replicar:

```
modules/whaticket/
├── application/
│   ├── WhaticketProvider.ts        # Interface
│   ├── MockWhaticketProvider.ts    # Mock
│   └── dto/WhaticketDTOs.ts
├── domain/
│   ├── WhaticketModels.ts
│   └── WhaticketConfig.ts
├── infrastructure/
│   └── WhaticketRepository.ts
└── presentation/
    ├── WhaticketController.ts
    └── WhaticketRoutes.ts
```

---

*Versión: 1.0.0*
*Última actualización: 2026-07-15*
