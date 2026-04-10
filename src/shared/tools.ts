export interface ToolCallRecord {
  id: string;
  name: string;
  arguments: string;
  parsedArguments: Record<string, unknown>;
}

export interface ToolResultRecord {
  id: string;
  name: string;
  output: unknown;
}

export interface ToolStepEvent {
  step: number;
  text: string;
  toolCalls: ToolCallRecord[];
  done: boolean;
}

export interface ToolExecutionOptions {
  maxSteps?: number;
  onStep?: (event: ToolStepEvent) => void | Promise<void>;
  onToolCall?: (toolCall: ToolCallRecord) => void | Promise<void>;
  onToolResult?: (toolResult: ToolResultRecord) => void | Promise<void>;
}

export type ToolHandler = (
  args: Record<string, unknown>,
) => Promise<unknown> | unknown

export type ToolHandlerMap = Record<string, ToolHandler>

export const DEFAULT_MAX_TOOL_STEPS = 8

export function parseToolArguments(
  toolName: string,
  rawArguments: string,
): Record<string, unknown> {
  let parsed: unknown

  try {
    parsed = JSON.parse(rawArguments)
  }
  catch (error) {
    throw new Error(
      `Tool "${toolName}" returned invalid JSON arguments: ${getErrorMessage(error)}`,
    )
  }

  if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
    throw new Error(
      `Tool "${toolName}" arguments must decode to a JSON object.`,
    )
  }

  return parsed as Record<string, unknown>
}

export function getMaxSteps(maxSteps?: number): number {
  if (maxSteps == null) {
    return DEFAULT_MAX_TOOL_STEPS
  }

  if (!Number.isInteger(maxSteps) || maxSteps <= 0) {
    throw new Error('`maxSteps` must be a positive integer.')
  }

  return maxSteps
}

export function getHandler(
  handlers: ToolHandlerMap,
  toolName: string,
): ToolHandler {
  const handler = handlers[toolName]

  if (!handler) {
    throw new Error(`Missing tool handler for "${toolName}".`)
  }

  return handler
}

export function serializeToolOutput(output: unknown): string {
  if (typeof output === 'string') {
    return output
  }

  if (output == null) {
    return String(output)
  }

  try {
    return JSON.stringify(output)
  }
  catch {
    return String(output)
  }
}

function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error)
}
