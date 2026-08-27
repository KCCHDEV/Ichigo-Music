import React, { useEffect, useState, useRef } from 'react';
import { X, Mic2, Loader2, Disc3, Sparkles } from 'lucide-react';
import { Track } from '../types/music';
import { fetchLyrics, LyricsData } from '../services/lyrics';

interface LyricsModalProps {
  currentTrack: Track | null;
  currentTime: number;
  onSeek: (time: number) => void;
  onClose: () => void;
}

export const LyricsModal: React.FC<LyricsModalProps> = ({
  currentTrack,
  currentTime,
  onSeek,
  onClose,
}) => {
  const [lyricsData, setLyricsData] = useState<LyricsData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const activeLineRef = useRef<HTMLParagraphElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Fetch lyrics whenever currentTrack changes
  useEffect(() => {
    if (!currentTrack) return;
    let isMounted = true;
    setIsLoading(true);
    setLyricsData(null);

    fetchLyrics(currentTrack).then((data) => {
      if (isMounted) {
        setLyricsData(data);
        setIsLoading(false);
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

  // Smooth scroll active line to center
  useEffect(() => {
    if (activeLineRef.current && containerRef.current && lyricsData?.synced) {
      activeLineRef.current.scrollIntoView({
        behavior: 'smooth',
        block: 'center',
      });
    }
  }, [activeIndex, lyricsData?.synced]);

  if (!currentTrack) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-3xl flex flex-col justify-between animate-page-enter select-none overflow-hidden">
      {/* Background Album Art Backdrop Blur */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <img
          src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=600&h=600&fit=crop'}
          alt=""
          className="w-full h-full object-cover blur-3xl scale-125"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/90 to-slate-950" />
      </div>

      {/* Header */}
      <div className="relative z-10 px-8 py-6 flex items-center justify-between border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
            <Mic2 className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-base text-white flex items-center gap-2">
              <span>เนื้อเพลง (Lyrics & Karaoke)</span>
              {lyricsData?.synced && (
                <span className="px-2 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-[10px] uppercase font-bold tracking-wider">
                  Synced LRC
                </span>
              )}
            </h3>
            <p className="text-xs text-slate-400 truncate max-w-md">
              {currentTrack.title} — {currentTrack.author}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-slate-900/80 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white flex items-center justify-center transition active:scale-95"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lyrics Content Container */}
      <div
        ref={containerRef}
        className="relative z-10 flex-1 overflow-y-auto px-6 py-16 space-y-6 text-center scroll-smooth"
      >
        {isLoading ? (
          <div className="h-full flex flex-col items-center justify-center space-y-4 text-sky-400 py-24">
            <Loader2 className="w-10 h-10 animate-spin" />
            <p className="text-sm font-medium text-slate-300">กำลังค้นหาเนื้อเพลงสำหรับคุณ...</p>
          </div>
        ) : !lyricsData || lines.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center space-y-3 text-slate-500 py-24">
            <Disc3 className="w-16 h-16 stroke-1 text-slate-700 animate-spin-slow" />
            <p className="text-base font-semibold text-slate-300">ไม่พบเนื้อเพลงของเพลงนี้</p>
            <p className="text-xs text-slate-500 max-w-sm">
              ขออภัย ยังไม่มีข้อมูลเนื้อเพลงในระบบสำหรับ "{currentTrack.title}"
            </p>
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-7">
            {lines.map((line, idx) => {
              const isActive = lyricsData.synced && idx === activeIndex;
              const isPast = lyricsData.synced && idx < activeIndex;

              return (
                <p
                  key={idx}
                  ref={isActive ? activeLineRef : null}
                  onClick={() => lyricsData.synced && onSeek(line.time)}
                  className={`text-xl sm:text-2xl md:text-3xl font-bold transition-all duration-300 cursor-pointer px-4 py-1.5 rounded-2xl ${
                    isActive
                      ? 'text-white scale-105 drop-shadow-[0_0_16px_rgba(56,189,248,0.9)] bg-sky-500/10 border border-sky-500/30'
                      : isPast
                      ? 'text-slate-400/80 hover:text-slate-200 opacity-90'
                      : 'text-slate-400/80 hover:text-slate-200'
                  }`}
                >
                  {line.text}
                </p>
              );
            })}
          </div>
        )}
      </div>

      {/* Footer Info */}
      {lyricsData?.source && (
        <div className="relative z-10 px-8 py-3 text-center border-t border-slate-800/40 text-[11px] text-slate-400 font-mono flex items-center justify-center gap-1.5">
          <Sparkles className="w-3 h-3 text-sky-400" />
          <span>Provided by {lyricsData.source}</span>
        </div>
      )}
    </div>
  );
};
