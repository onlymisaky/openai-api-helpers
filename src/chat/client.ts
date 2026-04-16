import type OpenAI from 'openai';
import type {
  CallChatCompletionJsonParams,
  CallChatCompletionParams,
  CallChatCompletionStreamParams,
  CallChatCompletionToolCallsParams,
  CallChatCompletionToolsLoopParams,
} from './types.js';
import { DEFAULT_MODEL } from '../shared/constants.js';

export function createNonStreamingParams(
  params:
    | CallChatCompletionParams
    | CallChatCompletionJsonParams
    | CallChatCompletionToolCallsParams
    | CallChatCompletionToolsLoopParams,
): OpenAI.Chat.ChatCompletionCreateParamsNonStreaming {
  const {
    apiKey,
    baseURL,
    organization,
    project,
    client,
    handlers,
    maxSteps,
    onStep,
    onToolCall,
    onToolResult,
    ...request
  } = params as (CallChatCompletionToolsLoopParams | CallChatCompletionToolCallsParams) & {
    handlers?: unknown;
    maxSteps?: unknown;
    onStep?: unknown;
    onToolCall?: unknown;
    onToolResult?: unknown;
  };

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
    onStart,
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
