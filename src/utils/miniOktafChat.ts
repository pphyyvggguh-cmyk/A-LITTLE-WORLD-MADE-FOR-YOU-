import type { OktafExpression, OktafPose } from '../data/miniOktaf';

export interface MiniOktafChatMessage {
  id: string;
  role: 'user' | 'assistant';
  text: string;
  pose?: OktafPose;
  expression?: OktafExpression;
  createdAt: string;
}

export interface MiniOktafChatApiReply {
  ok: true;
  reply: string;
  pose: OktafPose;
  expression: OktafExpression;
}

export interface MiniOktafChatApiError {
  ok: false;
  code: string;
  error: string;
}

export const VALID_OKTAF_POSES = new Set<OktafPose>([
  'standing',
  'walking',
  'running',
  'jumping',
  'sitting',
  'sleeping',
  'waving',
  'pointing',
  'gift',
  'cake',
  'peeking',
  'cheering',
  'birthday_cake',
  'globe',
  'heart',
  'curious',
  'celebrating',
  'relaxing',
]);

export const VALID_OKTAF_EXPRESSIONS = new Set<OktafExpression>([
  'normal',
  'happy',
  'laughing',
  'surprised',
  'pouty',
  'shy',
  'sleepy',
  'wink',
]);

export const MAX_CHAT_INPUT_CHARS = 600;
export const MAX_CHAT_HISTORY_TURNS = 14;

export function sanitizePose(raw: unknown, fallback: OktafPose = 'happy' as OktafPose): OktafPose {
  if (typeof raw === 'string' && VALID_OKTAF_POSES.has(raw as OktafPose)) {
    return raw as OktafPose;
  }
  return VALID_OKTAF_POSES.has(fallback) ? fallback : 'waving';
}

export function sanitizeExpression(
  raw: unknown,
  fallback: OktafExpression = 'happy'
): OktafExpression {
  if (typeof raw === 'string' && VALID_OKTAF_EXPRESSIONS.has(raw as OktafExpression)) {
    return raw as OktafExpression;
  }
  return fallback;
}

export function validateUserChatPrompt(raw: string): { ok: true; text: string } | { ok: false; error: string } {
  const cleaned = raw.replace(/\s+/g, ' ').trim();
  if (!cleaned) {
    return { ok: false, error: 'Ketik dulu pesan buat Mini Oktaf ya ♡' };
  }
  if (cleaned.length > MAX_CHAT_INPUT_CHARS) {
    return {
      ok: false,
      error: `Pesan kepanjangan (maksimal ${MAX_CHAT_INPUT_CHARS} karakter ya).`,
    };
  }
  return { ok: true, text: cleaned };
}

export function trimChatHistory(messages: MiniOktafChatMessage[]): Array<{ role: 'user' | 'assistant'; text: string }> {
  return messages
    .slice(-MAX_CHAT_HISTORY_TURNS)
    .map((m) => ({
      role: m.role,
      text: m.text.trim().slice(0, 1200),
    }))
    .filter((m) => m.text.length > 0);
}

export function parseMiniOktafApiResult(rawText: string): {
  reply: string;
  pose: OktafPose;
  expression: OktafExpression;
} {
  const trimmed = rawText.trim();
  try {
    const parsed = JSON.parse(trimmed) as {
      reply?: unknown;
      pose?: unknown;
      expression?: unknown;
    };
    const reply =
      parsed && typeof parsed === 'object' && typeof parsed.reply === 'string'
        ? parsed.reply.trim()
        : trimmed.startsWith('{')
          ? ''
          : trimmed;
    return {
      reply,
      pose: sanitizePose(parsed?.pose, 'waving'),
      expression: sanitizeExpression(parsed?.expression, 'happy'),
    };
  } catch {
    return {
      reply: trimmed,
      pose: 'waving',
      expression: 'happy',
    };
  }
}

export interface MiniOktafQuestProgressContext {
  currentChapter: string;
  collectedFlowerCount: number;
  collectedFlowerIds?: string[];
  quest2Step?: number;
  quest2Completed?: boolean;
  collectedPolaroidCount?: number;
  collectedPolaroidIds?: string[];
}

