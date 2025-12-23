# Design Document: TypeScript Support for Slime Parser

## Overview

本设计文档描述了 Slime 解析器全面支持 TypeScript 语法的技术方案。基于现有的 ES2025 JavaScript 解析器架构，通过扩展 Parser、AST 节点定义和代码生成器来实现 TypeScript 支持。

采用渐进式实现策略，按照需求文档中定义的 10 个阶段逐步实现，确保每个阶段都可以独立测试和验证。

## 核心设计原则：优先采用 override 重写

### 原则说明

当扩展 JavaScript 语法以支持 TypeScript 时，**必须优先采用 override 重写父类方法，而不是创建新规则**。

### 正确做法 ✅

```typescript
// SlimeParser.ts - 重写 ClassTail 以支持 TypeScript
@SubhutiRule
override ClassTail(params: ExpressionParams = {}) {
    this.Option(() => this.ClassHeritage(params))
    this.Option(() => this.TSClassImplements())  // TypeScript 扩展
    this.tokenConsumer.LBrace()
    this.Option(() => this.ClassBody(params))
    this.tokenConsumer.RBrace()
}

@SubhutiRule
override ClassHeritage(params: ExpressionParams = {}) {
    this.tokenConsumer.Extends()
    this.LeftHandSideExpression(params)
    this.Option(() => this.TSTypeParameterInstantiation())  // TypeScript 扩展
}
```

### 错误做法 ❌

```typescript
// 不要创建新规则！
@SubhutiRule
TSClassTail(params: ExpressionParams = {}) { ... }

@SubhutiRule  
TSClassExtends(params: ExpressionParams = {}) { ... }
```

### 为什么必须用 override？

1. **CST 节点名称一致**：重写后 CST 节点名称仍然是 `ClassTail`，CST-to-AST 转换器不需要处理两种情况

2. **代码更简洁**：不需要在转换器中检查 `name === 'ClassTail' || name === 'TSClassTail'`

3. **语义清晰**：`SlimeParser` 就是 TypeScript 版本的 Parser，它的 `ClassTail` 就是支持 TypeScript 的版本

4. **避免混乱**：新规则会导致 CST 结构不一致，增加维护成本

### 什么时候创建新规则？

**只有当 JavaScript 中完全不存在对应概念时**，才创建新规则：

```typescript
// TypeScript 特有的语法，JavaScript 没有对应概念
@SubhutiRule
TSTypeAnnotation() { ... }      // 类型注解 `: number`

@SubhutiRule
TSClassImplements() { ... }     // implements 子句

@SubhutiRule
TSInterfaceDeclaration() { ... } // interface 声明

@SubhutiRule
TSType() { ... }                // 类型表达式
```

### 适用范围

这个原则适用于所有模块：

| 模块 | 说明 |
|------|------|
| **slime-parser** | Parser 规则应该用 override 重写 |
| **slime-parser/cstToAst** | CST-to-AST 转换器应该用 override 重写 |
| **slime-generator** | 代码生成器应该用 override 重写 |
| **slime-ast** | AST 类型可以扩展，但优先复用现有类型 |

## Architecture

### 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                    Slime TypeScript Support                  │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────┐  │
│  │ SlimeParser │  │  SlimeAST   │  │  SlimeGenerator     │  │
│  │ (extends    │  │  (extends   │  │  (extends           │  │
│  │  JS Parser) │  │   JS AST)   │  │   JS Generator)     │  │
│  └──────┬──────┘  └──────┬──────┘  └──────────┬──────────┘  │
│         │                │                     │             │
│  ┌──────▼──────┐  ┌──────▼──────┐  ┌──────────▼──────────┐  │
│  │ TS Type     │  │ TS AST      │  │ TS Code             │  │
│  │ Rules       │  │ Nodes       │  │ Generation          │  │
│  └─────────────┘  └─────────────┘  └─────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### 设计原则

1. **继承扩展**: TypeScript 支持通过继承现有 JavaScript 解析器实现，不修改原有代码
2. **软关键字模式**: TypeScript 类型关键字（如 `number`, `string`）作为软关键字（Contextual Keywords）处理，使用 `consumeIdentifierValue()` 方法匹配
3. **AST 兼容**: TypeScript AST 节点遵循 @typescript-eslint/types 规范
4. **渐进式**: 按阶段实现，每个阶段独立可测试

### 软关键字处理机制

