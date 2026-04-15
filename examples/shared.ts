export function requireApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY

  if (!apiKey) {
    console.error('Missing OPENAI_API_KEY')
    process.exit(1)
  }

  return apiKey
}

export function getOptionalBaseUrl(): string | undefined {
  return process.env.OPENAI_BASE_URL || undefined
}

export function getChatModel(): string | undefined {
  return process.env.OPENAI_MODEL_CHAT || undefined
}

export function getResponsesModel(): string | undefined {
  return process.env.OPENAI_MODEL_RESPONSES || undefined
}

export function printSection(title: string, value: unknown): void {
  console.warn(`\n[${title}]`)

  if (typeof value === 'string') {
    process.stdout.write(`${value}\n`)
    return
  }

  process.stdout.write(`${JSON.stringify(value, null, 2)}\n`)
}
