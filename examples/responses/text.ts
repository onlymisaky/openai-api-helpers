import { callResponse } from 'openai-api-helpers/responses'
import { getOptionalBaseUrl, getResponsesModel, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callResponse({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getResponsesModel(),
    input: 'Use one sentence to explain why structured outputs are useful.',
    instructions: 'You are a concise technical assistant.',
  })

  printSection('text', result.text)
  printSection('responseId', result.raw.id)
}

void main()
