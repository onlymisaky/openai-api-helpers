import type OpenAI from 'openai';
import type { CallJsonResult } from '../shared/json.ts';
import type {
  CallToolCallsResult,
  CallToolsLoopResult,
  ToolCallRecord,
  ToolExecutionOptions,
  ToolHandlerMap,
  ToolResultRecord,
} from '../shared/tools.js';
import type { CallResult, OpenAIClientOptions, OptionalModel, TextStreamCallbacks } from '../shared/types.js';

export type CallChatCompletionParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming>;

export interface CallChatCompletionResult extends CallResult<OpenAI.Chat.ChatCompletion> {

}

export type CallChatCompletionJsonParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Chat.ChatCompletionCreateParamsNonStreaming, 'n'>>;

export interface CallChatCompletionJsonResult<T = Record<string, unknown>> extends CallJsonResult<T, OpenAI.Chat.ChatCompletion> {

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

export type CallChatCompletionToolCallsParams
  = CallChatCompletionToolBaseParams
    & Pick<ToolExecutionOptions, 'onStep' | 'onToolCall'>;

export type CallChatCompletionToolCallsResult = CallToolCallsResult<OpenAI.Chat.ChatCompletion>

export type CallChatCompletionToolsLoopParams
  = CallChatCompletionToolBaseParams
    & ToolExecutionOptions
    & {
      handlers: ToolHandlerMap;
    };

export interface CallChatCompletionToolsLoopResult extends CallToolsLoopResult<OpenAI.Chat.ChatCompletion> {
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
