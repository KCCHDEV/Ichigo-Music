import React, { useEffect, useState, useRef } from 'react';
import {
  ChevronDown,
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Mic2,
  Loader2,
  Wand2,
  Disc3,
  Sparkles,
} from 'lucide-react';
import { Track } from '../types/music';
import { fetchLyrics, LyricsData } from '../services/lyrics';

interface AppleMusicPlayerModalProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  isAutoMix: boolean;
  isAutoMixLoading?: boolean;
  onPlayPauseToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onSeek: (time: number) => void;
  onToggleAutoMix: () => void;
  onClose: () => void;
}

export const AppleMusicPlayerModal: React.FC<AppleMusicPlayerModalProps> = ({
  currentTrack,
  isPlaying,
  currentTime,
  duration,
  isAutoMix,
  isAutoMixLoading = false,
  onPlayPauseToggle,
  onNext,
  onPrevious,
  onSeek,
  onToggleAutoMix,
  onClose,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState<boolean>(true);

  const activeLineRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics whenever currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;
    setIsLoadingLyrics(true);
    setLyricsData(null);

    fetchLyrics(currentTrack).then((data) => {
      if (isMounted) {
        setLyricsData(data);
        setIsLoadingLyrics(false);
      }
    });

    return () => {
      isMounted = false;
    };
  }, [currentTrack]);

  // Find active line index based on current playback time
  const lines = lyricsData?.lines || [];
  let activeIndex = -1;
  for (let i = 0; i < lines.length; i++) {
    if (currentTime >= lines[i].time) {
      activeIndex = i;
    } else {
      break;
    }
  }

  // Auto scroll active lyric line into center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && lyricsData?.synced) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, lyricsData?.synced]);

  if (!currentTrack) return null;

  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const trackDuration = duration || (currentTrack.length ? currentTrack.length / 1000 : 180);

  return (
    <div className="fixed inset-0 z-50 bg-black text-white flex flex-col h-screen w-screen overflow-hidden select-none animate-page-enter">
      {/* Background Subtle Glow Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <img
          src={currentTrack.artworkUrl || '/app-logo.png'}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-150"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black/80 via-black to-black" />
      </div>

      {/* Top Header Bar */}
      <div className="relative z-20 h-16 px-6 lg:px-10 flex items-center justify-between border-b border-zinc-800/80 bg-black/80 backdrop-blur-md shrink-0">
        <button
          onClick={onClose}
          className="p-2 rounded-full bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition active:scale-95 flex items-center gap-2 px-4 shadow-sm"
        >
          <ChevronDown className="w-5 h-5 text-white" />
          <span className="text-xs font-bold text-white">ย่อหน้าจอ</span>
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3.5 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-sm">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Ichigo Music Player</span>
          </span>
        </div>

        {/* Auto Mix Button */}
        <button
          onClick={onToggleAutoMix}
          className={`px-3 py-1.5 rounded-full text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 shadow-sm ${
            isAutoMix
              ? 'bg-gradient-to-r from-sky-500 to-blue-600 text-white shadow-md shadow-sky-500/30 ring-2 ring-sky-400/40'
              : 'bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-zinc-200'
          }`}
        >
          {isAutoMixLoading ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
          ) : (
            <Wand2 className={`w-3.5 h-3.5 ${isAutoMix ? 'animate-pulse text-white' : ''}`} />
          )}
          <span>Auto Mix</span>
        </button>
      </div>

      {/* Content Area: Left Card (White Card) & Right Lyrics (Pure Black Backdrop) */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center p-6 lg:p-10 gap-8 lg:gap-12 overflow-hidden max-h-[calc(100vh-64px)]">
        
        {/* Left Column: Player Card (White Card Theme from fullscreen player.md) */}
        <div className="w-full lg:w-[400px] shrink-0 flex justify-center items-center">
          <div className="bg-white text-slate-900 p-6 sm:p-7 rounded-3xl border border-slate-200 shadow-2xl shadow-sky-500/10 w-full max-w-sm space-y-5 text-center relative group">
            {/* Album Cover */}
            <div className="relative">
              <img
                src={currentTrack.artworkUrl || '/app-logo.png'}
                alt={currentTrack.title}
                className="w-52 h-52 sm:w-60 sm:h-60 mx-auto rounded-2xl object-cover shadow-lg shadow-sky-100 border border-slate-100 group-hover:scale-[1.02] transition-transform duration-300"
              />
              {isPlaying && (
                <span className="absolute top-2 right-2 w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-white shadow-md animate-ping" />
              )}
            </div>

            {/* Song Title & Artist */}
            <div className="space-y-1">
              <h2 className="text-xl font-bold text-slate-900 truncate tracking-tight">
                {currentTrack.title}
              </h2>
              <p className="text-slate-500 text-xs sm:text-sm truncate font-medium">
                {currentTrack.author}
              </p>
            </div>

            {/* Music Controls */}
            <div className="flex justify-center items-center gap-4 pt-1">
              <button
                onClick={onPrevious}
                className="p-3 rounded-full bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-600 transition active:scale-90 shadow-sm"
                title="Previous"
              >
                <SkipBack className="w-5 h-5" />
              </button>

              <button
                onClick={onPlayPauseToggle}
                className="p-4 rounded-full bg-sky-500 hover:bg-sky-600 text-white shadow-xl shadow-sky-500/40 transition transform active:scale-90"
                title={isPlaying ? "Pause" : "Play"}
              >
                {isPlaying ? (
                  <Pause className="w-6 h-6 fill-current" />
                ) : (
                  <Play className="w-6 h-6 fill-current ml-0.5" />
                )}
              </button>

              <button
                onClick={onNext}
                className="p-3 rounded-full bg-slate-100 hover:bg-sky-50 border border-slate-200 hover:border-sky-300 text-slate-700 hover:text-sky-600 transition active:scale-90 shadow-sm"
                title="Next"
              >
                <SkipForward className="w-5 h-5" />
              </button>
            </div>

            {/* Progress Bar & Time */}
            <div className="space-y-1.5 pt-1">
              <input
                type="range"
                min={0}
                max={trackDuration || 100}
                value={currentTime}
                onChange={(e) => onSeek(parseFloat(e.target.value))}
                className="w-full h-2 bg-slate-200 rounded-full appearance-none cursor-pointer accent-sky-500 hover:h-2.5 transition-all"
              />
              <div className="flex justify-between text-xs font-mono text-slate-500 px-1 font-semibold">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(trackDuration)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Synced Karaoke Lyrics (Pure Black Background) */}
        <div className="flex-1 h-full w-full max-w-2xl flex flex-col overflow-hidden py-2">
          <div className="flex items-center gap-2 mb-3 px-2 text-xs font-bold text-sky-400 uppercase tracking-wider shrink-0">
            <Mic2 className="w-4 h-4 animate-pulse" />
            <span>เนื้อเพลงเรียลไทม์ (Real-time Synced Karaoke)</span>
          </div>

          <div
            ref={containerRef}
            className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-6 space-y-6 scroll-smooth pr-4 max-w-full"
          >
            {isLoadingLyrics ? (
              <div className="h-full flex flex-col items-center justify-center space-y-4 text-sky-400 py-20">
                <Loader2 className="w-10 h-10 animate-spin" />
                <p className="text-sm font-semibold text-zinc-300">กำลังค้นหาและซิงค์เนื้อเพลง...</p>
              </div>
            ) : !lyricsData || lines.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center space-y-3 text-zinc-500 py-20 text-center">
                <Disc3 className="w-16 h-16 stroke-1 text-zinc-700 animate-spin-slow" />
                <p className="text-base font-bold text-zinc-200">ไม่พบเนื้อเพลงของเพลงนี้</p>
                <p className="text-xs text-zinc-500 max-w-sm">
                  ขออภัย ยังไม่มีข้อมูลเนื้อเพลงซิงค์เรียลไทม์สำหรับ "{currentTrack.title}"
                </p>
              </div>
            ) : (
              <div className="space-y-6 py-4 w-full max-w-full overflow-x-hidden">
                {lines.map((line, idx) => {
                  const isActive = lyricsData.synced && idx === activeIndex;
                  const isPast = lyricsData.synced && idx < activeIndex;

                  return (
                    <p
                      key={idx}
                      ref={isActive ? activeLineRef : null}
                      onClick={() => lyricsData.synced && onSeek(line.time)}
                      className={`text-xl sm:text-2xl md:text-3xl font-extrabold transition-all duration-300 cursor-pointer text-left leading-relaxed py-1.5 px-2 break-words max-w-full rounded-xl ${
                        isActive
                          ? 'text-sky-400 drop-shadow-[0_0_24px_rgba(56,189,248,0.9)] font-black'
                          : isPast
                          ? 'text-zinc-600/70 hover:text-zinc-300 opacity-60'
                          : 'text-zinc-400/80 hover:text-zinc-200'
                      }`}
                    >
                      {line.text}
                    </p>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
