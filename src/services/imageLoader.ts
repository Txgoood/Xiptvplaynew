import { CapacitorHttp } from '@capacitor/core';
import { IPTV_UA, isNative } from './net';

/**
 * Bazı IPTV görsel sunucuları WebView'ın <img> isteğini (Referer: http://localhost,
 * Chrome User-Agent) reddeder; diğer IPTV uygulamaları ise kendi native istemcisiyle çeker.
 * Bu yükleyici, <img> doğrudan yüklenemediğinde görseli Android'in native HTTP
 * istemcisiyle (IPTV User-Agent, Referer yok) çekip data URL'e çevirir.
 */

const MAX_CACHE = 200;
const MAX_CONCURRENT = 4;
const cache = new Map<string, string>();
const failed = new Set<string>();
const inflight = new Map<string, Promise<string | null>>();
const queue: Array<() => void> = [];
let active = 0;

function schedule<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active++;
      task().then(resolve, reject).finally(() => {
        active--;
        queue.shift()?.();
      });
    };
    if (active < MAX_CONCURRENT) run(); else queue.push(run);
  });
}

function remember(url: string, dataUrl: string) {
  if (cache.size >= MAX_CACHE) {
    const oldest = cache.keys().next().value;
    if (oldest !== undefined) cache.delete(oldest);
  }
  cache.set(url, dataUrl);
}

function guessMime(url: string, header?: string): string {
  const fromHeader = header?.split(';')[0].trim().toLowerCase();
  if (fromHeader && fromHeader.startsWith('image/')) return fromHeader;
  const ext = url.split('?')[0].split('.').pop()?.toLowerCase();
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'svg') return 'image/svg+xml';
  return 'image/jpeg';
}

/** Native HTTP ile görseli çekip data URL döndürür; başarısızsa null. Sadece Android'de çalışır. */
export function loadImageNative(url: string): Promise<string | null> {
  if (!isNative() || !/^https?:\/\//i.test(url)) return Promise.resolve(null);
  const hit = cache.get(url);
  if (hit) return Promise.resolve(hit);
  if (failed.has(url)) return Promise.resolve(null);
  const pending = inflight.get(url);
  if (pending) return pending;

  const job = schedule(async () => {
    try {
      const response = await CapacitorHttp.get({
        url,
        headers: { 'User-Agent': IPTV_UA, Accept: 'image/*,*/*' },
        responseType: 'blob', // Capacitor: gövde base64 string olarak gelir
        readTimeout: 20000,
        connectTimeout: 10000,
      });
      const data = response.data;
      if (response.status < 200 || response.status >= 300 || typeof data !== 'string' || data.length < 100) {
        failed.add(url);
        return null;
      }
      const mime = guessMime(url, response.headers?.['Content-Type'] || response.headers?.['content-type']);
      const dataUrl = `data:${mime};base64,${data}`;
      remember(url, dataUrl);
      return dataUrl;
    } catch {
      failed.add(url);
      return null;
    } finally {
      inflight.delete(url);
    }
  });
  inflight.set(url, job);
  return job;
}
