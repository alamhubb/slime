# Slime TypeScript 支持文档

本文档说明 Slime Parser 对 TypeScript 语法的支持方式和设计原则。

## 核心设计原则

### 重写优先，而非新建类型

**原则：对于 JavaScript 中已存在的语法概念，应该使用 `override` 重写父类方法，而不是新建 `TS*` 类型。**

#### 为什么？

1. **代码复用** - 重写可以复用父类的大部分逻辑，只需添加 TypeScript 特有的部分
2. **语义清晰** - 保持与 JavaScript 语法的对应关系，便于理解
3. **维护简单** - 修改父类时，子类自动继承改动
4. **避免冗余** - 不会产生功能重复的规则

#### 什么时候新建类型？

只有当语法概念是 **TypeScript 特有的**，在 JavaScript 中完全不存在时，才新建 `TS*` 类型。

## 规则分类

### ✅ 使用 `override` 重写的规则

这些规则在 JavaScript 中已存在，TypeScript 只是添加了类型注解或修饰符：

| 规则 | TypeScript 扩展 |
|------|----------------|
| `BindingIdentifier` | 添加可选类型注解 `x: Type` |
| `ArrowFunction` | 添加返回类型注解 `() => Type` |
| `AsyncArrowFunction` | 添加返回类型注解 |
| `MethodDefinition` | 添加返回类型注解 |
| `GeneratorMethod` | 添加返回类型注解 |
| `AsyncMethod` | 添加返回类型注解 |
| `AsyncGeneratorMethod` | 添加返回类型注解 |
| `ClassElement` | 添加可见性修饰符 `public/private/protected` |
| `FieldDefinition` | 添加类型注解 |
| `Declaration` | 添加 TypeScript 声明类型 |
| `FunctionDeclaration` | 添加泛型参数 `<T>` 和返回类型 |
| `FunctionExpression` | 添加泛型参数和返回类型 |
| `ClassDeclaration` | 添加泛型参数和 `implements` |
| `ClassExpression` | 添加泛型参数和 `implements` |
| `ClassTail` | 添加 `implements` 子句 |
| `ClassHeritage` | 添加类型参数 `extends Foo<T>` |
| `GeneratorDeclaration` | 添加泛型参数和返回类型 |
| `GeneratorExpression` | 添加泛型参数和返回类型 |
| `AsyncFunctionDeclaration` | 添加泛型参数和返回类型 |
| `AsyncFunctionExpression` | 添加泛型参数和返回类型 |
| `AsyncGeneratorDeclaration` | 添加泛型参数和返回类型 |
| `AsyncGeneratorExpression` | 添加泛型参数和返回类型 |

### ✅ 新建的 TypeScript 特有规则

这些是 JavaScript 中不存在的概念，必须新建：

| 规则 | 说明 |
|------|------|
| `TSTypeAnnotation` | 类型注解 `: Type` |
| `TSType` | 类型表达式入口 |
| `TSKeywordType` | 基础类型关键字分发 |
| `TSNumberKeyword` | `number` 类型 |
| `TSStringKeyword` | `string` 类型 |
| `TSBooleanKeyword` | `boolean` 类型 |
| `TSAnyKeyword` | `any` 类型 |
| `TSUnknownKeyword` | `unknown` 类型 |
| `TSVoidKeyword` | `void` 类型 |
| `TSNeverKeyword` | `never` 类型 |
| `TSNullKeyword` | `null` 类型 |
| `TSUndefinedKeyword` | `undefined` 类型 |
| `TSObjectKeyword` | `object` 类型 |
| `TSSymbolKeyword` | `symbol` 类型 |
| `TSBigIntKeyword` | `bigint` 类型 |
| `TSTypeReference` | 类型引用 `MyType<T>` |
| `TSTypeLiteral` | 对象类型字面量 `{ name: string }` |
| `TSTupleType` | 元组类型 `[T, U]` |
| `TSFunctionType` | 函数类型 `(x: T) => U` |
| `TSConstructorType` | 构造函数类型 `new (x: T) => U` |
| `TSConditionalType` | 条件类型 `T extends U ? X : Y` |
| `TSUnionOrIntersectionType` | 联合/交叉类型 `T | U` / `T & U` |
| `TSMappedType` | 映射类型 `{ [K in keyof T]: T[K] }` |
| `TSTypeQuery` | 类型查询 `typeof x` |
| `TSTypeOperator` | 类型操作符 `keyof T` / `readonly T` |
| `TSInferType` | 推断类型 `infer R` |
| `TSInterfaceDeclaration` | 接口声明 `interface Foo {}` |
| `TSTypeAliasDeclaration` | 类型别名 `type ID = number` |
| `TSEnumDeclaration` | 枚举声明 `enum Color {}` |
| `TSTypeParameterDeclaration` | 泛型参数声明 `<T, U>` |
| `TSAccessibilityModifier` | 可见性修饰符 |
| `TSClassImplements` | implements 子句 |

