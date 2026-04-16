import { callResponse } from 'openai-api-helpers/responses'
import { API_KEY, BASE_URL, MODEL_RESPONSES, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userMessage)

  const result = await callResponse({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL_RESPONSES,
    input: userMessage,
  })

  printSection('assistantMessage', result.text)
  printSection('responseId', result.raw.id)
}

void main()
