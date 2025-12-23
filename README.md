# Slime

A highly fault-tolerant JavaScript/TypeScript parser and generator suitable for editor scenarios. Just like the children's toy slime, it can support JS/TS code containing various errors as much as possible.

## Why Slime?

| Feature | Slime | Babel | ESPrima | TypeScript |
|---------|-------|-------|---------|------------|
| Fault-tolerant parsing | ✅ | ❌ | ❌ | ✅ |
| ESTree compatible | ✅ | ✅ | ✅ | ❌ |
| Code generation | ✅ | ✅ | ❌ | ✅ |
| Editor-friendly | ✅ | ❌ | ❌ | ✅ |

Other parsers like babel, recast, espree, and esprima will throw errors when parsing incomplete code like `let a =`. Slime handles this gracefully.

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                      Slime Project Structure                 │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ slime-token │───▶│slime-parser │───▶│  slime-ast  │     │
│  │  (Lexer)    │    │  (Parser)   │    │ (AST Types) │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                  │             │
│                            ▼                  ▼             │
│                                        ┌─────────────┐     │
│                                        │slime-generat│     │
│                                        │ (Generator) │     │
│                                        └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Packages

| Package | Description |
|---------|-------------|
| `slime-token` | Token type definitions and lexical rules |
| `slime-parser` | CST parser and CST→AST conversion |
| `slime-ast` | ESTree-compatible AST type definitions and factory methods |
| `slime-generator` | AST→Code generator |

## CST to AST Two-Layer Architecture

Slime uses a two-layer architecture to convert CST (Concrete Syntax Tree) to AST (Abstract Syntax Tree):

```
┌────────────────────────────────────────────────────────────┐
│                    Layer 1: AST Factory                     │
│                   (SlimeAstCreateUtils.ts)                  │
├────────────────────────────────────────────────────────────┤
│  - Method names match ESTree AST type names                 │
│  - Pure node creation, no CST dependency                    │
│  - Example: createArrayExpression(), createCatchClause()    │
└────────────────────────────────────────────────────────────┘
                              ▲
                              │ calls
┌────────────────────────────────────────────────────────────┐
│                    Layer 2: CST Conversion                  │
│                   (SlimeCstToAstUtil.ts)                    │
├────────────────────────────────────────────────────────────┤
│  - Method names match CST rule names                        │
│  - Parses CST structure, extracts info, calls AST factory   │
│  - Example: createArrayLiteralAst(), createCatchAst()       │
└────────────────────────────────────────────────────────────┘
```

### Naming Convention

| Layer | Method Naming | Example |
|-------|---------------|---------|
| CST Conversion | `createXxxAst` (Xxx = CST rule name) | `createArrayLiteralAst` |
| AST Factory | `createXxx` (Xxx = AST type name) | `createArrayExpression` |

## Usage

### Parsing Code

```typescript
import { SlimeParser, SlimeCstToAst } from 'slime-parser'

// 1. Parse code to CST
const parser = new SlimeParser(code)
const cst = parser.Program('module')

// 2. Convert CST to AST
const cstToAst = new SlimeCstToAst()
const ast = cstToAst.toProgram(cst)
```

### Generating Code

```typescript
import { SlimeGenerator } from 'slime-generator'

const generator = new SlimeGenerator()
const code = generator.generate(ast)
```

## TypeScript Support

See [TYPESCRIPT_SUPPORT.md](./TYPESCRIPT_SUPPORT.md) for detailed TypeScript syntax support documentation.

## File Structure

```
slime/
├── packages/
│   ├── slime-ast/          # AST type definitions and factory methods
│   ├── slime-parser/       # CST parser and CST→AST conversion
│   ├── slime-generator/    # AST→Code generator
│   ├── slime-token/        # Token definitions
│   ├── slime-test/         # Test utilities
│   └── subhuti/            # PEG Parser Generator framework
└── README.md
```

## Package Management

This project uses **Lerna** to manage multiple packages in a monorepo structure.

### Conditional Exports

Each package uses conditional exports in `package.json` to support both development and production:

```json
{
  "exports": {
    ".": {
      "development": "./src/index.ts",
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "default": "./dist/index.js"
    }
  }
}
```

- **Development**: When using `tsx` to run TypeScript directly, it resolves to `./src/index.ts`
- **Production**: After publishing to npm, users get the compiled `./dist/index.js`

### Development Workflow

```bash
# Run tests directly with tsx (no build needed)
npx tsx packages/slime-test/src/utils/test-stage4.ts

# Build a specific package
npm run build --workspace=packages/slime-parser

# Build all packages
lerna run build
```

### Publishing

```bash
# Build and publish (prepublishOnly runs build automatically)
lerna publish
```

## Contributing

### Adding New CST Rule Conversion

1. Add `createXxxAst` method in `SlimeCstToAstUtil.ts` (Xxx = CST rule name)
2. Add corresponding if dispatch in `createAstFromCst`
3. If new AST type needed, add factory method in `SlimeAstCreateUtils.ts`

### Running Tests

```bash
npx tsx packages/slime-test/src/utils/test-stage4.ts
```

## License

MIT License - See [LICENSE](./LICENSE) file.

---

[中文文档](./README.zh-CN.md)
