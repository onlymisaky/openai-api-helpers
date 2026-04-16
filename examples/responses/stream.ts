import { callResponseStream } from 'openai-api-helpers/responses'
import { API_KEY, BASE_URL, MODEL_RESPONSES, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userMessage)

  await callResponseStream({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL_RESPONSES,
    input: userMessage,
    onChunk(chunk, index) {
      if (index === 0) {
        printSection('assistantMessage', '')
      }
      process.stdout.write(chunk)
    },
    onDone() {
      process.stdout.write('\n')
    },
  })
}

void main()
