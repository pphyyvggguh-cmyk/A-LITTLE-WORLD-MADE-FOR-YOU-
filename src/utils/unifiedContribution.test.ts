import test from 'node:test';
import assert from 'node:assert/strict';
import { screenUnifiedContributionText } from './textScreening';
import {
  buildApprovedVoicePayloadFromSubmission,
  clampFlowerQuantity,
  evaluateUnifiedContributionSubmission,
  validatePublicAudioFileMeta,
  validateVoiceContributionInput,
} from './unifiedContribution';

test('screenUnifiedContributionText blocks XSS/HTML and allows warm Indonesian/English notes', () => {
  const clean = screenUnifiedContributionText({
    jarSenderInitial: 'Rina',
    jarMessage: 'Selamat ulang tahun Wulan! Semoga sehat dan bahagia selalu ya ♡',
    voiceSenderName: 'Rina Kusuma',
    voiceCaption: 'Doa terbaik buat kamu dari kami semua.',
  });
  assert.equal(clean.passed, true);
  assert.equal(clean.severity, 'clean');

  const xss = screenUnifiedContributionText({
    jarSenderInitial: 'X',
    jarMessage: '<script>alert(1)</script> happy birthday',
    voiceSenderName: 'Tester',
    voiceCaption: '',
  });
  assert.equal(xss.passed, false);
  assert.equal(xss.severity, 'blocked');

  const urlFlag = screenUnifiedContributionText({
    jarSenderInitial: 'D',
    jarMessage: 'Cek foto kita di https://example.com nanti ya!',
    voiceSenderName: 'Dina',
    voiceCaption: '',
  });
  assert.equal(urlFlag.passed, true);
  assert.equal(urlFlag.severity, 'flagged');
  assert.ok(urlFlag.flags.length > 0);
});

test('validateVoiceContributionInput enforces non-anonymous name, flower 1-5, and audio', () => {
  const anon = validateVoiceContributionInput({
    senderName: 'Anonim',
    flowerType: 'sakura',
    flowerQuantity: 3,
    caption: 'Happy birthday!',
    hasAudio: true,
    audioFileName: 'voice.webm',
  });
  assert.equal(anon.ok, false);

  const someoneSpecial = validateVoiceContributionInput({
    senderName: 'Someone Special',
    flowerType: 'tulip',
    flowerQuantity: 2,
    caption: '',
    hasAudio: true,
    audioFileName: 'voice.mp3',
  });
  assert.equal(someoneSpecial.ok, false);

  const badQty = validateVoiceContributionInput({
    senderName: 'Nadia',
    flowerType: 'tulip',
    flowerQuantity: 6,
    caption: '',
    hasAudio: true,
    audioFileName: 'voice.mp3',
  });
  assert.equal(badQty.ok, false);

  const valid = validateVoiceContributionInput({
    senderName: 'Nadia Putri',
    flowerType: 'peony',
    flowerQuantity: 4,
    caption: 'Untuk sahabat terbaikku!',
    hasAudio: true,
    audioFileName: 'nadia-voice.webm',
    audioDurationSec: 18,
  });
  assert.equal(valid.ok, true);
  if (valid.ok) {
    assert.equal(valid.data.senderName, 'Nadia Putri');
    assert.equal(valid.data.flowerType, 'peony');
    assert.equal(valid.data.flowerQuantity, 4);
  }
});

test('validatePublicAudioFileMeta validates supported formats and size cap', () => {
  assert.equal(validatePublicAudioFileMeta('ucapan.mp3', 'audio/mpeg', 1024 * 500).ok, true);
  assert.equal(validatePublicAudioFileMeta('voice.webm', 'audio/webm;codecs=opus', 45000).ok, true);
  assert.equal(validatePublicAudioFileMeta('empty.mp3', 'audio/mpeg', 0).ok, false);
  assert.equal(validatePublicAudioFileMeta('huge.wav', 'audio/wav', 20 * 1024 * 1024).ok, false);
  assert.equal(validatePublicAudioFileMeta('malware.exe', 'application/octet-stream', 2048).ok, false);
});