TypeScript 类型关键字在词法层面是 `IdentifierName`，在语法层面通过值检查来识别。这与现有的 JavaScript 软关键字（如 `async`, `let`, `static`）处理方式一致。

```typescript
// 现有软关键字实现示例（来自 SlimeJavascriptTokenConsumer）
Let() {
    return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Let)
}

// TypeScript 类型关键字将采用相同模式
TSNumber() {
    return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Number)
}
```

这种设计的优势：
- **兼容性**: `number`, `string` 等仍可作为变量名使用（如 `let number = 1`）
- **一致性**: 与现有软关键字处理方式保持一致
- **简洁性**: 无需修改词法分析器，仅在语法层面处理

## Components and Interfaces

### 1. Parser 组件

#### 1.1 SlimeParser 扩展

```typescript
// packages/slime-parser/src/SlimeParser.ts
@Subhuti
export default class SlimeParser<T extends SlimeTokenConsumer = SlimeTokenConsumer> 
    extends SlimeJavascriptParser<T> {
    
    // Phase 1: 基础类型系统
    TSType(): SubhutiCst | undefined
    TSTypeAnnotation(): SubhutiCst | undefined
    TSNumberKeyword(): SubhutiCst | undefined
    TSStringKeyword(): SubhutiCst | undefined
    TSBooleanKeyword(): SubhutiCst | undefined
    TSAnyKeyword(): SubhutiCst | undefined
    TSUnknownKeyword(): SubhutiCst | undefined
    TSVoidKeyword(): SubhutiCst | undefined
    TSNeverKeyword(): SubhutiCst | undefined
    TSNullKeyword(): SubhutiCst | undefined
    TSUndefinedKeyword(): SubhutiCst | undefined
    TSObjectKeyword(): SubhutiCst | undefined
    TSSymbolKeyword(): SubhutiCst | undefined
    TSBigIntKeyword(): SubhutiCst | undefined
    
    // Phase 2: 复合类型
    TSUnionType(): SubhutiCst | undefined
    TSIntersectionType(): SubhutiCst | undefined
    TSArrayType(): SubhutiCst | undefined
    TSTupleType(): SubhutiCst | undefined
    TSTypeLiteral(): SubhutiCst | undefined
    TSFunctionType(): SubhutiCst | undefined
    
    // Phase 3: 类型注解位置 (通过重写现有规则)
    override BindingIdentifier(params?: ExpressionParams): SubhutiCst | undefined
    override FormalParameter(params?: ExpressionParams): SubhutiCst | undefined
    override FunctionDeclaration(params?: ExpressionParams): SubhutiCst | undefined
    
    // Phase 4: 类型声明
    TSInterfaceDeclaration(): SubhutiCst | undefined
    TSTypeAliasDeclaration(): SubhutiCst | undefined
    TSEnumDeclaration(): SubhutiCst | undefined
    
    // Phase 5: 泛型
    TSTypeParameterDeclaration(): SubhutiCst | undefined
    TSTypeParameterInstantiation(): SubhutiCst | undefined
    
    // Phase 6: 类型操作符
    TSTypeQuery(): SubhutiCst | undefined
    TSTypeOperator(): SubhutiCst | undefined
    TSIndexedAccessType(): SubhutiCst | undefined
    TSConditionalType(): SubhutiCst | undefined
    TSMappedType(): SubhutiCst | undefined
    
    // Phase 7: 模块和命名空间
    TSImportType(): SubhutiCst | undefined
    TSModuleDeclaration(): SubhutiCst | undefined
    
    // Phase 8: 特殊语法
    TSAsExpression(): SubhutiCst | undefined
    TSTypeAssertion(): SubhutiCst | undefined
    TSNonNullExpression(): SubhutiCst | undefined
    TSSatisfiesExpression(): SubhutiCst | undefined
}
```

#### 1.2 类型解析优先级

TypeScript 类型解析遵循以下优先级（从高到低）：

1. 括号类型 `(T)`
2. 基础类型关键字 `number`, `string`, etc.
3. 类型引用 `MyType`, `Array<T>`
4. 数组类型 `T[]`
5. 元组类型 `[T, U]`
6. 函数类型 `(x: T) => U`
7. 条件类型 `T extends U ? X : Y`
8. 交叉类型 `T & U`
9. 联合类型 `T | U`

### 2. AST 节点定义

#### 2.1 SlimeAstTypeName 扩展

