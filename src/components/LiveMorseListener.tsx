import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Play, Square, Volume2, Sparkles, Copy, Trash2, Mic, MicOff, Settings2, RefreshCw, Check } from 'lucide-react';
import { MorseTimingConfig, VoiceConfig, MorseTranslationHistory } from '../types';
import { getMorseTiming, REVERSE_MORSE_MAP, PROSIGS_MAP } from '../utils/morse';
import { AudioOscilloscope } from './AudioOscilloscope';
import { speakText, stopSpeech, playMorseTone } from '../utils/audio';

interface LiveMorseListenerProps {
  timingConfig: MorseTimingConfig;
  onUpdateTiming: (config: Partial<MorseTimingConfig>) => void;
  voiceConfig: VoiceConfig;
  onSaveHistory: (item: Omit<MorseTranslationHistory, 'id' | 'timestamp'>) => void;
}

export const LiveMorseListener: React.FC<LiveMorseListenerProps> = ({
  timingConfig,
  onUpdateTiming,
  voiceConfig,
  onSaveHistory,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [currentDb, setCurrentDb] = useState(-80);
  const [isToneActive, setIsToneActive] = useState(false);
  const [detectedFreq, setDetectedFreq] = useState(timingConfig.targetFrequency);
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [enhancedSpeech, setEnhancedSpeech] = useState<string | null>(null);

  // Live Decoder State
  const [rawMorseStream, setRawMorseStream] = useState<string>('');
  const [currentLetterMorse, setCurrentLetterMorse] = useState<string>('');
  const [fullTranscript, setFullTranscript] = useState<string>('');
  const [pulseHistory, setPulseHistory] = useState<{ type: '.' | '-'; timestamp: number }[]>([]);

  // Refs for audio processing
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);
  const animFrameRef = useRef<number | null>(null);

  // Decoder timing refs to prevent stale state in requestAnimationFrame loops
  const toneStartTimeRef = useRef<number | null>(null);
  const lastToneEndTimeRef = useRef<number>(Date.now());
  const currentLetterMorseRef = useRef<string>('');
  const fullTranscriptRef = useRef<string>('');
  const isToneActiveRef = useRef<boolean>(false);

  const timing = getMorseTiming(timingConfig.wpm);

  // Auto-speak callback wrapper
  const handleAutoSpeak = useCallback((textToSpeak: string) => {
    if (!textToSpeak.trim()) return;
    speakText(textToSpeak, {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
      onEnd: () => setIsSpeaking(false),
    });
    setIsSpeaking(true);
  }, [voiceConfig]);

  // Decode finished letter morse (e.g. "... " -> "S")
  const processCompletedLetter = useCallback(() => {
    const code = currentLetterMorseRef.current.trim();
    if (!code) return;

    let char = REVERSE_MORSE_MAP[code];
    if (PROSIGS_MAP[code]) {
      char = `[${PROSIGS_MAP[code]}]`;
    } else if (!char) {
      char = '?';
    }

    fullTranscriptRef.current += char;
    setFullTranscript(fullTranscriptRef.current);
    currentLetterMorseRef.current = '';
    setCurrentLetterMorse(currentLetterMorseRef.current);

    if (voiceConfig.autoSpeakLetters) {
      handleAutoSpeak(char);
    }
  }, [voiceConfig.autoSpeakLetters, handleAutoSpeak]);

  // Decode finished word gap
  const processCompletedWord = useCallback(() => {
    if (fullTranscriptRef.current && !fullTranscriptRef.current.endsWith(' ')) {
      const words = fullTranscriptRef.current.trim().split(' ');
      const lastWord = words[words.length - 1];

      fullTranscriptRef.current += ' ';
      setFullTranscript(fullTranscriptRef.current);

      if (voiceConfig.autoSpeakWords && lastWord) {
        handleAutoSpeak(lastWord);
      }
    }
  }, [voiceConfig.autoSpeakWords, handleAutoSpeak]);

  // Start microphone acquisition and AudioNode processing pipeline
  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      mediaStreamRef.current = stream;

      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const source = ctx.createMediaStreamSource(stream);

      // Biquad Bandpass Filter to isolate target frequency (e.g. 700 Hz)
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.value = timingConfig.targetFrequency;
      bandpass.Q.value = 8.0; // Sharp quality factor for tone isolation

      const analyser = ctx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.3;
      analyserRef.current = analyser;

      source.connect(bandpass);
      bandpass.connect(analyser);

      setIsListening(true);

      const freqData = new Uint8Array(analyser.frequencyBinCount);
      const timeData = new Uint8Array(analyser.frequencyBinCount);

      // Main Loop
      const processAudio = () => {
        analyser.getByteFrequencyData(freqData);
        analyser.getByteTimeDomainData(timeData);

        // Find peak frequency in signal
        let maxVal = 0;
        let maxBin = 0;
        for (let i = 0; i < freqData.length; i++) {
          if (freqData[i] > maxVal) {
            maxVal = freqData[i];
            maxBin = i;
          }
        }

        const nyquist = ctx.sampleRate / 2;
        const binFreq = Math.round((maxBin / freqData.length) * nyquist);
        setDetectedFreq(binFreq);

        // Calculate RMS volume in dB
        let sum = 0;
        for (let i = 0; i < timeData.length; i++) {
          const sample = (timeData[i] - 128) / 128;
          sum += sample * sample;
        }
        const rms = Math.sqrt(sum / timeData.length);
        const db = rms > 0 ? 20 * Math.log10(rms) : -100;
        setCurrentDb(db);

        const now = Date.now();
        const isAboveThreshold = db > timingConfig.thresholdDb;

        // Tone ON
        if (isAboveThreshold) {
          if (!toneStartTimeRef.current) {
            toneStartTimeRef.current = now;
            isToneActiveRef.current = true;
            setIsToneActive(true);
          }
        } else {
          // Tone OFF
          if (toneStartTimeRef.current) {
            const toneDuration = now - toneStartTimeRef.current;
            toneStartTimeRef.current = null;
            isToneActiveRef.current = false;
            setIsToneActive(false);
            lastToneEndTimeRef.current = now;

            // Classify Dot vs Dash
            const t = getMorseTiming(timingConfig.wpm);
            if (toneDuration >= t.dotMinMs && toneDuration <= t.dashMaxMs * 1.5) {
              const isDash = toneDuration > t.dotMaxMs;
              const symbol = isDash ? '-' : '.';

              currentLetterMorseRef.current += symbol;
              setCurrentLetterMorse(currentLetterMorseRef.current);
              setRawMorseStream((prev) => prev + symbol);

              setPulseHistory((prev) => [
                ...prev.slice(-30),
                { type: symbol, timestamp: now },
              ]);

              // Audio side-tone feedback
              playMorseTone(40, timingConfig.pitch, 0.1);
            }
          } else if (currentLetterMorseRef.current) {
            // Check silence duration for Letter / Word completion
            const silenceDuration = now - lastToneEndTimeRef.current;
            const t = getMorseTiming(timingConfig.wpm);

            if (silenceDuration > t.letterGapMs && currentLetterMorseRef.current) {
              setRawMorseStream((prev) => prev + ' ');
              processCompletedLetter();
            } else if (silenceDuration > t.wordGapMs && fullTranscriptRef.current && !fullTranscriptRef.current.endsWith(' ')) {
              setRawMorseStream((prev) => prev + '/ ');
              processCompletedWord();
            }
          }
        }

        animFrameRef.current = requestAnimationFrame(processAudio);
      };

      processAudio();
    } catch (err) {
      console.error('Microphone access error:', err);
      alert('Could not access microphone. Please allow microphone permissions in your browser.');
    }
  };

  const stopMic = () => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (mediaStreamRef.current) {
      mediaStreamRef.current.getTracks().forEach((track) => track.stop());
      mediaStreamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setIsListening(false);
    setIsToneActive(false);
    toneStartTimeRef.current = null;
  };

  useEffect(() => {
    return () => {
      stopMic();
    };
  }, []);

  // AI Enhance & Polish Transcribed Text
  const handleAiEnhance = async () => {
    if (!fullTranscript.trim()) return;
    setIsEnhancing(true);
    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: fullTranscript,
          mode: 'qcode_expand',
        }),
      });
      const data = await res.json();
      if (data.enhancedText) {
        setEnhancedSpeech(data.enhancedText);
        speakText(data.enhancedText, {
          voiceIndex: voiceConfig.voiceIndex,
          rate: voiceConfig.rate,
          pitch: voiceConfig.pitch,
          volume: voiceConfig.volume,
        });

        // Save to history log
        onSaveHistory({
          sourceType: 'mic',
          rawMorse: rawMorseStream,
          decodedText: fullTranscript,
          enhancedText: data.enhancedText,
        });
      }
    } catch (err) {
      console.error('AI Enhance error:', err);
    } finally {
      setIsEnhancing(false);
    }
  };

  // Play full text speech
  const handleSpeakFull = () => {
    const text = enhancedSpeech || fullTranscript;
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
    const text = enhancedSpeech || fullTranscript;
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleClear = () => {
    setFullTranscript('');
    setRawMorseStream('');
    setCurrentLetterMorse('');
    setEnhancedSpeech(null);
    currentLetterMorseRef.current = '';
    fullTranscriptRef.current = '';
  };

  return (
    <div className="space-y-6">
      {/* Oscilloscope Canvas & Signal Visualizer */}
      <AudioOscilloscope
        analyserNode={analyserRef.current}
        isListening={isListening}
        thresholdDb={timingConfig.thresholdDb}
        currentDb={currentDb}
        targetFreq={timingConfig.targetFrequency}
        isToneActive={isToneActive}
        pulseHistory={pulseHistory}
      />

      {/* Control Toolbar */}
      <div className="p-5 bg-slate-950 rounded-md border border-slate-800 shadow-xl flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <button
            id="mic-listen-btn"
            onClick={isListening ? stopMic : startMic}
            className={`px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 transition-all shadow-md ${
              isListening
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-red-500/20'
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_12px_rgba(59,130,246,0.4)]'
            }`}
          >
            {isListening ? (
              <>
                <MicOff className="w-4 h-4 animate-pulse" />
                Stop Live Listening
              </>
            ) : (
              <>
                <Mic className="w-4 h-4" />
                Start Live Listening
              </>
            )}
          </button>

          {/* Quick Stats */}
          <div className="hidden sm:flex items-center gap-5 text-xs font-mono px-4 py-2.5 rounded-sm bg-slate-900 border border-slate-800 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">WPM RATE</span>
              <span className="text-blue-400 font-bold">{timingConfig.wpm} WPM</span>
            </div>
            <div className="w-px h-6 bg-slate-800" />
            <div>
              <span className="text-slate-500 block text-[10px] font-bold uppercase tracking-wider">TARGET FREQ</span>
              <span className="text-blue-400 font-bold">{timingConfig.targetFrequency} Hz</span>
            </div>
          </div>
        </div>

        {/* Live Audio Controls */}
        <div className="flex items-center gap-2.5">
          <button
            id="speak-transcript-btn"
            onClick={handleSpeakFull}
            disabled={!fullTranscript}
            className="px-4 py-2.5 rounded-sm bg-slate-900 hover:bg-slate-800 disabled:opacity-40 text-slate-200 border border-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition"
          >
            {isSpeaking ? <Square className="w-4 h-4 text-blue-400 fill-blue-400" /> : <Volume2 className="w-4 h-4 text-blue-400" />}
            {isSpeaking ? 'Stop Audio' : 'Play Audio'}
          </button>

          <button
            id="ai-enhance-btn"
            onClick={handleAiEnhance}
            disabled={!fullTranscript || isEnhancing}
            className="px-4 py-2.5 rounded-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white border border-blue-500 text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] transition"
          >
            <Sparkles className={`w-4 h-4 ${isEnhancing ? 'animate-spin' : ''}`} />
            {isEnhancing ? 'Processing...' : 'AI Process'}
          </button>
        </div>
      </div>

      {/* Threshold & Sensitivity Calibration Panel */}
      <div className="p-5 bg-slate-950 rounded-md border border-slate-800 grid grid-cols-1 md:grid-cols-3 gap-6 text-xs">
        {/* Sensitivity Threshold Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px] flex items-center gap-1.5">
              <Settings2 className="w-3.5 h-3.5 text-blue-400" /> Noise Threshold
            </span>
            <span className="font-mono text-blue-400 font-bold">{timingConfig.thresholdDb} dB</span>
          </div>
          <input
            id="threshold-slider"
            type="range"
            min="-60"
            max="-10"
            step="1"
            value={timingConfig.thresholdDb}
            onChange={(e) => onUpdateTiming({ thresholdDb: parseFloat(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-sm cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 uppercase">
            <span>High Sensitivity (-60dB)</span>
            <span>Noise Gate (-10dB)</span>
          </div>
        </div>

        {/* Target Frequency Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">Tone Pitch Frequency</span>
            <span className="font-mono text-blue-400 font-bold">{timingConfig.targetFrequency} Hz</span>
          </div>
          <input
            id="freq-slider"
            type="range"
            min="400"
            max="1200"
            step="10"
            value={timingConfig.targetFrequency}
            onChange={(e) => onUpdateTiming({ targetFrequency: parseInt(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-sm cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 uppercase">
            <span>400Hz</span>
            <span>1200Hz</span>
          </div>
        </div>

        {/* Speed WPM Slider */}
        <div>
          <div className="flex justify-between text-slate-300 mb-2">
            <span className="font-bold uppercase tracking-wider text-slate-400 text-[11px]">Morse Speed Calibration</span>
            <span className="font-mono text-blue-400 font-bold">{timingConfig.wpm} WPM</span>
          </div>
          <input
            id="wpm-slider"
            type="range"
            min="5"
            max="40"
            step="1"
            value={timingConfig.wpm}
            onChange={(e) => onUpdateTiming({ wpm: parseInt(e.target.value) })}
            className="w-full accent-blue-500 h-1.5 bg-slate-800 rounded-sm cursor-pointer"
          />
          <div className="flex justify-between text-[10px] font-mono text-slate-500 mt-1 uppercase">
            <span>5 WPM</span>
            <span>40 WPM</span>
          </div>
        </div>
      </div>

      {/* Live Decoded Output Stream Display */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Raw Morse Code Stream */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col h-56 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Morse Input Stream
            </h2>
            <span className="text-[10px] font-mono font-bold text-blue-400 px-2 py-0.5 rounded-sm bg-blue-950 border border-blue-800 uppercase">
              BUFFER: {currentLetterMorse || 'READY'}
            </span>
          </div>
          <div className="flex-1 overflow-y-auto font-mono text-blue-400 text-2xl tracking-widest leading-relaxed break-all bg-slate-900 p-4 rounded-md border border-slate-800/80">
            {rawMorseStream ? (
              <>
                {rawMorseStream}
                <span className="animate-pulse text-blue-500 ml-1">|</span>
              </>
            ) : (
              <span className="opacity-40 text-slate-600 italic text-sm">...- --- .. -.-. . (Waiting for Morse audio signal...)</span>
            )}
          </div>
        </div>

        {/* Live Translated Text */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col h-56 shadow-md">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800 mb-3">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Decoded Speech
            </h2>
            <div className="flex items-center gap-1.5">
              <button
                id="copy-transcript-btn"
                onClick={handleCopy}
                disabled={!fullTranscript}
                className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-white disabled:opacity-30 border border-slate-800"
                title="Copy to clipboard"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
              <button
                id="clear-transcript-btn"
                onClick={handleClear}
                disabled={!fullTranscript}
                className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-red-400 disabled:opacity-30 border border-slate-800"
                title="Clear transcript"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto font-light text-white text-3xl leading-relaxed break-words bg-slate-900 p-4 rounded-md border border-slate-800/80">
            {enhancedSpeech ? (
              <div className="space-y-2">
                <p className="text-white font-light">"{enhancedSpeech}"</p>
                <span className="text-[10px] font-mono text-blue-400 uppercase tracking-widest bg-blue-950 px-2 py-0.5 rounded-sm border border-blue-800 block">
                  AI ENHANCED SPEECH
                </span>
              </div>
            ) : fullTranscript ? (
              <p>"{fullTranscript}"</p>
            ) : (
              <span className="text-slate-600 italic text-lg font-light">"DECODER WAITING"</span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
