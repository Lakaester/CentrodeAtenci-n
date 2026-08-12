# Architecture Map v1.0

## Context Map

```
┌─────────────────────────────────────────────────────────────────┐
│                      COPE Platform                               │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │  Domain   │  │  App     │  │   Core   │  │  Modules  │        │
│  │ (legacy)  │  │ (legacy) │  │ (frozen) │  │ (active)  │        │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘        │
│                                          │                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┘                       │
│  │Integrations│  │ Adapters │  │                                  │
│  └──────────┘  └──────────┘                                      │
└─────────────────────────────────────────────────────────────────┘
```

## Capas

| Capa | Estado | Nuevas funcionalidades |
|---|---|---|
| `domain/` | Legacy (solo mantenimiento) | ❌ No |
| `application/` | Legacy (solo mantenimiento) | ❌ No |
| `core/` | **Congelado** | ❌ Solo bugs/seguridad |
| `modules/` | Activo | ✅ Sí |
| `integrations/` | Activo | ✅ Sí |
| `adapters/` | Activo | ✅ Sí |

## Dependencias permitidas

```
modules → core (interfaces públicas únicamente)
modules → integrations → adapters
modules → modules (otros módulos)
core → core (entre sí)
```

## Dependencias prohibidas

```
core → modules
core → integrations
modules → domain (legacy)
```
