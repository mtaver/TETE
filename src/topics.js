export const TOPICS = [
  {
    id: 'normal-sinus-rhythm',
    name: 'Normal sinus rhythm',
    synonyms: ['normal rhythm', 'sinus rhythm', 'nsr', 'normal ecg'],
    explanation: 'A sinus P wave precedes every QRS with a consistent PR interval; in this introductory adult example, the rate is within 60–100 bpm.',
    sourceKey: 'sinusRhythms',
    caseIds: ['normal-sinus-rhythm-01'],
  },
  {
    id: 'sinus-bradycardia',
    name: 'Sinus bradycardia',
    synonyms: ['bradycardia', 'slow heart rate', 'slow pulse', 'sinus brady'],
    explanation: 'Sinus bradycardia keeps the organized sinus P–QRS relationship at an adult rate conventionally below 60 bpm; clinical context still matters.',
    sourceKey: 'definitions',
    caseIds: ['sinus-bradycardia-01'],
  },
  {
    id: 'sinus-tachycardia',
    name: 'Sinus tachycardia',
    synonyms: ['tachycardia', 'fast heart rate', 'rapid pulse', 'sinus tachy'],
    explanation: 'Sinus tachycardia keeps the organized sinus P–QRS relationship at an adult rate above 100 bpm in this introductory teaching context.',
    sourceKey: 'sinusRhythms',
    caseIds: ['sinus-tachycardia-01'],
  },
  {
    id: 'rate',
    name: 'Heart rate',
    synonyms: ['rate', 'heart rate', 'bpm', 'pulse', 'ventricular rate'],
    explanation: 'At 25 mm/s, one large box is 0.2 seconds. For a regular rhythm, dividing 300 by the number of large boxes between R waves estimates the rate.',
    sourceKey: 'standards',
    caseIds: ['normal-sinus-rhythm-01', 'sinus-bradycardia-01', 'sinus-tachycardia-01'],
  },
  {
    id: 'rhythm',
    name: 'Rhythm',
    synonyms: ['rhythm', 'regularity', 'sinus mechanism', 'p qrs relationship', 'p wave relationship'],
    explanation: 'Assess RR regularity and whether a consistent sinus P wave precedes every QRS before using the rate to classify a sinus rhythm.',
    sourceKey: 'fundamentals',
    caseIds: ['normal-sinus-rhythm-01', 'sinus-bradycardia-01', 'sinus-tachycardia-01'],
  },
]

const normalize = (value) => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export function searchTopics(query) {
  const normalized = normalize(query)
  if (!normalized) return []
  const terms = normalized.split(' ')
  return TOPICS.filter((topic) => {
    const searchable = normalize([topic.name, ...topic.synonyms].join(' '))
    return searchable.includes(normalized) || terms.every((term) => searchable.includes(term))
  })
}
