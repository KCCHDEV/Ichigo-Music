import React from 'react';
import { Home, Search, History, Settings, Music, Radio, Server, Terminal, Sparkles, User, FolderOpen } from 'lucide-react';

interface SidebarProps {
  activeTab: 'home' | 'search' | 'history' | 'servers' | 'logs' | 'about';
  setActiveTab: (tab: 'home' | 'search' | 'history' | 'servers' | 'logs' | 'about') => void;
  openSettings: () => void;
  isConnected: boolean;
  onOpenLocalFiles?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  openSettings,
  isConnected,
  onOpenLocalFiles,
}) => {
  return (
    <aside className="w-64 bg-slate-900/90 backdrop-blur-md border-r border-slate-800/80 flex flex-col justify-between p-4 h-screen select-none">
      <div className="space-y-6">
        {/* Logo / App Brand (Ichigo Theme: Navy Blue + White Hairclip accent) */}
        <div className="flex items-center gap-3 px-2 py-1">
          <div className="relative">
            <img
              src="/app-logo.png"
              alt="Ichigo Logo"
              className="w-9 h-9 rounded-xl object-cover shadow-lg shadow-sky-500/25 border border-sky-500/30"
            />
            {/* Signature Ichigo White Hairclip Badge */}
            <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-white border-2 border-slate-900 flex items-center justify-center shadow">
              <Sparkles className="w-2 h-2 text-sky-600" />
            </span>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-bold text-lg text-white tracking-tight leading-none">Ichigo Music</h1>
            </div>
            <span className="text-[10px] text-sky-400/90 font-medium tracking-wide">Code 015 Edition</span>
          </div>
        </div>

        {/* Main Navigation */}
        <nav className="space-y-1">
          <button
            onClick={() => setActiveTab('home')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'home'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Home className="w-4 h-4" />
            <span>หน้าหลัก (Home)</span>
          </button>

          <button
            onClick={() => setActiveTab('search')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'search'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Search className="w-4 h-4" />
            <span>ค้นหา (Search)</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'history'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <History className="w-4 h-4" />
            <span>ประวัติการฟัง (History)</span>
          </button>

          {onOpenLocalFiles && (
            <button
              onClick={onOpenLocalFiles}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sky-400 hover:text-sky-300 hover:bg-sky-500/10 border border-sky-500/20 transition-all"
            >
              <FolderOpen className="w-4 h-4 text-sky-400" />
              <span>เปิดไฟล์ MP3 (Local Files)</span>
            </button>
          )}

          <button
            onClick={() => setActiveTab('servers')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'servers'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Server className="w-4 h-4" />
            <span>สถานะ เซิร์ฟเวอร์ (Servers)</span>
          </button>

          <button
            onClick={() => setActiveTab('logs')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'logs'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <Terminal className="w-4 h-4" />
            <span>บันทึกระบบ (Console Logs)</span>
          </button>

          <button
            onClick={() => setActiveTab('about')}
            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
              activeTab === 'about'
                ? 'bg-sky-500/15 text-sky-300 border border-sky-500/30 font-semibold shadow-sm shadow-sky-500/10'
                : 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
            }`}
          >
            <User className="w-4 h-4" />
            <span>ผู้สร้าง & เกี่ยวกับ (About)</span>
          </button>
        </nav>

        {/* Library section */}
        <div className="pt-4 border-t border-slate-800/60">
          <div className="px-3 pb-2 text-xs font-semibold text-slate-400 tracking-wider uppercase">
            คลังเพลง
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
              <Music className="w-4 h-4" />
              <span>เพลย์ลิสต์ส่วนตัว</span>
            </div>
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-slate-500 cursor-not-allowed">
              <Radio className="w-4 h-4" />
              <span>สถานีวิทยุ</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer / Server Status */}
      <div className="pt-4 border-t border-slate-800/60 space-y-3">
        <button
          onClick={openSettings}
          className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm text-slate-400 hover:text-slate-100 hover:bg-slate-800/60 transition-all border border-slate-800/60"
        >
          <div className="flex items-center gap-2">
            <Settings className="w-4 h-4 text-slate-400" />
            <span>ตั้งค่า Server</span>
          </div>
          <span className="w-2 h-2 rounded-full bg-slate-600" />
        </button>

        <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-slate-950/70 border border-slate-800/80 text-xs">
          <div className="flex items-center gap-2">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 shadow-sm shadow-emerald-400/50 animate-pulse' : 'bg-amber-400'}`} />
            <span className="text-slate-300 font-medium">Lavalink</span>
          </div>
          <span className={`text-[11px] font-semibold ${isConnected ? 'text-emerald-400' : 'text-amber-400'}`}>
            {isConnected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>
    </aside>
  );
};
