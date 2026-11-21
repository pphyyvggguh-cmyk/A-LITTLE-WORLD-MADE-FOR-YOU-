export type TextScreeningSeverity = 'clean' | 'flagged' | 'blocked';

export interface TextScreeningResult {
  passed: boolean;
  severity: TextScreeningSeverity;
  flags: string[];
  reason?: string;
}

const SCRIPT_OR_HTML_RE =
  /<\s*(script|iframe|object|embed|style|svg|img|link)|on\w+\s*=|javascript:|data:text\/html/i;

const URL_RE = /\b(?:https?:\/\/|www\.|[a-z0-9-]+\.(?:com|net|org|xyz|info|io|co|id|me)\/)\S*/i;

const REPEATED_CHAR_SPAM_RE = /(.)\1{14,}/;

// Focused list of severe profanity / slurs / spam bait to block or flag without false-positiving romantic notes
const BLOCKED_TERMS_RE =
  /\b(anjing|bangsat|kontol|memek|ngentot|jancok|bajingan|keparat|tolol\s+banget|fuck\s+you|motherfucker|bitch|cunt|nigger|faggot|porno|bokep|judol|slot\s*gacor)\b/i;

const FLAGGED_TERMS_RE =
  /\b(bego|goblok|idiot|stupid|dumbass|damn|shit|asshole|kampret|sialan|brengsek)\b/i;

export function screenTextField(label: string, rawText: string): TextScreeningResult {
  const text = typeof rawText === 'string' ? rawText.trim() : '';
  if (!text) {
    return { passed: true, severity: 'clean', flags: [] };
  }

  const flags: string[] = [];

  if (SCRIPT_OR_HTML_RE.test(text)) {
    return {
      passed: false,
      severity: 'blocked',
      flags: [`${label}: unsafe-markup`],
      reason: `Teks pada bagian ${label} mengandung pola skrip atau kode HTML yang tidak diizinkan.`,
    };
  }

  if (BLOCKED_TERMS_RE.test(text)) {
    return {
      passed: false,
      severity: 'blocked',
      flags: [`${label}: blocked-language`],
      reason: `Teks pada bagian ${label} mengandung kata yang tidak pantas untuk hadiah Wulan. Tolong ubah dengan kata-kata yang lebih hangat ya.`,
    };
  }

  if (REPEATED_CHAR_SPAM_RE.test(text)) {
    flags.push(`${label}: repetitive-spam`);
  }

  if (URL_RE.test(text)) {
    flags.push(`${label}: external-link`);
  }

  if (FLAGGED_TERMS_RE.test(text)) {
    flags.push(`${label}: mild-profanity`);
  }

  return {
    passed: true,
    severity: flags.length > 0 ? 'flagged' : 'clean',
    flags,
  };
}

export function screenUnifiedContributionText(input: {
  jarSenderInitial: string;
  jarMessage: string;
  voiceSenderName: string;
  voiceCaption?: string;
}): TextScreeningResult {
  const checks = [
    screenTextField('Inisial Surat', input.jarSenderInitial),
    screenTextField('Pesan Toples', input.jarMessage),
    screenTextField('Nama Voices of Love', input.voiceSenderName),
    screenTextField('Catatan Suara', input.voiceCaption || ''),
  ];

  const blocked = checks.find((c) => !c.passed);
  if (blocked) {
    return blocked;
  }

  const allFlags = checks.flatMap((c) => c.flags);
  return {
    passed: true,
    severity: allFlags.length > 0 ? 'flagged' : 'clean',
    flags: allFlags,
  };
}
