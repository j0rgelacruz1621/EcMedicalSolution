# Frontend EcMedicalSolution

Frontend base en React 19, TypeScript y Vite.

## Desarrollo local

```bash
npm install
npm run dev
```

La aplicacion queda disponible en `http://localhost:5173`.

## Docker

```bash
docker compose up --build frontend
```

## Tunel de Cloudflare

El servicio `cloudflare-tunnel-frontend` en `docker-compose.yml` requiere la variable de entorno `FRONTEND_CLOUDFLARE_TUNNEL_TOKEN`.
