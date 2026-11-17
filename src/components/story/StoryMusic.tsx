import { useCallback, useEffect, useRef, useState } from 'react';
import { Music, Pause, Play, Volume2, VolumeX } from 'lucide-react';

const AMBIENT_AUDIO_PATH = '/assets/audio/our-story-ambient.mp3';
const DEFAULT_VOLUME = 0.28;

interface StoryMusicProps {
  /** Turns true strictly after an explicit user interaction (e.g. opening the book cover) */
  shouldAutoStartAfterInteraction: boolean;
}

export function StoryMusic({ shouldAutoStartAfterInteraction }: StoryMusicProps) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fadeTimerRef = useRef<number | null>(null);
  const startedOnceRef = useRef(false);

  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [volume, setVolume] = useState(DEFAULT_VOLUME);
  const [audioUnavailable, setAudioUnavailable] = useState(false);

  const ensureAudioElement = useCallback((): HTMLAudioElement => {
    if (audioRef.current) return audioRef.current;

    const audio = new Audio(AMBIENT_AUDIO_PATH);
    audio.loop = true;
    audio.preload = 'auto';
    audio.volume = volume;
    audio.muted = isMuted;

    audio.addEventListener('error', () => {
      setAudioUnavailable(true);
      setIsPlaying(false);
    });
    audio.addEventListener('ended', () => {
      setIsPlaying(false);
    });

    audioRef.current = audio;
    return audio;
  }, [isMuted, volume]);

  // Smooth fade-out and cleanup when leaving Our Story
  useEffect(() => {
    return () => {
      if (fadeTimerRef.current) {
        window.clearInterval(fadeTimerRef.current);
      }
      const audio = audioRef.current;
      if (!audio) return;

      if (!audio.paused) {
        const startVol = audio.volume;
        let step = 0;
        fadeTimerRef.current = window.setInterval(() => {
          step += 1;
          audio.volume = Math.max(0, startVol * (1 - step / 6));
          if (step >= 6) {
            if (fadeTimerRef.current) window.clearInterval(fadeTimerRef.current);
            audio.pause();
            audio.src = '';
          }
        }, 45);
      } else {
        audio.src = '';
      }
      audioRef.current = null;
    };
  }, []);

  // Only load & attempt gentle background playback AFTER the user explicitly opens/interacts with the book
  useEffect(() => {
    if (!shouldAutoStartAfterInteraction || startedOnceRef.current || audioUnavailable) return;
    startedOnceRef.current = true;

    const audio = ensureAudioElement();
    audio.muted = isMuted;
    audio.volume = volume;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
      })
      .catch(() => {
        setIsPlaying(false);
      });
  }, [shouldAutoStartAfterInteraction, audioUnavailable, ensureAudioElement, isMuted, volume]);

  useEffect(() => {
    if (!audioRef.current) return;
    audioRef.current.muted = isMuted;
    audioRef.current.volume = volume;
  }, [isMuted, volume]);

  const handleTogglePlay = async () => {
    if (audioUnavailable) return;
    const audio = ensureAudioElement();

    if (audio.paused) {
      try {
        await audio.play();
        setIsPlaying(true);
      } catch {
        setIsPlaying(false);
      }
    } else {
      audio.pause();
      setIsPlaying(false);
    }
  };

  return (
    <div
      aria-label="Kontrol musik latar Our Story"
      className="inline-flex items-center gap-2 bg-[#FBF6EE]/95 border border-[#38271F]/14 rounded-xl px-3 py-1.5 shadow-xs"
    >
      <Music className="w-3.5 h-3.5 text-[#743D4A] shrink-0" />

      {audioUnavailable ? (
        <span className="text-[11px] text-[#38271F]/65 whitespace-nowrap">
          Musik belum tersedia
        </span>
      ) : (
        <>
          <button
            type="button"
            onClick={handleTogglePlay}
            aria-label={isPlaying ? 'Jeda musik latar' : 'Putar musik latar'}
            className="min-w-[34px] min-h-[34px] rounded-lg bg-[#38271F] text-[#F4EBDD] hover:bg-[#4e382d] flex items-center justify-center cursor-pointer transition-colors"
          >
            {isPlaying ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
          </button>

          <button
            type="button"
            onClick={() => setIsMuted((m) => !m)}
            aria-label={isMuted ? 'Bunyikan musik latar' : 'Bisukan musik latar'}
            className="min-w-[34px] min-h-[34px] rounded-lg border border-[#38271F]/16 text-[#38271F] hover:bg-[#EAE0CF] flex items-center justify-center cursor-pointer transition-colors"
          >
            {isMuted ? <VolumeX className="w-3.5 h-3.5" /> : <Volume2 className="w-3.5 h-3.5" />}
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.05}
            value={isMuted ? 0 : volume}
            onChange={(e) => {
              const v = Number(e.target.value);
              setVolume(v);
              if (v > 0 && isMuted) setIsMuted(false);
            }}
            aria-label="Volume musik latar"
            className="w-14 sm:w-20 accent-[#A6533B] cursor-pointer"
          />
        </>
      )}
    </div>
  );
}
