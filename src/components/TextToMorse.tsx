import React, { useState, useRef } from 'react';
import { Play, Square, Volume2, Copy, Sparkles, Zap, Radio, Check } from 'lucide-react';
import { MorseTimingConfig, VoiceConfig, MorseTranslationHistory } from '../types';
import { encodeTextToMorse } from '../utils/morse';
import { playMorseSequence, speakText, stopSpeech } from '../utils/audio';

interface TextToMorseProps {
  timingConfig: MorseTimingConfig;
  voiceConfig: VoiceConfig;
  onSaveHistory: (item: Omit<MorseTranslationHistory, 'id' | 'timestamp'>) => void;
}

const PRESETS = [
  { label: 'SOS Emergency', text: 'SOS EMERGENCY NEED ASSISTANCE' },
  { label: 'CQ HAM Call', text: 'CQ CQ CQ DE W1AW K' },
  { label: '73 Best Regards', text: '73 BEST REGARDS GOOD LUCK' },
  { label: 'QTH Location', text: 'QTH NEW YORK CITY USA' },
  { label: 'Weather Report', text: 'WX SUNNY TEMP 22C' },
];

export const TextToMorse: React.FC<TextToMorseProps> = ({
  timingConfig,
  voiceConfig,
  onSaveHistory,
}) => {
  const [inputText, setInputText] = useState('HELLO WORLD THIS IS A LIVE MORSE TRANSLATOR');
  const [isPlayingMorse, setIsPlayingMorse] = useState(false);
  const [isPlayingSpeech, setIsPlayingSpeech] = useState(false);
  const [currentSymbol, setCurrentSymbol] = useState<string | null>(null);
  const [copiedMorse, setCopiedMorse] = useState(false);
  const [copiedText, setCopiedText] = useState(false);
  const [flashLight, setFlashLight] = useState(false);

  const stopPlaybackRef = useRef(false);

  const generatedMorse = encodeTextToMorse(inputText);

  // Play Morse Beep Audio Sequence
  const handlePlayMorse = async () => {
    if (isPlayingMorse) {
      stopPlaybackRef.current = true;
      setIsPlayingMorse(false);
      setCurrentSymbol(null);
      setFlashLight(false);
      return;
    }

    if (!generatedMorse.trim()) return;

    stopPlaybackRef.current = false;
    setIsPlayingMorse(true);

    await playMorseSequence(generatedMorse, {
      wpm: timingConfig.wpm,
      pitch: timingConfig.pitch,
      volume: timingConfig.volume,
      shouldStop: () => stopPlaybackRef.current,
      onSymbolStart: (symbol) => {
        setCurrentSymbol(symbol);
        if (symbol === '.' || symbol === '-') {
          setFlashLight(true);
        }
      },
      onSymbolEnd: () => {
        setCurrentSymbol(null);
        setFlashLight(false);
      },
    });

    setIsPlayingMorse(false);
    setCurrentSymbol(null);
    setFlashLight(false);

    onSaveHistory({
      sourceType: 'text',
      rawMorse: generatedMorse,
      decodedText: inputText,
    });
  };

  // Play Web Speech API Speech
  const handlePlaySpeech = () => {
    if (isPlayingSpeech) {
      stopSpeech();
      setIsPlayingSpeech(false);
    } else {
      if (!inputText.trim()) return;
      speakText(inputText, {
        voiceIndex: voiceConfig.voiceIndex,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume,
        onEnd: () => setIsPlayingSpeech(false),
      });
      setIsPlayingSpeech(true);
    }
  };

  const handleCopyMorse = () => {
    navigator.clipboard.writeText(generatedMorse);
    setCopiedMorse(true);
    setTimeout(() => setCopiedMorse(false), 2000);
  };

  const handleCopyText = () => {
    navigator.clipboard.writeText(inputText);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Light Beacon / Transmitter Simulator */}
      <div
        className={`p-6 rounded-md border transition-all duration-100 flex flex-wrap items-center justify-between gap-4 shadow-xl ${
          flashLight
            ? 'bg-blue-600 text-white border-blue-400 shadow-[0_0_35px_rgba(59,130,246,0.8)]'
            : 'bg-slate-950 text-slate-100 border-slate-800'
        }`}
      >
        <div className="flex items-center gap-4">
          <div
            className={`w-12 h-12 rounded-sm flex items-center justify-center font-bold text-xl transition-all ${
              flashLight ? 'bg-white text-blue-600 scale-110' : 'bg-slate-900 text-blue-400 border border-slate-800'
            }`}
          >
            <Zap className={`w-6 h-6 ${flashLight ? 'animate-bounce' : ''}`} />
          </div>
          <div>
            <h3 className="font-bold text-base uppercase tracking-wider text-white">Morse Optical & Audio Transmitter</h3>
            <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">
              {isPlayingMorse
                ? `ACTIVE TRANSMISSION — SYMBOL: ${currentSymbol || 'GAP'}`
                : 'READY TO TRANSMIT MORSE SOUND AND FLASH LIGHT'}
            </p>
          </div>
        </div>

        {/* Big Play Morse Audio Button */}
        <button
          id="play-morse-audio-btn"
          onClick={handlePlayMorse}
          className={`px-6 py-3 rounded-sm font-bold text-xs uppercase tracking-widest flex items-center gap-2.5 transition shadow-lg border ${
            isPlayingMorse
              ? 'bg-red-600 hover:bg-red-500 text-white border-red-500 shadow-red-500/20'
              : 'bg-blue-600 hover:bg-blue-500 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
          }`}
        >
          {isPlayingMorse ? (
            <>
              <Square className="w-4 h-4 fill-current" />
              Stop Morse Tone
            </>
          ) : (
            <>
              <Play className="w-4 h-4 fill-current" />
              Play Morse Audio Beep
            </>
          )}
        </button>
      </div>

      {/* Quick Presets Bar */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <span className="text-xs font-mono font-bold uppercase tracking-widest text-slate-500 whitespace-nowrap flex items-center gap-1.5">
          <Radio className="w-3.5 h-3.5 text-blue-400" /> Presets:
        </span>
        {PRESETS.map((p, idx) => (
          <button
            key={idx}
            onClick={() => setInputText(p.text)}
            className="px-3.5 py-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-mono font-semibold whitespace-nowrap border border-slate-800 transition uppercase tracking-wider"
          >
            {p.label}
          </button>
        ))}
      </div>

      {/* Text Input & Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Input Text Card */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Input Text Message
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopyText}
                className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                title="Copy text"
              >
                {copiedText ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4" />}
              </button>
              <button
                onClick={handlePlaySpeech}
                className="px-3 py-1 rounded-sm bg-slate-900 hover:bg-slate-800 text-blue-400 border border-slate-800 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5"
              >
                {isPlayingSpeech ? <Square className="w-3.5 h-3.5 fill-blue-400" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isPlayingSpeech ? 'Stop Voice' : 'Speak Text'}
              </button>
            </div>
          </div>

          <textarea
            id="text-input-field"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            rows={5}
            placeholder="Type message to encode into Morse code..."
            className="w-full bg-slate-900 text-slate-100 p-4 rounded-md border border-slate-800 focus:border-blue-500 focus:outline-none font-sans text-base leading-relaxed resize-none"
          />

          <div className="flex justify-between items-center text-xs text-slate-500 font-mono uppercase tracking-wider">
            <span>CHARS: {inputText.length}</span>
            <span>WPM: {timingConfig.wpm} | FREQ: {timingConfig.pitch}Hz</span>
          </div>
        </div>

        {/* Output Encoded Morse Code Card */}
        <div className="p-5 bg-slate-950 rounded-md border border-slate-800 flex flex-col space-y-3 shadow-md">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <h2 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
              Encoded Morse Output
            </h2>
            <button
              onClick={handleCopyMorse}
              className="p-1.5 rounded-sm hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
              title="Copy Morse Code"
            >
              {copiedMorse ? <Check className="w-4 h-4 text-blue-400" /> : <Copy className="w-4 h-4" />}
            </button>
          </div>

          <div className="flex-1 overflow-y-auto bg-slate-900 p-4 rounded-md border border-slate-800 font-mono text-blue-400 text-xl tracking-widest leading-relaxed break-all max-h-48">
            {generatedMorse || <span className="text-slate-600 italic text-sm">Encoded Morse dots and dashes will appear here...</span>}
          </div>

          <div className="text-[11px] text-slate-500 font-mono uppercase tracking-wider">
            <span>Dot (.) = 1 unit | Dash (-) = 3 units | Gap (/) = 7 units</span>
          </div>
        </div>
      </div>
    </div>
  );
};
