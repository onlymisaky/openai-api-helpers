import { callResponseJson } from 'openai-api-helpers/responses'
import { API_KEY, BASE_URL, MODEL_RESPONSES, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'
import { schema } from '../shared/schema.js'

async function main() {
  printSection('userMessage', userMessage)

  const result = await callResponseJson<{
    model: string
    version: string
    latest: string
    features: string[]
  }>({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL_RESPONSES,
    input: userMessage,
    text: {
      format: {
        type: 'json_schema',
        name: 'schema_summary',
        schema,
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

  printSection('assistantMessage', result.data)
}

void main()
