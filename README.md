# Math Muscle Memory Engine

A 10-minute math sprint app for ISEE prep. Static web app — no server, no database, no accounts. State lives in your browser; a single sync button pushes it to GitHub so the parent dashboard works from any device.

## What's here

- **Sprint engine** with countdown timer, free-response answers, and a "prove it from memory" loop on every wrong answer
- **Walkthrough screen** with KaTeX-rendered math, step-by-step rationales, and a scaffolded "why does this work?" prompt
- **Background error classification** — common misconception patterns (forgot to invert when dividing, sign errors, etc.) get tagged and surfaced in the tutor report
- **Two-audience views:**
  - `/` Beatrix's home + sprint + her-progress
  - `/parents` parent dashboard with struggle areas
  - `/parents/report` printable narrative tutor briefing
- **Hybrid problem source:** 16 numeric templates that generate fresh problems every sprint + 48 hand-written word problems across 8 interest domains (thrift, sewing, sailing, music, currency/Denmark, reading rate, pocket money, spending slope)
- **Tidy mode toggle** — default ON for test-faithful clean answers; flip OFF later in the summer for upper-school "trust your process" practice

## Local development

```bash
npm install
npm run dev      # Vite dev server on http://localhost:5173/math-engine/
npm test         # Vitest — 76 tests
npm run build    # Production build to ./dist
```

## Deploying to GitHub Pages

### One-time setup

1. **Create a GitHub repo** named `math-engine` under your account. Public is fine — the URL itself is the access control.
2. **Initialize this folder as a git repo:**
   ```bash
   git init
   git branch -M main
   git add .
   git commit -m "initial commit"
   git remote add origin git@github.com:YOUR-USERNAME/math-engine.git
   git push -u origin main
   ```
3. **Enable GitHub Pages** in repo Settings → Pages: source = `gh-pages` branch, folder = `/ (root)`.
4. **Update the URL** in `vite.config.ts` if your repo name differs from `math-engine`. The `base` field must match `/REPO-NAME/`.

### Deploy

```bash
npm run deploy
```

This builds the project and pushes `dist/` to the `gh-pages` branch. GitHub Pages serves it within a minute or two at:

```
https://YOUR-USERNAME.github.io/math-engine/
```

Re-run `npm run deploy` any time you change code.

## Setting up sync

The sync button stores Beatrix's sprint data in a `data` branch of the same repo, so the parent dashboard can read it from a different device.

### One-time, on Beatrix's device

1. Open the app, click **Settings**.
2. Enter your GitHub username and `math-engine` for the repo name.
3. Generate a **Personal Access Token (classic)** at https://github.com/settings/tokens with the `repo` scope. Copy it into the PAT field. (The PAT only lives in browser localStorage on this device — it's not stored in the repo.)
4. Run a sprint, then click **Push now** in Settings. The app creates the `data` branch automatically on first push.

After that, sprints auto-push when they end.

### On your laptop (parent side)

1. Open the same URL, click **Settings**.
2. Enter the same username and repo name. **Leave the PAT field blank** — reads from the public `data` branch don't require auth.
3. Navigate to `/parents` — the dashboard auto-pulls the latest state on load.

## Daily flow

- **Beatrix:** opens the URL, lands on home, clicks "Start a sprint", does 10 minutes. Her data persists locally and pushes to GitHub automatically when the sprint ends.
- **You / mom / stepdad / tutor:** open the URL with `/parents` appended. Dashboard pulls latest data, shows today + this week's stats, struggle areas grouped by misconception pattern, and a list of any problems she flagged. Click "Open tutor report" for a printable narrative briefing.

## Editing the word-problem bank

The 48 word problems live as JSON in `src/problems/static-bank/*.json`. Each domain is one file. To edit voice/tone or add more problems:

1. Open the JSON file for the domain (e.g., `sailing.json`).
2. Edit `text`, `walkthrough.steps`, or `selfExplanation` directly. Each problem follows the same shape — copy an existing entry as a template if adding new ones.
3. Run `npm test` to make sure the structural checks still pass.
4. `npm run deploy` to push.

Or just ask Claude Code: *"Edit the sewing word problems to sound more like Beatrix would."*

## Tidy mode

Tidy mode controls whether generated problems produce clean answers (default ON, ISEE-faithful) or include repeating decimals you have to round (OFF, upper-school habit).

Flip via Settings, or ask Claude Code: *"Turn off tidy mode."*

The current state is surfaced in the parent dashboard banner and at the top of the tutor report.

## Architecture (brief)

- Preact + TypeScript + Vite — ~110 KB gzipped + KaTeX fonts
- `fraction.js` for exact fraction arithmetic (no floating-point drift on `1/4 + 1/6 = 5/12`)
- Sprint engine is a pure reducer (`src/sprint/engine.ts`); UI is a thin layer
- Problem source is behind a `ProblemProvider` interface (`src/problems/provider.ts`) — generators and the static bank both implement it, so swapping the static bank for a word-problem generator later is a one-file change

See the plan file at `~/.claude/plans/read-the-prd-in-iridescent-stardust.md` for the full design rationale.

## License

Private — for Beatrix and family.
