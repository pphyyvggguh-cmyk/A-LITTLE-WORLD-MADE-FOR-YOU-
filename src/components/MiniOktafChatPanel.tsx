import { FormEvent, useEffect, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import { Loader2, MessageCircleHeart, RotateCcw, Send, Sparkles, X } from 'lucide-react';
import { OKTAF_EXPRESSION_PATHS } from '../data/miniOktaf';
import { STORYBOOK_CHAPTERS } from '../data/storybook';
import { useStore } from '../store/useStore';
import { EASE_OUT_EXPO } from '../utils/animation';
import {
  MiniOktafChatMessage,
  requestMiniOktafChatReply,
  validateUserChatPrompt,
} from '../utils/miniOktafChat';

const CHAT_SESSION_STORAGE_KEY = 'alittleworld_mini_oktaf_chat_v1';

const STARTER_PROMPTS = [
  'Ceritain dong soal bab ini',
  'Ada petunjuk bunga rahasia?',
  'Ucapan buat 19 Februari ♡',
];

function loadChatSession(): MiniOktafChatMessage[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.sessionStorage.getItem(CHAT_SESSION_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MiniOktafChatMessage[]) : [];
  } catch {
    return [];
  }
}

interface MiniOktafChatPanelProps {
  open: boolean;
  onClose: () => void;
}

