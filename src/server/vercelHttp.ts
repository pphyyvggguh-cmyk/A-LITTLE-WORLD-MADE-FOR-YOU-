import type { IncomingMessage } from 'node:http';

export interface VercelNodeRequest extends IncomingMessage {
  query?: Record<string, string | string[] | undefined>;
  body?: unknown;
}

export interface VercelNodeResponse {
  status(code: number): VercelNodeResponse;
  setHeader(name: string, value: string | string[]): void;
  json(data: unknown): void;
  send(data: unknown): void;
  end(data?: unknown): void;
}

export async function parseJsonBody(req: VercelNodeRequest): Promise<Record<string, unknown>> {
  if (req.body && typeof req.body === 'object' && !Buffer.isBuffer(req.body)) {
    return req.body as Record<string, unknown>;
  }
  if (typeof req.body === 'string') {
    try {
      const parsed = JSON.parse(req.body);
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }
  if (Buffer.isBuffer(req.body)) {
    try {
      const parsed = JSON.parse(req.body.toString('utf8'));
      return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
    } catch {
      return {};
    }
  }

  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(String(chunk)));
  }
  if (chunks.length === 0) return {};
  try {
    const parsed = JSON.parse(Buffer.concat(chunks).toString('utf8'));
    return parsed && typeof parsed === 'object' ? (parsed as Record<string, unknown>) : {};
  } catch {
    return {};
  }
}

export function getQueryParam(req: VercelNodeRequest, name: string): string {
  const fromQuery = req.query?.[name];
  if (typeof fromQuery === 'string') return fromQuery;
  if (Array.isArray(fromQuery) && typeof fromQuery[0] === 'string') return fromQuery[0];

  if (req.url) {
    try {
      const url = new URL(req.url, 'http://localhost');
      return url.searchParams.get(name) || '';
    } catch {
      return '';
    }
  }
  return '';
}
