import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { flipProtocol } from '../services/imageUrl';
import { loadImageNative } from '../services/imageLoader';

export const FALLBACK_IMAGE = '/brand/xiptvplay-icon.svg';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** Ana görsel adresi. */
  src?: string | null;
  /** Ana adres yüklenmezse sırayla denenecek diğer adresler (cover, backdrop vb.). */
  fallbacks?: Array<string | null | undefined>;
  /** Hiçbiri yoksa / yüklenmezse en son denenecek kaynak (ör. TMDB). Bir kez çağrılır. */
  lateFallback?: () => Promise<string | null | undefined>;
  /** Hiçbiri yüklenmezse gösterilecek görsel. */
  placeholder?: string;
}

/**
 * Sağlayıcı görselleri için dayanıklı <img>:
 *  1) Referer göndermeden doğrudan yükler,
 *  2) olmazsa karşı protokolü (http<->https) dener,
 *  3) olmazsa Android'de native HTTP istemcisiyle çekip data URL olarak gösterir,
 *  4) olmazsa sıradaki yedek adrese, en sonda lateFallback'e (TMDB) geçer,
 *  5) hiçbiri olmazsa yer tutucuyu gösterir.
 */
export function RemoteImage({ src, fallbacks = [], lateFallback, placeholder = FALLBACK_IMAGE, ...rest }: Props) {
  const candidates = [src, ...fallbacks].filter((value, index, all): value is string =>
    Boolean(value) && all.indexOf(value) === index && value !== placeholder);
  const key = candidates.join('\n');
  const [state, setState] = useState({ index: 0, step: 0, shown: candidates[0] || placeholder });
  const latest = useRef(key);
  const lateTried = useRef(false);
  const late = useRef(lateFallback);
  late.current = lateFallback;

  const runLate = async () => {
    if (lateTried.current || !late.current) { setState(s => ({ ...s, shown: placeholder })); return; }
    lateTried.current = true;
    const startKey = latest.current;
    let url: string | null | undefined;
    try { url = await late.current(); } catch { url = undefined; }
    if (latest.current !== startKey) return;
    setState({ index: candidates.length, step: 3, shown: url || placeholder });
  };

  useEffect(() => {
    latest.current = key;
    lateTried.current = false;
    setState({ index: 0, step: 0, shown: candidates[0] || placeholder });
    if (!candidates.length) void runLate();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, placeholder]);

  const handleError = async () => {
    const { index, step } = state;
    const current = candidates[index];
    if (!current) { if (state.shown !== placeholder) setState(s => ({ ...s, shown: placeholder })); return; }
    if (step === 0) {
      const flipped = flipProtocol(current);
      if (flipped) { setState({ index, step: 1, shown: flipped }); return; }
    }
    if (step <= 1) {
      setState(s => ({ ...s, step: 2 }));
      const dataUrl = await loadImageNative(current);
      if (latest.current !== key) return;
      if (dataUrl) { setState({ index, step: 3, shown: dataUrl }); return; }
    }
    const next = candidates[index + 1];
    if (next) setState({ index: index + 1, step: 0, shown: next });
    else void runLate();
  };

  return <img {...rest} src={state.shown} referrerPolicy="no-referrer" onError={handleError}
    loading={rest.loading ?? 'lazy'} decoding={rest.decoding ?? 'async'} alt={rest.alt ?? ''} />;
}
