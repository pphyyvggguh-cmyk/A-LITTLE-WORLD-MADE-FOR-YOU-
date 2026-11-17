import type { ButtonHTMLAttributes, ImgHTMLAttributes, ReactNode } from 'react';
import { motion } from 'motion/react';
import { EASE_OUT_EXPO } from '../../utils/animation';
import { BookCornerOrnamentSVG } from '../storybook/StorybookIllustrations';

export function EditorialSectionShell({
  children,
  className = '',
  testId,
}: {
  children: ReactNode;
  className?: string;
  testId?: string;
}) {
  return (
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.42, ease: EASE_OUT_EXPO }}
      data-testid={testId}
      className={`paper-canvas relative min-h-[calc(100dvh-3.5rem)] w-full px-4 sm:px-8 pt-5 sm:pt-8 pb-36 sm:pb-28 overflow-x-hidden ${className}`}
    >
      <div className="relative z-10 max-w-5xl mx-auto">{children}</div>
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
    <header className="relative flex flex-col md:flex-row md:items-end justify-between gap-3.5 md:gap-5 pb-4 sm:pb-6 border-b border-[#38271F]/14">
      <div className="space-y-1.5 min-w-0">
        <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
          <span className="editorial-kicker whitespace-nowrap">{kicker}</span>
          {metaRight && (
            <>
              <span aria-hidden="true" className="hidden sm:inline text-[#38271F]/35">
                ·
              </span>
              <span className="font-hand text-base text-[#455342] whitespace-nowrap">
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
        <BookCornerOrnamentSVG className="pointer-events-none absolute top-2.5 left-2.5 w-5 h-5 opacity-60" />
      )}
      {children}
    </section>
  );
}

export function BotanicalDivider({ className = '' }: { className?: string }) {
  return (
    <div className={`flex items-center gap-3 my-4 ${className}`} aria-hidden="true">
      <span className="editorial-divider flex-1" />
      <svg viewBox="0 0 36 16" className="w-8 h-3.5 text-[#455342]/65 shrink-0">
        <path
          d="M2 8 Q18 8 34 8"
          fill="none"
          stroke="currentColor"
          strokeWidth="1"
          strokeLinecap="round"
        />
        <path d="M18 8 Q13 2 9 6 Q13 9 18 8 Z" fill="currentColor" opacity="0.7" />
        <path d="M18 8 Q23 2 27 6 Q23 9 18 8 Z" fill="currentColor" opacity="0.7" />
        <circle cx="18" cy="8" r="1.8" fill="#A6533B" />
      </svg>
      <span className="editorial-divider flex-1" />
    </div>
  );
}

type ButtonVariant = 'primary' | 'forest' | 'secondary' | 'ghost';

const BUTTON_STYLES: Record<ButtonVariant, string> = {
  primary:
    'bg-[#38271F] text-[#F4EBDD] border border-[#38271F] hover:bg-[#4e382d] shadow-polaroid',
  forest:
    'bg-[#455342] text-[#F4EBDD] border border-[#455342] hover:bg-[#384435] shadow-polaroid',
  secondary:
    'bg-[#FBF6EE] text-[#38271F] border border-[#38271F]/20 hover:bg-[#EAE0CF]',
  ghost:
    'bg-transparent text-[#38271F]/80 border border-transparent hover:bg-[#38271F]/8 hover:text-[#38271F]',
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
      className={`min-h-[44px] px-4 py-2 rounded-lg text-xs sm:text-sm font-medium inline-flex items-center justify-center gap-2 transition-colors active:scale-[0.98] whitespace-nowrap cursor-pointer disabled:opacity-55 ${BUTTON_STYLES[variant]} ${className}`}
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
      <div className="overflow-hidden rounded-[2px] bg-[#EAE0CF]">
        {src ? (
          <img
            src={src}
            alt={alt ?? ''}
            referrerPolicy="no-referrer"
            className={`w-full h-full object-cover ${imgClassName}`}
            {...rest}
          />
        ) : (
          <div className="w-full h-40 flex items-center justify-center text-xs text-[#38271F]/50 font-hand text-base">
            Foto kenangan
          </div>
        )}
      </div>
      {caption && (
        <figcaption className="mt-2 font-hand text-base text-[#38271F]/80 text-center leading-tight">
          {caption}
        </figcaption>
      )}
    </figure>
  );
}
