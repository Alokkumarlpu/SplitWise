# SplitWise Clone

> A fully functional expense-splitting web app inspired by Splitwise — built with React (Vite) + Django REST Framework + Django Channels + PostgreSQL.

**Live Demo:**
- 🌐 **Frontend:** [split-wise-pink-nine.vercel.app](https://split-wise-pink-nine.vercel.app)
- ⚙️ **Backend API:** [splitwise-6dpv.onrender.com](https://splitwise-6dpv.onrender.com)

---

## 🤖 Built with AI Assistance

This project was built with the help of **[Antigravity](https://antigravity.dev)** — an AI coding assistant powered by **Google DeepMind's Gemini** models.

AI was used throughout the development process for:
- Architecting the Django REST Framework backend (models, views, serializers, JWT auth)
- Designing the React frontend component structure and routing
- Setting up Django Channels + WebSocket consumers for real-time notifications
- Writing Vite configuration and Tailwind CSS styling
- Configuring deployment pipelines (Render + Vercel + Neon PostgreSQL)
- Debugging CORS, JWT token refresh, and deployment errors

---

## ✨ Features

- **User Authentication** — Register, login, JWT-based session with auto token refresh
- **Groups** — Create and manage expense-splitting groups
- **Expenses** — Add, split, and track shared expenses within groups
- **Friends** — Add friends and track personal balances
- **Settle Up** — Record settlement payments between users
- **Real-time Notifications** — WebSocket-powered live notifications via Django Channels
- **Activity Feed** — Full history of all transactions and settlements
- **Calculators** — Rent, travel, insurance, furniture, and guest cost calculators
- **Settings** — Profile management, notification preferences, privacy settings
- **Responsive UI** — Works on desktop and mobile

---

## 🗂 Project Structure

```
SplitWise/
├── backend/                    # Django backend
│   ├── splitwise_backend/      # Django project settings, ASGI/WSGI, URLs
│   ├── splitwise_api/          # Core app: models, views, serializers, consumers
│   ├── friends/                # Friends app
│   ├── support/                # Support tickets app
│   ├── requirements.txt        # Python dependencies
│   └── manage.py
├── frontend/                   # React (Vite) frontend
│   ├── src/
│   │   ├── components/         # Reusable UI components
│   │   ├── pages/              # Route-level page components
│   │   ├── api.js              # Axios client with JWT interceptors
│   │   └── AuthContext.jsx     # Global auth state
│   ├── vercel.json             # Vercel build + SPA routing config
│   └── package.json
├── render.yaml                 # Render deployment config (backend)
└── vercel.json                 # Root Vercel config
```

---

## ⚙️ Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, Vite 8, Tailwind CSS 4, React Router 7 |
| Backend | Django 6, Django REST Framework, Django Channels 4 |
| Auth | JWT (djangorestframework-simplejwt) |
| Database | PostgreSQL (Neon serverless) |
| WebSockets | Daphne + ASGI + Django Channels |
| Frontend Deploy | Vercel |
| Backend Deploy | Render |

---

## 🚀 Local Development Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- PostgreSQL (or use SQLite for local dev)

### 1. Clone the Repository

```bash
git clone https://github.com/Alokkumarlpu/SplitWise.git
cd SplitWise
```

### 2. Backend Setup

```bash
cd backend

# Create and activate virtual environment
python -m venv venv

# Windows (PowerShell)
.\venv\Scripts\Activate.ps1

# macOS/Linux
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt
```

Create a `backend/.env` file:

```env
SECRET_KEY=your-secret-key-here
DEBUG=True
DATABASE_URL=postgresql://user:password@host/dbname?sslmode=require
ALLOWED_HOSTS=localhost,127.0.0.1
CORS_ALLOWED_ORIGINS=http://localhost:5173
```

Run migrations and start the server:

```bash
python manage.py makemigrations
python manage.py migrate
python manage.py runserver
```

> Backend runs at `http://127.0.0.1:8000`

### 3. Frontend Setup

```bash
cd frontend
npm install
```

Create a `frontend/.env` file:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Start the dev server:

```bash
npm run dev
```

> Frontend runs at `http://localhost:5173`

---

## ☁️ Cloud Deployment

### Database — Neon PostgreSQL

1. Go to [neon.tech](https://neon.tech) and create a free project.
2. Copy the connection string (`postgresql://user:password@host/dbname?sslmode=require`).
3. Set it as `DATABASE_URL` in both Render and your local `.env`.

### Backend — Render

1. Log in to [render.com](https://render.com) and create a **Web Service**.
2. Connect your GitHub repository.
3. Configure:
   - **Root Directory:** `backend`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `gunicorn splitwise_backend.wsgi --bind 0.0.0.0:$PORT --workers 2`
4. Add environment variables:
   ```
   DATABASE_URL=<your Neon connection string>
   SECRET_KEY=<your Django secret key>
   DEBUG=False
   ALLOWED_HOSTS=.onrender.com
   CORS_ALLOWED_ORIGINS=https://your-vercel-url.vercel.app
   ```

### Frontend — Vercel

1. Log in to [vercel.com](https://vercel.com) and import your GitHub repository.
2. Configure:
   - **Framework Preset:** `Vite`
   - **Root Directory:** `frontend`
   - **Build Command:** `npm run build`
   - **Output Directory:** `dist`
3. Add environment variable:
   ```
   VITE_API_URL=https://your-render-backend-url.onrender.com
   ```
4. Click **Deploy**.

> The `vercel.json` rewrite rules automatically handle client-side SPA routing.

---

## 🔑 Environment Variables Reference

### Backend (`backend/.env`)

| Variable | Description | Example |
|---|---|---|
| `SECRET_KEY` | Django secret key | `django-insecure-...` |
| `DEBUG` | Debug mode | `True` / `False` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `ALLOWED_HOSTS` | Comma-separated allowed hosts | `.onrender.com,localhost` |
| `CORS_ALLOWED_ORIGINS` | Frontend origin for CORS | `https://your-app.vercel.app` |

### Frontend (`frontend/.env`)

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `https://splitwise-6dpv.onrender.com` |

---

## 📄 License

MIT License — feel free to use this project for learning, portfolios, or as a starting point for your own apps.