## Token 命名规范

### `Assign` vs `Eq`

**决定：使用 `Assign` 而非 ES2025 规范中的 `Eq`**

原因：
1. **语义清晰** - `Assign` 明确表达赋值操作，`Eq` 容易与相等比较 `==`/`===` 混淆
2. **命名一致** - 与复合赋值运算符 `PlusAssign`、`MinusAssign` 等保持统一风格
3. **避免歧义** - 代码中看到 `Eq` 可能让人困惑是 `=` 还是 `==`

## 方法拦截机制

由于 deprecated 包中的代码硬编码调用 `SlimeJavascriptCstToAstUtil.xxx()`，无法通过类继承重写来拦截。

解决方案：在 `SlimeCstToAstUtil` 构造函数中，运行时替换 `SlimeJavascriptCstToAstUtil` 单例的方法引用。

```typescript
// SlimeCstToAstUtil.ts
constructor() {
    super()
    this._setupMethodInterception()
}

private _setupMethodInterception() {
    // 替换方法引用，指向支持 TypeScript 的新实现
    SlimeJavascriptCstToAstUtil.createClassDeclarationAst = 
        SlimeClassDeclarationCstToAst.createClassDeclarationAst.bind(SlimeClassDeclarationCstToAst)
    // ... 更多拦截
}
```

## 文件结构

```
packages/slime-parser/src/
├── SlimeParser.ts              # TypeScript Parser（重写 + 新规则）
├── SlimeTokenConsumer.ts       # TypeScript Token 消费
├── SlimeCstToAstUtil.ts        # CST-to-AST 入口 + 方法拦截
└── cstToAst/
    ├── class/
    │   ├── SlimeClassDeclarationCstToAst.ts  # 类声明转换
    │   └── SlimeMethodDefinitionCstToAst.ts  # 方法定义转换
    ├── identifier/
    │   └── SlimeIdentifierCstToAst.ts        # 标识符 + TS 声明转换
    └── ...

packages/slime-generator/src/
└── SlimeGenerator.ts           # TypeScript 代码生成（重写 + 新方法）
```

## 测试覆盖

TypeScript 支持通过 16 个测试用例验证：

1. `01-basic-types` - 基础类型关键字
2. `02-literal-types` - 字面量类型
3. `03-type-references` - 类型引用
4. `04-union-intersection` - 联合/交叉类型
5. `05-array-tuple` - 数组/元组类型
6. `06-object-type-literal` - 对象类型字面量
7. `07-function-types` - 函数类型
8. `08-variable-annotations` - 变量类型注解
9. `09-function-annotations` - 函数类型注解
10. `10-arrow-functions` - 箭头函数类型
11. `11-class-members` - 类成员类型
12. `12-interface` - 接口声明
13. `13-type-alias` - 类型别名
14. `14-enum` - 枚举声明
15. `15-type-operators` - 类型操作符
16. `16-type-assertions` - 类型断言 (as, <>, !, satisfies)

运行测试：
```bash
npx tsx packages/slime-test/src/utils/test-stage4.ts
```


## 语法支持状态

### ✅ 已支持的语法

