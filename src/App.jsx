import { useEffect, useId, useRef, useState } from 'react'
import { CASES, CASE_SOURCES, SKILLS, SKILL_LABELS, leadMorphology } from './cases.js'
import { SCORING_CONFIG, WEIGHT_RATIONALE } from './scoringConfig.js'
import { emptyProgress, isAnswerCorrect, loadProgress, recordAttempt, resetProgress, saveProgress, scoreAnswers, skillsNeedingPractice } from './progress.js'
import { localizeTopic, searchTopics } from './topics.js'
import { checkInterpretation, recordFeedbackFlag } from './interpretationFeedback.js'
import { parseRoute } from './navigation.js'
import { focusedInstruction as baseFocusedInstruction, getLearningRecommendation, getMistakeReview } from './learningRecommendation.js'
import { MAX_BACKUP_BYTES, parseProgressBackup, serializeProgressBackup } from './progressBackup.js'
import PwaStatus from './PwaStatus.jsx'
import { I18nProvider, LANGUAGE_KEY, frenchChecklist, frenchExample, swahiliChecklist, swahiliExample, localizeDiagnosis, localizeOption, localizeQuestion, localizeSkill, translate, useI18n } from './i18n.jsx'

const learningSteps = [
  ['01', 'Observe', 'Notice the rhythm, rate, and key visual details.'], ['02', 'Reason', 'Work through what the pattern could mean.'],
  ['03', 'Explain', 'Put your interpretation into your own words.'], ['04', 'Receive guidance', 'Get focused prompts that support your thinking.'],
  ['05', 'Revise', 'Refine your explanation with new insight.'], ['06', 'Improve', 'Build a clearer, more reliable approach over time.'],
]

const allQuestions = CASES[0].questions
const makeAttemptId = () => globalThis.crypto?.randomUUID?.() || `attempt-${Date.now()}-${Math.random().toString(36).slice(2)}`
const languageText = (language, english, french, swahili) => language === 'fr' ? french : language === 'sw' ? swahili : english
const focusedInstruction = (caseData, skill) => document.documentElement.lang === 'sw' ? localizeQuestion(caseData, caseData.questions.find((question) => question.id === skill), 'sw').hint : baseFocusedInstruction(caseData, skill)

function waveformPath(caseData, lead, y, width, offset = 0) {
  const [p, q, r, s, t] = leadMorphology[lead]
  const qrsStart = caseData.prMs * 0.125
  const qrsEnd = qrsStart + caseData.qrsMs * 0.125
  let d = `M 0 ${y}`
  for (let beat = offset; beat < width + caseData.beatSpacing; beat += caseData.beatSpacing) {
    const points = [[beat, 0], [beat + 2, -p * 20], [beat + 5, -p * 50], [beat + 8, -p * 20], [beat + 10, 0], [beat + qrsStart, 0], [beat + qrsStart + 1, -q * 50], [beat + qrsStart + 4, -r * 50], [beat + qrsEnd - 3, -s * 50], [beat + qrsEnd, 0], [beat + qrsEnd + 15, 0], [beat + qrsEnd + 20, -t * 28], [beat + qrsEnd + 25, -t * 50], [beat + qrsEnd + 30, -t * 28], [beat + caseData.beatSpacing, 0]]
    d += points.map(([x, amp]) => ` L ${x} ${y + amp}`).join('')
  }
  return d
}

function EcgPanel({ caseData }) {
  const { language, t } = useI18n()
  const titleId = useId()
  const rows = [['I', 'aVR', 'V1', 'V4'], ['II', 'aVL', 'V2', 'V5'], ['III', 'aVF', 'V3', 'V6']]
  return <figure className="ecg-figure" aria-labelledby={titleId}>
    <figcaption><div><span className="case-tag">{t('schematic')}</span><strong id={titleId}>{t('resting')}</strong></div><span>25 mm/s · 10 mm/mV</span></figcaption>
    <div className="ecg-scroll" tabIndex="0" aria-label={languageText(language, `Scrollable schematic 12-lead ECG for ${caseData.number}`, `ECG schématique à 12 dérivations défilable pour ${caseData.number.replace('Case', 'Cas')}`, `ECG ya mchoro ya leads 12 inayoweza kusogezwa kwa ${caseData.number}`)}>
      <svg className="ecg" viewBox="0 0 1000 520" role="img" aria-label={languageText(language, `Schematic ECG with a regular sinus mechanism at ${caseData.rate} beats per minute`, `ECG schématique avec un mécanisme sinusal régulier à ${caseData.rate} battements par minute`, `ECG ya mchoro yenye sinus mechanism ya kawaida kwa mapigo ${caseData.rate} kwa dakika`)}>
        <defs><pattern id="smallGrid" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M 5 0 L 0 0 0 5" fill="none" stroke="#efc7c0" strokeWidth="0.55" /></pattern><pattern id="grid" width="25" height="25" patternUnits="userSpaceOnUse"><rect width="25" height="25" fill="url(#smallGrid)"/><path d="M 25 0 L 0 0 0 25" fill="none" stroke="#db8f84" strokeWidth="0.8" /></pattern><clipPath id="plotClip"><rect x="0" y="0" width="1000" height="520" /></clipPath></defs>
        <rect width="1000" height="520" fill="#fffaf8"/><rect width="1000" height="520" fill="url(#grid)"/>
        <g clipPath="url(#plotClip)">{rows.flatMap((row, rowIndex) => row.map((lead, columnIndex) => { const x = columnIndex * 250; const y = 80 + rowIndex * 105; return <g key={lead} transform={`translate(${x},0)`}><text x="9" y={y - 34} className="lead-label">{lead}</text><path d={waveformPath(caseData, lead, y, 250, 34)} className="trace" /></g> }))}<text x="9" y="372" className="lead-label">{t('rhythmStrip')}</text><path d={waveformPath(caseData, 'II', 430, 1000, 34)} className="trace" /><path d="M 10 500 L 10 450 L 35 450 L 35 500 L 55 500" className="calibration" /><text x="65" y="490" className="calibration-label">1 mV</text></g>
      </svg>
    </div>
    <p className="figure-note">{t('figureNote')} {t('expertReview')} <strong>{language === 'en' ? caseData.reviewStatus : t('notReviewed')}</strong>.</p>
  </figure>
}

