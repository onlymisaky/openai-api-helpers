import type OpenAI from 'openai';
import type { CallJsonResult } from '../shared/json.ts';
import type {
  CallToolOnceResult,
  CallToolsResult,
  ToolExecutionOptions,
  ToolHandlerMap,
} from '../shared/tools.js';
import type { CallResult, OpenAIClientOptions, OptionalModel, TextStreamCallbacks } from '../shared/types.js';

export type CallResponseParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Responses.ResponseCreateParamsNonStreaming>;

export interface CallResponseResult extends CallResult<OpenAI.Responses.Response> {

}

export type CallResponseJsonParams
  = OpenAIClientOptions
    & OptionalModel<OpenAI.Responses.ResponseCreateParamsNonStreaming>;

export interface CallResponseJsonResult<T = Record<string, unknown>> extends CallJsonResult<T, OpenAI.Responses.Response> {

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

export interface CallResponseToolOnceResult extends CallToolOnceResult<OpenAI.Responses.Response> {

}

export type CallResponseToolsParams
  = CallResponseToolBaseParams
    & ToolExecutionOptions
    & {
      handlers: ToolHandlerMap;
    };

export interface CallResponseToolsResult extends CallToolsResult<OpenAI.Responses.Response> {

}
