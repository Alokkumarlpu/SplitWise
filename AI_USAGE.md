# AI_USAGE.md — AI Context, Tools & Usage Log

## 1. Project Overview

**SplitWise Clone** is a full-stack expense-splitting web application built with:
- **Frontend**: React (Vite) + Tailwind CSS v4 + React Router + Axios
- **Backend**: Django 6 + Django REST Framework + Django Channels (WebSockets) + SimpleJWT
- **Database**: PostgreSQL hosted on Neon (serverless)
- **Deployment**: Vercel (frontend) + Render (backend)

---

## 2. AI Tools Used

| Tool | Role |
|---|---|
| **Antigravity (Google DeepMind / Gemini)** | Primary coding assistant — architecture, code generation, debugging, deployment |
| **GitHub Copilot** | Inline code completion during manual editing |

---

## 3. How AI Was Used

Antigravity (an agentic AI coding assistant powered by Google DeepMind's Gemini) was used throughout the entire development lifecycle:

- **Backend architecture** — Designing Django models, serializers, views, URL routing, and the Greedy Debt-Simplification Algorithm
- **WebSocket consumers** — Writing Django Channels consumer classes for real-time notifications and expense chat
- **Frontend components** — Generating React component structure, state management, routing, and responsive UI
- **JWT auth flow** — Implementing access/refresh token logic including the Axios interceptor for auto-refresh on 401
- **Database migration** — Writing `migrate_data.py` to safely transfer SQLite data to Neon PostgreSQL
- **Deployment debugging** — Diagnosing and fixing Render (gunicorn config) and Vercel (react-scripts vs vite) deployment failures iteratively
- **Documentation** — Generating SCOPE.md, DECISIONS.md, AI_USAGE.md, IMPORT_REPORT.md, and README.md
- **Testing strategy** — Planning manual QA flows and unit test coverage

---

## 4. System Architecture & API Design

### Authentication Flow
1. Register/Login requests are sent to Django.
2. Django issues short-lived access tokens (5 min) and long-lived refresh tokens (1 day) via SimpleJWT.
3. Tokens are stored in frontend `localStorage`.
4. The access token is attached as a Bearer token in the `Authorization` header of all Axios requests.
5. The Axios response interceptor automatically refreshes the access token on 401 and retries the original request.
6. If the refresh token is also expired, the user is redirected to `/login`.

### API Endpoints

| Category | Endpoint | Method | Description |
|---|---|---|---|
| **Auth** | `/api/auth/register/` | POST | Register new user |
| | `/api/auth/login/` | POST | Login + receive JWT |
| | `/api/auth/token/refresh/` | POST | Refresh access token |
| | `/api/auth/logout-all/` | POST | Clear all sessions |
| **Users** | `/api/users/me/` | GET | Current user details |
| | `/api/users/?search=` | GET | User autocomplete |
| **Profile** | `/api/profile/` | GET/PUT | Profile & preferences |
| | `/api/profile/avatar/` | POST | Upload Base64 avatar |
| | `/api/profile/change-password/` | POST | Change password |
| | `/api/profile/delete-account/` | DELETE | Deactivate account |
| | `/api/profile/notifications/` | GET/PUT | Notification prefs |
| | `/api/profile/privacy/` | GET/PUT | Privacy settings |
| | `/api/profile/privacy/block/` | POST | Block a user |
| | `/api/profile/privacy/unblock/` | POST | Unblock a user |
| **Groups** | `/api/groups/` | GET/POST | List / create groups |
| | `/api/groups/<id>/` | GET/PATCH | Group details / edit |
| | `/api/groups/<id>/add-member/` | POST | Add member |
| | `/api/groups/<id>/remove-member/` | POST | Remove member |
| **Expenses** | `/api/expenses/` | POST | Create expense + splits |
| | `/api/expenses/<id>/` | PUT/PATCH/DELETE | Edit / delete expense |
| **Settlements** | `/api/settlements/` | POST | Record settlement |
| **Balances** | `/api/balances/` | GET | Net balance summary |
| **Friends** | `/api/friends/` | GET/POST | List / add friends |
| | `/api/friends/<id>/` | DELETE | Unfriend |
| | `/api/friends/invite/` | POST | Email invite log |
| **Dashboard** | `/api/dashboard/` | GET | Groups, balances, activity |
| **Activity** | `/api/activity/` | GET | Activity feed |
| **Calculators** | `/api/calculators/rent/` | POST | Rent split calculator |
| | `/api/calculators/travel/` | POST | Travel split calculator |
| **Support** | `/api/support/` | POST | Submit support ticket |

### WebSocket
- `ws://<backend>/ws/chat/expense/<expense_id>/` — Real-time expense chat via Django Channels

### Frontend Routes

| Route | Screen |
|---|---|
| `/` | Landing → redirects to `/dashboard` or `/login` |
| `/login` | Login screen |
| `/register` | Registration |
| `/dashboard` | Balance overview, groups, recent activity |
| `/groups/:id` | Group details, members, expenses, balances |
| `/groups/create` | Create group with member search |
| `/expenses/:id` | Expense details + chat |
| `/friends` | Friends list with per-friend balances |
| `/settings` | Profile, notifications, sessions, privacy |
| `/calculators` | Calculator hub |
| `/calculators/rent` | Rent split calculator |
| `/calculators/travel` | Travel split calculator |
| `/support` | Support ticket form |
| `/logout` | Clears auth state, redirects to login |

---

## 5. Key AI Prompts Used

### Prompt 1 — Initial Architecture
> *"Build a Splitwise clone. Backend: Django REST Framework with JWT auth, Django Channels for WebSockets, PostgreSQL. Frontend: React with Vite and Tailwind. Include groups, expenses with equal/unequal/percentage/shares split types, settlements, friends, real-time notifications, and user settings."*

### Prompt 2 — Django Channels / WebSocket Notifications
> *"Set up Django Channels in this Django project. Add a NotificationConsumer WebSocket consumer that sends notifications to authenticated users when an expense is added to their group. Use in-memory channel layer."*

### Prompt 3 — JWT Auto-Refresh Interceptor
> *"Write an Axios interceptor that automatically refreshes the JWT access token when a 401 response is received, retries the original request with the new token, and redirects to /login if the refresh token is also expired."*

### Prompt 4 — Database Migration Script
> *"Write a Python script that: (1) temporarily hides the .env file to force Django to use SQLite, (2) dumps all data with --natural-foreign --natural-primary, (3) restores the .env, (4) disconnects Django post_save signals to prevent duplicate profile creation, then (5) loads the fixture into the PostgreSQL database."*

### Prompt 5 — Deployment Fix
> *"The Render deployment is failing with ModuleNotFoundError: No module named 'your_application'. The correct Django WSGI module is splitwise_backend.wsgi. How do I fix the Render start command and render.yaml?"*

---

## 6. Cases Where AI Produced Incorrect Output

### Case 1 — Wrong Gunicorn Module Name (Render Placeholder Text)

**What AI produced:**
```bash
gunicorn your_application.wsgi
```
The AI copied Render's literal **placeholder text** from template documentation instead of substituting the actual Django project module name.

**How it was caught:**
Render deployment failed with:
```
ModuleNotFoundError: No module named 'your_application'
```
Caught by reading the Render deployment logs carefully.

**What was changed:**
```bash
# Wrong (AI-generated placeholder)
gunicorn your_application.wsgi

# Correct
gunicorn splitwise_backend.wsgi --bind 0.0.0.0:$PORT --workers 2
```

**Lesson:** AI sometimes copies placeholder text from documentation without substituting project-specific values. Always verify module names against your actual directory structure.

---

### Case 2 — Windows-Only Packages in `requirements.txt`

**What AI produced:**
```
pypiwin32==223
pywin32==311
pyttsx3==2.99
comtypes==1.4.15
audioop-lts==0.2.2
mysqlclient==2.2.8
```
These are Windows-only packages from the development machine's global Python environment — COM automation, text-to-speech, Windows audio API, and MySQL client (not used at all in this project).

**How it was caught:**
Render deployment (Linux) failed during `pip install` with:
```
ERROR: No matching distribution found for pypiwin32>=223
ERROR: No matching distribution found for pywin32>=311
Failed to build mysqlclient==2.2.8 (no pkg-config for mysqlclient on Linux)
```

**What was changed:**
- Deleted the root-level `requirements.txt` entirely (it was a global env dump)
- Only `backend/requirements.txt` is used for deployment (clean, project-specific dependencies)

**Lesson:** AI may export all packages from the development environment. Always audit `requirements.txt` — generate it inside a clean virtual environment with `pip freeze`, not from the global Python installation.

---

### Case 3 — Typo: `wsg1` (digit 1) instead of `wsgi` (letter i)

**What AI produced:**
```bash
gunicorn SplitWise.wsg1 --bind 0.0.0.0:$PORT
```
Two bugs at once: `SplitWise` (wrong case, wrong name) and `wsg1` (digit `1` instead of letter `i`).

**How it was caught:**
The Render dashboard displayed the command visually. The deployment log showed:
```
ModuleNotFoundError: No module named 'SplitWise'
```
A character-by-character comparison against the known module name `splitwise_backend.wsgi` revealed both errors.

**What was changed:**
```bash
# Wrong (AI-generated — two typos)
gunicorn SplitWise.wsg1 --bind 0.0.0.0:$PORT

# Correct
gunicorn splitwise_backend.wsgi --bind 0.0.0.0:$PORT --workers 2
```

**Lesson:** AI makes visually subtle typographic errors (1 vs i, uppercase vs lowercase) that are hard to spot in code review but cause catastrophic runtime failures. Always verify configuration values character-by-character.

---

### Case 4 — `&&` Operator in PowerShell (Bash Syntax on Windows)

**What AI produced:**
```bash
git pull --rebase origin main && git push origin main
```

**How it was caught:**
Running in PowerShell produced:
```
The token '&&' is not a valid statement separator in this version.
```
PowerShell does not support `&&` for command chaining — that is a Bash/Unix operator. PowerShell uses `;` or separate commands.

**What was changed:**
```powershell
# Wrong (Bash syntax)
git pull --rebase origin main && git push origin main

# Correct (PowerShell — run separately)
git pull --rebase origin main
git push origin main
```

**Lesson:** AI defaults to Bash/Unix syntax even on Windows. Always verify shell-specific syntax when on PowerShell, especially for: command chaining (`&&` → `;`), env vars (`$VAR` → `$env:VAR`), and path separators.

---

## 7. Subsystem Architecture Notes

### Greedy Debt-Simplification Algorithm
All group balances are computed dynamically on-the-fly. For each group, the system:
1. Sums all `ExpenseSplit.amount` per user (what each person owes)
2. Subtracts `Expense.amount` for expenses the user paid (what they're owed)
3. Runs a greedy min/max pointer algorithm to minimize the number of transactions needed to settle the group
4. Returns a list of `{from, to, amount}` settlement suggestions

### Reciprocal Friendships
When User A adds User B, two `Friendship` rows are created (`A→B` and `B→A`) in a single transaction. Removing a friend deletes both rows. This design enables simple `GET` filtering without complex JOIN logic.

### Event-Driven Activity Logging
Activity log entries are created inline whenever core state changes:
- `expense_created`, `expense_updated`, `expense_deleted`
- `settlement_made`
- `member_added`, `member_removed`
- `chat_message`

Users see only activities they triggered or that belong to their groups.

### Known Limitations
- **Balance performance**: Dynamic recalculation across many groups/transactions can add latency at scale. Production would require caching or pre-aggregated balance tables.
- **Email invites**: No SMTP backend is integrated. Friend invitations are stored in the database as audit records only.
- **WebSocket channel layer**: Uses in-memory channel layer (single-process only). Production upgrade requires Redis.
- **File storage**: Avatars stored as Base64 in PostgreSQL (works on Render's ephemeral filesystem). Production would migrate to S3/Cloudflare R2.

---

## 8. Overall Assessment

AI assistance dramatically accelerated development — the full-stack application (backend + frontend + deployment) was built in a fraction of the time it would take manually. However, AI required human oversight at every stage:

- Generated configuration values had to be verified against actual project structure
- Platform-specific commands (PowerShell vs Bash) needed correction
- Dependency lists needed auditing to remove development-environment noise
- Module names in deployment configs needed to match actual Django package names

**Pattern across all errors:** AI generates plausible-looking output that is contextually incorrect — the code structure is right but the specific values (module names, platform syntax, OS-specific packages) are wrong. Systematic verification against the actual codebase and deployment logs caught all issues before they became permanent problems.
