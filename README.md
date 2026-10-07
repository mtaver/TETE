# Tete — ECG Learning Coach

Tete is a lightweight learning interface for health-science students to practise a deliberate ECG interpretation cycle: observe, reason, explain, receive guidance, revise, and improve.

Learner-testing URL: **https://mtaver.github.io/TETE/**. GitHub reports the Pages deployment as successful; network-level access may still depend on the learner’s connection to `github.io`.

The application includes a responsive home page and a small library of six stable-ID introductory cases: two schematic variants each of normal sinus rhythm, sinus bradycardia, and sinus tachycardia. Diagnosis names remain hidden in Assessment Mode and during independent interpretation. Each case uses a purpose-built schematic SVG ECG with fixed, auditable measurements rather than an AI-generated image or patient recording.

Learners can work through rate, rhythm, axis, P waves, PR interval, QRS duration, and ST/T findings; request progressive hints; explain their reasoning; revise answers; and receive deterministic teaching feedback. Free-text explanations are displayed for self-comparison but are not evaluated or scored.

Practice begins with a simple mode-selection page:

- **Learning Mode** provides topic search, guided cases, hints, post-feedback revision, and case percentages without rating changes.
- **Assessment Mode** presents diagnosis-neutral cases and hides hints and answers until submission. Only the first submission of an unseen case can change the prototype rating; later attempts are clearly labelled and recorded as practice.

The libraries, case screens, mode selector, and progress dashboard have distinct hash routes, so browser Back and Forward follow the learner’s path. The previous `#practice` entry remains the mode-selection route. Detailed rules are collapsed under **How scoring works**, while history and dashboard information live behind **View progress**.

## Continue learning

The mode-selection page includes a prominent **Continue learning** recommendation based only on locally saved structured-answer history. Tete looks for skills marked incorrect in the most recent submitted attempt containing a miss. If that attempt contains several misses, the existing provisional question weight breaks the tie; stable question order is the final deterministic tie-breaker. A recorded `Not sure` response is described explicitly when that response is available.

The selected existing case opens in Learning Mode with a focused instruction while retaining the complete interpretation workflow, hints, written feedback, explanations, and revision. The session is always practice and never changes the skill rating. A revised resubmission reuses the original attempt identifier, so it updates the learner’s review experience without counting another completed session. Previously seen recommendations and library cases are labelled **Review practice—does not change your rating.**

Learners with no history see **Start with the basics**. If history contains no missed skills, Tete offers general systematic practice and does not infer a weakness. A local sourced summary is the fallback when no existing case supports a recommended skill, and learners can always choose another topic instead.

Version-one history is preserved. Older records contain correctness flags but not the original selected answer, so Tete can identify an older recorded miss but cannot truthfully distinguish an incorrect choice from `Not sure`. New attempts store a copy of structured responses alongside the existing correctness data; this does not change scoring, rating, or the storage key.

## Review mistakes

The **View progress** dashboard lists recorded structured-answer mistakes newest first. Each item shows its case label, skill, attempt date, mode, stored selected answer, correct answer, and the existing case explanation. When a version-one record has no stored response, the interface states **Your original answer was not recorded** rather than reconstructing it.

**Practise this skill** opens a relevant existing case in Learning Mode with a focused instruction. Merely reviewing or opening that practice does not change scores, ratings, attempts, or completion counts. Any case already exposed is labelled as review practice and remains protected from rating changes. The review is derived locally from saved progress and bundled case content, so it remains available offline. With no recorded mistakes, the dashboard links directly to Learning Mode.

Learners can filter the library by a target skill such as rate or rhythm. After feedback, Tete recommends a practice area from incorrect or “Not sure” answers and links to a relevant teaching resource. Recommendations are practice guidance, not evidence of mastery.

## Local topic search

The case library includes a labelled “What would you like to learn?” search over a bundled topic catalogue. It recognizes names and common synonyms for normal sinus rhythm, sinus bradycardia, sinus tachycardia, heart rate, and rhythm. Results contain short sourced explanations and link only to the six bundled cases.

Topic results and the existing skill browser start Learning Mode directly, so hints and revision remain available and the weighted score is shown without changing the prototype rating. Independently interpreted cases remain in the separate, diagnosis-neutral **Assessment Mode** library. The first assessment of an unseen stable case ID remains rating-eligible; any case whose answer key was already exposed remains practice-only.

Search is deterministic and local—there is no internet search or AI generation. The catalogue, explanations, and matching logic are part of the application bundle and are cached by the PWA for offline use. External source pages are still labelled as internet-required.

The project does not include accounts, cloud sync, uploads, live AI, or diagnoses beyond these three sinus-rate categories.

## Written interpretation feedback

After a case is submitted, Tete shows an **About your interpretation** section labelled **Automated practice feedback—may miss or misunderstand wording.** A small local checker compares clearly stated rate, rhythm, axis, P-wave, PR, QRS, and ST/T statements with that case’s answer key. It can identify supported findings, omitted reasoning steps, a limited set of explicit contradictions, negated expected findings, and uncertainty phrases such as “maybe” or “not sure.”

