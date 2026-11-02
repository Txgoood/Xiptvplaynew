import type { MediaItem } from '../types';
import { getTmdbDetails } from './tmdbClient';

/**
 * Sağlayıcının görseli yoksa / yüklenemiyorsa TMDB'den poster veya arka plan getirir.
 * Liste ekranlarında çok sayıda kart aynı anda isteyebileceği için istekler sınırlandırılır,
 * başarılı ve başarısız sonuçlar bellekte ve localStorage'da önbelleğe alınır.
 */
type Kind = 'poster' | 'backdrop';
const MISS_KEY = 'xiptvplay_tmdb_img_miss_v1';
const MISS_TTL = 3 * 86400000;
const MAX_CONCURRENT = 2;
const found = new Map<string, string>();
const running = new Map<string, Promise<string | undefined>>();
const queue: Array<() => void> = [];
let active = 0;
let misses: Record<string, number> | undefined;

function readMisses(): Record<string, number> {
  if (!misses) { try { misses = JSON.parse(localStorage.getItem(MISS_KEY) || '{}') || {}; } catch { misses = {}; } }
  return misses!;
}
function addMiss(key: string) {
  const all = readMisses();
  all[key] = Date.now() + MISS_TTL;
  const entries = Object.entries(all).filter(([, until]) => until > Date.now()).slice(-300);
  misses = Object.fromEntries(entries);
  try { localStorage.setItem(MISS_KEY, JSON.stringify(misses)); } catch { /* depo doluysa bellekte kalır */ }
}
function isMissed(key: string) { const until = readMisses()[key]; return Boolean(until && until > Date.now()); }

function limited<T>(task: () => Promise<T>): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    const run = () => {
      active++;
      task().then(resolve, reject).finally(() => { active--; queue.shift()?.(); });
    };
    if (active < MAX_CONCURRENT) run(); else queue.push(run);
  });
}

export function tmdbImageFor(media: MediaItem, kind: Kind = 'poster'): Promise<string | undefined> {
  if (media.type === 'live') return Promise.resolve(undefined);
  const key = `${media.id}|${kind}`;
  const hit = found.get(key);
  if (hit) return Promise.resolve(hit);
  if (isMissed(key)) return Promise.resolve(undefined);
  let work = running.get(key);
  if (!work) {
    work = limited(async () => {
      try {
        const details = await getTmdbDetails(media);
        const url = (kind === 'backdrop' ? details.backdrop || details.poster : details.poster || details.backdrop) || undefined;
        if (url) found.set(key, url); else addMiss(key);
        return url;
      } catch {
        // Sunucu uyuyor / ağ yok: kalıcı "yok" yazmayız, sonraki açılışta tekrar denenir.
        return undefined;
      }
    }).finally(() => running.delete(key));
    running.set(key, work);
  }
  return work;
}
