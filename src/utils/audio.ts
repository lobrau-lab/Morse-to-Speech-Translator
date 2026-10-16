import { getMorseTiming } from './morse';

// Singleton AudioContext for smooth Web Audio performance
let audioCtx: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!audioCtx || audioCtx.state === 'closed') {
    const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    audioCtx = new AudioCtx();
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
}

/**
 * Plays a single Morse tone (dot or dash) with smooth envelope to eliminate clicking.
 */
export function playMorseTone(
  durationMs: number,
  frequency: number = 650,
  volume: number = 0.5
): Promise<void> {
  return new Promise((resolve) => {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = frequency;

    const now = ctx.currentTime;
    const durationSec = durationMs / 1000;
    const attack = Math.min(0.005, durationSec * 0.1);
    const release = Math.min(0.005, durationSec * 0.1);

    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(volume, now + attack);
    gain.gain.setValueAtTime(volume, now + durationSec - release);
    gain.gain.linearRampToValueAtTime(0, now + durationSec);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + durationSec);

    setTimeout(() => {
      resolve();
    }, durationMs);
  });
}

export interface PlayMorseOptions {
  wpm: number;
  pitch: number;
  volume: number;
  onSymbolStart?: (symbol: '.' | '-' | ' ' | '/') => void;
  onSymbolEnd?: () => void;
  shouldStop?: () => boolean;
}

/**
 * Plays an entire Morse code string ("... --- ...") asynchronously with audio beeps and timing.
 */
export async function playMorseSequence(
  morseString: string,
  options: PlayMorseOptions
): Promise<void> {
  const { wpm, pitch, volume, onSymbolStart, onSymbolEnd, shouldStop } = options;
  const timing = getMorseTiming(wpm);

  for (let i = 0; i < morseString.length; i++) {
    if (shouldStop && shouldStop()) break;
    const char = morseString[i];

    if (char === '.') {
      onSymbolStart?.('.');
      await playMorseTone(timing.dotMs, pitch, volume);
      onSymbolEnd?.();
      await sleep(timing.symbolGapMs);
    } else if (char === '-') {
      onSymbolStart?.('-');
      await playMorseTone(timing.dashMs, pitch, volume);
      onSymbolEnd?.();
      await sleep(timing.symbolGapMs);
    } else if (char === ' ') {
      onSymbolStart?.(' ');
      await sleep(timing.letterGapMs - timing.symbolGapMs);
      onSymbolEnd?.();
    } else if (char === '/') {
      onSymbolStart?.('/');
      await sleep(timing.wordGapMs - timing.symbolGapMs);
      onSymbolEnd?.();
    }
  }
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// ==========================================
// Web Speech API (Text to Speech) Helpers
// ==========================================

export function getSystemVoices(): SpeechSynthesisVoice[] {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return [];
  return window.speechSynthesis.getVoices();
}

export function speakText(
  text: string,
  options?: {
    voiceIndex?: number;
    rate?: number;
    pitch?: number;
    volume?: number;
    onEnd?: () => void;
    onBoundary?: (charIndex: number, length: number) => void;
  }
) {
  if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
  if (!text || !text.trim()) return;

  // Stop any active speech
  window.speechSynthesis.cancel();

  const utterance = new SpeechSynthesisUtterance(text);
  const voices = getSystemVoices();

  if (options?.voiceIndex !== undefined && voices[options.voiceIndex]) {
    utterance.voice = voices[options.voiceIndex];
  }
  if (options?.rate !== undefined) utterance.rate = options.rate;
  if (options?.pitch !== undefined) utterance.pitch = options.pitch;
  if (options?.volume !== undefined) utterance.volume = options.volume;

  if (options?.onEnd) {
    utterance.onend = () => options.onEnd?.();
    utterance.onerror = () => options.onEnd?.();
  }

  if (options?.onBoundary) {
    utterance.onboundary = (event) => {
      options.onBoundary?.(event.charIndex, event.charLength || 1);
    };
  }

  window.speechSynthesis.speak(utterance);
}

export function stopSpeech() {
  if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
