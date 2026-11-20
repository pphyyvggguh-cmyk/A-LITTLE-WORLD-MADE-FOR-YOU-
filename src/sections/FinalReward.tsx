import { motion } from 'motion/react';
import { Heart, Home } from 'lucide-react';
import {
  BotanicalDivider,
  EditorialSectionShell,
  StorybookButton,
  StorybookSurface,
} from '../components/editorial/StorybookPrimitives';
import { FlowerBucketReveal } from '../components/quests/FlowerBucketReveal';
import { FINAL_REWARD_DATA } from '../data/finalReward';
import { OKTAF_POSE_PATHS } from '../data/miniOktaf';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';

export function FinalReward() {
  const navigateTo = useStore((s) => s.navigateTo);

  return (
    <EditorialSectionShell testId="final-reward-section">
      <motion.article
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.65, ease: EASE_OUT_EXPO }}
        className="max-w-3xl mx-auto"
      >
        <StorybookSurface
          tapeVariant="pink"
          cornerOrnament
          className="journal-lined px-6 sm:px-12 py-10 sm:py-12 shadow-polaroid-lifted"
        >
          <div className="text-center">
            <p className="editorial-kicker font-semibold">{FINAL_REWARD_DATA.badge}</p>
            <h1 className="mt-2 editorial-display">{FINAL_REWARD_DATA.title}</h1>
            <p className="mt-2 font-serif italic text-base text-[#6E5F63]">
              {FINAL_REWARD_DATA.subtitle}
            </p>
          </div>

          {/* Gathering Flowers -> Radiant Glow -> Completed Flower Bucket */}
          <FlowerBucketReveal />

          {/* Mini Oktaf Celebration + Personal Closing Message */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
            <motion.img
              src={OKTAF_POSE_PATHS.celebrating}
              alt="Mini Oktaf merayakan keberhasilanmu"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain shrink-0 drop-shadow-[0_12px_20px_rgba(48,39,42,0.18)]"
            />

            <div className="space-y-4 text-[15px] sm:text-base text-[#30272A]/90 leading-[32px]">
              {FINAL_REWARD_DATA.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
              <p className="font-hand text-2xl text-[#552E3D] flex items-center gap-2 pt-2">
                <Heart className="w-4 h-4 fill-[#EBC9CB] text-[#A95F70]" />
                <span>{FINAL_REWARD_DATA.signature}</span>
              </p>
            </div>
          </div>

          <BotanicalDivider className="mt-8 mb-6" />

          <div className="flex justify-center">
            <StorybookButton
              type="button"
              variant="primary"
              onClick={() => navigateTo('hub')}
              className="min-h-[48px] px-7"
            >
              <Home className="w-4 h-4" />
              <span>{FINAL_REWARD_DATA.returnButtonLabel}</span>
            </StorybookButton>
          </div>
        </StorybookSurface>
      </motion.article>
    </EditorialSectionShell>
  );
}
