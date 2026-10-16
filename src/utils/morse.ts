import { QCodeInfo } from '../types';

// International Morse Code Table
export const MORSE_MAP: Record<string, string> = {
  // Letters
  'A': '.-',
  'B': '-...',
  'C': '-.-.',
  'D': '-..',
  'E': '.',
  'F': '..-.',
  'G': '--.',
  'H': '....',
  'I': '..',
  'J': '.---',
  'K': '-.-',
  'L': '.-..',
  'M': '--',
  'N': '-.',
  'O': '---',
  'P': '.--.',
  'Q': '--.-',
  'R': '.-.',
  'S': '...',
  'T': '-',
  'U': '..-',
  'V': '...-',
  'W': '.--',
  'X': '-..-',
  'Y': '-.--',
  'Z': '--..',
  // Numbers
  '1': '.----',
  '2': '..---',
  '3': '...--',
  '4': '....-',
  '5': '.....',
  '6': '-....',
  '7': '--...',
  '8': '---..',
  '9': '----.',
  '0': '-----',
  // Punctuation
  '.': '.-.-.-',
  ',': '--..--',
  '?': '..--..',
  "'": '.----.',
  '!': '-.-.--',
  '/': '-..-.',
  '(': '-.--.',
  ')': '-.--.-',
  '&': '.-...',
  ':': '---...',
  ';': '-.-.-.',
  '=': '-...-',
  '+': '.-.-.',
  '-': '-....-',
  '_': '..--.-',
  '"': '.-..-.',
  '$': '...-..-',
  '@': '.--.-.',
  ' ': '/',
};

// Reverse map: Morse -> Character
export const REVERSE_MORSE_MAP: Record<string, string> = {};
Object.entries(MORSE_MAP).forEach(([char, code]) => {
  if (code && code !== '/') {
    REVERSE_MORSE_MAP[code] = char;
  }
});

// Special Prosigs
export const PROSIGS_MAP: Record<string, string> = {
  '...---...': 'SOS',  // Emergency
  '-.-.-': 'KA',       // Attention / Start of signal
  '.-.-.': 'AR',       // End of message
  '...-.-': 'SK',      // End of contact / work
  '-...-': 'BT',       // Break / New paragraph
  '......': 'HH',      // Error
};

// Phonetic & Descriptive names for Reference Table mapping
export const PHONETIC_MAP: Record<string, string> = {
  'A': 'Alpha',
  'B': 'Bravo',
  'C': 'Charlie',
  'D': 'Delta',
  'E': 'Echo',
  'F': 'Foxtrot',
  'G': 'Golf',
  'H': 'Hotel',
  'I': 'India',
  'J': 'Juliett',
  'K': 'Kilo',
  'L': 'Lima',
  'M': 'Mike',
  'N': 'November',
  'O': 'Oscar',
  'P': 'Papa',
  'Q': 'Quebec',
  'R': 'Romeo',
  'S': 'Sierra',
  'T': 'Tango',
  'U': 'Uniform',
  'V': 'Victor',
  'W': 'Whiskey',
  'X': 'X-ray',
  'Y': 'Yankee',
  'Z': 'Zulu',
  '0': 'Zero',
  '1': 'One',
  '2': 'Two',
  '3': 'Three',
  '4': 'Four',
  '5': 'Five',
  '6': 'Six',
  '7': 'Seven',
  '8': 'Eight',
  '9': 'Nine',
  '.': 'Period / Full Stop',
  ',': 'Comma',
  '?': 'Question Mark',
  "'": 'Apostrophe',
  '!': 'Exclamation Point',
  '/': 'Forward Slash / Fraction',
  '(': 'Open Parenthesis',
  ')': 'Close Parenthesis',
  '&': 'Ampersand',
  ':': 'Colon',
  ';': 'Semicolon',
  '=': 'Equals Sign',
  '+': 'Plus Sign',
  '-': 'Hyphen / Minus',
  '_': 'Underscore',
  '"': 'Quotation Mark',
  '$': 'Dollar Sign',
  '@': 'At Symbol (@)',
};

