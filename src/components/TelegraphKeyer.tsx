import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Volume2, Square, Sparkles, Copy, Trash2, Radio, Check, Keyboard } from 'lucide-react';
import { MorseTimingConfig, VoiceConfig, MorseTranslationHistory } from '../types';
import { getMorseTiming, REVERSE_MORSE_MAP, PROSIGS_MAP } from '../utils/morse';
import { speakText, stopSpeech, getAudioContext } from '../utils/audio';

interface TelegraphKeyerProps {
  timingConfig: MorseTimingConfig;
  onUpdateTiming?: (config: Partial<MorseTimingConfig>) => void;
  voiceConfig: VoiceConfig;
  onSaveHistory: (item: Omit<MorseTranslationHistory, 'id' | 'timestamp'>) => void;
}

export const TelegraphKeyer: React.FC<TelegraphKeyerProps> = ({
  timingConfig,
  onUpdateTiming,
  voiceConfig,
  onSaveHistory,
}) => {
  const [isKeyDown, setIsKeyDown] = useState(false);
  const [rawMorse, setRawMorse] = useState('');
  const [currentLetterMorse, setCurrentLetterMorse] = useState('');
  const [decodedText, setDecodedText] = useState('');
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);

  // Audio Oscillator state
  const oscRef = useRef<OscillatorNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  // Timing refs
  const pressStartTimeRef = useRef<number | null>(null);
  const lastReleaseTimeRef = useRef<number>(Date.now());
  const silenceTimerRef = useRef<NodeJS.Timeout | null>(null);

  const currentLetterRef = useRef<string>('');
  const decodedTextRef = useRef<string>('');

  const timing = getMorseTiming(timingConfig.wpm);

  // Auto speak helper
  const handleAutoSpeak = useCallback((text: string) => {
    if (!text.trim()) return;
    speakText(text, {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
      onEnd: () => setIsSpeaking(false),
    });
    setIsSpeaking(true);
  }, [voiceConfig]);

  // Decode letter when silence is reached
  const finishLetter = useCallback(() => {
    const code = currentLetterRef.current.trim();
    if (!code) return;

    let char = REVERSE_MORSE_MAP[code];
    if (PROSIGS_MAP[code]) {
      char = `[${PROSIGS_MAP[code]}]`;
    } else if (!char) {
      char = '?';
    }

    decodedTextRef.current += char;
    setDecodedText(decodedTextRef.current);
    currentLetterRef.current = '';
    setCurrentLetterMorse('');

    if (voiceConfig.autoSpeakLetters) {
      handleAutoSpeak(char);
    }
  }, [voiceConfig.autoSpeakLetters, handleAutoSpeak]);

  // Decode word break
  const finishWord = useCallback(() => {
    if (decodedTextRef.current && !decodedTextRef.current.endsWith(' ')) {
      const words = decodedTextRef.current.trim().split(' ');
      const lastWord = words[words.length - 1];

      decodedTextRef.current += ' ';
      setDecodedText(decodedTextRef.current);

      if (voiceConfig.autoSpeakWords && lastWord) {
        handleAutoSpeak(lastWord);
      }
    }
  }, [voiceConfig.autoSpeakWords, handleAutoSpeak]);

  // Start Telegraph Side-Tone Audio
  const startTone = () => {
    try {
      const ctx = getAudioContext();
      if (oscRef.current) return;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(timingConfig.pitch, ctx.currentTime);

      gain.gain.setValueAtTime(0, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(timingConfig.volume, ctx.currentTime + 0.005);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      oscRef.current = osc;
      gainRef.current = gain;
    } catch (err) {
      console.error('Audio start tone error:', err);
    }
  };

  // Stop Telegraph Side-Tone Audio
  const stopTone = () => {
    if (oscRef.current && gainRef.current) {
      try {
        const ctx = getAudioContext();
        gainRef.current.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.005);
        setTimeout(() => {
          oscRef.current?.stop();
          oscRef.current?.disconnect();
          oscRef.current = null;
          gainRef.current = null;
        }, 10);
      } catch {
        oscRef.current = null;
        gainRef.current = null;
      }
    }
  };

  // Key Down Handler (Touch or Mouse or Keyboard Spacebar)
  const handleKeyDown = useCallback(() => {
    if (pressStartTimeRef.current) return; // Already pressed

    if (silenceTimerRef.current) {
      clearTimeout(silenceTimerRef.current);
      silenceTimerRef.current = null;
    }

    pressStartTimeRef.current = Date.now();
    setIsKeyDown(true);
    startTone();
  }, [timingConfig.pitch, timingConfig.volume]);

  // Key Up Handler
  const handleKeyUp = useCallback(() => {
    if (!pressStartTimeRef.current) return;

    const now = Date.now();
    const duration = now - pressStartTimeRef.current;
    pressStartTimeRef.current = null;
    lastReleaseTimeRef.current = now;

    setIsKeyDown(false);
    stopTone();

    // Classify Dot vs Dash
    const t = getMorseTiming(timingConfig.wpm);
    const isDash = duration > t.dotMaxMs;
    const symbol = isDash ? '-' : '.';

    currentLetterRef.current += symbol;
    setCurrentLetterMorse(currentLetterRef.current);
    setRawMorse((prev) => prev + symbol);

    // Schedule silence timers for letter and word breaks
    silenceTimerRef.current = setTimeout(() => {
      setRawMorse((prev) => prev + ' ');
      finishLetter();

      silenceTimerRef.current = setTimeout(() => {
        setRawMorse((prev) => prev + '/ ');
        finishWord();
      }, t.wordGapMs - t.letterGapMs);
    }, t.letterGapMs);
  }, [timingConfig.wpm, finishLetter, finishWord]);

  // Global Spacebar listener for telegraph key
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleKeyDown();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space' && e.target === document.body) {
        e.preventDefault();
        handleKeyUp();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);

    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
      if (silenceTimerRef.current) clearTimeout(silenceTimerRef.current);
    };
  }, [handleKeyDown, handleKeyUp]);

  // AI Enhance & Translate
  const handleAiEnhance = async () => {
    if (!decodedText.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: decodedText,
          mode: 'qcode_expand',
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setEnhancedText(data.enhancedText);
        speakText(data.enhancedText, {
          voiceIndex: voiceConfig.voiceIndex,
          rate: voiceConfig.rate,
          pitch: voiceConfig.pitch,
          volume: voiceConfig.volume,
        });

        onSaveHistory({
          sourceType: 'keyer',
          rawMorse,
          decodedText,
          enhancedText: data.enhancedText,
        });
      }
    } catch (err) {
      console.error('AI error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  const handleSpeakText = () => {
    const text = enhancedText || decodedText;
    if (!text) return;
    if (isSpeaking) {
      stopSpeech();
      setIsSpeaking(false);
    } else {
      speakText(text, {
        voiceIndex: voiceConfig.voiceIndex,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume,
        onEnd: () => setIsSpeaking(false),
      });
      setIsSpeaking(true);
    }
  };

  const handleCopy = () => {
    const text = enhancedText || decodedText;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setRawMorse('');
    setDecodedText('');
    setCurrentLetterMorse('');
    setEnhancedText(null);
    currentLetterRef.current = '';
    decodedTextRef.current = '';
  };

  return (
    <div className="space-y-6">
      {/* Telegraph Key Visual Control Center */}
      <div className="p-8 bg-slate-950 rounded-md border border-slate-800 shadow-xl text-center relative overflow-hidden">
        {/* Signal Light Indicator */}
        <div className="flex justify-center items-center gap-3 mb-6">
          <div
            className={`w-3.5 h-3.5 rounded-sm transition-all duration-75 ${
              isKeyDown
                ? 'bg-blue-500 shadow-[0_0_16px_rgba(59,130,246,1)] scale-125'
                : 'bg-slate-800'
            }`}
          />
          <span className="font-mono text-xs font-bold tracking-widest uppercase text-slate-400">
            {isKeyDown ? 'TRANSMITTING BEEP (KEY DOWN)' : 'KEY STANDBY (PRESS SPACEBAR OR BUTTON)'}
          </span>
        </div>

        {/* Big Interactive Telegraph Key Button */}
        <div className="max-w-md mx-auto relative group">
          <button
            id="telegraph-key-pad"
            onMouseDown={handleKeyDown}
            onMouseUp={handleKeyUp}
            onMouseLeave={handleKeyUp}
            onTouchStart={(e) => {
              e.preventDefault();
              handleKeyDown();
            }}
            onTouchEnd={(e) => {
              e.preventDefault();
              handleKeyUp();
            }}
            className={`w-full py-12 rounded-md font-mono text-xl font-bold uppercase tracking-widest transition-all duration-75 select-none touch-none shadow-2xl flex flex-col items-center justify-center gap-2 border-2 ${
              isKeyDown
                ? 'bg-blue-600 text-white border-blue-400 translate-y-1 shadow-[0_0_20px_rgba(59,130,246,0.5)]'
                : 'bg-slate-900 hover:bg-slate-850 text-blue-400 border-slate-800 shadow-black'
            }`}
          >
            <Radio className={`w-8 h-8 ${isKeyDown ? 'animate-bounce text-white' : 'text-blue-400'}`} />
            <span>{isKeyDown ? 'TRANSMITTING' : 'PRESS TELEGRAPH KEY'}</span>
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider flex items-center gap-1 mt-1">
              <Keyboard className="w-3.5 h-3.5" /> OR HOLD [SPACEBAR]
            </span>
          </button>
        </div>

        {/* Current forming symbol badge */}
        <div className="mt-6 flex justify-center items-center gap-3">
          <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500">CURRENT BUFFER:</span>
          <span className="font-mono text-xl text-blue-400 font-bold bg-slate-900 px-4 py-1.5 rounded-sm border border-slate-800 tracking-widest">
            {currentLetterMorse || 'READY'}
          </span>
        </div>
      </div>

      {/* Action Toolbar */}
      <div className="p-4 bg-slate-950 rounded-md border border-slate-800 flex flex-wrap items-center justify-between gap-3 shadow-md">
        <div className="flex items-center gap-2.5">
          <button
            id="keyer-speak-btn"
            onClick={handleSpeakText}
            disabled={!decodedText}
            className="px-4 py-2.5 rounded-sm bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition"
          >
            {isSpeaking ? <Square className="w-4 h-4 text-blue-400 fill-blue-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            {isSpeaking ? 'Stop Audio' : 'Play Audio'}
          </button>

          <button
            id="keyer-ai-btn"
            onClick={handleAiEnhance}
            disabled={!decodedText || isEnhancing}
            className="px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white border border-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition"
          >
            <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
            {isEnhancing ? 'Processing...' : 'AI Process'}
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            id="keyer-copy-btn"
            onClick={handleCopy}
            disabled={!decodedText}
            className="px-3.5 py-2.5 rounded-sm bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 border border-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
            {copied ? 'Copied' : 'Copy'}
          </button>
          <button
            id="keyer-clear-btn"
            onClick={handleClear}
            disabled={!decodedText}
            className="px-3.5 py-2.5 rounded-sm bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-300 hover:text-red-400 border border-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
          >
            <Trash2 className="w-3.5 h-3.5" />
            Clear
          </button>
        </div>
      </div>

      {/* Raw Morse vs Translated Text Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Keyed Morse Stream */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col h-48 shadow-md">
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-2 border-b border-slate-800 mb-3">
            Morse Input Stream
          </h2>
          <div className="flex-1 overflow-y-auto font-mono text-blue-400 text-2xl tracking-widest leading-relaxed break-all bg-slate-900 p-4 rounded-md border border-slate-800/80">
            {rawMorse || <span className="text-slate-600 italic text-sm">...- --- .. -.-. . (Keyed Morse symbols stream here...)</span>}
          </div>
        </div>

        {/* Decoded Speech Output */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col h-48 shadow-md">
          <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase pb-2 border-b border-slate-800 mb-3">
            Decoded Speech
          </h2>
          <div className="flex-1 overflow-y-auto font-light text-white text-3xl leading-relaxed break-words bg-slate-900 p-4 rounded-md border border-slate-800/80">
            {enhancedText ? (
              <div className="space-y-2">
                <p className="text-white font-light">"{enhancedText}"</p>
                <span className="text-[10px] font-mono text-blue-400 bg-blue-950 px-2 py-0.5 rounded-sm border border-blue-800 block uppercase tracking-widest">
                  AI ENHANCED SPEECH
                </span>
              </div>
            ) : decodedText ? (
              <p>"{decodedText}"</p>
            ) : (
              <span className="text-slate-600 italic text-lg font-light">"DECODER WAITING"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
