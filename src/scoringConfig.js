const introductoryWeights = {
  rate: 15,
  rhythm: 20,
  axis: 10,
  pWaves: 15,
  pr: 10,
  qrs: 15,
  stt: 15,
}

export const SCORING_CONFIG = {
  version: 1,
  startingRating: 600,
  minimumRating: 100,
  maximumRating: 1200,
  kFactor: 80,
  cases: {
    'normal-sinus-rhythm-01': {
      difficulty: 600,
      weights: introductoryWeights,
    },
    'sinus-bradycardia-01': { difficulty: 580, weights: introductoryWeights },
    'sinus-tachycardia-01': { difficulty: 620, weights: introductoryWeights },
    'normal-sinus-rhythm-02': { difficulty: 610, weights: introductoryWeights },
    'sinus-bradycardia-02': { difficulty: 590, weights: introductoryWeights },
    'sinus-tachycardia-02': { difficulty: 630, weights: introductoryWeights },
  },
}

export const WEIGHT_RATIONALE = [
  ['Rhythm', 20, 'The organizing diagnosis for this foundational case.'],
  ['Rate', 15, 'A core measurement used in every systematic ECG review.'],
  ['P waves', 15, 'Central evidence for identifying a sinus mechanism.'],
  ['QRS duration', 15, 'A core conduction measurement.'],
  ['ST/T findings', 15, 'A core repolarization screen.'],
  ['Axis', 10, 'Important, but a narrower skill in this introductory case.'],
  ['PR interval', 10, 'Important interval recognition with a single measurement here.'],
]

// These weights are provisional educational design choices. They are not
// clinically validated and must not be used for clinical competency decisions.
