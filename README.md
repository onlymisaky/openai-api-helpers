# OpenAI API Helpers

一个轻量 OpenAI API 封装，提供两种风格，四个高频调用场景。

两种风格：

- `Responses API` 风格： `client.responses.create(...)`
- `Chat Completions API` 风格： `client.chat.completions.create(...)`

四个高频调用场景：

- `普通文本`
- `JSON` 对象
- `流式文本`
- `function tools` 的单轮调用与自动循环执行


## 设计原则

这不是统一抽象层，而是两套官方 API 的薄封装。

因此两个 API 风格刻意不共享一套入参：

- `Responses API` 风格使用 `input` / `instructions` / `text` / `max_output_tokens` / `tools`
- `Chat Completions API` 风格使用 `messages` / `response_format` / `max_completion_tokens` / `tools`
- 自动工具循环额外使用 `handlers` / `maxSteps`

这样做的目标是减少调用方的二次映射成本。你可以直接参考官方文档和 SDK 类型来使用这层封装。

## 快速开始

```bash
npm install openai openai-api-helpers
```

### Responses API

#### 普通文本

```ts
import { callResponse } from 'openai-api-helpers/responses';

const result = await callResponse({
  input: '用一句话解释 TypeScript 的作用',
  instructions: '你是一个简洁的技术助手',
  text: {
    verbosity: 'low',
  },
});

console.log(result.text);
console.log(result.raw.id);
```

#### JSON 对象

```ts
import { callResponseJson } from 'openai-api-helpers/responses';

const result = await callResponseJson<{
  title: string;
  tags: string[];
}>({
  input: '为文章生成标题和标签：介绍 Node.js 流式处理',
  instructions: '只输出结构化结果',
  text: {
    format: {
      type: 'json_schema',
      name: 'article_metadata',
      strict: true,
      schema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          tags: {
            type: 'array',
            items: { type: 'string' },
          },
        },
        required: ['title', 'tags'],
        additionalProperties: false,
      },
    },
  },
});

console.log(result.data.title);
```

如果不传 `text.format`，封装层会自动补一个宽松的 object schema，然后继续把结果解析成 JSON 对象。

#### 流式文本

```ts
import { callResponseStream } from 'openai-api-helpers/responses';

await callResponseStream({
  input: '写一段简短的产品介绍',
  instructions: '保持自然、简洁',
  onChunk(chunk) {
    process.stdout.write(chunk);
  },
  onDone(fullText) {
    console.log('\n---');
    console.log(fullText.length);
  },
});
```

#### 工具调用

```ts
import { callResponseTools } from 'openai-api-helpers/responses';

const result = await callResponseTools({
  input: '查询上海今天的天气，然后给出穿衣建议',
  tools: [
    {
      type: 'function',
      name: 'get_weather',
      description: '查询天气',
      strict: true,
      parameters: {
        type: 'object',
        properties: {
          city: { type: 'string' },
        },
        required: ['city'],
        additionalProperties: false,
      },
    },
  ],
  handlers: {
    get_weather({ city }) {
      return {
        city,
        condition: 'sunny',
        temperatureC: 26,
      };
    },
  },
});

console.log(result.text);
console.log(result.toolCalls.length);
```

### Chat Completions API

#### 普通文本

```ts
import { callChatCompletion } from 'openai-api-helpers/chat';

const result = await callChatCompletion({
  messages: [
    {
      role: 'developer',
      content: '你是一个简洁的技术助手',
    },
    {
      role: 'user',
      content: '继续使用 Chat Completions 完成一次普通文本调用',
    },
  ],
});

console.log(result.text);
console.log(result.raw.choices.length);
```

#### JSON 对象

```ts
import { callChatCompletionJson } from 'openai-api-helpers/chat';

const result = await callChatCompletionJson<{
  summary: string;
}>({
  messages: [
    {
      role: 'user',
      content: '总结一下什么是流式输出',
    },
  ],
  response_format: {
    type: 'json_object',
  },
});

console.log(result.data.summary);
```

如果不传 `response_format`，封装层默认使用 `{ type: 'json_object' }`。

#### 流式文本

```ts
import { callChatCompletionStream } from 'openai-api-helpers/chat';

const stream = await callChatCompletionStream({
  messages: [
    {
      role: 'user',
      content: '逐步解释什么是 backpressure',
    },
  ],
});

for await (const chunk of stream) {
  process.stdout.write(chunk);
}
```