```typescript
// packages/slime-ast/src/SlimeAstTypeName.ts
export const SlimeAstTypeName = {
    ...SlimeJavascriptAstTypeName,
    
    // Phase 1: 基础类型
    TSTypeAnnotation: "TSTypeAnnotation",
    TSNumberKeyword: "TSNumberKeyword",
    TSStringKeyword: "TSStringKeyword",
    TSBooleanKeyword: "TSBooleanKeyword",
    TSAnyKeyword: "TSAnyKeyword",
    TSUnknownKeyword: "TSUnknownKeyword",
    TSVoidKeyword: "TSVoidKeyword",
    TSNeverKeyword: "TSNeverKeyword",
    TSNullKeyword: "TSNullKeyword",
    TSUndefinedKeyword: "TSUndefinedKeyword",
    TSObjectKeyword: "TSObjectKeyword",
    TSSymbolKeyword: "TSSymbolKeyword",
    TSBigIntKeyword: "TSBigIntKeyword",
    TSLiteralType: "TSLiteralType",
    TSTemplateLiteralType: "TSTemplateLiteralType",
    TSTypeReference: "TSTypeReference",
    TSQualifiedName: "TSQualifiedName",
    
    // Phase 2: 复合类型
    TSUnionType: "TSUnionType",
    TSIntersectionType: "TSIntersectionType",
    TSArrayType: "TSArrayType",
    TSTupleType: "TSTupleType",
    TSNamedTupleMember: "TSNamedTupleMember",
    TSRestType: "TSRestType",
    TSOptionalType: "TSOptionalType",
    TSTypeLiteral: "TSTypeLiteral",
    TSPropertySignature: "TSPropertySignature",
    TSIndexSignature: "TSIndexSignature",
    TSMethodSignature: "TSMethodSignature",
    TSCallSignatureDeclaration: "TSCallSignatureDeclaration",
    TSConstructSignatureDeclaration: "TSConstructSignatureDeclaration",
    TSFunctionType: "TSFunctionType",
    TSConstructorType: "TSConstructorType",
    
    // Phase 4: 类型声明
    TSInterfaceDeclaration: "TSInterfaceDeclaration",
    TSInterfaceBody: "TSInterfaceBody",
    TSInterfaceHeritage: "TSInterfaceHeritage",
    TSTypeAliasDeclaration: "TSTypeAliasDeclaration",
    TSEnumDeclaration: "TSEnumDeclaration",
    TSEnumMember: "TSEnumMember",
    
    // Phase 5: 泛型
    TSTypeParameterDeclaration: "TSTypeParameterDeclaration",
    TSTypeParameter: "TSTypeParameter",
    TSTypeParameterInstantiation: "TSTypeParameterInstantiation",
    
    // Phase 6: 类型操作符
    TSTypeQuery: "TSTypeQuery",
    TSTypeOperator: "TSTypeOperator",
    TSIndexedAccessType: "TSIndexedAccessType",
    TSConditionalType: "TSConditionalType",
    TSInferType: "TSInferType",
    TSMappedType: "TSMappedType",
    
    // Phase 7: 模块和命名空间
    TSImportType: "TSImportType",
    TSModuleDeclaration: "TSModuleDeclaration",
    TSModuleBlock: "TSModuleBlock",
    
    // Phase 8: 特殊语法
    TSAsExpression: "TSAsExpression",
    TSTypeAssertion: "TSTypeAssertion",
    TSNonNullExpression: "TSNonNullExpression",
    TSSatisfiesExpression: "TSSatisfiesExpression",
} as const;
```

#### 2.2 核心 AST 节点接口

