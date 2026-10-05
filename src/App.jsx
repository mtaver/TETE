import { useEffect, useState } from 'react'

const learningSteps = [
  ['01', 'Observe', 'Notice the rhythm, rate, and key visual details.'],
  ['02', 'Reason', 'Work through what the pattern could mean.'],
  ['03', 'Explain', 'Put your interpretation into your own words.'],
  ['04', 'Receive guidance', 'Get focused prompts that support your thinking.'],
  ['05', 'Revise', 'Refine your explanation with new insight.'],
  ['06', 'Improve', 'Build a clearer, more reliable approach over time.'],
]

function Home() {
  return (
    <main>
      <section className="hero" aria-labelledby="page-title">
        <div className="eyebrow"><span aria-hidden="true">♥</span> Learn ECGs by thinking them through</div>
        <h1 id="page-title">Tete <span>— ECG Learning Coach</span></h1>
        <p className="intro">
          Guided ECG practice that helps health-science students slow down, notice the details,
          and explain their reasoning—not just memorise an answer.
        </p>
        <a className="primary-button" href="#practice">Start practice <span aria-hidden="true">→</span></a>
      </section>

      <section className="cycle" aria-labelledby="cycle-title">
        <div className="section-heading">
          <p className="kicker">A repeatable approach</p>
          <h2 id="cycle-title">The learning cycle</h2>
          <p>Each practice session follows the same deliberate path.</p>
        </div>
        <ol className="steps">
          {learningSteps.map(([number, title, description]) => (
            <li key={number}>
              <span className="step-number" aria-hidden="true">{number}</span>
              <div><h3>{title}</h3><p>{description}</p></div>
            </li>
          ))}
        </ol>
      </section>
    </main>
  )
}

function Practice() {
  return (
    <main className="practice-page">
      <section className="practice-card" aria-labelledby="practice-title">
        <p className="kicker">Practice space</p>
        <h1 id="practice-title">Your first ECG is coming soon.</h1>
        <p>This placeholder marks where guided practice will begin in a future step.</p>
        <a className="secondary-button" href="#home"><span aria-hidden="true">←</span> Back to home</a>
      </section>
    </main>
  )
}

export default function App() {
  const getPage = () => window.location.hash === '#practice' ? 'practice' : 'home'
  const [page, setPage] = useState(getPage)

  useEffect(() => {
    const handleHashChange = () => setPage(getPage())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  return (
    <div className="site-shell">
      <header className="site-header">
        <a className="brand" href="#home" aria-label="Tete home"><span aria-hidden="true">T</span>Tete</a>
        <p>ECG learning, thoughtfully guided.</p>
      </header>
      {page === 'practice' ? <Practice /> : <Home />}
      <footer><p>For education only. Not for clinical diagnosis.</p></footer>
    </div>
  )
}
