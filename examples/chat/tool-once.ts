import { callChatCompletionToolOnce } from 'openai-api-helpers/chat'
import { getChatModel, getOptionalBaseUrl, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callChatCompletionToolOnce({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getChatModel(),
    messages: [
      {
        role: 'user',
        content: 'Call the add_numbers tool once for 13 and 29, and do not explain the answer.',
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'add_numbers',
          description: 'Add two numbers together.',
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

  printSection('done', result.done)
  printSection('toolCalls', result.toolCalls)
  printSection('text', result.text)
}

void main()
