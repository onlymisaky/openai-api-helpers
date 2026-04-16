export const BASE_URL = process.env.OPENAI_BASE_URL ?? ''
export const API_KEY = process.env.OPENAI_API_KEY ?? ''
export const MODEL = process.env.OPENAI_MODEL_CHAT ?? ''
export const MODEL_RESPONSES = process.env.OPENAI_MODEL_RESPONSES ?? ''

export function printSection(title: string, value: unknown): void {
  console.warn(`\n[${title}]`)

  if (typeof value === 'string') {
    process.stdout.write(`${value}\n`)
    return
  }

  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}
