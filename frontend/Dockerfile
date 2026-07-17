FROM node:22-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

FROM node:22-alpine AS development

WORKDIR /app

COPY package*.json ./

EXPOSE 5173

CMD ["sh", "-c", "npm ci && npm run dev"]

FROM nginx:1.29-alpine AS production

COPY --from=builder /app/dist /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]