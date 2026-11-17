export interface YTPlayerInstance {
  loadVideoById: (videoId: string) => void;
  cueVideoById: (videoId: string) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  setVolume: (volume: number) => void;
  getVolume: () => number;
  mute: () => void;
  unMute: () => void;
  isMuted: () => boolean;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  destroy: () => void;
}

export interface YTNamespace {
  Player: new (
    elementId: string | HTMLElement,
    options: {
      height?: string | number;
      width?: string | number;
      videoId?: string;
      playerVars?: Record<string, string | number>;
      events?: {
        onReady?: (event: { target: YTPlayerInstance }) => void;
        onStateChange?: (event: { data: number; target: YTPlayerInstance }) => void;
        onError?: (event: { data: number; target: YTPlayerInstance }) => void;
      };
    }
  ) => YTPlayerInstance;
  PlayerState: {
    UNSTARTED: -1;
    ENDED: 0;
    PLAYING: 1;
    PAUSED: 2;
    BUFFERING: 3;
    CUED: 5;
  };
}

declare global {
  interface Window {
    YT?: YTNamespace;
    onYouTubeIframeAPIReady?: () => void;
  }
}

let apiPromise: Promise<YTNamespace> | null = null;

/**
 * Loads the official YouTube IFrame Player API once per page lifecycle.
 * Strictly uses YouTube's official embed API (no video downloading or stream scraping).
 */
export function loadYouTubeIframeAPI(): Promise<YTNamespace> {
  if (typeof window === 'undefined') {
    return Promise.reject(new Error('YouTube IFrame API requires a browser environment.'));
  }

  if (window.YT && typeof window.YT.Player === 'function') {
    return Promise.resolve(window.YT);
  }

  if (apiPromise) {
    return apiPromise;
  }

  apiPromise = new Promise<YTNamespace>((resolve, reject) => {
    const prevReady = window.onYouTubeIframeAPIReady;
    const timeoutId = window.setTimeout(() => {
      reject(new Error('YouTube IFrame Player API tidak merespons (periksa koneksi atau pemblokir iklan).'));
    }, 12000);

    window.onYouTubeIframeAPIReady = () => {
      window.clearTimeout(timeoutId);
      if (typeof prevReady === 'function') {
        try {
          prevReady();
        } catch {
          // Ignore prior callback error
        }
      }
      if (window.YT && typeof window.YT.Player === 'function') {
        resolve(window.YT);
      } else {
        reject(new Error('YouTube Player API gagal diinisialisasi.'));
      }
    };

    const existingScript = document.querySelector(
      'script[src="https://www.youtube.com/iframe_api"]'
    );
    if (!existingScript) {
      const script = document.createElement('script');
      script.src = 'https://www.youtube.com/iframe_api';
      script.async = true;
      script.onerror = () => {
        window.clearTimeout(timeoutId);
        apiPromise = null;
        reject(new Error('Gagal memuat skrip resmi YouTube IFrame Player API.'));
      };
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}

export function describeYouTubeErrorCode(code: number): string {
  switch (code) {
    case 2:
      return 'Parameter video YouTube tidak valid.';
    case 5:
      return 'Pemutar HTML5 mengalami kendala saat memutar video ini.';
    case 100:
      return 'Video ini telah dihapus atau bersifat privat di YouTube.';
    case 101:
    case 150:
      return 'Pemilik video menonaktifkan pemutaran tersemat (embed) untuk video ini.';
    default:
      return 'Video YouTube sedang tidak dapat diputar saat ini.';
  }
}
