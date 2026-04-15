import type { JsonSchema } from '../shared/json.ts';
import type {
  CallChatCompletionJsonParams,
  CallChatCompletionJsonResult,
  CallChatCompletionParams,
  CallChatCompletionResult,
  CallChatCompletionStreamParams,
} from './types.js';
import { getClient } from '../shared/client.js';
import { JSON_ONLY_SYSTEM_PROMPT } from '../shared/constants.js';
import { validateParsedJsonWithSchema } from '../shared/json.ts';
import { createNonStreamingParams, createStreamingParams } from './client.js';
import { extractChoiceTexts, extractTextContent, parseSingleChoiceJsonResponse } from './json.js';
import { consumeStream, createStreamGenerator } from './stream.js';

function getChatResponseFormatSchema(
  responseFormat: CallChatCompletionJsonParams['response_format'] | undefined,
): JsonSchema | null {
  if (responseFormat?.type !== 'json_schema') {
    return null;
  }

  const schema = responseFormat.json_schema?.schema;
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return null;
  }

  return schema as JsonSchema;
}

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
  const baseMessages = params.messages.filter(
    m => !(m.role === 'system' && m.content === JSON_ONLY_SYSTEM_PROMPT),
  );

  const jsonOnlyMessage = { role: 'system' as const, content: JSON_ONLY_SYSTEM_PROMPT };
  const messages = [...baseMessages];

  // Inject the system prompt right before the latest contiguous block of user messages.
  // If the last message is not a user message, append to the end.
  let insertIndex = -1;
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i]?.role === 'user') {
      insertIndex = i;
      continue;
    }

    if (insertIndex !== -1) {
      insertIndex = i + 1;
    }
    break;
  }

  if (insertIndex === -1) {
    messages.push(jsonOnlyMessage);
  } else {
    messages.splice(insertIndex, 0, jsonOnlyMessage);
  }

  const response = await client.chat.completions.create({
    ...createNonStreamingParams({
      ...params,
      messages,
    }),
    n: 1,
    response_format: responseFormat,
  });
  const rawText = extractTextContent(response.choices[0]?.message);
  const parsed = validateParsedJsonWithSchema<T>(
    rawText,
    parseSingleChoiceJsonResponse<T>(response),
    getChatResponseFormatSchema(params.response_format),
  );

  return {
    data: parsed.data,
    parseError: parsed.parseError,
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
