import type {
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
} from 'openai/resources/chat/completions';
import type {
  CallChatCompletionJsonParams,
  CallChatCompletionParams,
  CallChatCompletionStreamParams,
  CallChatCompletionToolOnceParams,
  CallChatCompletionToolsParams,
} from './types';
import { DEFAULT_MODEL } from '../shared/constants';

export function createNonStreamingParams(
  params:
    | CallChatCompletionParams
    | CallChatCompletionJsonParams
    | CallChatCompletionToolOnceParams
    | CallChatCompletionToolsParams,
): ChatCompletionCreateParamsNonStreaming {
  const { apiKey, baseURL, organization, project, client, ...request } = params;

  return {
    ...request,
    model: params.model ?? DEFAULT_MODEL,
  };
}

export function createStreamingParams(
  params: CallChatCompletionStreamParams,
): ChatCompletionCreateParamsStreaming {
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
