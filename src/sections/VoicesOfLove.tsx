import { useEffect, useMemo, useState } from 'react';
import { Flower2 } from 'lucide-react';
import {
  BotanicalDivider,
  EditorialHeader,
  EditorialSectionShell,
  StorybookButton,
  StorybookSurface,
} from '../components/editorial/StorybookPrimitives';
import { VoiceCard } from '../components/voices/VoiceCard';
import { VoiceFlowerSVG } from '../components/voices/VoiceFlowerSVG';
import { HiddenPolaroidSpot } from '../components/quests/HiddenPolaroidSpot';
import { useContentStore } from '../store/useContentStore';
import { useStore } from '../store/useStore';
import { normalizeVoicesOrder } from '../utils/adminContent';

export function VoicesOfLove() {
  const voicesRaw = useContentStore((s) => s.voices);
  const navigateTo = useStore((s) => s.navigateTo);

  const [activeVoiceId, setActiveVoiceId] = useState<string | null>(null);

  const voices = useMemo(() => normalizeVoicesOrder(voicesRaw), [voicesRaw]);

  useEffect(() => {
    return () => {
      setActiveVoiceId(null);
    };
  }, []);

  return (
    <EditorialSectionShell testId="voices-of-love-section">
      <EditorialHeader
        kicker="05 · Taman Suara Sahabat"
        metaRight={`${voices.length} bunga suara`}
        title="Voices of Love ♡"
        subtitle="Ucapan dan doa dari sahabat-sahabat terdekat yang ikut merayakan harimu."
        ornament={
          <div className="postage-stamp px-3 py-1.5 text-[10px] tracking-widest uppercase text-[#4E5D49] font-semibold">
            TAMAN SUARA · {voices.length}
          </div>
        }
      />

      {voices.length === 0 ? (
        <div className="mt-10 max-w-2xl mx-auto">
          <StorybookSurface
            tapeVariant="sage"
            cornerOrnament
            className="text-center p-8 sm:p-10 space-y-4"
          >
            <div className="flex items-center justify-center gap-3">
              <VoiceFlowerSVG flowerType="sakura" className="w-12 h-12" />
              <VoiceFlowerSVG flowerType="sunflower" className="w-14 h-14" />
              <VoiceFlowerSVG flowerType="lavender" className="w-12 h-12" />
            </div>
            <h2 className="editorial-subheading">
              Belum Ada Pesan Suara Sahabat
            </h2>
            <p className="text-sm text-[#6E5F63] leading-relaxed">
              Taman bunga suara ini masih menunggu rekaman ucapan pertama. Nanti kalau suara-suara dari sahabatmu sudah masuk, tiap bunga di sini akan siap kamu dengarkan satu per satu.
            </p>
            <BotanicalDivider className="my-4" />
            <div className="flex flex-wrap items-center justify-center gap-3">
              <StorybookButton
                type="button"
                variant="primary"
                onClick={() => navigateTo('hub')}
              >
                <Flower2 className="w-4 h-4 text-[#EBC9CB]" />
                <span>Kembali ke Beranda</span>
              </StorybookButton>
            </div>
          </StorybookSurface>
        </div>
      ) : (
        <section
          aria-label="Daftar ucapan suara sahabat"
          className="mt-8 grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          {voices.map((entry, idx) => (
            <VoiceCard
              key={entry.id}
              entry={entry}
              index={idx}
              isActive={activeVoiceId === entry.id}
              onRequestPlay={(id) => setActiveVoiceId(id)}
              onPlaybackEndedOrPaused={(id) =>
                setActiveVoiceId((current) => (current === id ? null : current))
              }
            />
          ))}
        </section>
      )}

      {/* Subtle garden center Polaroid collectible (Quest 3) */}
      <div className="mt-8 pb-12 sm:pb-4 flex items-center justify-center">
        <HiddenPolaroidSpot polaroidId="polaroid-voices" />
      </div>
    </EditorialSectionShell>
  );
}