```typescript
// packages/slime-ast/src/SlimeAstNode.ts

// ============================================
// TypeScript 类型节点基础
// ============================================

/** TypeScript 类型节点基类 */
export interface SlimeTSTypeBase extends SlimeBaseNode {
    // 所有 TS 类型节点的公共属性
}

/** 类型注解 */
export interface SlimeTSTypeAnnotation extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeAnnotation;
    colonToken?: SlimeColonToken;
    typeAnnotation: SlimeTSType;
}

// ============================================
// Phase 1: 基础类型关键字
// ============================================

export interface SlimeTSNumberKeyword extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSNumberKeyword;
}

export interface SlimeTSStringKeyword extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSStringKeyword;
}

export interface SlimeTSBooleanKeyword extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSBooleanKeyword;
}

// ... 其他基础类型关键字

/** 字面量类型 */
export interface SlimeTSLiteralType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSLiteralType;
    literal: SlimeStringLiteral | SlimeNumericLiteral | SlimeBooleanLiteral;
}

/** 类型引用 */
export interface SlimeTSTypeReference extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSTypeReference;
    typeName: SlimeIdentifier | SlimeTSQualifiedName;
    typeParameters?: SlimeTSTypeParameterInstantiation;
}

// ============================================
// Phase 2: 复合类型
// ============================================

/** 联合类型 */
export interface SlimeTSUnionType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSUnionType;
    types: SlimeTSType[];
}

/** 交叉类型 */
export interface SlimeTSIntersectionType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSIntersectionType;
    types: SlimeTSType[];
}

/** 数组类型 */
export interface SlimeTSArrayType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSArrayType;
    elementType: SlimeTSType;
}

/** 元组类型 */
export interface SlimeTSTupleType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSTupleType;
    elementTypes: (SlimeTSType | SlimeTSNamedTupleMember)[];
}

/** 函数类型 */
export interface SlimeTSFunctionType extends SlimeTSTypeBase {
    type: typeof SlimeAstTypeName.TSFunctionType;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType: SlimeTSTypeAnnotation;
}

// ============================================
// Phase 4: 类型声明
// ============================================

/** 接口声明 */
export interface SlimeTSInterfaceDeclaration extends SlimeBaseDeclaration {
    type: typeof SlimeAstTypeName.TSInterfaceDeclaration;
    id: SlimeIdentifier;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    extends?: SlimeTSInterfaceHeritage[];
    body: SlimeTSInterfaceBody;
}

/** 类型别名声明 */
export interface SlimeTSTypeAliasDeclaration extends SlimeBaseDeclaration {
    type: typeof SlimeAstTypeName.TSTypeAliasDeclaration;
    id: SlimeIdentifier;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    typeAnnotation: SlimeTSType;
}

/** 枚举声明 */
export interface SlimeTSEnumDeclaration extends SlimeBaseDeclaration {
    type: typeof SlimeAstTypeName.TSEnumDeclaration;
    const?: boolean;
    id: SlimeIdentifier;
    members: SlimeTSEnumMember[];
}

// ============================================
// Phase 5: 泛型
// ============================================

/** 类型参数声明 */
export interface SlimeTSTypeParameterDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeParameterDeclaration;
    params: SlimeTSTypeParameter[];
}

/** 类型参数 */
export interface SlimeTSTypeParameter extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeParameter;
    name: SlimeIdentifier;
    constraint?: SlimeTSType;
    default?: SlimeTSType;
}

// ============================================
// 类型联合
// ============================================

/** 所有 TypeScript 类型的联合 */
export type SlimeTSType =
    // 基础类型关键字
    | SlimeTSNumberKeyword
    | SlimeTSStringKeyword
    | SlimeTSBooleanKeyword
    | SlimeTSAnyKeyword
    | SlimeTSUnknownKeyword
    | SlimeTSVoidKeyword
    | SlimeTSNeverKeyword
    | SlimeTSNullKeyword
    | SlimeTSUndefinedKeyword
    | SlimeTSObjectKeyword
    | SlimeTSSymbolKeyword
    | SlimeTSBigIntKeyword
    // 字面量和引用
    | SlimeTSLiteralType
    | SlimeTSTypeReference
    // 复合类型
    | SlimeTSUnionType
    | SlimeTSIntersectionType
    | SlimeTSArrayType
    | SlimeTSTupleType
    | SlimeTSTypeLiteral
    | SlimeTSFunctionType
    | SlimeTSConstructorType
    // 类型操作符
    | SlimeTSTypeQuery
    | SlimeTSTypeOperator
    | SlimeTSIndexedAccessType
    | SlimeTSConditionalType
    | SlimeTSMappedType
    | SlimeTSInferType
    // 其他
    | SlimeTSTemplateLiteralType
    | SlimeTSImportType;
```

### 3. Generator 组件

#### 3.1 SlimeGenerator 扩展

