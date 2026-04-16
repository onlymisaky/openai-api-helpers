import { callChatCompletionJson } from 'openai-api-helpers/chat'
import { API_KEY, BASE_URL, MODEL, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'
import { schema } from '../shared/schema.js'

async function main() {
  printSection('userMessage', userMessage)

  const result = await callChatCompletionJson<{
    model: string
    version: string
    latest: string
    features: string[]
  }>({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
    response_format: {
      type: 'json_schema',
      json_schema: {
        name: 'schema_summary',
        strict: true,
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
