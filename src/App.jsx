import { useEffect, useId, useState } from 'react'
import { SCORING_CONFIG, WEIGHT_RATIONALE } from './scoringConfig.js'
import { emptyProgress, loadProgress, recordAttempt, resetProgress, saveProgress, scoreAnswers, skillsNeedingPractice } from './progress.js'

const CASE_ID = 'normal-sinus-rhythm-01'

const learningSteps = [
  ['01', 'Observe', 'Notice the rhythm, rate, and key visual details.'],
  ['02', 'Reason', 'Work through what the pattern could mean.'],
  ['03', 'Explain', 'Put your interpretation into your own words.'],
  ['04', 'Receive guidance', 'Get focused prompts that support your thinking.'],
  ['05', 'Revise', 'Refine your explanation with new insight.'],
  ['06', 'Improve', 'Build a clearer, more reliable approach over time.'],
]

const questions = [
  { id: 'rate', label: 'Rate', answer: '75 bpm', options: ['About 50 bpm', '75 bpm', 'About 110 bpm'], hint: 'At 25 mm/s, one large box is 0.2 seconds. Count the large boxes between R waves, then use 300 ÷ that count.', explanation: 'R waves are four large boxes apart: 300 ÷ 4 = 75 bpm. The generated RR interval is exactly 800 ms.' },
  { id: 'rhythm', label: 'Rhythm', answer: 'Regular sinus rhythm', options: ['Regular sinus rhythm', 'Atrial fibrillation', 'Regular junctional rhythm'], hint: 'Compare consecutive RR intervals, then look for a consistent P wave before every QRS and a QRS after every P wave.', explanation: 'RR intervals are equal. Upright P waves precede every QRS in lead II with a fixed PR interval, supporting sinus rhythm.' },
  { id: 'axis', label: 'Frontal QRS axis', answer: 'Normal axis', options: ['Left axis deviation', 'Normal axis', 'Right axis deviation'], hint: 'Use the quadrant method: inspect the net QRS direction in leads I and aVF.', explanation: 'The QRS is predominantly positive in both lead I and aVF. The modeled mean frontal axis is approximately +60°, within the adult normal range.' },
  { id: 'pWaves', label: 'P waves', answer: 'Present, sinus morphology, one before each QRS', options: ['Absent', 'Present, sinus morphology, one before each QRS', 'Present but unrelated to QRS complexes'], hint: 'Lead II usually makes sinus P waves easy to see. Check their direction, shape, and relationship to each QRS.', explanation: 'Uniform upright P waves are visible in lead II before every QRS; they are negative in aVR, as expected for a sinus vector.' },
  { id: 'pr', label: 'PR interval', answer: '160 ms (normal)', options: ['80 ms (short)', '160 ms (normal)', '240 ms (prolonged)'], hint: 'Measure from the start of the P wave to the start of the QRS. Each small box is 40 ms at 25 mm/s.', explanation: 'The P onset to QRS onset spans four small boxes: 4 × 40 ms = 160 ms, within the commonly used 120–200 ms range.' },
  { id: 'qrs', label: 'QRS duration', answer: '80 ms (narrow)', options: ['80 ms (narrow)', '120 ms (wide)', '160 ms (wide)'], hint: 'Measure from the first QRS deflection to the end of the S wave. Each small box represents 40 ms.', explanation: 'The generated QRS spans two small boxes: 2 × 40 ms = 80 ms, which is narrow.' },
  { id: 'stt', label: 'ST/T findings', answer: 'No significant ST/T abnormality', options: ['ST elevation', 'ST depression with T-wave inversion', 'No significant ST/T abnormality'], hint: 'Use the TP segment as the baseline. Compare it with the ST segment, then inspect T-wave direction in leads with upright QRS complexes.', explanation: 'ST segments return to the modeled baseline without displacement. T waves are upright in the expected leads and inverted only in aVR.' },
]

const leadMorphology = {
  I: [0.12, -0.04, 0.72, -0.14, 0.25], II: [0.16, -0.05, 0.95, -0.16, 0.34], III: [0.08, -0.03, 0.42, -0.12, 0.18],
  aVR: [-0.1, 0.03, -0.7, 0.12, -0.25], aVL: [0.07, -0.02, 0.32, -0.08, 0.12], aVF: [0.13, -0.04, 0.78, -0.14, 0.28],
  V1: [0.08, -0.02, 0.18, -0.7, -0.12], V2: [0.11, -0.04, 0.35, -0.65, 0.14], V3: [0.12, -0.04, 0.55, -0.48, 0.22],
  V4: [0.13, -0.05, 0.9, -0.25, 0.3], V5: [0.12, -0.04, 1.0, -0.14, 0.3], V6: [0.1, -0.03, 0.82, -0.08, 0.25],
}

