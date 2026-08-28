import React, { useState, useEffect, useRef } from 'react';
import { Search, X, Clock, TrendingUp, Sparkles, ChevronLeft, ChevronRight, FolderOpen } from 'lucide-react';
import { getSearchSuggestions } from '../services/searchSuggestions';
import { getSearchHistory, addToSearchHistory } from '../services/history';

interface HeaderProps {
  onSearchSubmit: (query: string) => void;
  isConnected?: boolean;
  onOpenLocalFiles?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onSearchSubmit, onOpenLocalFiles }) => {
  const [query, setQuery] = useState('');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState<number>(-1);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount & focus
  const loadHistory = () => {
    setSearchHistory(getSearchHistory());
  };

  useEffect(() => {
    loadHistory();
  }, []);

  // Fetch suggestions on query change (debounced)
  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      return;
    }

    const timer = setTimeout(async () => {
      const results = await getSearchSuggestions(query);
      setSuggestions(results);
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  // Handle click outside to close autocomplete dropdown
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (searchTerm: string) => {
    setQuery(searchTerm);
    setIsOpen(false);
    setSelectedIndex(-1);
    addToSearchHistory(searchTerm);
    onSearchSubmit(searchTerm);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    const items = query.trim() ? suggestions : searchHistory;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev < items.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev > 0 ? prev - 1 : items.length - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedIndex >= 0 && items[selectedIndex]) {
        handleSelect(items[selectedIndex]);
      } else if (query.trim()) {
        handleSelect(query.trim());
      }
    } else if (e.key === 'Escape') {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  return (
    <header className="h-16 border-b border-slate-800/80 px-6 flex items-center justify-between bg-slate-950/70 backdrop-blur-md sticky top-0 z-30">
      {/* Navigation history controls */}
      <div className="flex items-center gap-2">
        <button
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Back"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          className="w-8 h-8 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-800 transition"
          title="Forward"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
        {onOpenLocalFiles && (
          <button
            onClick={onOpenLocalFiles}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-500/10 border border-sky-500/30 text-sky-300 hover:bg-sky-500/20 text-xs font-semibold transition active:scale-95 ml-2"
            title="เปิดไฟล์ MP3 จากในเครื่อง"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>เปิดไฟล์ MP3</span>
          </button>
        )}
      </div>

      {/* Auto-search bar with YouTube/Apple Music style suggestions */}
      <div ref={containerRef} className="relative w-full max-w-xl mx-4">
        <div className="relative flex items-center">
          <Search className="w-4 h-4 absolute left-3.5 text-slate-400 pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIsOpen(true);
              setSelectedIndex(-1);
            }}
            onFocus={() => {
              loadHistory();
              setIsOpen(true);
            }}
            onKeyDown={handleKeyDown}
            placeholder="ค้นหาชื่อเพลง, ศิลปิน, หรือวาง URL YouTube..."
            className="w-full pl-10 pr-10 py-2 rounded-full bg-slate-900/90 border border-slate-800 focus:border-sky-500/60 focus:bg-slate-900 focus:ring-2 focus:ring-sky-500/20 text-sm text-slate-100 placeholder-slate-500 outline-none transition-all"
          />
          {query && (
            <button
              onClick={() => {
                setQuery('');
                setSuggestions([]);
                inputRef.current?.focus();
              }}
              className="absolute right-3 text-slate-400 hover:text-slate-200 p-0.5"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Dropdown Suggestions */}
        {isOpen && (
          <div className="absolute left-0 right-0 top-full mt-2 bg-slate-900/95 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 backdrop-blur-xl">
            {/* Realtime Autocomplete Suggestions */}
            {query.trim() && suggestions.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-slate-400 flex items-center gap-1.5">
                  <Sparkles className="w-3 h-3 text-sky-400" />
                  คำค้นหาที่เกี่ยวข้อง (Auto Suggestions)
                </div>
                {suggestions.map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-3 transition ${
                      selectedIndex === idx
                        ? 'bg-sky-500/20 text-sky-300 font-medium'
                        : 'text-slate-200 hover:bg-slate-800/60'
                    }`}
                  >
                    <TrendingUp className="w-4 h-4 text-slate-500 shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Recent Search History if query is empty */}
            {!query.trim() && searchHistory.length > 0 && (
              <div className="p-2">
                <div className="px-3 py-1.5 text-[11px] font-semibold uppercase text-zinc-400 flex items-center gap-1.5">
                  <Clock className="w-3 h-3 text-zinc-400" />
                  ประวัติการค้นหาล่าสุด
                </div>
                {searchHistory.slice(0, 6).map((item, idx) => (
                  <button
                    key={idx}
                    onClick={() => handleSelect(item)}
                    className={`w-full text-left px-3 py-2 text-sm rounded-xl flex items-center gap-3 transition ${
                      selectedIndex === idx
                        ? 'bg-rose-600/20 text-rose-300 font-medium'
                        : 'text-zinc-300 hover:bg-zinc-800/60'
                    }`}
                  >
                    <Clock className="w-4 h-4 text-zinc-500 shrink-0" />
                    <span className="truncate">{item}</span>
                  </button>
                ))}
              </div>
            )}

            {query.trim() && suggestions.length === 0 && (
              <div
                onClick={() => handleSelect(query.trim())}
                className="p-3 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 cursor-pointer flex items-center gap-2"
              >
                <Search className="w-4 h-4 text-sky-400" />
                <span>ค้นหา "<strong>{query}</strong>" บน Lavalink</span>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
};
