# Deploying AICTE Compliance Platform to Render

This guide outlines two ways to deploy the **AICTE Compliance & Scrutiny Platform** to [Render.com](https://render.com):
1. **Method 1: Automatic Blueprint (Recommended - 2 Minutes)**
2. **Method 2: Manual Setup via Render Dashboard**

---

## Pre-requisites
- A free [Render.com](https://render.com) account.
- Your GitHub repository: `https://github.com/Dhayananth1511/SIH2026.git` connected to Render.

---

## Method 1: Automatic Blueprint Deployment (Easiest)

Render Blueprint reads [`render.yaml`](./render.yaml) and automatically provisions both the **FastAPI Backend** and the **React Frontend Static Site**, linking environment variables automatically.

1. Log in to [Render Dashboard](https://dashboard.render.com).
2. Click the **"New +"** button in the top navigation and select **"Blueprint"**.
3. Connect your GitHub account and choose repository: **`Dhayananth1511/SIH2026`**.
4. Render will parse [`render.yaml`](./render.yaml) and display:
   - **`aicte-compliance-backend`** (Python Web Service)
   - **`aicte-compliance-frontend`** (Static Site)
5. Click **"Apply"**.
6. Render will build and deploy both services simultaneously. Once finished:
   - Your backend will be at: `https://aicte-compliance-backend.onrender.com`
   - Your frontend will be at: `https://aicte-compliance-frontend.onrender.com`

---

## Method 2: Manual Deployment via Render Dashboard

If you prefer to configure each service individually:

### Step A: Deploy the Backend Web Service

1. On the Render Dashboard, click **"New +"** &rarr; **"Web Service"**.
2. Select your repository `Dhayananth1511/SIH2026`.
3. Configure the following settings:
   - **Name**: `aicte-backend`
   - **Region**: Choose the closest region (e.g., *Singapore* or *Frankfurt*)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`
   - **Plan**: `Free`
4. Expand **"Advanced"** and add **Environment Variables**:
   | Key | Value | Notes |
   |---|---|---|
   | `SECRET_KEY` | `aicte-super-secret-key-2026` | Random secure string |
   | `ACCESS_TOKEN_EXPIRE_MINUTES` | `480` | Token lifetime |
   | `CORS_ORIGINS` | `*` | Or your frontend URL once deployed |
5. Set **Health Check Path** to: `/health`
6. Click **"Create Web Service"**.
7. Wait for the backend build to complete. Note down your backend URL:
   *Example: `https://aicte-backend-xxxx.onrender.com`*

---

### Step B: Deploy the Frontend Static Site

1. On the Render Dashboard, click **"New +"** &rarr; **"Static Site"**.
2. Select your repository `Dhayananth1511/SIH2026`.
3. Configure the following settings:
   - **Name**: `aicte-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
4. Expand **"Advanced"**:
   - Add **Environment Variable**:
     | Key | Value |
     |---|---|
     | `VITE_API_URL` | Your backend URL from Step A (e.g., `https://aicte-backend-xxxx.onrender.com`) |
   - Under **"Redirects / Rewrites"**, click **"Add Rule"**:
     - **Type**: `Rewrite`
     - **Source**: `/*`
     - **Destination**: `/index.html`
5. Click **"Create Static Site"**.
6. Wait for the build to finish. Click your frontend link to open the live web app!

---

## Demo Accounts (Auto-seeded on first run)

Once deployed, the backend automatically initializes and seeds all demo data on initial startup:

| Role | Email | Password |
|---|---|---|
| **Scrutiny / Verification Officer** | `officer@aicte.gov.in` | `admin123` |
| **Institution Applicant** | `institution@aicte.gov.in` | `admin123` |
| **Compliance Officer** | `compliance@aicte.gov.in` | `admin123` |
| **Decision Maker / Chairman** | `chairman@aicte.gov.in` | `admin123` |
| **System Administrator** | `admin@aicte.gov.in` | `admin123` |

---

## Important Render Free-Tier Tips
1. **Cold Start (Spindown)**: Free-tier Render web services spin down after 15 minutes of inactivity. The first request after spindown may take ~30–50 seconds to boot up. The `/health` endpoint is configured so Render can check readiness.
2. **Database Persistence**: The default deployment uses a local SQLite database (`aicte.db`). If you want persistent database storage across cold restarts, you can easily spin up a free Render PostgreSQL database from the dashboard and set `DATABASE_URL` in the backend environment variables.
