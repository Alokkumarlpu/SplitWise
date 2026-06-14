# Splitwise Clone (MVP)

A simplified, fully functioning Splitwise clone built in 3 days using React (Vite) + Tailwind CSS on the frontend, and Django + Django REST Framework + Django Channels + PostgreSQL on the backend.

---

## Folder Structure
* `/backend` - Django REST Framework backend with Django Channels WebSocket integration.
* `/frontend` - Vite-powered React application with Tailwind CSS styling and React Router.

---

## Local Development Setup

### 1. Backend Setup
1. Navigate to the backend directory:
   ```bash
   cd backend
   ```
2. Activate the virtual environment:
   * **Windows (PowerShell)**:
     ```powershell
     .\venv\Scripts\Activate.ps1
     ```
   * **macOS/Linux**:
     ```bash
     source venv/bin/activate
     ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Perform database migrations (defaults to local SQLite `db.sqlite3`):
   ```bash
   python manage.py makemigrations splitwise_api
   python manage.py migrate
   ```
5. Run the targeted backend test suite:
   ```bash
   python manage.py test splitwise_api
   ```
6. Start the local ASGI development server (Daphne handles both HTTP & WebSockets):
   ```bash
   python manage.py runserver
   ```
   *Backend runs on `http://127.0.0.1:8000`*

### 2. Frontend Setup
1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```
2. Install Node packages:
   ```bash
   npm install
   ```
3. Start the Vite React development server:
   ```bash
   npm run dev
   ```
   *Frontend dev server runs on `http://localhost:5173`*
4. Build the production package locally:
   ```bash
   npm run build
   ```

---

## Cloud Deployment Instructions

### 1. Neon PostgreSQL Database
1. Go to [Neon.tech](https://neon.tech/) and create a free PostgreSQL project.
2. Copy the database connection URL (looks like: `postgresql://user:password@host/dbname?sslmode=require`).

### 2. Render Deployment (Backend API)
1. Log in to [Render](https://render.com/).
2. Create a **New Web Service** and link it to your GitHub repository.
3. Configure the service parameters:
   * **Environment**: `Python`
   * **Build Command**:
     ```bash
     pip install -r backend/requirements.txt && python backend/manage.py migrate && python backend/manage.py collectstatic --no-input
     ```
   * **Start Command** (Daphne runs ASGI traffic for Channels chat):
     ```bash
     daphne -b 0.0.0.0 -p $PORT splitwise_backend.asgi:application
     ```
4. Under **Advanced**, add environment variables:
   * `DATABASE_URL`: *Your Neon PostgreSQL connection string*
   * `SECRET_KEY`: *Choose a secure hash key*
   * `DEBUG`: `False`

### 3. Vercel Deployment (Frontend React App)
1. Log in to [Vercel](https://vercel.com/).
2. Select **Add New Project** and connect it to your GitHub repository.
3. Configure settings:
   * **Framework Preset**: `Vite`
   * **Root Directory**: `frontend`
4. Add environment variables under project settings:
   * `VITE_API_URL`: *Your deployed Render backend URL (e.g. `https://splitwise-api.onrender.com`)*
5. Click **Deploy**. The `vercel.json` rewrite rules will automatically configure client-side SPA routing.