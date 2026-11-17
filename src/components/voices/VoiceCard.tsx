import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import { Pause, Play, RotateCcw, Volume2, VolumeX } from 'lucide-react';
import { VOICE_FLOWER_OPTIONS, VoiceOfLoveEntry } from '../../data/voices';
import { formatAudioTime } from '../../utils/adminContent';
import { EASE_OUT_EXPO } from '../../utils/animation';
import { VoiceFlowerSVG } from './VoiceFlowerSVG';

interface VoiceCardProps {
  entry: VoiceOfLoveEntry;
  index: number;
  isActive: boolean;
  onRequestPlay: (id: string) => void;
  onPlaybackEndedOrPaused: (id: string) => void;
}

export function VoiceCard({
  entry,
  index,
  isActive,
  onRequestPlay,
  onPlaybackEndedOrPaused,
}: VoiceCardProps) {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(0.9);
  const [audioError, setAudioError] = useState(false);

  const flowerMeta =
    VOICE_FLOWER_OPTIONS.find((item) => item.id === entry.flowerType) ??
    VOICE_FLOWER_OPTIONS[0];

  useEffect(() => {
    setAudioError(false);
    setCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
  }, [entry.audioUrl]);

  // Pause this card immediately when another card takes active playback
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (!isActive && !audio.paused) {
      audio.pause();
      setIsPlaying(false);
    }
  }, [isActive]);

  const handleTogglePlay = async () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;

    try {
      if (audio.paused) {
        onRequestPlay(entry.id);
        await audio.play();
        setIsPlaying(true);
      } else {
        audio.pause();
        setIsPlaying(false);
        onPlaybackEndedOrPaused(entry.id);
      }
    } catch {
      setIsPlaying(false);
      onPlaybackEndedOrPaused(entry.id);
    }
  };

  const handleReplay = async () => {
    const audio = audioRef.current;
    if (!audio || audioError) return;
    audio.currentTime = 0;
    setCurrentTime(0);
    try {
      onRequestPlay(entry.id);
      await audio.play();
      setIsPlaying(true);
    } catch {
      setIsPlaying(false);
    }
  };

  const handleSeek = (value: number) => {
    const audio = audioRef.current;
    setCurrentTime(value);
    if (audio) {
      audio.currentTime = value;
    }
  };

  const handleToggleMute = () => {
    const audio = audioRef.current;
    const nextMuted = !isMuted;
    setIsMuted(nextMuted);
    if (audio) {
      audio.muted = nextMuted;
    }
  };

  const handleVolumeChange = (val: number) => {
    setVolume(val);
    const audio = audioRef.current;
    if (audio) {
      audio.volume = val;
      if (val > 0 && isMuted) {
        audio.muted = false;
        setIsMuted(false);
      }
    }
  };

  const tapeClass =
    index % 3 === 0 ? 'washi-tape' : index % 3 === 1 ? 'washi-tape-gold' : 'washi-tape-sage';

  return (
    <motion.article
      data-testid={`voice-card-${entry.id}`}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: Math.min(index * 0.06, 0.35), ease: EASE_OUT_EXPO }}
      className={`paper-sheet relative p-5 sm:p-6 transition-all ${
        isPlaying
          ? 'border-[#A6533B]/55 shadow-polaroid-lifted ring-1 ring-[#E8BFC5]/80'
          : ''
      }`}
    >
      <span
        aria-hidden="true"
        className={`${tapeClass} absolute -top-2.5 left-6 w-16 h-4 -rotate-2`}
      />

      {/* Hidden native audio element with mobile-safe preload & inline plays */}
      <audio
        ref={audioRef}
        src={entry.audioUrl}
        preload="metadata"
        onError={() => setAudioError(true)}
        onLoadedMetadata={() => {
          const audio = audioRef.current;
          if (audio) {
            setDuration(Number.isFinite(audio.duration) ? audio.duration : 0);
            audio.volume = volume;
            audio.muted = isMuted;
          }
        }}
        onTimeUpdate={() => {
          if (audioRef.current) {
            setCurrentTime(audioRef.current.currentTime);
          }
        }}
        onEnded={() => {
          setIsPlaying(false);
          onPlaybackEndedOrPaused(entry.id);
        }}
      />

      {/* Top row: Flower illustration + Optional Photo + Name */}
      <div className="flex items-center gap-3.5">
        <div
          className="relative w-13 h-13 sm:w-16 sm:h-16 shrink-0 rounded-xl border border-[#38271F]/12 flex items-center justify-center"
          style={{ backgroundColor: `${flowerMeta.accentColor}20` }}
        >
          <VoiceFlowerSVG
            flowerType={entry.flowerType}
            isPlaying={isPlaying}
            className="w-11 h-11 sm:w-13 sm:h-13"
          />
        </div>

        {entry.photoUrl && (
          <div className="w-12 h-12 sm:w-14 sm:h-14 shrink-0 rounded-full overflow-hidden border-2 border-[#F4EBDD] shadow-sm bg-[#EAE0CF]">
            <img
              src={entry.photoUrl}
              alt={`Foto ${entry.name}`}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        )}

        <div className="min-w-0 flex-1">
          <p className="editorial-kicker text-[10px]">{flowerMeta.label}</p>
          <h2 className="mt-0.5 font-serif text-lg sm:text-xl font-semibold text-[#38271F] leading-snug break-words">
            {entry.name}
          </h2>
          <p className="text-[11px] text-[#38271F]/58">
            {isPlaying ? 'Sedang memutar pesan suara...' : 'Ketuk putar untuk mendengarkan'}
          </p>
        </div>
      </div>

      {/* Optional written note */}
      {entry.message && entry.message.trim().length > 0 && (
        <blockquote className="mt-4 paper-plate px-4 py-3 font-hand text-xl leading-snug text-[#38271F]/90">
          “{entry.message}”
        </blockquote>
      )}

      {/* Custom HTML5 Audio Player Controls (Android touch-friendly >= 44px) */}
      <div className="mt-4 pt-3.5 border-t border-[#38271F]/10 space-y-2.5">
        {audioError && (
          <p className="text-xs text-[#A6533B] font-medium">
            File audio belum dapat diputar ({entry.audioFileName}).
          </p>
        )}

        {/* Seekbar & Time */}
        <div className="flex items-center gap-2.5 text-xs text-[#38271F]/70 tabular-nums">
          <span className="w-9 text-right">{formatAudioTime(currentTime)}</span>
          <input
            type="range"
            aria-label={`Progres audio ${entry.name}`}
            min={0}
            max={duration > 0 ? duration : 1}
            step={0.1}
            value={Math.min(currentTime, duration > 0 ? duration : 1)}
            disabled={audioError || duration <= 0}
            onChange={(e) => handleSeek(Number(e.target.value))}
            className="flex-1 h-2 accent-[#A6533B] cursor-pointer disabled:opacity-40"
          />
          <span className="w-9">{formatAudioTime(duration)}</span>
        </div>

        {/* Buttons & Volume */}
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleTogglePlay}
              disabled={audioError}
              aria-label={isPlaying ? `Jeda audio ${entry.name}` : `Putar audio ${entry.name}`}
              className={`min-h-[44px] px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40 ${
                isPlaying
                  ? 'bg-[#A6533B] text-[#F4EBDD] hover:bg-[#8e442f]'
                  : 'bg-[#38271F] text-[#F4EBDD] hover:bg-[#4e382d]'
              }`}
            >
              {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
              <span>{isPlaying ? 'Jeda' : 'Putar'}</span>
            </button>

            <button
              type="button"
              onClick={handleReplay}
              disabled={audioError}
              aria-label={`Putar ulang audio ${entry.name}`}
              className="min-w-[44px] min-h-[44px] px-3 py-2 rounded-xl border border-[#38271F]/16 text-[#38271F] text-xs font-medium inline-flex items-center justify-center gap-1 hover:bg-[#EAE0CF] cursor-pointer disabled:opacity-40"
            >
              <RotateCcw className="w-4 h-4" />
              <span className="hidden sm:inline">Ulang</span>
            </button>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleToggleMute}
              disabled={audioError}
              aria-label={isMuted ? `Bunyikan suara ${entry.name}` : `Bisukan suara ${entry.name}`}
              className="min-w-[44px] min-h-[44px] rounded-xl border border-[#38271F]/16 text-[#38271F] flex items-center justify-center hover:bg-[#EAE0CF] cursor-pointer disabled:opacity-40"
            >
              {isMuted || volume === 0 ? (
                <VolumeX className="w-4 h-4" />
              ) : (
                <Volume2 className="w-4 h-4" />
              )}
            </button>
            <input
              type="range"
              aria-label={`Volume audio ${entry.name}`}
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              disabled={audioError}
              onChange={(e) => handleVolumeChange(Number(e.target.value))}
              className="w-20 accent-[#455342] cursor-pointer disabled:opacity-40"
            />
          </div>
        </div>
      </div>
    </motion.article>
  );
}
