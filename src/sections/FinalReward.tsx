import { motion } from 'motion/react';
import { Heart, Home } from 'lucide-react';
import {
  BotanicalDivider,
  EditorialSectionShell,
  StorybookButton,
  StorybookSurface,
} from '../components/editorial/StorybookPrimitives';
import { BotanicalFlowerSVG } from '../components/Flower';
import { FINAL_REWARD_DATA } from '../data/finalReward';
import { FLOWERS_DATA } from '../data/flowers';
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
            <p className="mt-2 font-serif italic text-base text-[#38271F]/76">
              {FINAL_REWARD_DATA.subtitle}
            </p>
          </div>

          {/* Bouquet of all 7 collected botanical flowers */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2, ease: EASE_OUT_EXPO }}
            className="mt-7 py-5 px-4 paper-plate border border-[#C4A574]/40 flex flex-wrap items-center justify-center gap-3 sm:gap-5"
          >
            {FLOWERS_DATA.map((flower, idx) => (
              <motion.div
                key={flower.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.25 + idx * 0.06, duration: 0.4 }}
                className="flex flex-col items-center gap-1"
              >
                <BotanicalFlowerSVG species={flower.species} className="w-12 h-12 sm:w-14 sm:h-14" />
                <span className="font-hand text-base text-[#38271F]/80">
                  {flower.indonesianName}
                </span>
              </motion.div>
            ))}
          </motion.div>

          {/* Mini Oktaf Celebration + Personal Closing Message */}
          <div className="mt-8 flex flex-col sm:flex-row items-center gap-6">
            <motion.img
              src={OKTAF_POSE_PATHS.celebrating}
              alt="Mini Oktaf merayakan keberhasilanmu"
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.35 }}
              className="w-36 h-36 sm:w-44 sm:h-44 object-contain shrink-0 drop-shadow-[0_12px_20px_rgba(56,39,31,0.18)]"
            />

            <div className="space-y-4 text-[15px] sm:text-base text-[#38271F]/90 leading-[32px]">
              {FINAL_REWARD_DATA.paragraphs.map((p, idx) => (
                <p key={idx}>{p}</p>
              ))}
              <p className="font-hand text-2xl text-[#A6533B] flex items-center gap-2 pt-2">
                <Heart className="w-4 h-4 fill-[#E8BFC5] text-[#A6533B]" />
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