test('clampFlowerQuantity clamps bounds 1..5', () => {
  assert.equal(clampFlowerQuantity(-2), 1);
  assert.equal(clampFlowerQuantity('abc'), 1);
  assert.equal(clampFlowerQuantity(3.4), 3);
  assert.equal(clampFlowerQuantity(99), 5);
});

test('evaluateUnifiedContributionSubmission respects TIDAK vs YA and both mandatory sections', () => {
  const declined = evaluateUnifiedContributionSubmission({
    jarDraft: { senderInitial: '', message: '', paperStyle: 'ivory-linen', isAnonymous: false },
    voiceDraft: { senderName: '', flowerType: 'sakura', flowerQuantity: 1, caption: '', hasAudio: false },
    consent: 'TIDAK',
  });
  assert.equal(declined.shouldSubmit, false);
  if (!declined.shouldSubmit) {
    assert.equal(declined.reason, 'declined');
  }

  const missingVoices = evaluateUnifiedContributionSubmission({
    jarDraft: {
      senderInitial: 'AL',
      message: 'Sehat selalu ya Wulan!',
      paperStyle: 'sage-leaf',
      isAnonymous: true,
    },
    voiceDraft: {
      senderName: '',
      flowerType: 'sakura',
      flowerQuantity: 3,
      caption: '',
      hasAudio: false,
    },
    consent: 'YA',
  });
  assert.equal(missingVoices.shouldSubmit, false);
  if (!missingVoices.shouldSubmit) {
    assert.equal(missingVoices.section, 'voices');
  }

  const validBoth = evaluateUnifiedContributionSubmission({
    jarDraft: {
      senderInitial: 'AL',
      message: 'Sehat selalu ya Wulan!',
      paperStyle: 'sage-leaf',
      isAnonymous: true,
    },
    voiceDraft: {
      senderName: 'Alisa',
      flowerType: 'lavender',
      flowerQuantity: 5,
      caption: 'Kado kecil dari kami.',
      hasAudio: true,
      audioFileName: 'alisa.webm',
      audioDurationSec: 22,
    },
    consent: 'YA',
  });
  assert.equal(validBoth.shouldSubmit, true);
  if (validBoth.shouldSubmit) {
    assert.equal(validBoth.jarData.isAnonymous, true);
    assert.equal(validBoth.voiceData.flowerType, 'lavender');
    assert.equal(validBoth.voiceData.flowerQuantity, 5);
  }
});

test('buildApprovedVoicePayloadFromSubmission preserves contributor flower, count, name, caption, and audio', () => {
  const payload = buildApprovedVoicePayloadFromSubmission(
    {
      id: 'sub-1',
      submissionId: 'sub-1',
      senderName: 'Bima Pratama',
      flowerType: 'orchid',
      flowerQuantity: 5,
      caption: 'Happy 22nd birthday Wulan!',
      audioUrl: '/assets/uploads/voices-pending/voice-123.webm',
      audioFileName: 'voice-123.webm',
      audioDurationSec: 15,
      status: 'pending',
      consentConfirmed: true,
      screeningStatus: 'clean',
      screeningFlags: [],
      source: 'public',
      createdAt: '',
      updatedAt: '',
    },
    4
  );

  assert.equal(payload.name, 'Bima Pratama');
  assert.equal(payload.flowerType, 'orchid');
  assert.equal(payload.flowerQuantity, 5);
  assert.equal(payload.message, 'Happy 22nd birthday Wulan!');
  assert.equal(payload.audioUrl, '/assets/uploads/voices-pending/voice-123.webm');
  assert.equal(payload.order, 4);
  assert.equal(payload.permissionConfirmed, true);
  assert.equal(payload.submissionId, 'sub-1');
  assert.equal(payload.source, 'public');
});
