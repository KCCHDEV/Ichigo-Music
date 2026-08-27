import { fetch as tauriFetch } from '@tauri-apps/plugin-http';
import { logger } from './logger';

export async function customFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const urlStr = typeof input === 'string' ? input : input instanceof URL ? input.toString() : (input as Request).url;
  logger.addLog('info', 'HTTP', `Requesting: ${urlStr}`);

  try {
    const res = await tauriFetch(input as any, init as any);
    logger.addLog('success', 'HTTP', `Response [${res.status}] from ${urlStr}`);
    return res;
  } catch (err: any) {
    logger.addLog('warn', 'HTTP', `Tauri native fetch failed for ${urlStr}: ${err.message}. Trying browser fetch...`);
    try {
      const res = await window.fetch(input, init);
      logger.addLog('success', 'HTTP', `Browser fetch Response [${res.status}] from ${urlStr}`);
      return res;
    } catch (browserErr: any) {
      logger.addLog('error', 'HTTP', `Fetch failed completely for ${urlStr}: ${browserErr.message}`);
      throw browserErr;
    }
  }
}
