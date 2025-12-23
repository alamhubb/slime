# Subhuti

[![npm version](https://img.shields.io/npm/v/subhuti.svg)](https://www.npmjs.com/package/subhuti)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](https://opensource.org/licenses/MIT)

**Subhuti (सुभूति)** - A lightweight, high-performance PEG Parser Generator framework built with TypeScript, designed for rapid development of programming language parsers.

**Name Origin:** Subhuti (菩提祖师) is Sun Wukong's master, symbolizing the flexibility of language transformation like the 72 transformations.

## ✨ Core Features

### 🚀 High-Performance Packrat Parsing
- **Linear time complexity O(n)**: Avoids redundant parsing through LRU caching
- **Smart cache management**: Automatic cleanup of expired cache, controllable memory usage
- **Optional toggle**: Flexibly enable/disable caching based on needs

### 🎯 PEG-Style Grammar (Parsing Expression Grammar)
- **Ordered choice**: `Or` rules try alternatives in order, returns on first success
- **Automatic backtracking**: Automatically restores state on failure, supports complex grammars
- **Clear semantics**: Programmer has full control over rule order, no ambiguity

### 🛡️ Smart Error Management (allowError mechanism)
- **First N-1 branches allow failure**: Gracefully handle failures in `Or` rules
- **Last branch throws detailed error**: Precisely locate syntax errors with full context
- **RAII pattern management**: Automatically restore error state, avoid manual management

### 🎨 Elegant TypeScript API
- **Decorator pattern**: Define rules with `@SubhutiRule`, clean code
- **Strong typing**: Complete TypeScript type definitions
- **Fluent API**: Chainable design (`.cache().debug().errorHandler()`)

### 🔧 Developer Friendly
- **Debug support**: Built-in Trace Debugger, visualize rule matching process
- **Error handling**: Detailed error messages (position, expected, actual, rule stack)
- **Problem detection**: Runtime detection of left recursion, infinite loops, etc.
- **Grammar validation**: Auto-detect Or rule conflicts (prefix shadowing, empty paths)
- **CST helpers**: `getChild()`, `getChildren()`, `getToken()` convenience methods
- **Token lookahead**: Full support for all ECMAScript `[lookahead ...]` constraints

## 📦 Installation

```bash
npm install subhuti
# or
yarn add subhuti
```

## 🚀 Quick Start

### 1. Define Lexer

```typescript
import { SubhutiLexer, createKeywordToken, createRegToken, createValueRegToken } from 'subhuti'

const tokens = [
  // Keywords
  createKeywordToken('IfTok', 'if'),
  createKeywordToken('ElseTok', 'else'),
  createKeywordToken('ReturnTok', 'return'),

  // Identifiers and literals
  createRegToken('Identifier', /[a-zA-Z_][a-zA-Z0-9_]*/),
  createRegToken('Number', /[0-9]+/),

  // Symbols
  createKeywordToken('LParen', '('),
  createKeywordToken('RParen', ')'),
  createKeywordToken('Semicolon', ';'),

  // Skip whitespace and comments (skip: true)
  createValueRegToken('WhiteSpace', /[ \t\r\n]+/, '', true),
  createValueRegToken('Comment', /\/\/[^\n]*/, '', true),
]

const lexer = new SubhutiLexer(tokens)
const tokenStream = lexer.tokenize('if (x) return 42;')
```

### 2. Define TokenConsumer (Optional)

```typescript
import { SubhutiTokenConsumer } from 'subhuti'

class MyTokenConsumer extends SubhutiTokenConsumer {
  IfTok() { return this.consume(tokens.find(t => t.name === 'IfTok')!) }
  Identifier() { return this.consume(tokens.find(t => t.name === 'Identifier')!) }
  // ...
}
```

### 3. Define Parser

```typescript
import { SubhutiParser, SubhutiRule, Subhuti } from 'subhuti'

@Subhuti
class MyParser extends SubhutiParser<MyTokenConsumer> {
  constructor(tokens) {
    super(tokens, MyTokenConsumer)
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
    this.tokenConsumer.IfTok()
    this.tokenConsumer.LParen()
    this.Expression()
    this.tokenConsumer.RParen()
    this.Statement()

    this.Option(() => {
      this.tokenConsumer.ElseTok()
      this.Statement()
    })
  }

  @SubhutiRule
  Expression() {
    this.Or([
      { alt: () => this.tokenConsumer.Identifier() },
      { alt: () => this.tokenConsumer.Number() }
    ])
  }
}
```

### 4. Parse Code

```typescript
const parser = new MyParser(tokenStream)
  .cache(true)
  .debug(false)
  .errorHandler(true)

const cst = parser.Statement()

if (cst) {
  console.log('Rule name:', cst.name)
  console.log('Child count:', cst.childCount)
  console.log('Location:', cst.loc.start.line, cst.loc.start.column)
}
```

## 📖 Core Capabilities

### Parser Combinators

#### `Or` - Ordered Choice (**Rule order matters!**)

```typescript
this.Or([
  { alt: () => { /* Long rule: try first */ } },
  { alt: () => { /* Short rule: fallback */ } }
])
```

⚠️ **Key principle**: **Long rules must come before short rules**

#### `Many` - Zero or more

```typescript
this.Many(() => this.Statement())
```

#### `AtLeastOne` - One or more

```typescript
this.AtLeastOne(() => this.Parameter())
```

#### `Option` - Zero or one

```typescript
this.Option(() => this.ElseClause())
```

### Token Lookahead

```typescript
// Check if next token matches
if (this.lookahead('LBrace', 1)) { /* next is { */ }

// Check if next token doesn't match
if (this.lookaheadNot('ElseTok', 1)) { /* next is not else */ }

// Assertion methods
this.assertLookaheadNotIn(['LBrace', 'FunctionTok', 'ClassTok'])
this.assertNoLineBreak()
```

### Grammar Validation

```typescript
const result = parser.validateGrammar()

if (!result.success) {
  console.error('Grammar conflicts found:', result.errors)
}
```

## 🎯 Core Concepts

### PEG Ordered Choice vs Traditional Longest Match

| Feature | Subhuti (PEG) | Traditional LR/LALR |
|---------|---------------|---------------------|
| Match strategy | **First success** | Longest match |
| Rule order | ⭐⭐⭐ **Critical** | Not important |
| Backtracking | ✅ Supported | ❌ Not supported |
| Ambiguity handling | Programmer controlled | Auto-detect/error |

### allowError Mechanism

In `Or` rules:
- **First N-1 branches**: Allow failure, return `undefined`
- **Last branch**: Throw detailed error on failure

## 📊 Comparison with Other Tools

| Tool | Subhuti | ANTLR | PEG.js | Chevrotain |
|------|---------|-------|--------|------------|
| **Language** | TypeScript | Java/Multi | JavaScript | TypeScript |
| **Style** | PEG | LL(*) | PEG | LL(k) |
| **Definition** | Decorators | Separate grammar file | Separate grammar file | TypeScript API |
| **Backtracking** | ✅ | ❌ | ✅ | ❌ |
| **Performance** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ |

## 🎯 Real-World Usage

### Slime Project
Using Subhuti to build a complete **JavaScript ES2025** parser:
- ✅ Supports all ECMAScript 2025 syntax features
- ✅ CST → AST transformation
- ✅ Code generation and Source Map support

## 📄 License

MIT © [alamhubb](https://github.com/alamhubb)

---

[中文文档](./README.zh-CN.md)