```typescript
// packages/slime-generator/src/SlimeGenerator.ts
export default class SlimeGenerator extends SlimeJavascriptGenerator {
    
    // TypeScript 类型生成方法
    protected static generatorTSTypeAnnotation(node: SlimeTSTypeAnnotation): void
    protected static generatorTSType(node: SlimeTSType): void
    protected static generatorTSNumberKeyword(node: SlimeTSNumberKeyword): void
    protected static generatorTSStringKeyword(node: SlimeTSStringKeyword): void
    // ... 其他类型生成方法
    
    protected static generatorTSUnionType(node: SlimeTSUnionType): void
    protected static generatorTSIntersectionType(node: SlimeTSIntersectionType): void
    protected static generatorTSArrayType(node: SlimeTSArrayType): void
    protected static generatorTSTupleType(node: SlimeTSTupleType): void
    
    protected static generatorTSInterfaceDeclaration(node: SlimeTSInterfaceDeclaration): void
    protected static generatorTSTypeAliasDeclaration(node: SlimeTSTypeAliasDeclaration): void
    protected static generatorTSEnumDeclaration(node: SlimeTSEnumDeclaration): void
    
    // 重写 generatorNode 以支持 TypeScript 节点
    protected static generatorNode(node: SlimeBaseNode): void
}
```

## Data Models

### 类型关键字映射

```typescript
// TypeScript 类型关键字到 AST 节点类型的映射
const TSKeywordTypeMap = {
    'number': SlimeAstTypeName.TSNumberKeyword,
    'string': SlimeAstTypeName.TSStringKeyword,
    'boolean': SlimeAstTypeName.TSBooleanKeyword,
    'any': SlimeAstTypeName.TSAnyKeyword,
    'unknown': SlimeAstTypeName.TSUnknownKeyword,
    'void': SlimeAstTypeName.TSVoidKeyword,
    'never': SlimeAstTypeName.TSNeverKeyword,
    'null': SlimeAstTypeName.TSNullKeyword,
    'undefined': SlimeAstTypeName.TSUndefinedKeyword,
    'object': SlimeAstTypeName.TSObjectKeyword,
    'symbol': SlimeAstTypeName.TSSymbolKeyword,
    'bigint': SlimeAstTypeName.TSBigIntKeyword,
} as const;
```

### Token 扩展

```typescript
// packages/slime-token/src/SlimeTokenType.ts

/**
 * TypeScript 关键字分类
 *
 * 1. 硬关键字（复用 JavaScript）：
 *    - null: NullLiteral，直接使用 this.consume(NullLiteral)
 *    - void: 在表达式位置是硬关键字，使用 this.consume(Void)
 *    - typeof: 硬关键字，使用 this.consume(Typeof)
 *    - enum: ES 保留字，使用 this.consume(Enum)
 *
 * 2. 软关键字（Contextual Keywords）：
 *    在词法层是 IdentifierName，在特定语法位置作为关键字处理。
 *    可以作为变量名使用，如 `let number = 1` 是合法的。
 *    使用 consumeIdentifierValue() 匹配。
 */

// 硬关键字说明（复用 JavaScript 已有定义）
// - null: SlimeJavascriptReservedWordTokenTypes.NullLiteral
// - void: SlimeJavascriptUnaryOperatorTokenTypes.Void  
// - typeof: SlimeJavascriptUnaryOperatorTokenTypes.Typeof
// - enum: SlimeJavascriptReservedWordTokenTypes.Enum

export const SlimeTypescriptContextualKeywordTokenTypes = {
    // 注意：值必须使用小写，与实际源码中的写法一致
    // consumeIdentifierValue() 会比较 token.tokenValue === value
    
    // ============================================
    // 基础类型关键字（全部是软关键字）
    // 可以作为变量名：let number = 1; let string = "hello";
    // ============================================
    Number: 'number',
    String: 'string',
    Boolean: 'boolean',
    Any: 'any',
    Unknown: 'unknown',
    Never: 'never',
    Undefined: 'undefined',  // undefined 不是保留字，可作变量名
    Object: 'object',
    Symbol: 'symbol',
    Bigint: 'bigint',
    
    // ============================================
    // 类型声明关键字（软关键字）
    // ============================================
    Interface: 'interface',
    Type: 'type',
    Namespace: 'namespace',
    Module: 'module',
    Declare: 'declare',
    
    // ============================================
    // 类型操作符关键字（软关键字）
    // ============================================
    Readonly: 'readonly',
    Keyof: 'keyof',
    Infer: 'infer',
    Unique: 'unique',       // unique symbol
    
    // ============================================
    // 类成员修饰符（软关键字）
    // ============================================
    Abstract: 'abstract',
    Implements: 'implements',
    Private: 'private',
    Protected: 'protected',
    Public: 'public',
    Override: 'override',
    
    // ============================================
    // 类型断言和谓词（软关键字）
    // ============================================
    Satisfies: 'satisfies',
    Is: 'is',               // 类型谓词 `x is string`
    Asserts: 'asserts',     // 断言函数 `asserts x is string`
    
    // ============================================
    // 其他（软关键字）
    // ============================================
    Global: 'global',       // declare global
    Require: 'require',     // import = require()
    Out: 'out',             // 泛型协变 `out T`
    In: 'in',               // 泛型逆变 `in T`（注意：in 在 for-in 中是硬关键字）
} as const;

export const SlimeTokenType = {
    ...SlimeJavascriptTokenType,
    ...SlimeTypescriptContextualKeywordTokenTypes,
} as const;
```