function Home() {
  const { language } = useI18n(); const stepsFr = [['Observer','Repérez le rythme, la fréquence et les détails visuels essentiels.'],['Raisonner','Analysez méthodiquement ce que le tracé pourrait signifier.'],['Expliquer','Formulez votre interprétation avec vos propres mots.'],['Recevoir des conseils','Utilisez des indications ciblées pour soutenir votre réflexion.'],['Réviser','Affinez votre explication à partir des nouveaux éléments.'],['Progresser','Construisez une méthode plus claire et plus fiable.']]
  const stepsSw = [['Angalia','Tambua rhythm, mapigo na maelezo muhimu ya mwonekano.'],['Fikiri','Chambua kwa utaratibu muundo unaweza kumaanisha nini.'],['Eleza','Weka tafsiri yako kwa maneno yako mwenyewe.'],['Pokea mwongozo','Tumia vidokezo vinavyolenga kusaidia kufikiri kwako.'],['Rekebisha','Boresha maelezo yako kwa ufahamu mpya.'],['Boresha','Jenga njia iliyo wazi na ya kuaminika zaidi.']]
  const steps = language === 'fr' ? stepsFr : language === 'sw' ? stepsSw : learningSteps.map(([, title, description]) => [title, description])
  return <main><section className="hero" aria-labelledby="page-title"><div className="eyebrow"><span aria-hidden="true">♥</span> {languageText(language, 'Learn ECGs by thinking them through', 'Apprendre l’ECG en raisonnant', 'Jifunze ECG kwa kufikiri kwa utaratibu')}</div><h1 id="page-title">Tete <span>{languageText(language, '— ECG Learning Coach', '— Coach d’apprentissage de l’ECG', '— Kocha wa Kujifunza ECG')}</span></h1><p className="intro">{languageText(language, 'Guided ECG practice that helps health-science students slow down, notice the details, and explain their reasoning—not just memorise an answer.', 'Une pratique guidée de l’ECG qui aide les étudiants en sciences de la santé à observer, raisonner et expliquer, plutôt qu’à mémoriser une réponse.', 'Mazoezi ya ECG yenye mwongozo yanayowasaidia wanafunzi wa sayansi za afya kuangalia kwa makini, kufikiri na kueleza sababu zao—si kukariri jibu tu.')}</p><a className="primary-button" href="#practice">{languageText(language, 'Start practice', 'Commencer la pratique', 'Anza mazoezi')} <span aria-hidden="true">→</span></a></section><section className="cycle" aria-labelledby="cycle-title"><div className="section-heading"><p className="kicker">{languageText(language, 'A repeatable approach', 'Une méthode reproductible', 'Njia inayoweza kurudiwa')}</p><h2 id="cycle-title">{languageText(language, 'The learning cycle', 'Le cycle d’apprentissage', 'Mzunguko wa kujifunza')}</h2><p>{languageText(language, 'Each practice session follows the same deliberate path.', 'Chaque séance suit le même parcours réfléchi.', 'Kila kikao cha mazoezi kinafuata njia ileile ya makusudi.')}</p></div><ol className="steps">{learningSteps.map(([number], index) => <li key={number}><span className="step-number" aria-hidden="true">{number}</span><div><h3>{steps[index][0]}</h3><p>{steps[index][1]}</p></div></li>)}</ol></section></main>
}

function Question({ caseData, question, value, onChange, hintShown, onHint, hintsAllowed }) {
  const { language, t } = useI18n(); const localized = localizeQuestion(caseData, question, language)
  return <fieldset className="question-card"><legend>{localized.label}</legend><label htmlFor={question.id}>{t('chooseFinding')}</label><select id={question.id} value={value} onChange={(event) => onChange(question.id, event.target.value)}><option value="">{t('selectAnswer')}</option>{question.options.map((option, index) => <option value={question.optionIds[index]} key={question.optionIds[index]}>{localizeOption(option, language)}</option>)}<option value="not-sure">{t('notSure')}</option></select>{hintsAllowed && <><button className="hint-button" type="button" onClick={() => onHint(question.id)} aria-expanded={hintShown}>{hintShown ? t('hideHint') : t('showHint')}</button>{hintShown && <p className="hint"><strong>{t('tryThis')}</strong> {localized.hint}</p>}</>}</fieldset>
}

function Sources({ caseData }) {
  const { language, t } = useI18n()
  const sourceKeys = [...new Set(['standards', 'definitions', 'fundamentals', 'sinusRhythms', ...caseData.questions.map((question) => question.resource)])]
  const summaryFr = { standards: 'L’étalonnage standard permet de comparer le temps et le voltage : à 25 mm/s, chaque petit carreau horizontal vaut 40 ms et 10 mm verticalement représentent 1 mV.', definitions: 'Un mécanisme sinusal présente une activation atriale constante. Chez l’adulte, la bradycardie sinusale est conventionnellement inférieure à 60 bpm, selon le contexte clinique.', fundamentals: 'Mesurez le PR du début de l’onde P au début du QRS, et le QRS de sa première à sa dernière déflexion.', sinusRhythms: 'La bradycardie sinusale, le rythme sinusal normal et la tachycardie sinusale partagent une relation P–QRS sinusale organisée ; leur distinction introductive repose sur la fréquence.' }
  const summarySw = { standards: 'Calibration ya kawaida huruhusu kulinganisha muda na voltage: kwa 25 mm/s, kila kisanduku kidogo cha mlalo ni 40 ms na 10 mm kwa wima ni 1 mV.', definitions: 'Sinus mechanism ina atrial activation inayofanana. Kwa watu wazima, sinus bradycardia kwa kawaida ni chini ya 60 bpm, kulingana na muktadha wa kitabibu.', fundamentals: 'Pima PR kutoka mwanzo wa P wave hadi mwanzo wa QRS, na QRS kutoka deflection yake ya kwanza hadi ya mwisho.', sinusRhythms: 'Sinus bradycardia, normal sinus rhythm na sinus tachycardia zote zina uhusiano uliopangwa wa sinus P–QRS; utangulizi huu unazitofautisha kwa mapigo.' }
  return <aside className="sources" aria-labelledby="sources-title"><h3 id="sources-title">{languageText(language, 'Offline learning summaries and references', 'Résumés pédagogiques hors ligne et références', 'Muhtasari wa kujifunza bila intaneti na marejeo')}</h3><p className="notice">{languageText(language, 'The summaries below stay available offline. External source links require an internet connection.', 'Les résumés restent disponibles hors ligne. Les liens externes nécessitent internet.', 'Muhtasari huu unapatikana bila intaneti. Viungo vya nje vinahitaji intaneti.')}</p><ul>{sourceKeys.map((key) => { const source = CASE_SOURCES[key]; return <li key={key}><p>{language === 'fr' ? summaryFr[key] : language === 'sw' ? summarySw[key] : source.summary}</p><a href={source.url} target="_blank" rel="noreferrer">Source: {source.title} ({t('sourceInternet')})</a> — {languageText(language, source.note, 'Référence pédagogique.', 'Rejeo la kielimu.')}</li> })}</ul><p>{languageText(language, 'Rate thresholds are introductory adult conventions and require clinical context. These schematic cases teach pattern recognition, not diagnosis or management.', 'Les seuils de fréquence sont des conventions adultes introductives qui nécessitent un contexte clinique. Ces cas schématiques enseignent la reconnaissance de motifs, et non le diagnostic ou la prise en charge.', 'Viwango vya mapigo ni kanuni za utangulizi kwa watu wazima na vinahitaji muktadha wa kitabibu. Kesi hizi za michoro zinafundisha kutambua mifumo, si utambuzi au matibabu.')}</p></aside>
}

