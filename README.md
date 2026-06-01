# DrwinDesk — Front (monorepo)

Intranet / ERP / SIRH pour Drwintech, puis commercialisé en SaaS auprès de PME.
Stack **full TypeScript** (Stack A) — backend NestJS séparé. Ce dépôt = le front.

## Structure

```
intra_front/
├── apps/
│   ├── web/      → Next.js 15 + Tailwind — site public + espace candidat (SEO/SSR)
│   └── app/      → Vite + React 19 + Tailwind — ERP/SIRH interne (derrière auth, SPA)
└── packages/
    └── ui/       → Design system Tailwind partagé (preset + composants)
```

**Pourquoi deux apps ?** Le public/candidat profite du SSR/SEO (Next.js). L'app interne
(tableaux, formulaires, dashboards derrière auth) est une SPA — plus simple, sans SSR inutile.
Les deux partagent `@drwindesk/ui` (tokens Tailwind + composants).

## Démarrer

```bash
npm install            # installe tout le workspace
npm run dev:web        # site public        → http://localhost:3001
npm run dev:app        # app interne (SPA)   → http://localhost:3002
```

Le backend NestJS (`intra_back`) tourne sur `:3000`. Ports 3001/3002 alignés sur
son `CORS_ORIGINS`. En dev, l'app interne appelle `/api/v1` via le proxy Vite → cookies same-origin.

## Build

```bash
npm run build          # build toutes les apps
npm run typecheck      # vérif TS sur tout le workspace
```

## Conventions

- **Auth** : cookies httpOnly (`dd_access`/`dd_refresh`) + CSRF double-submit
  (header `x-csrf-token` = cookie `dd_csrf`) sur les mutations. Voir `apps/app/src/lib/api.ts`.
- **Multi-tenant** : le `tenantId` n'est **jamais** envoyé par le front — il est dans le JWT signé.
  Le login prend un `tenantSlug` ; le filtrage est garanti côté backend (extension Prisma + RLS).
- **Mocks par domaine** : `apps/app/src/lib/config.ts`. Auth réel par défaut ; RH/Présences/Documents
  mockés tant que leurs endpoints NestJS n'existent pas (`VITE_USE_MOCKS=false` pour basculer).
- **Design system d'abord** : primitives UI dans `packages/ui` avant de dérouler les modules.
- Mobile : PWA (V1) → Expo/React Native (V2) — clients **Bearer** (exemptés de CSRF).
