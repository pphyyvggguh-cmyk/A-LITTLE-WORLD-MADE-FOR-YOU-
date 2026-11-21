import { ImgHTMLAttributes, useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { ImageOff } from 'lucide-react';
import { db } from '../lib/firebase';
import { extractMediaBlobRef } from '../utils/imageOptimizer';

const privateBlobUrlCache = new Map<string, string>();

interface CloudMediaImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  src: string;
}

export function CloudMediaImg({ src, onError, className = '', alt, ...rest }: CloudMediaImgProps) {
  const blobRef = extractMediaBlobRef(src);
  const needsPrivateFetch = Boolean(blobRef?.isPrivate);

  const [resolvedSrc, setResolvedSrc] = useState<string>(() => {
    if (!needsPrivateFetch || !blobRef) return src;
    return privateBlobUrlCache.get(blobRef.id) || '';
  });
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    setFailed(false);

    if (!needsPrivateFetch || !blobRef) {
      setResolvedSrc(src);
      return;
    }

    const cached = privateBlobUrlCache.get(blobRef.id);
    if (cached) {
      setResolvedSrc(cached);
      return;
    }

    setResolvedSrc('');
    let cancelled = false;
    getDoc(doc(db, 'mediaBlobs', blobRef.id))
      .then((snap) => {
        if (cancelled) return;
        if (!snap.exists()) {
          setFailed(true);
          return;
        }
        const data = snap.data();
        const mimeType = String(data?.mimeType || 'image/jpeg');
        const b64 = String(data?.dataBase64 || '');
        if (!b64) {
          setFailed(true);
          return;
        }
        const dataUri = `data:${mimeType};base64,${b64}`;
        privateBlobUrlCache.set(blobRef.id, dataUri);
        setResolvedSrc(dataUri);
      })
      .catch(() => {
        if (!cancelled) setFailed(true);
      });

    return () => {
      cancelled = true;
    };
  }, [src, needsPrivateFetch, blobRef?.id]);

  if (failed || (needsPrivateFetch && !resolvedSrc && !blobRef)) {
    return (
      <div
        role="img"
        aria-label={alt || 'Foto tidak tersedia'}
        className={`flex items-center justify-center bg-[#EAE0CF] text-[#38271F]/55 ${className}`}
      >
        <ImageOff className="w-5 h-5" />
      </div>
    );
  }

  if (needsPrivateFetch && !resolvedSrc) {
    return (
      <div
        aria-label={alt || 'Memuat foto...'}
        className={`animate-pulse bg-[#EAE0CF] ${className}`}
      />
    );
  }

  return (
    <img
      src={resolvedSrc}
      alt={alt}
      className={className}
      onError={(e) => {
        setFailed(true);
        onError?.(e);
      }}
      {...rest}
    />
  );
}
