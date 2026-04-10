import type { ResponseStreamEvent } from 'openai/resources/responses/responses';
import type { CallResponseStreamParams } from './types';

export async function* createStreamGenerator(
  stream: AsyncIterable<ResponseStreamEvent>,
): AsyncGenerator<string, void, unknown> {
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta' && event.delta) {
      yield event.delta;
    }
  }
}

export async function consumeStream(
  stream: AsyncIterable<ResponseStreamEvent>,
  params: CallResponseStreamParams & {
    onChunk: NonNullable<CallResponseStreamParams['onChunk']>;
  },
): Promise<string> {
  let fullText = '';

  for await (const event of stream) {
    if (event.type !== 'response.output_text.delta' || !event.delta) {
      continue;
    }

    fullText += event.delta;
    await params.onChunk(event.delta);
  }

  if (params.onDone) {
    await params.onDone(fullText);
  }

  return fullText;
}