export const CHAPTER_CONTEXT_MAP: Record<string, string> = {
  hub: 'Bab 00: Beranda Jurnal (Halaman pembuka buku dan Daftar Bab)',
  story: 'Bab 01: Our Story (Buku scrapbook 17 halaman berisi Polaroid kenangan dan amplop Secret Note)',
  world: 'Bab 02: Our World (Bola dunia 3D berisi 20 kota impian)',
  letters: 'Bab 03: Birthday Letters (Amplop surat dan doa pribadi untuk Wulan)',
  video: 'Bab 04: Birthday Video (Ruang putar video ucapan ulang tahun)',
  voices: 'Bab 05: Voices of Love (Ucapan suara dari sahabat-sahabat terdekat Wulan)',
  wishlist: 'Bab 06: Our Future Wishlist (Daftar impian & rencana masa depan berdua)',
  postcards: 'Bab 07: Postcards From The Future (Kartu pos waktu bersegel tanggal buka)',
  'jar-of-thoughts': 'Bab 08: A Jar Full of Thoughts (Toples kaca berisi pesan-pesan hangat yang bisa dibuka 1 kali setiap 24 jam)',
  reward: 'Bab 09: Secret Meadow (Halaman Buket Bunga setelah 7 bunga terkumpul)',
};

const POLAROID_HINT_CLUES: Array<{
  id: string;
  chapter: string;
  gentleClue: string;
  strongerClue: string;
}> = [
  {
    id: 'polaroid-story',
    chapter: 'Bab 01 (Our Story)',
    gentleClue: 'Coba intip meja di sekitar buku Our Story.',
    strongerClue: 'Ada di sudut bawah meja di bawah buku 17 halaman Our Story.',
  },
  {
    id: 'polaroid-letters',
    chapter: 'Bab 03 (Birthday Letters)',
    gentleClue: 'Ada satu Polaroid yang ikut menemani amplop surat ulang tahunmu.',
    strongerClue: 'Lihat ke bagian bawah deretan amplop di Birthday Letters.',
  },
  {
    id: 'polaroid-voices',
    chapter: 'Bab 05 (Voices of Love)',
    gentleClue: 'Dengarkan taman bunga suara—ada satu foto kecil bersembunyi di sana.',
    strongerClue: 'Terselip rapi di bagian bawah halaman Voices of Love.',
  },
  {
    id: 'polaroid-wishlist',
    chapter: 'Bab 06 (Our Future Wishlist)',
    gentleClue: 'Di papan catatan impian masa depan ada satu foto ikut menunggu.',
    strongerClue: 'Cek margin bawah halaman Our Future Wishlist.',
  },
  {
    id: 'polaroid-postcards',
    chapter: 'Bab 07 (Postcards From The Future)',
    gentleClue: 'Di dekat kartu pos bertanggal buka ada satu Polaroid lagi.',
    strongerClue: 'Lihat ke sudut bawah meja Postcards From The Future.',
  },
];

