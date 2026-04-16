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

### Examples

examples 通过包导出消费 `dist` 产物，因此先构建：

```bash
npm run build
```

然后通过分发入口运行某个示例：

```bash
npm run example -- chat/json
npm run example -- responses/tools-loop
```

可选示例名：

- `chat/text`
- `chat/json`
- `chat/stream`
- `chat/tool-calls`
- `chat/tools-loop`
- `responses/text`
- `responses/json`
- `responses/stream`
- `responses/tool-calls`
- `responses/tools-loop`

可选环境变量：

- `OPENAI_API_KEY`
- `OPENAI_BASE_URL`
- `OPENAI_MODEL_CHAT`
- `OPENAI_MODEL_RESPONSES`

### Responses API

#### 普通文本

[examples/responses/text.ts](examples/responses/text.ts)

#### JSON 对象

[examples/responses/json.ts](examples/responses/json.ts)

如果不传 `text.format`，封装层会自动补一个宽松的 object schema，然后继续把结果解析成 JSON 对象。

JSON 解析失败时不会直接抛错，而是返回：

- `data: null`
- `parseError.message`
- `parseError.preview`

如果显式传入 `text.format.type === 'json_schema'`，封装层会在 JSON 解析成功后，再用 `Ajv` 按该 schema 做一次运行时校验：

- schema 匹配：`data` 保留，`schemaError === null`
- schema 不匹配：`data` 仍然保留，`schemaError` 包含校验失败信息

#### 流式文本

[examples/responses/stream.ts](examples/responses/stream.ts)

#### 工具调用

只返回 toolCalls：

[examples/responses/tool-calls.ts](examples/responses/tool-calls.ts)

自动循环执行：

[examples/responses/tools-loop.ts](examples/responses/tools-loop.ts)

### Chat Completions API

#### 普通文本

[examples/chat/text.ts](examples/chat/text.ts)

#### JSON 对象

[examples/chat/json.ts](examples/chat/json.ts)

如果不传 `response_format`，封装层默认使用 `{ type: 'json_object' }`。

解析时会尽量从文本中提取 JSON 对象：

- 优先直接解析完整输出
- 支持从 code fence 中提取 JSON
- 支持从混杂文本中提取一个平衡的 JSON 对象子串

如果最终仍无法解析，会返回 `data: null` 和 `parseError`，而不是直接抛错。

如果显式传入 `response_format.type === 'json_schema'`，封装层会在 JSON 解析成功后，再用 `Ajv` 按该 schema 做一次运行时校验：

- schema 匹配：`data` 保留，`schemaError === null`
- schema 不匹配：`data` 仍然保留，`schemaError` 包含校验失败信息

#### 流式文本

[examples/chat/stream.ts](examples/chat/stream.ts)

#### 工具调用

只返回 toolCalls：

[examples/chat/tool-calls.ts](examples/chat/tool-calls.ts)

自动循环执行：

[examples/chat/tools-loop.ts](examples/chat/tools-loop.ts)

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
  data: TData | null;
  parseError: {
    message: string;
    preview: string;
  } | null;
  schemaError: {
    message: string;
    preview: string;
  } | null;
  raw: TRaw;
}
```

流式文本：

- 传 `onChunk` 时，返回 `Promise<string>`
- 不传 `onChunk` 时，返回 `Promise<AsyncGenerator<string, void, unknown>>`
- `onStart` 会在第一个非空文本 chunk 到达前触发一次
- `onChunk(chunk, index)` 的 `index` 从 `0` 开始，只统计实际输出的文本 chunk

`raw` 保持统一命名，方便两组 API 在排错时都能直接读取原始响应对象。

工具调用：

```ts
interface ToolCallsResult<TRaw> {
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

说明：`call...ToolCalls` 只“请求一次并返回 toolCalls”，不会执行 handler；`call...ToolsLoop` 会自动执行 handler 并循环直到 done。

## 类型说明

主要导出类型：

- `OpenAIClientOptions`
- `CallChatCompletionParams`
- `CallChatCompletionJsonParams`
- `CallChatCompletionStreamParams`
- `CallChatCompletionToolCallsParams`
- `CallChatCompletionToolsLoopParams`
- `CallResponseParams`
- `CallResponseJsonParams`
- `CallResponseStreamParams`
- `CallResponseToolCallsParams`
- `CallResponseToolsLoopParams`
- `ToolHandler`
- `ToolHandlerMap`

其中：

- `OpenAIClientOptions` 只放 client 初始化相关字段：`apiKey`、`baseURL`、`organization`、`project`、`client`
- Chat 和 Responses 的请求字段完全分开，不再共享 `input` / `system` / `maxTokens` 这类中间命名


## 默认行为

- 默认模型：`gpt-4.1-mini`
- 默认 API Key：优先读取 `OPENAI_API_KEY`
- `callChatCompletionJson` 固定 `n: 1`
- `callChatCompletionToolCalls` 固定 `n: 1`
- `callChatCompletionToolsLoop` 固定 `n: 1`
- `callResponseJson` 会把 JSON-only prompt 追加到 `instructions`
- `callChatCompletionJson` 会把 JSON-only prompt 注入到“最新一段 user 消息”之前；如果最后一条不是 `user`，则追加到末尾
- 显式传入 `json_schema` 时，`callResponseJson` 和 `callChatCompletionJson` 都会在 JSON 解析成功后继续做一次 Ajv schema 校验；schema 不匹配时保留 `data`，并通过 `schemaError` 返回错误
- 工具调用默认 `maxSteps` 为 `8`

## 当前限制

- `callChatCompletionJson` 只支持单 choice JSON 结果
- `callChatCompletionJson` 只接受 JSON 对象；顶层数组会被视为解析失败
- `callResponseJson` 只接受 JSON 对象
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
