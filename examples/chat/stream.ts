import { callChatCompletionStream } from 'openai-api-helpers/chat'
import { API_KEY, BASE_URL, MODEL, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userMessage)

  const stream = await callChatCompletionStream({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: userMessage,
      },
    ],
  })

  printSection('assistantMessage', '')

  for await (const chunk of stream) {
    process.stdout.write(chunk)
  }

  process.stdout.write('\n')
}

void main()
