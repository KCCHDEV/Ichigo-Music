import React from 'react';
import { X, Trash2, ListMusic, Wand2, Loader2 } from 'lucide-react';
import { Track } from '../types/music';

interface QueueDrawerProps {
  queue: Track[];
  currentTrack: Track | null;
  isAutoMix?: boolean;
  isAutoMixLoading?: boolean;
  onPlayTrack: (track: Track) => void;
  onRemoveFromQueue: (index: number) => void;
  onClearQueue: () => void;
  onClose: () => void;
}

export const QueueDrawer: React.FC<QueueDrawerProps> = ({
  queue,
  currentTrack,
  isAutoMix = false,
  isAutoMixLoading = false,
  onPlayTrack,
  onRemoveFromQueue,
  onClearQueue,
  onClose,
}) => {
  return (
    <div className="fixed inset-y-0 right-0 z-50 w-80 bg-slate-900/95 border-l border-slate-800 backdrop-blur-xl shadow-2xl p-4 flex flex-col justify-between animate-drawer-enter">
      <div className="space-y-4 flex-1 overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2 text-white font-bold text-base">
            <ListMusic className="w-5 h-5 text-sky-400" />
            <span>คิวเพลงถัดไป (Queue)</span>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-200 p-1.5 rounded-full hover:bg-slate-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Currently playing track */}
        {currentTrack && (
          <div className="p-3 rounded-2xl bg-sky-950/40 border border-sky-500/30">
            <span className="text-[10px] uppercase font-bold text-sky-400 tracking-wider">กำลังเล่นอยู่</span>
            <div className="flex items-center gap-3 mt-1.5">
              <img
                src={currentTrack.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                alt={currentTrack.title}
                className="w-10 h-10 rounded-lg object-cover"
              />
              <div className="overflow-hidden">
                <h5 className="font-semibold text-xs text-white truncate">{currentTrack.title}</h5>
                <p className="text-[11px] text-slate-400 truncate">{currentTrack.author}</p>
              </div>
            </div>
          </div>
        )}

        {/* Auto Mix Status Banner */}
        {isAutoMix && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-blue-950/50 border border-sky-500/30 text-xs text-sky-300">
            <div className="flex items-center gap-2">
              <Wand2 className="w-3.5 h-3.5 text-sky-400 animate-pulse" />
              <span className="font-medium text-[11px]">เล่นต่ออัตโนมัติ (Autoplay Mix)</span>
            </div>
            {isAutoMixLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-sky-400" />}
          </div>
        )}

        {/* Queue list */}
        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {queue.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-xs space-y-2">
              {isAutoMixLoading ? (
                <div className="flex flex-col items-center gap-2 text-sky-400">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <span>กำลังค้นหาเพลงถัดไปสำหรับคุณ...</span>
                </div>
              ) : (
                <span>ยังไม่มีเพลงในคิวถัดไป</span>
              )}
            </div>
          ) : (
            <>
              {queue.map((track, idx) => (
                <div
                  key={`${track.identifier}-${idx}`}
                  className="flex items-center justify-between p-2 rounded-xl bg-slate-950/60 hover:bg-slate-800/60 border border-slate-800/40 text-xs group transition"
                >
                  <div
                    onClick={() => onPlayTrack(track)}
                    className="flex items-center gap-3 overflow-hidden cursor-pointer flex-1"
                  >
                    <span className="text-slate-500 font-mono w-4 text-center shrink-0">{idx + 1}</span>
                    <img
                      src={track.artworkUrl || 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=300&h=300&fit=crop'}
                      alt={track.title}
                      className="w-8 h-8 rounded-md object-cover"
                    />
                    <div className="overflow-hidden">
                      <p className="font-medium text-slate-200 truncate group-hover:text-sky-400">{track.title}</p>
                      <p className="text-[10px] text-slate-500 truncate">{track.author}</p>
                    </div>
                  </div>

                  <button
                    onClick={() => onRemoveFromQueue(idx)}
                    className="text-slate-500 hover:text-rose-400 p-1.5"
                    title="Remove from queue"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}

              {isAutoMixLoading && (
                <div className="flex items-center justify-center gap-2 p-2 rounded-xl bg-blue-950/30 text-sky-400 text-xs">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>กำลังเตรียมเพลงเพิ่มเติม...</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {queue.length > 0 && (
        <div className="pt-3 border-t border-slate-800">
          <button
            onClick={onClearQueue}
            className="w-full py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
          >
            ล้างคิวทั้งหมด
          </button>
        </div>
      )}
    </div>
  );
};
