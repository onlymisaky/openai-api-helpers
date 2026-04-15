import { callChatCompletion } from 'openai-api-helpers/chat'
import { getChatModel, getOptionalBaseUrl, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callChatCompletion({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getChatModel(),
    messages: [
      {
        role: 'developer',
        content: 'You are a concise technical assistant.',
      },
      {
        role: 'user',
        content: 'Use one sentence to explain why structured output is useful.',
      },
    ],
  })

  printSection('text', result.text)
  printSection('choiceCount', result.raw.choices.length)
}

void main()
