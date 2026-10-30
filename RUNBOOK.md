# CannActuality — Runbook

Cannabis research platform that guides product development for licensed
vendors. Live stack mirrors the other AugustInnovations sites: hand-written
static HTML/CSS, a public GitHub repo, GitHub Pages, registrar DNS.

## Stack

- **Source:** this repo (`~/workspace/cannactuality-site/` locally)
- **Pages:** `index.html`, `research.html`, `vendors.html`, `about.html`,
  briefs in `briefs/*.html`
- **Styling:** one shared `styles.css` (no build step), `logo.svg` mark
- **Lead forms:** `lead.js` (shared pattern from the AugustInnovations sites).
  Submissions deliver via FormSubmit AJAX to the owner's inbox with a mailto
  fallback addressed to `taugustincst@gmail.com` (set via `data-inbox`).
  Note: the first FormSubmit submission from a new domain may require a
  one-time activation click in the inbox; the mailto fallback works regardless.
- **Hosting (target):** GitHub Pages from repo `taugustincst/cannactuality-site`,
  branch `main`, root. `CNAME` file contains `cannactuality.com`.
- **Domain:** cannactuality.com at GoDaddy (expires Sep 8, 2027).

## Content automation

- **Topic queue:** `tools/topics.md` — the weekly run takes the top Open
  topic, then moves it to Done with date + slug.
- **Scaffolding:** `tools/new_brief.py SLUG "Title" "Category" "Summary" [--date YYYY-MM-DD]`
  renders `tools/brief-template.html` into `briefs/<slug>.html`, inserts the
  index entry at the top of `research.html` (newest first), and validates
  that every internal link on the site resolves. It is offline and
  idempotent: re-running with the same slug changes nothing.
- **Weekly cron:** `cannactuality-weekly-research` (Mondays ~8:00 AM
  America/Los_Angeles) researches one queued topic with web search, writes
  the brief in the established structure with cited sources, publishes via
  the scaffolding conventions, commits and pushes, and marks the topic done.
- **House rules for every brief:** every number traces to an opened, cited
  source (publisher + date); no health/benefit claims; no dosing or
  consumption advice; a "What this means for product teams" section; a
  "research, not legal or medical advice" note; publication date on the page;
  no prices anywhere on the site.

## Publishing manually

1. Write or edit the HTML (for a new brief, scaffold first with
   `tools/new_brief.py`, then write the body).
2. `python3 tools/new_brief.py` is not needed for edits — but re-run any
   scaffold/validation step if you touched links. A quick manual check:
   open the changed pages locally and click through.
3. Commit and push:
   ```bash
   cd ~/workspace/cannactuality-site
   git add -A && git commit -m "…" && git push
   ```
   GitHub Pages republishes automatically within a few minutes.
4. Verify: `https://cannactuality.com/` (or the Pages default URL before DNS
   cutover: `https://taugustincst.github.io/cannactuality-site/`).

## Go-live: GoDaddy DNS cutover (OWNER STEP — needs Tj's GoDaddy sign-in)

The site and Pages hosting can be fully ready before this step; only Tj can
do it, because GoDaddy sign-in is owner-only (bot-walled for agents).

1. Sign in at godaddy.com → My Products → cannactuality.com → DNS.
2. Delete the existing Website Builder / default records for the root and www.
3. Add four **A records** for the root (`@`), TTL 1 hour (or default):
   - `185.199.108.153`
   - `185.199.109.153`
   - `185.199.110.153`
   - `185.199.111.153`
4. Add a **CNAME** for `www` → `taugustincst.github.io`
5. Confirm GitHub Pages is enabled on the repo (Settings → Pages: branch
   `main`, root; custom domain `cannactuality.com` — already set by the
   `CNAME` file in the repo).
6. Wait for DNS to propagate and the Pages certificate to issue (up to a few
   hours), then in Settings → Pages check **Enforce HTTPS**.
7. Verify: `https://cannactuality.com/` and `https://www.cannactuality.com/`
   both load the site over HTTPS.

## After go-live

- Submit the homepage contact form once and complete any FormSubmit
  activation email so form submissions deliver silently (the mailto fallback
  covers the gap until then).
- The weekly cron keeps publishing briefs to the repo; Pages deploys them
  automatically — no further owner steps.
