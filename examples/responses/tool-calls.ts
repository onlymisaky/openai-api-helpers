import { callResponseToolCalls } from 'openai-api-helpers/responses'
import { API_KEY, BASE_URL, MODEL_RESPONSES, printSection } from '../shared/index.js'
import { userToolCallsMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userToolCallsMessage)

  const result = await callResponseToolCalls({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL_RESPONSES,
    input: userToolCallsMessage,
    tools: [
      {
        type: 'function',
        name: 'add_numbers',
        description: '计算两数之和',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
          additionalProperties: false,
        },
        strict: true,
      },
    ],
  })

  printSection('toolCalls', result.toolCalls)
  printSection('done', result.done)
  printSection('assistantMessage', result.text)
}

void main()
