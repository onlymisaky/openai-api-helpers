import type OpenAI from 'openai';

export interface OpenAIClientOptions {
  apiKey?: string;
  baseURL?: string;
  organization?: string;
  project?: string;
  client?: OpenAI;
}

export interface TextStreamCallbacks {
  onChunk?: (chunk: string) => void | Promise<void>;
  onDone?: (fullText: string) => void | Promise<void>;
}

export type OptionalModel<T> = T extends { model?: infer M }
  ? Omit<T, 'model'> & { model?: M }
  : T;
