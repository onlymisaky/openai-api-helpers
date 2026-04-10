import type OpenAI from 'openai';
import { assertJsonObject } from '../shared/json.js';

export function parseResponsesJsonResponse<T = Record<string, unknown>>(
  response: OpenAI.Responses.Response,
): T {
  const rawText = response.output_text ?? '';

  if (!rawText) {
    throw new Error('OpenAI Responses API returned empty output_text.');
  }

  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    const preview = rawText.slice(0, 200);
    const message
      = error instanceof Error ? error.message : 'Unknown JSON parse error';
    throw new Error(
      `Failed to parse Responses API JSON response: ${message}. Raw content: ${preview}`,
    );
  }

  assertJsonObject(parsed);
  return parsed as T;
}
