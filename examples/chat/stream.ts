import { callChatCompletionStream } from 'openai-api-helpers/chat'
import { getChatModel, getOptionalBaseUrl, requireApiKey } from '../shared.js'

async function main() {
  const stream = await callChatCompletionStream({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getChatModel(),
    messages: [
      {
        role: 'user',
        content: 'Explain backpressure in three short bullets.',
      },
    ],
  })

  for await (const chunk of stream) {
    process.stdout.write(chunk)
  }

  process.stdout.write('\n')
}

void main()
