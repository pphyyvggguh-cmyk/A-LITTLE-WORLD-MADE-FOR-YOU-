export const MAX_FIRESTORE_BLOB_BYTES = 640 * 1024; // 640 KB binary -> ~854 KB base64 (< 920 KB rules cap)

export type AllowedBlobMime =
  | 'image/jpeg'
  | 'image/png'
  | 'image/webp'
  | 'audio/mpeg'
  | 'audio/ogg';

export function arrayBufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

export function normalizeBlobImageMime(rawMime: string, filename: string): AllowedBlobMime | null {
  const lowerMime = String(rawMime || '').split(';')[0].trim().toLowerCase();
  const lowerName = String(filename || '').trim().toLowerCase();
  if (lowerMime === 'image/jpeg' || lowerMime === 'image/jpg' || lowerMime === 'image/pjpeg') {
    return 'image/jpeg';
  }
  if (lowerMime === 'image/png') return 'image/png';
  if (lowerMime === 'image/webp') return 'image/webp';
  if (lowerName.endsWith('.jpg') || lowerName.endsWith('.jpeg')) return 'image/jpeg';
  if (lowerName.endsWith('.png')) return 'image/png';
  if (lowerName.endsWith('.webp')) return 'image/webp';
  return null;
}

export function extractMediaBlobRef(url: string): { id: string; isPrivate: boolean } | null {
  const raw = String(url || '').trim();
  if (!raw.startsWith('/api/media')) return null;
  try {
    const parsed = new URL(raw, 'https://example.local');
    if (parsed.pathname !== '/api/media') return null;
    const id = parsed.searchParams.get('id') || '';
    if (!/^[a-zA-Z0-9_-]{1,128}$/.test(id)) return null;
    const isPrivate = parsed.searchParams.get('private') === '1';
    return { id, isPrivate };
  } catch {
    return null;
  }
}

export function isLegacyEphemeralUploadUrl(url: string): boolean {
  return String(url || '').trim().startsWith('/assets/uploads/');
}

function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const objectUrl = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(objectUrl);
      resolve(img);
    };
    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error('File gambar tidak dapat dibaca. Coba pilih file JPG/PNG/WEBP lain.'));
    };
    img.src = objectUrl;
  });
}

function canvasToBlob(
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality: number
): Promise<Blob | null> {
  return new Promise((resolve) => {
    canvas.toBlob((blob) => resolve(blob), mimeType, quality);
  });
}

export interface PreparedFirestoreMediaBlob {
  base64: string;
  mimeType: AllowedBlobMime;
  sizeBytes: number;
  filename: string;
}

export async function prepareImageForFirestoreBlob(
  file: File,
  maxBytes: number = MAX_FIRESTORE_BLOB_BYTES
): Promise<PreparedFirestoreMediaBlob> {
  const detectedMime = normalizeBlobImageMime(file.type, file.name);
  if (!detectedMime) {
    throw new Error('Format gambar harus JPG, JPEG, PNG, atau WEBP.');
  }

  // If already compact enough, keep exact original bytes with zero recompression loss
  if (file.size > 0 && file.size <= maxBytes) {
    const buf = await file.arrayBuffer();
    return {
      base64: arrayBufferToBase64(buf),
      mimeType: detectedMime,
      sizeBytes: buf.byteLength,
      filename: file.name || 'image.jpg',
    };
  }

  if (typeof document === 'undefined' || typeof URL === 'undefined' || !URL.createObjectURL) {
    throw new Error('Ukuran gambar terlalu besar untuk mode non-browser.');
  }

  const img = await loadImageFromFile(file);
  const srcWidth = Math.max(1, img.naturalWidth || img.width);
  const srcHeight = Math.max(1, img.naturalHeight || img.height);

  const dimensionCaps = [1600, 1280, 1024, 800];
  const outputMimes: Array<'image/webp' | 'image/jpeg'> =
    detectedMime === 'image/png'
      ? ['image/webp', 'image/jpeg']
      : [detectedMime === 'image/webp' ? 'image/webp' : 'image/jpeg', 'image/jpeg'];
  const qualities = [0.88, 0.78, 0.68, 0.56, 0.46];

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Browser tidak mendukung pemrosesan kanvas untuk optimasi foto.');
  }

  for (const maxEdge of dimensionCaps) {
    const scale = Math.min(1, maxEdge / Math.max(srcWidth, srcHeight));
    const targetW = Math.max(1, Math.round(srcWidth * scale));
    const targetH = Math.max(1, Math.round(srcHeight * scale));
    canvas.width = targetW;
    canvas.height = targetH;
    ctx.clearRect(0, 0, targetW, targetH);
    ctx.drawImage(img, 0, 0, targetW, targetH);

    for (const outMime of outputMimes) {
      for (const quality of qualities) {
        const blob = await canvasToBlob(canvas, outMime, quality);
        if (blob && blob.size > 0 && blob.size <= maxBytes) {
          const buf = await blob.arrayBuffer();
          const baseName = (file.name || 'photo').replace(/\.[^.]+$/, '');
          const ext = outMime === 'image/webp' ? '.webp' : '.jpg';
          return {
            base64: arrayBufferToBase64(buf),
            mimeType: outMime,
            sizeBytes: buf.byteLength,
            filename: `${baseName}${ext}`,
          };
        }
      }
    }
  }

  throw new Error(
    'Ukuran foto masih terlalu besar setelah dikompresi. Pilih foto di bawah 15 MB atau potong sedikit terlebih dahulu.'
  );
}
