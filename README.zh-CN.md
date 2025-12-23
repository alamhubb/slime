# Slime

一个高容错的 JavaScript/TypeScript 解析器和代码生成器，适用于编辑器场景。就像儿童玩具史莱姆一样，它可以尽可能地支持包含各种错误的 JS/TS 代码。

## 为什么选择 Slime？

| 特性 | Slime | Babel | ESPrima | TypeScript |
|------|-------|-------|---------|------------|
| 容错解析 | ✅ | ❌ | ❌ | ✅ |
| ESTree 兼容 | ✅ | ✅ | ✅ | ❌ |
| 代码生成 | ✅ | ✅ | ❌ | ✅ |
| 编辑器友好 | ✅ | ❌ | ❌ | ✅ |

其他解析器如 babel、recast、espree 和 esprima 在解析不完整的代码（如 `let a =`）时会抛出错误。Slime 可以优雅地处理这种情况。

## 架构

```
┌─────────────────────────────────────────────────────────────┐
│                      Slime 项目结构                          │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────┐     │
│  │ slime-token │───▶│slime-parser │───▶│  slime-ast  │     │
│  │   (词法器)   │    │   (解析器)   │    │ (AST 类型)  │     │
│  └─────────────┘    └─────────────┘    └─────────────┘     │
│                            │                  │             │
│                            ▼                  ▼             │
│                                        ┌─────────────┐     │
│                                        │slime-generat│     │
│                                        │  (生成器)    │     │
│                                        └─────────────┘     │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### 包说明

| 包 | 描述 |
|---|------|
| `slime-token` | Token 类型定义和词法规则 |
| `slime-parser` | CST 解析器和 CST→AST 转换 |
| `slime-ast` | ESTree 兼容的 AST 类型定义和工厂方法 |
| `slime-generator` | AST→代码生成器 |

## CST 到 AST 两层架构

Slime 使用两层架构将 CST（具体语法树）转换为 AST（抽象语法树）：

```
┌────────────────────────────────────────────────────────────┐
│                    第一层：AST 工厂                          │
│                   (SlimeAstCreateUtils.ts)                  │
├────────────────────────────────────────────────────────────┤
│  - 方法名与 ESTree AST 类型名一致                            │
│  - 纯节点创建，不依赖 CST                                    │
│  - 示例：createArrayExpression(), createCatchClause()       │
└────────────────────────────────────────────────────────────┘
                              ▲
                              │ 调用
┌────────────────────────────────────────────────────────────┐
│                    第二层：CST 转换                          │
│                   (SlimeCstToAstUtil.ts)                    │
├────────────────────────────────────────────────────────────┤
│  - 方法名与 CST 规则名一致                                   │
│  - 解析 CST 结构，提取信息，调用 AST 工厂                     │
│  - 示例：createArrayLiteralAst(), createCatchAst()          │
└────────────────────────────────────────────────────────────┘
```

### 命名规范

| 层 | 方法命名 | 示例 |
|----|---------|------|
| CST 转换 | `createXxxAst`（Xxx = CST 规则名） | `createArrayLiteralAst` |
| AST 工厂 | `createXxx`（Xxx = AST 类型名） | `createArrayExpression` |

## 使用方法

### 解析代码

```typescript
import { SlimeParser, SlimeCstToAst } from 'slime-parser'

// 1. 将代码解析为 CST
const parser = new SlimeParser(code)
const cst = parser.Program('module')

// 2. 将 CST 转换为 AST
const cstToAst = new SlimeCstToAst()
const ast = cstToAst.toProgram(cst)
```

### 生成代码

```typescript
import { SlimeGenerator } from 'slime-generator'

const generator = new SlimeGenerator()
const code = generator.generate(ast)
```

## TypeScript 支持

详细的 TypeScript 语法支持文档请参阅 [TYPESCRIPT_SUPPORT.md](./TYPESCRIPT_SUPPORT.md)。

## 文件结构

```
slime/
├── packages/
│   ├── slime-ast/          # AST 类型定义和工厂方法
│   ├── slime-parser/       # CST 解析器和 CST→AST 转换
│   ├── slime-generator/    # AST→代码生成器
│   ├── slime-token/        # Token 定义
│   ├── slime-test/         # 测试工具
│   └── subhuti/            # PEG Parser Generator 框架
└── README.md
```

## 包管理

本项目使用 **Lerna** 管理 monorepo 中的多个包。

### 条件导出

每个包在 `package.json` 中使用条件导出，同时支持开发和生产环境：

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

- **开发环境**：使用 `tsx` 直接运行 TypeScript 时，解析到 `./src/index.ts`
- **生产环境**：发布到 npm 后，用户获取编译后的 `./dist/index.js`

### 开发流程

```bash
# 直接用 tsx 运行测试（无需构建）
npx tsx packages/slime-test/src/utils/test-stage4.ts

# 构建单个包
npm run build --workspace=packages/slime-parser

# 构建所有包
lerna run build
```

### 发布

```bash
# 构建并发布（prepublishOnly 会自动运行 build）
lerna publish
```

## 贡献

### 添加新的 CST 规则转换

1. 在 `SlimeCstToAstUtil.ts` 中添加 `createXxxAst` 方法（Xxx = CST 规则名）
2. 在 `createAstFromCst` 中添加相应的 if 分发
3. 如果需要新的 AST 类型，在 `SlimeAstCreateUtils.ts` 中添加工厂方法

### 运行测试

```bash
npx tsx packages/slime-test/src/utils/test-stage4.ts
```

## 许可证

MIT License - 详见 [LICENSE](./LICENSE) 文件。