#### 工具调用

```ts
import { callChatCompletionTools } from 'openai-api-helpers/chat';

const result = await callChatCompletionTools({
  messages: [
    {
      role: 'user',
      content: '把 13 和 29 相加，然后告诉我结果',
    },
  ],
  tools: [
    {
      type: 'function',
      function: {
        name: 'add_numbers',
        description: '返回两个整数的和',
        parameters: {
          type: 'object',
          properties: {
            a: { type: 'number' },
            b: { type: 'number' },
          },
          required: ['a', 'b'],
          additionalProperties: false,
        },
      },
    },
  ],
  handlers: {
    add_numbers({ a, b }) {
      return Number(a) + Number(b);
    },
  },
});

console.log(result.text);
console.log(result.steps);
```

## 返回值类型

普通文本：

```ts
interface TextResult<T> {
  text: string;
  raw: T;
}
```

JSON 对象：

```ts
interface JsonResult<TData, TRaw> {
  data: TData;
  raw: TRaw;
}
```

流式文本：

- 传 `onChunk` 时，返回 `Promise<string>`
- 不传 `onChunk` 时，返回 `Promise<AsyncGenerator<string, void, unknown>>`

`raw` 保持统一命名，方便两组 API 在排错时都能直接读取原始响应对象。

工具调用：

```ts
interface ToolOnceResult<TRaw> {
  text: string;
  raw: TRaw;
  toolCalls: ToolCallRecord[];
  done: boolean;
}

interface ToolLoopResult<TRaw> {
  text: string;
  raw: TRaw;
  steps: number;
  toolCalls: ToolCallRecord[];
  toolResults: ToolResultRecord[];
}
```

## 类型说明

主要导出类型：

- `OpenAIClientOptions`
- `CallChatCompletionParams`
- `CallChatCompletionJsonParams`
- `CallChatCompletionStreamParams`
- `CallChatCompletionToolOnceParams`
- `CallChatCompletionToolsParams`
- `CallResponseParams`
- `CallResponseJsonParams`
- `CallResponseStreamParams`
- `CallResponseToolOnceParams`
- `CallResponseToolsParams`
- `ToolHandler`
- `ToolHandlerMap`

其中：

- `OpenAIClientOptions` 只放 client 初始化相关字段：`apiKey`、`baseURL`、`organization`、`project`、`client`
- Chat 和 Responses 的请求字段完全分开，不再共享 `input` / `system` / `maxTokens` 这类中间命名


## 默认行为

- 默认模型：`gpt-4.1-mini`
- 默认 API Key：优先读取 `OPENAI_API_KEY`
- `callChatCompletionJson` 固定 `n: 1`
- `callChatCompletionToolOnce` 固定 `n: 1`
- `callChatCompletionTools` 固定 `n: 1`
- `callResponseJson` 会把 JSON-only prompt 追加到 `instructions`
- `callChatCompletionJson` 会把 JSON-only prompt 追加为一条额外 `developer` message
- 工具调用默认 `maxSteps` 为 `8`

## 当前限制

- `callChatCompletionJson` 只支持单 choice JSON 结果
- `callChatCompletionStream` 当前只消费 `choices[0]?.delta?.content`
- `callResponseStream` 当前只消费 `response.output_text.delta`
- 工具调用自动循环当前只支持 function tools，不执行 hosted tools
- 没有内建重试、超时、日志和监控

## 版本支持

- Node.js `>= 18`
- `ESM` 和 `CJS`
- `openai` 版本 `>=6.0.0 <7`
- 已验证的 `openai` 版本：`6.0.0`、`6.34.0`

## 维护者发布流程

- 需要发布的变更，请先运行 `npm run changeset` 生成一个 `.changeset/*.md`
- 带有 changeset 的 PR 合并到 `master` 后，GitHub Actions 会自动：
  - 运行 `check`、`build`、`smoke:consume`
  - 执行 `changeset version`
  - 更新 `package.json`、`package-lock.json`、`CHANGELOG.md`
  - 推送 release commit 和 `v<version>` tag
  - 通过 GitHub OIDC trusted publishing 发布 npm 包
- 没有 changeset 的提交仍会跑校验，但不会发布 npm
