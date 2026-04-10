import type { ChatCompletionChunk } from 'openai/resources/chat/completions';
import type { CallChatCompletionStreamParams } from './types';

export async function* createStreamGenerator(
  stream: AsyncIterable<ChatCompletionChunk>,
): AsyncGenerator<string, void, unknown> {
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (text) {
      yield text;
    }
  }
}

export async function consumeStream(
  stream: AsyncIterable<ChatCompletionChunk>,
  params: CallChatCompletionStreamParams & {
    onChunk: NonNullable<CallChatCompletionStreamParams['onChunk']>;
  },
): Promise<string> {
  let fullText = '';

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? '';
    if (!text) {
      continue;
    }

    fullText += text;
    await params.onChunk(text);
  }

  if (params.onDone) {
    await params.onDone(fullText);
  }

  return fullText;
}
