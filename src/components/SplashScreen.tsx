import React, { useState, useEffect } from 'react';
import { Sparkles, Loader2 } from 'lucide-react';
import { getStoredLavalinkServers } from '../services/lavalinkPresets';
import { LavalinkServerPreset } from '../types/music';
import { customFetch } from '../services/http';
import { logger } from '../services/logger';

interface SplashScreenProps {
  onComplete: (bestServer?: LavalinkServerPreset) => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFadingOut, setIsFadingOut] = useState<boolean>(false);

  useEffect(() => {
    logger.addLog('info', 'System', 'Startup sequence initiated...');
    runStartupChecks();
  }, []);

  const runStartupChecks = async () => {
    const serversToTest = getStoredLavalinkServers();

    if (serversToTest.length === 0) {
      logger.addLog('info', 'System', 'No Lavalink servers configured in presets. Ready for user input or local MP3 mode.');
      await new Promise(r => setTimeout(r, 800));
      setIsFadingOut(true);
      setTimeout(() => {
        onComplete();
      }, 600);
      return;
    }

    const checkPromises = serversToTest.map(async (server) => {
      const protocol = server.secure ? 'https' : 'http';
      const url = `${protocol}://${server.host}:${server.port}/v4/loadtracks?identifier=ytsearch:music`;
      const start = Date.now();

      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);

        const res = await customFetch(url, {
          headers: {
            'Authorization': server.password,
            'Client-Name': 'Lavalink/4.0.0',
            'Accept': 'application/json',
          },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        const latency = Date.now() - start;
        const isOnline = res.ok || res.status === 429 || res.status === 200;
        return { server, latency: isOnline ? latency : null, isOnline };
      } catch {
        return { server, latency: null, isOnline: false };
      }
    });

    const results = await Promise.all(checkPromises);
    const onlineServers = results.filter(r => r.isOnline && r.latency !== null).sort((a, b) => (a.latency || 9999) - (b.latency || 9999));

    let chosen = serversToTest[0];
    if (onlineServers.length > 0) {
      chosen = onlineServers[0].server;
    }

    // Brief delay for clean fade transition
    await new Promise(r => setTimeout(r, 1000));

    setIsFadingOut(true);
    setTimeout(() => {
      onComplete(chosen);
    }, 600);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl text-white flex flex-col items-center justify-center p-6 select-none overflow-hidden transition-all duration-700 ease-out ${
        isFadingOut ? 'opacity-0 scale-105 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Background Ambient Glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-sky-950/40 via-slate-950 to-slate-950 blur-3xl pointer-events-none" />

      <div className="relative z-10 flex flex-col items-center text-center space-y-6">
        {/* App Icon */}
        <div className="relative">
          <img
            src="/app-logo.png"
            alt="Ichigo Logo"
            className="w-24 h-24 rounded-3xl object-cover shadow-2xl shadow-sky-500/40 border-2 border-sky-500/30"
          />
          <span className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-white border-4 border-slate-950 flex items-center justify-center shadow-lg">
            <Sparkles className="w-3 h-3 text-sky-600" />
          </span>
        </div>

        {/* Title & Version */}
        <div className="space-y-1">
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            Ichigo Music
          </h1>
          <p className="text-xs text-sky-400 font-mono tracking-wider font-semibold">
            v0.1.0
          </p>
        </div>

        {/* Minimal Loading Indicator */}
        <div className="pt-2 flex items-center gap-2 text-xs text-slate-400 font-medium animate-pulse">
          <Loader2 className="w-4 h-4 text-sky-400 animate-spin" />
          <span>กำลังเริ่มต้นแอป...</span>
        </div>
      </div>
    </div>
  );
};
