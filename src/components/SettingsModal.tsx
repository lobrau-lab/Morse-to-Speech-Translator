import React, { useEffect, useState } from 'react';
import { Settings, X, Volume2, Mic, Sliders, Check } from 'lucide-react';
import { MorseTimingConfig, VoiceConfig } from '../types';
import { getSystemVoices, speakText } from '../utils/audio';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  timingConfig: MorseTimingConfig;
  onUpdateTiming: (config: Partial<MorseTimingConfig>) => void;
  voiceConfig: VoiceConfig;
  onUpdateVoice: (config: Partial<VoiceConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  timingConfig,
  onUpdateTiming,
  voiceConfig,
  onUpdateVoice,
}) => {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    const updateVoices = () => {
      const vList = getSystemVoices();
      setVoices(vList);
    };

    updateVoices();
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.onvoiceschanged = updateVoices;
    }
  }, []);

  if (!isOpen) return null;

  const testVoice = () => {
    speakText('Testing Morse to Speech translator voice configuration.', {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-slate-950 border border-slate-800 rounded-md shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h2 className="font-bold text-white text-base uppercase tracking-wider flex items-center gap-2">
            <Sliders className="w-5 h-5 text-blue-400" /> Audio & Speech Settings
          </h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-sm text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-900 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto">
          {/* Section 1: Text-to-Speech Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-blue-400" /> Text-to-Speech Real-Time Voice
            </h3>

            {/* Voice Select */}
            <div>
              <label className="block text-xs text-slate-300 font-mono font-bold uppercase tracking-wider mb-2">Voice Engine</label>
              <select
                id="voice-select"
                value={voiceConfig.voiceIndex}
                onChange={(e) => onUpdateVoice({ voiceIndex: parseInt(e.target.value) })}
                className="w-full bg-slate-900 text-slate-200 text-xs p-3 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none"
              >
                {voices.length > 0 ? (
                  voices.map((v, idx) => (
                    <option key={idx} value={idx}>
                      {v.name} ({v.lang})
                    </option>
                  ))
                ) : (
                  <option value={0}>Default System Speech Synthesizer</option>
                )}
              </select>
            </div>

            {/* Rate & Pitch */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono uppercase tracking-wider mb-1">
                  <span>Speech Speed</span>
                  <span className="font-mono text-blue-400">{voiceConfig.rate}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="2.0"
                  step="0.1"
                  value={voiceConfig.rate}
                  onChange={(e) => onUpdateVoice({ rate: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-sm"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono uppercase tracking-wider mb-1">
                  <span>Voice Pitch</span>
                  <span className="font-mono text-blue-400">{voiceConfig.pitch}x</span>
                </div>
                <input
                  type="range"
                  min="0.5"
                  max="1.5"
                  step="0.1"
                  value={voiceConfig.pitch}
                  onChange={(e) => onUpdateVoice({ pitch: parseFloat(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-sm"
                />
              </div>
            </div>

            {/* Auto-Speak Toggles */}
            <div className="p-3.5 bg-slate-900 rounded-sm border border-slate-800 space-y-3 text-xs">
              <label className="flex items-center justify-between text-slate-300 font-mono uppercase tracking-wider cursor-pointer">
                <span>Auto-speak completed characters</span>
                <input
                  type="checkbox"
                  checked={voiceConfig.autoSpeakLetters}
                  onChange={(e) => onUpdateVoice({ autoSpeakLetters: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 rounded-sm cursor-pointer"
                />
              </label>
              <label className="flex items-center justify-between text-slate-300 font-mono uppercase tracking-wider cursor-pointer">
                <span>Auto-speak completed words</span>
                <input
                  type="checkbox"
                  checked={voiceConfig.autoSpeakWords}
                  onChange={(e) => onUpdateVoice({ autoSpeakWords: e.target.checked })}
                  className="w-4 h-4 accent-blue-500 rounded-sm cursor-pointer"
                />
              </label>
            </div>

            <button
              onClick={testVoice}
              className="px-4 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-sm text-xs font-bold uppercase tracking-widest flex items-center gap-2 shadow-[0_0_10px_rgba(59,130,246,0.3)] border border-blue-500 transition"
            >
              <Volume2 className="w-4 h-4" /> Test Voice Sample
            </button>
          </div>

          <div className="h-px bg-slate-800" />

          {/* Section 2: Morse Tone & DSP Settings */}
          <div className="space-y-4">
            <h3 className="text-xs font-mono font-bold text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Mic className="w-4 h-4 text-blue-400" /> Morse Tone & Audio Synthesis
            </h3>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono uppercase tracking-wider mb-1">
                  <span>WPM Speed</span>
                  <span className="font-mono text-blue-400">{timingConfig.wpm} WPM</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="40"
                  step="1"
                  value={timingConfig.wpm}
                  onChange={(e) => onUpdateTiming({ wpm: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-sm"
                />
              </div>

              <div>
                <div className="flex justify-between text-xs text-slate-300 font-mono uppercase tracking-wider mb-1">
                  <span>Tone Pitch</span>
                  <span className="font-mono text-blue-400">{timingConfig.pitch} Hz</span>
                </div>
                <input
                  type="range"
                  min="400"
                  max="1200"
                  step="10"
                  value={timingConfig.pitch}
                  onChange={(e) => onUpdateTiming({ pitch: parseInt(e.target.value) })}
                  className="w-full accent-blue-500 h-1.5 bg-slate-900 rounded-sm"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs uppercase tracking-widest rounded-sm flex items-center gap-2 shadow-[0_0_12px_rgba(59,130,246,0.4)] border border-blue-500"
          >
            <Check className="w-4 h-4" /> Save & Close
          </button>
        </div>
      </div>
    </div>
  );
};
