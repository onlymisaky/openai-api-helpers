import type OpenAI from 'openai';

export interface OpenAIClientOptions {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  client?: OpenAI;
}

export type OptionalModel<T> = T extends { model?: infer M }
  ? Omit<T, 'model'> & { model?: M }
  : T;

/** Call 结果 */

/**
 * 最基础的调用结果，包含原始响应，所有调用的结果都有 raw 属性
 */
export interface RawResult<T = OpenAI.Responses.Response | OpenAI.Chat.ChatCompletion> {
  raw: T;
}

/**
 * 普通调用结果
 */
export interface CallResult<T = OpenAI.Responses.Response | OpenAI.Chat.ChatCompletion> extends RawResult<T> {
  text: string;
}

/**
 * 文本流式调用回调
 */
export interface TextStreamCallbacks {
  onStart?: () => void | Promise<void>;
  onChunk?: (chunk: string, index: number) => void | Promise<void>;
  onDone?: (fullText: string) => void | Promise<void>;
}