function waveformPath(lead, y, width, offset = 0) {
  const [p, q, r, s, t] = leadMorphology[lead]
  let d = `M 0 ${y}`
  for (let beat = offset; beat < width + 100; beat += 100) {
    const points = [[beat, 0], [beat + 2, -p * 20], [beat + 5, -p * 50], [beat + 8, -p * 20], [beat + 10, 0], [beat + 20, 0], [beat + 21, -q * 50], [beat + 24, -r * 50], [beat + 27, -s * 50], [beat + 30, 0], [beat + 45, 0], [beat + 50, -t * 28], [beat + 55, -t * 50], [beat + 60, -t * 28], [beat + 68, 0], [beat + 100, 0]]
    d += points.map(([x, amp]) => ` L ${x} ${y + amp}`).join('')
  }
  return d
}

function EcgPanel() {
  const titleId = useId()
  const rows = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]
  return (
    <figure className="ecg-figure" aria-labelledby={titleId}>
      <figcaption><div><span className="case-tag">Synthetic teaching ECG</span><strong id={titleId}>12-lead resting ECG</strong></div><span>25 mm/s · 10 mm/mV</span></figcaption>
      <div className="ecg-scroll" tabIndex="0" aria-label="Scrollable synthetic 12-lead ECG tracing">
        <svg className="ecg" viewBox="0 0 1000 520" role="img" aria-label="Synthetic ECG showing regular normal sinus rhythm at 75 beats per minute">
          <defs><pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#efc7c0" strokeWidth="0.55" /></pattern><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="url(#smallGrid)"/><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#db8f84" strokeWidth="0.8" /></pattern><clipPath id="plotClip"><rect x="0" y="0" width="1000" height="520" /></clipPath></defs>
          <rect width="1000" height="520" fill="#fffaf8"/><rect width="1000" height="520" fill="url(#grid)"/>
          <g clipPath="url(#plotClip)">{rows.flatMap((row, rowIndex) => row.map((lead, columnIndex) => { const x = columnIndex * 250; const y = 80 + rowIndex * 105; return <g key={lead} transform={`translate(${x},0)`}><text x="9" y={y - 34} className="lead-label">{lead}</text><path d={waveformPath(lead, y, 250, 34)} className="trace" /></g> }))}<text x="9" y="372" className="lead-label">II rhythm strip</text><path d={waveformPath('II', 430, 1000, 34)} className="trace" /><path d="M 10 500 L 10 450 L 35 450 L 35 500 L 55 500" className="calibration" /><text x="65" y="490" className="calibration-label">1 mV</text></g>
        </svg>
      </div>
      <p className="figure-note">Purpose-built educational waveform—not a patient recording. Horizontal grid: 1 small box = 40 ms; vertical calibration pulse = 10 mm (1 mV).</p>
    </figure>
  )
}

function Home() {
  return <main><section className="hero" aria-labelledby="page-title"><div className="eyebrow"><span aria-hidden="true">♥</span> Learn ECGs by thinking them through</div><h1 id="page-title">Tete <span>— ECG Learning Coach</span></h1><p className="intro">Guided ECG practice that helps health-science students slow down, notice the details, and explain their reasoning—not just memorise an answer.</p><a className="primary-button" href="#practice">Start practice <span aria-hidden="true">→</span></a></section><section className="cycle" aria-labelledby="cycle-title"><div className="section-heading"><p className="kicker">A repeatable approach</p><h2 id="cycle-title">The learning cycle</h2><p>Each practice session follows the same deliberate path.</p></div><ol className="steps">{learningSteps.map(([number, title, description]) => <li key={number}><span className="step-number" aria-hidden="true">{number}</span><div><h3>{title}</h3><p>{description}</p></div></li>)}</ol></section></main>
}

