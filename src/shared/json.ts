import type { ErrorObject, ValidateFunction } from 'ajv';
import type OpenAI from 'openai';
import type { RawResult } from './types.ts';
import { Ajv } from 'ajv';

/**
 * JSON 解析错误
 */
export interface JsonParseError {
  message: string;
  preview: string;
}

/**
 * 解析后的 JSON 结果
 */
export interface ParsedJsonResult<T = Record<string, unknown>> {
  data: T | null;
  parseError: JsonParseError | null;
}

/**
 * JSON 调用结果
 */
export interface CallJsonResult<
  T = Record<string, unknown>,
  R = OpenAI.Responses.Response | OpenAI.Chat.ChatCompletion,
> extends ParsedJsonResult<T>, RawResult<R> {

}

export type JsonSchema = Record<string, unknown>;

const ajv = new Ajv({
  allErrors: true,
  strict: false,
});

const schemaValidatorCache = new WeakMap<JsonSchema, ValidateFunction>();

function assertJsonObject(value: unknown): asserts value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    throw new Error('OpenAI response is not a JSON object.');
  }
}

function createJsonParseError(rawText: string, error: unknown): JsonParseError {
  return {
    message: error instanceof Error ? error.message : 'Unknown JSON parse error',
    preview: rawText.slice(0, 200),
  };
}

function createSchemaValidationError(rawText: string, message: string): JsonParseError {
  return createJsonParseError(rawText, new Error(message));
}

function successParsedJsonResult<T = Record<string, unknown>>(data: T): ParsedJsonResult<T> {
  return {
    data,
    parseError: null,
  };
}

function failureParsedJsonResult<T = Record<string, unknown>>(parseError: JsonParseError): ParsedJsonResult<T> {
  return {
    data: null,
    parseError,
  };
}

function formatAjvErrors(errors: ErrorObject[] | null | undefined): string {
  if (!errors?.length) {
    return 'Schema validation failed.';
  }

  return errors
    .map((error) => {
      const path = error.instancePath || '/';
      return `${path} ${error.message ?? error.keyword}`.trim();
    })
    .join('; ');
}

function getSchemaValidator(schema: JsonSchema): ValidateFunction {
  const cached = schemaValidatorCache.get(schema);
  if (cached) {
    return cached;
  }

  const validator = ajv.compile(schema);
  schemaValidatorCache.set(schema, validator);
  return validator;
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

  for (let index = startIndex + 1; index < text.length; index++) {
    const ch = text[index];

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
        return { substring: text.slice(startIndex, index + 1), endIndex: index };
      }
    }
  }

  return null;
}

function extractCodeFenceBlocks(text: string): Array<{ startIndex: number; block: string }> {
  const blocks: Array<{ startIndex: number; block: string }> = [];
  let index = 0;

  while (index < text.length) {
    const fenceStart = text.indexOf('```', index);
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

    index = fenceEnd + 3;
  }

  return blocks;
}

function tryParseSalvagedJsonObject(rawText: string): unknown {
  const trimmed = rawText.trim();
  if (!trimmed) {
    throw new Error('Empty response content.');
  }

  try {
    const parsed = JSON.parse(trimmed);
    assertJsonObject(parsed);
    return parsed;
  } catch {
    // Fall through to salvage mode.
  }

  const parsedCandidates: Array<{ startIndex: number; length: number; value: unknown }> = [];

  for (const { startIndex, block } of extractCodeFenceBlocks(trimmed)) {
    try {
      const parsed = JSON.parse(block);
      assertJsonObject(parsed);
      parsedCandidates.push({ startIndex, length: block.length, value: parsed });
    } catch {
      // Ignore non-JSON fence blocks.
    }
  }

  for (let index = 0; index < trimmed.length; index++) {
    const ch = trimmed[index];
    if (ch !== '{' && ch !== '[') {
      continue;
    }

    const extracted = extractBalancedJsonSubstring(trimmed, index);
    if (!extracted) {
      continue;
    }

    try {
      const parsed = JSON.parse(extracted.substring);
      assertJsonObject(parsed);
      parsedCandidates.push({
        startIndex: index,
        length: extracted.substring.length,
        value: parsed,
      });
    } catch {
      // Ignore invalid or non-object candidates.
    }

    index = extracted.endIndex;
  }

  if (parsedCandidates.length === 0) {
    throw new Error('Unable to extract any valid JSON from response content.');
  }

  parsedCandidates.sort((a, b) => {
    if (a.startIndex !== b.startIndex) {
      return b.startIndex - a.startIndex;
    }
    return b.length - a.length;
  });

  return parsedCandidates[0]!.value;
}

export function parseStrictJsonObjectText<T = Record<string, unknown>>(rawText: string): ParsedJsonResult<T> {
  if (!rawText) {
    return failureParsedJsonResult({
      message: 'OpenAI response text is empty.',
      preview: '',
    });
  }

  try {
    const parsed = JSON.parse(rawText);
    assertJsonObject(parsed);
    return successParsedJsonResult(parsed as T);
  } catch (error) {
    return failureParsedJsonResult(createJsonParseError(rawText, error));
  }
}

export function parseSalvagedJsonObjectText<T = Record<string, unknown>>(rawText: string): ParsedJsonResult<T> {
  try {
    const parsed = tryParseSalvagedJsonObject(rawText);
    assertJsonObject(parsed);
    return successParsedJsonResult(parsed as T);
  } catch (error) {
    return failureParsedJsonResult(createJsonParseError(rawText, error));
  }
}

export function validateParsedJsonWithSchema<T = Record<string, unknown>>(
  rawText: string,
  parsedResult: ParsedJsonResult<T>,
  schema?: JsonSchema | null,
): ParsedJsonResult<T> {
  if (!schema || parsedResult.parseError || !parsedResult.data) {
    return parsedResult;
  }

  try {
    const validator = getSchemaValidator(schema);
    if (validator(parsedResult.data)) {
      return parsedResult;
    }

    return failureParsedJsonResult(
      createSchemaValidationError(
        rawText,
        `Schema validation failed: ${formatAjvErrors(validator.errors)}`,
      ),
    );
  } catch (error) {
    return failureParsedJsonResult(
      createSchemaValidationError(
        rawText,
        `Invalid JSON schema: ${error instanceof Error ? error.message : String(error)}`,
      ),
    );
  }
}
