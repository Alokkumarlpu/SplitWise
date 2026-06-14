# DECISIONS.md — Architecture & Implementation Decision Log

Each entry documents a significant decision made during the SplitWise Clone project, the alternatives considered, and the rationale for the chosen approach.

---

## Decision 1 — Backend Framework: Django REST Framework vs FastAPI vs Node.js/Express

**Date:** Project start  
**Decision:** Use **Django REST Framework (DRF)**

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Django REST Framework | Batteries-included ORM, auth, admin; mature ecosystem; quick to scaffold | Slightly more verbose than FastAPI; async support is newer |
| FastAPI | Async-native, auto-generated OpenAPI docs, modern Python type hints | No built-in ORM, no built-in admin; requires more manual setup |
| Node.js / Express | Large npm ecosystem, same language as frontend | No strong ORM by default; Python more familiar for data-heavy backends |

### Choice Rationale
DRF was chosen because: (1) the built-in ORM (Django ORM) significantly speeds up model creation and migrations; (2) `djangorestframework-simplejwt` provides production-grade JWT authentication out of the box; (3) Django admin provides a free data management interface; (4) `django-channels` integrates natively for WebSocket support.

---

## Decision 2 — Real-time Notifications: Django Channels vs Polling vs Server-Sent Events

**Date:** Mid-development  
**Decision:** Use **Django Channels + WebSockets**

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Django Channels (WebSockets) | True real-time, bidirectional; native Django integration; scales with Redis channel layer | More complex setup; requires Daphne ASGI server |
| Client-side polling (setInterval) | Simple to implement; no backend changes needed | Wasteful bandwidth; 5–30s latency; server load under many users |
| Server-Sent Events (SSE) | Simpler than WebSockets; one-way push from server | Browser connection limits; not truly bidirectional; less flexible |

### Choice Rationale
Django Channels was chosen for true real-time experience. The complexity cost is justified by the core UX requirement (instant notifications when a friend adds an expense). Daphne as the ASGI server handles both HTTP and WebSocket traffic in a single process, simplifying deployment.

---

## Decision 3 — Database: SQLite (dev) → Neon PostgreSQL (prod)

**Date:** Project start / deployment phase  
**Decision:** SQLite for local development, **Neon serverless PostgreSQL** for production

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| SQLite everywhere | Zero config; built into Python; no external service | Not suitable for multi-process/multi-worker production; no concurrent writes |
| Local PostgreSQL (Docker) | Parity with production; handles concurrency | Requires Docker setup; adds friction for local dev |
| Neon PostgreSQL (cloud) | Serverless; free tier; scales to zero; branching support; production-ready | Cold start latency on first query; requires network connection |
| Supabase PostgreSQL | Similar to Neon; includes realtime subscriptions | More complex than needed; PostgreSQL-only features not used here |

### Choice Rationale
SQLite for local dev removes all setup friction. Neon was chosen for production because: (1) free tier is generous; (2) serverless autoscaling means zero cost when idle; (3) connection pooling via Neon's proxy handles Django Channels' multiple worker processes correctly; (4) `dj-database-url` makes switching between SQLite and PostgreSQL a single env variable change.

---

## Decision 4 — Avatar/File Storage: ImageField vs Base64 TextField

**Date:** Deployment debugging phase  
**Decision:** Store avatars as **Base64 in a TextField** in the database

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Django ImageField + local filesystem | Standard Django approach; clean URLs | Render's ephemeral filesystem loses files on every redeploy |
| AWS S3 / Cloudflare R2 | Persistent; CDN-delivered; production standard | Requires AWS account setup, IAM credentials, `boto3` complexity |
| Cloudinary | Purpose-built image CDN; free tier available | External dependency; requires API key management |
| Base64 in TextField (chosen) | Zero infrastructure dependencies; works everywhere; no external services | Larger DB rows; not suitable for very large files; no CDN |

### Choice Rationale
For an MVP/demo project on Render's free tier, Base64 in the database is pragmatic. No additional services, no credentials, no CDN setup. Avatars are small profile photos (typically <200KB), so DB row size impact is minimal. A production app would migrate to S3, but the interface is identical (just swap the field and storage backend).

---

## Decision 5 — Frontend Framework: React (Vite) vs Next.js vs Plain HTML

**Date:** Project start  
**Decision:** Use **React with Vite**

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| React + Vite (chosen) | Fast HMR; SPA routing; large ecosystem; Vercel deploys easily | SEO requires extra config; SPA routing needs `vercel.json` rewrites |
| Next.js | SSR/SSG built-in; excellent SEO; file-based routing | Overkill for an authenticated app where SEO doesn't matter; slower dev setup |
| Plain HTML/CSS/JS | Zero build step; universal | No component reuse; manual state management; not maintainable at scale |

