import { callResponseToolOnce } from 'openai-api-helpers/responses'
import { getOptionalBaseUrl, getResponsesModel, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callResponseToolOnce({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getResponsesModel(),
    input: 'Call the add_numbers tool once for 13 and 29, and do not explain the answer.',
    tools: [
      {
        type: 'function',
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
        strict: true,
      },
    ],
  })

  printSection('done', result.done)
  printSection('toolCalls', result.toolCalls)
  printSection('text', result.text)
}

void main()
