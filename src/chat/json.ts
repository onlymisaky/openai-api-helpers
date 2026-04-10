import type OpenAI from 'openai';
import { assertJsonObject } from '../shared/json.js';

export function extractTextContent(
  message?: OpenAI.Chat.ChatCompletionMessage | null,
): string {
  if (!message?.content) {
    return '';
  }

  return message.content;
}

export function extractChoiceTexts(response: OpenAI.Chat.ChatCompletion): string[] {
  return response.choices.map(choice => extractTextContent(choice.message));
}

export function parseSingleChoiceJsonResponse<T = Record<string, unknown>>(
  response: OpenAI.Chat.ChatCompletion,
): T {
  if (response.choices.length === 0) {
    throw new Error('OpenAI JSON response did not contain any choices.');
  }

  if (response.choices.length > 1) {
    throw new Error('callChatCompletionJson only supports a single choice response.');
  }

  const rawText = extractTextContent(response.choices[0]?.message);
  let parsed: unknown;

  try {
    parsed = JSON.parse(rawText);
  } catch (error) {
    const preview = rawText.slice(0, 200);
    const message
      = error instanceof Error ? error.message : 'Unknown JSON parse error';
    throw new Error(
      `Failed to parse OpenAI JSON response: ${message}. Raw content: ${preview}`,
    );
  }

  assertJsonObject(parsed);
  return parsed as T;
}
