# Déploiement — App interne DrwinDesk (SPA Vite) sur `app.drwintech.com`

SPA React/Vite (`apps/app`) buildée en statique et servie par **nginx** dans un conteneur.
Même chaîne que l'API : image **GHCR** + **GitHub Actions** (push `main` → build → deploy SSH)
+ nginx hôte + Certbot. Le site public reste séparé (`webdrwt.drwintech.com`).

## Variables

| Variable | Valeur |
|---|---|
| Image | `ghcr.io/devdrwt/intra_front` |
| `SUBDOMAIN` | `app.drwintech.com` |
| `APP_DIR` (VPS) | `/opt/intra-app` |
| `HOST_PORT` (loopback unique) | `3300` (api = 3100) |
| API appelée | `https://api.drwintech.com/api/v1` (inlinée au build via `VITE_API_URL`) |

> La SPA appelle l'API en cross-subdomain : ça marche car le backend autorise déjà
> `https://app.drwintech.com` dans `CORS_ORIGINS` et pose ses cookies sur `.drwintech.com`.

---

## 1. DNS (Hostinger)

Zone DNS `drwintech.com` → ajouter : `A` · `app` · `69.62.108.213`.
Vérifier : `nslookup app.drwintech.com 8.8.8.8` → `69.62.108.213`.

## 2. Secrets GitHub du dépôt `intra_front`

Settings → Secrets and variables → Actions (les mêmes que pour l'API, **sauf le dossier**) :

| Secret | Valeur |
|---|---|
| `VPS_HOST` | `69.62.108.213` |
| `VPS_USER` | `root` |
| `VPS_PORT` | `22` |
| `VPS_APP_DIR` | `/opt/intra-app`  ← **différent de l'API** |
| `VPS_SSH_KEY` | la **même clé base64** que pour l'API (déjà dans `authorized_keys`) |

## 3. Premier build d'image

Merge `dev → main` (ou *Run workflow*) → le workflow `Deploy App` build et pousse
`ghcr.io/devdrwt/intra_front:latest`. **Rendre le package public** (repo → Packages →
`intra_front` → Package settings → Public). Le job *deploy* échoue tant que `/opt/intra-app`
n'existe pas sur le VPS — normal, étape 4.

## 4. Première mise en service (VPS, root)

```bash
mkdir -p /opt/intra-app
git clone https://github.com/Devdrwt/intra_front.git /opt/intra-app
cd /opt/intra-app && git checkout main

cp .env.app.production.example .env      # APP_IMAGE + COMPOSE_FILE + HOST_PORT=3300
chmod 600 .env

docker compose pull
docker compose up -d
docker compose ps
curl -i http://127.0.0.1:3300            # attendu : HTTP 200 + HTML de la SPA
```

## 5. Reverse proxy nginx + HTTPS

```bash
cat > /etc/nginx/conf.d/intra_app.conf <<'EOF'
server {
    listen 80;
    server_name app.drwintech.com;
    location / {
        proxy_pass http://127.0.0.1:3300;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 60s;
    }
}
EOF

nginx -t && systemctl reload nginx
certbot --nginx -d app.drwintech.com --redirect --non-interactive --agree-tos -m admin@drwintech.com
curl -I https://app.drwintech.com        # attendu : HTTP/2 200
```

Puis ouvrir **https://app.drwintech.com** → login (`drwintech` / `admin@drwintech.com`).

## 6. Déploiement continu

Une fois le job *deploy* vert (secrets posés + `/opt/intra-app` cloné) : **chaque push sur
`main` touchant `apps/app/**` ou `packages/ui/**` reconstruit et redéploie la SPA.**

> Rebuild important : `VITE_API_URL` est **inliné au build**. Pour changer l'URL d'API,
> modifier le build-arg (ou la *repo variable* `VITE_API_URL`) et relancer le build.
