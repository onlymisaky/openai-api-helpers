import type OpenAI from 'openai';
import type { ToolCallRecord, ToolResultRecord } from '../shared/tools.js';
import type {
  CallResponseToolOnceParams,
  CallResponseToolOnceResult,
  CallResponseToolsParams,
  CallResponseToolsResult,
} from './types.js';
import { getClient } from '../shared/client.js';
import {
  getHandler,
  getMaxSteps,
  parseToolArguments,
  serializeToolOutput,
} from '../shared/tools.js';
import { createNonStreamingParams } from './client.js';

export async function callResponseToolOnce(
  params: CallResponseToolOnceParams,
): Promise<CallResponseToolOnceResult> {
  const client = getClient(params);
  const response = await client.responses.create(createNonStreamingParams(params));
  const toolCalls = extractFunctionToolCalls(response);

  return {
    text: response.output_text,
    raw: response,
    toolCalls,
    done: toolCalls.length === 0,
  };
}

export async function callResponseTools(
  params: CallResponseToolsParams,
): Promise<CallResponseToolsResult> {
  const client = getClient(params);
  const maxSteps = getMaxSteps(params.maxSteps);
  const allToolCalls: ToolCallRecord[] = [];
  const allToolResults: ToolResultRecord[] = [];

  let request = createNonStreamingParams(params);

  for (let step = 1; step <= maxSteps; step += 1) {
    const response = await client.responses.create(request);
    const toolCalls = extractFunctionToolCalls(response);
    const done = toolCalls.length === 0;

    await params.onStep?.({
      step,
      text: response.output_text,
      toolCalls,
      done,
    });

    allToolCalls.push(...toolCalls);

    if (done) {
      return {
        text: response.output_text,
        raw: response,
        steps: step,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
      };
    }

    const input: OpenAI.Responses.ResponseInputItem[] = []

    for (const toolCall of toolCalls) {
      await params.onToolCall?.(toolCall);

      const handler = getHandler(params.handlers, toolCall.name);
      const output = await handler(toolCall.parsedArguments);
      const toolResult: ToolResultRecord = {
        id: toolCall.id,
        name: toolCall.name,
        output,
      };

      allToolResults.push(toolResult);
      await params.onToolResult?.(toolResult);

      input.push({
        type: 'function_call_output',
        call_id: toolCall.id,
        output: serializeToolOutput(output),
      })
    }

    request = createNextRequest(params, response, input)
  }

  throw new Error(`Tool execution exceeded maxSteps (${maxSteps}).`)
}

function extractFunctionToolCalls(
  response: OpenAI.Responses.Response,
): ToolCallRecord[] {
  return response.output
    .filter(
      (item): item is OpenAI.Responses.ResponseFunctionToolCall =>
        item.type === 'function_call',
    )
    .map(toolCall => ({
      id: toolCall.call_id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      parsedArguments: parseToolArguments(toolCall.name, toolCall.arguments),
    }))
}

function createNextRequest(
  params: CallResponseToolsParams,
  response: OpenAI.Responses.Response,
  input: OpenAI.Responses.ResponseInputItem[],
): OpenAI.Responses.ResponseCreateParamsNonStreaming {
  return createNonStreamingParams({
    ...params,
    input,
    previous_response_id: response.id,
  })
}