### Choice Rationale
Since SplitWise is a fully authenticated app (all content is behind login), SSR/SEO benefits of Next.js are irrelevant. Vite provides significantly faster hot module replacement than Create React App. The SPA routing is handled via `vercel.json` rewrites on Vercel.

---

## Decision 6 — CSS Framework: Tailwind CSS vs Plain CSS vs CSS Modules

**Date:** Project start  
**Decision:** Use **Tailwind CSS v4**

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Tailwind CSS (chosen) | Utility-first; consistent spacing/colors; no CSS context switching | Verbose class lists; needs build step |
| Plain CSS / index.css | Full control; no dependencies | No design system; inconsistent spacing; harder to maintain |
| CSS Modules | Scoped styles; no conflicts | More files; no pre-built design system |
| Styled Components | Component-scoped CSS-in-JS | Runtime overhead; adds complexity |

### Choice Rationale
Tailwind CSS accelerates UI development dramatically by providing a complete design system (spacing scale, colors, typography) without writing custom CSS. For a rapid MVP development cycle, the productivity gain outweighs the verbose class syntax.

---

## Decision 7 — Authentication: JWT vs Session vs OAuth

**Date:** Project start  
**Decision:** Use **JWT with refresh tokens** (`djangorestframework-simplejwt`)

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| JWT + refresh tokens (chosen) | Stateless; works naturally with React SPA; standard for REST APIs | Token revocation requires extra infrastructure |
| Django session auth | Built-in; server-managed; easy revocation | Requires same-origin (CORS issues); doesn't work well with SPAs |
| OAuth (Google/GitHub login) | Familiar UX; no password management | Complex setup; external dependency; overkill for MVP |

### Choice Rationale
JWT is the standard authentication mechanism for decoupled REST API + SPA architectures. `djangorestframework-simplejwt` provides short-lived access tokens (5 min) with long-lived refresh tokens (1 day). The frontend `api.js` implements an Axios interceptor for automatic token refresh on 401 responses, providing a seamless user experience.

---

## Decision 8 — Deployment Platform: Render vs Railway vs Fly.io vs AWS

**Date:** Deployment phase  
**Decision:** **Render** for backend, **Vercel** for frontend

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Render + Vercel (chosen) | Both have generous free tiers; GitHub auto-deploy; easy setup | Render free tier spins down after inactivity (50s cold start) |
| Railway | Simple; persistent services; no spin-down | Smaller free tier; less documentation |
| Fly.io | More control; global edge; persistent volumes | More complex configuration; Docker required |
| AWS (EC2 + S3 + RDS) | Enterprise-grade; full control | Expensive; complex IAM; overkill for MVP |
| Heroku | Mature platform; easy deploys | No free tier since 2022 |

### Choice Rationale
Render's free tier for Python web services + Neon's free PostgreSQL + Vercel's free frontend hosting = a complete zero-cost production stack. All three services integrate with GitHub for automatic deploys on push. The Render free tier's 50-second cold start is acceptable for a demo/portfolio project.

---

## Decision 9 — Split Types: Equal Only vs Multiple Split Modes

**Date:** Model design phase  
**Decision:** Support **four split types**: equal, unequal, percentage, shares

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| Equal split only | Simple model; easy to implement | Doesn't reflect real-world usage (unequal contributions) |
| Equal + unequal | Handles most cases | Still misses percentage/share-based splits |
| All four types (chosen) | Complete feature parity with Splitwise | More complex UI; more validation logic |

### Choice Rationale
Splitwise's core value proposition is flexible expense splitting. Supporting all four modes (`equal`, `unequal`, `percentage`, `shares`) makes the app genuinely useful rather than a toy demo. The `split_value` field on `ExpenseSplit` handles the numeric parameter for non-equal splits (percentage value, share count, or custom amount).

---

## Decision 10 — WebSocket Channel Layer: In-Memory vs Redis

**Date:** Channels setup  
**Decision:** Use **In-Memory channel layer** (dev/demo), with Redis as the production upgrade path

### Options Considered

| Option | Pros | Cons |
|---|---|---|
| In-Memory layer (chosen) | Zero config; works immediately; no external service | Single-process only; no cross-process messaging; state lost on restart |
| Redis channel layer | Production-grade; multi-process; persistent | Requires Redis instance; adds cost and configuration |

### Choice Rationale
For an MVP demo with a single Render worker, the in-memory channel layer is sufficient. The architecture is designed to upgrade to Redis by changing one setting in `CHANNEL_LAYERS`. The code is identical either way — only the configuration changes.
