# Plataforma BI · Soporte Especializado · Restaurant.pe

Plataforma de Business Intelligence (estilo Power BI / Metabase / Grafana) que
consume **únicamente** la vista PostgreSQL `public.v_unificado`, la cual unifica
los canales WhatsApp Meta, WhatsApp Ticket y Zendesk.

> **Estado: WKS-001 completado — Workspace de Atención (primera versión funcional).**
> La bandeja de Zendesk ahora abre el Workspace en la columna central.
> Las siguientes fases agregan respuesta, acciones y más canales.

---

## ¿Qué necesito instalado? (una sola vez)

1. **Node.js 20 o superior** → https://nodejs.org (botón "LTS").
2. **Docker Desktop** → https://www.docker.com/products/docker-desktop
   (solo para levantar PostgreSQL fácil).

Para comprobar que quedaron instalados, abre una terminal y escribe:

```bash
node -v
docker -v
```

Si ambos muestran un número de versión, todo bien.

---

## Puesta en marcha (paso a paso)

### 1) Preparar las variables de entorno
En la carpeta del proyecto, copia el archivo de ejemplo:

```bash
cp .env.example .env
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

(En Windows, si `cp` no funciona, copia y renombra los archivos a mano.)

### 2) Levantar la base de datos
```bash
docker compose up -d
```
Esto enciende PostgreSQL (puerto 5432) y pgAdmin (http://localhost:5050,
usuario `admin@restaurant.pe`, clave `admin`).

> En esta base debes crear/cargar tu vista `public.v_unificado` (el SQL que ya
> tienes de la V2). Sin esa vista, la API arranca igual, pero el conteo dará 0.

### 3) Instalar dependencias del proyecto
```bash
npm install
```

### 4) Generar el cliente de la base de datos
```bash
npm run prisma:generate
```

### 5) Arrancar todo (backend + frontend juntos)
```bash
npm run dev
```

Cuando termine de cargar verás:
- **Frontend:** http://localhost:5173  (la plataforma con la barra lateral y los 10 dashboards)
- **Backend API:** http://localhost:4000/api/health  (debe responder `{ "ok": true }`)
- **Salud de la base:** http://localhost:4000/api/health/db

---

## ¿Qué incluye la FASE 1?

```
restaurant-bi/
├── backend/        API REST (Express + Prisma + PostgreSQL)
│   └── src/
│       ├── config/         carga y validación de variables de entorno
│       ├── routes/         definición de URLs (/api/...)
│       ├── controllers/    reciben la petición HTTP
│       ├── services/       lógica de negocio
│       ├── repositories/   ÚNICO punto que consulta public.v_unificado
│       ├── dto/ validators/ validación de filtros con Zod
│       ├── middlewares/    errores y rutas no encontradas
│       ├── types/ utils/   contratos y utilidades
│       └── app.ts, index.ts  arranque del servidor
├── frontend/       Interfaz (React + Vite + TypeScript + Tailwind)
│   └── src/
│       ├── layouts/        estructura visual (sidebar + topbar)
│       ├── pages/          los 10 dashboards (placeholders por ahora)
│       ├── router/         navegación entre dashboards
│       ├── components/     piezas reutilizables de interfaz
│       ├── contexts/       tema claro/oscuro
│       ├── providers/      React Query (caché + refresco cada 30 min)
│       ├── lib/ api/       cliente HTTP hacia el backend
│       └── config/         lista de dashboards y configuración
├── docker-compose.yml   PostgreSQL + pgAdmin
├── .env.example         plantilla de variables
└── package.json         scripts del proyecto
```

---

## Hoja de ruta (fases)

### Fases de plataforma BI
- [x] **FASE 1 — Arquitectura y estructura**
- [x] **FASE 2 — Backend:** consultas SQL sobre `v_unificado`, KPIs, filtros dinámicos, todos los endpoints.
- [x] **FASE 3 — Frontend base:** layout, navegación, reportes.
- [x] **FASE 4 — Dashboards y visualizaciones:** Apache ECharts.
- [ ] **FASE 5 — Explorador, exportaciones, alertas e insights automáticos.**
- [ ] **FASE 6 — Optimización, Docker completo y documentación final.**

### Sprints COPE (Workspace de Atención)
- [x] **ZD-004 — Migración a Zendesk Views API** (fuente oficial de la bandeja)
- [x] **WKS-001 — Workspace de Atención** (primera versión funcional, solo lectura)
- [ ] **WKS-002 — Respuesta y acciones en Workspace** (enviar mensajes, cambiar estado, asignar)
- [ ] **WKS-003 — Integración de canales** (WhatsApp, Meta en el Workspace)

---

## Reglas de arquitectura (para que la plataforma crezca sano)

1. El frontend nunca habla con la base; siempre pasa por la API.
2. La API solo lee de `public.v_unificado`; nunca de las tablas originales.
   Así, agregar un canal nuevo en el futuro **no** toca el frontend.
3. Las agregaciones (sumas, promedios, conteos) se hacen en PostgreSQL,
   no en el navegador: la API envía datos ya resumidos.
