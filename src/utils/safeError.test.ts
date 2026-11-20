import test from 'node:test';
import assert from 'node:assert/strict';
import {
  formatSafeUiError,
  isSensitiveOrRawErrorText,
  PUBLIC_JAR_SUBMIT_ERROR,
} from './safeError.ts';

test('isSensitiveOrRawErrorText detects Firestore JSON errors, Firebase codes, emails, and tokens', () => {
  assert.equal(
    isSensitiveOrRawErrorText(
      '{"error":"Missing or insufficient permissions.","operationType":"create","authInfo":{"userId":"uid123","email":"oktafmbul0@gmail.com"}}'
    ),
    true
  );
  assert.equal(
    isSensitiveOrRawErrorText('FirebaseError: Missing or insufficient permissions.'),
    true
  );
  assert.equal(isSensitiveOrRawErrorText('Error: auth/unauthorized-domain'), true);
  assert.equal(
    isSensitiveOrRawErrorText('Akun user@example.com gagal masuk'),
    true
  );
  assert.equal(
    isSensitiveOrRawErrorText('Token eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9 failed'),
    true
  );
  assert.equal(
    isSensitiveOrRawErrorText('Isi inisial pengirim terlebih dahulu.'),
    false
  );
});

test('formatSafeUiError shields public UI from raw Firestore JSON and Firebase permission errors', () => {
  const rawFirestoreJson = JSON.stringify({
    error: 'Missing or insufficient permissions.',
    operationType: 'create',
    path: 'jarThoughts/jar-abc',
    authInfo: { userId: 'uid-secret', email: 'wulanainindya92@gmail.com' },
  });

  const publicOutput = formatSafeUiError(
    new Error(rawFirestoreJson),
    PUBLIC_JAR_SUBMIT_ERROR,
    'public'
  );
  assert.equal(publicOutput, PUBLIC_JAR_SUBMIT_ERROR);
  assert.equal(publicOutput.includes('uid-secret'), false);
  assert.equal(publicOutput.includes('wulanainindya92'), false);
  assert.equal(publicOutput.includes('permission'), false);

  const sdkPermissionOutput = formatSafeUiError(
    new Error('FirebaseError: [code=permission-denied]: Missing or insufficient permissions.'),
    PUBLIC_JAR_SUBMIT_ERROR,
    'public'
  );
  assert.equal(sdkPermissionOutput, PUBLIC_JAR_SUBMIT_ERROR);
});

test('formatSafeUiError provides clean Indonesian admin diagnostics without exposing authInfo or emails', () => {
  const rawFirestoreJson = JSON.stringify({
    error: 'Missing or insufficient permissions.',
    operationType: 'list',
    path: 'jarThoughts',
    authInfo: { userId: 'uid-admin', email: 'oktafmbul0@gmail.com' },
  });

  const adminOutput = formatSafeUiError(
    new Error(rawFirestoreJson),
    'Gagal memuat data.',
    'admin'
  );
  assert.ok(adminOutput.includes('Izin database ditolak'));
  assert.equal(adminOutput.includes('uid-admin'), false);
  assert.equal(adminOutput.includes('oktafmbul0@gmail.com'), false);
  assert.equal(adminOutput.includes('authInfo'), false);
});
