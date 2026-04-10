import type OpenAI from 'openai';
import type {
  CallChatCompletionJsonParams,
  CallChatCompletionParams,
  CallChatCompletionStreamParams,
  CallChatCompletionToolOnceParams,
  CallChatCompletionToolsParams,
} from './types.js';
import { DEFAULT_MODEL } from '../shared/constants.js';

export function createNonStreamingParams(
  params:
    | CallChatCompletionParams
    | CallChatCompletionJsonParams
    | CallChatCompletionToolOnceParams
    | CallChatCompletionToolsParams,
): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
  const { apiKey, baseURL, organization, project, client, ...request } = params;

  return {
    ...request,
    model: params.model ?? DEFAULT_MODEL,
  };
}

export function createStreamingParams(
  params: CallChatCompletionStreamParams,
): OpenAI.Chat.ChatCompletionCreateParamsStreaming {
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