### TokenConsumer 扩展

```typescript
// packages/slime-parser/src/SlimeTokenConsumer.ts
export default class SlimeTokenConsumer extends SlimeJavascriptTokenConsumer {
    
    // ============================================
    // TypeScript 软关键字消费方法
    // 使用 consumeIdentifierValue() 匹配 IdentifierName 的值
    // ============================================
    
    /** 消费 'number' 类型关键字 */
    TSNumber() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Number)
    }
    
    /** 消费 'string' 类型关键字 */
    TSString() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.String)
    }
    
    /** 消费 'boolean' 类型关键字 */
    TSBoolean() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Boolean)
    }
    
    /** 消费 'any' 类型关键字 */
    TSAny() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Any)
    }
    
    /** 消费 'unknown' 类型关键字 */
    TSUnknown() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Unknown)
    }
    
    /** 消费 'void' 类型关键字（在类型位置） */
    TSVoid() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Void)
    }
    
    /** 消费 'never' 类型关键字 */
    TSNever() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Never)
    }
    
    /** 消费 'null' 类型关键字 - 注意：null 是硬关键字，直接消费 */
    TSNull() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.NullLiteral)
    }
    
    /** 消费 'undefined' 类型关键字 */
    TSUndefined() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Undefined)
    }
    
    /** 消费 'object' 类型关键字 */
    TSObject() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Object)
    }
    
    /** 消费 'symbol' 类型关键字 */
    TSSymbol() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Symbol)
    }
    
    /** 消费 'bigint' 类型关键字 */
    TSBigint() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Bigint)
    }
    
    /** 消费 'interface' 关键字 */
    TSInterface() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Interface)
    }
    
    /** 消费 'type' 关键字 */
    TSType() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Type)
    }
    
    /** 消费 'readonly' 关键字 */
    TSReadonly() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Readonly)
    }
    
    /** 消费 'keyof' 关键字 */
    TSKeyof() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Keyof)
    }
    
    /** 消费 'infer' 关键字 */
    TSInfer() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Infer)
    }
    
    /** 消费 'declare' 关键字 */
    TSDeclare() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Declare)
    }
    
    /** 消费 'namespace' 关键字 */
    TSNamespace() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Namespace)
    }
    
    /** 消费 'module' 关键字 */
    TSModule() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Module)
    }
    
    /** 消费 'abstract' 关键字 */
    TSAbstract() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Abstract)
    }
    
    /** 消费 'implements' 关键字 */
    TSImplements() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Implements)
    }
    
    /** 消费 'private' 关键字 */
    TSPrivate() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Private)
    }
    
    /** 消费 'protected' 关键字 */
    TSProtected() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Protected)
    }
    
    /** 消费 'public' 关键字 */
    TSPublic() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Public)
    }
    
    /** 消费 'override' 关键字 */
    TSOverride() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Override)
    }
    
    /** 消费 'satisfies' 关键字 */
    TSSatisfies() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Satisfies)
    }
}
```



## Correctness Properties

*A property is a characteristic or behavior that should hold true across all valid executions of a system-essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.*

### Property 1: Round-Trip Consistency for Type Annotations

*For any* valid TypeScript source code with type annotations, parsing the code and then generating code from the AST SHALL produce semantically equivalent code that, when parsed again, produces an equivalent AST.

**Validates: Requirements 8.4, 9.6, 12.4, 25.6**

### Property 2: Type Keyword Recognition