function Question({ question, value, onChange, hintShown, onHint, hintsAllowed }) {
  return <fieldset className="question-card"><legend>{question.label}</legend><label htmlFor={question.id}>Choose the best finding</label><select id={question.id} value={value} onChange={(event) => onChange(question.id, event.target.value)}><option value="">Select an answer</option>{question.options.map((option) => <option key={option}>{option}</option>)}<option>Not sure</option></select>{hintsAllowed && <><button className="hint-button" type="button" onClick={() => onHint(question.id)} aria-expanded={hintShown}>{hintShown ? 'Hide hint' : 'Show hint'}</button>{hintShown && <p className="hint"><strong>Try this:</strong> {question.hint}</p>}</>}</fieldset>
}

function Sources() {
  return <aside className="sources" aria-labelledby="sources-title"><h3 id="sources-title">Teaching references</h3><ul><li><a href="https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180200" target="_blank" rel="noreferrer">AHA/ACCF/HRS: ECG technology and standardization (Kligfield et al., 2007)</a> — recording calibration and interval measurement.</li><li><a href="https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.108.191095" target="_blank" rel="noreferrer">AHA/ACCF/HRS: Intraventricular conduction disturbances (Surawicz et al., 2009)</a> — adult QRS duration and frontal axis definitions.</li><li><a href="https://www.ncbi.nlm.nih.gov/books/NBK354/" target="_blank" rel="noreferrer">Clinical Methods: Electrocardiography (NCBI Bookshelf)</a> — P-wave, PR interval, and QRS fundamentals.</li></ul><p>Thresholds vary with age, sex, population, and measurement method. This introductory case uses commonly taught adult reference ranges and fixed generated measurements.</p></aside>
}

function ProgressPanel({ progress, storageMessage, onReset }) {
  const [confirming, setConfirming] = useState(false)
  const weakSkills = skillsNeedingPractice(progress.attempts, questions)
  const ratedAttempts = progress.attempts.filter((attempt) => attempt.rated)
  return <section className="progress-panel" aria-labelledby="progress-title"><div className="progress-top"><div><p className="kicker">Stored on this device</p><h2 id="progress-title">Learning progress</h2></div><div className="rating-block"><span>Prototype rating</span><strong>{progress.rating}</strong></div></div><p className="device-note">Records stay in this browser and do not sync across devices.</p>{storageMessage && <p className="storage-warning" role="status">{storageMessage}</p>}<div className="progress-grid"><div><h3>Case scores</h3>{progress.attempts.length ? <ol className="history-list">{[...progress.attempts].reverse().map((attempt) => <li key={attempt.id}><span>{attempt.mode === 'rated' ? 'Assessment' : 'Guided'} · {attempt.percentage}%</span><small>{attempt.classification === 'rated' ? 'Rated' : 'Practice record'}</small></li>)}</ol> : <p>No attempts recorded yet.</p>}</div><div><h3>Rating history</h3>{ratedAttempts.length ? <ol className="history-list"><li><span>Starting rating</span><small>{SCORING_CONFIG.startingRating}</small></li>{ratedAttempts.map((attempt) => <li key={attempt.id}><span>{attempt.ratingBefore} → {attempt.ratingAfter}</span><small>{attempt.ratingDelta >= 0 ? '+' : ''}{attempt.ratingDelta}</small></li>)}</ol> : <p>Rating starts at {SCORING_CONFIG.startingRating}. Complete a first assessment to update it.</p>}</div><div><h3>Skills needing practice</h3>{weakSkills.length ? <ul className="skill-list">{weakSkills.map((skill) => <li key={skill.label}>{skill.label} <span>{skill.correct}/{skill.total} correct</span></li>)}</ul> : <p>{progress.attempts.length ? 'No skill is below 80% yet.' : 'Complete a case to see skill suggestions.'}</p>}</div></div>{confirming ? <div className="reset-confirm" role="group" aria-label="Confirm reset progress"><p>Reset all local attempts and return the rating to {SCORING_CONFIG.startingRating}?</p><button type="button" className="danger-button" onClick={() => { onReset(); setConfirming(false) }}>Yes, reset progress</button><button type="button" className="text-button" onClick={() => setConfirming(false)}>Cancel</button></div> : <button type="button" className="text-button danger-text" onClick={() => setConfirming(true)}>Reset progress</button>}</section>
}

