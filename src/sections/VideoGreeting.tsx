import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Film,
  Home,
  Maximize2,
  Pause,
  Play,
  RotateCcw,
  Volume2,
  VolumeX,
} from 'lucide-react';
import { BotanicalDivider, StorybookButton } from '../components/editorial/StorybookPrimitives';
import { HiddenFlowerSpot } from '../components/Flower';
import { BookCornerOrnamentSVG } from '../components/storybook/StorybookIllustrations';
import { SECTION_DIALOGUES } from '../data/miniOktaf';
import { useContentStore } from '../store/useContentStore';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

function formatTime(sec: number): string {
  if (!Number.isFinite(sec) || sec < 0) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function VideoGreeting() {
  const navigateTo = useStore((s) => s.navigateTo);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);
  const videoConfig = useContentStore((s) => s.videoConfig);

  const videoRef = useRef<HTMLVideoElement>(null);
  const frameRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.85);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [videoMissing, setVideoMissing] = useState(false);
  const [hasEnded, setHasEnded] = useState(false);

  useEffect(() => {
    setVideoMissing(false);
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasEnded(false);
  }, [videoConfig.videoSrc]);

  const togglePlay = async () => {
    const v = videoRef.current;
    if (!v || videoMissing) return;
    try {
      if (v.paused) {
        await v.play();
        setIsPlaying(true);
        setHasEnded(false);
      } else {
        v.pause();
        setIsPlaying(false);
      }
    } catch {
      setIsPlaying(false);
    }
  };

  const handleReplay = async () => {
    const v = videoRef.current;
    if (!v || videoMissing) return;
    v.currentTime = 0;
    setHasEnded(false);
    try {
      await v.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const toggleMute = () => {
    const v = videoRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (v) v.muted = nextMuted;
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    if (videoRef.current) {
      videoRef.current.volume = val;
      if (val > 0 && isMuted) {
        videoRef.current.muted = false;
        setIsMuted(false);
      }
    }
  };

  const handleSeek = (val: number) => {
    setCurrentTime(val);
    if (videoRef.current) {
      videoRef.current.currentTime = val;
    }
  };

  const handleFullscreen = () => {
    const el = frameRef.current;
    if (!el) return;
    if (document.fullscreenElement) {
      document.exitFullscreen().catch(() => {});
    } else if (el.requestFullscreen) {
      el.requestFullscreen().catch(() => {});
    }
  };

  return (
    <main className="relative min-h-[calc(100dvh-3.5rem)] w-full bg-[#1C1614] text-[#F4EBDD] px-4 sm:px-8 pt-7 sm:pt-9 pb-36 sm:pb-28 overflow-x-hidden">
      <div className="relative z-10 max-w-4xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-[#F4EBDD]/14">
          <div className="space-y-1.5">
            <p className="text-xs tracking-[0.11em] uppercase text-[#C4A574] font-medium">
              {videoConfig.subtitle || '04 · Ruang Putar Khusus'}
            </p>
            <h1 className="font-serif text-[clamp(1.85rem,4vw,2.75rem)] font-semibold leading-[1.16] tracking-tight text-[#F4EBDD]">
              {videoConfig.title}
            </h1>
            <p className="font-hand text-xl text-[#E8BFC5]/88">{videoConfig.description}</p>
          </div>

          {/* Flower #7 tucked gently on the vintage ticket corner */}
          <div className="flex items-center gap-3 self-end sm:self-auto shrink-0">
            <div className="px-3 py-1 rounded border border-dashed border-[#C4A574]/55 text-[10px] tracking-widest uppercase text-[#C4A574]">
              {videoConfig.ticketLabel || 'TIKET · 02.04.26'}
            </div>
            <HiddenFlowerSpot flowerId="flower-tulip" />
          </div>
        </header>

        {/* Cream Paper Framed Cinema Box */}
        <motion.div
          ref={frameRef}
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: EASE_OUT_EXPO }}
          className="paper-sheet relative mt-8 bg-[#FBF6EE] text-[#38271F] p-3 sm:p-5 shadow-[0_24px_60px_rgba(0,0,0,0.45)]"
        >
          <span
            aria-hidden="true"
            className="washi-tape-gold absolute -top-3 left-10 w-20 h-5 -rotate-2 z-10"
          />
          <span
            aria-hidden="true"
            className="washi-tape absolute -top-3 right-10 w-20 h-5 rotate-2 z-10"
          />
          <BookCornerOrnamentSVG className="pointer-events-none hidden sm:block absolute bottom-2 right-2 w-4 h-4 rotate-180 opacity-35" />

          {/* Video Screen */}
          <div className="relative aspect-video w-full rounded-lg overflow-hidden bg-[#120E0D] flex items-center justify-center">
            {!videoMissing ? (
              <video
                ref={videoRef}
                src={videoConfig.videoSrc}
                poster={videoConfig.thumbnailSrc || undefined}
                playsInline
                preload="metadata"
                onError={() => setVideoMissing(true)}
                onLoadedMetadata={() => {
                  if (videoRef.current) {
                    setDuration(videoRef.current.duration || 0);
                    videoRef.current.volume = volume;
                  }
                }}
                onTimeUpdate={() => {
                  if (videoRef.current) setCurrentTime(videoRef.current.currentTime);
                }}
                onEnded={() => {
                  setIsPlaying(false);
                  setHasEnded(true);
                  const dlg =
                    useContentStore.getState().miniOktaf.sectionDialogues.videoEnded ??
                    SECTION_DIALOGUES.videoEnded;
                  setOktafDialogue(dlg.pose, dlg.expression, dlg.message);
                }}
                onClick={togglePlay}
                className="w-full h-full object-contain cursor-pointer"
              />
            ) : (
              <div className="px-6 py-10 text-center max-w-md space-y-3">
                <div className="w-14 h-14 mx-auto rounded-full bg-[#38271F] border border-[#C4A574]/40 flex items-center justify-center text-[#C4A574]">
                  <Film className="w-6 h-6" />
                </div>
                <h2 className="font-serif text-xl sm:text-2xl text-[#F4EBDD]">
                  Video Ucapan Belum Tersedia
                </h2>
                <p className="text-xs sm:text-sm text-[#F4EBDD]/78 leading-relaxed">
                  Video ucapan spesialnya masih disiapkan. Nanti kalau sudah terpasang, kamu bisa langsung memutarnya di sini ya.
                </p>
                <div className="pt-2 flex justify-center">
                  <StorybookButton
                    type="button"
                    variant="primary"
                    onClick={() => navigateTo('hub')}
                    className="!bg-[#A6533B] hover:!bg-[#8e442f] !border-[#A6533B]"
                  >
                    <Home className="w-4 h-4" />
                    <span>Kembali ke Beranda</span>
                  </StorybookButton>
                </div>
              </div>
            )}

            {/* Center Play Overlay when paused & video exists */}
            {!videoMissing && !isPlaying && (
              <button
                type="button"
                onClick={togglePlay}
                aria-label="Putar video ulang tahun"
                className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-[#A6533B]/95 text-[#F4EBDD] flex items-center justify-center shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                <Play className="w-7 h-7 ml-1 fill-[#F4EBDD]" />
              </button>
            )}
          </div>

          {/* Vintage Control Bar */}
          <div className="mt-3 pt-2 border-t border-[#38271F]/12 flex flex-col gap-2.5">
            <div className="flex items-center gap-3 text-xs text-[#38271F]/70 tabular-nums">
              <span className="w-10 text-right">{formatTime(currentTime)}</span>
              <input
                type="range"
                aria-label="Progres pemutaran video"
                min={0}
                max={duration || 100}
                step={0.1}
                value={currentTime}
                disabled={videoMissing}
                onChange={(e) => handleSeek(Number(e.target.value))}
                className="flex-1 accent-[#A6533B] h-2 cursor-pointer disabled:opacity-40"
              />
              <span className="w-10">{formatTime(duration)}</span>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={togglePlay}
                  disabled={videoMissing}
                  aria-label={isPlaying ? 'Jeda video' : 'Putar video'}
                  className="min-h-[44px] px-3.5 py-2 rounded-lg bg-[#38271F] text-[#F4EBDD] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#4e382d] disabled:opacity-40 cursor-pointer"
                >
                  {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                  <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleReplay}
                  disabled={videoMissing}
                  aria-label="Putar ulang video"
                  className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-lg border border-[#38271F]/18 text-[#38271F] text-xs font-medium inline-flex items-center gap-1.5 hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span className="hidden sm:inline">Ulang</span>
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={toggleMute}
                  disabled={videoMissing}
                  aria-label={isMuted ? 'Bunyikan suara' : 'Bisukan suara'}
                  className="min-w-[44px] min-h-[44px] rounded-lg border border-[#38271F]/18 text-[#38271F] flex items-center justify-center hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
                >
                  {isMuted || volume === 0 ? (
                    <VolumeX className="w-4 h-4" />
                  ) : (
                    <Volume2 className="w-4 h-4" />
                  )}
                </button>
                <input
                  type="range"
                  aria-label="Volume video"
                  min={0}
                  max={1}
                  step={0.05}
                  value={isMuted ? 0 : volume}
                  disabled={videoMissing}
                  onChange={(e) => handleVolumeChange(Number(e.target.value))}
                  className="w-20 sm:w-24 accent-[#A6533B] cursor-pointer disabled:opacity-40"
                />
                <button
                  type="button"
                  onClick={handleFullscreen}
                  disabled={videoMissing}
                  aria-label="Layar penuh"
                  className="min-w-[44px] min-h-[44px] rounded-lg border border-[#38271F]/18 text-[#38271F] flex items-center justify-center hover:bg-[#EAE0CF] disabled:opacity-40 cursor-pointer"
                >
                  <Maximize2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Post-Video Prompt */}
        {hasEnded && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6"
          >
            <BotanicalDivider className="opacity-45" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                onClick={handleReplay}
                className="min-h-[44px] px-5 py-2.5 rounded-lg bg-[#A6533B] text-[#F4EBDD] text-sm font-medium inline-flex items-center gap-2 cursor-pointer hover:bg-[#8e442f]"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Putar Ulang Video</span>
              </button>
              <button
                type="button"
                onClick={() => navigateTo('hub')}
                className="min-h-[44px] px-5 py-2.5 rounded-lg border border-[#F4EBDD]/28 text-[#F4EBDD] text-sm font-medium inline-flex items-center gap-2 cursor-pointer hover:bg-[#F4EBDD]/10"
              >
                <Home className="w-4 h-4" />
                <span>Kembali ke Beranda</span>
              </button>
            </div>
          </motion.div>
        )}
      </div>
    </main>
  );
}
