# Tete — ECG Learning Coach

Tete is a lightweight learning interface for health-science students to practise a deliberate ECG interpretation cycle: observe, reason, explain, receive guidance, revise, and improve.

Learner-testing URL: **https://mtaver.github.io/TETE/**. The initial workflow build passed, but the site is pending the one-time GitHub Pages enablement described in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md); live checks are not yet marked as passed.

The application includes a responsive home page and a small case library with three stable-ID introductory cases: a normal-rate sinus rhythm, sinus bradycardia, and sinus tachycardia. Diagnosis names remain hidden in the library and during interpretation. Each case uses a purpose-built schematic SVG ECG with fixed, auditable measurements rather than an AI-generated image or patient recording.

Learners can work through rate, rhythm, axis, P waves, PR interval, QRS duration, and ST/T findings; request progressive hints; explain their reasoning; revise answers; and receive deterministic teaching feedback. Free-text explanations are displayed for self-comparison but are not evaluated or scored.

Step 3 adds two explicit modes:

- **Guided Practice** provides hints and post-feedback revision without rating changes.
- **Rated Assessment** hides hints and answers until submission. Only the first submission of an unseen case can change the prototype rating; later attempts are labelled and recorded as practice.

Learners can filter the library by a target skill such as rate or rhythm. After feedback, Tete recommends a practice area from incorrect or “Not sure” answers and links to a relevant teaching resource. Recommendations are practice guidance, not evidence of mastery.

The project does not include accounts, cloud sync, uploads, live AI, or diagnoses beyond these three sinus-rate examples.

## Learner testing and content review

Step 6 adds three review artifacts without inventing expert or learner results:

- [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) audits each waveform, answer key, hint, explanation, and source. Automated consistency is distinguished from expert judgment; every case remains **Not yet reviewed** by an expert.
- [`docs/LEARNER_TEST_PLAN.md`](docs/LEARNER_TEST_PLAN.md) is a formative protocol for 3–5 health-science students, with de-identified observation fields for completion, confusion, and feedback.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) connects the prototype to engagement, resource discovery, and targeted practice guidance while stating its limitations.

The result view now moves keyboard focus to the score heading and exposes the score summary as a polite, atomic status region. A keyboard-visible skip link was added. Existing fieldset/legend and explicit label relationships remain in place for all structured questions and free text.

## Offline installation

Tete is an installable Progressive Web App. A production build generates a web app manifest and service worker using `vite-plugin-pwa`. After one successful online visit, the application shell and all essential local assets are precached: the home page, case library, schematic ECGs, questions, hints, feedback, offline learning summaries, and progress dashboard.

The app shows when it is offline and when its core content is ready for offline use. When a new version is waiting, Tete offers an explicit update button. The button is disabled during an active attempt so an update cannot interrupt the learner; applying it reloads application code but does not clear `localStorage` progress.

For a reproducible same-origin, two-build update check and the Step 6 execution record, see [`docs/PWA_UPDATE_TEST.md`](docs/PWA_UPDATE_TEST.md). Set `VITE_APP_VERSION` before a production build to give test builds distinct visible footer labels and bundle hashes; normal builds use `Build local`.

External AHA/ACC/HRS and NCBI reference pages still require an internet connection. Each case therefore includes a short original summary with source attribution that remains available offline. Essential fonts and the app icon are bundled locally; no remote font request is required.

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173`).

## Production build

```bash
npm run build
npm run preview
```

The production files are generated in `dist/`.

Vite is configured for the GitHub Pages project path `/TETE/`. The generated application assets, manifest start URL, PWA scope, service worker, and icon URLs stay within `https://mtaver.github.io/TETE/`.

## GitHub Pages deployment

Pushing `main` runs `.github/workflows/deploy-pages.yml`. The workflow installs the locked dependencies with pnpm, runs the tests, builds the production bundle, uploads `dist/` as the Pages artifact, and deploys it with GitHub’s official Pages actions. The commit SHA is shown as the deployed build identifier so PWA update tests can distinguish releases.

The repository’s Pages source must be set to **GitHub Actions** under **Settings → Pages → Build and deployment → Source**. The workflow needs `pages: write` and `id-token: write`, both scoped in the workflow file.

