import { VOICE_FLOWER_OPTIONS, type VoiceFlowerType } from '../../data/voices';
import { clampFlowerQuantity } from '../../utils/unifiedContribution';
import { VoiceFlowerSVG } from './VoiceFlowerSVG';

interface VoiceBouquetDisplayProps {
  flowerType: VoiceFlowerType;
  quantity?: number;
  isPlaying?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

const FAN_LAYOUTS: Record<number, { angle: number; tx: number; ty: number; scale: number }[]> = {
  1: [{ angle: 0, tx: 0, ty: 0, scale: 1 }],
  2: [
    { angle: -12, tx: -10, ty: 2, scale: 0.9 },
    { angle: 12, tx: 10, ty: 2, scale: 0.9 },
  ],
  3: [
    { angle: -18, tx: -13, ty: 4, scale: 0.82 },
    { angle: 0, tx: 0, ty: -3, scale: 0.92 },
    { angle: 18, tx: 13, ty: 4, scale: 0.82 },
  ],
  4: [
    { angle: -22, tx: -15, ty: 5, scale: 0.76 },
    { angle: -7, tx: -5, ty: -2, scale: 0.85 },
    { angle: 7, tx: 5, ty: -2, scale: 0.85 },
    { angle: 22, tx: 15, ty: 5, scale: 0.76 },
  ],
  5: [
    { angle: -26, tx: -17, ty: 7, scale: 0.72 },
    { angle: -13, tx: -8, ty: 0, scale: 0.8 },
    { angle: 0, tx: 0, ty: -4, scale: 0.88 },
    { angle: 13, tx: 8, ty: 0, scale: 0.8 },
    { angle: 26, tx: 17, ty: 7, scale: 0.72 },
  ],
};

export function VoiceBouquetDisplay({
  flowerType,
  quantity = 1,
  isPlaying = false,
  size = 'md',
}: VoiceBouquetDisplayProps) {
  const count = clampFlowerQuantity(quantity);
  const flowerMeta =
    VOICE_FLOWER_OPTIONS.find((item) => item.id === flowerType) ??
    VOICE_FLOWER_OPTIONS[0];
  const layout = FAN_LAYOUTS[count] ?? FAN_LAYOUTS[1];

  const boxClass =
    size === 'sm'
      ? 'w-14 h-14 rounded-xl'
      : size === 'lg'
        ? 'w-20 h-20 rounded-2xl'
        : 'w-16 h-16 sm:w-18 sm:h-18 rounded-xl';

  const stemClass =
    size === 'sm'
      ? 'w-8 h-8'
      : size === 'lg'
        ? 'w-12 h-12'
        : 'w-10 h-10 sm:w-11 sm:h-11';

  return (
    <div
      data-testid="voice-bouquet-display"
      data-flower-type={flowerType}
      data-flower-quantity={count}
      className={`relative shrink-0 border border-[#38271F]/12 flex items-center justify-center overflow-hidden ${boxClass}`}
      style={{ backgroundColor: `${flowerMeta.accentColor}22` }}
      title={`${count} × ${flowerMeta.label}`}
    >
      <div className="relative w-full h-full flex items-center justify-center">
        {layout.map((pos, idx) => (
          <div
            key={idx}
            className="absolute inset-0 flex items-center justify-center pointer-events-none"
            style={{
              transform: `translate(${pos.tx}px, ${pos.ty}px) rotate(${pos.angle}deg) scale(${pos.scale})`,
              transformOrigin: '50% 82%',
            }}
          >
            <VoiceFlowerSVG
              flowerType={flowerType}
              isPlaying={isPlaying}
              className={stemClass}
            />
          </div>
        ))}
      </div>

      {count > 1 && (
        <span
          aria-hidden="true"
          className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-[#FBF6EE]/92 border border-[#38271F]/15 text-[9px] font-bold text-[#552E3D] leading-none shadow-xs"
        >
          ×{count}
        </span>
      )}
    </div>
  );
}
