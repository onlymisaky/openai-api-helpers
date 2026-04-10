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

export type CallResponseParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Responses.ResponseCreateParamsNonStreaming>;

export interface CallResponseResult {
  text: string;
  raw: OpenAI.Responses.Response;
}

export type CallResponseJsonParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Responses.ResponseCreateParamsNonStreaming>;

export interface CallResponseJsonResult<T = Record<string, unknown>> {
  data: T;
  raw: OpenAI.Responses.Response;
}

export type CallResponseStreamParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Responses.ResponseCreateParamsStreaming, 'stream'>>
    & TextStreamCallbacks;

type CallResponseToolBaseParams
  = OpenAIClientOptions
    & OptionalModel<Omit<OpenAI.Responses.ResponseCreateParamsNonStreaming, 'tools'>>
    & {
      tools: OpenAI.Responses.FunctionTool[];
    };

export type CallResponseToolOnceParams = CallResponseToolBaseParams

export interface CallResponseToolOnceResult {
  text: string;
  raw: OpenAI.Responses.Response;
  toolCalls: ToolCallRecord[];
  done: boolean;
}

export type CallResponseToolsParams
  = CallResponseToolBaseParams
    & ToolExecutionOptions
    & {
      handlers: ToolHandlerMap;
    };

export interface CallResponseToolsResult {
  text: string;
  raw: OpenAI.Responses.Response;
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
