import test from 'node:test';
import assert from 'node:assert/strict';
import {
  clearBucketProbeCache,
  executeSharedUpload,
  isFirebaseBucketMissingError,
  mapUploadErrorMessage,
  probeFirebaseStorageAvailability,
  uploadViaExpressEndpoint,
} from './uploadTransport.ts';

class MockXHR {
  method = '';
  url = '';
  timeout = 0;
  headers: Record<string, string> = {};
  status = 200;
  responseText = '';
  upload = {
    onprogress: null as ((ev: ProgressEvent) => void) | null,
  };
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  ontimeout: (() => void) | null = null;
  sentBody: unknown = null;

  constructor(private readonly handler: (xhr: MockXHR) => void) {}

  open(method: string, url: string) {
    this.method = method;
    this.url = url;
  }

  setRequestHeader(key: string, value: string) {
    this.headers[key] = value;
  }

  send(body: unknown) {
    this.sentBody = body;
    queueMicrotask(() => this.handler(this));
  }
}

test('probeFirebaseStorageAvailability flags HTTP 404 bucket as unavailable and caches result', async () => {
  clearBucketProbeCache();
  let calls = 0;
  const fetch404 = (async () => {
    calls++;
    return new Response(JSON.stringify({ error: { code: 404, message: 'Not Found.' } }), {
      status: 404,
    });
  }) as typeof fetch;

  const first = await probeFirebaseStorageAvailability('hazel-star-k6gf7.firebasestorage.app', fetch404);
  assert.equal(first.available, false);
  const second = await probeFirebaseStorageAvailability('hazel-star-k6gf7.firebasestorage.app', fetch404);
  assert.equal(second.available, false);
  assert.equal(calls, 1);

  clearBucketProbeCache();
  const fetch403 = (async () => new Response('', { status: 403 })) as typeof fetch;
  const availableRes = await probeFirebaseStorageAvailability('existing-bucket.firebasestorage.app', fetch403);
  assert.equal(availableRes.available, true);
});

test('uploadViaExpressEndpoint reports genuine byte progress, sends Bearer token without manual Content-Type, and succeeds', async () => {
  const file = new File([new Uint8Array(1024)], 'mem-test.jpg', { type: 'image/jpeg' });
  const observedProgress: number[] = [];
  let capturedHeaders: Record<string, string> = {};
  let capturedUrl = '';

  const res = await uploadViaExpressEndpoint({
    file,
    scope: 'site-media',
    folderOrTargetId: 'images',
    idToken: 'fake-id-token-abc',
    onProgress: (pct) => observedProgress.push(pct),
    xhrFactory: () =>
      new MockXHR((xhr) => {
        capturedHeaders = xhr.headers;
        capturedUrl = xhr.url;
        xhr.upload.onprogress?.({ lengthComputable: true, loaded: 512, total: 1024 } as ProgressEvent);
        xhr.status = 201;
        xhr.responseText = JSON.stringify({
          ok: true,
          url: '/assets/uploads/site-media/images/mem-test-abc.jpg',
          storagePath: 'app-server/uploads/site-media/images/mem-test-abc.jpg',
          filename: 'mem-test-abc.jpg',
        });
        xhr.onload?.();
      }) as unknown as XMLHttpRequest,
  });

  assert.equal(capturedUrl, '/api/upload');
  assert.equal(capturedHeaders['Authorization'], 'Bearer fake-id-token-abc');
  assert.equal(capturedHeaders['Content-Type'], undefined);
  assert.deepEqual(observedProgress, [50, 100]);
  assert.equal(res.provider, 'app-server');
  assert.equal(res.url, '/assets/uploads/site-media/images/mem-test-abc.jpg');
});

