import React, { useState } from 'react';
import { Sparkles, Volume2, Square, Copy, Check, Languages, Globe } from 'lucide-react';
import { VoiceConfig, MorseTranslationHistory } from '../types';
import { speakText, stopSpeech } from '../utils/audio';

interface AiEnhancerProps {
  voiceConfig: VoiceConfig;
  onSaveHistory: (item: Omit<MorseTranslationHistory, 'id' | 'timestamp'>) => void;
}

const LANGUAGES = [
  { code: 'English', label: 'English' },
  { code: 'Spanish', label: 'Spanish (Español)' },
  { code: 'French', label: 'French (Français)' },
  { code: 'German', label: 'German (Deutsch)' },
  { code: 'Japanese', label: 'Japanese (日本語)' },
  { code: 'Mandarin Chinese', label: 'Chinese (中文)' },
  { code: 'Italian', label: 'Italian (Italiano)' },
  { code: 'Portuguese', label: 'Portuguese (Português)' },
];

export const AiEnhancer: React.FC<AiEnhancerProps> = ({ voiceConfig, onSaveHistory }) => {
  const [rawInput, setRawInput] = useState('CQ CQ CQ DE K2MTR QTH NEW YORK QSL 73 SK');
  const [mode, setMode] = useState<'qcode_expand' | 'translate' | 'reconstruct'>('qcode_expand');
  const [targetLang, setTargetLang] = useState('English');
  const [isLoading, setIsLoading] = useState(false);
  const [enhancedText, setEnhancedText] = useState<string | null>(null);
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleProcess = async () => {
    if (!rawInput.trim()) return;
    setIsLoading(true);
    setEnhancedText(null);
    setExplanation(null);

    try {
      const res = await fetch('/api/gemini/enhance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          rawText: rawInput,
          mode,
          targetLanguage: targetLang,
        }),
      });

      const data = await res.json();
      if (data.enhancedText) {
        setEnhancedText(data.enhancedText);
        setExplanation(data.explanation || null);

        // Auto speak result
        speakText(data.enhancedText, {
          voiceIndex: voiceConfig.voiceIndex,
          rate: voiceConfig.rate,
          pitch: voiceConfig.pitch,
          volume: voiceConfig.volume,
          onEnd: () => setIsPlaying(false),
        });
        setIsPlaying(true);

        onSaveHistory({
          sourceType: 'ai',
          rawMorse: '',
          decodedText: rawInput,
          enhancedText: data.enhancedText,
        });
      }
    } catch (err) {
      console.error('AI Processing error:', err);
      alert('Could not connect to Gemini AI server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleSpeech = () => {
    if (!enhancedText) return;
    if (isPlaying) {
      stopSpeech();
      setIsPlaying(false);
    } else {
      speakText(enhancedText, {
        voiceIndex: voiceConfig.voiceIndex,
        rate: voiceConfig.rate,
        pitch: voiceConfig.pitch,
        volume: voiceConfig.volume,
        onEnd: () => setIsPlaying(false),
      });
      setIsPlaying(true);
    }
  };

  const handleCopy = () => {
    if (!enhancedText) return;
    navigator.clipboard.writeText(enhancedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className="p-6 bg-slate-950 rounded-md border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 shadow-md">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-sm bg-blue-600/20 border border-blue-500 flex items-center justify-center text-blue-400">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white uppercase tracking-wider">Gemini 3.5 AI Morse & Speech Processing</h2>
            <p className="text-xs text-slate-400 mt-1 font-mono uppercase tracking-wider">
              Server-side Gemini AI for Q-code expansion, Morse error reconstruction & voice translation.
            </p>
          </div>
        </div>
      </div>

      {/* Mode Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <button
          onClick={() => setMode('qcode_expand')}
          className={`p-4 rounded-sm border text-left transition ${
            mode === 'qcode_expand'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <div className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-blue-400" /> Q-Code Expander
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Converts telegraph shorthand (SOS, QTH, 73, CQ, DE) into natural speech.
          </p>
        </button>

        <button
          onClick={() => setMode('reconstruct')}
          className={`p-4 rounded-sm border text-left transition ${
            mode === 'reconstruct'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <div className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
            <Globe className="w-4 h-4 text-blue-400" /> Error Corrector
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Fixes missing letter spaces or broken characters caused by manual timing variations.
          </p>
        </button>

        <button
          onClick={() => setMode('translate')}
          className={`p-4 rounded-sm border text-left transition ${
            mode === 'translate'
              ? 'bg-blue-600/20 border-blue-500 text-white shadow-[0_0_10px_rgba(59,130,246,0.2)]'
              : 'bg-slate-950 border-slate-800 text-slate-400 hover:bg-slate-900'
          }`}
        >
          <div className="font-bold text-xs uppercase tracking-widest text-white flex items-center gap-2">
            <Languages className="w-4 h-4 text-blue-400" /> Speech Translator
          </div>
          <p className="text-xs text-slate-400 mt-2 font-mono">
            Translates decoded Morse messages into foreign spoken languages.
          </p>
        </button>
      </div>

      {/* Target Language Dropdown for Translation mode */}
      {mode === 'translate' && (
        <div className="p-4 bg-slate-950 rounded-sm border border-slate-800 flex items-center gap-3">
          <label className="text-xs font-mono font-bold uppercase tracking-widest text-slate-400 whitespace-nowrap">TARGET LANGUAGE:</label>
          <select
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="bg-slate-900 text-slate-200 text-xs font-mono p-2.5 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none uppercase tracking-wider"
          >
            {LANGUAGES.map((l) => (
              <option key={l.code} value={l.code}>
                {l.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Input Box */}
      <div className="p-5 bg-slate-950 rounded-md border border-slate-800 space-y-3 shadow-md">
        <label className="text-xs font-bold uppercase tracking-widest font-mono text-slate-500 block pb-2 border-b border-slate-800">
          Input Raw Decoded Morse / Telegraph Text
        </label>
        <textarea
          value={rawInput}
          onChange={(e) => setRawInput(e.target.value)}
          rows={4}
          className="w-full bg-slate-900 text-slate-100 p-4 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none font-mono text-base resize-none"
          placeholder="e.g. SOS NEED WATER QTH NYC 73..."
        />

        <div className="flex justify-end">
          <button
            id="ai-process-submit-btn"
            onClick={handleProcess}
            disabled={isLoading || !rawInput.trim()}
            className="px-6 py-3 rounded-sm bg-blue-600 hover:bg-blue-500 disabled:opacity-40 text-white font-bold text-xs uppercase tracking-widest flex items-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.4)] border border-blue-500 transition"
          >
            <Sparkles className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
            {isLoading ? 'Processing with Gemini...' : 'Process & Speak Speech'}
          </button>
        </div>
      </div>

      {/* AI Enhanced Output Card */}
      {enhancedText && (
        <div className="p-6 bg-slate-950 rounded-md border border-blue-500 space-y-4 shadow-2xl">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <span className="text-xs font-bold uppercase tracking-widest font-mono text-blue-400 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> Polished Speech Output
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3.5 py-2 rounded-sm bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-blue-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? 'Copied' : 'Copy'}
              </button>
              <button
                onClick={handleToggleSpeech}
                className="px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 border border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]"
              >
                {isPlaying ? <Square className="w-3.5 h-3.5 fill-current text-white" /> : <Volume2 className="w-3.5 h-3.5" />}
                {isPlaying ? 'Stop Voice' : 'Play Voice'}
              </button>
            </div>
          </div>

          <div className="p-4 bg-slate-900 rounded-sm border border-slate-800 font-sans text-xl text-white font-light leading-relaxed">
            "{enhancedText}"
          </div>

          {explanation && (
            <div className="text-xs text-slate-400 bg-slate-900 p-3.5 rounded-sm border border-slate-800 font-mono">
              <span className="text-blue-400 font-bold block mb-1 uppercase tracking-wider">AI NOTES:</span>
              {explanation}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
