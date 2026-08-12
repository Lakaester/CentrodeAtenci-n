# UX-003: Refinamiento visual del scroll del Sidebar

## Problema

El menú lateral mostraba una barra de scroll visible que rompía la continuidad visual.

## Solución

Ocultar el scrollbar manteniendo la funcionalidad completa de scroll.

## Implementación

**Archivo:** `frontend/src/styles/variables.css`

```css
.sidebar-scroll-hidden {
  scrollbar-width: none;        /* Firefox */
  -ms-overflow-style: none;     /* IE/Edge legacy */
}
.sidebar-scroll-hidden::-webkit-scrollbar {
  display: none;                /* Chrome, Safari, Edge */
}
```

**Archivo:** `frontend/src/components/layout/CopeSidebar.tsx`

Clase `sidebar-scroll-hidden` aplicada al `<nav>` del sidebar.

## Compatibilidad

| Navegador | Soporte |
|-----------|---------|
| Chrome | ✅ `::-webkit-scrollbar { display: none }` |
| Edge | ✅ `::-webkit-scrollbar { display: none }` + `scrollbar-width: none` |
| Firefox | ✅ `scrollbar-width: none` |
| Safari | ✅ `::-webkit-scrollbar { display: none }` |

## Comportamiento preservado

- ✅ Rueda del mouse
- ✅ Touchpad
- ✅ Pantallas táctiles
- ✅ Teclado (flechas, PageUp, PageDown)
- ✅ Foco y accesibilidad
