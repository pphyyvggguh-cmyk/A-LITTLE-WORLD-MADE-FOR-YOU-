import { motion } from 'motion/react';

interface LoadingScreenProps {
  label?: string;
}

export function LoadingScreen({ label = 'Menyiapkan halaman jurnal...' }: LoadingScreenProps) {
  return (
    <div className="w-full min-h-[260px] flex flex-col items-center justify-center gap-3 p-8 text-center">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 4, repeat: Infinity, ease: 'linear' }}
        className="w-9 h-9 rounded-full border-2 border-[#C4A574]/40 border-t-[#A6533B]"
      />
      <p className="font-serif text-sm italic text-[#38271F]/70">{label}</p>
    </div>
  );
}
