export type TtsRole = 'assistant';

const FEMALE_KEYWORDS = [
  'female',
  'mujer',
  'femenina',
  'sabina',
  'monica',
  'mónica',
  'paulina',
  'marta',
  'helena',
  'dalia',
  'lucia',
  'lucía',
  'elvira',
  'marisol',
  'fernanda',
  'ximena',
  'camila',
  'valentina',
  'sofia',
  'sofía',
  'isabella',
  'antonella',
  'gaby',
  'gabriela',
];

const NATURAL_FEMALE_NAMES = [
  'sabina',
  'dalia',
  'monica',
  'mónica',
  'paulina',
  'marta',
  'helena',
  'lucia',
  'lucía',
  'marisol',
  'fernanda',
  'ximena',
  'camila',
  'valentina',
  'elvira',
];

// Scores free voices prioritizing high-quality free female voices
// (Microsoft Natural/Online, Google, or any female-named es voice).
function scoreFemaleSpanishVoice(voice: SpeechSynthesisVoice): number {
  const name = String(voice.name || '').toLowerCase();
  const lang = String(voice.lang || '').toLowerCase();
  let score = 0;

  if (lang.startsWith('es')) score += 60;

  // Natural voices are the most realistic free option
  if (name.includes('natural')) score += 140;
  if (name.includes('online')) score += 70;
  if (name.includes('neural')) score += 40;
  if (name.includes('google')) score += 30;

  if (FEMALE_KEYWORDS.some((kw) => name.includes(kw))) {
    score += 50;
  }

  // Strong preference for free voices known to be female in es-MX / es-ES
  if (name.includes('microsoft') && (name.includes('aria') || name.includes('dalia') || name.includes('marisol') || name.includes('fernanda') || name.includes('ximena') || name.includes('camila'))) {
    score += 90;
  }

  // Natural + known female Spanish name = most natural female voice available
  if (name.includes('natural') && NATURAL_FEMALE_NAMES.some((n) => name.includes(n))) {
    score += 110;
  }

  if (voice.default) score += 5;

  return score;
}

// Waits until voices are loaded (both initial and onvoiceschanged).
export function getAvailableVoices(maxWait = 1500): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      resolve([]);
      return;
    }

    const timer = setTimeout(() => {
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    }, maxWait);

    const voices = window.speechSynthesis.getVoices();
    if (voices.length) {
      clearTimeout(timer);
      resolve(voices);
      return;
    }

    window.speechSynthesis.onvoiceschanged = () => {
      clearTimeout(timer);
      window.speechSynthesis.onvoiceschanged = null;
      resolve(window.speechSynthesis.getVoices());
    };
  });
}

// Returns the best free female Spanish voice available, or the best es voice, or null.
export async function getBestFemaleSpanishVoice(): Promise<SpeechSynthesisVoice | null> {
  const voices = await getAvailableVoices();
  if (!voices.length) return null;

  const sorted = voices
    .filter((v) => String(v.lang || '').toLowerCase().startsWith('es'))
    .sort((a, b) => scoreFemaleSpanishVoice(b) - scoreFemaleSpanishVoice(a));

  return sorted[0] || null;
}

// Builds a SpeechSynthesisUtterance using the best free female Spanish voice.
export async function speakWithFreeFemaleVoice(
  text: string,
  options: { lang?: string; rate?: number; pitch?: number } = {}
): Promise<SpeechSynthesisUtterance | null> {
  if (!('speechSynthesis' in window) || !text) return null;

  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang || 'es-MX';
  utterance.rate = options.rate ?? 1.0;
  utterance.pitch = options.pitch ?? 1.1;

  const voice = await getBestFemaleSpanishVoice();
  if (voice) {
    utterance.voice = voice;
  }

  window.speechSynthesis.speak(utterance);
  return utterance;
}
