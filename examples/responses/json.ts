import { callResponseJson } from 'openai-api-helpers/responses'
import { getOptionalBaseUrl, getResponsesModel, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callResponseJson<{
    summary: string
    keywords: string[]
  }>({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getResponsesModel(),
    input: 'Summarize what JSON Schema is for API responses.',
    instructions: 'Return only structured data.',
    text: {
      format: {
        type: 'json_schema',
        name: 'schema_summary',
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
