# slime-parser

ES2025 JavaScript/ECMAScript parser that parses source code into CST (Concrete Syntax Tree) and converts it to ESTree-compatible AST (Abstract Syntax Tree).

Supports TypeScript syntax extensions.

## Installation

```bash
npm install slime-parser
```

## Usage

```typescript
import { SlimeParser, SlimeCstToAstUtil } from 'slime-parser'

// Parse source code to CST
const parser = new SlimeParser()
const cst = parser.parse('const x = 1 + 2')

// Convert CST to AST
const ast = SlimeCstToAstUtil.toProgram(cst)
```

## TypeScript Extension Design Principles

### Core Principle: Prefer override over creating new rules

When extending JavaScript syntax to support TypeScript:

**✅ Correct approach: override parent class methods**
```typescript
// SlimeParser.ts
@SubhutiRule
override ClassTail(params: ExpressionParams = {}) {
    // Optional extends clause (using overridden ClassHeritage)
    this.Option(() => this.ClassHeritage(params))
    // [TypeScript] Optional implements clause
    this.Option(() => this.TSClassImplements())
    this.tokenConsumer.LBrace()
    this.Option(() => this.ClassBody(params))
    this.tokenConsumer.RBrace()
}

@SubhutiRule
override ClassHeritage(params: ExpressionParams = {}) {
    this.tokenConsumer.Extends()
    this.LeftHandSideExpression(params)
    // [TypeScript] Optional type parameters
    this.Option(() => this.TSTypeParameterInstantiation())
}
```

**❌ Wrong approach: creating new rules**
```typescript
// Don't do this!
@SubhutiRule
TSClassTail(params: ExpressionParams = {}) { ... }

@SubhutiRule  
TSClassExtends(params: ExpressionParams = {}) { ... }
```

### Why use override?

1. **Consistent CST node names**: After override, CST node name is still `ClassTail`, CST-to-AST converter doesn't need to handle two cases

2. **Cleaner code**: No need to check `name === 'ClassTail' || name === 'TSClassTail'` in converter

3. **Clear semantics**: `SlimeParser` is the TypeScript version of Parser, its `ClassTail` is the TypeScript-enabled version

4. **Avoid confusion**: New rules lead to inconsistent CST structure, increasing maintenance cost

### When to create new rules?

Only when JavaScript has no corresponding concept:

```typescript
// TypeScript-specific syntax, no JavaScript equivalent
@SubhutiRule
TSTypeAnnotation() { ... }      // Type annotation `: number`

@SubhutiRule
TSClassImplements() { ... }     // implements clause

@SubhutiRule
TSInterfaceDeclaration() { ... } // interface declaration
```

## Architecture

### Overall Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        slime-ast                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ SlimeAstNode.ts  │  │SlimeAstCreateUtils│  │SlimeTokenCreate │  │
│  │ (Type Defs)      │  │ (AST Factory)    │  │ (Token Factory) │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  Responsibility: Pure AST type definitions + single node factory │
│  No dependency on: CST, Parser, any parsing logic                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ depends on
┌─────────────────────────────────────────────────────────────────┐
│                       slime-parser                               │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ SlimeParser.ts  │  │ cstToAst/                            │   │
│  │ (CST Parser)    │  │  ├─ SlimeExpressionCstToAst.ts       │   │
│  │                 │  │  ├─ StatementCstToAst.ts             │   │
│  │                 │  │  ├─ FunctionCstToAst.ts              │   │
│  │                 │  │  └─ ... (12 files)                   │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
│                                                                  │
│  Responsibility: CST parsing + CST→AST conversion                │
│  Depends on: slime-ast (types + factory methods)                 │
└─────────────────────────────────────────────────────────────────┘
```

### Two-Layer Method Design

| Layer | Location | Method Example | Responsibility |
|-------|----------|----------------|----------------|
| **Layer 1: AST Factory** | slime-ast/SlimeAstCreateUtils.ts | `createIdentifier(name, loc)` | Pure single AST node creation, no CST understanding |
| **Layer 2: CST Conversion** | slime-parser/cstToAst/*.ts | `createIdentifierAst(cst)` | Parse CST structure, call Layer 1 factory |

## Directory Structure

```
slime-parser/
├── src/
│   ├── SlimeParser.ts           # CST parser (defines grammar rules)
│   ├── SlimeTokenConsumer.ts    # Token consumer
│   ├── SlimeCstToAstUtil.ts     # CST→AST dispatch center
│   └── cstToAst/                # CST→AST conversion modules
│       ├── index.ts             # Export entry
│       ├── SlimeIdentifierCstToAst.ts    # Identifier conversion
│       ├── SlimeLiteralCstToAst.ts       # Literal conversion
│       ├── SlimeExpressionCstToAst.ts    # Expression conversion
│       └── ...
├── package.json
├── tsconfig.json
└── README.md
```

## Dependencies

- `slime-ast` - AST type definitions and node factory
- `slime-token` - Token type definitions
- `subhuti` - CST parsing base library

## License

MIT License - See [LICENSE](./LICENSE) file.

---

[中文文档](./README.zh-CN.md)
