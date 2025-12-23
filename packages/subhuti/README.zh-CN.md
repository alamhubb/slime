# Subhuti

[![npm version](https://img.shields.io/npm/v/subhuti.svg)](https://www.npmjs.com/package/subhuti)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Subhuti (सुभूति)** - 轻量级、高性能的 PEG Parser Generator 框架，用 TypeScript 构建，专为快速开发编程语言解析器而设计。

**名称由来：** Subhuti（菩提祖师）是孙悟空的师父，寓意让编程语言转换如七十二变般灵活。

## ✨ 核心特性

### 🚀 高性能 Packrat Parsing
- **线性时间复杂度 O(n)**：通过 LRU 缓存避免重复解析
- **智能缓存管理**：自动清理过期缓存，内存占用可控
- **可选开关**：根据需求灵活启用/禁用缓存

### 🎯 PEG 风格语法（Parsing Expression Grammar）
- **顺序选择**：`Or` 规则按顺序尝试，第一个成功即返回
- **自动回溯**：失败时自动恢复状态，支持复杂语法
- **清晰语义**：程序员完全控制规则顺序，无二义性

### 🛡️ 智能错误管理（allowError 机制）
- **前 N-1 分支允许失败**：在 `Or` 规则中优雅处理失败
- **最后分支抛详细错误**：精确定位语法错误，附带完整上下文
- **RAII 模式管理**：自动恢复错误状态，避免手动管理

### 🎨 优雅的 TypeScript API
- **装饰器模式**：使用 `@SubhutiRule` 定义规则，代码简洁
- **强类型支持**：完整的 TypeScript 类型定义
- **链式调用**：流畅的 API 设计（`.cache().debug().errorHandler()`）

### 🔧 开发友好
- **调试支持**：内置 Trace Debugger，可视化规则匹配过程
- **错误处理**：详细的错误信息（位置、期望、实际、规则栈）
- **问题检测系统**：运行时检测左递归、无限循环等常见错误
- **语法验证**：自动检测 Or 规则冲突（前缀遮蔽、空路径）
- **CST 辅助方法**：`getChild()`, `getChildren()`, `getToken()` 等便捷方法
- **Token 前瞻**：完整支持 ECMAScript 规范的所有 `[lookahead ...]` 约束

## 📦 安装

```bash
npm install subhuti
# 或
yarn add subhuti
```

## 🚀 快速开始

### 1. 定义 Lexer（词法分析器）

```typescript
import { SubhutiLexer, createKeywordToken, createRegToken, createValueRegToken } from 'subhuti'

// 定义 Token
const tokens = [
  // 关键字
  createKeywordToken('IfTok', 'if'),
  createKeywordToken('ElseTok', 'else'),
  createKeywordToken('ReturnTok', 'return'),

  // 标识符和字面量
  createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
  createRegToken('Number', /[0-9]+/),

  // 符号
  createKeywordToken('LParen', '('),
  createKeywordToken('RParen', ')'),
  createKeywordToken('Semicolon', ';'),

  // 跳过空格和注释（skip: true）
  createValueRegToken('WhiteSpace', /[ \t\r\n]+/, '', true),
  createValueRegToken('Comment', /\/\/[^\n]*/, '', true),
]

// 创建 Lexer
const lexer = new SubhutiLexer(tokens)

// 分词
const sourceCode = 'if (x) return 42;'
const tokenStream = lexer.tokenize(sourceCode)
```

### 2. 定义 TokenConsumer（可选，简化 token 消费）

```typescript
import { SubhutiTokenConsumer } from 'subhuti'

// 自定义 TokenConsumer，为每个 token 创建便捷方法
class MyTokenConsumer extends SubhutiTokenConsumer {
  IfTok() { return this.consume(tokens.find(t => t.name === 'IfTok')!) }
  ElseTok() { return this.consume(tokens.find(t => t.name === 'ElseTok')!) }
  ReturnTok() { return this.consume(tokens.find(t => t.name === 'ReturnTok')!) }
  Identifier() { return this.consume(tokens.find(t => t.name === 'Identifier')!) }
  Number() { return this.consume(tokens.find(t => t.name === 'Number')!) }
  LParen() { return this.consume(tokens.find(t => t.name === 'LParen')!) }
  RParen() { return this.consume(tokens.find(t => t.name === 'RParen')!) }
  Semicolon() { return this.consume(tokens.find(t => t.name === 'Semicolon')!) }
}
```

### 3. 定义 Parser（语法分析器）

```typescript
import { SubhutiParser, SubhutiRule, Subhuti } from 'subhuti'

@Subhuti
class MyParser extends SubhutiParser<MyTokenConsumer> {
  constructor(tokens) {
    super(tokens, MyTokenConsumer)  // 传入自定义 TokenConsumer
  }

  @SubhutiRule
  Statement() {
    this.Or([
      { alt: () => this.IfStatement() },
      { alt: () => this.ReturnStatement() },
      { alt: () => this.ExpressionStatement() }
    ])
  }

  @SubhutiRule
  IfStatement() {
    this.tokenConsumer.IfTok()      // 使用 TokenConsumer 的便捷方法
    this.tokenConsumer.LParen()
    this.Expression()
    this.tokenConsumer.RParen()
    this.Statement()

    // 可选的 else 分支
    this.Option(() => {
      this.tokenConsumer.ElseTok()
      this.Statement()
    })
  }

  @SubhutiRule
  ReturnStatement() {
    this.tokenConsumer.ReturnTok()
    this.Expression()
    this.tokenConsumer.Semicolon()
  }

  @SubhutiRule
  Expression() {
    // 简化示例
    this.Or([
      { alt: () => this.tokenConsumer.Identifier() },
      { alt: () => this.tokenConsumer.Number() }
    ])
  }

  @SubhutiRule
  ExpressionStatement() {
    this.Expression()
    this.tokenConsumer.Semicolon()
  }
}
```

### 4. 解析代码

```typescript
const parser = new MyParser(tokenStream)
  .cache(true)          // 启用 Packrat 缓存
  .debug(false)         // 生产环境关闭调试
  .errorHandler(true)   // 启用详细错误信息

// 解析
const cst = parser.Statement()

// 访问 CST
if (cst) {
  console.log('规则名称:', cst.name)
  console.log('子节点数量:', cst.childCount)

  // 使用便捷方法访问
  const condition = cst.getChild('Expression')
  const returnValue = cst.getToken('Number')

  // 访问位置信息（用于错误报告、源码映射）
  console.log('位置:', cst.loc.start.line, cst.loc.start.column)
}
```

## 📖 核心能力

### Parser 组合器

#### `Or` - 顺序选择（**规则顺序很重要！**）

```typescript
this.Or([
  { alt: () => { /* 长规则：优先尝试 */ } },
  { alt: () => { /* 短规则：作为回退 */ } }
])
```

⚠️ **关键原则**：**长规则必须在短规则前面**

#### `Many` - 0 次或多次

```typescript
this.Many(() => {
  this.Statement()
})
```

#### `AtLeastOne` - 1 次或多次

```typescript
this.AtLeastOne(() => {
  this.Parameter()
})
```

#### `Option` - 0 次或 1 次

```typescript
this.Option(() => {
  this.ElseClause()
})
```

### Token 前瞻（Lookahead）

```typescript
// 检查下一个 token 是否匹配
if (this.lookahead('LBrace', 1)) {
  // 下一个是 {
}

// 检查下一个 token 是否不匹配
if (this.lookaheadNot('ElseTok', 1)) {
  // 下一个不是 else
}

// 断言方法
this.assertLookaheadNotIn(['LBrace', 'FunctionTok', 'ClassTok'])
this.assertNoLineBreak()
```

### 语法验证

```typescript
// 检查语法是否正确
const result = parser.validateGrammar()

if (!result.success) {
  console.error('发现语法冲突:', result.errors)
}
```

## 🎯 核心概念

### PEG 顺序选择 vs 传统最长匹配

| 特性 | Subhuti (PEG) | 传统 LR/LALR |
|------|---------------|--------------|
| 匹配策略 | **第一个成功** | 最长匹配 |
| 规则顺序 | ⭐⭐⭐ **关键** | 不重要 |
| 回溯 | ✅ 支持 | ❌ 不支持 |
| 二义性处理 | 程序员控制 | 自动检测/报错 |

### allowError 机制

在 `Or` 规则中：
- **前 N-1 分支**：允许失败，失败时返回 `undefined`
- **最后分支**：失败时抛出详细错误

## 📊 与其他工具对比

| 工具 | Subhuti | ANTLR | PEG.js | Chevrotain |
|------|---------|-------|--------|------------|
| **语言** | TypeScript | Java/多语言 | JavaScript | TypeScript |
| **风格** | PEG | LL(*) | PEG | LL(k) |
| **定义方式** | 装饰器 | 独立语法文件 | 独立语法文件 | TypeScript API |
| **回溯** | ✅ | ❌ | ✅ | ❌ |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 实际应用

### Slime 项目
使用 Subhuti 构建完整的 **JavaScript ES2025** 解析器：
- ✅ 支持最新 ECMAScript 2025 规范的所有语法特性
- ✅ CST → AST 转换
- ✅ 代码生成和 Source Map 支持

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

[English](./README.md)
