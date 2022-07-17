import type express from 'express';
import {AbortController} from 'abort-controller';
import {createFetchHeaders} from './createFetchHeaders';

export function createFetchRequest(req: express.Request): Request {
  const origin = `${req.protocol}://${req.get('host')}`;
  const url = new URL(req.originalUrl, origin);

  const controller = new AbortController();

  req.on('close', () => {
    controller.abort();
  });

  const init: RequestInit = {
    method: req.method,
    headers: createFetchHeaders(req.headers),
    signal: controller.signal as AbortSignal,
  };

  if (req.method !== 'GET' && req.method !== 'HEAD') {
    init.body = req as unknown as BodyInit | null | undefined;
  }

  return new Request(url.href, init);
}
