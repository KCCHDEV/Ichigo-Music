import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, VolumeX, Repeat, Shuffle, ListMusic, Loader2, Wand2, Mic2 } from 'lucide-react';
import { Track } from '../types/music';
import { logger } from '../services/logger';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

interface PlayerProps {
  currentTrack: Track | null;
  isPlaying: boolean;
  onPlayPauseToggle: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onTrackEnd: () => void;
  queue: Track[];
  onToggleQueue: () => void;
  isAutoMix: boolean;
  isAutoMixLoading?: boolean;
  onToggleAutoMix: () => void;
  onToggleLyrics?: () => void;
  isLyricsOpen?: boolean;
  onTimeUpdate?: (time: number) => void;
  seekTime?: number | null;
}

type PlaybackStatus = 'idle' | 'loading' | 'buffering' | 'playing' | 'paused' | 'error';

export const Player: React.FC<PlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPauseToggle,
  onNext,
  onPrevious,
  onTrackEnd,
  queue,
  onToggleQueue,
  isAutoMix,
  isAutoMixLoading = false,
  onToggleAutoMix,
  onToggleLyrics,
  isLyricsOpen = false,
  onTimeUpdate,
  seekTime,
}) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const [, setYtReady] = useState(false);

  const [playbackStatus, setPlaybackStatus] = useState<PlaybackStatus>('idle');

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Helper to extract YouTube ID
  const getYouTubeId = useCallback((track: Track | null): string | null => {
    if (!track) return null;
    if (track.identifier && !track.identifier.startsWith('demo-') && /^[a-zA-Z0-9_-]{11}$/.test(track.identifier)) {
      return track.identifier;
    }
    if (track.uri) {
      const match = track.uri.match(/(?:youtu\.be\/|youtube\.com\/(?:embed\/|v\/|watch\?v=|watch\?.+&v=))([\w-]{11})/);
      if (match && match[1]) return match[1];
    }
    return null;
  }, []);

  const ytId = getYouTubeId(currentTrack);

  // Load YouTube IFrame API Script
  useEffect(() => {
    logger.addLog('info', 'Player', 'Initializing YouTube Engine...');

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const createPlayerInstance = () => {
      if (!iframeRef.current) return;
      try {
        ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
          events: {
            onReady: () => {
              logger.addLog('success', 'Player', 'YouTube Player Engine Ready!');
              setYtReady(true);
            },
            onStateChange: (event: any) => {
              if (event.data === 1) {
                setPlaybackStatus('playing');
              } else if (event.data === 2) {
                setPlaybackStatus('paused');
              } else if (event.data === 3) {
                setPlaybackStatus('buffering');
              } else if (event.data === 0) {
                setPlaybackStatus('idle');
                if (isRepeat) {
                  ytPlayerRef.current?.seekTo(0);
                  ytPlayerRef.current?.playVideo();
                } else {
                  onTrackEnd();
                }
              }
            },
            onError: (event: any) => {
              logger.addLog('error', 'Player', `YouTube Player Error Code: ${event.data}`);
              setPlaybackStatus('error');
              setTimeout(() => onNext(), 2000);
            },
          },
        });
      } catch (err: any) {
        logger.addLog('error', 'Player', `Failed to attach YT player instance: ${err.message}`);
      }
    };

    if (window.YT && window.YT.Player) {
      createPlayerInstance();
    } else {
      window.onYouTubeIframeAPIReady = () => {
        createPlayerInstance();
      };
    }
  }, []);

  const hasTrackEndedRef = useRef(false);

  // Handle external seek requests (e.g. clicking lyrics line)
  useEffect(() => {
    if (typeof seekTime === 'number' && seekTime >= 0) {
      setCurrentTime(seekTime);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
        ytPlayerRef.current.seekTo(seekTime, true);
      }
      if (audioRef.current) {
        audioRef.current.currentTime = seekTime;
      }
    }
  }, [seekTime]);

  // Sync current time & duration with Auto Playhead Status Sync
  useEffect(() => {
    let interval: any;
    if (ytId && isPlaying) {
      interval = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          const curr = ytPlayerRef.current.getCurrentTime() || 0;
          const dur = ytPlayerRef.current.getDuration() || (currentTrack?.length ? currentTrack.length / 1000 : 0);
          setCurrentTime(curr);
          setDuration(dur);
          onTimeUpdate?.(curr);

          const state = typeof ytPlayerRef.current.getPlayerState === 'function' ? ytPlayerRef.current.getPlayerState() : -1;
          if (state === 1 || curr > 0.2) {
            setPlaybackStatus('playing');
          }

          // Safety trigger for track ending
          if (dur > 5 && curr >= dur - 0.8 && !hasTrackEndedRef.current) {
            hasTrackEndedRef.current = true;
            if (isRepeat) {
              ytPlayerRef.current?.seekTo(0);
              ytPlayerRef.current?.playVideo();
            } else {
              onTrackEnd();
            }
          }
        }
      }, 400);
    }
    return () => clearInterval(interval);
  }, [ytId, isPlaying, currentTrack, isRepeat, onTrackEnd]);

  // Handle Smooth Track Transitioning
  useEffect(() => {
    if (!currentTrack) return;
    hasTrackEndedRef.current = false;

    const currentYtId = getYouTubeId(currentTrack);
    logger.addLog('info', 'Player', `Loading track: "${currentTrack.title}"`, { ytId: currentYtId });

    setPlaybackStatus('loading');

    if (currentYtId) {
      if (audioRef.current) audioRef.current.pause();

      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        ytPlayerRef.current.loadVideoById({
          videoId: currentYtId,
          startSeconds: 0,
        });
        ytPlayerRef.current.setVolume(isMuted ? 0 : volume * 100);
        if (isPlaying) {
          ytPlayerRef.current.playVideo();
        }
      }
    } else if (currentTrack.uri) {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.pauseVideo === 'function') {
        ytPlayerRef.current.pauseVideo();
      }

      if (audioRef.current) {
        audioRef.current.src = currentTrack.uri;
        audioRef.current.volume = isMuted ? 0 : volume;
        if (isPlaying) {
          audioRef.current.play().catch(console.error);
        }
      }
    }
  }, [currentTrack, getYouTubeId]);

  // Play/Pause button toggle
  useEffect(() => {
    if (ytId && ytPlayerRef.current) {
      if (isPlaying) {
        ytPlayerRef.current.playVideo?.();
      } else {
        ytPlayerRef.current.pauseVideo?.();
      }
    } else if (audioRef.current && audioRef.current.src) {
      if (isPlaying) {
        audioRef.current.play?.().catch(console.error);
      } else {
        audioRef.current.pause?.();
      }
    }
  }, [isPlaying, ytId]);

  // Volume Change
  const handleVolumeChange = (newVol: number) => {
    setVolume(newVol);
    setIsMuted(newVol === 0);

    if (ytPlayerRef.current && typeof ytPlayerRef.current.setVolume === 'function') {
      ytPlayerRef.current.setVolume(newVol * 100);
    }
    if (audioRef.current) {
      audioRef.current.volume = newVol;
    }
  };

  const toggleMute = () => {
    if (isMuted) {
      setIsMuted(false);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.unMute === 'function') {
        ytPlayerRef.current.unMute();
        ytPlayerRef.current.setVolume(volume * 100);
      }
      if (audioRef.current) audioRef.current.volume = volume;
    } else {
      setIsMuted(true);
      if (ytPlayerRef.current && typeof ytPlayerRef.current.mute === 'function') {
        ytPlayerRef.current.mute();
      }
      if (audioRef.current) audioRef.current.volume = 0;
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newTime = parseFloat(e.target.value);
    setCurrentTime(newTime);

    if (ytId && ytPlayerRef.current && typeof ytPlayerRef.current.seekTo === 'function') {
      ytPlayerRef.current.seekTo(newTime, true);
    } else if (audioRef.current) {
      audioRef.current.currentTime = newTime;
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const trackDuration = duration || (currentTrack?.length ? currentTrack.length / 1000 : 180);

  return (
    <div className="h-24 bg-slate-950/95 border-t border-slate-800/80 px-6 flex items-center justify-between z-40 fixed bottom-0 left-0 right-0 backdrop-blur-xl">
      {/* HTML Audio element & YT Player iframe */}
      <audio
        ref={audioRef}
        onTimeUpdate={() => {
          if (audioRef.current && !ytId) {
            const curr = audioRef.current.currentTime || 0;
            const dur = audioRef.current.duration || 0;
            setCurrentTime(curr);
            if (dur > 0 && !isNaN(dur)) {
              setDuration(dur);
            }
            onTimeUpdate?.(curr);
          }
        }}
        onLoadedMetadata={() => {
          if (audioRef.current && !ytId) {
            const dur = audioRef.current.duration || 0;
            if (dur > 0 && !isNaN(dur)) {
              setDuration(dur);
            }
          }
        }}
        onPlay={() => {
          if (!ytId) setPlaybackStatus('playing');
        }}
        onPause={() => {
          if (!ytId && audioRef.current && !audioRef.current.ended) {
            setPlaybackStatus('paused');
          }
        }}
        onEnded={() => {
          if (!ytId) {
            setPlaybackStatus('idle');
            if (isRepeat) {
              if (audioRef.current) {
                audioRef.current.currentTime = 0;
                audioRef.current.play().catch(console.error);
              }
            } else {
              onTrackEnd();
            }
          }
        }}
        onError={() => {
          if (!ytId) {
            logger.addLog('error', 'Player', `Failed to play audio file: ${currentTrack?.title}`);
            setPlaybackStatus('error');
          }
        }}
        className="hidden"
      />
      <iframe
        ref={iframeRef}
        id="yt-player-iframe-element"
        title="YouTube Audio Engine"
        src={`https://www.youtube-nocookie.com/embed/${ytId || ''}?enablejsapi=1&autoplay=1&origin=${encodeURIComponent(window.location.origin)}`}
        allow="autoplay"
        className="fixed bottom-0 right-0 w-2 h-2 opacity-0 pointer-events-none z-[-1] border-0"
      />

      {/* Left: Track Details & Animated Equalizer */}
      <div className="flex items-center gap-4 w-1/3 min-w-[240px]">
        {currentTrack ? (
          <>
            <div className="relative shrink-0 group">
              <img
                src={currentTrack.artworkUrl || '/app-logo.png'}
                alt={currentTrack.title}
                className="w-14 h-14 rounded-xl object-cover shadow-lg border border-slate-800 transition transform group-hover:scale-105"
              />
            </div>
            <div className="overflow-hidden space-y-0.5 max-w-[210px]">
              {currentTrack.title.length > 20 ? (
                <div className="overflow-hidden w-full relative">
                  <div className="animate-marquee cursor-pointer">
                    <span className="font-bold text-sm text-slate-100 pr-8 hover:text-sky-400 transition">
                      {currentTrack.title}
                    </span>
                    <span className="font-bold text-sm text-slate-100 pr-8 hover:text-sky-400 transition">
                      {currentTrack.title}
                    </span>
                  </div>
                </div>
              ) : (
                <h4 className="font-bold text-sm text-slate-100 truncate hover:text-sky-400 cursor-pointer transition">
                  {currentTrack.title}
                </h4>
              )}
              <p className="text-xs text-slate-400 truncate">
                {currentTrack.author}
              </p>
            </div>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <img
              src="/app-logo.png"
              alt="Ichigo Mini Icon"
              className="w-14 h-14 rounded-xl object-cover shadow-md border border-slate-800 shrink-0"
            />
            <div>
              <p className="text-sm font-medium text-slate-400">ไม่ได้เล่นเพลงอยู่</p>
              <p className="text-xs text-slate-600">เลือกเพลงเพื่อเริ่มฟัง</p>
            </div>
          </div>
        )}
      </div>

      {/* Middle: Playback Controls & Progress Bar */}
      <div className="flex flex-col items-center gap-2 max-w-xl w-full">
        <div className="flex items-center gap-5">
          <button
            onClick={() => setIsShuffle(!isShuffle)}
            className={`transition p-1.5 rounded-lg active:scale-95 ${isShuffle ? 'text-sky-400 bg-sky-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={onPrevious}
            disabled={!currentTrack}
            className="text-slate-300 hover:text-white transition disabled:opacity-40 p-1 active:scale-95"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={onPlayPauseToggle}
            disabled={!currentTrack}
            className="w-10 h-10 rounded-full bg-sky-500 hover:bg-sky-400 text-slate-950 flex items-center justify-center shadow-lg shadow-sky-500/30 transition transform active:scale-90 disabled:opacity-40"
          >
            {playbackStatus === 'loading' || playbackStatus === 'buffering' ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : isPlaying ? (
              <Pause className="w-5 h-5 fill-current" />
            ) : (
              <Play className="w-5 h-5 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={onNext}
            disabled={!currentTrack}
            className="text-slate-300 hover:text-white transition disabled:opacity-40 p-1 active:scale-95"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          <button
            onClick={() => setIsRepeat(!isRepeat)}
            className={`transition p-1.5 rounded-lg active:scale-95 ${isRepeat ? 'text-sky-400 bg-sky-500/10' : 'text-slate-400 hover:text-slate-200'}`}
            title="Repeat Track"
          >
            <Repeat className="w-4 h-4" />
          </button>

          {/* Auto Mix Button */}
          <button
            onClick={onToggleAutoMix}
            className={`px-2.5 py-1 rounded-full text-xs font-semibold flex items-center gap-1.5 transition active:scale-95 ${
              isAutoMix
                ? 'bg-gradient-to-r from-sky-500 via-blue-600 to-indigo-600 text-white shadow-md shadow-blue-500/30 ring-2 ring-sky-400/30'
                : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
            title="Auto Mix Recommendation Engine (Apple Music Autoplay)"
          >
            {isAutoMixLoading ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
            ) : (
              <Wand2 className={`w-3.5 h-3.5 ${isAutoMix ? 'animate-pulse text-white' : ''}`} />
            )}
            <span>Auto Mix</span>
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="w-full flex items-center gap-3">
          <span className="text-[11px] font-medium text-zinc-500 w-10 text-right font-mono">
            {formatTime(currentTime)}
          </span>
          <div className="relative flex-1 flex items-center">
            <input
              type="range"
              min={0}
              max={trackDuration || 100}
              value={currentTime}
              onChange={handleSeek}
              disabled={!currentTrack}
              className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-rose-500 hover:h-1.5 transition-all"
            />
          </div>
          <span className="text-[11px] font-medium text-zinc-500 w-10 font-mono">
            {formatTime(trackDuration)}
          </span>
        </div>
      </div>

      {/* Right: Lyrics, Volume & Queue */}
      <div className="flex items-center justify-end gap-3 w-1/4 min-w-[200px]">
        {/* Lyrics Button */}
        <button
          onClick={onToggleLyrics}
          className={`p-2 rounded-xl transition active:scale-95 flex items-center justify-center ${
            isLyricsOpen
              ? 'text-sky-400 bg-sky-500/20 border border-sky-500/30 shadow-md shadow-sky-500/20'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
          }`}
          title="เนื้อเพลง (Lyrics & Karaoke)"
        >
          <Mic2 className="w-5 h-5" />
        </button>

        <button
          onClick={onToggleQueue}
          className="text-slate-400 hover:text-slate-200 p-2 rounded-xl hover:bg-slate-900 transition active:scale-95 relative"
          title="Play Queue"
        >
          <ListMusic className="w-5 h-5" />
          {queue.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-sky-400 animate-ping" />
          )}
        </button>

        <div className="flex items-center gap-2">
          <button onClick={toggleMute} className="text-slate-400 hover:text-slate-200 active:scale-90 transition">
            {isMuted || volume === 0 ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
          </button>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => handleVolumeChange(parseFloat(e.target.value))}
            className="w-20 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
          />
        </div>
      </div>
    </div>
  );
};
