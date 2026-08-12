# CI/CD Pipeline

## Etapas

```
[Lint] → [Build] → [Test] → [Quality Gate] → [Artifact] → [Deploy] → [Smoke Test] → [Rollback]
```

## Comandos

| Etapa | Comando |
|---|---|
| Lint | `npm run lint` |
| Build | `npm run build -w backend && npm run build -w frontend` |
| Test | `npm run test -w backend` |
| Quality Gate | `npm run lint && npm run test -w backend` |
| Deploy | `npm run start` |

## Rollback

```bash
git revert HEAD --no-edit
npm run build -w backend
npm run start
```
