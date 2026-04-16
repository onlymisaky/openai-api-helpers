import { callResponseToolsLoop } from 'openai-api-helpers/responses'
import { API_KEY, BASE_URL, MODEL_RESPONSES, printSection } from '../shared/index.js'
import { userToolsLoopMessage } from '../shared/messages.js'

async function main() {
  printSection('userMessage', userToolsLoopMessage)

  const result = await callResponseToolsLoop({
    apiKey: API_KEY,
    baseURL: BASE_URL,
    model: MODEL_RESPONSES,
    input: userToolsLoopMessage,
    tools: [
      {
        type: 'function',
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
        strict: true,
      },
      {
        type: 'function',
        name: 'get_time',
        description: '获取当前时间',
        parameters: {
          type: 'object',
          properties: {},
          additionalProperties: false,
        },
        strict: false,
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
