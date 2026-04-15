import { access } from 'node:fs/promises'
import path from 'node:path'
import process from 'node:process'
import { fileURLToPath, pathToFileURL } from 'node:url'

const exampleModules = {
  'chat/text': './chat/text.ts',
  'chat/json': './chat/json.ts',
  'chat/stream': './chat/stream.ts',
  'chat/tool-once': './chat/tool-once.ts',
  'chat/tools-loop': './chat/tools-loop.ts',
  'responses/text': './responses/text.ts',
  'responses/json': './responses/json.ts',
  'responses/stream': './responses/stream.ts',
  'responses/tool-once': './responses/tool-once.ts',
  'responses/tools-loop': './responses/tools-loop.ts',
} as const

async function ensureDistExists(): Promise<void> {
  const cwd = process.cwd()
  const distIndex = path.join(cwd, 'dist', 'index.js')

  try {
    await access(distIndex)
  } catch {
    console.error('Missing dist output. Run `npm run build` first.')
    process.exit(1)
  }
}

function printUsage(): void {
  console.warn('Usage:')
  console.warn('- tsx examples/index.ts <example>')
  console.warn('- npm run dev -- <example>')
  console.warn('\nAvailable examples:')

  for (const key of Object.keys(exampleModules)) {
    console.warn(`- ${key}`)
  }

  console.warn('\nRequired environment variables:')
  console.warn('- OPENAI_API_KEY')
  console.warn('\nOptional environment variables:')
  console.warn('- OPENAI_BASE_URL')
  console.warn('- OPENAI_MODEL_CHAT')
  console.warn('- OPENAI_MODEL_RESPONSES')
}

async function main(): Promise<void> {
  const exampleName = process.argv[2]

  if (!exampleName) {
    printUsage()
    process.exit(1)
  }

  const examplePath = exampleModules[exampleName as keyof typeof exampleModules]
  if (!examplePath) {
    console.error(`Unknown example: ${exampleName}`)
    printUsage()
    process.exit(1)
  }

  await ensureDistExists()

  const currentFilePath = fileURLToPath(import.meta.url)
  const currentDir = path.dirname(currentFilePath)
  const moduleUrl = pathToFileURL(path.join(currentDir, examplePath)).href
  await import(moduleUrl)
}

void main()
