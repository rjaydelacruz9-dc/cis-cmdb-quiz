# CIS – CMDB Data Foundation Practice Quiz

A single-file, self-contained interactive practice quiz for the ServiceNow
**CIS – CMDB Data Foundation (CMDB & CSDM)** exam.

- **186 questions** — 129 single-answer, 43 select-all-that-apply, 14 drag-and-drop matching.
- Immediate right/wrong feedback with the correct answer shown.
- Tracks missed questions and offers a **Review wrong answers** / **Retry** mode.
- Filter by category, choose question count, shuffle order.
- Login gate: sign in with an emailed one-time code, or a local admin/password.

## Run locally
Open `index.html` in any browser. The quiz itself needs no build step or server.
The email one-time-code login does need the serverless functions below (deployed on Vercel) —
opening the file locally, only the **Admin** login tab will work.

## Login
Two ways in, both gated behind `index.html`'s login screen:
- **Email code** — enter an email, get a 6-digit code sent via [Resend](https://resend.com),
  enter it to sign in. The code is never sent to the browser directly: `api/send-code.js`
  emails it and returns a signed, expiring token (no code inside); `api/verify-code.js`
  checks a submitted code against that token's signature. Session is just a `localStorage`
  flag good for 7 days — there's no real backend session, so treat this as a casual gate,
  not real security.
  - **First-time approval required.** A brand-new email doesn't get a code right away —
    it's added to a pending list and you (the admin) get an email with an "Approve" link.
    Once approved, that email can request codes freely from then on.
  - You can also pre-approve emails directly from the app: sign in via the **Admin** tab,
    click **🛡 Manage access** in the header, and add an email there — no request needed.
- **Admin** — hardcoded `admin` / `rjdc123`, checked client-side. Anyone who views the page
  source can find it; fine for a low-stakes personal quiz, not meant to protect anything sensitive.

### Required Vercel environment variables
Set these in the Vercel project (Settings → Environment Variables), then redeploy:
- `RESEND_API_KEY` — API key from a free [Resend](https://resend.com) account.
- `OTP_SECRET` — any long random string (e.g. `openssl rand -hex 32`), used to sign codes
  and approval links.
- `ADMIN_EMAIL` — where "new access request" approval-link emails get sent (your inbox).
- `KV_REST_API_URL` / `KV_REST_API_TOKEN` — from a Vercel KV (Upstash Redis) store, used to
  persist the approved/pending email lists. In the Vercel dashboard: Storage → Create Database
  → KV → connect it to this project; these two vars get added automatically.
- `OTP_FROM_EMAIL` (optional) — sender address; defaults to `onboarding@resend.dev`, which
  Resend only allows sending to your own account email until you verify a domain.
- `ADMIN_USERNAME` / `ADMIN_PASSWORD` (optional) — override the defaults (`admin` / `rjdc123`)
  used to authorize the **Manage access** panel's API calls (`api/admin-action.js`). The
  quiz-unlock **Admin** login tab itself is unaffected — that check stays client-side.

## Deploy (Vercel)
This repo is a static site with serverless functions under `api/` (`lib/` holds shared
helpers, not routes) — Vercel serves `index.html` at the root and auto-detects `api/*.js`
as Node functions, no config needed. Connect the repo in Vercel and every push to `main`
redeploys.

If you want to reach the site from your phone or share it, make sure **Deployment
Protection** is off for Production in the Vercel project (Settings → Deployment Protection)
— otherwise Vercel's own login wall shows up in front of this app's login screen. With the
login gate above already controlling access, there's no need for Vercel's extra layer.

## Updating questions
All questions are embedded as a JSON array in the `<script>` block of `index.html`
(the `const QUESTIONS = [...]` line). Edit there, commit, and push.

## Notes on flagged answers
Three questions carry an in-app ⚠ note where the source answer keys were
inconsistent or conflict with ServiceNow documentation:
- Application-to-server relationship (`Runs::Runs On` vs `Runs on::Runs`)
- "Purpose of CMDB Data Manager"
- "Policy types created within CMDB Data Manager"
