import { callResponseStream } from 'openai-api-helpers/responses'
import { getOptionalBaseUrl, getResponsesModel, requireApiKey } from '../shared.js'

async function main() {
  await callResponseStream({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getResponsesModel(),
    input: 'Explain backpressure in three short bullets.',
    instructions: 'Be brief and practical.',
    onChunk(chunk) {
      process.stdout.write(chunk)
    },
    onDone() {
      process.stdout.write('\n')
    },
  })
}

void main()
