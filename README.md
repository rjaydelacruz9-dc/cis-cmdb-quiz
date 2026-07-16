# CIS – CMDB Data Foundation Practice Quiz

A single-file, self-contained interactive practice quiz for the ServiceNow
**CIS – CMDB Data Foundation (CMDB & CSDM)** exam.

- **186 questions** — 129 single-answer, 43 select-all-that-apply, 14 drag-and-drop matching.
- Immediate right/wrong feedback with the correct answer shown.
- Tracks missed questions and offers a **Review wrong answers** / **Retry** mode.
- Filter by category, choose question count, shuffle order.
- No build step, no dependencies, no internet required. Everything lives in `index.html`.

## Run locally
Open `index.html` in any browser.

## Deploy (Vercel)
This repo is a static site — Vercel serves `index.html` at the root automatically.
Connect the repo in Vercel and every push to `main` redeploys.

## Updating questions
All questions are embedded as a JSON array in the `<script>` block of `index.html`
(the `const QUESTIONS = [...]` line). Edit there, commit, and push.

## Notes on flagged answers
Three questions carry an in-app ⚠ note where the source answer keys were
inconsistent or conflict with ServiceNow documentation:
- Application-to-server relationship (`Runs::Runs On` vs `Runs on::Runs`)
- "Purpose of CMDB Data Manager"
- "Policy types created within CMDB Data Manager"
