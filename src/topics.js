export const TOPICS = [
  {
    id: 'normal-sinus-rhythm',
    name: 'Normal sinus rhythm',
    synonyms: ['normal rhythm', 'sinus rhythm', 'nsr', 'normal ecg'],
    explanation: 'A sinus P wave precedes every QRS with a consistent PR interval; in this introductory adult example, the rate is within 60–100 bpm.',
    sourceKey: 'sinusRhythms',
    caseIds: ['normal-sinus-rhythm-01', 'normal-sinus-rhythm-02'],
  },
  {
    id: 'sinus-bradycardia',
    name: 'Sinus bradycardia',
    synonyms: ['bradycardia', 'slow heart rate', 'slow pulse', 'sinus brady'],
    explanation: 'Sinus bradycardia keeps the organized sinus P–QRS relationship at an adult rate conventionally below 60 bpm; clinical context still matters.',
    sourceKey: 'definitions',
    caseIds: ['sinus-bradycardia-01', 'sinus-bradycardia-02'],
  },
  {
    id: 'sinus-tachycardia',
    name: 'Sinus tachycardia',
    synonyms: ['tachycardia', 'fast heart rate', 'rapid pulse', 'sinus tachy'],
    explanation: 'Sinus tachycardia keeps the organized sinus P–QRS relationship at an adult rate above 100 bpm in this introductory teaching context.',
    sourceKey: 'sinusRhythms',
    caseIds: ['sinus-tachycardia-01', 'sinus-tachycardia-02'],
  },
  {
    id: 'rate',
    name: 'Heart rate',
    synonyms: ['rate', 'heart rate', 'bpm', 'pulse', 'ventricular rate'],
    explanation: 'At 25 mm/s, one large box is 0.2 seconds. For a regular rhythm, dividing 300 by the number of large boxes between R waves estimates the rate.',
    sourceKey: 'standards',
    caseIds: ['normal-sinus-rhythm-01', 'sinus-bradycardia-01', 'sinus-tachycardia-01', 'normal-sinus-rhythm-02', 'sinus-bradycardia-02', 'sinus-tachycardia-02'],
  },
  {
    id: 'rhythm',
    name: 'Rhythm',
    synonyms: ['rhythm', 'regularity', 'sinus mechanism', 'p qrs relationship', 'p wave relationship'],
    explanation: 'Assess RR regularity and whether a consistent sinus P wave precedes every QRS before using the rate to classify a sinus rhythm.',
    sourceKey: 'fundamentals',
    caseIds: ['normal-sinus-rhythm-01', 'sinus-bradycardia-01', 'sinus-tachycardia-01', 'normal-sinus-rhythm-02', 'sinus-bradycardia-02', 'sinus-tachycardia-02'],
  },
]

const normalize = (value) => value.trim().toLocaleLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()

export const TOPIC_FR = {
  'normal-sinus-rhythm': { name: 'Rythme sinusal normal', synonyms: ['rythme normal', 'rythme sinusal', 'ecg normal'], explanation: 'Une onde P sinusale précède chaque QRS avec un intervalle PR constant ; dans cet exemple adulte introductif, la fréquence est comprise entre 60 et 100 bpm.' },
  'sinus-bradycardia': { name: 'Bradycardie sinusale', synonyms: ['bradycardie', 'fréquence cardiaque lente', 'pouls lent'], explanation: 'La bradycardie sinusale conserve une relation P–QRS sinusale organisée à une fréquence adulte conventionnellement inférieure à 60 bpm ; le contexte clinique reste indispensable.' },
  'sinus-tachycardia': { name: 'Tachycardie sinusale', synonyms: ['tachycardie', 'fréquence cardiaque rapide', 'pouls rapide'], explanation: 'La tachycardie sinusale conserve une relation P–QRS sinusale organisée à une fréquence adulte supérieure à 100 bpm dans ce contexte pédagogique introductif.' },
  rate: { name: 'Fréquence cardiaque', synonyms: ['fréquence', 'fréquence cardiaque', 'bpm', 'pouls'], explanation: 'À 25 mm/s, un grand carreau correspond à 0,2 seconde. Pour un rythme régulier, 300 divisé par le nombre de grands carreaux entre deux ondes R estime la fréquence.' },
  rhythm: { name: 'Rythme', synonyms: ['rythme', 'régularité', 'mécanisme sinusal', 'relation p qrs'], explanation: 'Évaluez la régularité RR et vérifiez qu’une onde P sinusale constante précède chaque QRS avant de classer le rythme sinusal selon la fréquence.' },
}

export const TOPIC_SW = {
  'normal-sinus-rhythm': { name: 'Normal sinus rhythm', synonyms: ['rhythm ya kawaida', 'sinus rhythm', 'ecg ya kawaida'], explanation: 'Sinus P wave hutangulia kila QRS kwa PR interval isiyobadilika; katika mfano huu wa utangulizi kwa watu wazima, mapigo ni 60–100 bpm.' },
  'sinus-bradycardia': { name: 'Sinus bradycardia', synonyms: ['bradycardia', 'mapigo ya moyo ya polepole', 'pulse ya polepole'], explanation: 'Sinus bradycardia huhifadhi uhusiano uliopangwa wa sinus P–QRS kwa mapigo ya mtu mzima yaliyo chini ya 60 bpm kwa kawaida; muktadha wa kitabibu bado ni muhimu.' },
  'sinus-tachycardia': { name: 'Sinus tachycardia', synonyms: ['tachycardia', 'mapigo ya moyo ya haraka', 'pulse ya haraka'], explanation: 'Sinus tachycardia huhifadhi uhusiano uliopangwa wa sinus P–QRS kwa mapigo ya mtu mzima yaliyo zaidi ya 100 bpm katika mafunzo haya ya utangulizi.' },
  rate: { name: 'Mapigo ya moyo', synonyms: ['mapigo', 'mapigo ya moyo', 'bpm', 'pulse'], explanation: 'Kwa 25 mm/s, kisanduku kikubwa kimoja ni sekunde 0.2. Kwa rhythm ya kawaida, gawanya 300 kwa idadi ya visanduku vikubwa kati ya R waves ili kukadiria mapigo.' },
  rhythm: { name: 'Rhythm', synonyms: ['rhythm', 'mpangilio', 'sinus mechanism', 'uhusiano wa p qrs'], explanation: 'Kagua kama RR intervals ni sawa na kama sinus P wave inayofanana hutangulia kila QRS kabla ya kutumia mapigo kuainisha sinus rhythm.' },
}

export function localizeTopic(topic, language) { return language === 'fr' ? { ...topic, ...TOPIC_FR[topic.id] } : language === 'sw' ? { ...topic, ...TOPIC_SW[topic.id] } : topic }

export function searchTopics(query, language = 'en') {
  const normalized = normalize(query)
  if (!normalized) return []
  const terms = normalized.split(' ')
  return TOPICS.filter((topic) => {
    const localized = localizeTopic(topic, language)
    const searchable = normalize([localized.name, ...localized.synonyms, topic.name, ...topic.synonyms].join(' '))
    return searchable.includes(normalized) || terms.every((term) => searchable.includes(term))
  })
}
