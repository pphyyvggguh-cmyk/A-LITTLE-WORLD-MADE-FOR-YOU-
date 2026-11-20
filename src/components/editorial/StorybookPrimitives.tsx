import type { ButtonHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { ArrowLeft } from 'lucide-react';
import { motion } from 'motion/react';
import { useStore } from '../../store/useStore';
import { MOTION_INTERFACE } from '../../utils/animation';
import { BookCornerOrnamentSVG } from '../storybook/StorybookIllustrations';

export function EditorialSectionShell({
  children,
  className = '',
  testId,
  showBackToHome = true,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
  showBackToHome?: boolean;
}) {
  const navigateTo = useStore((s) => s.navigateTo);
  const currentSection = useStore((s) => s.currentSection);

  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={MOTION_INTERFACE}
      data-testid={testId}
      className={`paper-canvas relative min-h-full w-full px-4 sm:px-8 pt-4 sm:pt-6 pb-36 sm:pb-24 overflow-x-hidden ${className}`}
    >
      <div className="relative z-10 max-w-5xl mx-auto">
        {showBackToHome && currentSection !== 'hub' && (
          <div className="mb-3">
            <button
              type="button"
              onClick={() => navigateTo('hub')}
              className="min-h-[38px] -ml-1.5 px-1.5 inline-flex items-center gap-1.5 text-xs font-medium text-[#6E5F63] hover:text-[#552E3D] transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>Kembali ke Beranda</span>
            </button>
          </div>
        )}
        {children}
      </div>
    </motion.main>
  );
}

export function EditorialHeader({
  kicker,
  metaRight,
  title,
  subtitle,
  ornament,
  actions,
}: {
  kicker: string;
  metaRight?: ReactNode;
  title: string;
  subtitle?: string;
  ornament?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-4 pb-5 sm:pb-6 border-b border-[#30272A]/12">
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="editorial-kicker whitespace-nowrap">{kicker}</span>
          {metaRight && (
            <>
              <span aria-hidden="true" className="hidden sm:inline text-[#30272A]/30">
                ·
              </span>
              <span className="font-hand text-base text-[#4E5D49] whitespace-nowrap">
                {metaRight}
              </span>
            </>
          )}
        </div>
        <h1 className="editorial-display">{title}</h1>
        {subtitle && <p className="editorial-note max-w-2xl">{subtitle}</p>}
      </div>

      {(ornament || actions) && (
        <div
          className={`flex flex-wrap items-center gap-2.5 shrink-0 ${
            actions ? 'self-start md:self-auto' : 'self-end md:self-auto'
          }`}
        >
          {ornament}
          {actions}
        </div>
      )}
    </header>
  );
}

export function StorybookSurface({
  children,
  className = '',
  tapeVariant = 'none',
  cornerOrnament = false,
}: {
  children: ReactNode;
  className?: string;
  tapeVariant?: 'none' | 'pink' | 'gold' | 'sage';
  cornerOrnament?: boolean;
}) {
  const tapeClass =
    tapeVariant === 'pink'
      ? 'washi-tape'
      : tapeVariant === 'gold'
        ? 'washi-tape-gold'
        : tapeVariant === 'sage'
          ? 'washi-tape-sage'
          : '';

  return (
    <section className={`paper-sheet relative p-5 sm:p-6 ${className}`}>
      {tapeVariant !== 'none' && (
        <span
          aria-hidden="true"
          className={`${tapeClass} absolute -top-2.5 left-8 w-16 h-4 -rotate-2`}
        />
      )}
      {cornerOrnament && (
        <BookCornerOrnamentSVG className="pointer-events-none absolute top-2.5 left-2.5 w-5 h-5 opacity-55" />
      )}
      {children}
    </section>
  );
}

export function BotanicalDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 my-4 ${className}`} aria-hidden="true">
      <span className="editorial-divider flex-1" />
      <svg viewBox="0 0 36 16" className="w-8 h-3.5 text-[#4E5D49]/70 shrink-0">
        <path
          d="M2 8 Q18 8 34 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path d="M18 8 Q13 2 9 6 Q13 9 18 8 Z" fill="currentColor" opacity="0.7" />
        <path d="M18 8 Q23 2 27 6 Q23 9 18 8 Z" fill="currentColor" opacity="0.7" />
        <circle cx="18" cy="8" r="1.8" fill="#A95F70" />
      </svg>
      <span className="editorial-divider flex-1" />
    </div>
  );
}

type ButtonVariant = 'primary' | 'forest' | 'secondary' | 'ghost' | 'rose';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#552E3D] text-[#FFFDFC] border border-[#552E3D] hover:bg-[#3f202c] shadow-polaroid',
  rose:
    'bg-[#A95F70] text-[#FFFDFC] border border-[#A95F70] hover:bg-[#8d4b5a] shadow-polaroid',
  forest:
    'bg-[#4E5D49] text-[#FFFDFC] border border-[#4E5D49] hover:bg-[#3e4b3a] shadow-polaroid',
  secondary:
    'bg-[#FFFDFC] text-[#30272A] border border-[#30272A]/16 hover:bg-[#EFE5D8]',
  ghost:
    'bg-transparent text-[#30272A]/80 border border-transparent hover:bg-[#30272A]/6 hover:text-[#30272A]',
};

export function StorybookButton({
  variant = 'primary',
  className = '',
  children,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button
      {...rest}
      className={`min-h-[44px] px-4 py-2 rounded-xl text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-55 ${BUTTON_STYLES[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

export function EditorialImageFrame({
  src,
  alt,
  caption,
  className = '',
  imgClassName = '',
  ...rest
}: ImgHTMLAttributes<HTMLImageElement> & {
  caption?: string;
  imgClassName?: string;
}) {
  return (
    <figure className={`editorial-photo-frame inline-block ${className}`}>
      <div className="overflow-hidden rounded-[4px] bg-[#EFE5D8]">
        {src ? (
          <img
            src={src}
            alt={alt ?? ''}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover ${imgClassName}`}
            {...rest}
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-xs text-[#6E5F63] font-hand text-base">
            Foto kenangan
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 font-hand text-base text-[#30272A]/85 text-center leading-tight">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
