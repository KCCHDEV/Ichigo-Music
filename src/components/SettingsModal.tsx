import React, { useState } from 'react';
import { X, Server, CheckCircle2, AlertCircle, RefreshCw, Key, Globe, Hash, Zap } from 'lucide-react';
import { LavalinkConfig, LavalinkServerPreset } from '../types/music';
import { getStoredLavalinkServers } from '../services/lavalinkPresets';

interface SettingsModalProps {
  config: LavalinkConfig;
  onSave: (config: LavalinkConfig) => void;
  onClose: () => void;
  onTest: () => Promise<{ success: boolean; message: string }>;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  config,
  onSave,
  onClose,
  onTest,
}) => {
  const [host, setHost] = useState(config.host);
  const [port, setPort] = useState(config.port);
  const [password, setPassword] = useState(config.password);
  const [secure, setSecure] = useState(config.secure);

  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleTestConnection = async () => {
    setTesting(true);
    setTestResult(null);
    onSave({ host, port: Number(port), password, secure });
    const res = await onTest();
    setTestResult(res);
    setTesting(false);
  };

  const handleSave = () => {
    onSave({ host, port: Number(port), password, secure });
    onClose();
  };

  const presets = getStoredLavalinkServers();

  const applyPreset = (preset: LavalinkServerPreset) => {
    setHost(preset.host);
    setPort(preset.port);
    setPassword(preset.password);
    setSecure(preset.secure);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-md p-4">
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl w-full max-w-md p-6 shadow-2xl space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-rose-600/10 border border-rose-500/20 text-rose-400 flex items-center justify-center">
              <Server className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg text-white">ตั้งค่า Lavalink Server</h3>
              <p className="text-xs text-zinc-400">กำหนดเซิร์ฟเวอร์ถอดรหัสเพลงของคุณ</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-200 p-1.5 rounded-full hover:bg-zinc-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Presets */}
        {presets.length > 0 && (
          <div className="space-y-2">
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-1.5">
              <Zap className="w-3.5 h-3.5 text-rose-400" />
              <span>เซิร์ฟเวอร์ที่คุณบันทึกไว้ (Saved Server Presets)</span>
            </label>
            <div className="grid grid-cols-2 gap-2">
              {presets.map((preset) => (
                <button
                  key={preset.id}
                  type="button"
                  onClick={() => applyPreset(preset)}
                  className={`p-2 rounded-xl text-left border transition text-xs flex flex-col ${
                    host === preset.host
                      ? 'bg-rose-950/30 border-rose-500/50 text-rose-200'
                      : 'bg-zinc-950 border-zinc-800/80 text-zinc-300 hover:bg-zinc-800/50'
                  }`}
                >
                  <span className="font-bold truncate">{preset.name}</span>
                  <span className="text-[10px] text-zinc-500">{preset.location}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Form Controls */}
        <div className="space-y-3 pt-1 border-t border-zinc-800/60">
          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-rose-400" />
              <span>Host / IP Address</span>
            </label>
            <input
              type="text"
              value={host}
              onChange={(e) => setHost(e.target.value)}
              placeholder="e.g. localhost or 127.0.0.1"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 text-xs text-zinc-100 outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Hash className="w-3.5 h-3.5 text-rose-400" />
                <span>Port</span>
              </label>
              <input
                type="number"
                value={port}
                onChange={(e) => setPort(Number(e.target.value))}
                placeholder="2333"
                className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 text-xs text-zinc-100 outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1">
                Protocol SSL
              </label>
              <button
                type="button"
                onClick={() => setSecure(!secure)}
                className={`w-full py-2 px-3 rounded-xl border text-xs font-semibold transition ${
                  secure
                    ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                    : 'bg-zinc-950 text-zinc-400 border-zinc-800'
                }`}
              >
                {secure ? 'HTTPS (Secure)' : 'HTTP (Standard)'}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Key className="w-3.5 h-3.5 text-rose-400" />
              <span>Password</span>
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="youshallnotpass"
              className="w-full px-3.5 py-2 rounded-xl bg-zinc-950 border border-zinc-800 focus:border-rose-500/60 text-xs text-zinc-100 outline-none"
            />
          </div>
        </div>

        {/* Test Result Feedback */}
        {testResult && (
          <div
            className={`p-3 rounded-xl border text-xs flex items-start gap-2.5 ${
              testResult.success
                ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                : 'bg-rose-500/10 border-rose-500/30 text-rose-300'
            }`}
          >
            {testResult.success ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            )}
            <div>
              <p className="font-semibold">{testResult.success ? 'เชื่อมต่อสำเร็จ!' : 'เชื่อมต่อไม่สำเร็จ'}</p>
              <p className="mt-0.5 opacity-90">{testResult.message}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between pt-2 border-t border-zinc-800/60">
          <button
            onClick={handleTestConnection}
            disabled={testing}
            className="px-3.5 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-medium flex items-center gap-2 transition disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${testing ? 'animate-spin' : ''}`} />
            <span>{testing ? 'กำลังทดสอบ...' : 'ทดสอบสัญญาณ'}</span>
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-3 py-2 rounded-xl text-zinc-400 hover:text-zinc-200 text-xs font-medium"
            >
              ยกเลิก
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white text-xs font-semibold shadow-lg shadow-rose-600/30 transition"
            >
              บันทึกการตั้งค่า
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
