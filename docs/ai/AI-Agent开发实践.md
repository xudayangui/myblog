---
title: AI Agent 开发实践：从 Function Calling 到多智能体协作
date: 2025-07-22
tags:
 - AI
 - Agent
 - 实践
categories:
 - 人工智能
---

如果说 2024 年是"对话式 AI"的元年，2025 年就是 Agent 之年。Agent 和大模型的区别是：大模型只能"说"，Agent 能"做"——它能调用工具、访问数据、执行多步任务直到完成目标。这篇讲 Agent 的核心机制和工程落地。

## Agent 的基本循环

所有 Agent 框架，剥开外壳都是同一个循环：

```
观察（Observation）→ 思考（Reasoning）→ 行动（Action）→ 观察结果 → 循环
```

模型接收当前状态，决定下一步做什么（调用哪个工具、传什么参数），工具执行后把结果喂回模型，模型再决定下一步——直到它认为任务完成。

这个模式叫 **ReAct**（Reasoning + Acting）。理解了这个循环，你就理解了 LangChain、AutoGPT、Function Calling 的全部底层逻辑。

## Function Calling：Agent 的手

现代大模型 API 都支持 Function Calling——你把可用工具的定义（名称、参数 schema、说明）传给模型，模型在需要时会返回"我要调用某个工具，参数是这些"的结构化输出，而不是普通文本。

```ts
const tools = [{
  type: 'function',
  function: {
    name: 'get_weather',
    description: '获取指定城市的天气',
    parameters: {
      type: 'object',
      properties: { city: { type: 'string' } },
      required: ['city']
    }
  }
}]

// 模型可能返回：
// { name: 'get_weather', arguments: { city: '杭州' } }
```

关键点：

- **工具描述写得好不好，直接决定调用准确率**。说明里要写清楚什么时候用、参数含义、返回什么。
- 工具执行结果要作为新消息喂回模型，它才能继续推理。
- 不是模型真的"执行"了函数——它只是提出调用请求，执行在你的代码里。

## 一个最小的 Agent 实现

```ts
async function agent(userQuery: string, maxSteps = 10) {
  const messages = [{ role: 'user', content: userQuery }]

  for (let i = 0; i < maxSteps; i++) {
    const res = await llm.chat({ messages, tools })

    if (!res.toolCalls?.length) {
      return res.content  // 没有工具调用 = 任务完成
    }

    messages.push({ role: 'assistant', tool_calls: res.toolCalls })

    for (const call of res.toolCalls) {
      const result = await executeTool(call.name, call.arguments)
      messages.push({
        role: 'tool',
        tool_call_id: call.id,
        content: JSON.stringify(result)
      })
    }
  }
  throw new Error('超出最大步数')
}
```

`set maxSteps` 是必须的安全阀——防止模型陷入死循环（工具 A 的输出触发工具 B，B 的输出又触发 A）。

## 工程落地的关键问题

**1. 工具设计的粒度**

太细（"读取文件第 1 行"、"读取文件第 2 行"）会导致调用次数爆炸；太粗（"处理一切"）会让模型难以正确传参。经验法则：一个工具对应一个明确的业务动作。

**2. 错误处理要给模型看**

工具失败时，不要只记日志，要把错误信息喂回模型，让它自己决定重试还是换策略：

```ts
{ role: 'tool', content: '错误：城市不存在，请检查输入' }
```

模型看到后会重新规划——这正是 Agent 比固定流程灵活的地方。

**3. 成本控制**

每一步都是一次 LLM 调用。复杂任务跑 20 步，token 消耗惊人。优化手段：

- 简单决策用规则而非模型
- 给工具返回精简结果（不要返回整个网页）
- 设置步数和 token 上限
- 用更便宜的模型做工具选择，贵模型做最终回答

**4. 可观测性**

Agent 的执行过程必须可追溯。每一步的思考、工具调用、返回结果都要记录。出了问题你能复盘"它为什么在第 5 步选错了工具"，而不是面对一个黑盒。

## 多智能体协作

单个 Agent 能力有上限，多 Agent 分工是进阶方向：

- **角色分工**：Planner（拆解任务）、Executor（执行）、Critic（审查结果）
- **通信机制**：通过共享消息列表或显式的消息传递协调
- **典型模式**：一个 Agent 写代码，另一个 Agent 审查，发现问题打回重做

但要警惕：多 Agent 不是越多越好。协调开销、错误累积、成本翻倍都是真实代价。**能用单 Agent + 好工具解决的，不要上多 Agent**。

## 何时不该用 Agent

Agent 适合"路径不确定、需要动态决策"的任务。如果你的业务流程是固定的（A 做完做 B，B 做完做 C），直接写工作流代码——更可靠、更快、更便宜。

判断标准：**如果连你都说不清下一步该干什么，才需要 Agent 帮你决定**。

## 小结

Agent = 大模型 + 工具 + 循环 + 记忆。核心技术是 Function Calling 和 ReAct 模式，工程难点在工具设计、成本控制、错误处理和可观测性。

从最简单的单 Agent + 两三个工具开始，跑通闭环，再逐步加复杂度——这是最务实的路径。别一上来就搞 AutoGPT 式的"全自动通用智能体"，那是科研不是工程。
