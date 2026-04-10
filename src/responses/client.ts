import type OpenAI from 'openai';
import type {
  CallResponseJsonParams,
  CallResponseParams,
  CallResponseStreamParams,
  CallResponseToolOnceParams,
  CallResponseToolsParams,
} from './types.js';
import { DEFAULT_MODEL } from '../shared/constants.js';

export function createNonStreamingParams(
  params:
    | CallResponseParams
    | CallResponseJsonParams
    | CallResponseToolOnceParams
    | CallResponseToolsParams,
): OpenAI.Responses.ResponseCreateParamsNonStreaming {
  const { apiKey, baseURL, organization, project, client, ...request } = params;

  return {
    ...request,
    model: params.model ?? DEFAULT_MODEL,
  };
}

export function createStreamingParams(
  params: CallResponseStreamParams,
): OpenAI.Responses.ResponseCreateParamsStreaming {
  const {
    apiKey,
    baseURL,
    organization,
    project,
    client,
    onChunk,
    onDone,
    ...request
  } = params;

  return {
    ...request,
    model: params.model ?? DEFAULT_MODEL,
    stream: true,
  };
}

export function createJsonTextFormat(
  text?: OpenAI.Responses.ResponseTextConfig | null,
): OpenAI.Responses.ResponseFormatTextConfig {
  if (!text?.format) {
    return {
      type: 'json_schema',
      name: 'json_object',
      strict: true,
      schema: {
        type: 'object',
        additionalProperties: true,
      },
    };
  }

  return text.format;
}