function downloadProgressBackup(progress) {
  const blob = new Blob([serializeProgressBackup(progress)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `tete-progress-${new Date().toISOString().slice(0, 10)}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function BackupRestorePanel({ progress, onRestore }) {
  const { t } = useI18n()
  const [pending, setPending] = useState(null)
  const [message, setMessage] = useState('')
  const [messageError, setMessageError] = useState(false)
  const fileInput = useRef(null)
  const chooseFile = async (event) => {
    const file = event.target.files?.[0]
    setPending(null)
    if (!file) return
    if (file.size > MAX_BACKUP_BYTES) { setMessage('fileTooLarge'); setMessageError(true); event.target.value = ''; return }
    try {
      const parsed = parseProgressBackup(await file.text())
      if (!parsed.ok) { setMessage(parsed.code); setMessageError(true) } else { setPending(parsed); setMessage('restoreReady'); setMessageError(false) }
    } catch { setMessage('restoreReadFailed'); setMessageError(true) }
    event.target.value = ''
  }
  const confirmRestore = () => {
    if (!pending) return
    if (onRestore(pending.progress)) { setPending(null); setMessage('restoreSuccess'); setMessageError(false) } else { setMessage('restoreWriteFailed'); setMessageError(true) }
  }
  return <section className="backup-panel" aria-labelledby="backup-title"><h3 id="backup-title">{t('backupTitle')}</h3><p>{t('backupPrivacy')}</p><div className="backup-actions"><button type="button" className="secondary-button" onClick={() => downloadProgressBackup(progress)}>{t('backupProgress')}</button><button type="button" className="secondary-button" onClick={() => fileInput.current?.click()}>{t('restoreProgress')}</button><input ref={fileInput} className="visually-hidden" type="file" accept="application/json,.json" aria-label={t('restoreFileLabel')} onChange={chooseFile} /></div>{message && <p className={messageError ? 'storage-warning' : 'notice'} role={messageError ? 'alert' : 'status'}>{t(message)}</p>}{pending && <div className="restore-preview" role="group" aria-labelledby="restore-preview-title"><h4 id="restore-preview-title">{t('restorePreview')}</h4><p>{t('backupAttempts', { count: pending.progress.attempts.length })}</p><p>{t('backupRating', { rating: pending.progress.rating })}</p><p>{t('replaceWarning')}</p><div className="backup-actions"><button type="button" className="secondary-button" onClick={() => downloadProgressBackup(progress)}>{t('backupCurrentFirst')}</button><button type="button" className="danger-button" onClick={confirmRestore}>{t('confirmRestore')}</button><button type="button" className="text-button" onClick={() => { setPending(null); setMessage('') }}>{t('cancelRestore')}</button></div></div>}</section>
}

function ProgressPanel({ progress, storageMessage, onReset, onPracticeSkill }) {
  const { language, t } = useI18n()
  const [confirming, setConfirming] = useState(false)
  const weakSkills = skillsNeedingPractice(progress.attempts, allQuestions)
  const ratedAttempts = progress.attempts.filter((attempt) => attempt.rated)
  const practiceAttempts = progress.attempts.filter((attempt) => !attempt.rated)
  const caseName = (id) => CASES.find((item) => item.id === id)?.number || t('legacyCase')
  const modeLabel = (attempt) => attempt.rated ? `${t('assessmentMode')} · ${languageText(language, 'rated', 'classée', 'rating')}` : attempt.mode === 'guided' ? t('learningMode') : `${t('assessmentMode')} · ${languageText(language, 'practice', 'pratique', 'zoezi')}`
  const mistakes = getMistakeReview(progress)
  const formatDate = (value) => { if (!value) return t('dateUnavailable'); const date = new Date(value); return Number.isNaN(date.getTime()) ? t('dateUnavailable') : date.toLocaleDateString(language === 'fr' ? 'fr-FR' : language === 'sw' ? 'sw' : 'en', { year: 'numeric', month: 'short', day: 'numeric' }) }
  return <section className="progress-panel" aria-labelledby="progress-title"><div className="progress-top"><div><p className="kicker">{t('storedDevice')}</p><h2 id="progress-title">{t('dashboard')}</h2></div><div className="rating-block"><span>{t('currentRating')}</span><strong>{progress.rating}</strong></div></div><p className="device-note">{t('deviceNote')}</p>{storageMessage && <p className="storage-warning" role="status">{storageMessage}</p>}<div className="metric-grid"><div><strong>{ratedAttempts.length}</strong><span>{t('ratedCompleted')}</span></div><div><strong>{practiceAttempts.length}</strong><span>{t('practiceCompleted')}</span></div><div><strong>{progress.attempts.length}</strong><span>{t('totalCompleted')}</span></div></div><div className="progress-grid"><div><h3>{t('scoreHistory')}</h3>{progress.attempts.length ? <ol className="history-list">{[...progress.attempts].reverse().map((attempt) => <li key={attempt.id}><span>{caseName(attempt.caseId)} · {attempt.percentage}%</span><small>{modeLabel(attempt)}</small></li>)}</ol> : <p>{t('noAttempts')}</p>}<p className="history-note">{t('historyNote')}</p></div><div><h3>{t('ratingHistory')}</h3>{ratedAttempts.length ? <ol className="history-list"><li><span>{t('startingRating')}</span><small>{SCORING_CONFIG.startingRating}</small></li>{ratedAttempts.map((attempt) => <li key={attempt.id}><span>{attempt.ratingBefore} → {attempt.ratingAfter}</span><small>{caseName(attempt.caseId)}</small></li>)}</ol> : <p>{t('completeUnseen')}</p>}</div><div><h3>{t('skillsPractice')}</h3>{weakSkills.length ? <ul className="skill-list">{weakSkills.map((skill) => <li key={skill.label}>{localizeSkill(allQuestions.find((q) => q.label === skill.label)?.id, language)} <span>{skill.correct}/{skill.total}</span></li>)}</ul> : <p>{progress.attempts.length ? t('noSkillLow') : t('completeCaseGuidance')}</p>}</div></div><section className="mistake-review" aria-labelledby="mistake-review-title"><p className="kicker">{t('focusedReview')}</p><h3 id="mistake-review-title">{t('reviewMistakes')}</h3>{mistakes.length ? <ol className="mistake-list">{mistakes.map((mistake) => { const sourceCase = CASES.find((item) => item.id === mistake.caseId); const question = sourceCase?.questions.find((item) => item.id === mistake.skill); const localized = sourceCase && question ? localizeQuestion(sourceCase, question, language) : null; const selectedLabel = question ? (question.optionIds.includes(mistake.selectedAnswer) ? localizeOption(question.options[question.optionIds.indexOf(mistake.selectedAnswer)], language) : mistake.selectedAnswer === 'not-sure' || mistake.selectedAnswer === 'Not sure' ? t('notSure') : localizeOption(mistake.selectedAnswer, language)) : mistake.selectedAnswer; return <li key={mistake.id} className="mistake-card"><div className="mistake-meta"><strong>{mistake.caseLabel} · {localizeSkill(mistake.skill, language)}</strong><span><time dateTime={mistake.createdAt || undefined}>{formatDate(mistake.createdAt)}</time> · {modeLabel(progress.attempts.find((a) => a.id === mistake.attemptId) || {})}</span></div><p><strong>{t('yourAnswer')}</strong> {mistake.answerRecorded ? (selectedLabel || t('noAnswer')) : t('originalMissing')}</p><p><strong>{t('correctAnswer')}</strong> {question ? localizeOption(question.answer, language) : mistake.correctAnswer}</p><p>{localized?.explanation || mistake.explanation}</p>{mistake.reviewPractice && <p className="review-label">{t('reviewPractice')}</p>}{mistake.practiceCaseId && <button type="button" className="secondary-button" onClick={() => onPracticeSkill(mistake.practiceCaseId, mistake.skill)}>{t('practiseSkill')} <span aria-hidden="true">→</span></button>}</li> })}</ol> : <div className="no-mistakes"><p>{t('noMistakes')}</p><a className="secondary-button" href="#learning">{t('goLearning')}</a></div>}</section>{confirming ? <div className="reset-confirm" role="group" aria-label={t('resetProgress')}><p>{t('resetQuestion', { rating: SCORING_CONFIG.startingRating })}</p><button type="button" className="danger-button" onClick={() => { onReset(); setConfirming(false) }}>{t('yesReset')}</button><button type="button" className="text-button" onClick={() => setConfirming(false)}>{t('cancel')}</button></div> : <button type="button" className="text-button danger-text" onClick={() => setConfirming(true)}>{t('resetProgress')}</button>}</section>
}

function LearningLibrary({ progress, onSelect }) {
  const { language, t } = useI18n()
  const [skill, setSkill] = useState('all')
  const [query, setQuery] = useState('')
  const matching = CASES.filter((item) => skill === 'all' || item.skills.includes(skill))
  const topics = searchTopics(query, language)
  const hasQuery = Boolean(query.trim())
  const caseById = (id) => CASES.find((item) => item.id === id)

  return <section className="library" aria-label={languageText(language, 'Learning Mode case library', 'Bibliothèque de cas du mode apprentissage', 'Maktaba ya kesi za Hali ya Kujifunza')}>
    <a className="back-link" href="#practice"><span aria-hidden="true">←</span> {t('backModes')}</a>
    <p className="kicker">{t('learningMode')}</p>
    <p className="library-intro">{languageText(language, 'Search a topic or choose a case. Hints, revision, explanations, and written-interpretation feedback are available, and your skill rating will not change.', 'Recherchez un sujet ou choisissez un cas. Les indices, la révision, les explications et les commentaires d’interprétation sont disponibles sans modifier votre classement.', 'Tafuta mada au chagua kesi. Vidokezo, marekebisho, maelezo na mwongozo wa tafsiri iliyoandikwa vinapatikana bila kubadilisha skill rating yako.')}</p>

    <section className="topic-search" aria-labelledby="topic-search-title">
      <h2 id="topic-search-title">{t('topicSearch')}</h2>
      <label htmlFor="topic-query">{t('searchTopics')}</label>
      <input id="topic-query" type="search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder={t('searchPlaceholder')} autoComplete="off" />
      <div className="search-status" role="status" aria-live="polite" aria-atomic="true">{hasQuery ? topics.length ? languageText(language, `${topics.length} matching topic${topics.length === 1 ? '' : 's'}.`, `${topics.length} sujet${topics.length === 1 ? '' : 's'} correspondant${topics.length === 1 ? '' : 's'}.`, `Mada ${topics.length} zinazolingana.`) : languageText(language, `No local topic or case matches “${query.trim()}”.`, `Aucun sujet ou cas local ne correspond à « ${query.trim()} ».`, `Hakuna mada au kesi ya kifaa inayolingana na “${query.trim()}”.`) : t('searchEmpty')}</div>
      {hasQuery && topics.length > 0 && <div className="topic-results">{topics.map((topic) => {
        const localizedTopic = localizeTopic(topic, language); const topicCases = topic.caseIds.map(caseById).filter(Boolean)
        const section = (en, fr, sw) => languageText(language, en, fr, sw)
        return <article className="topic-card" key={topic.id}>
          <h3>{localizedTopic.name}</h3>
          <p>{localizedTopic.explanation}</p>
          <p><strong>{section('Learning objectives', 'Objectifs d’apprentissage', 'Malengo ya kujifunza')}</strong></p><ul>{localizedTopic.objectives.map((item) => <li key={item}>{item}</li>)}</ul>
          <details className="topic-lesson"><summary>{section('Key ECG features and measurements', 'Caractéristiques ECG et mesures', 'Vipengele na vipimo vya ECG')}</summary><ul>{localizedTopic.features.map((item) => <li key={item}>{item}</li>)}</ul></details>
          <details className="topic-lesson"><summary>{section('Interpret it step by step', 'Interpréter étape par étape', 'Tafsiri hatua kwa hatua')}</summary><ol>{localizedTopic.steps.map((item) => <li key={item}>{item}</li>)}</ol></details>
          <details className="topic-lesson"><summary>{section('Common errors and distinctions', 'Erreurs fréquentes et distinctions', 'Makosa ya kawaida na tofauti')}</summary><ul>{localizedTopic.pitfalls.map((item) => <li key={item}>{item}</li>)}</ul></details>
          <details className="topic-lesson"><summary>{section('Worked example', 'Exemple expliqué', 'Mfano ulioelezwa')}</summary><p>{localizedTopic.workedExample}</p></details>
          <p className="topic-recap"><strong>{section('Recap:', 'Récapitulatif :', 'Muhtasari:')}</strong> {localizedTopic.recap}</p>
          <div className="topic-sources"><strong>{section('References', 'Références', 'Marejeo')}</strong><ul>{topic.sourceKeys.map((key) => { const source = CASE_SOURCES[key]; return <li key={key}><a href={source.url} target="_blank" rel="noreferrer">{source.title} ({t('sourceInternet')})</a></li> })}</ul><small>{t('offlineExplanation')}</small></div>
          {topicCases.length ? <div className="topic-actions">{topicCases.map((caseData) => <button type="button" className="secondary-button" key={caseData.id} onClick={() => onSelect(caseData.id)}>{languageText(language, 'Practise this topic', 'Pratiquer ce sujet', 'Fanya mazoezi ya mada hii')} · {caseData.number}</button>)}</div> : <p className="no-match">{t('noCaseTopic')}</p>}
        </article>
      })}</div>}
    </section>

    <section className="guided-browser" aria-labelledby="guided-browser-title">
      <h2 id="guided-browser-title">{t('browseLearning')}</h2>
      <label className="skill-filter" htmlFor="skill-filter">{t('practiseLabel')} <select id="skill-filter" value={skill} onChange={(event) => setSkill(event.target.value)}>{SKILLS.map(([id, label]) => <option value={id} key={id}>{id === 'all' ? t('allSkills') : localizeSkill(id, language)}</option>)}</select></label>
      <div className="case-grid">{matching.map((caseData) => { const seen = progress.attempts.some((attempt) => attempt.caseId === caseData.id); return <article className="case-tile" key={caseData.id}><p className="case-number">{caseData.number}</p><h3>{localizeDiagnosis(caseData.diagnosis, language)}</h3><p>{languageText(language, caseData.libraryDescription, 'Exercice systématique d’interprétation ECG.', 'Zoezi la kutafsiri ECG kwa utaratibu.')}</p>{seen && <p className="review-label">{t('reviewPractice')}</p>}<button type="button" className="secondary-button" onClick={() => onSelect(caseData.id)}>{t('startLearning')} · {caseData.number}</button></article> })}</div>
      {!matching.length && <p className="no-match">{t('noCaseSkill')}</p>}
    </section>

  </section>
}

function AssessmentLibrary({ progress, onSelect }) {
  const { language, t } = useI18n()
  const cases = CASES.map((caseData) => ({ caseData, attempts: progress.attempts.filter((attempt) => attempt.caseId === caseData.id) }))
  const eligibleCount = cases.filter(({ attempts }) => attempts.length === 0).length
  return <section className="library" aria-label={languageText(language, 'Assessment Mode case library', 'Bibliothèque de cas du mode évaluation', 'Maktaba ya kesi za Hali ya Tathmini')}>
    <a className="back-link" href="#practice"><span aria-hidden="true">←</span> {t('backModes')}</a>
    <p className="kicker">{t('assessmentMode')}</p>
    <p className="library-intro">{t('assessmentIntro')}</p>
    {!eligibleCount && <div className="empty-state" role="status"><h2>{t('noEligible')}</h2><p>{t('noEligibleText')}</p><a className="secondary-button" href="#learning">{t('goLearning')}</a></div>}
    <div className="case-grid assessment-grid">{cases.map(({ caseData, attempts }) => {
      const seen = attempts.length > 0
      return <article className="case-tile" key={caseData.id}><p className="case-number">{caseData.number}</p><h3>{t('interpretTracing')}</h3><p className={`eligibility ${seen ? 'practice-only' : 'eligible'}`}>{seen ? t('previouslySeen') : t('unseenEligible')}</p><p className="case-meta">{seen ? languageText(language, `${attempts.length} submitted attempt${attempts.length === 1 ? '' : 's'} recorded. This case cannot change your rating.`, `${attempts.length} tentative${attempts.length === 1 ? '' : 's'} enregistrée${attempts.length === 1 ? '' : 's'}. Ce cas ne peut pas modifier votre classement.`, `Majaribio ${attempts.length} yamehifadhiwa. Kesi hii haiwezi kubadilisha rating yako.`) : t('hintsHidden')}</p><button type="button" className="primary-button" onClick={() => onSelect(caseData.id)}>{seen ? t('startPracticeAssessment') : t('startAssessment')} · {caseData.number}</button></article>
    })}</div>
  </section>
}

function ScoringDetails() {
  const { language, t } = useI18n()
  return <details className="scoring-details"><summary>{t('howScoring')}</summary><p>{t('provisionalWeights')}</p><table><thead><tr><th>{t('skill')}</th><th>{t('weight')}</th><th>{t('rationale')}</th></tr></thead><tbody>{WEIGHT_RATIONALE.map(([skill, weight, rationale], index) => <tr key={skill}><td>{localizeSkill(['rhythm','rate','pWaves','qrs','stt','axis','pr'][index], language)}</td><td>{weight}%</td><td>{languageText(language, rationale, 'Pondération éducative provisoire pour une interprétation ECG systématique.', 'Uzito wa muda wa kielimu kwa tafsiri ya ECG kwa utaratibu.')}</td></tr>)}</tbody></table></details>
}

function NextStep({ recommendation, onContinue }) {
  const { language, t } = useI18n(); const title = language === 'fr' ? (recommendation.kind === 'basics' ? 'Commencer par les bases' : recommendation.kind === 'general' ? 'Continuer la pratique systématique' : `${recommendation.kind === 'summary' ? 'Réviser' : 'Pratiquer'} ${localizeSkill(recommendation.skill, language).toLowerCase()}`) : language === 'sw' ? (recommendation.kind === 'basics' ? 'Anza na misingi' : recommendation.kind === 'general' ? 'Endelea na mazoezi ya utaratibu' : `${recommendation.kind === 'summary' ? 'Pitia' : 'Fanya mazoezi ya'} ${localizeSkill(recommendation.skill, language).toLowerCase()}`) : recommendation.title
  const explanation = language === 'fr' ? (recommendation.kind === 'basics' ? 'Commencez par une analyse systématique de la fréquence, du rythme, des ondes, des intervalles, de l’axe et des éléments ST/T.' : recommendation.kind === 'general' ? 'Aucune compétence manquée n’est enregistrée ; Tete propose donc une pratique générale sans inventer de faiblesse.' : `Pratiquez ${localizeSkill(recommendation.skill, language).toLowerCase()} car cette compétence a été manquée lors de votre tentative récente.`) : language === 'sw' ? (recommendation.kind === 'basics' ? 'Anza na ukaguzi wa utaratibu wa mapigo, rhythm, waves, intervals, axis na matokeo ya ST/T.' : recommendation.kind === 'general' ? 'Hakuna ujuzi uliokosewa uliohifadhiwa; Tete inapendekeza mazoezi ya jumla bila kubuni udhaifu.' : `Fanya mazoezi ya ${localizeSkill(recommendation.skill, language).toLowerCase()} kwa sababu ujuzi huu ulikosewa katika jaribio lako la karibuni.`) : recommendation.explanation
  return <section className="next-step" aria-labelledby="next-step-title"><div><p className="kicker">{t('nextStep')}</p><h2 id="next-step-title">{title}</h2><p>{explanation}</p>{recommendation.review && <p className="review-label">{t('reviewPractice')}</p>}{recommendation.kind === 'summary' && recommendation.source && <><p>{recommendation.source.summary}</p><a href={recommendation.source.url} target="_blank" rel="noreferrer">Source: {recommendation.source.title} ({t('sourceInternet')})</a></>}</div>{recommendation.caseId && <button type="button" className="primary-button" onClick={onContinue}>{t('continueLearning')} <span aria-hidden="true">→</span></button>}<a href="#learning">{t('chooseTopic')}</a></section>
}

function ModeSelection({ recommendation, onContinue }) {
  const { t } = useI18n()
  return <section className="mode-page" aria-label={t('chooseMode')}><a className="back-link" href="#home"><span aria-hidden="true">←</span> {t('backHome')}</a><NextStep recommendation={recommendation} onContinue={onContinue} /><p className="kicker">{t('chooseMode')}</p><div className="mode-grid"><article><h2>{t('learningMode')}</h2><p>{t('learningDescription')}</p><a className="secondary-button mode-button" href="#learning">{t('chooseLearning')} <span aria-hidden="true">→</span></a></article><article><h2>{t('assessmentMode')}</h2><a className="primary-button mode-button" href="#assessment">{t('chooseAssessment')} <span aria-hidden="true">→</span></a></article></div><div className="utility-links"><a href="#progress">{t('viewProgress')}</a></div><ScoringDetails /></section>
}

function Guidance({ caseData, answers }) {
  const { language } = useI18n()
  const missed = caseData.questions.filter((question) => !isAnswerCorrect(question, answers[question.id])).sort((a, b) => SCORING_CONFIG.cases[caseData.id].weights[b.id] - SCORING_CONFIG.cases[caseData.id].weights[a.id])
  if (!missed.length) return <aside className="guidance"><p className="kicker">{languageText(language, 'Next practice area', 'Prochaine pratique', 'Eneo linalofuata la mazoezi')}</p><h3>{languageText(language, 'Reinforce rate and rhythm on another case.', 'Renforcez la fréquence et le rythme avec un autre cas.', 'Imarisha mapigo na rhythm kwa kesi nyingine.')}</h3><p>{languageText(language, 'Your structured findings matched this key. Varying the rate helps test whether the method transfers. This is practice guidance, not proof of mastery.', 'Vos constatations structurées correspondent au corrigé. Varier la fréquence aide à vérifier le transfert de la méthode. Il s’agit d’un conseil de pratique, pas d’une preuve de maîtrise.', 'Matokeo yako yenye muundo yalilingana na jibu sahihi. Kubadilisha mapigo husaidia kujaribu kama njia hiyo inahamishika. Huu ni mwongozo wa mazoezi, si ushahidi wa umahiri.')}</p><a href={CASE_SOURCES.sinusRhythms.url} target="_blank" rel="noreferrer">{languageText(language, 'Review sinus rhythms in NCBI Bookshelf', 'Réviser les rythmes sinusaux', 'Pitia sinus rhythms katika NCBI Bookshelf')}</a></aside>
  const target = missed[0]; const source = CASE_SOURCES[target.resource]
  return <aside className="guidance"><p className="kicker">{languageText(language, 'Recommended next practice area', 'Prochaine pratique recommandée', 'Eneo linalopendekezwa la mazoezi')}</p><h3>{localizeSkill(target.id, language)}</h3><p>{language === 'fr' ? `Votre réponse suggère une nouvelle pratique ciblée sur ${localizeSkill(target.id, language).toLowerCase()}. Remesurez cet élément avant de choisir un autre cas. Ce conseil ne prouve pas la maîtrise.` : language === 'sw' ? `Jibu lako linapendekeza mazoezi mengine yanayolenga ${localizeSkill(target.id, language).toLowerCase()}. Pima kipengele hiki tena kabla ya kuchagua kesi nyingine. Huu ni mwongozo wa mazoezi, si ushahidi wa umahiri.` : `Your ${answers[target.id] === 'not-sure' ? '“Not sure” response' : 'response'} suggests another focused pass on ${target.label.toLowerCase()}. Re-measure this feature before choosing another case. This is practice guidance, not proof of mastery.`}</p><a href={source.url} target="_blank" rel="noreferrer">{languageText(language, 'Review', 'Réviser', 'Pitia')}: {source.title}</a></aside>
}

function InterpretationFeedback({ caseData, reasoning, storage }) {
  const { language, t } = useI18n()
  const [draft, setDraft] = useState(reasoning)
  const [reviewedText, setReviewedText] = useState(reasoning)
  const [flagState, setFlagState] = useState('idle')
  const feedback = language === 'en' ? checkInterpretation(reviewedText, caseData) : { status: reviewedText.trim() ? 'language-limited' : 'blank', clear: [], contradictions: [], uncertain: [], missing: [], checklist: language === 'sw' ? swahiliChecklist : frenchChecklist, example: language === 'sw' ? swahiliExample(caseData) : frenchExample(caseData) }
  const reviewRevision = () => { setReviewedText(draft); setFlagState('idle') }
  const flagFeedback = () => {
    const result = recordFeedbackFlag(storage, { caseId: caseData.id, interpretation: reviewedText, feedback: { status: feedback.status, clear: feedback.clear.map((item) => item.id), contradictions: feedback.contradictions.map((item) => item.id), uncertain: feedback.uncertain.map((item) => item.id), missing: feedback.missing }, createdAt: new Date().toISOString() })
    setFlagState(result.ok ? 'saved' : result.message)
  }
  return <section className="reasoning-review interpretation-feedback" aria-labelledby="interpretation-feedback-title">
    <p className="kicker">{t('interpretationWarning')}</p>
    <h3 id="interpretation-feedback-title">{t('aboutInterpretation')}</h3>
    {language !== 'en' ? <p>{t('frenchCheckerLimit')}</p> : feedback.status === 'blank' ? <p>{t('blankFeedback')}</p> : feedback.status === 'unrecognised' ? <p>{t('unrecognised')}</p> : <>
      {feedback.clear.length > 0 && <div><h4>{t('clearlyStated')}</h4><ul>{feedback.clear.map((item) => <li key={item.id}><strong>{item.label}:</strong> {t('agreesKey')}</li>)}</ul></div>}
      {feedback.contradictions.length > 0 && <div><h4>{t('contradictions')}</h4><ul>{feedback.contradictions.map((item) => <li key={item.id}><strong>{item.label}:</strong> “{item.evidence}” appears to conflict with this case’s answer key. Check the tracing and your intended negation.</li>)}</ul></div>}
      {feedback.uncertain.length > 0 && <div><h4>{t('uncertainStatements')}</h4><ul>{feedback.uncertain.map((item) => <li key={item.id}><strong>{item.label}:</strong> “{item.evidence}” sounds tentative, so it was not counted as a clearly stated finding.</li>)}</ul></div>}
      {feedback.missing.length > 0 && <p><strong>{t('missingSteps')}</strong> {feedback.missing.join(', ')}.</p>}
    </>}
    <details><summary>{t('selfChecklist')}</summary><ul>{feedback.checklist.map((item) => <li key={item}>{item}</li>)}</ul></details>
    <div className="example-interpretation"><h4>{t('exampleInterpretation')}</h4><p>{feedback.example}</p></div>
    <label htmlFor={`interpretation-revision-${caseData.id}`}><strong>{t('reviseInterpretation')}</strong><span>{t('revisionNoAttempt')}</span></label>
    <textarea id={`interpretation-revision-${caseData.id}`} rows="5" value={draft} onChange={(event) => setDraft(event.target.value)} />
    <div className="result-actions"><button type="button" className="secondary-button" onClick={reviewRevision}>{t('reviewRevision')}</button><button type="button" className="text-button" onClick={flagFeedback} disabled={flagState === 'saved'}>{flagState === 'saved' ? t('flagged') : t('feedbackIncorrect')}</button></div>
    {flagState !== 'idle' && <p className="notice" role="status">{flagState === 'saved' ? t('flagSaved') : flagState}</p>}
  </section>
}

function Results({ caseData, answers, reasoning, mode, attempt, storage, onRevise, onLibrary, focusSkill }) {
  const { language, t } = useI18n()
  const score = scoreAnswers(caseData.questions, answers, caseData.id)
  const focusQuestion = focusSkill ? caseData.questions.find((question) => question.id === focusSkill) : null
  const focusCorrect = focusQuestion && isAnswerCorrect(focusQuestion, answers[focusSkill])
  const headingRef = useRef(null)
  useEffect(() => { headingRef.current?.focus() }, [])
  return <section className="results" aria-labelledby="results-title"><div className="results-summary" role="status" aria-live="polite" aria-atomic="true"><p className="kicker">{localizeDiagnosis(caseData.diagnosis, language)}</p><h2 id="results-title" ref={headingRef} tabIndex="-1">{t('caseScore', { score: score.percentage })}</h2><p>{t('weightedPoints', { earned: score.earned, total: score.total })}</p>{attempt.rated ? <div className="rating-result"><strong>{languageText(language, 'Rating', 'Classement', 'Rating')} {attempt.ratingBefore} → {attempt.ratingAfter} ({attempt.ratingDelta >= 0 ? '+' : ''}{attempt.ratingDelta})</strong><p>{languageText(language, `Expected ${attempt.expectedPercentage}% at rating ${attempt.ratingBefore} versus case difficulty ${SCORING_CONFIG.cases[caseData.id].difficulty}.`, `Résultat attendu : ${attempt.expectedPercentage} % au classement ${attempt.ratingBefore}, difficulté du cas ${SCORING_CONFIG.cases[caseData.id].difficulty}.`, `Matokeo yaliyotarajiwa ni ${attempt.expectedPercentage}% kwa rating ${attempt.ratingBefore}, ikilinganishwa na ugumu wa kesi ${SCORING_CONFIG.cases[caseData.id].difficulty}.`)}</p></div> : <div className="practice-result"><strong>{t('recordedPractice')}</strong><p>{mode === 'guided' ? t('learningNoRating') : t('protectedRating')}</p></div>}{focusQuestion && <div className="focused-completion"><p className="kicker">{t('focusedComplete')}</p><h3>{focusCorrect ? t('matchesKey', { skill: localizeSkill(focusSkill, language) }) : t('revise', { skill: localizeSkill(focusSkill, language).toLowerCase() })}</h3><p>{t('completedFocused', { skill: localizeSkill(focusSkill, language).toLowerCase() })}</p><button type="button" className="secondary-button" onClick={onRevise}>{t('reviseSkill', { skill: localizeSkill(focusSkill, language).toLowerCase() })}</button></div>}<div className="result-actions">{mode === 'guided' && !focusQuestion && <button type="button" className="secondary-button" onClick={onRevise}>{t('reviseAnswers')}</button>}<button type="button" className="secondary-button" onClick={onLibrary}>{mode === 'guided' ? t('returnLearning') : t('returnAssessment')}</button></div></div><Guidance caseData={caseData} answers={answers} /><InterpretationFeedback caseData={caseData} reasoning={reasoning} storage={storage} /><div className="feedback-list">{caseData.questions.map((question) => { const correct = isAnswerCorrect(question, answers[question.id]); const localized = localizeQuestion(caseData, question, language); const idx = question.optionIds.indexOf(answers[question.id]); const selected = answers[question.id] === 'not-sure' ? t('notSure') : idx >= 0 ? localizeOption(question.options[idx], language) : languageText(language, 'Not answered', 'Sans réponse', 'Haijajibiwa'); return <article className={`feedback ${correct ? 'correct' : 'review'}`} key={question.id}><p className="feedback-status">{correct ? `✓ ${t('matches')}` : `↻ ${t('review')}`}</p><h3>{localized.label} <span className="weight-label">{t('points', { points: SCORING_CONFIG.cases[caseData.id].weights[question.id] })}</span></h3><p><strong>{t('yourAnswer')}</strong> {selected}</p><p><strong>{t('correctAnswer')}</strong> {localizeOption(question.answer, language)}</p><p>{localized.explanation}</p></article> })}</div><Sources caseData={caseData} /></section>
}

function Practice({ route, navigate, onActiveAttempt }) {
  const { language, t } = useI18n()
  let storage = null; let storageAccessMessage = ''
  try { storage = typeof window === 'undefined' ? null : window.localStorage } catch { storageAccessMessage = 'Browser storage is unavailable. You can continue, but progress will not persist.' }
  const loaded = storageAccessMessage ? { progress: emptyProgress(), message: storageAccessMessage } : loadProgress(storage)
  const [progress, setProgress] = useState(loaded.progress); const [storageMessage, setStorageMessage] = useState(loaded.message || '')
  const [answers, setAnswers] = useState({}); const [hints, setHints] = useState({}); const [reasoning, setReasoning] = useState(''); const [submitted, setSubmitted] = useState(false); const [resultAttempt, setResultAttempt] = useState(null); const [attemptId, setAttemptId] = useState(makeAttemptId)
  const caseId = route.caseId || null
  const mode = route.mode === 'learning' ? 'guided' : route.mode === 'assessment' ? 'rated' : null
  const focusSkill = mode === 'guided' && SKILL_LABELS[route.focusSkill] ? route.focusSkill : null
  const caseData = CASES.find((item) => item.id === caseId)
  const recommendation = getLearningRecommendation(progress)
  useEffect(() => { onActiveAttempt(Boolean(caseData && mode && !submitted)); return () => onActiveAttempt(false) }, [caseData, mode, submitted, onActiveAttempt])
  const selectCase = (id, selectedMode, selectedSkill = null) => { setSubmitted(false); setAnswers({}); setHints({}); setReasoning(''); setResultAttempt(null); setAttemptId(makeAttemptId()); navigate(`#case/${id}/${selectedMode}${selectedSkill ? `/${selectedSkill}` : ''}`) }
  const submit = (event) => { event.preventDefault(); if (submitted) return; const score = scoreAnswers(caseData.questions, answers, caseData.id); const correctness = Object.fromEntries(caseData.questions.map((question) => [question.id, isAnswerCorrect(question, answers[question.id])])); const recorded = recordAttempt(progress, { id: attemptId, caseId: caseData.id, mode, percentage: score.percentage, earned: score.earned, total: score.total, correctness, responses: { ...answers }, focusSkill, createdAt: new Date().toISOString() }); setProgress(recorded.progress); setResultAttempt(recorded.attempt); setSubmitted(true); const saved = saveProgress(storage, recorded.progress); if (!saved.ok) setStorageMessage(saved.message); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const revise = () => { setSubmitted(false); if (!focusSkill) setAttemptId(makeAttemptId()); window.scrollTo({ top: 0, behavior: 'smooth' }) }
  const restoreFromBackup = (restoredProgress) => { const saved = saveProgress(storage, restoredProgress); if (!saved.ok) return false; setProgress(restoredProgress); setStorageMessage(''); return true }
  const reset = () => { const result = resetProgress(storage); setProgress(result.progress); setStorageMessage(result.message || 'Progress reset on this device.'); setSubmitted(false); navigate('#progress') }
  if (route.view === 'modes') return <main className="case-page"><ModeSelection recommendation={recommendation} onContinue={() => recommendation.caseId && selectCase(recommendation.caseId, 'learning', recommendation.skill)} /></main>
  if (route.view === 'learning') return <main className="case-page"><LearningLibrary progress={progress} onSelect={(id) => selectCase(id, 'learning')} /><ScoringDetails /></main>
  if (route.view === 'assessment') return <main className="case-page"><AssessmentLibrary progress={progress} onSelect={(id) => selectCase(id, 'assessment')} /><ScoringDetails /></main>
  if (route.view === 'progress') return <main className="case-page"><a className="back-link" href="#practice"><span aria-hidden="true">←</span> {t('backModes')}</a><ProgressPanel progress={progress} storageMessage={storageMessage} onReset={reset} onPracticeSkill={(id, skill) => selectCase(id, 'learning', skill)} /><BackupRestorePanel progress={progress} onRestore={restoreFromBackup} /><ScoringDetails /></main>
  if (!caseData || !mode) return <main className="case-page"><ModeSelection recommendation={recommendation} onContinue={() => recommendation.caseId && selectCase(recommendation.caseId, 'learning', recommendation.skill)} /></main>
  const libraryHash = mode === 'guided' ? '#learning' : '#assessment'
  const modeLabel = mode === 'guided' ? t('learningMode') : t('assessmentMode')
  const seenBeforeSession = progress.attempts.some((attempt) => attempt.caseId === caseData.id && attempt.id !== resultAttempt?.id)
  return <main className="case-page"><a className="back-link" href={libraryHash}><span aria-hidden="true">←</span> {mode === 'guided' ? t('backLearning') : t('backAssessment')}</a><header className="case-header"><div><p className="kicker">{modeLabel} · {caseData.number}</p><h1>{t('readSystematically')}</h1>{mode === 'guided' && seenBeforeSession && <p className="review-label">{t('reviewPractice')}</p>}</div><p>{mode === 'rated' ? t('assessmentCaseIntro') : t('learningCaseIntro')}</p></header>{focusSkill && !submitted && <aside className="focus-instruction" aria-labelledby="focus-title"><p className="kicker">{t('yourFocus')}</p><h2 id="focus-title">{localizeSkill(focusSkill, language)}</h2><p>{language === 'fr' ? localizeQuestion(caseData, caseData.questions.find((q) => q.id === focusSkill), language).hint : focusedInstruction(caseData, focusSkill)}</p><p>{t('fullWorkflow')}</p></aside>}<EcgPanel caseData={caseData} />{submitted && resultAttempt ? <Results caseData={caseData} answers={answers} reasoning={reasoning} mode={mode} attempt={resultAttempt} storage={storage} onRevise={revise} onLibrary={() => navigate(libraryHash)} focusSkill={focusSkill} /> : <form className="case-form" onSubmit={submit}><div className="form-intro"><p className="kicker">{modeLabel}</p><h2>{t('whatSee')}</h2><p>{mode === 'rated' ? t('hintsAssessment') : t('hintsLearning')} {t('notSurePrompt')}</p></div><div className="question-grid">{caseData.questions.map((question) => <Question caseData={caseData} key={question.id} question={question} value={answers[question.id] || ''} onChange={(id, value) => setAnswers((current) => ({ ...current, [id]: value }))} hintShown={Boolean(hints[question.id])} onHint={(id) => setHints((current) => ({ ...current, [id]: !current[id] }))} hintsAllowed={mode === 'guided'} />)}</div><div className="explanation-card"><label htmlFor="reasoning"><strong>{t('explain')}</strong><span>{t('freeNotScored')}</span></label><textarea id="reasoning" rows="6" value={reasoning} onChange={(event) => setReasoning(event.target.value)} placeholder={t('placeholder')} /></div><div className="submit-row"><p>{t('structuredOnly')}</p><button className="primary-button" type="submit">{mode === 'rated' ? t('submitAssessment') : t('submitPractice')} <span aria-hidden="true">→</span></button></div></form>}<ScoringDetails /></main>
}

function getRoute() {
  return parseRoute(window.location.hash || '#home', CASES.map((item) => item.id))
}

function AppShell({ language, setLanguage }) {
  const t = (key, values) => translate(language, key, values)
  const [route, setRoute] = useState(getRoute)
  const [activeAttempt, setActiveAttempt] = useState(false)
  const navigate = (hash) => { if (window.location.hash === hash) setRoute(getRoute()); else window.location.hash = hash }
  useEffect(() => { const handleHashChange = () => { setRoute(getRoute()); window.scrollTo({ top: 0 }); requestAnimationFrame(() => document.getElementById('main-content')?.focus()) }; window.addEventListener('hashchange', handleHashChange); return () => window.removeEventListener('hashchange', handleHashChange) }, [])
  return <I18nProvider value={{ language, setLanguage, t }}><div className="site-shell"><a className="skip-link" href="#main-content" onClick={(event) => { event.preventDefault(); document.getElementById('main-content')?.focus() }}>{languageText(language, 'Skip to main content', 'Aller au contenu principal', 'Ruka hadi maudhui makuu')}</a><header className="site-header"><a className="brand" href="#home" aria-label={languageText(language, 'Tete home', 'Accueil Tete', 'Nyumbani Tete')}><span aria-hidden="true">T</span>Tete</a><div className="header-actions"><nav aria-label={languageText(language, 'Primary navigation', 'Navigation principale', 'Urambazaji mkuu')}><a href="#practice">{t('practice')}</a><a href="#progress">{t('viewProgress')}</a></nav><label className="language-select" htmlFor="language-select">{t('language')}<select id="language-select" value={language} onChange={(event) => setLanguage(event.target.value)}><option value="en">English</option><option value="fr">Français</option><option value="sw">Kiswahili</option></select></label></div></header><PwaStatus activeAttempt={activeAttempt} /><div id="main-content" tabIndex="-1">{route.view === 'home' ? <Home /> : <Practice route={route} navigate={navigate} onActiveAttempt={setActiveAttempt} />}</div><footer><p>{t('education')} {t('reviewStatus')} <strong>{t('notReviewed')}.</strong> {language === 'fr' && <span className="translation-notice">{t('frenchNotice')}</span>} {language === 'sw' && <span className="translation-notice">{t('swahiliNotice')}</span>} <span className="app-version">Build {__TETE_VERSION__}</span></p></footer></div></I18nProvider>
}

export default function App() {
  const [language, setLanguageState] = useState(() => { try { const saved = localStorage.getItem(LANGUAGE_KEY); return ['en', 'fr', 'sw'].includes(saved) ? saved : 'en' } catch { return 'en' } })
  const setLanguage = (next) => { const safe = ['en', 'fr', 'sw'].includes(next) ? next : 'en'; setLanguageState(safe); try { localStorage.setItem(LANGUAGE_KEY, safe) } catch { /* Language preference is optional. */ } }
  useEffect(() => { document.documentElement.lang = language }, [language])
  return <AppShell language={language} setLanguage={setLanguage} />
}
