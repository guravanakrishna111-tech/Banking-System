# Deploy with Render and Vercel

This project is an educational banking simulation. Deploy it with synthetic data only; it is not suitable for real banking, payments, or customer information.

## What the deployment creates

- A Django API and PostgreSQL database on Render, defined in `render.yaml`.
- A React/Vite static site on Vercel, with SPA routing configured in `vercel.json`.
- Production secrets and database credentials supplied through the hosting providers, not committed to source.

The Blueprint uses Render's free plans for a low-friction demo. Free services can sleep when idle, and free PostgreSQL has a limited lifetime. For a persistent public demo, upgrade the database to a paid plan and configure backups before relying on its data.

## 1. Push the project to GitHub

Create a GitHub repository and push this project. Keep it private if it contains any real personal data. Do not commit `.env` files, credentials, or a populated local database.

## 2. Deploy the backend and database on Render

1. In Render, choose **New → Blueprint** and connect the GitHub repository containing `render.yaml`.
2. Review and apply the `banking-api` web service and `banking-db` PostgreSQL database.
3. Wait for the service to finish its first deploy. The start command applies Django migrations before starting Gunicorn.
4. Copy the backend URL, for example `https://banking-api.onrender.com`.

Render generates `SECRET_KEY` and supplies `DATABASE_URL` from the PostgreSQL service. `DEBUG` is disabled. The settings add Render's assigned hostname to Django's allowed hosts automatically.

## 3. Deploy the frontend on Vercel

1. In Vercel, choose **Add New → Project** and import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Use the Vite defaults: build command `npm run build`, output directory `dist`.
4. Add the production environment variable:

   | Name | Value |
   | --- | --- |
   | `VITE_API_URL` | `https://YOUR-RENDER-SERVICE.onrender.com/api` |

5. Deploy and copy the Vercel production domain, for example `https://your-app.vercel.app`.

## 4. Allow the Vercel site to call the API

In Render, open the `banking-api` service's environment settings and set `CORS_ALLOWED_ORIGINS` to the exact Vercel origin, including `https://` and no trailing slash. Example:

```text
https://your-app.vercel.app
```

For a custom frontend domain, include both domains separated by a comma:

```text
https://your-app.vercel.app,https://bank.example.com
```

Save the environment change and redeploy the Render service. If you use Vercel preview deployments, add their specific origins only when needed; avoid wildcard CORS origins.

## 5. Create an administrator

After the first successful Render deploy, open the service's Shell and run:

```bash
python manage.py createsuperuser
```

Use a unique password. Do not run `backend/seed_data.py` on a public deployment: it creates publicly documented demo accounts and resets their passwords to known values.

## Configuration notes

- Local development still uses SQLite by default. On Render, `DATABASE_URL` selects PostgreSQL.
- `DEBUG` defaults to `True` only for local development. Render sets it to `False`.
- `CORS_ALLOWED_ORIGINS` defaults to the local Vite origin during development. Set it to the exact deployed frontend origin in Render.
- `ALLOWED_HOSTS` can be set explicitly if you use a custom backend domain; Render's assigned hostname is added automatically.
- Vercel rebuilds the frontend when `VITE_API_URL` changes. Render redeploys the backend when its environment settings change.