#### 类型注解
| 语法 | 示例 | 状态 |
|------|------|------|
| 变量类型注解 | `let x: number` | ✅ |
| 函数参数类型 | `function f(x: number)` | ✅ |
| 函数返回类型 | `function f(): number` | ✅ |
| 箭头函数类型 | `(x: number): string => x.toString()` | ✅ |
| 类属性类型 | `class A { x: number }` | ✅ |
| 类方法返回类型 | `class A { f(): void {} }` | ✅ |

#### 基础类型
| 语法 | 示例 | 状态 |
|------|------|------|
| 原始类型 | `number`, `string`, `boolean` | ✅ |
| 特殊类型 | `any`, `unknown`, `never`, `void` | ✅ |
| 字面量类型 | `null`, `undefined` | ✅ |
| 对象类型 | `object`, `symbol`, `bigint` | ✅ |
| 字面量类型 | `"hello"`, `42`, `true` | ✅ |

#### 复合类型
| 语法 | 示例 | 状态 |
|------|------|------|
| 联合类型 | `string \| number` | ✅ |
| 交叉类型 | `A & B` | ✅ |
| 数组类型 | `number[]`, `Array<number>` | ✅ |
| 元组类型 | `[string, number]` | ✅ |
| 命名元组 | `[name: string, age: number]` | ✅ |
| 可选元组元素 | `[string, number?]` | ✅ |
| 剩余元组元素 | `[string, ...number[]]` | ✅ |

#### 对象类型
| 语法 | 示例 | 状态 |
|------|------|------|
| 对象类型字面量 | `{ name: string }` | ✅ |
| 可选属性 | `{ name?: string }` | ✅ |
| 只读属性 | `{ readonly name: string }` | ✅ |
| 索引签名 | `{ [key: string]: number }` | ✅ |
| 方法签名 | `{ f(x: number): void }` | ✅ |
| 调用签名 | `{ (x: number): void }` | ✅ |
| 构造签名 | `{ new (x: number): A }` | ✅ |

#### 函数类型
| 语法 | 示例 | 状态 |
|------|------|------|
| 函数类型 | `(x: number) => string` | ✅ |
| 构造函数类型 | `new (x: number) => A` | ✅ |
| 可选参数 | `(x?: number) => void` | ✅ |
| 剩余参数 | `(...args: number[]) => void` | ✅ |

#### 泛型
| 语法 | 示例 | 状态 |
|------|------|------|
| 泛型函数 | `function f<T>(x: T): T` | ✅ |
| 泛型类 | `class A<T> {}` | ✅ |
| 泛型接口 | `interface A<T> {}` | ✅ |
| 泛型类型别名 | `type A<T> = T[]` | ✅ |
| 泛型约束 | `<T extends U>` | ✅ |
| 泛型默认值 | `<T = string>` | ✅ |
| 类型参数实例化 | `Array<number>` | ✅ |

#### 类型操作符
| 语法 | 示例 | 状态 |
|------|------|------|
| typeof | `typeof obj` | ✅ |
| keyof | `keyof T` | ✅ |
| readonly | `readonly T[]` | ✅ |
| 索引访问类型 | `T[K]`, `T["name"]` | ✅ |
| 条件类型 | `T extends U ? X : Y` | ✅ |
| 映射类型 | `{ [K in keyof T]: T[K] }` | ✅ |
| infer | `T extends (infer R)[] ? R : never` | ✅ |
| unique symbol | `unique symbol` | ✅ |

#### 声明
| 语法 | 示例 | 状态 |
|------|------|------|
| 接口声明 | `interface A {}` | ✅ |
| 接口继承 | `interface A extends B {}` | ✅ |
| 类型别名 | `type A = number` | ✅ |
| 枚举声明 | `enum Color { Red, Green }` | ✅ |
| const 枚举 | `const enum Color {}` | ✅ |
| 字符串枚举 | `enum Color { Red = "RED" }` | ✅ |
| 计算枚举成员 | `enum A { B = 1 + 2 }` | ✅ |

#### 类扩展
| 语法 | 示例 | 状态 |
|------|------|------|
| implements | `class A implements B {}` | ✅ |
| 可见性修饰符 | `public`, `private`, `protected` | ✅ |
| readonly 修饰符 | `readonly name: string` | ✅ |

