# Tete content review record

This document is the review checklist for the six schematic educational cases in Tete. It separates what software can verify from judgments that require an ECG educator or clinician. It is not a clinical validation record.

## Review status

| Case | Stable ID | Automated consistency | Expert approval |
| --- | --- | --- | --- |
| Case 01 | `normal-sinus-rhythm-01` | Passing in the current test suite | **Not yet reviewed** |
| Case 02 | `sinus-bradycardia-01` | Passing in the current test suite | **Not yet reviewed** |
| Case 03 | `sinus-tachycardia-01` | Passing in the current test suite | **Not yet reviewed** |
| Case 04 | `normal-sinus-rhythm-02` | Passing in the current test suite | **Not yet reviewed** |
| Case 05 | `sinus-bradycardia-02` | Passing in the current test suite | **Not yet reviewed** |
| Case 06 | `sinus-tachycardia-02` | Passing in the current test suite | **Not yet reviewed** |

“Passing” means that programmed measurements and answer strings agree. It does not mean that an expert has approved the morphology, teaching language, difficulty, or suitability for learners.

## Shared construction and teaching content

All cases are code-generated SVG schematics, not patient recordings and not AI-generated images. They display leads I, II, III, aVR, aVL, aVF, V1–V6, a lead-II rhythm strip, a 1 mV calibration pulse, 25 mm/s paper speed, and 10 mm/mV gain. At that speed, one small horizontal box represents 40 ms. All six model a +60° frontal QRS axis, upright sinus P waves in lead II and negative P waves in aVR, isoelectric ST segments, and expected T-wave direction. Cases 01–03 use a 160 ms PR interval and 80 ms QRS; Cases 04–06 deliberately vary normal-range intervals as documented below.

The seven structured findings are rate, rhythm, frontal QRS axis, P waves, PR interval, QRS duration, and ST/T findings. Every question includes “Not sure.” Shared hints prompt a measurement or observation before naming the answer. Shared explanations state the measurement method and the expected finding. Free-text reasoning is displayed but is neither scored nor evaluated.

### Case 01 — normal-rate sinus rhythm

- Waveform: 75 bpm, 800 ms RR interval, four large boxes between R waves; regular sinus P–QRS relationship.
- Answer key: 75 bpm; regular sinus rhythm; normal axis; sinus P waves before every QRS; PR 160 ms (normal); QRS 80 ms (narrow); no significant ST/T abnormality.
- Hint review: rate hint asks for `300 ÷ large boxes`; rhythm, axis, P-wave, PR, QRS, and ST/T hints use the shared observation-first sequence.
- Explanation review: rate explanation states `300 ÷ 4 = 75 bpm` and 800 ms RR; the remaining explanations match the shared programmed morphology and intervals.
- Expert approval: **Not yet reviewed**.

### Case 02 — sinus bradycardia

- Waveform: 50 bpm, 1200 ms RR interval, six large boxes between R waves; otherwise the same regular sinus construction.
- Answer key: 50 bpm; regular sinus bradycardia; normal axis; sinus P waves before every QRS; PR 160 ms (normal); QRS 80 ms (narrow); no significant ST/T abnormality.
- Hint review: the same progressive hints are used; the rhythm hint deliberately asks learners to establish regularity and sinus origin before classifying the rate.
- Explanation review: rate explanation states `300 ÷ 6 = 50 bpm` and 1200 ms RR; rhythm explanation connects the sinus relationship and rate to the label.
- Expert approval: **Not yet reviewed**.

### Case 03 — sinus tachycardia

- Waveform: 120 bpm, 500 ms RR interval, 2.5 large boxes between R waves; otherwise the same regular sinus construction.
- Answer key: 120 bpm; regular sinus tachycardia; normal axis; sinus P waves before every QRS; PR 160 ms (normal); QRS 80 ms (narrow); no significant ST/T abnormality.
- Hint review: the rate hint supports measurement at closer spacing without disclosing 120 bpm; the remaining hints use the shared observation-first sequence.
- Explanation review: rate explanation states `300 ÷ 2.5 = 120 bpm` and 500 ms RR; rhythm explanation connects the sinus relationship and rate to the label.
- Expert approval: **Not yet reviewed**.