*For any* TypeScript primitive type keyword (`number`, `string`, `boolean`, `any`, `unknown`, `void`, `never`, `null`, `undefined`, `object`, `symbol`, `bigint`) appearing in a type position, the parser SHALL recognize it as the corresponding TSKeyword node type.

**Validates: Requirements 1.1-1.12**

### Property 3: Literal Type Preservation

*For any* literal value (string, number, boolean) used as a type, the parser SHALL create a TSLiteralType node that preserves the exact literal value.

**Validates: Requirements 2.1-2.3**

### Property 4: Type Reference Resolution

*For any* type reference (simple or qualified), the parser SHALL correctly identify the type name and any type arguments, preserving the full qualification path.

**Validates: Requirements 3.1-3.4**

### Property 5: Union and Intersection Type Composition

*For any* union type `A | B | C` or intersection type `A & B & C`, the parser SHALL preserve all member types in order, and the generator SHALL output the correct operator between each type.

**Validates: Requirements 4.1-4.4**

### Property 6: Array and Tuple Type Structure

*For any* array type `T[]` or tuple type `[T, U, ...]`, the parser SHALL correctly identify the element type(s) and any modifiers (optional, rest, named).

**Validates: Requirements 5.1-5.6**

### Property 7: Object Type Member Preservation

*For any* object type literal with properties, methods, index signatures, call signatures, or construct signatures, the parser SHALL preserve all members with their modifiers (optional, readonly).

**Validates: Requirements 6.1-6.7**

### Property 8: Function Type Parameter and Return Type

*For any* function type `(params) => returnType`, the parser SHALL correctly parse all parameters (including optional and rest) and the return type.

**Validates: Requirements 7.1-7.5**

### Property 9: Interface Declaration Completeness

*For any* interface declaration with extends clause, type parameters, and body members, the parser SHALL preserve all components and the generator SHALL output valid interface syntax.

**Validates: Requirements 11.1-11.5**

### Property 10: Type Alias Declaration Equivalence

*For any* type alias declaration `type Name<T> = Type`, parsing then generating SHALL produce an equivalent declaration.

**Validates: Requirements 12.1-12.4**

### Property 11: Enum Member Value Preservation

*For any* enum declaration with initialized members, the parser SHALL preserve the initializer expressions and the const modifier if present.

**Validates: Requirements 13.1-13.4**

### Property 12: Generic Type Parameter Constraints and Defaults

*For any* generic type parameter with constraint and/or default, the parser SHALL preserve both the constraint type and default type.

**Validates: Requirements 14.1-14.6**

### Property 13: Type Assertion Syntax Preservation

*For any* type assertion (`x as T`, `<T>x`, `x!`, `x satisfies T`), the parser SHALL recognize the correct assertion type and preserve the asserted type.

**Validates: Requirements 22.1-22.5**

### Property 14: Type Import/Export Preservation

*For any* type-only import or export statement, the parser SHALL correctly identify it as type-only and preserve the type modifier.

**Validates: Requirements 19.1-19.4**

### Property 15: Namespace Declaration Structure

*For any* namespace or module declaration (including nested), the parser SHALL preserve the qualified name and all exported members.

**Validates: Requirements 20.1-20.4**

### Property 16: Decorator Order Preservation

*For any* decorated class, method, or property with multiple decorators, the parser SHALL preserve all decorators in their original order.

**Validates: Requirements 23.1-23.5**

## Error Handling

### 解析错误处理

1. **类型位置错误**: 当在非类型位置遇到类型语法时，报告明确的错误位置和期望的语法
2. **不完整类型**: 对于不完整的类型注解（如 `let x:`），尽可能解析已有部分并标记错误
3. **泛型括号不匹配**: 检测未闭合的 `<>` 并提供恢复策略
4. **关键字冲突**: 当标识符与 TypeScript 关键字冲突时，根据上下文决定解析方式

### 容错解析策略

```typescript
// 容错解析示例
interface ErrorRecoveryStrategy {
    // 跳过到下一个同步点
    skipToSyncPoint(): void;
    
    // 插入缺失的 token
    insertMissingToken(tokenType: string): void;
    
    // 创建错误节点
    createErrorNode(message: string, loc: SourceLocation): ErrorNode;
}
```

### 错误消息格式

```
Error: Unexpected token 'foo' in type position
  at line 10, column 15
  
  10 | let x: foo bar;
              ^^^
  
  Expected: type expression (e.g., 'number', 'string', 'MyType')
```

## Testing Strategy

