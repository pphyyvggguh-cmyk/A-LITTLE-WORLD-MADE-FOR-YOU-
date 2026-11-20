import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ChevronDown,
  ChevronUp,
  Disc3,
  ListMusic,
  Pause,
  Play,
  SkipBack,
  SkipForward,
  Volume2,
  VolumeX,
  AlertCircle,
} from 'lucide-react';
import { VinylTrack } from '../../data/vinyl';
import { useContentStore } from '../../store/useContentStore';
import {
  formatPlayerClock,
  normalizeVinylOrder,
} from '../../utils/vinyl';
import {
  describeYouTubeErrorCode,
  loadYouTubeIframeAPI,
  YTPlayerInstance,
} from '../../utils/youtubePlayer';
import { formatSafeUiError } from '../../utils/safeError';

function VinylDiscArt({
  isPlaying,
  thumbnailUrl,
  sizeClass = 'w-11 h-11',
}: {
  isPlaying: boolean;
  thumbnailUrl?: string;
  sizeClass?: string;
}) {
  const [imgFailed, setImgFailed] = useState(false);

  useEffect(() => {
    setImgFailed(false);
  }, [thumbnailUrl]);

  return (
    <div
      className={`relative rounded-full shrink-0 shadow-md ${sizeClass} vinyl-disc-spin ${
        isPlaying ? 'vinyl-disc-running' : 'vinyl-disc-paused'
      }`}
      style={{
        background:
          'radial-gradient(circle, #38271F 0%, #38271F 26%, #1B1412 28%, #261C19 44%, #18110F 60%, #271D19 76%, #140E0C 92%, #38271F 100%)',
      }}
      aria-hidden="true"
    >
      {/* Subtle vinyl light sheen */}
      <span
        className="absolute inset-0 rounded-full pointer-events-none"
        style={{
          background:
            'conic-gradient(from 40deg, transparent 0deg, rgba(244,235,221,0.14) 36deg, transparent 78deg, transparent 180deg, rgba(196,165,116,0.12) 220deg, transparent 265deg)',
        }}
      />
      {/* Center artwork label */}
      <span className="absolute inset-[27%] rounded-full overflow-hidden border border-[#C4A574]/70 bg-[#A6533B] flex items-center justify-center">
        {thumbnailUrl && !imgFailed ? (
          <img
            src={thumbnailUrl}
            alt=""
            onError={() => setImgFailed(true)}
            className="w-full h-full object-cover opacity-85"
          />
        ) : (
          <span className="w-full h-full bg-gradient-to-br from-[#A6533B] to-[#743D4A]" />
        )}
      </span>
      {/* Gold spindle hole */}
      <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[13%] h-[13%] rounded-full bg-[#FBF6EE] border border-[#38271F] shadow-inner" />
    </div>
  );
}

export function VinylPlayer() {
  const vinylConfig = useContentStore((s) => s.vinylConfig);
  const rawPlaylist = useContentStore((s) => s.vinylPlaylist);

  const playlist: VinylTrack[] = useMemo(
    () => normalizeVinylOrder(rawPlaylist.filter((t) => t.isPublished)),
    [rawPlaylist]
  );

  const [expanded, setExpanded] = useState(false);
  const [showPlaylistDrawer, setShowPlaylistDrawer] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isBuffering, setIsBuffering] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(72);
  const [muted, setMuted] = useState(false);
  const [apiReady, setApiReady] = useState(false);
  const [playerError, setPlayerError] = useState('');
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  const playerRef = useRef<YTPlayerInstance | null>(null);
  const hostElRef = useRef<HTMLDivElement | null>(null);
  const pendingAutoplayRef = useRef(false);
  const activeTrackRef = useRef<VinylTrack | null>(null);
  const playlistRef = useRef<VinylTrack[]>(playlist);
  playlistRef.current = playlist;
  const activeIndexRef = useRef(activeIndex);
  activeIndexRef.current = activeIndex;

  // Keep activeIndex in bounds whenever playlist updates
  useEffect(() => {
    if (playlist.length === 0) {
      setActiveIndex(0);
      setIsPlaying(false);
      return;
    }
    if (activeIndex >= playlist.length) {
      setActiveIndex(0);
    }
  }, [playlist.length, activeIndex]);

  const currentTrack = playlist[activeIndex] ?? playlist[0] ?? null;
  activeTrackRef.current = currentTrack;

  const selectTrack = useCallback((index: number, autoPlay: boolean) => {
    const list = playlistRef.current;
    if (list.length === 0) return;
    const bounded = ((index % list.length) + list.length) % list.length;
    const track = list[bounded];
    setActiveIndex(bounded);
    setCurrentTime(0);
    setDuration(0);
    setPlayerError('');
    setAutoplayBlocked(false);

    const player = playerRef.current;
    if (player && track) {
      pendingAutoplayRef.current = autoPlay;
      if (autoPlay) {
        setIsBuffering(true);
        player.loadVideoById(track.youtubeVideoId);
      } else {
        setIsPlaying(false);
        player.cueVideoById(track.youtubeVideoId);
      }
    }
  }, []);

  const handleNext = useCallback(() => {
    if (playlistRef.current.length <= 1) return;
    selectTrack(activeIndexRef.current + 1, true);
  }, [selectTrack]);

  const handlePrev = useCallback(() => {
    if (playlistRef.current.length === 0) return;
    const player = playerRef.current;
    if (player && player.getCurrentTime() > 4) {
      player.seekTo(0, true);
      setCurrentTime(0);
      return;
    }
    selectTrack(activeIndexRef.current - 1, true);
  }, [selectTrack]);

  // Initialize YouTube IFrame API player once when enabled and at least one track exists
  useEffect(() => {
    if (!vinylConfig.enabled || playlist.length === 0) {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
        setApiReady(false);
        setIsPlaying(false);
      }
      return;
    }

    if (playerRef.current || !hostElRef.current) return;

    let cancelled = false;

    loadYouTubeIframeAPI()
      .then((YT) => {
        if (cancelled || !hostElRef.current || playerRef.current) return;
        const initialVideoId = activeTrackRef.current?.youtubeVideoId || playlist[0].youtubeVideoId;

        playerRef.current = new YT.Player(hostElRef.current, {
          height: '180',
          width: '320',
          videoId: initialVideoId,
          playerVars: {
            autoplay: 0,
            controls: 0,
            disablekb: 1,
            fs: 0,
            modestbranding: 1,
            playsinline: 1,
            rel: 0,
            origin: window.location.origin,
          },
          events: {
            onReady: (ev) => {
              if (cancelled) return;
              ev.target.setVolume(volume);
              setApiReady(true);
            },
            onStateChange: (ev) => {
              if (cancelled) return;
              const state = ev.data;
              if (state === YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setIsBuffering(false);
                setPlayerError('');
                setAutoplayBlocked(false);
                pendingAutoplayRef.current = false;
                const d = ev.target.getDuration();
                if (Number.isFinite(d) && d > 0) setDuration(d);
              } else if (state === YT.PlayerState.PAUSED || state === YT.PlayerState.CUED) {
                setIsPlaying(false);
                setIsBuffering(false);
                pendingAutoplayRef.current = false;
              } else if (state === YT.PlayerState.BUFFERING) {
                setIsBuffering(true);
              } else if (state === YT.PlayerState.ENDED) {
                setIsPlaying(false);
                setIsBuffering(false);
                if (playlistRef.current.length > 1) {
                  selectTrack(activeIndexRef.current + 1, true);
                } else {
                  setCurrentTime(0);
                }
              }
            },
            onError: (ev) => {
              if (cancelled) return;
              setIsPlaying(false);
              setIsBuffering(false);
              pendingAutoplayRef.current = false;
              setPlayerError(describeYouTubeErrorCode(ev.data));
            },
          },
        });
      })
      .catch((err) => {
        if (!cancelled) {
          setPlayerError(
            formatSafeUiError(
              err,
              'YouTube Player belum siap (periksa koneksi).',
              'public'
            )
          );
        }
      });

    return () => {
      cancelled = true;
    };
  }, [vinylConfig.enabled, playlist.length > 0, selectTrack]);

  // Cleanup player on unmount
  useEffect(() => {
    return () => {
      if (playerRef.current) {
        try {
          playerRef.current.destroy();
        } catch {
          // ignore
        }
        playerRef.current = null;
      }
    };
  }, []);

  // Poll progress every 500ms while playing
  useEffect(() => {
    if (!isPlaying) return;
    const timer = window.setInterval(() => {
      const player = playerRef.current;
      if (!player) return;
      try {
        const cur = player.getCurrentTime();
        const dur = player.getDuration();
        if (Number.isFinite(cur)) setCurrentTime(cur);
        if (Number.isFinite(dur) && dur > 0) setDuration(dur);
      } catch {
        // ignore transient player read errors
      }
    }, 500);
    return () => window.clearInterval(timer);
  }, [isPlaying]);

  const handleTogglePlay = () => {
    setPlayerError('');
    const player = playerRef.current;
    if (!player || !apiReady) {
      setAutoplayBlocked(true);
      return;
    }

    if (isPlaying) {
      player.pauseVideo();
      setIsPlaying(false);
    } else {
      try {
        setIsBuffering(true);
        player.playVideo();
        // If browser blocks play without direct gesture, detect gracefully after 900ms
        window.setTimeout(() => {
          const currentState = playerRef.current?.getPlayerState();
          if (currentState !== 1 && currentState !== 3) {
            setIsBuffering(false);
            setAutoplayBlocked(true);
          }
        }, 900);
      } catch {
        setIsBuffering(false);
        setAutoplayBlocked(true);
      }
    }
  };

  const handleSeek = (nextSec: number) => {
    setCurrentTime(nextSec);
    playerRef.current?.seekTo(nextSec, true);
  };

  const handleVolumeChange = (nextVol: number) => {
    setVolume(nextVol);
    if (nextVol === 0) {
      setMuted(true);
      playerRef.current?.mute();
    } else {
      if (muted) {
        setMuted(false);
        playerRef.current?.unMute();
      }
      playerRef.current?.setVolume(nextVol);
    }
  };

  const handleToggleMute = () => {
    if (!playerRef.current) return;
    if (muted) {
      playerRef.current.unMute();
      playerRef.current.setVolume(volume || 65);
      setMuted(false);
    } else {
      playerRef.current.mute();
      setMuted(true);
    }
  };

  if (!vinylConfig.enabled || !currentTrack) {
    return null;
  }

  return (
    <aside
      aria-label="Our Little Vinyl Player"
      data-testid="vinyl-player"
      data-no-chapter-swipe="true"
      data-playing={isPlaying ? 'true' : 'false'}
      className="fixed bottom-[70px] left-2.5 md:bottom-5 md:left-5 z-40"
    >
      {/* Persistent offscreen YouTube IFrame container */}
      <div
        className="fixed -left-[9999px] -top-[9999px] w-80 h-44 opacity-0 pointer-events-none"
        aria-hidden="true"
      >
        <div ref={hostElRef} id="lw-youtube-iframe-host" />
      </div>

      {!expanded ? (
        /* Collapsed Vintage Vinyl Card */
        <div className="flex items-center gap-1.5 sm:gap-2 rounded-2xl border border-[#30272A]/14 bg-[#FFFDFC] pl-1.5 pr-1.5 sm:pr-2 py-1 shadow-polaroid-lifted max-w-[172px] sm:max-w-[280px]">
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? `Jeda ${currentTrack.title}` : `Putar ${currentTrack.title}`}
            className="relative rounded-full cursor-pointer focus-visible:outline-2 focus-visible:outline-[#A95F70] shrink-0"
          >
            <VinylDiscArt
              isPlaying={isPlaying}
              thumbnailUrl={currentTrack.thumbnailUrl}
              sizeClass="w-9 h-9 sm:w-10 sm:h-10"
            />
            <span className="absolute -bottom-0.5 -right-0.5 w-4 h-4 sm:w-5 sm:h-5 rounded-full bg-[#552E3D] text-[#FFFDFC] flex items-center justify-center shadow">
              {isPlaying ? (
                <Pause className="w-2.5 h-2.5" />
              ) : (
                <Play className="w-2.5 h-2.5 ml-0.5" />
              )}
            </span>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Buka pemutar Vinyl Player"
            className="min-w-0 flex-1 text-left px-0.5 py-0.5 cursor-pointer"
          >
            <p className="text-[9px] sm:text-[10px] uppercase tracking-wider text-[#552E3D] font-semibold truncate">
              {isPlaying ? 'Diputar' : isBuffering ? 'Memuat...' : 'Vinyl ♡'}
            </p>
            <p className="text-[11px] sm:text-xs font-serif font-semibold text-[#30272A] truncate">
              {currentTrack.title}
            </p>
          </button>

          <button
            type="button"
            onClick={() => setExpanded(true)}
            aria-label="Perluas pemutar Vinyl"
            className="min-w-[32px] min-h-[32px] sm:min-w-[36px] sm:min-h-[36px] rounded-xl hover:bg-[#F8F1E8] flex items-center justify-center text-[#30272A] cursor-pointer shrink-0"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      ) : (
        /* Expanded Turntable Card */
        <section className="relative w-[min(340px,calc(100vw-1.5rem))] rounded-2xl border border-[#30272A]/14 bg-[#FFFDFC] p-4 shadow-polaroid-lifted">
          <span
            aria-hidden="true"
            className="washi-tape-gold absolute -top-2.5 left-8 w-16 h-4 -rotate-2"
          />

          {/* Header Bar */}
          <div className="flex items-center justify-between gap-2 pb-2.5 border-b border-[#30272A]/10">
            <div className="flex items-center gap-1.5 min-w-0">
              <Disc3 className="w-4 h-4 text-[#A95F70] shrink-0" />
              <h2 className="font-serif text-sm font-semibold text-[#30272A] truncate">
                {vinylConfig.title || 'Our Little Vinyl Player ♡'}
              </h2>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setShowPlaylistDrawer((v) => !v)}
                aria-expanded={showPlaylistDrawer}
                aria-label="Daftar lagu vinyl"
                className={`min-w-[36px] min-h-[36px] rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
                  showPlaylistDrawer
                    ? 'bg-[#38271F] text-[#F4EBDD]'
                    : 'hover:bg-[#EAE0CF] text-[#38271F]'
                }`}
              >
                <ListMusic className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => setExpanded(false)}
                aria-label="Perkecil pemutar Vinyl"
                className="min-w-[36px] min-h-[36px] rounded-xl hover:bg-[#EAE0CF] flex items-center justify-center text-[#38271F] cursor-pointer"
              >
                <ChevronDown className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Turntable & Active Song Info */}
          <div className="mt-3 flex items-center gap-3.5">
            <div className="relative shrink-0">
              <VinylDiscArt
                isPlaying={isPlaying}
                thumbnailUrl={currentTrack.thumbnailUrl}
                sizeClass="w-20 h-20"
              />
              {/* Tonearm needle indicator */}
              <span
                aria-hidden="true"
                className={`absolute -top-1 -right-1.5 w-8 h-1.5 rounded-full bg-[#C4A574] border border-[#38271F]/40 origin-right transition-transform duration-300 ${
                  isPlaying ? '-rotate-[26deg]' : '-rotate-[52deg]'
                }`}
              />
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#743D4A]">
                Track {activeIndex + 1} / {playlist.length}
              </p>
              <h3 className="mt-0.5 font-serif text-base font-semibold text-[#38271F] truncate">
                {currentTrack.title}
              </h3>
              <p className="text-xs text-[#38271F]/70 truncate">
                {currentTrack.artist || 'YouTube Soundtrack'}
              </p>
              <p className="mt-1 font-hand text-sm text-[#A6533B] leading-none">
                {isPlaying
                  ? 'Memutar nada kenangan ♡'
                  : isBuffering
                    ? 'Menyiapkan pemutaran...'
                    : vinylConfig.autoplayHint || 'Ketuk Putar untuk mendengar'}
              </p>
            </div>
          </div>

          {/* Error or Autoplay Prompt */}
          {playerError && (
            <div
              role="alert"
              className="mt-3 rounded-xl border border-[#A6533B]/30 bg-[#A6533B]/10 p-2.5 text-[11px] text-[#A6533B] space-y-1.5"
            >
              <p className="flex items-start gap-1.5 font-medium">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span>{playerError}</span>
              </p>
              {playlist.length > 1 && (
                <button
                  type="button"
                  onClick={handleNext}
                  className="px-2.5 py-1 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-[10px] font-semibold cursor-pointer"
                >
                  Lanjut ke Lagu Berikutnya
                </button>
              )}
            </div>
          )}

          {autoplayBlocked && !playerError && !isPlaying && (
            <p className="mt-2.5 rounded-lg bg-[#E8BFC5]/25 px-2.5 py-1.5 text-[11px] text-[#743D4A]">
              Ketuk tombol Putar di bawah untuk memulai audio (browser memerlukan sentuhan langsung).
            </p>
          )}

          {/* Seek & Duration Bar */}
          <div className="mt-3 space-y-1">
            <input
              type="range"
              aria-label="Posisi lagu"
              min={0}
              max={duration > 0 ? Math.floor(duration) : 100}
              value={duration > 0 ? Math.min(Math.floor(currentTime), Math.floor(duration)) : 0}
              disabled={duration <= 0}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="w-full accent-[#A6533B] cursor-pointer h-1.5"
            />
            <div className="flex items-center justify-between text-[10px] font-medium text-[#38271F]/65 tabular-nums">
              <span>{formatPlayerClock(currentTime)}</span>
              <span>{duration > 0 ? formatPlayerClock(duration) : '--:--'}</span>
            </div>
          </div>

          {/* Transport + Volume Controls */}
          <div className="mt-2.5 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handlePrev}
                aria-label="Lagu sebelumnya"
                disabled={playlist.length <= 1 && currentTime <= 4}
                className="min-w-[40px] min-h-[40px] rounded-xl border border-[#38271F]/16 bg-[#F4EBDD] flex items-center justify-center text-[#38271F] hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
              >
                <SkipBack className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={handleTogglePlay}
                aria-label={isPlaying ? 'Jeda lagu' : 'Putar lagu'}
                className="min-w-[46px] min-h-[44px] px-3.5 rounded-xl bg-[#552E3D] text-[#FFFDFC] flex items-center justify-center hover:bg-[#3f202c] cursor-pointer shadow-sm"
              >
                {isPlaying ? (
                  <Pause className="w-4 h-4" />
                ) : (
                  <Play className="w-4 h-4 ml-0.5" />
                )}
              </button>

              <button
                type="button"
                onClick={handleNext}
                aria-label="Lagu berikutnya"
                disabled={playlist.length <= 1}
                className="min-w-[40px] min-h-[40px] rounded-xl border border-[#30272A]/16 bg-[#F8F1E8] flex items-center justify-center text-[#30272A] hover:bg-[#EBC9CB]/35 disabled:opacity-40 cursor-pointer"
              >
                <SkipForward className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-1.5">
              <button
                type="button"
                onClick={handleToggleMute}
                aria-label={muted ? 'Nyalakan suara' : 'Bisukan suara'}
                className="min-w-[36px] min-h-[36px] rounded-lg hover:bg-[#EAE0CF] flex items-center justify-center text-[#38271F] cursor-pointer"
              >
                {muted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-[#A6533B]" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                aria-label="Volume lagu"
                min={0}
                max={100}
                value={muted ? 0 : volume}
                onChange={(e) => handleVolumeChange(Number(e.target.value))}
                className="w-16 accent-[#455342] cursor-pointer h-1.5"
              />
            </div>
          </div>

          {/* Playlist Drawer */}
          {showPlaylistDrawer && (
            <div className="mt-3 pt-2.5 border-t border-[#38271F]/12 max-h-32 overflow-y-auto space-y-1 scrapbook-scroll">
              {playlist.map((track, idx) => {
                const active = idx === activeIndex;
                return (
                  <button
                    key={track.id}
                    type="button"
                    onClick={() => selectTrack(idx, true)}
                    className={`w-full min-h-[40px] rounded-xl px-2.5 py-1.5 flex items-center gap-2.5 text-left transition-colors cursor-pointer ${
                      active
                        ? 'bg-[#E8BFC5]/40 text-[#38271F] font-semibold'
                        : 'hover:bg-[#EAE0CF]/60 text-[#38271F]/85'
                    }`}
                  >
                    <span className="text-[11px] tabular-nums text-[#743D4A] w-4 shrink-0">
                      {idx + 1}.
                    </span>
                    {track.thumbnailUrl && (
                      <img
                        src={track.thumbnailUrl}
                        alt=""
                        onError={(e) => {
                          e.currentTarget.style.display = 'none';
                        }}
                        className="w-7 h-7 rounded object-cover shrink-0 bg-[#EAE0CF]"
                      />
                    )}
                    <div className="min-w-0 flex-1">
                      <p className="text-xs truncate">{track.title}</p>
                      {track.artist && (
                        <p className="text-[10px] text-[#38271F]/60 truncate">{track.artist}</p>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </section>
      )}
    </aside>
  );
}
