import React, { useState, useEffect } from 'react';
import { Terminal, Trash2, Copy, Check, Filter, Search, ShieldAlert, Info, CheckCircle2, AlertTriangle } from 'lucide-react';
import { logger, LogEntry } from '../services/logger';

export const ConsoleLogView: React.FC = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [filterSource, setFilterSource] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [copied, setCopied] = useState<boolean>(false);

  useEffect(() => {
    const unsubscribe = logger.subscribe((updatedLogs) => {
      setLogs(updatedLogs);
    });
    return () => unsubscribe();
  }, []);

  const handleCopyLogs = () => {
    const text = logs
      .map(
        (l) =>
          `[${l.timestamp}] [${l.source}] [${l.level.toUpperCase()}]: ${l.message}${
            l.details ? ` | ${JSON.stringify(l.details)}` : ''
          }`
      )
      .join('\n');

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const filteredLogs = logs.filter((log) => {
    if (filterLevel !== 'all' && log.level !== filterLevel) return false;
    if (filterSource !== 'all' && log.source !== filterSource) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchMsg = log.message.toLowerCase().includes(q);
      const matchSource = log.source.toLowerCase().includes(q);
      const matchDetails = log.details ? JSON.stringify(log.details).toLowerCase().includes(q) : false;
      return matchMsg || matchSource || matchDetails;
    }
    return true;
  });

  const getLevelBadge = (level: LogEntry['level']) => {
    switch (level) {
      case 'success':
        return (
          <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 text-[10px] font-bold border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" />
            SUCCESS
          </span>
        );
      case 'error':
        return (
          <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 text-[10px] font-bold border border-rose-500/30 flex items-center gap-1">
            <ShieldAlert className="w-3 h-3" />
            ERROR
          </span>
        );
      case 'warn':
        return (
          <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 text-[10px] font-bold border border-amber-500/30 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3" />
            WARN
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-400 text-[10px] font-bold border border-blue-500/30 flex items-center gap-1">
            <Info className="w-3 h-3" />
            INFO
          </span>
        );
    }
  };

  return (
    <div className="p-6 space-y-6 pb-32">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Terminal className="w-6 h-6 text-rose-500" />
            <span>บันทึกระบบ & การทำงาน (Console Logs)</span>
          </h2>
          <p className="text-sm text-zinc-400 mt-1">
            ดูรายละเอียดการเชื่อมต่อหลังบ้าน Lavalink, YouTube Engine และสถานะการเล่นแบบ Real-time
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleCopyLogs}
            className="px-3.5 py-1.5 rounded-xl bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 text-zinc-200 text-xs font-medium flex items-center gap-2 transition"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5 text-zinc-400" />}
            <span>{copied ? 'คัดลอกแล้ว!' : 'คัดลอก Log ทั้งหมด'}</span>
          </button>

          <button
            onClick={() => logger.clearLogs()}
            className="px-3.5 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 border border-rose-500/20 text-xs font-medium flex items-center gap-2 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>ล้าง Log</span>
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold uppercase">
            <Filter className="w-3.5 h-3.5 text-rose-400" />
            <span>ระดับ:</span>
          </div>
          <select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none"
          >
            <option value="all">ทั้งหมด (All Levels)</option>
            <option value="info">Info</option>
            <option value="success">Success</option>
            <option value="warn">Warn</option>
            <option value="error">Error</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-semibold uppercase ml-2">
            <span>แหล่งที่มา:</span>
          </div>
          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="px-3 py-1.5 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none"
          >
            <option value="all">ทั้งหมด (All Sources)</option>
            <option value="Lavalink">Lavalink</option>
            <option value="Player">Player</option>
            <option value="HTTP">HTTP</option>
            <option value="System">System</option>
          </select>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-zinc-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ค้นหาใน Log..."
            className="pl-8 pr-3 py-1 rounded-xl bg-zinc-950 border border-zinc-800 text-xs text-zinc-200 outline-none focus:border-rose-500/50"
          />
        </div>
      </div>

      {/* Terminal Log Box */}
      <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-4 font-mono text-xs overflow-hidden shadow-2xl space-y-2">
        <div className="flex items-center justify-between pb-3 border-b border-zinc-900 text-[11px] text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-rose-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
            <span className="ml-2 text-zinc-400">Terminal Log Stream ({filteredLogs.length} items)</span>
          </div>
          <span>UTF-8 Log Console</span>
        </div>

        <div className="max-h-[500px] overflow-y-auto space-y-2 pt-2 pr-1 select-text">
          {filteredLogs.length === 0 ? (
            <div className="py-12 text-center text-zinc-600 font-sans">
              ไม่มีบันทึกข้อมูลย้อนหลังตามเงื่อนไขที่เลือก
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div
                key={log.id}
                className="p-2.5 rounded-xl bg-zinc-900/50 border border-zinc-800/40 hover:bg-zinc-900 transition space-y-1"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[11px]">{log.timestamp}</span>
                    <span className="px-2 py-0.5 rounded bg-zinc-800 text-zinc-300 font-bold text-[10px]">
                      {log.source}
                    </span>
                    {getLevelBadge(log.level)}
                  </div>
                </div>

                <div className="text-zinc-200 pt-0.5 leading-relaxed break-words">
                  {log.message}
                </div>

                {log.details && (
                  <pre className="p-2 rounded bg-black/60 text-zinc-400 text-[11px] overflow-x-auto whitespace-pre-wrap font-mono mt-1 border border-zinc-900">
                    {typeof log.details === 'object' ? JSON.stringify(log.details, null, 2) : String(log.details)}
                  </pre>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
