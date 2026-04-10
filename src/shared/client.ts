import type { OpenAIClientOptions } from './types';
import OpenAI from 'openai';

export function getClient(options: OpenAIClientOptions): OpenAI {
  if (options.client) {
    return options.client;
  }

  const apiKey = options.apiKey ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error(
      'Missing OpenAI API key. Provide `apiKey` or set `OPENAI_API_KEY`.',
    );
  }

  return new OpenAI({
    apiKey,
    baseURL: options.baseURL,
    organization: options.organization,
    project: options.project,
  });
}
