import React, { useState } from 'react';
import { Mic, Radio, Type, BookOpen, Sparkles, Sliders, History, RadioTower, Volume2 } from 'lucide-react';
import { ActiveTab, MorseTimingConfig, VoiceConfig, MorseTranslationHistory } from './types';
import { LiveMorseListener } from './components/LiveMorseListener';
import { TelegraphKeyer } from './components/TelegraphKeyer';
import { TextToMorse } from './components/TextToMorse';
import { MorseCheatSheet } from './components/MorseCheatSheet';
import { AiEnhancer } from './components/AiEnhancer';
import { SettingsModal } from './components/SettingsModal';
import { HistoryDrawer } from './components/HistoryDrawer';

export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>('listen');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  // Global Timing & Audio Config
  const [timingConfig, setTimingConfig] = useState<MorseTimingConfig>({
    wpm: 18,
    pitch: 650,
    volume: 0.5,
    thresholdDb: -38,
    targetFrequency: 700,
    toleranceHz: 150,
  });

  // Global Text to Speech Config
  const [voiceConfig, setVoiceConfig] = useState<VoiceConfig>({
    voiceIndex: 0,
    rate: 1.0,
    pitch: 1.0,
    volume: 1.0,
    autoSpeakLetters: false,
    autoSpeakWords: true,
  });

  // Translation History Logs
  const [history, setHistory] = useState<MorseTranslationHistory[]>([]);

  const handleUpdateTiming = (update: Partial<MorseTimingConfig>) => {
    setTimingConfig((prev) => ({ ...prev, ...update }));
  };

  const handleUpdateVoice = (update: Partial<VoiceConfig>) => {
    setVoiceConfig((prev) => ({ ...prev, ...update }));
  };

  const handleSaveHistory = (item: Omit<MorseTranslationHistory, 'id' | 'timestamp'>) => {
    const newItem: MorseTranslationHistory = {
      ...item,
      id: Math.random().toString(36).substr(2, 9),
      timestamp: Date.now(),
    };
    setHistory((prev) => [newItem, ...prev.slice(0, 49)]); // keep last 50 items
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 flex flex-col font-sans selection:bg-blue-500 selection:text-white">
      {/* Top Navigation Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-8 py-4 flex items-center justify-between gap-4">
          {/* Geometric Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-blue-500 rounded-sm flex items-center justify-center shadow-[0_0_12px_rgba(59,130,246,0.5)]">
              <div className="w-4 h-1 bg-white"></div>
            </div>
            <div>
              <h1 className="font-bold text-lg tracking-tighter uppercase text-white flex items-center gap-2.5">
                DotDash.AI
                <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest text-blue-400 bg-blue-950/80 border border-blue-800/80 px-2 py-0.5 rounded-sm font-semibold">
                  MORSE TO SPEECH
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 uppercase tracking-wider hidden sm:block">
                Geometric Balance Live Morse Signal & Real-Time Audio Decoder
              </p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-3">
            <button
              id="header-history-btn"
              onClick={() => setIsHistoryOpen(true)}
              className="px-3.5 py-2 rounded-sm bg-slate-950 hover:bg-slate-800 text-slate-300 text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition border border-slate-800"
            >
              <History className="w-4 h-4 text-blue-400" />
              <span className="hidden md:inline">Logs</span>
              {history.length > 0 && (
                <span className="w-4 h-4 rounded-sm bg-blue-500 text-white text-[10px] font-bold flex items-center justify-center font-mono">
                  {history.length}
                </span>
              )}
            </button>

            <button
              id="header-settings-btn"
              onClick={() => setIsSettingsOpen(true)}
              className="px-4 py-2 rounded-sm bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold uppercase tracking-widest flex items-center gap-2 transition shadow-[0_0_10px_rgba(59,130,246,0.3)]"
            >
              <Sliders className="w-4 h-4" />
              <span className="hidden md:inline">Settings</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs Bar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-8 flex items-center gap-2 overflow-x-auto pb-3 pt-1 border-t border-slate-800/80 text-xs font-mono tracking-widest uppercase">
          <button
            id="tab-listen"
            onClick={() => setActiveTab('listen')}
            className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition whitespace-nowrap border ${
              activeTab === 'listen'
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Mic className="w-4 h-4" />
            Live Listening
          </button>

          <button
            id="tab-keyer"
            onClick={() => setActiveTab('keyer')}
            className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition whitespace-nowrap border ${
              activeTab === 'keyer'
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Radio className="w-4 h-4" />
            Telegraph Keyer
          </button>

          <button
            id="tab-text-to-morse"
            onClick={() => setActiveTab('text-to-morse')}
            className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition whitespace-nowrap border ${
              activeTab === 'text-to-morse'
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Type className="w-4 h-4" />
            Text to Morse
          </button>

          <button
            id="tab-cheat-sheet"
            onClick={() => setActiveTab('cheat-sheet')}
            className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition whitespace-nowrap border ${
              activeTab === 'cheat-sheet'
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <BookOpen className="w-4 h-4" />
            Cheat Sheet
          </button>

          <button
            id="tab-ai-translator"
            onClick={() => setActiveTab('ai-translator')}
            className={`px-4 py-2 rounded-sm font-bold flex items-center gap-2 transition whitespace-nowrap border ${
              activeTab === 'ai-translator'
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_12px_rgba(59,130,246,0.4)]'
                : 'bg-slate-950 text-slate-400 hover:text-white border-slate-800 hover:border-slate-700'
            }`}
          >
            <Sparkles className="w-4 h-4 text-blue-300" />
            AI Translator
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-8 space-y-6">
        {activeTab === 'listen' && (
          <LiveMorseListener
            timingConfig={timingConfig}
            onUpdateTiming={handleUpdateTiming}
            voiceConfig={voiceConfig}
            onSaveHistory={handleSaveHistory}
          />
        )}

        {activeTab === 'keyer' && (
          <TelegraphKeyer
            timingConfig={timingConfig}
            onUpdateTiming={handleUpdateTiming}
            voiceConfig={voiceConfig}
            onSaveHistory={handleSaveHistory}
          />
        )}

        {activeTab === 'text-to-morse' && (
          <TextToMorse
            timingConfig={timingConfig}
            voiceConfig={voiceConfig}
            onSaveHistory={handleSaveHistory}
          />
        )}

        {activeTab === 'cheat-sheet' && (
          <MorseCheatSheet
            timingConfig={timingConfig}
            voiceConfig={voiceConfig}
          />
        )}

        {activeTab === 'ai-translator' && (
          <AiEnhancer
            voiceConfig={voiceConfig}
            onSaveHistory={handleSaveHistory}
          />
        )}
      </main>

      {/* Geometric Balance Blue Footer */}
      <footer className="h-10 bg-blue-600 text-[10px] flex items-center justify-between px-6 font-bold uppercase tracking-widest text-white shadow-lg">
        <span className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
          SOURCE: AUDIO INTERFACE 1 (ACTIVE DECODER)
        </span>
        <div className="flex gap-6 font-mono">
          <span>WPM: {timingConfig.wpm}</span>
          <span>FREQ: {timingConfig.pitch}Hz</span>
          <span className="hidden sm:inline">NO ERRORS DETECTED</span>
        </div>
      </footer>

      {/* Modals & Drawers */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        timingConfig={timingConfig}
        onUpdateTiming={handleUpdateTiming}
        voiceConfig={voiceConfig}
        onUpdateVoice={handleUpdateVoice}
      />

      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClear={() => setHistory([])}
        voiceConfig={voiceConfig}
      />
    </div>
  );
}
