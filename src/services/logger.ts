export interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'success' | 'warn' | 'error';
  source: 'Lavalink' | 'Player' | 'HTTP' | 'System' | 'AutoMix';
  message: string;
  details?: any;
}

class LoggerService {
  private logs: LogEntry[] = [];
  private listeners: Array<(logs: LogEntry[]) => void> = [];

  constructor() {
    this.addLog('info', 'System', 'Ichigo Music Logger initialized');
  }

  public addLog(
    level: 'info' | 'success' | 'warn' | 'error',
    source: 'Lavalink' | 'Player' | 'HTTP' | 'System' | 'AutoMix',
    message: string,
    details?: any
  ) {
    const time = new Date().toLocaleTimeString('th-TH', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });

    const entry: LogEntry = {
      id: `${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      timestamp: time,
      level,
      source,
      message,
      details,
    };

    this.logs = [entry, ...this.logs].slice(0, 300); // Keep last 300 logs
    this.notify();

    // Also output to console
    const prefix = `[${time}] [${source}] [${level.toUpperCase()}]`;
    if (level === 'error') console.error(prefix, message, details || '');
    else if (level === 'warn') console.warn(prefix, message, details || '');
    else console.log(prefix, message, details || '');
  }

  public getLogs(): LogEntry[] {
    return this.logs;
  }

  public clearLogs() {
    this.logs = [];
    this.addLog('info', 'System', 'Logs cleared');
  }

  public subscribe(cb: (logs: LogEntry[]) => void) {
    this.listeners.push(cb);
    cb(this.logs);
    return () => {
      this.listeners = this.listeners.filter(l => l !== cb);
    };
  }

  private notify() {
    this.listeners.forEach(cb => cb(this.logs));
  }
}

export const logger = new LoggerService();