function ModeChooser({ hasRatedAttempt, onChoose }) {
  return <section className="mode-section" aria-labelledby="mode-title"><p className="kicker">Choose your approach</p><h2 id="mode-title">How would you like to practise?</h2><div className="mode-grid"><article><h3>Guided Practice</h3><p>Use hints, revise after feedback, and save the score without changing your rating.</p><button type="button" className="secondary-button" onClick={() => onChoose('guided')}>Start guided practice</button></article><article><h3>Rated Assessment</h3><p>Hints stay hidden until submission. Only your first assessment of this case can change the prototype rating.</p>{hasRatedAttempt && <p className="mode-notice">Rating already used for this case. Another attempt will be saved as practice.</p>}<button type="button" className="primary-button" onClick={() => onChoose('rated')}>{hasRatedAttempt ? 'Take another practice assessment' : 'Start rated assessment'}</button></article></div></section>
}

function Results({ answers, reasoning, mode, attempt, onRevise, onNewAttempt }) {
  const score = scoreAnswers(questions, answers, CASE_ID)
  return <section className="results" aria-labelledby="results-title" aria-live="polite"><div className="results-summary"><p className="kicker">Review and improve</p><h2 id="results-title">{score.percentage}% case score</h2><p>{score.earned} of {score.total} weighted points from structured answers. Free text is not scored.</p>{attempt.rated ? <div className="rating-result"><strong>Rating {attempt.ratingBefore} → {attempt.ratingAfter} ({attempt.ratingDelta >= 0 ? '+' : ''}{attempt.ratingDelta})</strong><p>Expected score {attempt.expectedPercentage}% at rating {attempt.ratingBefore} versus case difficulty {SCORING_CONFIG.cases[CASE_ID].difficulty}. Change = {SCORING_CONFIG.kFactor} × ({score.percentage}% performance − {attempt.expectedPercentage}% expected), rounded and bounded to {SCORING_CONFIG.minimumRating}–{SCORING_CONFIG.maximumRating}.</p></div> : <div className="practice-result"><strong>Recorded as practice</strong><p>{mode === 'guided' ? 'Guided Practice never changes the rating.' : 'Only the first Rated Assessment for this case changes the rating; later attempts are practice.'}</p></div>}<div className="result-actions">{mode === 'guided' && <button type="button" className="secondary-button" onClick={onRevise}>Revise answers</button>}<button type="button" className="secondary-button" onClick={onNewAttempt}>Choose another mode</button></div></div><div className="feedback-list">{questions.map((question) => { const correct = answers[question.id] === question.answer; return <article className={`feedback ${correct ? 'correct' : 'review'}`} key={question.id}><p className="feedback-status">{correct ? '✓ Matches' : '↻ Review'}</p><h3>{question.label} <span className="weight-label">{SCORING_CONFIG.cases[CASE_ID].weights[question.id]} points</span></h3><p><strong>Your answer:</strong> {answers[question.id] || 'Not answered'}</p><p><strong>Correct finding:</strong> {question.answer}</p><p>{question.explanation}</p></article> })}</div><article className="reasoning-review"><h3>Your interpretation</h3><p>{reasoning || 'No explanation was entered.'}</p><p className="notice">Tete does not evaluate or score free-text reasoning. Compare your explanation with the structured findings above.</p></article><Sources /></section>
}

