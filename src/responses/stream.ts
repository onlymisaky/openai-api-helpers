import type OpenAI from 'openai';
import type { CallResponseStreamParams } from './types.js';

export async function* createStreamGenerator(
  stream: AsyncIterable<OpenAI.Responses.ResponseStreamEvent>,
): AsyncGenerator<string, void, unknown> {
  for await (const event of stream) {
    if (event.type === 'response.output_text.delta' && event.delta) {
      yield event.delta;
    }
  }
}

export async function consumeStream(
  stream: AsyncIterable<OpenAI.Responses.ResponseStreamEvent>,
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
