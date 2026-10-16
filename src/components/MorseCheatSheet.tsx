import React, { useState } from 'react';
import { Volume2, Search, Sparkles, BookOpen, LayoutGrid, Table, Info } from 'lucide-react';
import { MORSE_MAP, Q_CODES_LIST, PHONETIC_MAP } from '../utils/morse';
import { playMorseSequence, speakText } from '../utils/audio';
import { MorseTimingConfig, VoiceConfig } from '../types';

interface MorseCheatSheetProps {
  timingConfig: MorseTimingConfig;
  voiceConfig: VoiceConfig;
}

export const MorseCheatSheet: React.FC<MorseCheatSheetProps> = ({ timingConfig, voiceConfig }) => {
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'letters' | 'numbers' | 'punctuation' | 'qcodes'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'cards'>('table');

  const handlePlaySymbol = async (char: string, morse: string) => {
    // Play Morse audio tone
    playMorseSequence(morse, {
      wpm: timingConfig.wpm,
      pitch: timingConfig.pitch,
      volume: timingConfig.volume,
    });

    // Speak character name & phonetic
    const phonetic = PHONETIC_MAP[char] || char;
    speakText(`${char}, ${phonetic}, ${morse.replace(/\./g, 'dot ').replace(/-/g, 'dash ')}`, {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
    });
  };

  const handlePlayQCode = (code: string, meaning: string) => {
    speakText(`${code}, ${meaning}`, {
      voiceIndex: voiceConfig.voiceIndex,
      rate: voiceConfig.rate,
      pitch: voiceConfig.pitch,
      volume: voiceConfig.volume,
    });
  };

  // Filter items
  const entries = Object.entries(MORSE_MAP).filter(([char, code]) => {
    if (!code || code === '/') return false;
    const phonetic = PHONETIC_MAP[char] || '';
    if (
      search &&
      !char.toLowerCase().includes(search.toLowerCase()) &&
      !code.includes(search) &&
      !phonetic.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    const isLetter = /^[A-Z]$/.test(char);
    const isNumber = /^[0-9]$/.test(char);
    if (activeTab === 'letters' && !isLetter) return false;
    if (activeTab === 'numbers' && !isNumber) return false;
    if (activeTab === 'punctuation' && (isLetter || isNumber)) return false;
    if (activeTab === 'qcodes') return false; // Handled separately
    return true;
  });

  const filteredQCodes = Q_CODES_LIST.filter((q) => {
    if (
      search &&
      !q.code.toLowerCase().includes(search.toLowerCase()) &&
      !q.meaning.toLowerCase().includes(search.toLowerCase())
    ) {
      return false;
    }
    return true;
  });

  // Category counts
  const letterCount = Object.keys(MORSE_MAP).filter((c) => /^[A-Z]$/.test(c)).length;
  const numberCount = Object.keys(MORSE_MAP).filter((c) => /^[0-9]$/.test(c)).length;
  const punctuationCount = Object.keys(MORSE_MAP).filter(
    (c) => c !== '/' && c !== ' ' && !/^[A-Z0-9]$/.test(c)
  ).length;

  return (
    <div className="space-y-6">
      {/* Header & Search / Layout Controls */}
      <div className="p-6 bg-slate-950 rounded-md border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-md">
        <div>
          <h2 className="text-base font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-blue-400" /> Morse Code Reference Guide & Mapping Table
          </h2>
          <p className="text-xs text-slate-400 mt-1 uppercase tracking-wider font-mono">
            Complete International Morse Code table mapping Letters A–Z, Numbers 0–9 & Basic Punctuation
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* View Mode Switcher */}
          <div className="flex items-center bg-slate-900 p-1 rounded-sm border border-slate-800 self-start sm:self-auto">
            <button
              onClick={() => setViewMode('table')}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                viewMode === 'table'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Table className="w-3.5 h-3.5" /> Table View
            </button>
            <button
              onClick={() => setViewMode('cards')}
              className={`px-3 py-1.5 rounded-sm text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5 transition ${
                viewMode === 'cards'
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" /> Cards View
            </button>
          </div>

          {/* Search Bar */}
          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              id="cheat-sheet-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="SEARCH CHAR OR MORSE..."
              className="w-full bg-slate-900 text-slate-200 text-xs font-mono pl-9 pr-4 py-2.5 rounded-sm border border-slate-800 focus:border-blue-500 focus:outline-none uppercase tracking-wider"
            />
          </div>
        </div>
      </div>

      {/* Timing Formula Info Banner */}
      <div className="p-4 bg-slate-950 rounded-md border border-slate-800 text-xs font-mono text-slate-400 flex flex-wrap items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-blue-400 shrink-0" />
          <span>
            <strong className="text-white">Standard Timing Rules:</strong> 1 Dot = 1 unit | 1 Dash = 3 units | Gap between elements = 1 unit
          </span>
        </div>
        <div className="flex items-center gap-4 text-[11px] text-slate-500">
          <span>Letters (A–Z): <strong className="text-blue-400">{letterCount}</strong></span>
          <span>Numbers (0–9): <strong className="text-blue-400">{numberCount}</strong></span>
          <span>Punctuation: <strong className="text-blue-400">{punctuationCount}</strong></span>
        </div>
      </div>

      {/* Category Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs font-mono">
        {(['all', 'letters', 'numbers', 'punctuation', 'qcodes'] as const).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-sm uppercase font-bold tracking-widest transition border ${
              activeTab === tab
                ? 'bg-blue-600 text-white border-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'
                : 'bg-slate-950 hover:bg-slate-800 text-slate-400 border-slate-800'
            }`}
          >
            {tab === 'all'
              ? 'All Reference Mappings'
              : tab === 'letters'
              ? 'Alphabet (A-Z)'
              : tab === 'numbers'
              ? 'Numbers (0-9)'
              : tab === 'punctuation'
              ? 'Punctuation & Symbols'
              : 'Q-Codes & Shorthand'}
          </button>
        ))}
      </div>

      {/* Table Reference Guide View */}
      {viewMode === 'table' && activeTab !== 'qcodes' && (
        <div className="bg-slate-950 rounded-md border border-slate-800 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse font-mono text-xs">
              <thead>
                <tr className="bg-slate-900 border-b border-slate-800 text-slate-400 uppercase tracking-wider">
                  <th className="py-3 px-4 font-bold">Char</th>
                  <th className="py-3 px-4 font-bold">Phonetic / Name</th>
                  <th className="py-3 px-4 font-bold">Morse Code</th>
                  <th className="py-3 px-4 font-bold">Signal Pattern (Dots & Dashes)</th>
                  <th className="py-3 px-4 font-bold text-right">Listen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-200">
                {entries.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-slate-500 italic">
                      No matching Morse code reference entries found for "{search}".
                    </td>
                  </tr>
                ) : (
                  entries.map(([char, code]) => {
                    const phonetic = PHONETIC_MAP[char] || 'Symbol';
                    const isLetter = /^[A-Z]$/.test(char);
                    const isNumber = /^[0-9]$/.test(char);
                    const categoryLabel = isLetter
                      ? 'Alphabet'
                      : isNumber
                      ? 'Numeric'
                      : 'Punctuation';

                    return (
                      <tr
                        key={char}
                        className="hover:bg-slate-900/80 transition-colors group cursor-pointer"
                        onClick={() => handlePlaySymbol(char, code)}
                      >
                        {/* Character */}
                        <td className="py-3 px-4">
                          <span className="text-xl font-bold text-white bg-slate-900 px-3 py-1 rounded-sm border border-slate-800 inline-block min-w-[2.5rem] text-center">
                            {char}
                          </span>
                        </td>

                        {/* Phonetic / Name */}
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="font-bold text-slate-100 text-sm">{phonetic}</span>
                            <span className="text-[10px] text-slate-500 uppercase">{categoryLabel}</span>
                          </div>
                        </td>

                        {/* Morse Code Representation */}
                        <td className="py-3 px-4 font-bold text-blue-400 text-base tracking-widest">
                          {code}
                        </td>

                        {/* Visual Signal Pattern (Dots & Dashes Breakdown) */}
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1.5">
                            {code.split('').map((symbol, idx) => (
                              <span
                                key={idx}
                                className={`inline-flex items-center justify-center font-bold text-xs ${
                                  symbol === '.'
                                    ? 'w-3 h-3 rounded-full bg-blue-500 text-slate-950 shadow-[0_0_6px_rgba(59,130,246,0.8)]'
                                    : 'w-7 h-3 rounded-sm bg-blue-400 text-slate-950 shadow-[0_0_8px_rgba(96,165,250,0.8)]'
                                }`}
                                title={symbol === '.' ? 'Dot (1 unit)' : 'Dash (3 units)'}
                              />
                            ))}
                          </div>
                        </td>

                        {/* Audio Trigger Button */}
                        <td className="py-3 px-4 text-right">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handlePlaySymbol(char, code);
                            }}
                            className="px-3 py-1.5 rounded-sm bg-slate-900 hover:bg-blue-600 hover:text-white border border-slate-800 text-blue-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ml-auto transition"
                          >
                            <Volume2 className="w-3.5 h-3.5" /> Play
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Grid Cards View */}
      {viewMode === 'cards' && activeTab !== 'qcodes' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {entries.map(([char, code]) => {
            const phonetic = PHONETIC_MAP[char] || 'Symbol';
            return (
              <button
                key={char}
                onClick={() => handlePlaySymbol(char, code)}
                className="p-4 bg-slate-950 hover:bg-slate-900 border border-slate-800 hover:border-blue-500/80 rounded-sm flex flex-col items-center justify-center gap-2 transition group text-center shadow-sm"
              >
                <div className="text-2xl font-bold text-white font-mono group-hover:scale-110 transition-transform">
                  {char}
                </div>
                <div className="text-xs font-mono text-slate-400 uppercase tracking-wider truncate w-full">
                  {phonetic}
                </div>
                <div className="text-sm font-mono text-blue-400 font-bold tracking-widest bg-slate-900 px-2.5 py-1 rounded-sm w-full border border-slate-800">
                  {code}
                </div>
                <div className="text-[10px] text-slate-500 font-mono uppercase tracking-wider flex items-center gap-1 group-hover:text-blue-400 transition-colors">
                  <Volume2 className="w-3 h-3" /> PLAY TONE
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Q-Codes & HAM Shorthand Table */}
      {(activeTab === 'all' || activeTab === 'qcodes') && (
        <div className="p-6 bg-slate-950 rounded-md border border-slate-800 space-y-4 shadow-md">
          <h2 className="text-xs font-bold uppercase tracking-widest text-slate-500 font-mono flex items-center gap-2 pb-2 border-b border-slate-800">
            <Sparkles className="w-4 h-4 text-blue-400" /> Amateur Radio Q-Codes & Prosigs
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {filteredQCodes.map((q) => (
              <div
                key={q.code}
                onClick={() => handlePlayQCode(q.code, q.meaning)}
                className="p-4 bg-slate-900 hover:bg-slate-850 rounded-sm border border-slate-800 flex items-start justify-between gap-3 cursor-pointer group transition"
              >
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-base font-bold text-blue-400">{q.code}</span>
                    <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-sm bg-slate-800 text-slate-300 border border-slate-700">
                      {q.category}
                    </span>
                  </div>
                  <p className="text-xs text-slate-300 mt-1">{q.meaning}</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5 uppercase tracking-wider">Example: {q.example}</p>
                </div>
                <Volume2 className="w-4 h-4 text-slate-500 group-hover:text-blue-400 transition-colors shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
