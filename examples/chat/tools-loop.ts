import { callChatCompletionToolsLoop } from 'openai-api-helpers/chat'
import { API_KEY, BASE_URL, MODEL, printSection } from '../shared/index.js'
import { userToolsLoopMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userToolsLoopMessage)

  const result = await callChatCompletionToolsLoop({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL,
    messages: [
      {
        role: 'user',
        content: userToolsLoopMessage,
      },
    ],
    tools: [
      {
        type: 'function',
        function: {
          name: 'get_weather',
          description: '获取城市的天气',
          parameters: {
            type: 'object',
            properties: {
              city: { type: 'string' },
            },
            required: ['city'],
            additionalProperties: false,
          },
        },
      },
      {
        type: 'function',
        function: {
          name: 'get_time',
          description: '获取当前时间',
          parameters: {
            type: 'object',
            properties: {},
            additionalProperties: false,
          },
        },
      },
    ],
    handlers: {
      get_weather({ city }) {
        return {
          city,
          condition: 'rainy',
          temperatureC: 19,
          umbrella: true,
        }
      },
      get_time() {
        return new Date().toLocaleString()
      },
    },
  })

  printSection('steps', result.steps)
  printSection('toolCalls', result.toolCalls)
  printSection('toolResults', result.toolResults)
  printSection('assistantMessage', result.text)
}

void main()
