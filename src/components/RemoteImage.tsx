import { useEffect, useRef, useState, type ImgHTMLAttributes } from 'react';
import { flipProtocol } from '../services/imageUrl';
import { loadImageNative } from '../services/imageLoader';

export const FALLBACK_IMAGE = '/brand/xiptvplay-icon.svg';

interface Props extends Omit<ImgHTMLAttributes<HTMLImageElement>, 'src' | 'onError'> {
  /** Ana görsel adresi. */
  src?: string | null;
  /** Ana adres yüklenmezse sırayla denenecek diğer adresler (cover, backdrop, TMDB vb.). */
  fallbacks?: Array<string | null | undefined>;
  /** Hiçbiri yüklenmezse gösterilecek görsel. */
  placeholder?: string;
}

/**
 * Sağlayıcı görselleri için dayanıklı <img>:
 *  1) Referer göndermeden doğrudan yükler,
 *  2) olmazsa karşı protokolü (http<->https) dener,
 *  3) olmazsa Android'de native HTTP istemcisiyle çekip data URL olarak gösterir,
 *  4) olmazsa sıradaki yedek adrese geçer, en sonda yer tutucuyu gösterir.
 */
export function RemoteImage({ src, fallbacks = [], placeholder = FALLBACK_IMAGE, ...rest }: Props) {
  const candidates = [src, ...fallbacks].filter((value, index, all): value is string =>
    Boolean(value) && all.indexOf(value) === index);
  const key = candidates.join('\n');
  const [state, setState] = useState({ index: 0, step: 0, shown: candidates[0] || placeholder });
  const latest = useRef(key);

  useEffect(() => {
    latest.current = key;
    setState({ index: 0, step: 0, shown: candidates[0] || placeholder });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, placeholder]);

  const advance = (index: number) => {
    const next = candidates[index + 1];
    setState({ index: index + 1, step: 0, shown: next || placeholder });
  };

  const handleError = async () => {
    const { index, step } = state;
    const current = candidates[index];
    if (!current || state.shown === placeholder) return;
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
    advance(index);
  };

  return <img {...rest} src={state.shown} referrerPolicy="no-referrer" onError={handleError}
    loading={rest.loading ?? 'lazy'} decoding={rest.decoding ?? 'async'} alt={rest.alt ?? ''} />;
}
