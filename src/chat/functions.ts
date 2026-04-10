import type {
  CallChatCompletionJsonParams,
  CallChatCompletionJsonResult,
  CallChatCompletionParams,
  CallChatCompletionResult,
  CallChatCompletionStreamParams,
} from './types';
import { getClient } from '../shared/client';
import { JSON_ONLY_SYSTEM_PROMPT } from '../shared/constants';
import { createNonStreamingParams, createStreamingParams } from './client';
import { extractChoiceTexts, parseSingleChoiceJsonResponse } from './json';
import { consumeStream, createStreamGenerator } from './stream';

/**
 * Compatibility wrapper around the legacy Chat Completions API.
 * Prefer `callResponse` for new integrations.
 */
export async function callChatCompletion(
  params: CallChatCompletionParams,
): Promise<CallChatCompletionResult> {
  const client = getClient(params);
  const response = await client.chat.completions.create(
    createNonStreamingParams(params),
  );
  const texts = extractChoiceTexts(response);

  return {
    text: texts.filter(Boolean).join('\n\n'),
    raw: response,
  };
}

/**
 * Compatibility wrapper around the legacy Chat Completions API.
 * Prefer `callResponseJson` for new integrations.
 */
export async function callChatCompletionJson<T = Record<string, unknown>>(
  params: CallChatCompletionJsonParams,
): Promise<CallChatCompletionJsonResult<T>> {
  const client = getClient(params);
  const responseFormat = params.response_format ?? { type: 'json_object' as const };
  const messages = [
    ...params.messages,
    { role: 'developer' as const, content: JSON_ONLY_SYSTEM_PROMPT },
  ];

  const response = await client.chat.completions.create({
    ...createNonStreamingParams({
      ...params,
      messages,
    }),
    n: 1,
    response_format: responseFormat,
  });

  return {
    data: parseSingleChoiceJsonResponse<T>(response),
    raw: response,
  };
}

/**
 * Compatibility wrapper around the legacy Chat Completions API.
 * Prefer `callResponseStream` for new integrations.
 */
export async function callChatCompletionStream(
  params: CallChatCompletionStreamParams & {
    onChunk: NonNullable<CallChatCompletionStreamParams['onChunk']>;
  },
): Promise<string>;
export async function callChatCompletionStream(
  params: CallChatCompletionStreamParams,
): Promise<AsyncGenerator<string, void, unknown>>;
export async function callChatCompletionStream(
  params: CallChatCompletionStreamParams,
): Promise<string | AsyncGenerator<string, void, unknown>> {
  const client = getClient(params);
  const stream = await client.chat.completions.create(
    createStreamingParams(params),
  );

  if (!params.onChunk) {
    return createStreamGenerator(stream);
  }

  return consumeStream(stream, {
    ...params,
    onChunk: params.onChunk,
  });
}