### Case 04 — normal-rate sinus rhythm variant

- Waveform: 60 bpm, 1000 ms RR interval, five large boxes between R waves; regular sinus P–QRS relationship; PR 120 ms; QRS 100 ms.
- Answer key: 60 bpm; regular sinus rhythm; normal axis; sinus P waves before every QRS; PR 120 ms (normal); QRS 100 ms (narrow); no significant ST/T abnormality.
- Hint review: progressive shared hints ask learners to measure rate and intervals before classifying them and do not disclose the answer.
- Explanation review: rate explanation states `300 ÷ 5 = 60 bpm` and 1000 ms RR; interval explanations state three small boxes for PR and 2.5 small boxes for QRS.
- Expert approval: **Not yet reviewed**.

### Case 05 — sinus bradycardia variant

- Waveform: 40 bpm, 1500 ms RR interval, 7.5 large boxes between R waves; regular sinus P–QRS relationship; PR 200 ms; QRS 100 ms.
- Answer key: 40 bpm; regular sinus bradycardia; normal axis; sinus P waves before every QRS; PR 200 ms (normal); QRS 100 ms (narrow); no significant ST/T abnormality.
- Hint review: progressive shared hints establish regularity and sinus origin before classification and prompt direct measurement without naming the answer.
- Explanation review: rate explanation states `300 ÷ 7.5 = 40 bpm` and 1500 ms RR; interval explanations state five small boxes for PR and 2.5 small boxes for QRS.
- Expert approval: **Not yet reviewed**.

### Case 06 — sinus tachycardia variant

- Waveform: 150 bpm, 400 ms RR interval, two large boxes between R waves; regular sinus P–QRS relationship; PR 120 ms; QRS 100 ms.
- Answer key: 150 bpm; regular sinus tachycardia; normal axis; sinus P waves before every QRS; PR 120 ms (normal); QRS 100 ms (narrow); no significant ST/T abnormality.
- Hint review: progressive shared hints support measurement at close spacing and ask learners to confirm sinus origin before using rate to classify the rhythm.
- Explanation review: rate explanation states `300 ÷ 2 = 150 bpm` and 400 ms RR; interval explanations state three small boxes for PR and 2.5 small boxes for QRS.
- Expert approval: **Not yet reviewed**.

## Sources to review

1. [AHA/ACCF/HRS recommendations for ECG technology and standardization](https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180200) — calibration and interval measurement.
2. [AHA/ACCF/HRS recommendations for ECG terminology](https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180199) — sinus mechanism, P-wave axis, and bradycardia terminology.
3. [Clinical Methods: Electrocardiography](https://www.ncbi.nlm.nih.gov/books/NBK354/) — P wave, PR interval, and QRS fundamentals.
4. [NCBI Bookshelf: Interpret Basic ECG](https://www.ncbi.nlm.nih.gov/books/NBK594493/) — introductory sinus rhythm, bradycardia, and tachycardia teaching.

External links need internet access. Tete includes short original, attributed summaries for offline use. A reviewer should confirm that each summary fairly represents its source and that the linked edition remains appropriate.

## Automated checks versus expert review

`validateCase` and the automated tests check stable/unique IDs, required question IDs, `beatSpacing = 7500 ÷ rate`, `RR = 60000 ÷ rate`, rate/rhythm classification, agreement between configured PR/QRS durations and answer strings, answer-option completeness, teaching support, and pending-review status. Tests also exercise scoring, topic mappings, and progress protections.

Automation does **not** establish that the schematic looks clinically authentic, that every lead’s morphology is pedagogically ideal, that the answer options avoid misconceptions, that the wording is understandable, that the sources are sufficient, or that the content supports competent clinical interpretation. Those decisions require expert review.

## Expert sign-off template

For each case, record reviewer role (not patient information), review date, waveform decision, answer-key decision, hints/explanations decision, source decision, requested changes, and final disposition. Until that record exists, the status remains **Not yet reviewed**.
