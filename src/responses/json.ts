import type OpenAI from 'openai';
import type { ParsedJsonResult } from '../shared/json.js';
import { parseStrictJsonObjectText } from '../shared/json.js';

export function parseResponsesJsonResponse<T = Record<string, unknown>>(
  response: OpenAI.Responses.Response,
): ParsedJsonResult<T> {
  const rawText = response.output_text ?? '';
  return parseStrictJsonObjectText<T>(rawText);
}
