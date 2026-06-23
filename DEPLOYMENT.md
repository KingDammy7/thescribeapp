# Deploying The Scribe (Netlify + Render)

Backend (Express + Claude API) goes on Render. Frontend (React + Vite) goes on Netlify and points at the Render URL. No code rewrite needed — both are deployed as-is.

## 1. Push to GitHub

Render and Netlify both deploy from a Git repo. If this project isn't on GitHub yet:

```bash
cd ~/Developer/Projects/the-scribe-app
git init
git add .
git commit -m "Initial commit"
```

Create a repo on GitHub, then:

```bash
git remote add origin <your-repo-url>
git branch -M main
git push -u origin main
```

Make sure `backend/.env` and `backend/data/` are in `.gitignore` (check this before pushing — don't commit your API key or local data).

## 2. Deploy the backend to Render

1. Go to render.com, sign in, click **New > Web Service**, and connect your GitHub repo.
2. Configure:
   - **Root directory:** `backend`
   - **Build command:** `npm install`
   - **Start command:** `npm start`
   - **Instance type:** Free
3. Add these environment variables in Render's dashboard (Settings > Environment):

| Key | Value |
|---|---|
| `ANTHROPIC_API_KEY` | your Anthropic API key |
| `JWT_SECRET` | a long random string (don't leave this unset — the code falls back to an insecure default if you do) |
| `CLAUDE_MODEL` | `claude-opus-4-5` (or leave unset to use this default) |
| `FRONTEND_URL` | your Netlify URL once you have it, e.g. `https://the-scribe.netlify.app` (you can come back and set this after step 3) |

4. Deploy. Render gives you a URL like `https://the-scribe-backend.onrender.com`. Confirm it's live by visiting `https://the-scribe-backend.onrender.com/api/health`.

**Known limitation:** this app stores data as JSON files on local disk (`backend/data/`), not in a database. Render's free-tier disk is wiped on every new deploy, and the free instance also spins down after 15 minutes of inactivity (the first request after that takes ~30-50s to wake up). This is fine for a demo/submission, but don't rely on it for real user data without first migrating to a proper database (e.g. Render's free Postgres, or MongoDB Atlas) — happy to help with that migration separately if you need it for a real launch.

## 3. Deploy the frontend to Netlify

1. Go to netlify.com, sign in, click **Add new site > Import an existing project**, and connect the same GitHub repo. A `netlify.toml` is already in the repo root, so Netlify auto-detects:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/dist`
2. Before deploying, add an environment variable: Site configuration > Environment variables:
   - **Key:** `VITE_API_URL`
   - **Value:** your Render backend URL + `/api`, e.g. `https://the-scribe-backend.onrender.com/api`
3. Deploy. Netlify gives you a URL like `https://the-scribe.netlify.app` — this is the link you submit.

## 4. Connect the two

Go back to Render, set `FRONTEND_URL` to your live Netlify URL (no trailing slash), and let it redeploy. This is what allows the backend's CORS policy to accept requests from your frontend.

## 5. Verify

Open the Netlify URL, sign up for a new account, run through onboarding, and generate a chapter. If you see CORS errors in the browser console, double check `FRONTEND_URL` on Render matches the Netlify URL exactly (https, no trailing slash).

## Quick reference

| Piece | Host | Env vars needed |
|---|---|---|
| Frontend (`frontend/`) | Netlify | `VITE_API_URL` |
| Backend (`backend/`) | Render | `ANTHROPIC_API_KEY`, `JWT_SECRET`, `CLAUDE_MODEL` (optional), `FRONTEND_URL` |