---

### 🔄 待支持的语法（计划中）

#### 高优先级
| 语法 | 示例 | 说明 |
|------|------|------|
| 类型断言 | `x as string`, `<string>x` | ✅ 已支持 |
| 非空断言 | `x!` | ✅ 已支持 |
| satisfies 操作符 | `obj satisfies Type` | ✅ 已支持 |
| 类型谓词 | `x is string` | 类型守卫 |
| asserts 关键字 | `asserts x is string` | 断言函数 |

#### 中优先级
| 语法 | 示例 | 说明 |
|------|------|------|
| 命名空间 | `namespace A {}` | 模块组织 |
| 模块声明 | `module "foo" {}` | 模块增强 |
| declare 关键字 | `declare const x: number` | 环境声明 |
| abstract 类 | `abstract class A {}` | 抽象类 |
| abstract 成员 | `abstract f(): void` | 抽象成员 |
| override 修饰符 | `override f() {}` | 方法重写标记 |

#### 低优先级
| 语法 | 示例 | 说明 |
|------|------|------|
| 装饰器 | `@decorator class A {}` | 实验性语法 |
| 参数属性 | `constructor(public x: number)` | 构造函数简写 |
| 索引签名类 | `class A { [key: string]: any }` | 较少使用 |
| this 类型 | `this is Foo` | 多态 this |
| 模板字面量类型 | `` `hello ${string}` `` | TypeScript 4.1+ |
| 递归类型别名 | `type A = A[]` | 复杂类型 |

---

### ❌ 不准备支持的语法

| 语法 | 示例 | 不支持原因 |
|------|------|-----------|
| JSX/TSX | `<Component />` | 需要单独的 JSX 解析器，建议使用专门的 JSX 工具 |
| 三斜线指令 | `/// <reference path="..." />` | 已被 ES 模块取代，属于遗留语法 |
| import = require | `import x = require("x")` | CommonJS 语法，建议使用 ES 模块 |
| export = | `export = x` | CommonJS 语法，建议使用 ES 模块 |
| 全局增强 | `declare global {}` | 复杂度高，使用场景有限 |
| 混入模式 | `class A extends mixin(B, C)` | 运行时模式，非语法层面 |

---

### 语法支持路线图

```
Phase 1 (已完成) ✅
├── 基础类型注解
├── 复合类型（联合、交叉、数组、元组）
├── 对象类型字面量
├── 函数类型
├── 泛型基础
├── 类型操作符
├── interface/type/enum 声明
└── 类扩展（implements、可见性修饰符）

Phase 2 (已完成) ✅
├── 类型断言 (as, <>)
├── 非空断言 (!)
├── satisfies 操作符
├── 类型谓词 (is) - 待实现
└── asserts 关键字 - 待实现

Phase 3 (进行中) 🔄
├── 命名空间 ✅
├── 模块声明 - 待实现
├── declare 关键字 - 待实现
├── abstract 类和成员 - 待实现
└── override 修饰符 - 待实现

Phase 4 (待定) ⏳
├── 装饰器
├── 参数属性
├── 模板字面量类型
└── 其他高级特性
```

## 贡献指南

如果你想添加新的 TypeScript 语法支持，请遵循以下步骤：

1. **确定语法类型**
   - JavaScript 已有概念 → 使用 `override` 重写
   - TypeScript 特有概念 → 新建 `TS*` 规则

2. **修改文件**
   - Parser: `packages/slime-parser/src/SlimeParser.ts`
   - TokenConsumer: `packages/slime-parser/src/SlimeTokenConsumer.ts`
   - CST-to-AST: `packages/slime-parser/src/cstToAst/` 相关文件
   - Generator: `packages/slime-generator/src/SlimeGenerator.ts`

3. **添加测试**
   - 在 `packages/slime-test/src/typescript/` 添加测试文件
   - 运行 `npx tsx packages/slime-test/src/utils/test-stage4.ts` 验证

4. **更新文档**
   - 更新本文档的语法支持状态
