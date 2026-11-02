/**
 * Xtream / M3U sağlayıcıları görsel alanlarını çok farklı biçimlerde döndürür:
 * boş string, "null", `\/` kaçışlı, `//host/...` , göreli yol (`/images/x.jpg`),
 * boşluklu URL, dizi (backdrop_path) vb. Bu yardımcılar bunları tek tip, yüklenebilir
 * bir http(s) adresine çevirir.
 */

const EMPTY_VALUES = new Set(['', 'null', 'undefined', 'false', 'n/a', '0']);

/** Tek bir ham değeri geçerli bir http(s) görsel adresine çevirir; olmazsa undefined. */
export function normalizeImageUrl(raw: unknown, baseHost?: string): string | undefined {
  if (Array.isArray(raw)) {
    for (const entry of raw) {
      const found = normalizeImageUrl(entry, baseHost);
      if (found) return found;
    }
    return undefined;
  }
  if (typeof raw !== 'string') return undefined;
  let value = raw.trim().replace(/\\\//g, '/').replace(/\\/g, '/');
  if (EMPTY_VALUES.has(value.toLowerCase())) return undefined;
  if (value.startsWith('data:image/')) return value;
  if (value.startsWith('//')) value = `http:${value}`;
  if (!/^https?:\/\//i.test(value)) {
    if (!baseHost) return undefined;
    // Göreli yol: sağlayıcının kendi adresine göre çöz.
    const base = baseHost.replace(/\/+$/, '');
    value = value.startsWith('/') ? `${base}${value}` : `${base}/${value}`;
  }
  try {
    // Boşluk, Türkçe karakter vb. için güvenli kodlama (zaten kodlanmışsa bozmaz).
    return new URL(value).toString();
  } catch {
    return undefined;
  }
}

/** Adayların ilk geçerli olanını döndürür. */
export function pickImage(baseHost: string | undefined, ...candidates: unknown[]): string | undefined {
  for (const candidate of candidates) {
    const found = normalizeImageUrl(candidate, baseHost);
    if (found) return found;
  }
  return undefined;
}

/** http <-> https karşı protokol adresi (sağlayıcı yalnız birini sunuyorsa). */
export function flipProtocol(url: string): string | undefined {
  if (/^http:\/\//i.test(url)) return url.replace(/^http:/i, 'https:');
  if (/^https:\/\//i.test(url)) return url.replace(/^https:/i, 'http:');
  return undefined;
}
