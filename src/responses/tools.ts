import type {
  Response,
  ResponseCreateParamsNonStreaming,
  ResponseFunctionToolCall,
  ResponseInputItem,
} from 'openai/resources/responses/responses';
import type { ToolCallRecord, ToolResultRecord } from '../shared/tools';
import type {
  CallResponseToolOnceParams,
  CallResponseToolOnceResult,
  CallResponseToolsParams,
  CallResponseToolsResult,
} from './types';
import { getClient } from '../shared/client';
import {
  getHandler,
  getMaxSteps,
  parseToolArguments,
  serializeToolOutput,
} from '../shared/tools';
import { createNonStreamingParams } from './client';

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

    const input: ResponseInputItem[] = []

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

function extractFunctionToolCalls(response: Response): ToolCallRecord[] {
  return response.output
    .filter((item): item is ResponseFunctionToolCall => item.type === 'function_call')
    .map(toolCall => ({
      id: toolCall.call_id,
      name: toolCall.name,
      arguments: toolCall.arguments,
      parsedArguments: parseToolArguments(toolCall.name, toolCall.arguments),
    }))
}

function createNextRequest(
  params: CallResponseToolsParams,
  response: Response,
  input: ResponseInputItem[],
): ResponseCreateParamsNonStreaming {
  return createNonStreamingParams({
    ...params,
    input,
    previous_response_id: response.id,
  })
}
