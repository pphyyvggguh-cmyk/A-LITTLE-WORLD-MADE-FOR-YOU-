import test from 'node:test';
import assert from 'node:assert/strict';
import { fetchPublicMediaBlob } from './mediaBlobService.ts';

const TEST_CFG = {
  apiKey: 'test-api-key',
  projectId: 'hazel-star-k6gf7',
  firestoreDatabaseId: 'test-db',
};

test('fetchPublicMediaBlob validates blob ID and handles missing/private blobs safely', async () => {
  const badId = await fetchPublicMediaBlob({ id: '../secret', config: TEST_CFG });
  assert.equal(badId.status, 400);

  const notFound = await fetchPublicMediaBlob({
    id: 'blob_missing',
    config: TEST_CFG,
    fetchImpl: (async () => new Response('', { status: 404 })) as typeof fetch,
  });
  assert.equal(notFound.status, 404);

  const privateDoc = await fetchPublicMediaBlob({
    id: 'blob_private',
    config: TEST_CFG,
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          fields: {
            isPublic: { booleanValue: false },
            mimeType: { stringValue: 'image/jpeg' },
            dataBase64: { stringValue: Buffer.from('abc').toString('base64') },
          },
        }),
        { status: 200 }
      )) as typeof fetch,
  });
  assert.equal(privateDoc.status, 403);
});

test('fetchPublicMediaBlob returns binary buffer and immutable cache headers for public images', async () => {
  const sampleBytes = Uint8Array.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10]);
  const res = await fetchPublicMediaBlob({
    id: 'story_polaroid_01',
    config: TEST_CFG,
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          fields: {
            isPublic: { booleanValue: true },
            mimeType: { stringValue: 'image/jpeg' },
            dataBase64: { stringValue: Buffer.from(sampleBytes).toString('base64') },
          },
        }),
        { status: 200 }
      )) as typeof fetch,
  });

  assert.equal(res.status, 200);
  assert.equal(res.mimeType, 'image/jpeg');
  assert.equal(res.cacheControl, 'public, max-age=31536000, immutable');
  assert.deepEqual(Array.from(res.buffer || []), Array.from(sampleBytes));

  const badMime = await fetchPublicMediaBlob({
    id: 'bad_mime_doc',
    config: TEST_CFG,
    fetchImpl: (async () =>
      new Response(
        JSON.stringify({
          fields: {
            isPublic: { booleanValue: true },
            mimeType: { stringValue: 'text/html' },
            dataBase64: { stringValue: Buffer.from('<script>').toString('base64') },
          },
        }),
        { status: 200 }
      )) as typeof fetch,
  });
  assert.equal(badMime.status, 422);
});
