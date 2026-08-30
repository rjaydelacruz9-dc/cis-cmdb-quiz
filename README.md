# CIS – CMDB Data Foundation Practice Quiz

A single-file, self-contained interactive practice quiz for the ServiceNow
**CIS – CMDB Data Foundation (CMDB & CSDM)** exam.

- **186 questions** — 129 single-answer, 43 select-all-that-apply, 14 drag-and-drop matching.
- Immediate right/wrong feedback with the correct answer shown.
- Tracks missed questions and offers a **Review wrong answers** / **Retry** mode.
- Filter by category, choose question count, shuffle order.
- Login gate: sign in with an emailed one-time code, or a local admin/password.
- Progress tracking (Supabase-backed): per-category mastery badges, and a "resume where you
  left off" prompt if you close the app mid-quiz.
- Sound effects on check (mutable via the header toggle), and an on-demand **AI insights**
  button that explains the correct answer using Claude.

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

## Progress tracking & resume (Supabase)
Whoever you're signed in as (the email you verified, or `admin`) is your "identity" for
progress purposes — it's what ties saved data to you.

- **Category badges.** After you finish a category in one pass, `api/data.js` records your
  correct/attempted/total for it. Score 100% in a single pass and the category gets a green
  ✓ ("mastered") on the start screen; anything less shows an amber ● ("incomplete"). A
  category you haven't touched shows no badge at all.
- **Resume.** While a quiz is in progress, your position (which questions, current index,
  scores so far, flags) autosaves after every answer. Come back later — same device or a
  different one, as long as you sign in with the same identity — and the start screen offers
  **Resume →** at the exact question, or **Start fresh instead** to discard it.
- Ending a quiz early via **⏹ End & score** still records whatever you'd answered so far as
  that category's latest attempt, and clears the resumable session (you've deliberately
  stopped, not walked away mid-question).

### Setup
1. Create a free project at [supabase.com](https://supabase.com).
2. In its SQL Editor, run everything in [`supabase.sql`](supabase.sql) — creates
   `quiz_progress` and `quiz_sessions` with Row Level Security left on (the app only ever
   talks to Supabase via the service_role key from serverless functions, which bypasses RLS;
   no anon/client-side Supabase access is used).
3. In the Supabase dashboard: **Settings → API** — copy the **Project URL** and the
   **service_role** key (not the anon/public one).
4. Add to Vercel (Settings → Environment Variables), then redeploy:
   - `SUPABASE_URL` — the Project URL.
   - `SUPABASE_SERVICE_ROLE_KEY` — the service_role key. Keep this secret; it has full
     read/write access to your Supabase project and must never reach client-side code.

Without these two variables, the app still works exactly as before — badges just won't
appear and there's nothing to resume, since `api/data.js` calls fail silently (caught and
logged to the console, not shown to you) rather than blocking quiz-taking.

## Sound effects & AI insights
Sound effects (a short chime on correct, a lower buzz on wrong) play only when "Show
right/wrong immediately" is on, and only in that instant-feedback moment — same gate as the
right/wrong feedback itself, so a muted-feedback run stays silent too. Toggle them off entirely
with **🔊 Sound** in the header; the choice persists in `localStorage`.

After checking an answer, an **✨ AI insights on this answer** button appears alongside the
feedback. It sends the question, options, correct answer, and what you picked to
`api/explain.js`, which asks Claude for a short (3–5 sentence) explanation of why the correct
answer is right and why the others aren't — useful for the "I got it right/wrong but don't
know why" moments.

### Required Vercel environment variable
- `ANTHROPIC_API_KEY` — a Claude API key from [console.anthropic.com](https://console.anthropic.com).
  Without it, the insights button shows an error when clicked but nothing else in the app is
  affected.
- `ANTHROPIC_MODEL` (optional) — defaults to `claude-sonnet-5`.

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

## Answer corrections
Eight questions were corrected after a full review of the bank against ServiceNow
CSDM/CMDB behaviour. In most cases the original answer was disproved by another
question in this same quiz — both could not be right:

| Q | Was | Now | Why |
|---|---|---|---|
| 32 | "uses automation to remediate" | "provides playbooks to assist" | Q40/Q41/Q42 all mark automated remediation as wrong |
| 58 | De-duplication + Archive | Archive + Retire | Q53 lists the five policy types; de-duplication isn't one |
| 67 | enforces relationship rules | automates archival/deletion | Q48/Q57/Q59/Q61/Q68 all describe lifecycle, not relationships |
| 96 | ServiceNow can't update others | Altiris can update SCCM records | lower priority number = higher authority in IRE |
| 108 | Class Switch | Class Upgrade | Q109 calls the same parent→descendant move an upgrade |
| 120 | existing CI reconciled | a new CI is created | Version is a match criterion, so a change breaks the match |
| 142 | Technology Management Service | …Service **Offering** | Q143/Q144/Q145 all point to the Offering |
| 176 | "non-CMDB classes" → `…multisource_cmdb_ci_enabled` | → `…multisource_non_cmdb_ci_enabled` | Q89 lists both properties; name and description contradicted |

For Q176 the previously-paired property was kept as a dropdown distractor, so the wrong
choice is still selectable.

### Still flagged
One question keeps its in-app ⚠ note, left as-is pending a call on the source:
- **Application-to-server relationship** (`Runs::Runs On` vs `Runs on::Runs`). ServiceNow
  names relationship types `parent_descriptor::child_descriptor`, which argues for
  `Runs on::Runs` ("Application runs on Server"), but two of the three source screenshots
  mark the other. Unchanged until verified.
