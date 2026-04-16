import { callChatCompletion } from 'openai-api-helpers/chat'
import { API_KEY, BASE_URL, MODEL, printSection } from '../shared/index.js'
import { userMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userMessage)

  const result = await callChatCompletion({
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

  printSection('assistantMessage', result.text)
  printSection('assistantMessage', result.raw.id)
}

void main()
