# syntax=docker/dockerfile:1
# SPA interne DrwinDesk (Vite/React) — build statique servi par nginx.
# Contexte de build = racine du monorepo (workspaces npm).
# Les variables VITE_* sont INLINÉES au build (passées en build-args par la CI).

# ---------- Builder ----------
FROM node:22-alpine AS builder
WORKDIR /repo
RUN apk add --no-cache libc6-compat
# Manifestes d'abord (cache des dépendances)
COPY package.json package-lock.json ./
COPY packages/ui/package.json ./packages/ui/
COPY apps/app/package.json ./apps/app/
COPY apps/web/package.json ./apps/web/
RUN npm ci
# Sources puis build de la SPA
COPY . .
ARG VITE_API_URL=https://api.drwintech.com/api/v1
ENV VITE_API_URL=$VITE_API_URL \
    VITE_USE_MOCKS=false
RUN npm run build --workspace apps/app

# ---------- Runner (nginx static) ----------
FROM nginx:alpine AS runner
RUN rm -f /etc/nginx/conf.d/default.conf
COPY apps/app/nginx.conf /etc/nginx/conf.d/app.conf
COPY --from=builder /repo/apps/app/dist /usr/share/nginx/html
EXPOSE 80
