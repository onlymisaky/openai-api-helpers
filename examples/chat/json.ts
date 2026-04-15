import { callChatCompletionJson } from 'openai-api-helpers/chat'
import { getChatModel, getOptionalBaseUrl, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callChatCompletionJson<{
    summary: string
    keywords: string[]
  }>({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getChatModel(),
    messages: [
      {
        role: 'user',
        content: 'Summarize what JSON Schema is for API responses.',
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'schema_summary',
        strict: true,
        schema: {
          type: 'object',
          properties: {
            summary: { type: 'string' },
            keywords: {
              type: 'array',
              items: { type: 'string' },
            },
          },
          required: ['summary', 'keywords'],
          additionalProperties: false,
        },
      },
    },
  })

  if (result.parseError) {
    printSection('parseError', result.parseError)
    return
  }

  if (result.schemaError) {
    printSection('schemaError', result.schemaError)
  }

  printSection('data', result.data)
}

void main()