The checker is deterministic and bundled with the app. It does not use live AI, send the interpretation to an API, or run before submission. Wording it cannot interpret reliably is left unclassified and accompanied by a self-review checklist rather than guessed. Learners receive a case-specific example interpretation and can revise their text and review it again without creating another attempt or changing their score or rating.

The checker does not understand unrestricted clinical language, implied meaning, spelling variants, every form of negation, or complex sentence structure. Its feedback is educational support, not an assessment of clinical reasoning. The **This feedback seems incorrect** control stores the flagged wording and checker categories under a separate local browser key; it sends no data and does not modify progress.

## Learner testing and content review

Step 6 adds three review artifacts without inventing expert or learner results:

- [`docs/CONTENT_REVIEW.md`](docs/CONTENT_REVIEW.md) audits each waveform, answer key, hint, explanation, and source. Automated consistency is distinguished from expert judgment; every case remains **Not yet reviewed** by an expert.
- [`docs/LEARNER_TEST_PLAN.md`](docs/LEARNER_TEST_PLAN.md) is a formative protocol for 3–5 health-science students, with de-identified observation fields for completion, confusion, and feedback.
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) connects the prototype to engagement, resource discovery, and targeted practice guidance while stating its limitations.

The result view now moves keyboard focus to the score heading and exposes the score summary as a polite, atomic status region. A keyboard-visible skip link was added. Existing fieldset/legend and explicit label relationships remain in place for all structured questions and free text.

## Offline installation

Tete is an installable Progressive Web App. A production build generates a web app manifest and service worker using `vite-plugin-pwa`. After one successful online visit, the application shell and all essential local assets are precached: the home page, case library, schematic ECGs, questions, hints, feedback, offline learning summaries, and progress dashboard.

The app shows when it is offline and only announces **Ready offline** after the active service worker controls the page. The first production visit must remain open until that message appears; merely starting the preview server or fetching the URL does not install browser caches. Reload the exact same origin, port, and `/TETE/` path when testing offline (`localhost` and `127.0.0.1`, or different ports, are different origins). The worker claims the initial page after installation, so a second online reload is not required. When a new version is waiting, Tete offers an explicit update button. The button is disabled during an active attempt so an update cannot interrupt the learner; applying it reloads application code but does not clear `localStorage` progress.

For a reproducible same-origin, two-build update check and the Step 6 execution record, see [`docs/PWA_UPDATE_TEST.md`](docs/PWA_UPDATE_TEST.md). Set `VITE_APP_VERSION` before a production build to give test builds distinct visible footer labels and bundle hashes; normal builds use `Build local`.

External AHA/ACC/HRS and NCBI reference pages still require an internet connection. Each case therefore includes a short original summary with source attribution that remains available offline. Essential fonts and the app icon are bundled locally; no remote font request is required.

## Languages

Tete includes bundled English, French, and Kiswahili interfaces. The language selector changes navigation, case questions and answer labels, hints, explanations, topic summaries, recommendations, progress and mistake review, status messages, and interpretation-feedback guidance without reloading the app. The preference is stored separately in `localStorage` under `tete-language-v1`; it does not migrate, rewrite, or reset learner progress. Case IDs, question IDs, answer-value IDs, and scoring remain language-independent, so equivalent selections in every language produce the same result. Dates use the selected locale and the document `lang` attribute changes to `en`, `fr`, or `sw` with the interface.

French translations are **provisional and have not been reviewed by a bilingual ECG educator**. Kiswahili is labelled **Provisional translation** and likewise has not received bilingual ECG educator review. Technical ECG terms are retained where a reliable equivalent was not appropriate. Source titles and links remain in their published form. Tete does not claim curriculum alignment or institutional approval. The deterministic written-interpretation pattern checker remains English-only: French and Kiswahili modes do not classify prose and instead provide translated, case-specific examples and self-review checklists. Free text remains unscored in every language.

## Requirements

- Node.js 20 or later
- npm 10 or later

## Run locally

```bash
npm install
npm run dev
```

Open the local URL printed by Vite (usually `http://localhost:5173/TETE/`).

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

Case content lives in `src/cases.js`. The original stable IDs remain unchanged. The variants use `normal-sinus-rhythm-02`, `sinus-bradycardia-02`, and `sinus-tachycardia-02`, so eligibility and answer exposure are tracked independently without migrating or rewriting existing progress.

The original traces remain 75 bpm/800 ms RR, 50 bpm/1200 ms RR, and 120 bpm/500 ms RR with 160 ms PR and 80 ms QRS. The new variants are 60 bpm/1000 ms RR with 120 ms PR, 40 bpm/1500 ms RR with 200 ms PR, and 150 bpm/400 ms RR with 120 ms PR; all three variants use a 100 ms QRS. Every case models an approximately +60° frontal QRS axis, sinus P-wave morphology, and isoelectric ST segments. At 25 mm/s, one small box represents 40 ms. Automated validation checks rate, RR and drawn spacing, rhythm classification, PR/QRS answer strings, answer options, hints, explanations, sources, and the **Not yet reviewed** expert-review status.

