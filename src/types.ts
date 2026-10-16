export type ActiveTab = 'listen' | 'keyer' | 'text-to-morse' | 'cheat-sheet' | 'ai-translator';

export interface MorseTimingConfig {
  wpm: number;            // Words per minute (standard 5 to 40 WPM, default 15-20)
  pitch: number;          // Audio tone pitch in Hz (default 650 Hz)
  volume: number;         // 0.0 to 1.0
  thresholdDb: number;    // Mic audio sensitivity threshold (-60dB to -10dB)
  targetFrequency: number;// Target beep frequency for DSP mic filtering (default 700 Hz)
  toleranceHz: number;    // Frequency band tolerance (+/- 150 Hz)
}

export interface VoiceConfig {
  voiceIndex: number;     // Index in speechSynth voices list
  rate: number;           // 0.5 to 2.0
  pitch: number;          // 0.5 to 1.5
  volume: number;         // 0.0 to 1.0
  autoSpeakLetters: boolean; // Speak individual letters as they decode
  autoSpeakWords: boolean;   // Speak completed words automatically
}

export interface DecodedSignalState {
  currentSymbol: string;    // '.' or '-' currently forming
  currentWordMorse: string; // Morse symbols for current word, e.g. "... --- ..."
  currentWordText: string;  // Decoded characters, e.g. "SOS"
  fullTranscript: string;   // Full decoded text history
  isAudioActive: boolean;   // Whether mic tone / key is currently pressed/detected
  signalDb: number;         // Current mic audio volume level in dB
  detectedFreq: number;     // Main frequency detected in mic stream
}

export interface MorseTranslationHistory {
  id: string;
  timestamp: number;
  sourceType: 'mic' | 'keyer' | 'text' | 'ai';
  rawMorse: string;
  decodedText: string;
  enhancedText?: string;
  audioDurationSec?: number;
}

export interface QCodeInfo {
  code: string;
  meaning: string;
  category: 'Q-Code' | 'Prosig' | 'Shorthand';
  example: string;
}