test('uploadViaExpressEndpoint retries transient 503 errors and does not retry 403 or timeout', async () => {
  const file = new File([new Uint8Array(128)], 'postcard.png', { type: 'image/png' });

  let attempts503 = 0;
  const recovered = await uploadViaExpressEndpoint({
    file,
    scope: 'postcard-media',
    folderOrTargetId: 'pc-1',
    idToken: 'tok',
    maxRetries: 2,
    xhrFactory: () =>
      new MockXHR((xhr) => {
        attempts503++;
        if (attempts503 === 1) {
          xhr.status = 503;
          xhr.responseText = JSON.stringify({ ok: false, error: 'Temporary outage' });
          xhr.onload?.();
          return;
        }
        xhr.status = 201;
        xhr.responseText = JSON.stringify({
          ok: true,
          url: '/assets/uploads/postcard-media/pc-1/postcard.png',
          storagePath: 'app-server/uploads/postcard-media/pc-1/postcard.png',
          filename: 'postcard.png',
        });
        xhr.onload?.();
      }) as unknown as XMLHttpRequest,
  });
  assert.equal(attempts503, 2);
  assert.equal(recovered.url, '/assets/uploads/postcard-media/pc-1/postcard.png');

  let attempts403 = 0;
  await assert.rejects(
    () =>
      uploadViaExpressEndpoint({
        file,
        scope: 'site-media',
        folderOrTargetId: 'images',
        idToken: 'tok',
        maxRetries: 2,
        xhrFactory: () =>
          new MockXHR((xhr) => {
            attempts403++;
            xhr.status = 403;
            xhr.responseText = JSON.stringify({ ok: false, error: 'Forbidden admin only' });
            xhr.onload?.();
          }) as unknown as XMLHttpRequest,
      }),
    /Forbidden admin only/
  );
  assert.equal(attempts403, 1);

  await assert.rejects(
    () =>
      uploadViaExpressEndpoint({
        file,
        scope: 'wishlist-media',
        folderOrTargetId: 'wish-1',
        idToken: 'tok',
        maxRetries: 0,
        xhrFactory: () =>
          new MockXHR((xhr) => {
            xhr.ontimeout?.();
          }) as unknown as XMLHttpRequest,
      }),
    /Waktu unggahan habis/
  );
});

test('executeSharedUpload falls back cleanly when Firebase Storage bucket is 404 or stalls, and preserves Firebase errors on auth failure', async () => {
  clearBucketProbeCache();
  const file = new File([new Uint8Array(64)], 'story.webp', { type: 'image/webp' });
  const progresses: number[] = [];

  const fallbackResult = await executeSharedUpload({
    file,
    scope: 'site-media',
    folderOrTargetId: 'images',
    firebaseStoragePath: 'site-media/images/story.webp',
    storageBucket: 'hazel-star-k6gf7.firebasestorage.app',
    idToken: 'tok',
    onProgress: (p) => progresses.push(p),
    fetchFn: (async () => new Response('', { status: 404 })) as typeof fetch,
    xhrFactory: () =>
      new MockXHR((xhr) => {
        xhr.upload.onprogress?.({ lengthComputable: true, loaded: 32, total: 64 } as ProgressEvent);
        xhr.status = 201;
        xhr.responseText = JSON.stringify({
          ok: true,
          url: '/assets/uploads/site-media/images/story.webp',
          storagePath: 'app-server/uploads/site-media/images/story.webp',
          filename: 'story.webp',
        });
        xhr.onload?.();
      }) as unknown as XMLHttpRequest,
  });

  assert.equal(fallbackResult.provider, 'app-server');
  assert.deepEqual(progresses, [0, 50, 100]);

  await assert.rejects(
    () =>
      executeSharedUpload({
        file,
        scope: 'site-media',
        folderOrTargetId: 'images',
        firebaseStoragePath: 'site-media/images/story.webp',
        idToken: 'tok',
        firebaseUploader: async () => {
          const err = Object.assign(new Error('Permission denied'), {
            code: 'storage/unauthorized',
          });
          throw err;
        },
      }),
    /Akses ditolak oleh aturan Firebase Storage/
  );

  assert.equal(isFirebaseBucketMissingError({ code: 'storage/bucket-not-found' }), true);
  assert.match(mapUploadErrorMessage({ code: 'storage/quota-exceeded' }), /Kuota penyimpanan penuh/);
});
