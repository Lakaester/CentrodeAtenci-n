# COPE Omnichannel Architecture

**PI-6 · Sprint 6.5 — Architecture Consolidation**

---

## Overview

COPE's omnichannel architecture enables unified handling of tickets from multiple channels (WhatsApp/Meta, Email/Zendesk, and future channels) through a single UI — Atenciones — without any channel-specific logic in the UI layer.

---

## Module Map

```
src/modules/
├── meta/                  # Meta (WhatsApp) provider
├── inbox/                 # Unified inbox (merge Meta + Zendesk)
├── conversation/          # Unified conversation
├── reply/                 # Unified reply engine
├── ticket-actions/        # Unified ticket actions
└── customer-context/      # Customer 360 context
```

---

## Layer Per Module

Each module follows this structure:

```
module/
├── index.ts              # Public barrel
├── dto/
│   └── *.dto.ts          # Data Transfer Objects (pure types)
├── registry/
│   └── *.registry.ts     # Configuration maps
├── providers/
│   ├── *Provider.ts      # Interface
│   ├── Merged*Provider.ts # Implementation (routes by channel)
│   └── index.ts          # DI wiring
├── services/
│   └── *Service.ts       # Business logic (DI)
├── hooks/
│   └── use*.ts           # React Query hooks
└── mappers/
    ├── meta*.ts          # Meta → DTO
    ├── zendesk*.ts       # Zendesk → DTO
    └── index.ts          # Barrel
```

---

## Data Flow

```
Atenciones (UI — channel-agnostic)
  │
  ├── useInbox()
  │     └── MergedInboxProvider
  │           ├── MetaProvider.getTickets()
  │           │     └── metaToInbox()
  │           └── ZendeskProvider (fetchInbox)
  │                 └── zendeskToInbox()
  │
  ├── useConversation(ticket)
  │     └── MergedConversationProvider
  │           ├── subChannel === "meta" → MetaService.getConversation()
  │           │     └── metaConversationToConversation()
  │           └── subChannel === "zendesk" → placeholder
  │
  ├── useReply() (mutation)
  │     └── MergedReplyProvider
  │           ├── subChannel === "meta" → MetaService.sendMessage()
  │           └── subChannel === "zendesk" → API
  │
  ├── useTicketAction() (mutation)
  │     └── MergedTicketActionsProvider
  │           ├── subChannel === "meta" → Meta API
  │           └── subChannel === "zendesk" → Zendesk API
  │
  └── useCustomerContext(ticket)
        └── MergedCustomerContextProvider
              ├── subChannel === "meta" → metaToCustomerContext()
              └── subChannel === "zendesk" → zendeskToCustomerContext()
```

---

## Dependency Graph

```
src/modules/reply     → src/modules/meta
src/modules/inbox     → src/modules/meta
src/modules/conversation → src/modules/meta, inbox
src/modules/ticket-actions  → src/modules/inbox
src/modules/customer-context → src/modules/inbox, meta
src/pages/cope/Atenciones → inbox, conversation, reply, ticket-actions, customer-context
```

No circular dependencies.

---

## DTOs públicos

| Module | DTO | Purpose |
|---|---|---|
| inbox | `InboxTicketDTO` | Unified ticket representation |
| conversation | `ConversationMessageDTO` | Unified message representation |
| reply | `ReplyRequestDTO` / `ReplyResponseDTO` | Send message contract |
| ticket-actions | `TicketActionRequestDTO` / `TicketActionResponseDTO` | Execute action contract |
| customer-context | `CustomerContextDTO` | Customer 360 data |

---

## Channels & Subchannels

| InboxChannel | InboxSubChannel | Provider |
|---|---|---|
| `whatsapp` | `meta` | Meta (Mock → API) |
| `email` | `zendesk` | Zendesk API |
| `whatsapp | chat | instagram | facebook | bot` | `whaticket | unknown` | (future) |

---

## React Query configuration

| Hook | queryKey | staleTime | retry |
|---|---|---|---|
| `useInbox` | `["inbox"]` | 30s | 1 |
| `useConversation` | `["conversation", id, subChannel]` | 10s | 1 |
| `useCustomerContext` | `["customer-context", id, subChannel]` | 60s | 1 |
| `useReply` | mutation | — | 1 |
| `useTicketAction` | mutation | — | 1 |

---

## Adding a new channel

1. Create provider in `src/modules/meta/` (or equivalent)
2. Apply mapper in inbox/conversation/reply/ticket-actions/customer-context
3. Update Merged*Provider to handle the new subChannel
4. No UI changes needed

---

## API Middleware

Legacy API calls from WorkspaceArea (`api.post("/zendesk/tickets/...")`) are transparently routed through providers via `src/lib/apiMiddleware.ts`. This allows gradual migration without rewriting all components.
