# AI_USAGE.md — AI Tools, Prompts & Corrections

## AI Tools Used

| Tool | Role |
|---|---|
| **Antigravity (Google DeepMind / Gemini)** | Primary coding assistant — architecture, code generation, debugging, deployment |
| **GitHub Copilot** | Inline code completion during manual editing |

---

## How AI Was Used

Antigravity (an agentic AI coding assistant) was used throughout the entire development lifecycle:

- **Backend architecture** — Designing Django models, serializers, views, and URL routing
- **WebSocket consumers** — Writing Django Channels consumer classes for real-time notifications
- **Frontend components** — Generating React component structure, state management, and routing
- **JWT auth flow** — Implementing access/refresh token logic including the Axios interceptor for auto-refresh
- **Database migration** — Writing `migrate_data.py` to safely transfer SQLite data to Neon PostgreSQL
- **Deployment debugging** — Diagnosing and fixing Render and Vercel deployment failures iteratively
- **Documentation** — Generating SCOPE.md, DECISIONS.md, AI_USAGE.md, and README.md

---

## Key Prompts Used

### 1. Initial Architecture Prompt
> *"Build a Splitwise clone. Backend: Django REST Framework with JWT auth, Django Channels for WebSockets, PostgreSQL. Frontend: React with Vite and Tailwind. Include groups, expenses with equal/unequal/percentage/shares split types, settlements, friends, real-time notifications, and user settings."*

### 2. Django Channels Setup
> *"Set up Django Channels in this Django project. Add a NotificationConsumer WebSocket consumer that sends notifications to authenticated users when an expense is added to their group. Use in-memory channel layer."*

### 3. JWT Auto-Refresh Interceptor
> *"Write an Axios interceptor that automatically refreshes the JWT access token when a 401 response is received, retries the original request with the new token, and redirects to /login if the refresh token is also expired."*

### 4. Database Migration Script
> *"Write a Python script that: (1) temporarily hides the .env file to force Django to use SQLite, (2) dumps all data with --natural-foreign --natural-primary, (3) restores the .env, (4) disconnects Django post_save signals to prevent duplicate profile creation, then (5) loads the fixture into the PostgreSQL database."*

### 5. Deployment Fix
> *"The Render deployment is failing with ModuleNotFoundError: No module named 'your_application'. The correct Django WSGI module is splitwise_backend.wsgi. How do I fix the Render start command and render.yaml?"*

---

## Three Cases Where AI Produced Incorrect Output

---

### Case 1 — AI Generated Wrong Gunicorn Module Name

**What AI produced:**
When generating the `render.yaml` and Render dashboard instructions, the AI suggested:
```bash
gunicorn your_application.wsgi
```
This is Render's literal **placeholder text** copied verbatim into the configuration file rather than the actual Django project module name.

**How it was caught:**
The Render deployment failed repeatedly with:
```
ModuleNotFoundError: No module named 'your_application'
```
The error was caught by examining the Render deployment logs, which showed the exact command being run.

**What was changed:**
The start command was corrected to:
```bash
gunicorn splitwise_backend.wsgi --bind 0.0.0.0:$PORT --workers 2
```
where `splitwise_backend` is the actual Django project package name (the folder containing `settings.py`, `wsgi.py`, and `asgi.py`).

**Lesson:** AI sometimes copies placeholder text from documentation or templates without substituting the project-specific values. Always verify module names against your actual directory structure.

---

### Case 2 — AI Included Windows-Only Packages in `requirements.txt`

**What AI produced:**
The AI generated a `requirements.txt` that included:
```
pypiwin32==223
pywin32==311
pyttsx3==2.99
comtypes==1.4.15
audioop-lts==0.2.2
```
These are Windows-only packages (COM automation, text-to-speech, Windows audio API) that were pulled from the development machine's global Python environment.

**How it was caught:**
The Render deployment (Linux) failed during the pip install phase with:
```
ERROR: Could not find a version that satisfies the requirement pypiwin32>=223
ERROR: No matching distribution found for pywin32>=311
Failed to build mysqlclient==2.2.8
```
The error was identified by reading the Render build logs screenshot.

**What was changed:**
All Windows-only packages were removed. The root-level `requirements.txt` (which was a full global env dump) was deleted entirely. Only `backend/requirements.txt` (containing only the packages the Django app actually needs: `daphne`, `channels`, `djangorestframework`, `gunicorn`, `psycopg2-binary`, etc.) is used for deployment.

**Lesson:** AI may export all installed packages from the development environment rather than only the project's dependencies. Always audit `requirements.txt` and use `pip freeze` inside a clean virtual environment, not the global Python installation.

---

### Case 3 — AI Conflated `wsg1` (number 1) with `wsgi` (letter i) in Start Command

**What AI produced:**
In one iteration of the Render start command, the AI generated:
```bash
gunicorn SplitWise.wsg1 --bind 0.0.0.0:$PORT
```
Two errors in one command: `SplitWise` (wrong capitalization — the package is `splitwise_backend`) and `wsg1` (the digit `1` instead of the letter `i`).

**How it was caught:**
The Render dashboard showed the start command visually in its settings panel, and the deployment log showed:
```
ModuleNotFoundError: No module named 'SplitWise'
```
A careful visual comparison of the command in the screenshot against the known module name `splitwise_backend.wsgi` revealed both typos.

**What was changed:**
```bash
# Wrong (AI-generated)
gunicorn SplitWise.wsg1 --bind 0.0.0.0:$PORT

# Correct
gunicorn splitwise_backend.wsgi --bind 0.0.0.0:$PORT --workers 2
```

**Lesson:** AI can make visually subtle typographic errors (1 vs i, uppercase vs lowercase) that are hard to spot in code review but cause catastrophic runtime failures. Always compare AI-generated configuration values character-by-character against your actual project structure.

---

### Case 4 (Bonus) — AI Suggested `&&` in PowerShell

**What AI produced:**
When asked to pull remote changes and push in one command, the AI suggested:
```bash
git pull --rebase origin main && git push origin main
```

**How it was caught:**
Running the command in PowerShell produced:
```
The token '&&' is not a valid statement separator in this version.
```
PowerShell (Windows) does not support the `&&` operator for command chaining (this is a Bash/Unix feature). PowerShell uses `;` for sequential execution or separate commands.

**What was changed:**
Commands were run separately:
```powershell
git pull --rebase origin main
git push origin main
```

**Lesson:** AI defaults to Bash/Unix syntax even when the user's environment is PowerShell on Windows. Always verify shell-specific syntax when on Windows, especially for command chaining, environment variable syntax (`$VAR` vs `$env:VAR`), and path separators.

---

## Overall Assessment

AI assistance dramatically accelerated development — the full-stack application (backend + frontend + deployment) was built in a fraction of the time it would take manually. However, the AI required human oversight at every deployment step:

- Generated configuration values had to be verified against actual project structure
- Platform-specific commands (PowerShell vs Bash) needed correction
- Dependency lists needed auditing to remove development-environment noise
- Module names in deployment configs needed to match actual Django package names

The pattern across all errors: **AI generates plausible-looking output that is contextually incorrect** — the code structure is right but the specific values (module names, platform-specific syntax, OS-specific packages) are wrong. Systematic verification against the actual codebase and deployment logs caught all issues.