export function buildMiniOktafSystemInstruction(
  ctx: MiniOktafQuestProgressContext,
  history: Array<{ role: 'user' | 'assistant'; text: string }>
): string {
  const flowerCount = Math.max(0, Math.min(7, Number(ctx.collectedFlowerCount || 0) || 0));
  const q2Step = Math.max(0, Math.min(3, Number(ctx.quest2Step || 0) || 0));
  const q2Completed = Boolean(ctx.quest2Completed) || q2Step >= 3;
  const collectedPolaroids = Array.isArray(ctx.collectedPolaroidIds)
    ? ctx.collectedPolaroidIds.filter((x): x is string => typeof x === 'string')
    : [];
  const polaroidCount = Math.max(
    collectedPolaroids.length,
    Math.min(5, Number(ctx.collectedPolaroidCount || 0) || 0)
  );

  const hintTurnCount = history.filter(
    (m) =>
      m.role === 'user' &&
      /(hint|petunjuk|clue|dimana|di mana|cari|bunga|polaroid|quest|misi|pertanyaan|jawaban|kado|bantu)/i.test(
        m.text
      )
  ).length;
  const isFollowUpHint = hintTurnCount >= 2;

  const missingPolaroid =
    POLAROID_HINT_CLUES.find((p) => !collectedPolaroids.includes(p.id)) ??
    POLAROID_HINT_CLUES[0];

  const q2HintLine = q2Completed
    ? '- Quest 2 (Three Little Questions): SUDAH SELESAI (3/3)! Kalau Wulan bahas ini, ucapkan selamat dan ingatkan kalau kado surat "A Letter for Wulan" bisa dibuka lagi kapan saja di jendela Secret Quest.'
    : q2Step === 0
      ? `- Quest 2 (Three Little Questions, sedang di pertanyaan 1/3 "Kapan tanggal jadian kita?"): Jangan langsung menuliskan jawaban lengkap "02-05-2026". ${
          isFollowUpHint
            ? 'Karena dia tanya lagi, kasih petunjuk lebih jelas: bulannya Mei tahun 2026, tanggal awal bulan, tulis pakai format DD-MM-YYYY.'
            : 'Kasih petunjuk lembut saja dulu: ingat bulan Mei 2026 yang juga tercatat manis di halaman awal buku ini, dengan format tanggal DD-MM-YYYY.'
        }`
      : q2Step === 1
        ? `- Quest 2 (Three Little Questions, sedang di pertanyaan 2/3 "Ucapan saat pertama kali mengungkapkan perasaan"): Jangan langsung menuliskan jawaban lengkapnya. ${
            isFollowUpHint
              ? 'Beri petunjuk agak lebih terang: kalimat tentang keinginan membawa Wulan pergi ke mana-mana sejauh "keliling ..." (4 kata dalam bahasa Indonesia).'
              : 'Kasih petunjuk halus: ingat-ingat janji seru pengen ngajak Wulan jalan jauh melihat seluruh penjuru tempat.'
          }`
        : `- Quest 2 (Three Little Questions, sedang di pertanyaan 3/3 "Modus saat pertama kali dekat"): Jangan langsung menuliskan jawaban persisnya. ${
            isFollowUpHint
              ? 'Beri petunjuk playful agak terang: dua kata, diawali kata "mengukur" lalu bagian tubuh yang sering dibandingkan ukurannya sambil bercanda.'
              : 'Kasih petunjuk bercanda & manis: dulu pernah cari alasan klasik buat membandingkan ukuran sesuatu biar bisa dekat.'
          }`;

  const q3HintLine =
    polaroidCount >= 5
      ? '- Quest 3 (Find the Polaroids): SUDAH SELESAI (5/5)! Ucapkan selamat dengan hangat karena semua Polaroid ditemukan dan Our Little Heart Gallery sudah terbuka di Secret Quest.'
      : `- Quest 3 (Find the Polaroids): Wulan baru menemukan ${polaroidCount}/5 Polaroid. JANGAN pernah membocorkan semua lokasi 5 Polaroid sekaligus! Kalau dia minta petunjuk, arahkan satu per satu ke yang belum ketemu: ${
          isFollowUpHint
            ? `Untuk Polaroid di ${missingPolaroid.chapter}, beri petunjuk lebih jelas: "${missingPolaroid.strongerClue}"`
            : `Berikan petunjuk halus dulu untuk satu Polaroid di ${missingPolaroid.chapter}: "${missingPolaroid.gentleClue}"`
        }`;

  return [
    'Kamu adalah Mini Oktaf, karakter pendamping kecil di dalam website buku cerita ulang tahun berjudul "A LITTLE WORLD MADE FOR YOU ♡" yang dibuat oleh Oktaf khusus untuk Wulan.',
    'Kepribadianmu: hangat, tulus, santai, sedikit playful, sopan, dan berbicara seperti manusia sungguhan dalam bahasa Indonesia sehari-hari yang lembut (jangan kaku, jangan lebay/cringe, jangan terlalu berbunga-bunga berlebihan).',
    'Fakta penting yang HARUS akurat:',
    '- Hari ulang tahun Wulan adalah 19 Februari (19 Februari 2009).',
    '- Tanggal jadian / hari spesial hubungan Oktaf & Wulan adalah 2 Mei 2026 (bedakan jelas dengan hari ulang tahun!).',
    '- Buku cerita ini punya Bab 00 (Beranda Jurnal), Bab 01 (Our Story 17 halaman), Bab 02 (Our World 20 kota), Bab 03 (Birthday Letters), Bab 04 (Birthday Video), Bab 05 (Voices of Love), Bab 06 (Our Future Wishlist), Bab 07 (Postcards From The Future), Bab 08 (A Jar Full of Thoughts), dan Bab 09 (Secret Meadow).',
    `- Saat ini Wulan sedang berada di: ${CHAPTER_CONTEXT_MAP[ctx.currentChapter] ?? CHAPTER_CONTEXT_MAP.hub}.`,
    `- Progres Quest 1 (The Lost Flowers): ${flowerCount}/7 bunga terkumpul. ${
      flowerCount >= 7
        ? 'Sudah lengkap 7/7! Rayakan bahwa rangkaian buket bunga untuk Wulan di Secret Meadow sudah terbuka.'
        : 'Tujuh bunga tersebar di Beranda (Hub), Our Story (2 bunga di dalam halaman buku), Our World (2 bunga), Birthday Letters, dan Birthday Video. Berikan petunjuk halus 1-2 lokasi saja jika ditanya.'
    }`,
    q2HintLine,
    q3HintLine,
    '- Mengetuk dua kali Mini Oktaf akan membuka panel Secret Quest untuk melihat progres semua misi & hadiahnya.',
    '- Jangan pernah membocorkan kode sandi buka buku, data sensitif, atau hal teknis server/admin.',
    '- Jawab singkat dan akrab (maksimal 1 sampai 3 paragraf pendek).',
  ].join('\n');
}

