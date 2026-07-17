# EcMedicalSolution

Backend en NestJS y frontend en React + Vite.

## Estructura

- `backend/`: API backend con NestJS
- `frontend/`: SPA frontend con React, TypeScript y Vite

## Comandos utiles

```bash
cd backend
npm run start:dev
```

```bash
cd frontend
npm run dev
```

## Supabase

El backend ya incluye acceso base a Supabase mediante variables de entorno.

1. Crear `backend/.env` usando `backend/.env.example`
2. Completar `SUPABASE_URL` y `SUPABASE_SERVICE_ROLE_KEY`
3. Levantar el proyecto con Nest o Docker

Endpoints disponibles:

- `GET /users`
- `GET /users/:id`

Las consultas omiten el campo `password` por seguridad.

## Docker

Levantar backend, frontend y tuneles con Docker Compose:

```bash
cp .env.example .env
export SUPABASE_URL="tu-url"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
docker compose up --build
```

Variables en `.env` de la raiz:

- `CLOUDFLARE_TUNNEL_TOKEN`: token del tunel principal o compartido
- `FRONTEND_CLOUDFLARE_TUNNEL_TOKEN`: token del tunel del frontend si usas uno separado

La API quedara disponible en `http://localhost:3000`.
El frontend quedara disponible en `http://localhost:5173`.