// Common Q-Codes & Amateur Radio Shorthand
export const Q_CODES_LIST: QCodeInfo[] = [
  { code: 'SOS', meaning: 'Distress / Emergency signal', category: 'Prosig', example: 'SOS = Emergency assistance needed' },
  { code: 'CQ', meaning: 'Calling any station', category: 'Shorthand', example: 'CQ CQ CQ DE K2MTR' },
  { code: '73', meaning: 'Best regards', category: 'Shorthand', example: '73 ES GOOD LUCK' },
  { code: '88', meaning: 'Love and kisses', category: 'Shorthand', example: 'THANKS 88 CUL' },
  { code: 'QTH', meaning: 'My location is...', category: 'Q-Code', example: 'QTH NEW YORK CITY' },
  { code: 'QSL', meaning: 'I acknowledge receipt / Confirm contact', category: 'Q-Code', example: 'QSL ALL RECEIVED 599' },
  { code: 'QRM', meaning: 'Man-made interference / Static noise', category: 'Q-Code', example: 'HEAVY QRM ON FREQ' },
  { code: 'QRN', meaning: 'Natural atmospheric noise / Static', category: 'Q-Code', example: 'THUNDERSTORM QRN' },
  { code: 'QSY', meaning: 'Change frequency to...', category: 'Q-Code', example: 'QSY TO 7030 KHZ' },
  { code: 'QSO', meaning: 'Two-way contact / Conversation', category: 'Q-Code', example: 'TNX FER FB QSO' },
  { code: 'QRX', meaning: 'Wait / I will call you again in X minutes', category: 'Q-Code', example: 'QRX 5 MIN' },
  { code: 'QRT', meaning: 'Stop sending / Closing station', category: 'Q-Code', example: 'GOING QRT NOW 73' },
  { code: 'QRZ', meaning: 'Who is calling me?', category: 'Q-Code', example: 'QRZ?' },
  { code: 'DE', meaning: 'From / This is...', category: 'Shorthand', example: 'W1AW DE N2ABC' },
  { code: 'K', meaning: 'Over / Ready for response', category: 'Shorthand', example: 'K' },
  { code: 'AR', meaning: 'End of transmission', category: 'Prosig', example: 'AR' },
  { code: 'SK', meaning: 'Final end of contact', category: 'Prosig', example: '73 SK' },
  { code: 'FB', meaning: 'Fine business / Excellent', category: 'Shorthand', example: 'FB SIGNAL' },
  { code: 'OM', meaning: 'Old Man / Friend', category: 'Shorthand', example: 'TNX OM' },
  { code: 'YL', meaning: 'Young Lady / Female operator', category: 'Shorthand', example: 'HI YL' },
  { code: 'RST', meaning: 'Signal Report (Readability, Signal Strength, Tone)', category: 'Shorthand', example: 'UR RST IS 599' },
];

/**
 * Encodes a text string into Morse code.
 * Letters separated by single space, words separated by ' / '
 */
export function encodeTextToMorse(text: string): string {
  const clean = text.toUpperCase().trim();
  const words = clean.split(/\s+/);
  
  return words
    .map(word => {
      return word
        .split('')
        .map(char => MORSE_MAP[char] || '')
        .filter(Boolean)
        .join(' ');
    })
    .filter(Boolean)
    .join(' / ');
}

/**
 * Decodes Morse string (space separated chars, '/' or '   ' separated words) into text.
 */
export function decodeMorseToText(morse: string): string {
  if (!morse.trim()) return '';
  
  // Normalize word breaks
  const normalized = morse.replace(/\s*\/\s*/g, ' / ').trim();
  const words = normalized.split(/\s+\/\s+/);

  return words
    .map(word => {
      const letters = word.trim().split(/\s+/);
      return letters
        .map(letter => {
          if (PROSIGS_MAP[letter]) return `[${PROSIGS_MAP[letter]}]`;
          return REVERSE_MORSE_MAP[letter] || '?';
        })
        .join('');
    })
    .join(' ');
}

/**
 * Calculates standard Morse timing durations based on Words Per Minute (WPM).
 * Standard formula: 1 WPM = 50 dot units per minute (PARIS standard).
 * Unit duration (dot) T = 1200 / WPM ms.
 */
export function getMorseTiming(wpm: number) {
  const clampedWpm = Math.max(5, Math.min(60, wpm));
  const dotMs = 1200 / clampedWpm;
  return {
    dotMs,
    dashMs: dotMs * 3,
    symbolGapMs: dotMs * 1,   // silence between dots & dashes of same letter
    letterGapMs: dotMs * 3,   // silence between letters
    wordGapMs: dotMs * 7,     // silence between words
    // Tolerance margins for live listening threshold
    dotMinMs: dotMs * 0.4,
    dotMaxMs: dotMs * 1.8,
    dashMinMs: dotMs * 1.81,
    dashMaxMs: dotMs * 6.0,
  };
}
