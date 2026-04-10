import type {
  CallResponseJsonParams,
  CallResponseJsonResult,
  CallResponseParams,
  CallResponseResult,
  CallResponseStreamParams,
} from './types';
import { getClient } from '../shared/client';
import { JSON_ONLY_SYSTEM_PROMPT } from '../shared/constants';
import { createJsonTextFormat, createNonStreamingParams, createStreamingParams } from './client';
import { parseResponsesJsonResponse } from './json';
import { consumeStream, createStreamGenerator } from './stream';

export async function callResponse(
  params: CallResponseParams,
): Promise<CallResponseResult> {
  const client = getClient(params);
  const response = await client.responses.create(createNonStreamingParams(params));

  return {
    text: response.output_text,
    raw: response,
  };
}

export async function callResponseJson<T = Record<string, unknown>>(
  params: CallResponseJsonParams,
): Promise<CallResponseJsonResult<T>> {
  const client = getClient(params);
  const instructions = [params.instructions, JSON_ONLY_SYSTEM_PROMPT]
    .filter(Boolean)
    .join('\n\n');
  const text = {
    ...params.text,
    format: createJsonTextFormat(params.text),
  };

  const response = await client.responses.create(
    createNonStreamingParams({
      ...params,
      instructions,
      text,
    }),
  );

  return {
    data: parseResponsesJsonResponse<T>(response),
    raw: response,
  };
}

export async function callResponseStream(
  params: CallResponseStreamParams & {
    onChunk: NonNullable<CallResponseStreamParams['onChunk']>;
  },
): Promise<string>;
export async function callResponseStream(
  params: CallResponseStreamParams,
): Promise<AsyncGenerator<string, void, unknown>>;
export async function callResponseStream(
  params: CallResponseStreamParams,
): Promise<string | AsyncGenerator<string, void, unknown>> {
  const client = getClient(params);
  const stream = await client.responses.create(createStreamingParams(params));

  if (!params.onChunk) {
    return createStreamGenerator(stream);
  }

  return consumeStream(stream, {
    ...params,
    onChunk: params.onChunk,
  });
}
