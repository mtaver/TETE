# Tete — ECG Learning Coach

Tete is a lightweight learning interface for health-science students to practise a deliberate ECG interpretation cycle: observe, reason, explain, receive guidance, revise, and improve.

The application currently includes the responsive home page and one guided normal sinus rhythm practice case. The case uses a purpose-built SVG ECG with fixed, auditable measurements rather than an AI-generated image or patient recording.

Learners can work through rate, rhythm, axis, P waves, PR interval, QRS duration, and ST/T findings; request progressive hints; explain their reasoning; revise answers; and receive deterministic teaching feedback. Free-text explanations are displayed for self-comparison but are not evaluated or scored.

Step 3 adds two explicit modes:

- **Guided Practice** provides hints and post-feedback revision without rating changes.
- **Rated Assessment** hides hints and answers until submission. Only the first assessment of the current case changes the prototype rating; later attempts are labelled and recorded as practice.

The project does not include accounts, cloud sync, uploads, or live AI.

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

## Case validation

The synthetic trace is generated from fixed parameters in `src/App.jsx`: 75 bpm (800 ms RR), 160 ms PR, 80 ms QRS, an approximately +60° frontal QRS axis, sinus P-wave morphology, and isoelectric ST segments. At 25 mm/s, one small box represents 40 ms. Lead amplitudes are explicitly defined to produce a positive net QRS in I and aVF, a negative aVR, and normal precordial R-wave progression.

Teaching references are linked in the case review, including the AHA/ACCF/HRS ECG standardization statements and NCBI Clinical Methods.

## Weighted scoring and prototype rating

Question weights live in `src/scoringConfig.js` and sum to 100: rhythm 20; rate, P waves, QRS duration, and ST/T findings 15 each; axis and PR interval 10 each. The weights emphasize the organizing rhythm diagnosis and repeatable core measurements. They are provisional educational design choices, are not clinically validated, and must not be used as evidence of clinical competence.

The case percentage is the sum of weights for correct structured answers. Incorrect, blank, and “Not sure” answers earn zero for that item. Free-text interpretation is never scored.

The prototype rating begins at 600 and is bounded from 100 to 1200. This case has configured difficulty 600. For the first Rated Assessment only:

```text
expected = 1 / (1 + 10 ^ ((case difficulty - current rating) / 400))
change   = round(80 × (weighted performance - expected))
new      = clamp(current rating + change, 100, 1200)
```

Performance and expected values are expressed from 0 to 1. At the starting rating, the expected performance is 50%; a 100% result changes the rating by +40 and a 0% result by −40. The formula is a learning prototype, not a validated psychometric or clinical rating system.

## Local progress and privacy

Submitted attempts, weighted scores, rating history, and skill summaries are stored in browser `localStorage`. Records remain on the current browser/device and do not sync elsewhere. Completed attempts remain in history even when rating falls. Duplicate attempt identifiers are ignored, and the single-case first-assessment rule prevents repeated rating gains after answers have been revealed.

The progress panel includes a confirmed reset control. If storage is missing, corrupt, blocked, or full, the case remains usable and shows a warning that progress may not persist.

## Tests

```bash
npm test
npm run build
```

The automated tests cover weighted all-correct, mixed, all-incorrect, and “Not sure” results; guided versus rated attempts; duplicate submission protection; rating bounds; serialization persistence; corrupt storage; repeated-case protection; and reset behavior.

## Disclaimer

For education only. Not for clinical diagnosis.
