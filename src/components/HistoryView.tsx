import React, { useState } from 'react';
import { HistoryItem, Track } from '../types/music';
import { History, Trash2, Play, Search, Clock, Disc } from 'lucide-react';

interface HistoryViewProps {
  historyItems: HistoryItem[];
  onPlayTrack: (track: Track) => void;
  onClearHistory: () => void;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  historyItems,
  onPlayTrack,
  onClearHistory,
}) => {
  const [filterQuery, setFilterQuery] = useState('');

  const filtered = historyItems.filter((item) => {
    const q = filterQuery.toLowerCase();
    return (
      item.track.title.toLowerCase().includes(q) ||
      item.track.author.toLowerCase().includes(q)
    );
  });

  const formatTimestamp = (ts: number) => {
    const diffSecs = Math.floor((Date.now() - ts) / 1000);
    if (diffSecs < 60) return 'เมื่อสักครู่';
    if (diffSecs < 3600) return `${Math.floor(diffSecs / 60)} นาทีที่แล้ว`;
    if (diffSecs < 86400) return `${Math.floor(diffSecs / 3600)} ชั่วโมงที่แล้ว`;
    return new Date(ts).toLocaleDateString('th-TH', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <History className="w-6 h-6 text-rose-500" />
            <span>ประวัติการฟังเพลง (History)</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            บันทึกประวัติการฟังเพลงของคุณโดยอัตโนมัติ ({historyItems.length} รายการ)
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Search inside history */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-zinc-400" />
            <input
              type="text"
              value={filterQuery}
              onChange={(e) => setFilterQuery(e.target.value)}
              placeholder="ค้นหาในประวัติ..."
              className="pl-9 pr-4 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 text-sm text-zinc-200 outline-none focus:border-rose-500/50"
            />
          </div>

          {historyItems.length > 0 && (
            <button
              onClick={onClearHistory}
              className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-sm font-medium flex items-center gap-2 transition"
            >
              <Trash2 className="w-4 h-4" />
              <span>ล้างประวัติ</span>
            </button>
          )}
        </div>
      </div>

      {/* History List */}
      {filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-zinc-500 space-y-3">
          <Disc className="w-16 h-16 stroke-1 text-zinc-700" />
          <p className="text-base text-zinc-400 font-medium">ยังไม่มีประวัติการฟังเพลง</p>
          <p className="text-xs text-zinc-600">เมื่อคุณเล่นเพลง ประวัติการฟังจะปรากฏในหน้านี้</p>
        </div>
      ) : (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden shadow-xl backdrop-blur-md">
          <div className="grid grid-cols-12 px-6 py-3 text-xs font-semibold text-zinc-400 border-b border-zinc-800/80 uppercase tracking-wider">
            <div className="col-span-1 text-center">#</div>
            <div className="col-span-6">ชื่อเพลง</div>
            <div className="col-span-3">ศิลปิน</div>
            <div className="col-span-1 text-center">ฟังแล้ว</div>
            <div className="col-span-1 text-right">เวลาที่เล่น</div>
          </div>

          <div className="divide-y divide-zinc-800/40">
            {filtered.map((item, index) => (
              <div
                key={item.id}
                className="grid grid-cols-12 px-6 py-3.5 items-center text-sm hover:bg-zinc-800/40 transition group"
              >
                <div className="col-span-1 text-center flex justify-center items-center">
                  <span className="text-zinc-500 font-mono group-hover:hidden">{index + 1}</span>
                  <button
                    onClick={() => onPlayTrack(item.track)}
                    className="hidden group-hover:flex w-7 h-7 rounded-full bg-rose-600 text-white items-center justify-center shadow-md shadow-rose-600/30 transform active:scale-95"
                  >
                    <Play className="w-3.5 h-3.5 fill-current ml-0.5" />
                  </button>
                </div>

                <div className="col-span-6 flex items-center gap-3.5 pr-4">
                  <img
                    src={item.track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                    alt={item.track.title}
                    className="w-11 h-11 rounded-lg object-cover bg-zinc-800 shrink-0 border border-zinc-800/80 shadow"
                  />
                  <div className="overflow-hidden">
                    <h4
                      onClick={() => onPlayTrack(item.track)}
                      className="font-medium text-zinc-100 truncate hover:text-rose-400 cursor-pointer transition"
                    >
                      {item.track.title}
                    </h4>
                    <span className="text-[10px] text-zinc-500 font-semibold uppercase">
                      {item.track.sourceName || 'youtube'}
                    </span>
                  </div>
                </div>

                <div className="col-span-3 text-zinc-400 truncate pr-4 text-xs font-medium">
                  {item.track.author}
                </div>

                <div className="col-span-1 text-center">
                  <span className="inline-block px-2.5 py-0.5 rounded-full bg-zinc-800 text-zinc-300 font-mono text-xs border border-zinc-700/50">
                    {item.playCount || 1} ครั้ง
                  </span>
                </div>

                <div className="col-span-1 text-right text-zinc-500 font-mono text-xs flex items-center justify-end gap-1">
                  <Clock className="w-3 h-3 text-zinc-600" />
                  <span>{formatTimestamp(item.playedAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
