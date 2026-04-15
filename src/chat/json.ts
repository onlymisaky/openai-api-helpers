import type OpenAI from 'openai';
import { assertJsonObject } from '../shared/json.js';

function extractCodeFenceBlocks(text: string): Array<{ startIndex: number; block: string }> {
  const blocks: Array<{ startIndex: number; block: string }> = [];
  let i = 0;

  while (i < text.length) {
    const fenceStart = text.indexOf('```', i);
    if (fenceStart === -1) {
      break;
    }

    const fenceEnd = text.indexOf('```', fenceStart + 3);
    if (fenceEnd === -1) {
      break;
    }

    let headerEnd = text.indexOf('\n', fenceStart + 3);
    if (headerEnd === -1 || headerEnd > fenceEnd) {
      headerEnd = fenceStart + 3;
    }

    const contentStart = headerEnd === fenceStart + 3 ? fenceStart + 3 : headerEnd + 1;
    const block = text.slice(contentStart, fenceEnd).trim();

    if (block) {
      blocks.push({ startIndex: fenceStart, block });
    }

    i = fenceEnd + 3;
  }

  return blocks;
}

function extractBalancedJsonSubstring(
  text: string,
  startIndex: number,
): { substring: string; endIndex: number } | null {
  const start = text[startIndex];
  if (start !== '{' && start !== '[') {
    return null;
  }

  const stack: string[] = [start === '{' ? '}' : ']'];
  let inString = false;
  let escapeNext = false;

  for (let i = startIndex + 1; i < text.length; i++) {
    const ch = text[i];

    if (inString) {
      if (escapeNext) {
        escapeNext = false;
        continue;
      }
      if (ch === '\\') {
        escapeNext = true;
        continue;
      }
      if (ch === '"') {
        inString = false;
      }
      continue;
    }

    if (ch === '"') {
      inString = true;
      continue;
    }

    if (ch === '{') {
      stack.push('}');
      continue;
    }
    if (ch === '[') {
      stack.push(']');
      continue;
    }

    const expectedClose = stack[stack.length - 1];
    if (ch === expectedClose) {
      stack.pop();
      if (stack.length === 0) {
        return { substring: text.slice(startIndex, i + 1), endIndex: i };
      }
    }
  }

  return null;
}

function tryParseJsonFromText(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Empty response content.');
  }

  try {
    const value = JSON.parse(trimmed);
    if (value && typeof value === 'object' && !Array.isArray(value)) {
      return value;
    }
    throw new Error('OpenAI response is not a JSON object.');
  } catch {
    // Continue with salvage attempts below.
  }

  const parsedCandidates: Array<{ startIndex: number; length: number; value: unknown }> = [];

  for (const { startIndex, block } of extractCodeFenceBlocks(trimmed)) {
    try {
      const value = JSON.parse(block);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsedCandidates.push({ startIndex, length: block.length, value });
      }
    } catch {
      // ignore
    }
  }

  for (let i = 0; i < trimmed.length; i++) {
    const ch = trimmed[i];
    if (ch !== '{' && ch !== '[') {
      continue;
    }

    const extracted = extractBalancedJsonSubstring(trimmed, i);
    if (!extracted) {
      continue;
    }

    try {
      const value = JSON.parse(extracted.substring);
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        parsedCandidates.push({
          startIndex: i,
          length: extracted.substring.length,
          value,
        });
      }
    } catch {
      // ignore
    }

    // Skip ahead; any JSON starting inside this extracted range is less likely to be the final answer.
    i = extracted.endIndex;
  }

  if (parsedCandidates.length === 0) {
    throw new Error('Unable to extract any valid JSON from response content.');
  }

  parsedCandidates.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return b.startIndex - a.startIndex; // prefer later candidates
    }
    return b.length - a.length; // then prefer larger payload
  });

  return parsedCandidates[0]!.value;
}

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
    parsed = tryParseJsonFromText(rawText);
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
