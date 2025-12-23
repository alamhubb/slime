# slime-parser

ES2025 JavaScript/ECMAScript 解析器，将源代码解析为 CST（具体语法树），并转换为 ESTree 兼容的 AST（抽象语法树）。

支持 TypeScript 语法扩展。

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

## TypeScript 扩展设计原则

### 核心原则：优先采用 override 重写，而不是创建新规则

当扩展 JavaScript 语法以支持 TypeScript 时，应该：

**✅ 正确做法：override 重写父类方法**
```typescript
// SlimeParser.ts
@SubhutiRule
override ClassTail(params: ExpressionParams = {}) {
    // 可选的 extends 子句（使用重写的 ClassHeritage）
    this.Option(() => this.ClassHeritage(params))
    // [TypeScript] 可选的 implements 子句
    this.Option(() => this.TSClassImplements())
    this.tokenConsumer.LBrace()
    this.Option(() => this.ClassBody(params))
    this.tokenConsumer.RBrace()
}

@SubhutiRule
override ClassHeritage(params: ExpressionParams = {}) {
    this.tokenConsumer.Extends()
    this.LeftHandSideExpression(params)
    // [TypeScript] 可选的类型参数
    this.Option(() => this.TSTypeParameterInstantiation())
}
```

**❌ 错误做法：创建新规则**
```typescript
// 不要这样做！
@SubhutiRule
TSClassTail(params: ExpressionParams = {}) { ... }

@SubhutiRule  
TSClassExtends(params: ExpressionParams = {}) { ... }
```

### 为什么要用 override？

1. **CST 节点名称一致**：重写后 CST 节点名称仍然是 `ClassTail`，CST-to-AST 转换器不需要处理两种情况

2. **代码更简洁**：不需要在转换器中检查 `name === 'ClassTail' || name === 'TSClassTail'`

3. **语义清晰**：`SlimeParser` 就是 TypeScript 版本的 Parser，它的 `ClassTail` 就是支持 TypeScript 的版本

4. **避免混乱**：新规则会导致 CST 结构不一致，增加维护成本

### 什么时候创建新规则？

只有当 JavaScript 中完全不存在对应概念时，才创建新规则：

```typescript
// TypeScript 特有的语法，JavaScript 没有对应概念
@SubhutiRule
TSTypeAnnotation() { ... }      // 类型注解 `: number`

@SubhutiRule
TSClassImplements() { ... }     // implements 子句

@SubhutiRule
TSInterfaceDeclaration() { ... } // interface 声明
```

### 适用范围

这个原则适用于所有模块：
- **slime-parser**: Parser 规则应该用 override
- **slime-parser/cstToAst**: CST-to-AST 转换器应该用 override
- **slime-generator**: 代码生成器应该用 override
- **slime-ast**: AST 类型可以扩展，但优先复用现有类型

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
│  │ (CST 解析器)    │  │  ├─ SlimeExpressionCstToAst.ts           │   │
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
// 第二层 (slime-parser/cstToAst/SlimeIdentifierCstToAst.ts)
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
│       ├── SlimeIdentifierCstToAst.ts    # 标识符转换
│       ├── SlimeLiteralCstToAst.ts       # 字面量转换
│       ├── SlimeExpressionCstToAst.ts    # 表达式转换
│       ├── StatementCstToAst.ts     # 语句转换
│       ├── DeclarationCstToAst.ts   # 声明转换
│       ├── FunctionCstToAst.ts      # 函数转换
│       ├── ClassCstToAst.ts         # 类转换
│       ├── PatternCstToAst.ts       # 解构模式转换
│       ├── PropertyCstToAst.ts      # 属性转换
│       ├── SlimeModuleCstToAst.ts        # 模块转换
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