### 测试框架

- 使用 Vitest 作为测试框架
- 使用 fast-check 进行属性测试
- 最小 100 次迭代每个属性测试

### 单元测试

针对每个 AST 节点类型编写单元测试：

```typescript
describe('TSNumberKeyword', () => {
    it('should parse number type annotation', () => {
        const code = 'let x: number';
        const ast = parse(code);
        expect(ast.body[0].declarations[0].id.typeAnnotation.typeAnnotation.type)
            .toBe('TSNumberKeyword');
    });
});
```

### 属性测试

```typescript
import { fc } from 'fast-check';

// Property 1: Round-Trip Consistency
// Feature: typescript-support, Property 1: Round-Trip Consistency
describe('Round-Trip Property Tests', () => {
    it('should preserve type annotations through round-trip', () => {
        fc.assert(
            fc.property(
                arbitraryTypeAnnotatedCode(),
                (code) => {
                    const ast1 = parse(code);
                    const generated = generate(ast1);
                    const ast2 = parse(generated);
                    return deepEqual(ast1, ast2);
                }
            ),
            { numRuns: 100 }
        );
    });
});

// Property 2: Type Keyword Recognition
// Feature: typescript-support, Property 2: Type Keyword Recognition
describe('Type Keyword Recognition', () => {
    it('should recognize all primitive type keywords', () => {
        fc.assert(
            fc.property(
                fc.constantFrom('number', 'string', 'boolean', 'any', 'unknown', 
                               'void', 'never', 'null', 'undefined', 'object', 
                               'symbol', 'bigint'),
                (keyword) => {
                    const code = `let x: ${keyword}`;
                    const ast = parse(code);
                    const typeNode = ast.body[0].declarations[0].id.typeAnnotation.typeAnnotation;
                    return typeNode.type === `TS${capitalize(keyword)}Keyword`;
                }
            ),
            { numRuns: 100 }
        );
    });
});
```

### 测试生成器 (Arbitrary)

```typescript
// 生成随机有效的 TypeScript 类型
const arbitraryTSType = (): fc.Arbitrary<string> => {
    return fc.oneof(
        // 基础类型
        fc.constantFrom('number', 'string', 'boolean', 'any', 'unknown', 'void', 'never'),
        // 字面量类型
        fc.string().map(s => `"${s}"`),
        fc.integer().map(n => `${n}`),
        // 数组类型
        fc.constant('number[]'),
        // 联合类型
        fc.tuple(arbitrarySimpleType(), arbitrarySimpleType()).map(([a, b]) => `${a} | ${b}`),
        // 交叉类型
        fc.tuple(arbitrarySimpleType(), arbitrarySimpleType()).map(([a, b]) => `${a} & ${b}`)
    );
};

// 生成随机有效的类型注解代码
const arbitraryTypeAnnotatedCode = (): fc.Arbitrary<string> => {
    return fc.oneof(
        // 变量声明
        fc.tuple(fc.string(), arbitraryTSType())
            .map(([name, type]) => `let ${name}: ${type}`),
        // 函数参数
        fc.tuple(fc.string(), arbitraryTSType(), arbitraryTSType())
            .map(([name, paramType, returnType]) => 
                `function ${name}(x: ${paramType}): ${returnType} {}`),
        // 接口声明
        fc.tuple(fc.string(), fc.array(fc.tuple(fc.string(), arbitraryTSType())))
            .map(([name, props]) => 
                `interface ${name} { ${props.map(([k, v]) => `${k}: ${v}`).join('; ')} }`)
    );
};
```

### 测试覆盖目标

| 阶段 | 单元测试 | 属性测试 | 覆盖率目标 |
|------|----------|----------|------------|
| Phase 1 | 12 个类型关键字 | Property 2 | 100% |
| Phase 2 | 复合类型组合 | Property 5, 6, 7, 8 | 95% |
| Phase 3 | 类型注解位置 | Property 1 | 95% |
| Phase 4 | 类型声明 | Property 9, 10, 11 | 95% |
| Phase 5 | 泛型 | Property 12 | 95% |
| Phase 6 | 类型操作符 | - | 90% |
| Phase 7 | 模块/命名空间 | Property 14, 15 | 90% |
| Phase 8 | 特殊语法 | Property 13, 16 | 90% |
| Phase 9 | 代码生成 | Property 1 | 95% |
| Phase 10 | 容错解析 | - | 80% |

