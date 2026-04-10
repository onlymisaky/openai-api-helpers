import type OpenAI from 'openai';
import type { ToolCallRecord, ToolResultRecord } from '../shared/tools.js';
import type {
  CallChatCompletionToolOnceParams,
  CallChatCompletionToolOnceResult,
  CallChatCompletionToolsParams,
  CallChatCompletionToolsResult,
} from './types.js';
import { getClient } from '../shared/client.js';
import {
  getHandler,
  getMaxSteps,
  parseToolArguments,
  serializeToolOutput,
} from '../shared/tools.js';
import { createNonStreamingParams } from './client.js';
import { extractChoiceTexts } from './json.js';

export async function callChatCompletionToolOnce(
  params: CallChatCompletionToolOnceParams,
): Promise<CallChatCompletionToolOnceResult> {
  const client = getClient(params);
  const response = await client.chat.completions.create({
    ...createNonStreamingParams(params),
    n: 1,
  });
  const toolCalls = extractFunctionToolCalls(response);

  return {
    text: extractChoiceTexts(response).filter(Boolean).join('\n\n'),
    raw: response,
    toolCalls,
    done: toolCalls.length === 0,
  };
}

export async function callChatCompletionTools(
  params: CallChatCompletionToolsParams,
): Promise<CallChatCompletionToolsResult> {
  const client = getClient(params);
  const maxSteps = getMaxSteps(params.maxSteps);
  const allToolCalls: ToolCallRecord[] = [];
  const allToolResults: ToolResultRecord[] = [];
  const messages = [...params.messages];

  for (let step = 1; step <= maxSteps; step += 1) {
    const response = await client.chat.completions.create({
      ...createNonStreamingParams({
        ...params,
        messages,
      }),
      n: 1,
    });
    const text = extractChoiceTexts(response).filter(Boolean).join('\n\n');
    const toolCalls = extractFunctionToolCalls(response);
    const done = toolCalls.length === 0;

    await params.onStep?.({
      step,
      text,
      toolCalls,
      done,
    });

    allToolCalls.push(...toolCalls);

    if (done) {
      return {
        text,
        raw: response,
        steps: step,
        toolCalls: allToolCalls,
        toolResults: allToolResults,
      };
    }

    const message = getFirstMessage(response);
    messages.push(toAssistantMessage(message));

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

      messages.push({
        role: 'tool',
        tool_call_id: toolCall.id,
        content: serializeToolOutput(output),
      });
    }
  }

  throw new Error(`Tool execution exceeded maxSteps (${maxSteps}).`)
}

function extractFunctionToolCalls(
  response: OpenAI.Chat.ChatCompletion,
): ToolCallRecord[] {
  const message = getFirstMessage(response)
  const toolCalls = message.tool_calls?.filter(
    (toolCall): toolCall is OpenAI.Chat.ChatCompletionMessageFunctionToolCall =>
      toolCall.type === 'function',
  ) ?? []

  return toolCalls.map(toolCall => ({
    id: toolCall.id,
    name: toolCall.function.name,
    arguments: toolCall.function.arguments,
    parsedArguments: parseToolArguments(
      toolCall.function.name,
      toolCall.function.arguments,
    ),
  }))
}

function getFirstMessage(response: OpenAI.Chat.ChatCompletion) {
  const message = response.choices[0]?.message

  if (!message) {
    throw new Error('Chat completion returned no choices.')
  }

  return message
}

function toAssistantMessage(
  message: OpenAI.Chat.ChatCompletion['choices'][number]['message'],
): OpenAI.Chat.ChatCompletionAssistantMessageParam {
  return {
    role: 'assistant',
    content: message.content,
    refusal: message.refusal,
    audio: message.audio,
    function_call: message.function_call,
    tool_calls: message.tool_calls,
  }
}