export function MiniOktafChatPanel({ open, onClose }: MiniOktafChatPanelProps) {
  const currentSection = useStore((s) => s.currentSection);
  const collectedFlowers = useStore((s) => s.collectedFlowers);
  const oktaf = useStore((s) => s.oktaf);
  const setOktafDialogue = useStore((s) => s.setOktafDialogue);

  const [messages, setMessages] = useState<MiniOktafChatMessage[]>(() => loadChatSession());
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const listEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    try {
      window.sessionStorage.setItem(CHAT_SESSION_STORAGE_KEY, JSON.stringify(messages.slice(-24)));
    } catch {
      // Ignore storage quota errors
    }
  }, [messages]);

  useEffect(() => {
    if (open) {
      listEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [open, messages.length]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  const activeChapterTitle =
    STORYBOOK_CHAPTERS.find((c) => c.id === currentSection)?.title ?? 'Dunia Kecil';
  const exprSrc = OKTAF_EXPRESSION_PATHS[oktaf.expression] ?? OKTAF_EXPRESSION_PATHS.happy;

  const sendMessage = async (rawText: string) => {
    if (sending) return;
    const check = validateUserChatPrompt(rawText);
    if (!check.ok) {
      setError(check.error);
      return;
    }

    const userMsg: MiniOktafChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: check.text,
      createdAt: new Date().toISOString(),
    };

    const nextHistory = [...messages, userMsg];
    setMessages(nextHistory);
    setInput('');
    setError(null);
    setSending(true);

    try {
      const reply = await requestMiniOktafChatReply({
        messages: nextHistory,
        currentChapter: currentSection,
        collectedFlowerCount: collectedFlowers.length,
      });

      const botMsg: MiniOktafChatMessage = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        text: reply.reply,
        pose: reply.pose,
        expression: reply.expression,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, botMsg]);
      setOktafDialogue(reply.pose, reply.expression, reply.reply);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Mini Oktaf belum bisa membalas sekarang. Coba lagi sebentar ya.'
      );
    } finally {
      setSending(false);
    }
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    void sendMessage(input);
  };

  const handleClearChat = () => {
    setMessages([]);
    setError(null);
    try {
      window.sessionStorage.removeItem(CHAT_SESSION_STORAGE_KEY);
    } catch {
      // Ignore
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.section
          data-testid="mini-oktaf-chat-panel"
          data-no-chapter-swipe="true"
          role="dialog"
          aria-modal="false"
          aria-label="Ngobrol bareng Mini Oktaf"
          initial={{ opacity: 0, y: 14, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.96 }}
          transition={{ duration: 0.24, ease: EASE_OUT_EXPO }}
          className="fixed bottom-[168px] right-3 sm:bottom-5 sm:right-[156px] z-50 w-[min(350px,calc(100vw-1.5rem))] h-[min(410px,calc(100dvh-220px))] sm:h-[min(430px,64dvh)] flex flex-col rounded-2xl bg-[#FBF6EE] text-[#38271F] border border-[#38271F]/18 shadow-polaroid-lifted overflow-hidden"
        >
          {/* Header */}
          <header className="px-3.5 py-2.5 bg-[#EFE4D1] border-b border-[#38271F]/12 flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2.5 min-w-0">
              <img
                src={exprSrc}
                alt="Mini Oktaf"
                className="w-9 h-9 rounded-full object-contain bg-[#FBF6EE] border border-[#38271F]/15 shrink-0"
              />
              <div className="min-w-0">
                <p className="font-serif text-sm font-semibold text-[#38271F] flex items-center gap-1 truncate">
                  <span>Ngobrol sama Mini Oktaf</span>
                  <Sparkles className="w-3 h-3 text-[#A6533B] shrink-0" />
                </p>
                <p className="text-[11px] text-[#743D4A] truncate">
                  Sedang di: {activeChapterTitle}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              {messages.length > 0 && (
                <button
                  type="button"
                  onClick={handleClearChat}
                  aria-label="Bersihkan riwayat obrolan"
                  title="Mulai obrolan baru"
                  className="min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center text-[#38271F]/60 hover:text-[#38271F] hover:bg-[#38271F]/8 cursor-pointer"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                type="button"
                onClick={onClose}
                aria-label="Tutup jendela obrolan Mini Oktaf"
                className="min-w-[34px] min-h-[34px] rounded-lg flex items-center justify-center text-[#38271F]/65 hover:text-[#38271F] hover:bg-[#38271F]/8 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </header>

          {/* Messages */}
          <div className="flex-1 min-h-0 overflow-y-auto px-3.5 py-3 space-y-2.5 storybook-chapter-scroll bg-[#FBF6EE]">
            {messages.length === 0 ? (
              <div className="space-y-3 py-2">
                <div className="rounded-xl bg-[#F4EBDD] border border-[#38271F]/10 p-3 text-xs leading-relaxed text-[#38271F]/85">
                  Haii Wulan ♡ Aku Mini Oktaf. Tanyain apa aja soal isi buku ini, cerita kenangan, atau sekadar ngobrol santai juga boleh kok!
                </div>
                <div className="space-y-1.5">
                  <p className="text-[10px] font-medium uppercase tracking-wider text-[#743D4A]">
                    Coba tanya:
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {STARTER_PROMPTS.map((prompt) => (
                      <button
                        key={prompt}
                        type="button"
                        onClick={() => void sendMessage(prompt)}
                        className="text-left text-[11px] px-2.5 py-1.5 rounded-lg bg-[#EAE0CF]/80 hover:bg-[#EAE0CF] border border-[#38271F]/12 text-[#38271F] transition-colors cursor-pointer"
                      >
                        {prompt}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed whitespace-pre-wrap ${
                      msg.role === 'user'
                        ? 'bg-[#38271F] text-[#F4EBDD] rounded-br-sm'
                        : 'bg-[#F4EBDD] text-[#38271F] border border-[#38271F]/12 rounded-bl-sm'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))
            )}

            {sending && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-sm bg-[#F4EBDD] border border-[#38271F]/12 px-3 py-2 text-xs text-[#743D4A] inline-flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Mini Oktaf lagi ngetik...</span>
                </div>
              </div>
            )}

            {error && (
              <div
                role="alert"
                className="rounded-xl bg-[#E8BFC5]/32 border border-[#A6533B]/30 px-3 py-2 text-[11px] text-[#743D4A] leading-snug"
              >
                {error}
              </div>
            )}

            <div ref={listEndRef} />
          </div>

          {/* Input Bar */}
          <form
            onSubmit={handleSubmit}
            className="px-3 py-2.5 bg-[#F4EBDD]/85 border-t border-[#38271F]/12 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              data-testid="mini-oktaf-chat-input"
              value={input}
              onChange={(e) => {
                setInput(e.target.value);
                if (error) setError(null);
              }}
              placeholder="Tulis pesan buat Mini Oktaf..."
              aria-label="Ketik pesan untuk Mini Oktaf"
              maxLength={600}
              className="flex-1 min-h-[40px] rounded-xl bg-[#FBF6EE] border border-[#38271F]/18 px-3 text-xs text-[#38271F] placeholder:text-[#38271F]/42 focus:outline-none focus:border-[#A6533B]"
            />
            <button
              type="submit"
              data-testid="mini-oktaf-chat-send"
              disabled={sending || !input.trim()}
              aria-label="Kirim pesan"
              className="min-w-[40px] min-h-[40px] rounded-xl bg-[#A6533B] text-[#F4EBDD] flex items-center justify-center hover:bg-[#8e442f] disabled:opacity-45 cursor-pointer shrink-0"
            >
              {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </form>
        </motion.section>
      )}
    </AnimatePresence>
  );
}
