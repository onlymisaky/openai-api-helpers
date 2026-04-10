import type {
  ChatCompletion,
  ChatCompletionCreateParamsNonStreaming,
  ChatCompletionCreateParamsStreaming,
  ChatCompletionFunctionTool,
} from 'openai/resources/chat/completions';
import type {
  ToolCallRecord,
  ToolExecutionOptions,
  ToolHandlerMap,
  ToolResultRecord,
} from '../shared/tools';
import type {
  OpenAIClientOptions,
  OptionalModel,
  TextStreamCallbacks,
} from '../shared/types';

export type CallChatCompletionParams
  = OpenAIClientOptions & OptionalModel<ChatCompletionCreateParamsNonStreaming>;

export interface CallChatCompletionResult {
  text: string;
  raw: ChatCompletion;
}

export type CallChatCompletionJsonParams
  = OpenAIClientOptions & OptionalModel<Omit<ChatCompletionCreateParamsNonStreaming, 'n'>>;

export interface CallChatCompletionJsonResult<T = Record<string, unknown>> {
  data: T;
  raw: ChatCompletion;
}

export type CallChatCompletionStreamParams
  = OpenAIClientOptions
    & OptionalModel<Omit<ChatCompletionCreateParamsStreaming, 'stream'>>
    & TextStreamCallbacks;

type CallChatCompletionToolBaseParams
  = OpenAIClientOptions
    & OptionalModel<Omit<ChatCompletionCreateParamsNonStreaming, 'n' | 'tools'>>
    & {
      tools: ChatCompletionFunctionTool[];
    };

export type CallChatCompletionToolOnceParams = CallChatCompletionToolBaseParams

export interface CallChatCompletionToolOnceResult {
  text: string;
  raw: ChatCompletion;
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
  raw: ChatCompletion;
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
