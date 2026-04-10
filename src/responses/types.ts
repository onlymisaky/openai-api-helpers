import type {
  FunctionTool,
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseCreateParamsStreaming,
} from 'openai/resources/responses/responses';
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

export type CallResponseParams
  = OpenAIClientOptions & OptionalModel<ResponseCreateParamsNonStreaming>;

export interface CallResponseResult {
  text: string;
  raw: Response;
}

export type CallResponseJsonParams
  = OpenAIClientOptions & OptionalModel<ResponseCreateParamsNonStreaming>;

export interface CallResponseJsonResult<T = Record<string, unknown>> {
  data: T;
  raw: Response;
}

export type CallResponseStreamParams
  = OpenAIClientOptions
    & OptionalModel<Omit<ResponseCreateParamsStreaming, 'stream'>>
    & TextStreamCallbacks;

type CallResponseToolBaseParams
  = OpenAIClientOptions
    & OptionalModel<Omit<ResponseCreateParamsNonStreaming, 'tools'>>
    & {
      tools: FunctionTool[];
    };

export type CallResponseToolOnceParams = CallResponseToolBaseParams

export interface CallResponseToolOnceResult {
  text: string;
  raw: Response;
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
  raw: Response;
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
