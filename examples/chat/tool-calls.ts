import { callChatCompletionToolCalls } from 'openai-api-helpers/chat'
import { API_KEY, BASE_URL, MODEL, printSection } from '../shared/index.js'
import { userToolCallsMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userToolCallsMessage)

  const result = await callChatCompletionToolCalls({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: userToolCallsMessage,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
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
        },
      },
    ],
  })

  printSection('toolCalls', result.toolCalls)
  printSection('done', result.done)
  printSection('assistantMessage', result.text)
}

void main()
