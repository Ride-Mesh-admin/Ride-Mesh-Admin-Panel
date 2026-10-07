# RideMesh Admin

**Operations console for [RideMesh](https://ride-mesh.app)** — monitor users, moderate rides, respond to SOS alerts on a live map, send newsletters, and watch system activity from one place.

**Production URL:** [admin.ride-mesh.app](https://admin.ride-mesh.app)

[![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=flat-square&logo=react&logoColor=black)](https://react.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-Admin%20%2B%20Firestore-FFCA28?style=flat-square&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat-square&logo=vercel)](https://vercel.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)

---

## Overview

RideMesh Admin is a private ops dashboard for the RideMesh rideshare platform. It sits on top of the same Firebase/Firestore project as the mobile app and gives operators a fast way to:

| Area | What you can do |
|------|------------------|
| **Dashboard** | Live metrics, critical safety banner, recent reports, activity snapshot |
| **Users** | Search hosts & riders, filter by role/status, suspend or reactivate accounts |
| **Rides** | Review moderation queue, inspect details, approve or cancel |
| **Safety** | SOS / help signals with Google Maps, notify hosts for emergencies |
| **Newsletter** | Manage subscribers and send campaigns (Resend) |
| **System Logs** | Error/latency-style metrics and a live activity stream |

Access is gated by a single shared admin login (JWT httpOnly cookie). All data access goes through Next.js API routes using the Firebase Admin SDK.

---

## Stack

- **Framework:** Next.js 15 (App Router) · React 19 · TypeScript
- **UI:** Tailwind CSS · Manrope · Lucide + custom icons · light/dark theme
- **Auth:** Email/password → signed JWT session (`jose`) in an httpOnly cookie
- **Data:** Firebase Admin → Cloud Firestore (+ Auth disable/enable for suspend)
- **Maps:** Google Maps JavaScript API (`@react-google-maps/api`)
- **Email:** Resend (optional, for live newsletter delivery)
- **Push (Cloud Functions):** FCM + Expo Push when `notifications` docs are created

```
Browser  →  Next.js (Vercel)  →  Firebase Admin SDK  →  Firestore / Auth
                │
                └─ optional Resend API (newsletter)
```

---

## Quick start (local)

### Prerequisites

- Node.js **20+**
- npm
- A Firebase service account for the RideMesh project (JSON key or env credentials)
- Optional: Google Maps API key, Resend API key

### Install & run

```bash
git clone https://github.com/m-abdullah-swe/Ride-Mesh-Admin.git
cd Ride-Mesh-Admin
npm install
cp .env.example .env.local
# Edit .env.local with your credentials
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Unauthenticated visits redirect to `/login`.

### Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Dev server with Turbopack |
| `npm run build` | Production build |
| `npm run start` | Serve production build |
| `npm run lint` | ESLint |

---

## Environment variables

Copy `.env.example` → `.env.local`. Never commit real secrets.

| Variable | Required | Description |
|----------|----------|-------------|
| `FIREBASE_SERVICE_ACCOUNT_PATH` | Local* | Path to service-account JSON |
| `FIREBASE_PROJECT_ID` | Prod* | Firebase project ID |
| `FIREBASE_CLIENT_EMAIL` | Prod* | Service account email |
| `FIREBASE_PRIVATE_KEY` | Prod* | Private key (`\n` escaped as a single line) |
| `ADMIN_EMAIL` | **Yes (prod)** | Admin login email |
| `ADMIN_PASSWORD` | **Yes (prod)** | Admin login password |
| `ADMIN_SESSION_SECRET` | **Yes (prod)** | Long random string for JWT signing |
| `ADMIN_APP_URL` | Recommended | e.g. `https://admin.ride-mesh.app` (reset email links) |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Recommended | Safety Operations map |
| `RESEND_API_KEY` | Optional | Live newsletter sending |
| `RESEND_FROM_EMAIL` | Optional | e.g. `RideMesh <support@your-domain.com>` |
| `RESEND_REPLY_TO` | Optional | Reply-to address |
| `NEWSLETTER_SITE_URL` | Optional | Base URL for unsubscribe links (default `https://ride-mesh.app`) |

\* Locally you can use a JSON file path. On Vercel, use the three `FIREBASE_*` fields instead.

Generate a session secret:

```bash
openssl rand -base64 48
```

---

## Project structure

```
app/
  (admin)/          # Authenticated pages (dashboard, users, rides, …)
  (auth)/login/     # Admin sign-in
  api/admin/        # Protected API routes
  api/system-logs/  # Metrics + activity stream
components/         # UI by domain
lib/
  server/           # Firebase Admin, session, credentials, backend queries
  types/            # Shared domain types
  constants.ts      # Nav + status configs
functions/          # Cloud Functions (push notifications)
middleware.ts       # Session gate for pages + APIs
```

### Main routes

| Path | Purpose |
|------|---------|
| `/login` | Admin sign-in |
| `/dashboard` | Ops overview |
| `/users` | User management |
| `/rides` | Ride moderation |
| `/safety-alerts` | SOS / help map & actions |
| `/newsletter` | Campaigns & subscribers |
| `/system-logs` | Live metrics & logs |

---

## Auth model

1. Admin credentials live in Firestore `adminAccounts/primary` (email + scrypt `passwordHash`).
2. Seed defaults / env: `admin@ride-mesh.app` (forwards to ridemeshadmin@gmail.com) — used only to create/migrate that doc.
3. `POST /api/admin/login` verifies the Firestore hash, then issues a **30-day** JWT in the `ridemesh_admin_session` httpOnly cookie.
4. `/account` updates profile/password in Firestore; forgot-password uses Resend + reset token on the same doc.

Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `ADMIN_SESSION_SECRET` on Vercel Production so the seed matches your deploy.

---

## Deploy to Vercel → `admin.ride-mesh.app`

The app is a standard Next.js project. Vercel detects the framework automatically — no special `vercel.json` is required.

### 1. Push the repo

Ensure the project is on GitHub (this repo: `m-abdullah-swe/Ride-Mesh-Admin`).

### 2. Import on Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import **Ride-Mesh-Admin**
3. Framework Preset: **Next.js** (auto)
4. Root Directory: `.` (default)
5. Do **not** deploy yet — add environment variables first (or add them and redeploy)

### 3. Environment variables (Production)

In **Project → Settings → Environment Variables**, add for **Production** (and Preview if you want):

| Name | Notes |
|------|--------|
| `FIREBASE_PROJECT_ID` | e.g. `ride-mesh` |
| `FIREBASE_CLIENT_EMAIL` | From the service account JSON |
| `FIREBASE_PRIVATE_KEY` | Paste the full key; keep `\n` as literal `\n` in one line, or paste multiline if Vercel UI allows |
| `ADMIN_EMAIL` | Production admin email |
| `ADMIN_PASSWORD` | Strong unique password |
| `ADMIN_SESSION_SECRET` | Output of `openssl rand -base64 48` |
| `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` | Restrict by HTTP referrer (see below) |
| `RESEND_API_KEY` | Optional |
| `RESEND_FROM_EMAIL` | Optional |
| `RESEND_REPLY_TO` | Optional |
| `NEWSLETTER_SITE_URL` | `https://ride-mesh.app` |

Then **Deploy** (or Redeploy) the production deployment.

### 4. Custom domain: `admin.ride-mesh.app`

1. In Vercel: **Project → Settings → Domains**
2. Add `admin.ride-mesh.app`
3. Vercel will show the exact DNS record to create. For a subdomain, that is almost always a **CNAME**. Use the **Value** shown in the Vercel Domains UI for this project (it may look like `cname.vercel-dns.com` or a project-specific host such as `xxxx.vercel-dns-0xx.com`).

| Type | Name | Value |
|------|------|--------|
| **CNAME** | `admin` | *(copy from Vercel Domains panel)* |

4. At your DNS host for `ride-mesh.app` (Cloudflare, Namecheap, Google Domains, Vercel DNS, etc.), create that CNAME. If DNS for `ride-mesh.app` is already managed in Vercel, you can add the record under that domain’s DNS settings instead.
5. Wait for DNS propagation. Vercel issues HTTPS automatically via Let’s Encrypt.

If the apex `ride-mesh.app` is already on Vercel under another project, you can still attach the subdomain here — use Vercel’s Domain settings on **this** project only for `admin.ride-mesh.app`.

### 5. Google Maps referrers

In [Google Cloud Console → Credentials](https://console.cloud.google.com/apis/credentials), restrict the Maps key HTTP referrers to include:

```
https://admin.ride-mesh.app/*
http://localhost:3000/*
```

### 6. Verify

1. Open `https://admin.ride-mesh.app` → should redirect to `/login`
2. Sign in with production `ADMIN_EMAIL` / `ADMIN_PASSWORD`
3. Confirm Dashboard loads live data
4. Open Safety → map should render if the Maps key is set
5. Optional: hit health via an authenticated session (or check Vercel function logs)

### CLI alternative

```bash
npm i -g vercel
vercel login
vercel link
vercel env pull   # optional local sync
vercel --prod
```

Then add the domain in the Vercel dashboard (or `vercel domains add admin.ride-mesh.app`).

---

## Cloud Functions (optional)

Push notifications live in `functions/` (not deployed by Vercel). Deploy separately when needed:

```bash
cd functions
npm install
npx -y firebase-tools@latest deploy --only functions
```

Firebase App Hosting config (`apphosting.yaml`, `firebase.json`) remains available if you prefer Firebase hosting later; production for the console is intended on **Vercel** at `admin.ride-mesh.app`.

---

## Security checklist

- [ ] Set `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and a strong `ADMIN_SESSION_SECRET` in Vercel Production
- [ ] Never commit `.env.local` or service-account JSON
- [ ] Restrict Google Maps API key by referrer
- [ ] Use a Firebase service account with least privilege suitable for admin ops
- [ ] Keep the admin URL private; treat credentials like production root access
- [ ] Rotate the admin password if it was ever shared or committed

---

## License

Private — RideMesh internal use. All rights reserved.
```
