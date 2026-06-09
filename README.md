# pw-visual-tests-demo

A self-contained demo repository that does two things:

1. **Reference implementation** — it exercises *every* visual regression API and
   option that [Playwright](https://playwright.dev) provides, in a realistic
   product-style layout where the app and its tests live together.
2. **Testing surface for `pw-ui-review`** — it is the fixture repo used to
   develop and validate the separate `pw-ui-review` tool. `pw-ui-review`
   consumes the artifacts this repo produces (the JSON reporter output, the HTML
   report, traces, and the baseline/actual/diff PNGs) to review visual changes.
   Because this repo deliberately covers the full surface area of Playwright's
   screenshot APIs, it is an ideal end-to-end target for that tool.

There is **no external website under test**. The repo ships its own tiny
multi-page web app (a plain Node.js + Express static server) and points all
tests at `http://localhost:3000`.

---

## Repository layout

```
pw-visual-tests-demo/
├── app/
│   ├── server.js              # Express static server (npm start)
│   └── public/
│       ├── index.html         # /          stable full-page baseline
│       ├── components.html    # /components element-level screenshots
│       ├── dynamic.html       # /dynamic    masking + stylePath
│       ├── themes.html        # /themes     light vs dark side by side
│       ├── states.html        # /states     ?state= empty|filled|error|success
│       ├── slow.html          # /slow       delayed render + scrollable
│       ├── todo.html          # /todo       self-contained TodoMVC-style app
│       └── styles.css         # shared stylesheet
├── e2e/
│   ├── home.spec.ts
│   ├── components.spec.ts
│   ├── dynamic.spec.ts
│   ├── themes.spec.ts
│   ├── states.spec.ts
│   ├── slow.spec.ts
│   ├── buffer-snapshot.spec.ts
│   ├── todo.spec.ts          # business-intent tests (requirements + snapshots)
│   ├── fixtures.ts            # variant fixture (appends ?variant=v2)
│   └── hide-dynamic.css       # injected via stylePath
├── snapshots/                 # snapshotDir — v1 baseline PNGs, committed via Git LFS
├── test-results/              # results.json committed; traces/diffs/report gitignored
├── playwright.config.ts
├── playwright.variant.config.ts  # v2 variant run (simulate failures)
├── package.json
└── README.md
```

---

## The demo app

A lightweight Express server serves seven purpose-built pages, each targeting a
specific visual-regression scenario:

| Route         | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `/`           | Clean, stable layout for straightforward full-page baselines.           |
| `/components` | Grid of UI components for element-level `toHaveScreenshot()`.            |
| `/dynamic`    | Live timestamp, random quote, parameterised avatar.                     |
| `/themes`     | Same UI in light and dark variants side by side.                        |
| `/states`     | Sign-up form reachable in 4 states via `?state=`.                       |
| `/slow`       | Content revealed after ~1s (1.5s in v2); also tall enough to scroll.    |
| `/todo`       | A self-contained TodoMVC-style app — the target for business-intent tests. |

A consistent nav bar appears on every page. Plain HTML + CSS only — no React, no
build step, no bundler.

---

## Prerequisites

- **Node.js 18+**
- **Git LFS** (for the baseline PNGs — see [Git LFS setup](#git-lfs-setup))

---

## Install

```bash
# 1. Install Git LFS once per machine (if you have not already)
git lfs install

# 2. Install dependencies
npm install

# 3. Install the Chromium browser (the only one this suite uses)
npx playwright install chromium
```

## Start the app

The app must be running **before** you run the tests — Playwright does **not**
start or manage it. In one terminal:

```bash
npm start
# -> pw-visual-tests-demo app running at http://localhost:3000
```

Leave it running. (It's also handy for eyeballing pages or generating avatars,
e.g. `/dynamic?seed=ada`.)

To stop it — or to clear a stale instance holding port 3000 (an `EADDRINUSE`
error on `npm start`) — run:

```bash
npm stop
```

## Run the tests

With the app already running (see above), in a second terminal:

```bash
npm test                 # run the suite against v1 (baseline)
npm run test:variant     # run the suite against v2 (changed) — see "Simulating visual failures"
npm run test:ui          # interactive UI mode
npm run report           # open the last HTML report
```

The suite runs against a single Playwright project: **standard desktop
Chromium at 1280×720**. There is no cross-browser or multi-viewport matrix —
every spec runs once, against this one browser/viewport.

---

## Baselines

This repo **ships committed v1 baselines** (under `snapshots/`, via Git LFS),
generated on **desktop Chromium / macOS**. If you are on the same platform you
can run `npm test` straight after cloning and it will compare against them.

Screenshots are **platform- and browser-dependent**, so baselines generated on
macOS will not match a Linux CI runner. On a different platform — or after you
intentionally change the UI — regenerate them:

```bash
npm run baselines:generate
# equivalent to: npx playwright test --update-snapshots
```

This (re)writes baseline PNGs into `snapshots/`, organised by spec file, project
and platform (see `snapshotPathTemplate` in `playwright.config.ts`). Commit the
regenerated PNGs via Git LFS. After baselines exist, a normal `npm test`
compares against them and fails on any visual drift.

---

## Simulating visual failures (for `pw-ui-review`)

The app has a built-in **visual change simulation system** so you can produce a
realistic, varied set of regression failures on demand — no manual editing
required.

### How it works

Every page accepts a `?variant=v2` query parameter. With it, the page renders a
visually distinct but realistic **v2** ("changed") version of itself; without it
(or with `?variant=v1`) it renders the **v1** ("baseline") version. The
differences are the kind that happen in real product development, not artificial
corruption. Variant switching is plain JavaScript on each page — it reads
`new URLSearchParams(location.search).get('variant')` and applies a
`data-variant="v2"` attribute to `<body>`; all v2 differences are CSS rules
scoped to `body[data-variant="v2"]`. No server-side logic.

| Page          | v1 → v2 change                                                                 | Diff character                         |
| ------------- | ------------------------------------------------------------------------------ | -------------------------------------- |
| `/`           | Hero background colour, larger heading, extra CTA button.                       | Large, obvious diff across the top.    |
| `/components` | Buttons fully rounded, primary blue → indigo, card box-shadow.                  | Moderate diff, many small changes.     |
| `/dynamic`    | Card area one-column → two-column. Masked timestamp + avatar stay masked.       | Layout diff; masks must still hold.    |
| `/themes`     | Dark theme background near-black → dark navy.                                    | Subtle colour shift.                   |
| `/states`     | Error state: red border → red background fill on the input.                     | Only the error snapshot changes.       |
| `/slow`       | Render delay 1s → 1.5s (no visual change to loaded content).                     | Tests wait strategies under new timing.|
| `/todo`       | Completed tasks get a green accent; the outstanding count becomes a pill.        | Breaks done-task & count views; empty state unaffected.|

### The variant test harness

The existing specs are **not** modified. Instead:

- **`e2e/fixtures.ts`** — a custom fixture that transparently appends
  `?variant=v2` to every `page.goto()` when `PW_VARIANT=v2` is set.
- **`playwright.variant.config.ts`** — identical to `playwright.config.ts`
  (same `snapshotDir`, project and thresholds, so it compares against the **same
  v1 baselines**) but sets `PW_VARIANT=v2`.

The only line that differs in each spec is its import (`./fixtures` instead of
`@playwright/test`); the test logic is untouched, and the same specs run in both
modes.

### Workflow

```bash
# Step 0 — start the app in another terminal (and leave it running)
npm start

# Step 1 — generate v1 baselines (only needed once, or after a reset)
npm run baselines:generate

# Step 2 — confirm all tests pass against v1
npm run test

# Step 3 — run tests against the v2 variant to produce failures
npm run simulate:failures

# To reset back to v1 baselines after experimenting
npm run baselines:reset
```

Failing tests produce, under `test-results/`, the trio `*-expected.png`
(baseline), `*-actual.png` (new render) and `*-diff.png` (highlighted
difference), plus a trace and an entry in `test-results/results.json`. These are
exactly the artifacts `pw-ui-review` consumes.

### What `simulate:failures` produces

Running `baselines:generate` then `simulate:failures` fails **25 tests across 7
spec files** (only `slow` stays green), spanning a realistic range of diff
sizes:

| Spec / test                                   | Diff (% of pixels) |
| --------------------------------------------- | ------------------ |
| `themes` dark pane (element)                  | **58.46%**         |
| `home` full page (unnamed / named)            | **23.86%**         |
| `buffer-snapshot` page buffer                 | **23.86%**         |
| `home` fullPage                               | **15.98%**         |
| `states` error snapshot (1 of 4 in the test)  | **15.86%**         |
| `todo` count element (one / two left)         | **11.18–11.47%**   |
| `themes` full page                            | **10.67%**         |
| `todo` mark-all / completed views             | 0.71–1.14%         |
| `components` alerts                            | 0.81%              |
| `components` buttons / clip, `buffer` element | 0.40–0.60%         |
| `todo` active / capture views (count pill)    | 0.10–0.32%         |
| `dynamic` mask / stylePath (layout reflow)    | 0.23%              |

This satisfies the intended spread: at least one **large** diff (>5% — themes,
home, states, the `todo` count pill), at least one **subtle** diff (<1% — the
element-level shots, the `/dynamic` reflow, and the `todo` count-in-footer), and
**partial** tests where only some snapshots change (`states`: only `error`
fails; `todo`: the empty-state snapshot stays green while completed-task and
count views break). The masked timestamp + avatar on `/dynamic` sit in a fixed
profile bar, so even though the layout reflows in v2 they contribute **zero**
diff pixels — the entire `/dynamic` diff comes from the card area below them.

`slow.spec.ts` is the one spec that stays green in v2: its only v2 change is the
render delay (1s → 1.5s), which is not visible once content has loaded. That is
intentional — `/slow` exists to prove the suite's wait strategies still resolve
correctly under different timing, not to produce a visual diff.

> Exact percentages are platform-dependent (anti-aliasing differs across
> OS/browser builds); the numbers above are from desktop Chromium on macOS.

---

## Spec → Playwright visual API map

| Spec file                  | Playwright visual API / option demonstrated                                                                                             |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| `home.spec.ts`             | `expect(page).toHaveScreenshot()` unnamed **and** named; `fullPage: true` whole-document capture. |
| `components.spec.ts`       | `expect(locator).toHaveScreenshot()`; `maxDiffPixels`; `maxDiffPixelRatio`; `threshold`; `clip`; `scale: 'css'`; `scale: 'device'`.    |
| `dynamic.spec.ts`          | `mask` (+ `maskColor`); `stylePath`; `omitBackground: true`.                                                                            |
| `themes.spec.ts`           | Full-page and per-element `toHaveScreenshot()` across light/dark variants.                                                              |
| `states.spec.ts`           | Multiple `toHaveScreenshot()` calls within a single test, one per form state via `?state=`.                                            |
| `slow.spec.ts`             | `waitForSelector`, `locator.waitFor`, `waitForTimeout`; `fullPage: true` on scrollable content.                                        |
| `buffer-snapshot.spec.ts`  | `page.screenshot()` buffer compared via `expect(buffer).toMatchSnapshot()` (page, element, and fullPage variants).                      |
| `todo.spec.ts`             | **Business-intent tests** (see below): real user actions + element/page snapshots as the assertion.                                     |

### Business-intent tests (`todo.spec.ts`)

The specs above are organised by *API* — they exist to exercise Playwright's
visual options. `todo.spec.ts` is the opposite: it shows how a product team
would actually write visual tests against the `/todo` app — as **user-facing
requirements**, not UI mechanics. Each test:

- is named after a requirement ("the count uses singular wording when one task
  remains", "the Active filter shows only unfinished work");
- arranges state through **real user actions** (typing a task and pressing
  Enter, checking a box, clicking a filter, double-clicking to rename);
- uses **accessibility-first locators** (`getByRole`, `getByPlaceholder`,
  `getByLabel`) so it describes intent rather than markup;
- asserts the outcome with a **visual snapshot** of the relevant region or
  element — pinning down "what the user should see".

13 requirements are covered: empty state, capturing a task, ordering, the
outstanding-count (incl. singular/plural copy), completing/reopening, the
Active/Completed filters, renaming, deleting, mark-all-complete, and
clear-completed.

- JSON reporter → `test-results/results.json`
- HTML reporter with `open: 'never'`
- `trace: 'on'` for all tests
- Single project: standard desktop Chromium at 1280×720
- No `webServer` — start the app yourself (`npm start`) before running tests
- `snapshotDir` explicitly set to `./snapshots`
- `expect.toHaveScreenshot` defaults: `animations: 'disabled'` + base `threshold`

---

## Git LFS setup

Baseline PNGs can accumulate quickly and bloat the Git history, so every PNG
under `snapshots/` is tracked with **Git LFS**. The tracking rule lives in
[`.gitattributes`](.gitattributes):

```
snapshots/**/*.png filter=lfs diff=lfs merge=lfs -text
```

To work with this repo:

```bash
# Install the LFS git hooks once per machine.
git lfs install

# Clone normally — LFS-tracked files are fetched automatically.
git clone https://github.com/abhivaikar/pw-visual-tests-demo.git

# Generate baselines, then add + commit them. LFS handles the PNGs.
npm run baselines:generate
git add snapshots/
git commit -m "Add visual baselines"
git push
```

Verify LFS is tracking your baselines:

```bash
git lfs track          # should list snapshots/**/*.png
git lfs ls-files       # lists the PNGs stored in LFS
```

> **Note:** the `snapshots/` baselines and `test-results/results.json` (the
> latest run's results) are committed. The rest of `test-results/` (per-test
> traces and diff PNGs) and the `playwright-report/` HTML report are gitignored
> — they are regenerated on every run.

---

## License

MIT
