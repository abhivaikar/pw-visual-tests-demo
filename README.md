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
│       └── styles.css         # shared stylesheet
├── e2e/
│   ├── home.spec.ts
│   ├── components.spec.ts
│   ├── dynamic.spec.ts
│   ├── themes.spec.ts
│   ├── states.spec.ts
│   ├── slow.spec.ts
│   ├── buffer-snapshot.spec.ts
│   ├── fixtures.ts            # variant fixture (appends ?variant=v2)
│   └── hide-dynamic.css       # injected via stylePath
├── snapshots/                 # snapshotDir — baselines (Git LFS), .gitkeep only
├── test-results/              # results.json committed; traces/diffs gitignored
├── playwright.config.ts
├── playwright.variant.config.ts  # v2 variant run (simulate failures)
├── package.json
└── README.md
```

---

## The demo app

A lightweight Express server serves six purpose-built pages, each targeting a
specific visual-regression scenario:

| Route         | Purpose                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `/`           | Clean, stable layout for straightforward full-page baselines.           |
| `/components` | Grid of UI components for element-level `toHaveScreenshot()`.            |
| `/dynamic`    | Live timestamp, random quote, parameterised avatar.                     |
| `/themes`     | Same UI in light and dark variants side by side.                        |
| `/states`     | Sign-up form reachable in 4 states via `?state=`.                       |
| `/slow`       | Content revealed after ~1.5s; also tall enough to scroll (`fullPage`).  |

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

```bash
npm start
# -> pw-visual-tests-demo app running at http://localhost:3000
```

You normally do **not** need to start the app manually for tests — the
Playwright `webServer` config boots it automatically. Starting it by hand is
useful for eyeballing pages or generating avatars (`/dynamic?seed=ada`).

## Run the tests

```bash
npm test                 # run the suite against v1 (baseline)
npm run test:variant     # run the suite against v2 (changed) — see "Simulating failures"
npm run test:ui          # interactive UI mode
npm run report           # open the last HTML report
```

The suite runs against a single Playwright project: **standard desktop
Chromium at 1280×720**. There is no cross-browser or multi-viewport matrix —
every spec runs once, against this one browser/viewport.

---

## Generating baselines for the first time

No baseline PNGs are committed to this repo. The **first** run has nothing to
compare against, so you must generate the baselines once:

```bash
npm run baselines:generate
# equivalent to: npx playwright test --update-snapshots
```

This writes baseline PNGs into `snapshots/`, organised by spec file, project and
platform (see `snapshotPathTemplate` in `playwright.config.ts`). Because
screenshots are **platform- and browser-dependent**, baselines generated on
macOS will not match a Linux CI runner. Generate baselines on the same platform
you intend to compare against (commonly via a Docker container or CI job), then
commit them via Git LFS.

After baselines exist, a normal `npm test` compares against them and fails on
any visual drift.

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

Running `baselines:generate` then `simulate:failures` fails **13 of 24 tests,
across 6 of the 7 spec files**, spanning a realistic range of diff sizes:

| Spec / test                                   | Diff (% of pixels) |
| --------------------------------------------- | ------------------ |
| `themes` dark pane (element)                  | **58.46%**         |
| `home` full page (unnamed / named)            | **23.86%**         |
| `buffer-snapshot` page buffer                 | **23.86%**         |
| `home` fullPage                               | **15.98%**         |
| `states` error snapshot (1 of 4 in the test)  | **15.86%**         |
| `themes` full page                            | **10.67%**         |
| `components` alerts                            | 0.81%              |
| `components` buttons / clip, `buffer` element | 0.40–0.60%         |
| `dynamic` mask / stylePath (layout reflow)    | 0.23%              |

This satisfies the intended spread: at least one **large** diff (>5% — themes,
home, states), at least one **subtle** diff (<1% — the element-level shots and
the `/dynamic` reflow), and a **multi-snapshot** test where only some snapshots
change (`states`: the `empty` and `filled` snapshots still match, only `error`
fails). The masked timestamp + avatar on `/dynamic` sit in a fixed profile bar,
so even though the layout reflows in v2 they contribute **zero** diff pixels —
the entire `/dynamic` diff comes from the card area below them.

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

### Config-level coverage (`playwright.config.ts`)

- JSON reporter → `test-results/results.json`
- HTML reporter with `open: 'never'`
- `trace: 'on'` for all tests
- Single project: standard desktop Chromium at 1280×720
- `webServer` auto-starts the app
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

> **Note:** only `snapshots/` baselines are committed. The `test-results/` and
> `playwright-report/` directories are gitignored — they are regenerated on
> every run.

---

## License

MIT
