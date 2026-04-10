import type OpenAI from 'openai';
import type {
  ToolCallRecord,
  ToolExecutionOptions,
  ToolHandlerMap,
  ToolResultRecord,
} from '../shared/tools.js';
import type {
  OpenAIClientOptions,
  OptionalModel,
  TextStreamCallbacks,
} from '../shared/types.js';

export type CallChatCompletionParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>;

export interface CallChatCompletionResult {
  text: string;
  raw: OpenAI.Chat.ChatCompletion;
}

export type CallChatCompletionJsonParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, 'n'>>;

export interface CallChatCompletionJsonResult<T = Record<string, unknown>> {
  data: T;
  raw: OpenAI.Chat.ChatCompletion;
}

export type CallChatCompletionStreamParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Chat.ChatCompletionCreateParamsStreaming, 'stream'>>
    & TextStreamCallbacks;

type CallChatCompletionToolBaseParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, 'n' | 'tools'>>
    & {
      tools: OpenAI.Chat.ChatCompletionFunctionTool[];
    };

export type CallChatCompletionToolOnceParams = CallChatCompletionToolBaseParams

export interface CallChatCompletionToolOnceResult {
  text: string;
  raw: OpenAI.Chat.ChatCompletion;
  toolCalls: ToolCallRecord[];
  done: boolean;
}

export type CallChatCompletionToolsParams
  = CallChatCompletionToolBaseParams
    & ToolExecutionOptions
    & {
      handlers: ToolHandlerMap;
    };

export interface CallChatCompletionToolsResult {
  text: string;
  raw: OpenAI.Chat.ChatCompletion;
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
