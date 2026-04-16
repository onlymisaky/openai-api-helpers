export const schema = {
  type: 'object',
  properties: {
    model: { type: 'string' },
    version: { type: 'string' },
    latest: { type: 'string' },
    features: {
      type: 'array',
      items: { type: 'string' },
    },
  },
  required: ['model', 'version', 'latest', 'features'],
  additionalProperties: false,
}
