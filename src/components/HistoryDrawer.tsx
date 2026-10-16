import React from 'react';
import { History, Trash2, Volume2, Copy, X, Mic, Radio, Type, Sparkles } from 'lucide-react';
import { MorseTranslationHistory, VoiceConfig } from '../types';
import { speakText } from '../utils/audio';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  history: MorseTranslationHistory[];
  onClear: () => void;
  voiceConfig: VoiceConfig;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  history,
  onClear,
  voiceConfig,
}) => {
  if (!isOpen) return null;

  const handleSpeak = (text: string) => {
    speakText(text, {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
    });
  };

  const getSourceIcon = (type: MorseTranslationHistory['sourceType']) => {
    switch (type) {
      case 'mic':
        return <Mic className="w-3.5 h-3.5 text-amber-400" />;
      case 'keyer':
        return <Radio className="w-3.5 h-3.5 text-sky-400" />;
      case 'text':
        return <Type className="w-3.5 h-3.5 text-emerald-400" />;
      case 'ai':
        return <Sparkles className="w-3.5 h-3.5 text-indigo-400" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-xs">
      <div className="w-full max-w-md bg-slate-950 border-l border-slate-800 h-full flex flex-col shadow-2xl">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950">
          <h2 className="font-bold text-white text-base uppercase tracking-wider flex items-center gap-2">
            <History className="w-5 h-5 text-blue-400" /> Translation Log History
          </h2>
          <div className="flex items-center gap-2">
            <button
              onClick={onClear}
              disabled={history.length === 0}
              className="p-1.5 rounded-sm text-slate-400 hover:text-red-400 disabled:opacity-30 border border-slate-800 hover:bg-slate-900 transition"
              title="Clear log"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-sm text-slate-400 hover:text-slate-200 border border-slate-800 hover:bg-slate-900 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {history.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs font-mono uppercase tracking-wider italic">
              No translation history log recorded.
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="p-4 bg-slate-900 rounded-sm border border-slate-800 space-y-2.5 group hover:border-blue-500/50 transition shadow-sm"
              >
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                  <span className="flex items-center gap-1.5 font-bold uppercase text-slate-300">
                    {getSourceIcon(item.sourceType)} {item.sourceType}
                  </span>
                  <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                </div>

                {item.rawMorse && (
                  <p className="font-mono text-xs text-blue-400 tracking-widest break-all bg-slate-950 p-2.5 rounded-sm border border-slate-800">
                    {item.rawMorse}
                  </p>
                )}

                <p className="text-sm font-medium text-slate-100">{item.enhancedText || item.decodedText}</p>

                <div className="flex justify-end gap-2 pt-1">
                  <button
                    onClick={() => navigator.clipboard.writeText(item.enhancedText || item.decodedText)}
                    className="p-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-slate-200 border border-slate-800"
                    title="Copy"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleSpeak(item.enhancedText || item.decodedText)}
                    className="p-1.5 rounded-sm bg-slate-950 hover:bg-slate-800 text-blue-400 border border-slate-800"
                    title="Play voice speech"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
