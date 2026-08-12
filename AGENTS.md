# Instrucciones del agente

- Responde siempre en espanol, sin excepciones.
- Backend en `backend/`, arranca con `npm run dev -w backend` (puerto 4000)
- Frontend en `frontend/`, arranca con `npm run dev -w frontend` (puerto 5173)
- BD remota PostgreSQL en `169.197.82.217:5432`, vista principal: `public.v_unificado_norm`
- Zendesk Views API es la fuente oficial de la bandeja desde sprint ZD-004 (Jul 2026)
- Zendesk view IDs en `backend/src/modules/zendesk/domain/ZendeskViewIds.ts`
- La bandeja inbox consulta views 360199057454 (unresolved) + 360199057434 (recent solved)
- ZendeskClient en `backend/src/modules/zendesk/infrastructure/ZendeskClient.ts`
- WKS-001 completado: Atenciones.tsx tiene layout 3 columnas (bandeja | workspace | cliente360)
- Componentes workspace en `frontend/src/components/workspace/`
- Hook `useTicketDetail` en `frontend/src/hooks/useTicketDetail.ts`

---

## REGLAS DEL PROYECTO COPE

1. Trabajar unicamente dentro de la epica actual.

2. No modificar ningun componente compartido sin auditoria previa.

3. No hacer reemplazos masivos.

4. No usar buscar/reemplazar global.

5. Cada PR debe afectar un unico dominio funcional.

6. Antes de modificar un componente compartido, listar:
   - consumidores
   - riesgo
   - impacto

7. No modificar: `modules/`, `providers/`, `hooks/`, `api/`, omnichannel salvo que la epica lo solicite.

8. Cada cambio debe terminar con:
   - archivos modificados
   - consumidores afectados
   - riesgo
   - validacion
   - build
   - TypeScript

9. Si un componente tiene mas de 5 consumidores, proponer una estrategia antes de modificarlo.

10. La estabilidad del producto tiene prioridad sobre la velocidad de desarrollo.

11. Nunca ejecutar mas de una Epica en una sola sesion.

12. Cada Epica debe finalizar con:
    - Build exitoso
    - TypeScript limpio
    - Validacion visual del usuario

13. Solo despues de finalizar una Epica podra iniciarse la siguiente.

## REGLA DE ORO

Ningun cambio visual podra modificar layout, spacing, altura, ancho, overflow, scroll, responsive, posicion, sticky o z-index, salvo que la Historia lo indique explicitamente.

## STOP AUTOMATICO

Si durante cualquier Historia ocurre: un componente desaparece, cambia el layout, desaparece un boton o filtro, cambia un scroll, un ancho, una altura o el comportamiento responsive → DETENER inmediatamente. No continuar con la siguiente Historia. Entregar informe con archivo responsable, cambio realizado y causa probable. Esperar autorizacion para continuar.

## CONGELADOS (Epica 1)

| Archivo | Motivo |
|---------|--------|
| `frontend/src/components/dashboard/shared.tsx` | >5 consumidores (7 paginas reportes) |
| `frontend/src/components/ui/Card.tsx` | Reservado Epica 2 |
| `frontend/src/components/ui/Input.tsx` | Reservado Epica 2 |
| `frontend/src/components/ui/DataTable.tsx` | Reservado Epica 2 |
| `frontend/src/components/ui/ErrorState.tsx` | Reservado Epica 2 |
| `frontend/src/components/ui/KpiCard.tsx` (ui/) | Reservado Epica 2 |
| `frontend/src/components/filters/FilterItem.tsx` | Sin consumidores activos |
| `frontend/src/components/filters/FilterGroup.tsx` | Sin consumidores activos |
| `frontend/src/components/filters/GlobalFilters.tsx` | Sin consumidores activos |
| `frontend/src/components/filters/FilterSearch.tsx` | Sin consumidores activos |
| `frontend/src/components/layout/Sidebar.tsx` (legacy) | Sin consumidores |
| `frontend/src/components/layout/Topbar.tsx` | Sin consumidores |
| `frontend/src/components/workspace/TicketWorkspace.tsx` | Sin consumidores |
| `frontend/src/components/workspace/Customer360Panel.tsx` | Sin consumidores |
| `frontend/src/modules/**` | Arquitectura omnicanal |
| `frontend/src/providers/**` | Infraestructura React |
| `frontend/src/hooks/**` | Logica de negocio |
