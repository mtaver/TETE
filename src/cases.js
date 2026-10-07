export const CASE_SOURCES = {
  standards: { title: 'AHA/ACCF/HRS: ECG technology and standardization', url: 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180200', note: 'Recording calibration and interval measurement.', summary: 'Standard calibration makes timing and voltage measurements comparable: at 25 mm/s each small horizontal box is 40 ms, while 10 mm vertically represents 1 mV.' },
  definitions: { title: 'ACC/AHA/HRS: Electrophysiology definitions', url: 'https://www.ahajournals.org/doi/10.1161/CIRCULATIONAHA.106.180199', note: 'Sinus bradycardia definition and sinus P-wave axis.', summary: 'A sinus mechanism has a consistent atrial activation pattern. In adults, sinus bradycardia is conventionally below 60 bpm, but rate always needs clinical context.' },
  fundamentals: { title: 'Clinical Methods: Electrocardiography', url: 'https://www.ncbi.nlm.nih.gov/books/NBK354/', note: 'P-wave, PR interval, and QRS fundamentals.', summary: 'Measure PR from P onset to QRS onset and QRS from its first to final deflection. A consistent P before every QRS supports an organized atrioventricular relationship.' },
  sinusRhythms: { title: 'NCBI Bookshelf: Interpret Basic ECG', url: 'https://www.ncbi.nlm.nih.gov/books/NBK594493/', note: 'Introductory sinus rhythm, bradycardia, and tachycardia teaching.', summary: 'Sinus bradycardia, normal sinus rhythm, and sinus tachycardia share an organized sinus P–QRS relationship; their introductory distinction is the adult rate range.' },
}

export const leadMorphology = {
  I: [0.12, -0.04, 0.72, -0.14, 0.25], II: [0.16, -0.05, 0.95, -0.16, 0.34], III: [0.08, -0.03, 0.42, -0.12, 0.18],
  aVR: [-0.1, 0.03, -0.7, 0.12, -0.25], aVL: [0.07, -0.02, 0.32, -0.08, 0.12], aVF: [0.13, -0.04, 0.78, -0.14, 0.28],
  V1: [0.08, -0.02, 0.18, -0.7, -0.12], V2: [0.11, -0.04, 0.35, -0.65, 0.14], V3: [0.12, -0.04, 0.55, -0.48, 0.22],
  V4: [0.13, -0.05, 0.9, -0.25, 0.3], V5: [0.12, -0.04, 1.0, -0.14, 0.3], V6: [0.1, -0.03, 0.82, -0.08, 0.25],
}

const addAnswerIds = (questions) => questions.map((question) => {
  const optionIds = question.options.map((_, index) => `${question.id}-${index + 1}`)
  return { ...question, optionIds, answerId: optionIds[question.options.indexOf(question.answer)] }
})

const sharedQuestions = ({ rate, rhythmAnswer, rateOptions, rateExplanation, prMs = 160, prOptions = ['80 ms (short)', '160 ms (normal)', '240 ms (prolonged)'], qrsMs = 80, qrsOptions = ['80 ms (narrow)', '120 ms (wide)', '160 ms (wide)'] }) => addAnswerIds([
  { id: 'rate', label: 'Rate', answer: `${rate} bpm`, options: rateOptions, hint: 'At 25 mm/s, one large box is 0.2 seconds. Count the large boxes between R waves, then use 300 ÷ that count.', explanation: rateExplanation, resource: 'sinusRhythms' },
  { id: 'rhythm', label: 'Rhythm', answer: rhythmAnswer, options: ['Regular sinus bradycardia', 'Regular sinus rhythm', 'Regular sinus tachycardia'], hint: 'Compare consecutive RR intervals, then look for a consistent P wave before every QRS and a QRS after every P wave. Classify the rate last.', explanation: `RR intervals are equal and upright P waves precede every QRS in lead II with a fixed PR interval. The rate makes this ${rhythmAnswer.toLowerCase()}.`, resource: 'definitions' },
  { id: 'axis', label: 'Frontal QRS axis', answer: 'Normal axis', options: ['Left axis deviation', 'Normal axis', 'Right axis deviation'], hint: 'Use the quadrant method: inspect the net QRS direction in leads I and aVF.', explanation: 'The QRS is predominantly positive in both lead I and aVF. The modeled mean frontal axis is approximately +60°, within the adult normal range.', resource: 'standards' },
  { id: 'pWaves', label: 'P waves', answer: 'Present, sinus morphology, one before each QRS', options: ['Absent', 'Present, sinus morphology, one before each QRS', 'Present but unrelated to QRS complexes'], hint: 'Lead II usually makes sinus P waves easy to see. Check their direction, shape, and relationship to each QRS.', explanation: 'Uniform upright P waves are visible in lead II before every QRS; they are negative in aVR, as expected for a sinus vector.', resource: 'definitions' },
  { id: 'pr', label: 'PR interval', answer: `${prMs} ms (normal)`, options: prOptions, hint: 'Measure from the start of the P wave to the start of the QRS. Each small box is 40 ms at 25 mm/s.', explanation: `The P onset to QRS onset spans ${prMs / 40} small boxes: ${prMs / 40} × 40 ms = ${prMs} ms, within the commonly used 120–200 ms range.`, resource: 'fundamentals' },
  { id: 'qrs', label: 'QRS duration', answer: `${qrsMs} ms (narrow)`, options: qrsOptions, hint: 'Measure from the first QRS deflection to the end of the S wave. Each small box represents 40 ms.', explanation: `The generated QRS spans ${qrsMs / 40} small boxes: ${qrsMs / 40} × 40 ms = ${qrsMs} ms, which is narrow.`, resource: 'fundamentals' },
  { id: 'stt', label: 'ST/T findings', answer: 'No significant ST/T abnormality', options: ['ST elevation', 'ST depression with T-wave inversion', 'No significant ST/T abnormality'], hint: 'Use the TP segment as the baseline. Compare it with the ST segment, then inspect T-wave direction in leads with upright QRS complexes.', explanation: 'ST segments return to the modeled baseline without displacement. T waves are upright in the expected leads and inverted only in aVR.', resource: 'fundamentals' },
])

export const CASES = [
  {
    id: 'normal-sinus-rhythm-01', number: 'Case 01', difficulty: 600, rate: 75, rrMs: 800, beatSpacing: 100, prMs: 160, qrsMs: 80,
    diagnosis: 'Normal sinus rhythm', reviewStatus: 'Not yet reviewed', libraryDescription: 'A foundational systematic ECG review.', skills: ['rate', 'rhythm', 'axis', 'pWaves', 'pr', 'qrs', 'stt'],
    questions: sharedQuestions({ rate: 75, rhythmAnswer: 'Regular sinus rhythm', rateOptions: ['50 bpm', '75 bpm', '120 bpm'], rateExplanation: 'R waves are four large boxes apart: 300 ÷ 4 = 75 bpm. The generated RR interval is exactly 800 ms.' }),
  },
  {
    id: 'sinus-bradycardia-01', number: 'Case 02', difficulty: 580, rate: 50, rrMs: 1200, beatSpacing: 150, prMs: 160, qrsMs: 80,
    diagnosis: 'Sinus bradycardia', reviewStatus: 'Not yet reviewed', libraryDescription: 'Practise rate measurement and sinus-origin checks.', skills: ['rate', 'rhythm', 'pWaves', 'pr'],
    questions: sharedQuestions({ rate: 50, rhythmAnswer: 'Regular sinus bradycardia', rateOptions: ['50 bpm', '75 bpm', '120 bpm'], rateExplanation: 'R waves are six large boxes apart: 300 ÷ 6 = 50 bpm. The generated RR interval is exactly 1200 ms.' }),
  },
  {
    id: 'sinus-tachycardia-01', number: 'Case 03', difficulty: 620, rate: 120, rrMs: 500, beatSpacing: 62.5, prMs: 160, qrsMs: 80,
    diagnosis: 'Sinus tachycardia', reviewStatus: 'Not yet reviewed', libraryDescription: 'Practise rate measurement when complexes are closer together.', skills: ['rate', 'rhythm', 'pWaves', 'qrs'],
    questions: sharedQuestions({ rate: 120, rhythmAnswer: 'Regular sinus tachycardia', rateOptions: ['50 bpm', '75 bpm', '120 bpm'], rateExplanation: 'R waves are two and a half large boxes apart: 300 ÷ 2.5 = 120 bpm. The generated RR interval is exactly 500 ms.' }),
  },
  {
    id: 'normal-sinus-rhythm-02', number: 'Case 04', difficulty: 610, rate: 60, rrMs: 1000, beatSpacing: 125, prMs: 120, qrsMs: 100,
    diagnosis: 'Normal sinus rhythm', reviewStatus: 'Not yet reviewed', libraryDescription: 'A second neutral systematic ECG review.', skills: ['rate', 'rhythm', 'axis', 'pWaves', 'pr', 'qrs', 'stt'],
    questions: sharedQuestions({ rate: 60, rhythmAnswer: 'Regular sinus rhythm', rateOptions: ['40 bpm', '60 bpm', '150 bpm'], rateExplanation: 'R waves are five large boxes apart: 300 ÷ 5 = 60 bpm. The generated RR interval is exactly 1000 ms.', prMs: 120, prOptions: ['80 ms (short)', '120 ms (normal)', '240 ms (prolonged)'], qrsMs: 100, qrsOptions: ['80 ms (narrow)', '100 ms (narrow)', '120 ms (wide)'] }),
  },
  {
    id: 'sinus-bradycardia-02', number: 'Case 05', difficulty: 590, rate: 40, rrMs: 1500, beatSpacing: 187.5, prMs: 200, qrsMs: 100,
    diagnosis: 'Sinus bradycardia', reviewStatus: 'Not yet reviewed', libraryDescription: 'A second neutral systematic ECG review.', skills: ['rate', 'rhythm', 'pWaves', 'pr'],
    questions: sharedQuestions({ rate: 40, rhythmAnswer: 'Regular sinus bradycardia', rateOptions: ['40 bpm', '60 bpm', '150 bpm'], rateExplanation: 'R waves are seven and a half large boxes apart: 300 ÷ 7.5 = 40 bpm. The generated RR interval is exactly 1500 ms.', prMs: 200, prOptions: ['80 ms (short)', '200 ms (normal)', '240 ms (prolonged)'], qrsMs: 100, qrsOptions: ['80 ms (narrow)', '100 ms (narrow)', '120 ms (wide)'] }),
  },
  {
    id: 'sinus-tachycardia-02', number: 'Case 06', difficulty: 630, rate: 150, rrMs: 400, beatSpacing: 50, prMs: 120, qrsMs: 100,
    diagnosis: 'Sinus tachycardia', reviewStatus: 'Not yet reviewed', libraryDescription: 'A second neutral systematic ECG review.', skills: ['rate', 'rhythm', 'pWaves', 'qrs'],
    questions: sharedQuestions({ rate: 150, rhythmAnswer: 'Regular sinus tachycardia', rateOptions: ['40 bpm', '60 bpm', '150 bpm'], rateExplanation: 'R waves are two large boxes apart: 300 ÷ 2 = 150 bpm. The generated RR interval is exactly 400 ms.', prMs: 120, prOptions: ['80 ms (short)', '120 ms (normal)', '240 ms (prolonged)'], qrsMs: 100, qrsOptions: ['80 ms (narrow)', '100 ms (narrow)', '120 ms (wide)'] }),
  },
]

export const SKILLS = [
  ['all', 'All skills'], ['rate', 'Rate'], ['rhythm', 'Rhythm'], ['axis', 'Axis'], ['pWaves', 'P waves'], ['pr', 'PR interval'], ['qrs', 'QRS duration'], ['stt', 'ST/T findings'],
]

export const SKILL_LABELS = Object.fromEntries(SKILLS.filter(([id]) => id !== 'all').map(([id, label]) => [id, label]))

export function validateCase(caseData) {
  const expectedSpacing = 7500 / caseData.rate
  const rateQuestion = caseData.questions.find((question) => question.id === 'rate')
  const expectedRhythm = caseData.rate < 60 ? 'Regular sinus bradycardia' : caseData.rate > 100 ? 'Regular sinus tachycardia' : 'Regular sinus rhythm'
  return {
    spacingMatchesRate: Math.abs(caseData.beatSpacing - expectedSpacing) < 0.001,
    rrMatchesRate: Math.abs(caseData.rrMs - 60000 / caseData.rate) < 0.001,
    answerMatchesRate: rateQuestion?.answer === `${caseData.rate} bpm`,
    intervalsMatchAnswers: caseData.questions.find((question) => question.id === 'pr')?.answer.startsWith(String(caseData.prMs)) && caseData.questions.find((question) => question.id === 'qrs')?.answer.startsWith(String(caseData.qrsMs)),
    hasAllQuestionIds: ['rate', 'rhythm', 'axis', 'pWaves', 'pr', 'qrs', 'stt'].every((id) => caseData.questions.some((question) => question.id === id)),
    rhythmMatchesRate: caseData.questions.find((question) => question.id === 'rhythm')?.answer === expectedRhythm,
    answersAreOptions: caseData.questions.every((question) => question.options.includes(question.answer)),
    hasTeachingSupport: caseData.questions.every((question) => question.hint && question.explanation && CASE_SOURCES[question.resource]),
    reviewPending: caseData.reviewStatus === 'Not yet reviewed',
  }
}
