import React, { useState, useEffect, useCallback } from 'react';
import {
  Server,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Zap,
  ShieldCheck,
  Globe2,
  Plus,
  Trash2,
  Activity,
  Cpu,
  HardDrive,
  Radio,
  Clock,
  BarChart3,
  X,
  Lock,
  Unlock,
  Sparkles,
  Loader2,
} from 'lucide-react';
import { LavalinkServerPreset, LavalinkConfig } from '../types/music';
import {
  getStoredLavalinkServers,
  saveCustomLavalinkServer,
  deleteLavalinkServer,
  resetLavalinkServers,
} from '../services/lavalinkPresets';
import {
  fetchDeepServerStats,
  LavalinkDeepStats,
  formatBytes,
  formatUptime,
} from '../services/lavalinkStats';
import { customFetch } from '../services/http';

interface ServerStatusResult {
  id: string;
  isChecking: boolean;
  isOnline: boolean;
  latency: number | null;
  version?: string;
  error?: string;
}

interface ServerStatusViewProps {
  currentConfig: LavalinkConfig;
  onSelectServer: (config: LavalinkConfig) => void;
}

export const ServerStatusView: React.FC<ServerStatusViewProps> = ({
  currentConfig,
  onSelectServer,
}) => {
  const [servers, setServers] = useState<LavalinkServerPreset[]>([]);
  const [statusResults, setStatusResults] = useState<Record<string, ServerStatusResult>>({});
  const [isRefreshingAll, setIsRefreshingAll] = useState(false);

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [deepStatsServer, setDeepStatsServer] = useState<LavalinkServerPreset | null>(null);
  const [deepStatsData, setDeepStatsData] = useState<LavalinkDeepStats | null>(null);
  const [isLoadingDeepStats, setIsLoadingDeepStats] = useState(false);

  // Form State for Add Server
  const [formName, setFormName] = useState('');
  const [formHost, setFormHost] = useState('');
  const [formPort, setFormPort] = useState('443');
  const [formPassword, setFormPassword] = useState('youshallnotpass');
  const [formSecure, setFormSecure] = useState(true);
  const [formLocation, setFormLocation] = useState('Custom Location');
  const [formDescription, setFormDescription] = useState('Custom Lavalink v4 node');

  // Load Servers
  const loadServers = useCallback(() => {
    const loaded = getStoredLavalinkServers();
    setServers(loaded);
    return loaded;
  }, []);

  useEffect(() => {
    loadServers();
  }, [loadServers]);

  // Check Single Server Status
  const checkSingleServer = useCallback(async (server: LavalinkServerPreset) => {
    setStatusResults(prev => ({
      ...prev,
      [server.id]: { id: server.id, isChecking: true, isOnline: false, latency: null }
    }));

    const protocol = server.secure ? 'https' : 'http';
    const url = `${protocol}://${server.host}:${server.port}/v4/loadtracks?identifier=ytsearch:pingtest`;
    const start = Date.now();

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await customFetch(url, {
        headers: { 'Authorization': server.password },
        signal: controller.signal
      });
      clearTimeout(timeoutId);

      const latency = Date.now() - start;

      if (res.ok) {
        setStatusResults(prev => ({
          ...prev,
          [server.id]: {
            id: server.id,
            isChecking: false,
            isOnline: true,
            latency,
            version: 'v4.x'
          }
        }));
      } else {
        setStatusResults(prev => ({
          ...prev,
          [server.id]: {
            id: server.id,
            isChecking: false,
            isOnline: false,
            latency: null,
            error: `HTTP ${res.status}`
          }
        }));
      }
    } catch (e: any) {
      setStatusResults(prev => ({
        ...prev,
        [server.id]: {
          id: server.id,
          isChecking: false,
          isOnline: false,
          latency: null,
          error: e.name === 'AbortError' ? 'Timeout' : 'Unreachable'
        }
      }));
    }
  }, []);

  const refreshAllStatuses = useCallback(async () => {
    setIsRefreshingAll(true);
    const currentList = loadServers();
    await Promise.all(currentList.map(server => checkSingleServer(server)));
    setIsRefreshingAll(false);
  }, [checkSingleServer, loadServers]);

  useEffect(() => {
    refreshAllStatuses();
  }, [refreshAllStatuses]);

  // Handle Add Custom Server
  const handleAddServerSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim() || !formHost.trim() || !formPort.trim()) return;

    const newServers = saveCustomLavalinkServer({
      name: formName.trim(),
      host: formHost.trim(),
      port: parseInt(formPort.trim(), 10) || 443,
      password: formPassword.trim(),
      secure: formSecure,
      location: formLocation.trim() || 'Custom Server',
      description: formDescription.trim() || 'Custom Lavalink Node',
    });

    setServers(newServers);
    setIsAddModalOpen(false);

    // Reset Form
    setFormName('');
    setFormHost('');
    setFormPort('443');
    setFormPassword('youshallnotpass');

    // Test new server
    refreshAllStatuses();
  };

  // Handle Delete Server
  const handleDeleteServer = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('คุณต้องการลบเซิร์ฟเวอร์นี้ออกจากรายการใช่หรือไม่?')) {
      const updated = deleteLavalinkServer(id);
      setServers(updated);
      refreshAllStatuses();
    }
  };

  // Handle Reset to Default Presets
  const handleResetDefaultServers = () => {
    if (confirm('คืนค่ารายการเซิร์ฟเวอร์กลับสู่ค่าเริ่มต้นทั้งหมดใช่หรือไม่?')) {
      const updated = resetLavalinkServers();
      setServers(updated);
      refreshAllStatuses();
    }
  };

  // Open Deep Stats Modal
  const handleOpenDeepStats = async (server: LavalinkServerPreset, e: React.MouseEvent) => {
    e.stopPropagation();
    setDeepStatsServer(server);
    setDeepStatsData(null);
    setIsLoadingDeepStats(true);

    const stats = await fetchDeepServerStats(server);
    setDeepStatsData(stats);
    setIsLoadingDeepStats(false);
  };

  return (
    <div className="p-6 space-y-8 pb-32 max-w-6xl mx-auto animate-page-enter">
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2.5">
            <Server className="w-6 h-6 text-sky-400" />
            <span>สถานะ เซิร์ฟเวอร์ Lavalink (Server Status & Diagnostics)</span>
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            เช็กความเร็ว (Latency), เพิ่ม/ลบ เซิร์ฟเวอร์ และดูข้อมูลการทำงานระบบเชิงลึก (Deep Diagnostics)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold text-xs flex items-center gap-2 transition shadow-lg shadow-sky-500/25 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>เพิ่ม Server ใหม่</span>
          </button>

          <button
            onClick={handleResetDefaultServers}
            className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white font-medium text-xs flex items-center gap-1.5 transition active:scale-95"
            title="คืนค่าโหนดเริ่มต้นทั้งหมด"
          >
            <span>คืนค่าเริ่มต้น</span>
          </button>

          <button
            onClick={refreshAllStatuses}
            disabled={isRefreshingAll}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-200 font-medium text-xs flex items-center gap-2 transition active:scale-95 disabled:opacity-50"
          >
            <RefreshCw className={`w-4 h-4 ${isRefreshingAll ? 'animate-spin text-sky-400' : ''}`} />
            <span>ทดสอบทั้งหมด</span>
          </button>
        </div>
      </div>

      {/* Server Preset & Custom Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {servers.map((server) => {
          const status = statusResults[server.id];
          const isActive = currentConfig.host === server.host && currentConfig.port === server.port;

          return (
            <div
              key={server.id}
              className={`p-6 rounded-3xl border transition-all duration-300 relative overflow-hidden flex flex-col justify-between space-y-4 ${
                isActive
                  ? 'bg-slate-900/95 border-sky-500/60 shadow-xl shadow-sky-500/10 ring-2 ring-sky-500/20'
                  : 'glass-card-ichigo'
              }`}
            >
              {/* Top Banner */}
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-lg text-white">{server.name}</h3>
                    {isActive && (
                      <span className="px-2.5 py-0.5 rounded-full bg-sky-500/20 border border-sky-500/40 text-sky-300 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1">
                        <Sparkles className="w-3 h-3 text-sky-400" />
                         Active Node
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-sky-300/80 font-medium flex items-center gap-1">
                    <Globe2 className="w-3.5 h-3.5" />
                    <span>{server.location}</span>
                  </p>
                </div>

                {/* Status Indicator Badge */}
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => handleDeleteServer(server.id, e)}
                    className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition"
                    title="ลบ Server นี้ออกจากรายการ"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>

                  <div className="text-right">
                    {status?.isChecking ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 text-slate-400 text-xs font-medium animate-pulse">
                        <RefreshCw className="w-3 h-3 animate-spin text-sky-400" />
                        <span>Ping...</span>
                      </span>
                    ) : status?.isOnline ? (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 text-xs font-bold font-mono">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>{status.latency} ms</span>
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-500/15 border border-rose-500/30 text-rose-400 text-xs font-semibold">
                        <XCircle className="w-3.5 h-3.5" />
                        <span>{status?.error || 'Offline'}</span>
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Node Endpoint Info */}
              <p className="text-xs text-slate-400 leading-relaxed font-mono bg-slate-950/60 p-3 rounded-2xl border border-slate-800/60">
                {server.secure ? 'https://' : 'http://'}{server.host}:{server.port}
              </p>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-3 pt-2">
                <button
                  onClick={(e) => handleOpenDeepStats(server, e)}
                  disabled={!status?.isOnline}
                  className="px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-800 hover:border-sky-500/40 text-slate-300 hover:text-sky-300 text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 disabled:opacity-40"
                >
                  <Activity className="w-3.5 h-3.5 text-sky-400" />
                  <span>ดูข้อมูลเชิงลึก (Deep Stats)</span>
                </button>

                <button
                  onClick={() => onSelectServer(server)}
                  disabled={isActive}
                  className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95 ${
                    isActive
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 cursor-default'
                      : 'bg-sky-500 hover:bg-sky-400 text-slate-950 shadow-md shadow-sky-500/20'
                  }`}
                >
                  {isActive ? <ShieldCheck className="w-3.5 h-3.5" /> : <Zap className="w-3.5 h-3.5 fill-current" />}
                  <span>{isActive ? 'กำลังใช้งานอยู่' : 'ใช้งาน Server นี้'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Custom Server Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-xl flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl space-y-6 relative">
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-2 text-white font-bold text-lg">
                <Plus className="w-5 h-5 text-sky-400" />
                <span>เพิ่ม Lavalink Server ใหม่ (Add Node)</span>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-white p-1 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddServerSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block text-slate-300 font-semibold mb-1">ชื่อเซิร์ฟเวอร์ (Server Name)</label>
                <input
                  type="text"
                  required
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="เช่น My Personal Lavalink Node"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2">
                  <label className="block text-slate-300 font-semibold mb-1">Host / Domain</label>
                  <input
                    type="text"
                    required
                    value={formHost}
                    onChange={(e) => setFormHost(e.target.value)}
                    placeholder="เช่น lava.example.com หรือ 192.168.1.10"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">Port</label>
                  <input
                    type="text"
                    required
                    value={formPort}
                    onChange={(e) => setFormPort(e.target.value)}
                    placeholder="443 / 2333"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-slate-300 font-semibold mb-1">Password</label>
                <input
                  type="text"
                  required
                  value={formPassword}
                  onChange={(e) => setFormPassword(e.target.value)}
                  placeholder="youshallnotpass"
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none font-mono"
                />
              </div>

              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center gap-2">
                  {formSecure ? <Lock className="w-4 h-4 text-emerald-400" /> : <Unlock className="w-4 h-4 text-amber-400" />}
                  <span className="text-slate-200 font-medium">เปิดใช้งาน SSL / Secure (HTTPS)</span>
                </div>
                <input
                  type="checkbox"
                  checked={formSecure}
                  onChange={(e) => setFormSecure(e.target.checked)}
                  className="w-4 h-4 accent-sky-500 cursor-pointer"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">สถานที่ตั้ง (Location)</label>
                  <input
                    type="text"
                    value={formLocation}
                    onChange={(e) => setFormLocation(e.target.value)}
                    placeholder="เช่น Thailand / Singapore"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-slate-300 font-semibold mb-1">รายละเอียด (Description)</label>
                  <input
                    type="text"
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    placeholder="เช่น High performance node"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-950 border border-slate-800 focus:border-sky-500 text-slate-100 outline-none"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold"
                >
                  ยกเลิก
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-sky-500 hover:bg-sky-400 text-slate-950 font-bold shadow-lg shadow-sky-500/30"
                >
                  บันทึก Server
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deep Diagnostics Stats Dashboard Modal */}
      {deepStatsServer && (
        <div className="fixed inset-0 z-50 bg-slate-950/85 backdrop-blur-xl flex items-center justify-center p-4 animate-page-enter">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl space-y-6 relative max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="flex items-center justify-between border-b border-slate-800 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-sky-500/20 border border-sky-500/30 flex items-center justify-center text-sky-400">
                  <Activity className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white">{deepStatsServer.name}</h3>
                  <p className="text-xs text-sky-400 font-mono">
                    {deepStatsServer.secure ? 'https://' : 'http://'}{deepStatsServer.host}:{deepStatsServer.port}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setDeepStatsServer(null)}
                className="text-slate-400 hover:text-white p-1.5 rounded-full hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Dashboard Content */}
            {isLoadingDeepStats ? (
              <div className="py-20 flex flex-col items-center justify-center space-y-3 text-sky-400">
                <Loader2 className="w-8 h-8 animate-spin" />
                <p className="text-xs text-slate-300 font-medium">กำลังโหลดข้อมูลเชิงลึกจาก Lavalink Server...</p>
              </div>
            ) : !deepStatsData ? (
              <div className="py-16 text-center text-slate-400 space-y-2">
                <XCircle className="w-12 h-12 text-rose-500 mx-auto" />
                <p className="text-sm font-bold text-white">ไม่สามารถดึงข้อมูลเชิงลึกได้</p>
                <p className="text-xs text-slate-500">เซิร์ฟเวอร์อาจออฟไลน์ หรือไม่อนุญาตการเข้าถึง REST API</p>
              </div>
            ) : (
              <div className="space-y-6 text-xs">
                {/* Stat Grid 1: Version, Latency, Uptime, Active Players */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-amber-400" />
                      <span>Version</span>
                    </div>
                    <p className="text-sm font-bold text-white font-mono">{deepStatsData.version}</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Ping / Latency</span>
                    </div>
                    <p className="text-sm font-bold text-emerald-400 font-mono">{deepStatsData.latency} ms</p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Radio className="w-3.5 h-3.5 text-sky-400" />
                      <span>Audio Streams</span>
                    </div>
                    <p className="text-sm font-bold text-sky-300 font-mono">
                      {deepStatsData.playingPlayers} / {deepStatsData.players}
                    </p>
                  </div>

                  <div className="bg-slate-950 p-3.5 rounded-2xl border border-slate-800 space-y-1">
                    <div className="text-slate-400 font-semibold flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-purple-400" />
                      <span>Uptime</span>
                    </div>
                    <p className="text-sm font-bold text-white font-mono">{formatUptime(deepStatsData.uptime)}</p>
                  </div>
                </div>

                {/* CPU Usage Dashboard */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <div className="flex items-center gap-2">
                      <Cpu className="w-4 h-4 text-sky-400" />
                      <span>การทำงานของ CPU (CPU Cores: {deepStatsData.cpu.cores})</span>
                    </div>
                    <span className="font-mono text-sky-400">
                      {(deepStatsData.cpu.systemLoad * 100).toFixed(1)}% System
                    </span>
                  </div>

                  {/* System CPU Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>System Load</span>
                      <span className="font-mono">{(deepStatsData.cpu.systemLoad * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-sky-500 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(deepStatsData.cpu.systemLoad * 100, 100)}%` }}
                      />
                    </div>
                  </div>

                  {/* Lavalink Process CPU Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-[11px] text-slate-400">
                      <span>Lavalink Process Load</span>
                      <span className="font-mono">{(deepStatsData.cpu.lavalinkLoad * 100).toFixed(1)}%</span>
                    </div>
                    <div className="w-full h-2 bg-slate-900 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(deepStatsData.cpu.lavalinkLoad * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Memory RAM Dashboard */}
                <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-slate-300 font-bold">
                    <div className="flex items-center gap-2">
                      <HardDrive className="w-4 h-4 text-purple-400" />
                      <span>หน่วยความจำ RAM (Memory Usage)</span>
                    </div>
                    <span className="font-mono text-purple-300">
                      {formatBytes(deepStatsData.memory.used)} / {formatBytes(deepStatsData.memory.allocated)}
                    </span>
                  </div>

                  <div className="w-full h-2.5 bg-slate-900 rounded-full overflow-hidden flex">
                    <div
                      className="h-full bg-purple-500 transition-all duration-500"
                      style={{
                        width: `${deepStatsData.memory.allocated ? (deepStatsData.memory.used / deepStatsData.memory.allocated) * 100 : 0}%`,
                      }}
                      title="Used RAM"
                    />
                    <div
                      className="h-full bg-slate-700 transition-all duration-500"
                      style={{
                        width: `${deepStatsData.memory.allocated ? (deepStatsData.memory.free / deepStatsData.memory.allocated) * 100 : 0}%`,
                      }}
                      title="Free Allocated RAM"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-[11px] text-slate-400 font-mono pt-1">
                    <div>Used: <strong className="text-white">{formatBytes(deepStatsData.memory.used)}</strong></div>
                    <div>Allocated: <strong className="text-white">{formatBytes(deepStatsData.memory.allocated)}</strong></div>
                    <div>Reservable: <strong className="text-white">{formatBytes(deepStatsData.memory.reservable)}</strong></div>
                  </div>
                </div>

                {/* Frame Statistics (Voice WebSocket Health) */}
                {deepStatsData.frameStats && (
                  <div className="bg-slate-950 p-4 rounded-2xl border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-slate-300 font-bold">
                      <div className="flex items-center gap-2">
                        <Activity className="w-4 h-4 text-emerald-400" />
                        <span>ความเสถียรของสัญญาณเสียง (Frame Statistics)</span>
                      </div>
                      <span className="text-emerald-400 font-mono text-[11px]">WebSocket Healthy</span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center pt-1">
                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Sent Frames</div>
                        <div className="font-mono font-bold text-emerald-400 text-xs mt-0.5">
                          {deepStatsData.frameStats.sent.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Nulled Frames</div>
                        <div className="font-mono font-bold text-amber-400 text-xs mt-0.5">
                          {deepStatsData.frameStats.nulled.toLocaleString()}
                        </div>
                      </div>

                      <div className="bg-slate-900 p-2.5 rounded-xl border border-slate-800">
                        <div className="text-slate-400 text-[10px]">Deficit Frames</div>
                        <div className="font-mono font-bold text-rose-400 text-xs mt-0.5">
                          {deepStatsData.frameStats.deficit.toLocaleString()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
