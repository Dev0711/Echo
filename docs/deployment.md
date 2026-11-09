# Deploying Echo

Echo is a monorepo:

- `frontend/` → Vercel (Next.js)
- `backend/` → Render (Docker / Spring Boot)
- Database → MongoDB Atlas

## 1. MongoDB Atlas

1. Create a free Atlas cluster.
2. Create a database user with read/write access.
3. Allow network access from `0.0.0.0/0` (Render does not provide fixed outbound IPs on the free plan).
4. Copy the connection string and append the database name, for example:

```text
mongodb+srv://<user>:<password>@<cluster>.mongodb.net/echo?retryWrites=true&w=majority
```

## 2. Backend on Render

1. Push this repository to GitHub.
2. In Render, choose **New → Blueprint** and select the repository. Render reads `render.yaml`.
3. Fill in the environment variables marked `sync: false`:
   - `MONGODB_URI` — Atlas connection string
   - `FRONTEND_URL` — the Vercel URL (set after the frontend is deployed)
   - `CORS_ALLOWED_ORIGINS` — the Vercel URL, or `https://*.vercel.app` for preview deployments
   - `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
   - `GEMINI_API_KEY`
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
4. Deploy and confirm `https://<service>.onrender.com/actuator/health` returns `UP`.

## 3. Google OAuth

In Google Cloud Console → APIs & Services → Credentials → OAuth client:

Add the Render callback URL:

```text
https://<service>.onrender.com/login/oauth2/code/google
```

## 4. Frontend on Vercel

1. Import the same GitHub repository.
2. Set **Root Directory** to `frontend`.
3. Add the environment variable:

```text
NEXT_PUBLIC_API_URL=https://<service>.onrender.com/api
```

4. Deploy.
5. Copy the production URL and set it as `FRONTEND_URL` and in `CORS_ALLOWED_ORIGINS` on Render, then redeploy the backend.

## Notes

- Render's free web services spin down after inactivity, so the first request can take 30–60 seconds.
- Never commit `.env`, `.env.properties`, or platform credentials. Set secrets in the Render/Vercel dashboards.
