# EcMedicalSolution

Backend base en NestJS generado en `backend/`.

## Estructura

- `backend/`: API backend con NestJS

## Comandos utiles

```bash
cd backend
npm run start:dev
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

Levantar el backend con Docker Compose:

```bash
export SUPABASE_URL="tu-url"
export SUPABASE_SERVICE_ROLE_KEY="tu-service-role-key"
docker compose up --build
```

La API quedara disponible en `http://localhost:3000`.