import React from 'react';
import { Track } from '../types/music';
import { Play, Sparkles, Flame, Clock, Radio, FolderOpen } from 'lucide-react';

interface HomeViewProps {
  onPlayTrack: (track: Track) => void;
  onSearchQuery: (query: string) => void;
  recentlyPlayed: Track[];
  onOpenLocalFiles?: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onPlayTrack,
  onSearchQuery,
  recentlyPlayed,
  onOpenLocalFiles,
}) => {
  const quickGenres = [
    { title: 'เพลงไทยฮิตติดชาร์ต', query: 'เพลงไทยฮิตติดชาร์ต 2026', color: 'from-blue-600 to-sky-900' },
    { title: 'K-Pop Top Hits', query: 'kpop top hits', color: 'from-indigo-600 to-blue-900' },
    { title: 'Lofi Chill Beats', query: 'lofi hip hop beats to relax', color: 'from-cyan-600 to-slate-900' },
    { title: 'International Top 50', query: 'top hits 2026', color: 'from-sky-600 to-indigo-900' },
  ];

  return (
    <div className="p-6 space-y-8 pb-32">
      {/* Hero Banner */}
      <div className="relative min-h-[300px] rounded-3xl overflow-hidden bg-slate-950 p-8 border border-sky-900/50 shadow-2xl flex items-center">
        <img
          src="/ichigo-music-hero.png"
          alt=""
          aria-hidden="true"
          className="absolute inset-0 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/90 to-slate-950/5" />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/65 via-transparent to-sky-950/15" />
        <div className="relative z-10 max-w-xl space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-sky-500/20 border border-sky-500/30 text-sky-300 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-white" />
            <span>Ichigo Music • Code 015 Lavalink Engine</span>
          </div>
          <h2 className="text-3xl font-extrabold text-white tracking-tight">
            ฟังเพลงโปรดคุณภาพสูง พร้อม Auto Mix สไตล์ Apple Music
          </h2>
          <p className="text-slate-300 text-sm leading-relaxed">
            ค้นหาเพลงด้วยระบบ ค้นหาอัตโนมัติ (Auto-Search) พร้อมระบบเตรียมคิวเพลงต่อเนื่องอัตโนมัติ
          </p>
          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              onClick={() => onSearchQuery('เพลงใหม่มาแรง')}
              className="px-5 py-2.5 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-sm flex items-center gap-2 shadow-lg shadow-sky-500/30 transition transform active:scale-95 duration-200"
            >
              <Flame className="w-4 h-4 fill-current" />
              <span>สำรวจเพลงมาแรง</span>
            </button>

            {onOpenLocalFiles && (
              <button
                onClick={onOpenLocalFiles}
                className="px-5 py-2.5 rounded-xl bg-slate-900/90 border border-sky-500/40 hover:bg-sky-500/20 text-sky-300 font-bold text-sm flex items-center gap-2 shadow-lg transition transform active:scale-95 duration-200"
              >
                <FolderOpen className="w-4 h-4 text-sky-400" />
                <span>เปิดเล่นไฟล์ MP3 ในเครื่อง</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Quick Play Categories */}
      <div className="space-y-4">
        <h3 className="text-lg font-bold text-white flex items-center gap-2">
          <Radio className="w-5 h-5 text-sky-400" />
          <span>หมวดหมู่เพลงแนะนำ</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickGenres.map((genre, idx) => (
            <div
              key={idx}
              onClick={() => onSearchQuery(genre.query)}
              style={{ animationDelay: `${idx * 60}ms` }}
              className={`h-28 rounded-2xl p-4 bg-gradient-to-br ${genre.color} border border-white/10 flex flex-col justify-between cursor-pointer hover:scale-[1.03] transition-all duration-300 shadow-lg hover:shadow-sky-500/20 group relative overflow-hidden animate-item-enter`}
            >
              <span className="font-bold text-white text-base z-10">{genre.title}</span>
              <div className="flex justify-between items-end z-10">
                <span className="text-xs text-white/70">คลิกเพื่อค้นหา</span>
                <div className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-all duration-200 transform group-hover:scale-110">
                  <Play className="w-4 h-4 fill-current ml-0.5" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <Clock className="w-5 h-5 text-sky-400" />
            <span>ฟังล่าสุด (Recently Played)</span>
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {recentlyPlayed.slice(0, 6).map((track, idx) => (
              <div
                key={idx}
                onClick={() => onPlayTrack(track)}
                style={{ animationDelay: `${idx * 50}ms` }}
                className="glass-card-ichigo p-3 rounded-2xl cursor-pointer group animate-item-enter"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden mb-3 border border-slate-800">
                  <img
                    src={track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                    alt={track.title}
                    className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-slate-950/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-all duration-200 backdrop-blur-[2px]">
                    <div className="w-10 h-10 rounded-full bg-sky-500 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/40 transform group-hover:scale-110 active:scale-95 transition-all duration-200">
                      <Play className="w-5 h-5 fill-current ml-0.5" />
                    </div>
                  </div>
                </div>
                <h4 className="font-semibold text-sm text-slate-100 truncate group-hover:text-sky-400 transition-colors duration-200">{track.title}</h4>
                <p className="text-xs text-slate-400 truncate mt-0.5">{track.author}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
