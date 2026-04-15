import { callResponseTools } from 'openai-api-helpers/responses'
import { getOptionalBaseUrl, getResponsesModel, printSection, requireApiKey } from '../shared.js'

async function main() {
  const result = await callResponseTools({
    apiKey: requireApiKey(),
    baseURL: getOptionalBaseUrl(),
    model: getResponsesModel(),
    input: 'Find the weather for Shanghai and then tell me if I should bring an umbrella.',
    tools: [
      {
        type: 'function',
        name: 'get_weather',
        description: 'Get the current mock weather for a city.',
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
    },
  })

  printSection('steps', result.steps)
  printSection('toolCalls', result.toolCalls)
  printSection('toolResults', result.toolResults)
  printSection('text', result.text)
}

void main()
