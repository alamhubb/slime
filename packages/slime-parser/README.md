# slime-parser

ES2025 JavaScript/ECMAScript 解析器，将源代码解析为 CST（具体语法树），并转换为 ESTree 兼容的 AST（抽象语法树）。

## 安装

```bash
npm install slime-parser
```

## 使用

```typescript
import { SlimeParser, SlimeCstToAstUtil } from 'slime-parser'

// 解析源代码为 CST
const parser = new SlimeParser()
const cst = parser.parse('const x = 1 + 2')

// 将 CST 转换为 AST
const ast = SlimeCstToAstUtil.toProgram(cst)
```

## 架构设计

### 整体架构

```
┌─────────────────────────────────────────────────────────────────┐
│                        slime-ast                                 │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │ SlimeAstNode.ts  │  │SlimeAstCreateUtils.ts│  │SlimeTokenCreateUtils │  │
│  │ (类型定义)       │  │ (AST工厂方法)    │  │ (Token工厂)     │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│                                                                  │
│  职责：纯粹的 AST 类型定义 + 单节点创建工厂                        │
│  不依赖：CST、Parser、任何解析逻辑                                │
└─────────────────────────────────────────────────────────────────┘
                              ↓ 依赖
┌─────────────────────────────────────────────────────────────────┐
│                       slime-parser                               │
│  ┌─────────────────┐  ┌─────────────────────────────────────┐   │
│  │ SlimeParser.ts  │  │ cstToAst/                            │   │
│  │ (CST 解析器)    │  │  ├─ SlimeJavascriptExpressionCstToAst.ts           │   │
│  │                 │  │  ├─ StatementCstToAst.ts            │   │
│  │                 │  │  ├─ FunctionCstToAst.ts             │   │
│  │                 │  │  └─ ... (12个文件)                   │   │
│  └─────────────────┘  └─────────────────────────────────────┘   │
│                                                                  │
│  职责：CST 解析 + CST→AST 转换                                   │
│  依赖：slime-ast (类型 + 工厂方法)                               │
└─────────────────────────────────────────────────────────────────┘
```

### 两层方法设计

| 层级 | 位置 | 方法示例 | 职责 |
|------|------|----------|------|
| **第一层：AST 工厂** | slime-ast/SlimeAstCreateUtils.ts | `createIdentifier(name, loc)` | 纯粹创建单个 AST 节点，不理解 CST |
| **第二层：CST 转换** | slime-parser/cstToAst/*.ts | `createIdentifierAst(cst)` | 解析 CST 结构，调用第一层工厂 |

**调用关系示例：**

```typescript
// 第二层 (slime-parser/cstToAst/SlimeJavascriptIdentifierCstToAst.ts)
static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
    const name = cst.children[0].value  // 解析 CST 结构
    return SlimeAstUtil.createIdentifier(name, cst.loc)  // 调用第一层
}
```

### 为什么 CST→AST 转换放在 slime-parser 而不是单独的包？

**原因：Parser 和 Transform 天然紧耦合**

```typescript
// cstToAst 中大量使用 Parser 的规则名
if (name === SlimeParser.prototype.IdentifierReference?.name) 
    return IdentifierCstToAst.createIdentifierReferenceAst(cst)
```

1. **紧耦合是合理的**
   - CST 结构由 Parser 定义
   - 转换逻辑必须与 Parser 规则一一对应
   - 分开反而增加同步维护成本

2. **复用场景有限**
   - cstToAst 只能转换 SlimeParser 产生的 CST
   - 不同 Parser 的 CST 结构不同，无法复用

3. **避免循环依赖**
   - 如果分离，`slime-cst-transform` 需要 `SlimeParser` 的规则名
   - `slime-parser` 也需要 `slime-cst-transform` 来转换 AST
   - 会产生循环依赖问题

4. **业界实践**
   - Babel: parser 和 transform 在同一个包
   - Acorn: 同上
   - TypeScript: 同上

## 目录结构

```
slime-parser/
├── src/
│   ├── SlimeParser.ts           # CST 解析器（定义语法规则）
│   ├── SlimeTokenConsumer.ts    # Token 消费器
│   ├── SlimeCstToAstUtil.ts     # CST→AST 分发中心
│   └── cstToAst/                # CST→AST 转换模块
│       ├── index.ts             # 导出入口
│       ├── SlimeJavascriptIdentifierCstToAst.ts    # 标识符转换
│       ├── SlimeJavascriptLiteralCstToAst.ts       # 字面量转换
│       ├── SlimeJavascriptExpressionCstToAst.ts    # 表达式转换
│       ├── StatementCstToAst.ts     # 语句转换
│       ├── DeclarationCstToAst.ts   # 声明转换
│       ├── FunctionCstToAst.ts      # 函数转换
│       ├── ClassCstToAst.ts         # 类转换
│       ├── PatternCstToAst.ts       # 解构模式转换
│       ├── PropertyCstToAst.ts      # 属性转换
│       ├── SlimeJavascriptModuleCstToAst.ts        # 模块转换
│       ├── TemplateCstToAst.ts      # 模板字符串转换
│       └── OperatorCstToAst.ts      # 运算符转换
├── package.json
├── tsconfig.json
└── README.md
```

## cstToAst 模块说明

每个 CstToAst 类负责特定类型的 CST 节点转换：

| 类名 | 职责 |
|------|------|
| `IdentifierCstToAst` | 标识符：Identifier, BindingIdentifier, PrivateIdentifier |
| `LiteralCstToAst` | 字面量：String, Number, Boolean, RegExp, Array, Object |
| `ExpressionCstToAst` | 表达式：Binary, Unary, Call, Member, Assignment 等 |
| `StatementCstToAst` | 语句：If, For, While, Switch, Try, Return 等 |
| `DeclarationCstToAst` | 声明：Variable, Function, Class, Import, Export |
| `FunctionCstToAst` | 函数：FunctionDeclaration, ArrowFunction, 参数处理 |
| `ClassCstToAst` | 类：ClassDeclaration, MethodDefinition, FieldDefinition |
| `PatternCstToAst` | 解构：ObjectPattern, ArrayPattern, RestElement |
| `PropertyCstToAst` | 属性：Property, PropertyDefinition |
| `ModuleCstToAst` | 模块：Import, Export, ModuleSpecifier |
| `TemplateCstToAst` | 模板：TemplateLiteral, TaggedTemplate |
| `OperatorCstToAst` | 运算符：处理各类运算符 Token |

## 依赖

- `slime-ast` - AST 类型定义和节点工厂
- `slime-token` - Token 类型定义
- `subhuti` - CST 解析基础库

## License

MIT
