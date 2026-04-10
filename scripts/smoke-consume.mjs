import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = path.resolve(__dirname, '..');
const npmCmd = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const packageJson = JSON.parse(
  execFileSync('node', ['-p', 'JSON.stringify(require(\'./package.json\'))'], {
    cwd: repoRoot,
    encoding: 'utf8',
  }),
);
const packageName = packageJson.name;
const tempRoot = mkdtempSync(path.join(tmpdir(), 'openai-api-helpers-smoke-'));
const cacheDir = path.join(tempRoot, 'npm-cache');
const packDir = path.join(tempRoot, 'pack');
const consumerDir = path.join(tempRoot, 'consumer');

function run(command, args, cwd) {
  execFileSync(command, args, {
    cwd,
    stdio: 'inherit',
  });
}

try {
  mkdirSync(packDir, { recursive: true });
  mkdirSync(consumerDir, { recursive: true });

  run(npmCmd, ['pack', '--pack-destination', packDir, '--cache', cacheDir], repoRoot);

  const tarball = readdirSync(packDir).find(file => file.endsWith('.tgz'));
  if (!tarball) {
    throw new Error('Smoke test could not find packed tarball.');
  }

  writeFileSync(
    path.join(consumerDir, 'package.json'),
    JSON.stringify({
      name: 'smoke-consumer',
      private: true,
      type: 'module',
    }, null, 2),
  );

  run(
    npmCmd,
    [
      'install',
      '--no-package-lock',
      '--cache',
      cacheDir,
      '--legacy-peer-deps',
      path.join(repoRoot, 'node_modules', 'openai'),
      path.join(packDir, tarball),
    ],
    consumerDir,
  );

  writeFileSync(
    path.join(consumerDir, 'esm.mjs'),
    `
import { callChatCompletion, callResponse } from '${packageName}';
import { callChatCompletionStream } from '${packageName}/chat';
import { callResponseStream } from '${packageName}/responses';

if (
  typeof callChatCompletion !== 'function'
  || typeof callResponse !== 'function'
  || typeof callChatCompletionStream !== 'function'
  || typeof callResponseStream !== 'function'
) {
  throw new Error('ESM smoke import failed.');
}
`,
  );

  writeFileSync(
    path.join(consumerDir, 'cjs.cjs'),
    `
const root = require('${packageName}');
const chat = require('${packageName}/chat');
const responses = require('${packageName}/responses');

if (
  typeof root.callChatCompletion !== 'function'
  || typeof root.callResponse !== 'function'
  || typeof chat.callChatCompletionStream !== 'function'
  || typeof responses.callResponseStream !== 'function'
) {
  throw new Error('CJS smoke require failed.');
}
`,
  );

  writeFileSync(
    path.join(consumerDir, 'types.ts'),
    `
import { callResponse, type OpenAIClientOptions } from '${packageName}';
import type { CallChatCompletionParams } from '${packageName}/chat';
import type { CallResponseParams } from '${packageName}/responses';

const clientOptions: OpenAIClientOptions = {};
const responseParams: CallResponseParams = { input: 'hello' };
const chatParams: CallChatCompletionParams = {
  messages: [{ role: 'user', content: 'hello' }],
};

void clientOptions;
void responseParams;
void chatParams;
void callResponse;
`,
  );

  run('node', ['esm.mjs'], consumerDir);
  run('node', ['cjs.cjs'], consumerDir);
  run(
    process.execPath,
    [
      path.join(repoRoot, 'node_modules', 'typescript', 'bin', 'tsc'),
      '--noEmit',
      '--module',
      'NodeNext',
      '--moduleResolution',
      'NodeNext',
      '--target',
      'ES2022',
      'types.ts',
    ],
    consumerDir,
  );
} finally {
  rmSync(tempRoot, { recursive: true, force: true });
}
