import { useState, useEffect, useCallback, useRef } from 'react';
import { FolderOpen } from 'lucide-react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { Player } from './components/Player';
import { HomeView } from './components/HomeView';
import { SearchView } from './components/SearchView';
import { HistoryView } from './components/HistoryView';
import { ServerStatusView } from './components/ServerStatusView';
import { ConsoleLogView } from './components/ConsoleLogView';
import { AboutView } from './components/AboutView';
import { SettingsModal } from './components/SettingsModal';
import { QueueDrawer } from './components/QueueDrawer';
import { AppleMusicPlayerModal } from './components/AppleMusicPlayerModal';
import { SplashScreen } from './components/SplashScreen';

import { Track, HistoryItem, LavalinkConfig, LavalinkServerPreset } from './types/music';
import { lavalinkService } from './services/lavalink';
import { getListeningHistory, addToListeningHistory, clearListeningHistory } from './services/history';
import { fetchAutoMixTracks } from './services/autoMix';
import { logger } from './services/logger';

export function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [activeTab, setActiveTab] = useState<'home' | 'search' | 'history' | 'servers' | 'logs' | 'about'>('home');
  const [isConnected, setIsConnected] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isQueueOpen, setIsQueueOpen] = useState(false);
  const [isLyricsOpen, setIsLyricsOpen] = useState(false);
  const [playerCurrentTime, setPlayerCurrentTime] = useState(0);
  const [seekTimeRequested, setSeekTimeRequested] = useState<number | null>(null);
  const [isAutoMix, setIsAutoMix] = useState(true);
  const [isAutoMixLoading, setIsAutoMixLoading] = useState(false);
  const isAutoMixFetchingRef = useRef(false);
  const [currentConfig, setCurrentConfig] = useState<LavalinkConfig>(lavalinkService.getConfig());

  // Search & Track states
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [isSearching, setIsSearching] = useState(false);

  // Player states
  const [currentTrack, setCurrentTrack] = useState<Track | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [queue, setQueue] = useState<Track[]>([]);

  // File Input & Drag and Drop state
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragOver, setIsDragOver] = useState(false);

  // History state
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>([]);

  // Initialize Lavalink & Load History
  useEffect(() => {
    setHistoryItems(getListeningHistory());

    lavalinkService.onStatusChange((status) => {
      setIsConnected(status);
    });
  }, []);

  // Handle Splash Screen Completion
  const handleSplashComplete = (bestServer?: LavalinkServerPreset) => {
    if (bestServer) {
      logger.addLog('success', 'System', `Splash sequence complete. Connecting to ${bestServer.name}`);
      lavalinkService.updateConfig(bestServer);
      setCurrentConfig(bestServer);
      lavalinkService.testConnection().then((res) => {
        setIsConnected(res.success);
      });
    } else {
      logger.addLog('info', 'System', 'Splash sequence complete. No preset server chosen.');
      const existing = lavalinkService.getConfig();
      setCurrentConfig(existing);
      if (existing.host) {
        lavalinkService.testConnection().then((res) => {
          setIsConnected(res.success);
        });
      }
    }
    setShowSplash(false);
  };

  // Local MP3 File Import Handlers
  const handleOpenLocalFiles = () => {
    fileInputRef.current?.click();
  };

  const handleImportLocalFiles = (files: FileList | File[]) => {
    const audioFiles = Array.from(files).filter(file =>
      file.type.startsWith('audio/') ||
      /\.(mp3|wav|ogg|flac|m4a|aac|opus|webm)$/i.test(file.name)
    );

    if (audioFiles.length === 0) {
      logger.addLog('warn', 'System', 'No valid audio files selected.');
      return;
    }

    const newTracks: Track[] = audioFiles.map(file => ({
      identifier: `local-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      title: file.name.replace(/\.[^/.]+$/, ''),
      author: 'ไฟล์ในเครื่อง (Local MP3)',
      length: 0,
      isSeekable: true,
      position: 0,
      uri: URL.createObjectURL(file),
      isStream: false,
      sourceName: 'local',
      artworkUrl: '/app-logo.png',
    }));

    logger.addLog('info', 'System', `Imported ${newTracks.length} local audio file(s).`);

    const firstTrack = newTracks[0];
    const remaining = newTracks.slice(1);

    handlePlayTrack(firstTrack);

    if (remaining.length > 0) {
      setQueue(prev => [...prev, ...remaining]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleImportLocalFiles(e.dataTransfer.files);
    }
  };

  // Perform search query
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    setActiveTab('search');
    setIsSearching(true);
    logger.addLog('info', 'System', `User initiated search for: "${query}"`);

    try {
      const results = await lavalinkService.search(query);
      setSearchResults(results);
    } catch (err: any) {
      logger.addLog('error', 'System', `Search failed: ${err.message}`);
    } finally {
      setIsSearching(false);
    }
  };

  // Trigger Auto Mix queue generation (Apple Music style Autoplay)
  const triggerAutoMix = useCallback(async (seedTrack: Track, baseQueue: Track[], autoPlayIfEmpty: boolean = false) => {
    if (isAutoMixFetchingRef.current) return;
    isAutoMixFetchingRef.current = true;
    setIsAutoMixLoading(true);

    try {
      const recs = await fetchAutoMixTracks(seedTrack, baseQueue, 8);
      if (recs.length > 0) {
        if (autoPlayIfEmpty) {
          const nextTrack = recs[0];
          const remaining = recs.slice(1);
          setQueue((prevQueue) => {
            const existingIds = new Set([seedTrack.identifier, nextTrack.identifier, ...prevQueue.map(q => q.identifier)]);
            const newTracks = remaining.filter(r => !existingIds.has(r.identifier));
            return [...prevQueue, ...newTracks];
          });
          handlePlayTrack(nextTrack, true);
        } else {
          setQueue((prevQueue) => {
            const existingIds = new Set([seedTrack.identifier, ...prevQueue.map(q => q.identifier)]);
            const newTracks = recs.filter(r => !existingIds.has(r.identifier));
            return [...prevQueue, ...newTracks];
          });
        }
      }
    } catch (err: any) {
      logger.addLog('warn', 'AutoMix', `Auto Mix generation error: ${err.message}`);
    } finally {
      isAutoMixFetchingRef.current = false;
      setIsAutoMixLoading(false);
    }
  }, []);

  // Play track action
  const handlePlayTrack = (track: Track, fromQueue: boolean = false) => {
    logger.addLog('info', 'System', `User selected track to play: "${track.title}" (${track.author})`);
    setCurrentTrack(track);
    setIsPlaying(true);

    // Save to Listening History
    const updatedHistory = addToListeningHistory(track);
    setHistoryItems(updatedHistory);

    // Apple Music style auto find next / autoplay
    if (isAutoMix) {
      if (fromQueue) {
        const trackIdx = queue.findIndex(t => t.identifier === track.identifier);
        let remaining = queue;
        if (trackIdx >= 0) {
          remaining = queue.slice(trackIdx + 1);
          setQueue(remaining);
        }
        if (remaining.length < 3) {
          triggerAutoMix(track, remaining);
        }
      } else {
        // Reset queue & immediately generate new playlist recommendations for this song
        setQueue([]);
        triggerAutoMix(track, []);
      }
    }
  };

  // Play/Pause toggle
  const handlePlayPauseToggle = () => {
    if (!currentTrack && searchResults.length > 0) {
      handlePlayTrack(searchResults[0]);
      return;
    }
    setIsPlaying(!isPlaying);
  };

  // Toggle Auto Mix mode
  const handleToggleAutoMix = () => {
    const nextState = !isAutoMix;
    setIsAutoMix(nextState);
    if (nextState && currentTrack && queue.length < 3) {
      triggerAutoMix(currentTrack, queue);
    }
  };

  // Next Track with Auto Mix support
  const handleNextTrack = async () => {
    if (queue.length > 0) {
      const nextTrack = queue[0];
      const remaining = queue.slice(1);
      setQueue(remaining);
      handlePlayTrack(nextTrack, true);
    } else if (currentTrack && isAutoMix) {
      triggerAutoMix(currentTrack, [], true);
    } else if (searchResults.length > 0 && currentTrack) {
      const idx = searchResults.findIndex(t => t.identifier === currentTrack.identifier);
      if (idx >= 0 && idx < searchResults.length - 1) {
        handlePlayTrack(searchResults[idx + 1]);
      }
    }
  };

  // Previous Track
  const handlePreviousTrack = () => {
    if (searchResults.length > 0 && currentTrack) {
      const idx = searchResults.findIndex(t => t.identifier === currentTrack.identifier);
      if (idx > 0) {
        handlePlayTrack(searchResults[idx - 1]);
      }
    }
  };

  // Queue actions
  const handleAddToQueue = (track: Track) => {
    logger.addLog('info', 'System', `Added to queue: "${track.title}"`);
    setQueue([...queue, track]);
  };

  const handleRemoveFromQueue = (index: number) => {
    setQueue(queue.filter((_, idx) => idx !== index));
  };

  const handleClearQueue = () => {
    setQueue([]);
  };

  // Clear History
  const handleClearHistory = () => {
    clearListeningHistory();
    setHistoryItems([]);
  };

  // Lavalink config save & test
  const handleSaveLavalinkConfig = (config: LavalinkConfig) => {
    lavalinkService.updateConfig(config);
    setCurrentConfig(config);
    lavalinkService.testConnection().then(res => setIsConnected(res.success));
  };

  const handleTestLavalink = () => {
    return lavalinkService.testConnection();
  };

  const recentlyPlayedTracks = historyItems.map(h => h.track);

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans relative"
    >
      {/* Hidden Local File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="audio/*,.mp3,.wav,.ogg,.flac,.m4a"
        multiple
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImportLocalFiles(e.target.files);
            e.target.value = '';
          }
        }}
      />

      {/* Drag & Drop Visual Indicator */}
      {isDragOver && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md border-4 border-dashed border-sky-500 flex flex-col items-center justify-center pointer-events-none animate-fade-in">
          <FolderOpen className="w-16 h-16 text-sky-400 animate-bounce mb-4" />
          <h2 className="text-2xl font-bold text-white">วางไฟล์ MP3 ที่นี่</h2>
          <p className="text-sky-300 text-sm mt-1">ปล่อยไฟล์เพื่อเล่นเพลงทันที และจัดเข้าคิวอัตโนมัติ</p>
        </div>
      )}

      {/* Overlay Splash Screen on top of main UI for seamless fade out without black screen */}
      {showSplash && <SplashScreen onComplete={handleSplashComplete} />}

      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openSettings={() => setIsSettingsOpen(true)}
        isConnected={isConnected}
        onOpenLocalFiles={handleOpenLocalFiles}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col h-screen overflow-hidden">
        <Header
          onSearchSubmit={handleSearch}
          isConnected={isConnected}
          onOpenLocalFiles={handleOpenLocalFiles}
        />

        <main className="flex-1 overflow-y-auto bg-gradient-to-b from-slate-900/50 via-slate-950 to-slate-950">
          <div key={activeTab} className="animate-page-enter h-full">
            {activeTab === 'home' && (
              <HomeView
                onPlayTrack={handlePlayTrack}
                onSearchQuery={handleSearch}
                recentlyPlayed={recentlyPlayedTracks}
                onOpenLocalFiles={handleOpenLocalFiles}
              />
            )}

            {activeTab === 'search' && (
              <SearchView
                searchResults={searchResults}
                isLoading={isSearching}
                onPlayTrack={handlePlayTrack}
                onAddToQueue={handleAddToQueue}
                query={searchQuery}
              />
            )}

            {activeTab === 'history' && (
              <HistoryView
                historyItems={historyItems}
                onPlayTrack={handlePlayTrack}
                onClearHistory={handleClearHistory}
              />
            )}

            {activeTab === 'servers' && (
              <ServerStatusView
                currentConfig={currentConfig}
                onSelectServer={handleSaveLavalinkConfig}
              />
            )}

            {activeTab === 'logs' && (
              <ConsoleLogView />
            )}

            {activeTab === 'about' && (
              <AboutView />
            )}
          </div>
        </main>

        {/* Audio Player Bar */}
        <Player
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          onPlayPauseToggle={handlePlayPauseToggle}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
          onTrackEnd={handleNextTrack}
          queue={queue}
          onToggleQueue={() => setIsQueueOpen(!isQueueOpen)}
          isAutoMix={isAutoMix}
          isAutoMixLoading={isAutoMixLoading}
          onToggleAutoMix={handleToggleAutoMix}
          onToggleLyrics={() => setIsLyricsOpen(!isLyricsOpen)}
          isLyricsOpen={isLyricsOpen}
          onTimeUpdate={(time) => setPlayerCurrentTime(time)}
          seekTime={seekTimeRequested}
        />
      </div>

      {/* Fullscreen Apple Music Player & Synced Karaoke Lyrics */}
      {isLyricsOpen && (
        <AppleMusicPlayerModal
          currentTrack={currentTrack}
          isPlaying={isPlaying}
          currentTime={playerCurrentTime}
          duration={currentTrack?.length ? currentTrack.length / 1000 : 180}
          isAutoMix={isAutoMix}
          isAutoMixLoading={isAutoMixLoading}
          onPlayPauseToggle={handlePlayPauseToggle}
          onNext={handleNextTrack}
          onPrevious={handlePreviousTrack}
          onSeek={(time) => {
            setSeekTimeRequested(time);
            setPlayerCurrentTime(time);
            setTimeout(() => setSeekTimeRequested(null), 100);
          }}
          onToggleAutoMix={handleToggleAutoMix}
          onClose={() => setIsLyricsOpen(false)}
        />
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <SettingsModal
          config={currentConfig}
          onSave={handleSaveLavalinkConfig}
          onClose={() => setIsSettingsOpen(false)}
          onTest={handleTestLavalink}
        />
      )}

      {/* Queue Drawer */}
      {isQueueOpen && (
        <QueueDrawer
          queue={queue}
          currentTrack={currentTrack}
          isAutoMix={isAutoMix}
          isAutoMixLoading={isAutoMixLoading}
          onPlayTrack={(track) => handlePlayTrack(track, true)}
          onRemoveFromQueue={handleRemoveFromQueue}
          onClearQueue={handleClearQueue}
          onClose={() => setIsQueueOpen(false)}
        />
      )}
    </div>
  );
}

export default App;