Teaching references are linked in each review and recommendation, including AHA/ACCF/HRS standardization and electrophysiology definitions plus NCBI Clinical Methods and introductory sinus-rhythm material.

## Weighted scoring and prototype rating

Question weights live in `src/scoringConfig.js` and sum to 100: rhythm 20; rate, P waves, QRS duration, and ST/T findings 15 each; axis and PR interval 10 each. The weights emphasize the organizing rhythm diagnosis and repeatable core measurements. They are provisional educational design choices, are not clinically validated, and must not be used as evidence of clinical competence.

The case percentage is the sum of weights for correct structured answers. Incorrect, blank, and “Not sure” answers earn zero for that item. Free-text interpretation is never scored. Configured prototype difficulties are 580–630 across the six cases; these are provisional educational settings rather than validated difficulty estimates.

The prototype rating begins at 600 and is bounded from 100 to 1200. For the first submission of an unseen case in Assessment Mode only:

```text
expected = 1 / (1 + 10 ^ ((case difficulty - current rating) / 400))
change   = round(80 × (weighted performance - expected))
new      = clamp(current rating + change, 100, 1200)
```

Performance and expected values are expressed from 0 to 1. At the starting rating, the expected performance is 50%; a 100% result changes the rating by +40 and a 0% result by −40. The formula is a learning prototype, not a validated psychometric or clinical rating system.

## Local progress and privacy

Submitted attempts, weighted scores, rating history, and skill summaries are stored in browser `localStorage`. Records remain on the current browser/device and do not sync elsewhere. Existing version-one records are read without rewriting or discarding their attempts. Completed attempts remain in history even when rating falls.

Rating eligibility is tracked separately by stable case ID. An unseen case can affect rating only when first submitted in Assessment Mode. Once any attempt on that case exposes its answer key—Learning Mode or Assessment Mode—every later attempt on that case is practice-only. Duplicate attempt identifiers are ignored.

The progress panel includes a confirmed reset control. If storage is missing, corrupt, blocked, or full, the case remains usable and shows a warning that progress may not persist.

The dashboard separately shows the current prototype rating, number of independently rated assessments, number of guided or practice attempts, mode-labelled score history, rating history, and skills needing more practice. Guided and repeat-case results remain visually labelled as practice; increases in these scores are not presented as independent improvement.

Progress exists only in this browser on this device. It does not sync, and clearing browser/site data may permanently remove it.

### Local progress backup and restore

The View progress page can download a versioned `tete-progress-backup` JSON file containing the current rating, submitted attempts, structured responses when recorded, and the per-case answer-exposure history that protects rating eligibility. Backups remain local—there are no accounts, uploads, or cloud storage. Because the file contains learning records, learners should keep it private.

Restore accepts version 1 backups up to 1 MB. Tete parses imported content strictly as JSON data, validates the envelope, progress version, rating bounds, attempt and case IDs, question and skill IDs, answer values, dates, and duplicate attempt IDs, then shows the attempt count and rating before asking for confirmation. The current record is not changed on validation or storage failure. The confirmation view also provides a one-click backup of current progress before replacement. Older valid version-one records without stored response values remain supported; fields that never existed cannot be reconstructed.

## Tests

```bash
npm test
npm run build
```

The automated tests cover weighted results; guided versus rated attempts; answer exposure; independent eligibility for original and variant IDs; duplicate protection; rating bounds; serialization persistence; old-record preservation across app versions; corrupt storage; reset behavior; stable IDs; waveform/rate/rhythm/interval answer-key consistency; teaching support; topic names and synonyms; empty and unmatched searches; topic-to-case mappings; mode/library/focused-case route parsing (including the legacy entry); new-learner and no-miss recommendations; recent-miss selection; weight tie-breaking; mistake ordering and stored answers; legacy mistake records; empty mistake history; review labels; and correct, incomplete, contradictory, negated, uncertain, blank, and unrecognised written interpretations. Backup tests cover export/restore round trips, older records without response snapshots, rating-protection preservation, malformed and unsupported files, oversized files, unknown IDs, invalid response values, and storage failures. They also verify that generating or opening mistake review does not mutate progress, duplicate attempt identifiers cannot add a completion or rating change, feedback review cannot alter attempts or rating, and feedback flags use separate local storage. Production verification additionally checks generated PWA assets and service-worker-backed offline navigation.

Step 6 production UI checks covered a 375 × 812 viewport, single-column reflow, keyboard traversal, visible focus (including the skip link), accessible form names, horizontal keyboard-focusable ECG scrolling, and focus/status announcement after submission. The browser harness did not expose a reliable native 200% zoom control; the narrower mobile reflow passed, but an explicit 200% browser-zoom check remains in the pre-study manual checklist. The local two-build PWA update test passed; it should still be repeated on the intended HTTPS staging deployment because server/CDN cache headers are not represented by Vite preview.

## Disclaimer

For education only. Not for clinical diagnosis.