Deployment status, exact enablement steps, and the uncompleted live verification checklist are recorded in [`docs/DEPLOYMENT.md`](docs/DEPLOYMENT.md).

## Case validation

Case content lives in `src/cases.js`. Stable IDs preserve the existing `normal-sinus-rhythm-01` history and add `sinus-bradycardia-01` and `sinus-tachycardia-01`.

The schematic traces are generated from fixed parameters: 75 bpm/800 ms RR, 50 bpm/1200 ms RR, and 120 bpm/500 ms RR. All use a 160 ms PR, 80 ms QRS, approximately +60° frontal QRS axis, sinus P-wave morphology, and isoelectric ST segments. At 25 mm/s, one small box represents 40 ms. Waveform spacing is calculated at 125 pixels/second and is checked against each rate and answer key in automated tests.

Teaching references are linked in each review and recommendation, including AHA/ACCF/HRS standardization and electrophysiology definitions plus NCBI Clinical Methods and introductory sinus-rhythm material.

## Weighted scoring and prototype rating

Question weights live in `src/scoringConfig.js` and sum to 100: rhythm 20; rate, P waves, QRS duration, and ST/T findings 15 each; axis and PR interval 10 each. The weights emphasize the organizing rhythm diagnosis and repeatable core measurements. They are provisional educational design choices, are not clinically validated, and must not be used as evidence of clinical competence.

The case percentage is the sum of weights for correct structured answers. Incorrect, blank, and “Not sure” answers earn zero for that item. Free-text interpretation is never scored. Configured prototype difficulties are 580 for Case 02, 600 for Case 01, and 620 for Case 03; these are provisional educational settings rather than validated difficulty estimates.

The prototype rating begins at 600 and is bounded from 100 to 1200. For the first submission of an unseen case in Rated Assessment only:

```text
expected = 1 / (1 + 10 ^ ((case difficulty - current rating) / 400))
change   = round(80 × (weighted performance - expected))
new      = clamp(current rating + change, 100, 1200)
```

Performance and expected values are expressed from 0 to 1. At the starting rating, the expected performance is 50%; a 100% result changes the rating by +40 and a 0% result by −40. The formula is a learning prototype, not a validated psychometric or clinical rating system.

## Local progress and privacy

Submitted attempts, weighted scores, rating history, and skill summaries are stored in browser `localStorage`. Records remain on the current browser/device and do not sync elsewhere. Existing version-one records are read without rewriting or discarding their attempts. Completed attempts remain in history even when rating falls.

Rating eligibility is tracked separately by stable case ID. An unseen case can affect rating only when first submitted in Rated Assessment. Once any attempt on that case exposes its answer key—Guided Practice or Rated Assessment—every later attempt on that case is practice-only. Duplicate attempt identifiers are ignored.

The progress panel includes a confirmed reset control. If storage is missing, corrupt, blocked, or full, the case remains usable and shows a warning that progress may not persist.

The dashboard separately shows the current prototype rating, number of independently rated assessments, number of guided or practice attempts, mode-labelled score history, rating history, and skills needing more practice. Guided and repeat-case results remain visually labelled as practice; increases in these scores are not presented as independent improvement.

Progress exists only in this browser on this device. It does not sync, and clearing browser/site data may permanently remove it.

## Tests

```bash
npm test
npm run build
```

The automated tests cover weighted results; guided versus rated attempts; answer exposure; per-case eligibility; duplicate protection; rating bounds; serialization persistence; old-record preservation across app versions; corrupt storage; reset behavior; stable IDs; and waveform/rate/interval answer-key consistency for all three cases. Production verification additionally checks generated PWA assets and service-worker-backed offline navigation.

Step 6 production UI checks covered a 375 × 812 viewport, single-column reflow, keyboard traversal, visible focus (including the skip link), accessible form names, horizontal keyboard-focusable ECG scrolling, and focus/status announcement after submission. The browser harness did not expose a reliable native 200% zoom control; the narrower mobile reflow passed, but an explicit 200% browser-zoom check remains in the pre-study manual checklist. The local two-build PWA update test passed; it should still be repeated on the intended HTTPS staging deployment because server/CDN cache headers are not represented by Vite preview.

## Disclaimer

For education only. Not for clinical diagnosis.
