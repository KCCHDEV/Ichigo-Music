import React from 'react';
import { Play, Plus, Clock, Disc, Sparkles } from 'lucide-react';
import { Track } from '../types/music';

interface SearchViewProps {
  searchResults: Track[];
  isLoading: boolean;
  onPlayTrack: (track: Track) => void;
  onAddToQueue: (track: Track) => void;
  query: string;
}

export const SearchView: React.FC<SearchViewProps> = ({
  searchResults,
  isLoading,
  onPlayTrack,
  onAddToQueue,
  query,
}) => {
  const formatDuration = (ms: number) => {
    if (!ms) return '3:30';
    const totalSecs = Math.floor(ms / 1000);
    const m = Math.floor(totalSecs / 60);
    const s = totalSecs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-400" />
            <span>ผลการค้นหา</span>
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            {query ? `ค้นหาสำหรับ "${query}"` : 'ค้นหาเพลง ศิลปิน หรืออัลบั้มที่คุณชื่นชอบ'}
          </p>
        </div>
        <span className="text-xs px-3 py-1.5 rounded-full bg-slate-900 border border-slate-800 text-slate-400 font-mono">
          {searchResults.length} Tracks
        </span>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-4">
          <div className="w-10 h-10 border-4 border-sky-500/30 border-t-sky-400 rounded-full animate-spin" />
          <p className="text-sm font-medium">กำลังค้นหาเพลงผ่าน Lavalink Server...</p>
        </div>
      ) : searchResults.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 space-y-3 animate-page-enter">
          <Disc className="w-16 h-16 stroke-1 text-slate-700" />
          <p className="text-base text-slate-400 font-medium">ไม่พบผลการค้นหา</p>
          <p className="text-xs text-slate-600">ลองค้นหาด้วยคำค้นอื่น หรือใช้แถบค้นหาสุ่มคำแนะนำด้านบน</p>
        </div>
      ) : (
        <div className="bg-slate-900/50 border border-slate-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md animate-page-enter">
          {/* Table Header */}
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-slate-400 border-b border-slate-800/80 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">ชื่อเพลง</div>
            <div className="col-span-3">ศิลปิน / ช่อง</div>
            <div className="col-span-1 text-center">ความยาว</div>
            <div className="col-span-1 text-right">การทำงาน</div>
          </div>

          {/* Table Items */}
          <div className="divide-y divide-slate-800/40">
            {searchResults.map((track, index) => (
              <div
                key={track.identifier || index}
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
                className="grid grid-cols-12 px-6 py-3.5 items-center text-sm hover:bg-slate-800/60 transition-all duration-200 group animate-item-enter"
              >
                {/* Index / Play Hover */}
                <div className="col-span-1 text-center flex justify-center items-center">
                  <span className="text-slate-500 font-mono group-hover:hidden">{index + 1}</span>
                  <button
                    onClick={() => onPlayTrack(track)}
                    className="hidden group-hover:flex w-8 h-8 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 items-center justify-center shadow-md shadow-sky-500/30 transform active:scale-90 transition-all duration-200"
                  >
                    <Play className="w-4 h-4 fill-current ml-0.5" />
                  </button>
                </div>

                {/* Track Details */}
                <div className="col-span-6 flex items-center gap-3.5 pr-4">
                  <img
                    src={track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                    alt={track.title}
                    className="w-11 h-11 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-800/80 shadow group-hover:scale-105 transition-transform duration-200"
                  />
                  <div className="overflow-hidden">
                    <h4
                      onClick={() => onPlayTrack(track)}
                      className="font-medium text-slate-100 truncate group-hover:text-sky-400 cursor-pointer transition-colors duration-200"
                    >
                      {track.title}
                    </h4>
                    <span className="inline-block text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {track.sourceName || 'youtube'}
                    </span>
                  </div>
                </div>

                {/* Author */}
                <div className="col-span-3 text-slate-400 truncate pr-4 text-xs font-medium">
                  {track.author}
                </div>

                {/* Duration */}
                <div className="col-span-1 text-center text-xs font-mono text-slate-500 flex items-center justify-center gap-1">
                  <Clock className="w-3 h-3 text-slate-600" />
                  <span>{formatDuration(track.length)}</span>
                </div>

                {/* Actions */}
                <div className="col-span-1 text-right flex items-center justify-end">
                  <button
                    onClick={() => onAddToQueue(track)}
                    className="p-2 rounded-xl text-slate-400 hover:text-sky-400 hover:bg-sky-500/10 transition-all duration-200 active:scale-95"
                    title="เพิ่มในคิว (Add to Queue)"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
