import { useEffect, useId, useState } from 'react'

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

function Question({ question, value, onChange, hintShown, onHint }) {
  return <fieldset className="question-card"><legend>{question.label}</legend><label htmlFor={question.id}>Choose the best finding</label><select id={question.id} value={value} onChange={(event) => onChange(question.id, event.target.value)}><option value="">Select an answer</option>{question.options.map((option) => <option key={option}>{option}</option>)}<option>Not sure</option></select><button className="hint-button" type="button" onClick={() => onHint(question.id)} aria-expanded={hintShown}>{hintShown ? 'Hide hint' : 'Show hint'}</button>{hintShown && <p className="hint"><strong>Try this:</strong> {question.hint}</p>}</fieldset>
}

function Sources() {
  return <aside className="sources" aria-labelledby="sources-title"><h3 id="sources-title">Teaching references</h3><ul><li><a href="https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180200" target="_blank" rel="noreferrer">AHA/ACCF/HRS: ECG technology and standardization (Kligfield et al., 2007)</a> — recording calibration and interval measurement.</li><li><a href="https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.108.191095" target="_blank" rel="noreferrer">AHA/ACCF/HRS: Intraventricular conduction disturbances (Surawicz et al., 2009)</a> — adult QRS duration and frontal axis definitions.</li><li><a href="https://www.ncbi.nlm.nih.gov/books/NBK354/" target="_blank" rel="noreferrer">Clinical Methods: Electrocardiography (NCBI Bookshelf)</a> — P-wave, PR interval, and QRS fundamentals.</li></ul><p>Thresholds vary with age, sex, population, and measurement method. This introductory case uses commonly taught adult reference ranges and fixed generated measurements.</p></aside>
}

function Results({ answers, reasoning, onRevise }) {
  const correctCount = questions.filter((q) => answers[q.id] === q.answer).length
  return <section className="results" aria-labelledby="results-title" aria-live="polite"><div className="results-summary"><p className="kicker">Review and improve</p><h2 id="results-title">Your guided review</h2><p>{correctCount} of {questions.length} structured findings matched the answer key. This is practice, not a grade.</p><button type="button" className="secondary-button" onClick={onRevise}>Revise answers</button></div><div className="feedback-list">{questions.map((question) => { const correct = answers[question.id] === question.answer; return <article className={`feedback ${correct ? 'correct' : 'review'}`} key={question.id}><p className="feedback-status">{correct ? '✓ Matches' : '↻ Review'}</p><h3>{question.label}</h3><p><strong>Your answer:</strong> {answers[question.id] || 'Not answered'}</p><p><strong>Correct finding:</strong> {question.answer}</p><p>{question.explanation}</p></article> })}</div><article className="reasoning-review"><h3>Your interpretation</h3><p>{reasoning || 'No explanation was entered.'}</p><p className="notice">Tete does not evaluate free-text reasoning yet. Compare your explanation with the structured findings above.</p></article><Sources /></section>
}

function Practice() {
  const [answers, setAnswers] = useState({}); const [hints, setHints] = useState({}); const [reasoning, setReasoning] = useState(''); const [submitted, setSubmitted] = useState(false)
  const updateAnswer = (id, value) => setAnswers((current) => ({ ...current, [id]: value }))
  const toggleHint = (id) => setHints((current) => ({ ...current, [id]: !current[id] }))
  const submit = (event) => { event.preventDefault(); setSubmitted(true); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const revise = () => { setSubmitted(false); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  return <main className="case-page"><a className="back-link" href="#home"><span aria-hidden="true">←</span> Back to home</a><header className="case-header"><div><p className="kicker">Case 01 · Foundations</p><h1>Read a normal ECG systematically.</h1></div><p>Work through each finding before naming the rhythm. Hints guide your method without giving away the answer.</p></header><EcgPanel />{submitted ? <Results answers={answers} reasoning={reasoning} onRevise={revise} /> : <form className="case-form" onSubmit={submit}><div className="form-intro"><p className="kicker">Observe, then reason</p><h2>What do you see?</h2><p>You can change any answer before submitting. Choose “Not sure” whenever you need it.</p></div><div className="question-grid">{questions.map((question) => <Question key={question.id} question={question} value={answers[question.id] || ''} onChange={updateAnswer} hintShown={Boolean(hints[question.id])} onHint={toggleHint} />)}</div><div className="explanation-card"><label htmlFor="reasoning"><strong>Explain your interpretation</strong><span>Describe how the findings support your conclusion.</span></label><textarea id="reasoning" rows="6" value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder="I think this ECG shows… because…" /></div><div className="submit-row"><p>Structured answers receive deterministic feedback. Free text is saved for comparison but is not evaluated.</p><button className="primary-button" type="submit">Submit for review <span aria-hidden="true">→</span></button></div></form>}</main>
}

export default function App() {
  const getPage = () => window.location.hash === '#practice' ? 'practice' : 'home'; const [page, setPage] = useState(getPage)
  useEffect(() => { const handleHashChange = () => setPage(getPage()); window.addEventListener('hashchange', handleHashChange); return () => window.removeEventListener('hashchange', handleHashChange) }, [])
  return <div className="site-shell"><header className="site-header"><a className="brand" href="#home" aria-label="Tete home"><span aria-hidden="true">T</span>Tete</a><p>ECG learning, thoughtfully guided.</p></header>{page === 'practice' ? <Practice /> : <Home />}<footer><p>For education only. Not for clinical diagnosis.</p></footer></div>
}