export async function requestMiniOktafChatReply(
  params: MiniOktafQuestProgressContext & {
    messages: MiniOktafChatMessage[];
    fetchImpl?: typeof fetch;
    timeoutMs?: number;
  }
): Promise<MiniOktafChatApiReply> {
  const fetchFn = params.fetchImpl ?? fetch;
  const timeoutMs = Math.max(3000, params.timeoutMs ?? 28_000);
  const payload = {
    messages: trimChatHistory(params.messages),
    currentChapter: params.currentChapter,
    collectedFlowerCount: params.collectedFlowerCount,
    collectedFlowerIds: params.collectedFlowerIds ?? [],
    quest2Step: params.quest2Step ?? 0,
    quest2Completed: Boolean(params.quest2Completed),
    collectedPolaroidCount: params.collectedPolaroidCount ?? 0,
    collectedPolaroidIds: params.collectedPolaroidIds ?? [],
  };

  const controller = typeof AbortController !== 'undefined' ? new AbortController() : null;
  const timer = controller ? setTimeout(() => controller.abort(), timeoutMs) : null;

  let response: Response;
  try {
    response = await fetchFn('/api/mini-oktaf/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      ...(controller ? { signal: controller.signal } : {}),
    });
  } catch (err) {
    if (err instanceof Error && err.name === 'AbortError') {
      throw new Error('Koneksi ke Mini Oktaf kehabisan waktu. Coba kirim ulang ya.');
    }
    throw new Error('Koneksi internet terputus saat menghubungi Mini Oktaf. Coba lagi sebentar ya.');
  } finally {
    if (timer) clearTimeout(timer);
  }

  const contentType = (response.headers?.get('content-type') || '').toLowerCase();
  const body = contentType.includes('application/json') || !contentType
    ? ((await response.json().catch(() => null)) as
        | MiniOktafChatApiReply
        | MiniOktafChatApiError
        | null)
    : null;

  if (!response.ok || !body || !body.ok) {
    const errorMsg =
      (body && 'error' in body && body.error) ||
      `Mini Oktaf lagi belum bisa tersambung (HTTP ${response.status}).`;
    throw new Error(errorMsg);
  }

  const cleanReply = typeof body.reply === 'string' ? body.reply.trim() : '';
  if (!cleanReply) {
    throw new Error('Mini Oktaf sempat terdiam dan belum mengirim balasan. Coba kirim ulang ya.');
  }

  return {
    ok: true,
    reply: cleanReply,
    pose: sanitizePose(body.pose, 'waving'),
    expression: sanitizeExpression(body.expression, 'happy'),
  };
}