function Practice() {
  let storage = null
  let storageAccessMessage = ''
  try { storage = typeof window === 'undefined' ? null : window.localStorage } catch { storageAccessMessage = 'Browser storage is unavailable. You can continue, but progress will not persist.' }
  const loaded = storageAccessMessage ? { progress: emptyProgress(), message: storageAccessMessage } : loadProgress(storage)
  const [progress, setProgress] = useState(loaded.progress)
  const [storageMessage, setStorageMessage] = useState(loaded.message || '')
  const [mode, setMode] = useState(null)
  const [answers, setAnswers] = useState({}); const [hints, setHints] = useState({}); const [reasoning, setReasoning] = useState(''); const [submitted, setSubmitted] = useState(false); const [resultAttempt, setResultAttempt] = useState(null)
  const [attemptId, setAttemptId] = useState(() => crypto.randomUUID())
  const updateAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }))
  const toggleHint = (id) => setHints((current) => ({ ...current, [id]: !current[id] }))
  const startMode = (selectedMode) => { setMode(selectedMode); setAnswers({}); setHints({}); setReasoning(''); setSubmitted(false); setResultAttempt(null); setAttemptId(crypto.randomUUID()); setTimeout(() => document.querySelector('.case-form')?.scrollIntoView({ behavior: 'smooth' }), 0) }
  const submit = (event) => {
    event.preventDefault()
    if (submitted) return
    const score = scoreAnswers(questions, answers, CASE_ID)
    const correctness = Object.fromEntries(questions.map((question) => [question.id, answers[question.id] === question.answer]))
    const recorded = recordAttempt(progress, { id: attemptId, caseId: CASE_ID, mode, percentage: score.percentage, earned: score.earned, total: score.total, correctness, createdAt: new Date().toISOString() })
    setProgress(recorded.progress); setResultAttempt(recorded.attempt); setSubmitted(true)
    const saved = saveProgress(storage, recorded.progress); if (!saved.ok) setStorageMessage(saved.message)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
  const revise = () => { setSubmitted(false); setAttemptId(crypto.randomUUID()); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const reset = () => { const result = resetProgress(storage); setProgress(result.progress); setStorageMessage(result.message || 'Progress reset on this device.'); setMode(null); setSubmitted(false); setResultAttempt(null) }
  const hasRatedAttempt = progress.attempts.some((attempt) => attempt.caseId === CASE_ID && attempt.rated)
  return <main className="case-page"><a className="back-link" href="#home"><span aria-hidden="true">←</span> Back to home</a><header className="case-header"><div><p className="kicker">Case 01 · Foundations</p><h1>Read a normal ECG systematically.</h1></div><p>Choose guided learning or a rating-eligible first assessment. Every submitted attempt remains in local history, even when the rating falls.</p></header><ProgressPanel progress={progress} storageMessage={storageMessage} onReset={reset} /><EcgPanel />{!mode ? <ModeChooser hasRatedAttempt={hasRatedAttempt} onChoose={startMode} /> : submitted && resultAttempt ? <Results answers={answers} reasoning={reasoning} mode={mode} attempt={resultAttempt} onRevise={revise} onNewAttempt={() => { setMode(null); setSubmitted(false) }} /> : <form className="case-form" onSubmit={submit}><div className="form-intro"><p className="kicker">{mode === 'rated' ? 'Rated Assessment' : 'Guided Practice'}</p><h2>What do you see?</h2><p>{mode === 'rated' ? 'Hints and answers remain hidden until submission. You may edit choices before submitting.' : 'Hints are available and you can revise after feedback without a rating penalty.'} Choose “Not sure” whenever you need it.</p></div><div className="question-grid">{questions.map((question) => <Question key={question.id} question={question} value={answers[question.id] || ''} onChange={updateAnswer} hintShown={Boolean(hints[question.id])} onHint={toggleHint} hintsAllowed={mode === 'guided'} />)}</div><div className="explanation-card"><label htmlFor="reasoning"><strong>Explain your interpretation</strong><span>Describe how the findings support your conclusion. This text is not scored.</span></label><textarea id="reasoning" rows="6" value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="I think this ECG shows… because…" /></div><div className="submit-row"><p>Only structured answers contribute to the weighted percentage.</p><button className="primary-button" type="submit">Submit {mode === 'rated' ? 'assessment' : 'practice'} <span aria-hidden="true">→</span></button></div></form>}<details className="scoring-details"><summary>How scoring is configured</summary><p>These are provisional educational weights, not clinically validated measures of competence.</p><table><thead><tr><th>Skill</th><th>Weight</th><th>Rationale</th></tr></thead><tbody>{WEIGHT_RATIONALE.map(([skill, weight, rationale]) => <tr key={skill}><td>{skill}</td><td>{weight}%</td><td>{rationale}</td></tr>)}</tbody></table></details></main>
}

export default function App() {
  const getPage = () => window.location.hash === '#practice' ? 'practice' : 'home'; const [page, setPage] = useState(getPage)
  useEffect(() => { const handleHashChange = () => setPage(getPage()); window.addEventListener('hashchange', handleHashChange); return () => window.removeEventListener('hashchange', handleHashChange) }, [])
  return <div className="site-shell"><header className="site-header"><a className="brand" href="#home" aria-label="Tete home"><span aria-hidden="true">T</span>Tete</a><p>ECG learning, thoughtfully guided.</p></header>{page === 'practice' ? <Practice /> : <Home />}<footer><p>For education only. Not for clinical diagnosis.</p></footer></div>
}
