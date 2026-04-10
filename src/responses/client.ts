import type {
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
  ResponseFormatTextConfig,
  ResponseTextConfig,
} from 'openai/resources/responses/responses';
import type {
  CallResponseJsonParams,
  CallResponseParams,
  CallResponseStreamParams,
  CallResponseToolOnceParams,
  CallResponseToolsParams,
} from './types';
import { DEFAULT_MODEL } from '../shared/constants';

export function createNonStreamingParams(
  params:
    | CallResponseParams
    | CallResponseJsonParams
    | CallResponseToolOnceParams
    | CallResponseToolsParams,
): ResponseCreateParamsNonStreaming {
  const { apiKey, baseURL, organization, project, client, ...request } = params;

  return {
    ...request,
    model: params.model ?? DEFAULT_MODEL,
  };
}

export function createStreamingParams(
  params: CallResponseStreamParams,
): ResponseCreateParamsStreaming {
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
  text?: ResponseTextConfig | null,
): ResponseFormatTextConfig {
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
