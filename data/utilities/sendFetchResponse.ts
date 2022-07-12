import type express from 'express';
import type {Writable} from 'stream';
import type {Response as NodeResponse} from '../polyfill/fetch';

export async function writeReadableStreamToWritable(
  stream: ReadableStream,
  writable: Writable,
) {
  const reader = stream.getReader();

  async function read() {
    const {done, value} = await reader.read();

    if (done) {
      writable.end();
      return;
    }

    writable.write(value);

    await read();
  }

  try {
    await read();
  } catch (error: any) {
    writable.destroy(error);
    throw error;
  }
}

export async function sendFetchResponse(
  res: express.Response,
  nodeResponse: NodeResponse,
): Promise<void> {
  res.statusMessage = nodeResponse.statusText;
  res.status(nodeResponse.status);

  for (const [key, values] of Object.entries(nodeResponse.headers.raw())) {
    for (const value of values) {
      res.append(key, value);
    }
  }

  if (nodeResponse.body) {
    await writeReadableStreamToWritable(nodeResponse.body, res);
  } else {
    res.end();
  }
}
