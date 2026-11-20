import { FormEvent, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, Gift, Loader2, Sparkles } from 'lucide-react';
import { StorybookButton } from '../editorial/StorybookPrimitives';
import { QUEST2_QUESTIONS } from '../../data/quests';
import { useStore } from '../../store/useStore';
import { EASE_OUT_EXPO } from '../../utils/animation';
import { TOTAL_QUEST2_QUESTIONS, verifyQuest2AnswerLocal } from '../../utils/quests';

async function validateAnswerSecure(stepIndex: number, answer: string): Promise<boolean> {
  try {
    const res = await fetch('/api/quests/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ stepIndex, answer }),
    });
    if (res.ok) {
      const data = (await res.json()) as { ok?: boolean; correct?: boolean };
      if (data?.ok) return Boolean(data.correct);
    }
  } catch {
    // Fallback to cryptographic digest verification on static/offline hosting
  }
  return verifyQuest2AnswerLocal(stepIndex, answer);
}

export function Quest2Challenge() {
  const quest2Step = useStore((s) => s.quest2Step);
  const quest2Completed = useStore((s) => s.quest2Completed);
  const recordQuest2StepSolved = useStore((s) => s.recordQuest2StepSolved);
  const setQuest2GiftModalOpen = useStore((s) => s.setQuest2GiftModalOpen);

  const [answerInput, setAnswerInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<{
    type: 'ok' | 'err';
    text: string;
  } | null>(null);
  const [shakeKey, setShakeKey] = useState(0);

  const activeIndex = Math.min(quest2Step, TOTAL_QUEST2_QUESTIONS - 1);
  const activeQuestion = QUEST2_QUESTIONS[activeIndex];
  const isFinished = quest2Completed || quest2Step >= TOTAL_QUEST2_QUESTIONS;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (submitting || isFinished) return;

    const trimmed = answerInput.trim();
    if (!trimmed) {
      setFeedback({ type: 'err', text: 'Tulis jawabanmu dulu sebelum diperiksa ya ♡' });
      setShakeKey((k) => k + 1);
      return;
    }

    setSubmitting(true);
    setFeedback(null);
    try {
      const ok = await validateAnswerSecure(activeIndex, trimmed);
      if (ok) {
        const nextSolvedCount = activeIndex + 1;
        setAnswerInput('');
        setFeedback({
          type: 'ok',
          text:
            nextSolvedCount >= TOTAL_QUEST2_QUESTIONS
              ? 'Benar semua! Kado surat rahasia untuk Wulan sekarang terbuka ♡'
              : `Bener banget! Lanjut ke pertanyaan ${nextSolvedCount + 1}/3...`,
        });
        recordQuest2StepSolved(nextSolvedCount);
        if (nextSolvedCount >= TOTAL_QUEST2_QUESTIONS) {
          window.setTimeout(() => {
            setQuest2GiftModalOpen(true);
          }, 550);
        }
      } else {
        setFeedback({
          type: 'err',
          text: 'Hmm, masih sedikit meleset nih. Coba ingat-ingat pelan lagi ya — atau tanya Mini Oktaf untuk petunjuk halus ♡',
        });
        setShakeKey((k) => k + 1);
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      data-testid="quest-2-panel"
      className="paper-plate p-4 sm:p-5 space-y-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <span className="text-xs font-medium text-[#743D4A]">
            Quest 2 · {isFinished ? 'Selesai' : 'Aktif'}
          </span>
          <h3 className="font-serif text-xl font-semibold text-[#38271F]">
            Three Little Questions
          </h3>
        </div>
        <span
          data-testid="quest-2-progress"
          className="text-sm font-semibold text-[#A6533B] tabular-nums"
        >
          {Math.min(quest2Step, TOTAL_QUEST2_QUESTIONS)}/{TOTAL_QUEST2_QUESTIONS} Terjawab
        </span>
      </div>

      <p className="text-xs sm:text-sm text-[#38271F]/75">
        Jawab tiga pertanyaan kecil tentang awal cerita kita untuk membuka sebuah kado surat khusus.
      </p>

      {/* Progress steps */}
      <div className="grid grid-cols-3 gap-2">
        {QUEST2_QUESTIONS.map((q, idx) => {
          const solved = isFinished || idx < quest2Step;
          const current = !isFinished && idx === activeIndex;
          return (
            <div
              key={q.id}
              className={`rounded-lg px-2.5 py-1.5 border text-[11px] font-medium flex items-center justify-between transition-colors ${
                solved
                  ? 'bg-[#455342]/12 border-[#455342]/35 text-[#455342]'
                  : current
                    ? 'bg-[#FBF6EE] border-[#A6533B]/45 text-[#38271F]'
                    : 'bg-[#FBF6EE]/50 border-[#38271F]/10 text-[#38271F]/45'
              }`}
            >
              <span>Soal {idx + 1}/3</span>
              {solved && <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />}
            </div>
          );
        })}
      </div>

      {!isFinished ? (
        <motion.form
          key={activeQuestion.id}
          onSubmit={async (e) => {
            await handleSubmit(e);
          }}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25, ease: EASE_OUT_EXPO }}
          className="rounded-xl bg-[#FBF6EE] border border-[#38271F]/14 p-4 space-y-3"
        >
          <div className="flex items-start justify-between gap-2">
            <p className="font-serif text-base sm:text-lg font-semibold text-[#38271F] leading-snug">
              {activeQuestion.step}. {activeQuestion.prompt}
            </p>
            <Sparkles className="w-4 h-4 text-[#C4A574] shrink-0 mt-1" />
          </div>

          <motion.div
            key={shakeKey}
            animate={shakeKey > 0 && feedback?.type === 'err' ? { x: [0, -6, 6, -4, 4, 0] } : undefined}
            transition={{ duration: 0.35 }}
          >
            <input
              type="text"
              data-testid="quest-2-input"
              value={answerInput}
              onChange={(e) => {
                setAnswerInput(e.target.value);
                if (feedback?.type === 'err') setFeedback(null);
              }}
              placeholder={activeQuestion.placeholder}
              aria-label={activeQuestion.prompt}
              autoComplete="off"
              className="w-full min-h-[44px] rounded-lg bg-[#F4EBDD]/75 border border-[#38271F]/22 px-3.5 py-2 text-sm text-[#38271F] placeholder:text-[#38271F]/42 focus:outline-none focus:border-[#A6533B]"
            />
          </motion.div>

          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[11px] text-[#38271F]/62">{activeQuestion.helper}</p>
            <StorybookButton
              type="submit"
              variant="primary"
              data-testid="quest-2-submit"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Memeriksa...</span>
                </>
              ) : (
                <span>Periksa Jawaban</span>
              )}
            </StorybookButton>
          </div>

          {feedback && (
            <p
              role={feedback.type === 'err' ? 'alert' : 'status'}
              className={`text-xs font-medium rounded-lg px-3 py-2 ${
                feedback.type === 'ok'
                  ? 'bg-[#455342]/12 text-[#455342]'
                  : 'bg-[#A6533B]/10 text-[#A6533B]'
              }`}
            >
              {feedback.text}
            </p>
          )}
        </motion.form>
      ) : (
        <motion.div
          key="quest-2-done"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: EASE_OUT_EXPO }}
          className="rounded-xl bg-[#FBF6EE] border border-[#455342]/30 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
        >
          <div>
            <p className="text-sm font-semibold text-[#455342] flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>Ketiga pertanyaan terjawab dengan benar!</span>
            </p>
            <p className="mt-0.5 text-xs text-[#38271F]/70">
              Kado surat kecil bertuliskan &ldquo;A Letter for Wulan&rdquo; sudah siap dibuka.
            </p>
          </div>
          <StorybookButton
            type="button"
            variant="primary"
            data-testid="quest-2-open-gift"
            onClick={() => setQuest2GiftModalOpen(true)}
            className="!bg-[#743D4A] hover:!bg-[#5c2f3a] !border-[#743D4A] shrink-0"
          >
            <Gift className="w-4 h-4" />
            <span>Buka Kado Surat ♡</span>
          </StorybookButton>
        </motion.div>
      )}
    </div>
  );
}
