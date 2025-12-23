# Implementation Plan: TypeScript Support

## Overview

基于渐进式实现策略，按照需求文档中定义的 10 个阶段逐步实现 TypeScript 支持。每个阶段独立可测试，确保增量交付。

## Tasks

- [x] 1. Phase 1: 基础类型系统 - Token 和 AST 基础设施
  - [x] 1.1 扩展 SlimeTokenType 添加 TypeScript 软关键字定义
    - 在 `packages/slime-token/src/SlimeTokenType.ts` 中添加 `SlimeTypescriptContextualKeywordTokenTypes`
    - 包含所有基础类型关键字: number, string, boolean, any, unknown, never, undefined, object, symbol, bigint
    - _Requirements: 1.1-1.12_
  - [x] 1.2 扩展 SlimeTokenConsumer 添加 TypeScript 软关键字消费方法
    - 在 `packages/slime-parser/src/SlimeTokenConsumer.ts` 中添加 TSNumber(), TSString() 等方法
    - 使用 `consumeIdentifierValue()` 模式匹配软关键字
    - _Requirements: 1.1-1.12_
  - [x] 1.3 扩展 SlimeAstTypeName 添加 TypeScript AST 节点类型
    - 在 `packages/slime-ast/src/SlimeAstTypeName.ts` 中添加 TSTypeAnnotation, TSNumberKeyword 等
    - _Requirements: 1.1-1.12, 2.1-2.4, 3.1-3.4_
  - [x] 1.4 扩展 SlimeAstNode 添加 TypeScript AST 节点接口
    - 在 `packages/slime-ast/src/SlimeAstNode.ts` 中添加 SlimeTSTypeAnnotation, SlimeTSNumberKeyword 等接口
    - 定义 SlimeTSType 联合类型
    - _Requirements: 1.1-1.12, 2.1-2.4, 3.1-3.4_

- [x] 2. Phase 1: 基础类型系统 - Parser 实现
  - [x] 2.1 实现 TSType 基础解析规则
    - 在 `packages/slime-parser/src/SlimeParser.ts` 中实现 TSType() 规则
    - 支持所有 12 个基础类型关键字的解析
    - _Requirements: 1.1-1.12_
  - [x] 2.2 实现 TSTypeAnnotation 解析规则
    - 解析 `: Type` 语法
    - _Requirements: 8.1-8.4_
  - [x] 2.3 实现 TSLiteralType 解析规则
    - 支持字符串、数字、布尔字面量类型
    - _Requirements: 2.1-2.3_
  - [x] 2.4 实现 TSTypeReference 解析规则
    - 支持简单类型引用和限定名称 (Namespace.Type)
    - _Requirements: 3.1-3.2_
  - [ ]* 2.5 编写 Phase 1 单元测试
    - 测试所有基础类型关键字的解析
    - 测试字面量类型和类型引用
    - _Requirements: 1.1-1.12, 2.1-2.3, 3.1-3.2_
  - [ ]* 2.6 编写属性测试: Type Keyword Recognition
    - **Property 2: Type Keyword Recognition**
    - **Validates: Requirements 1.1-1.12**

- [x] 3. Checkpoint - Phase 1 验证
  - 确保所有测试通过，如有问题请询问用户
  - ✅ 测试通过: 1732/3202 (0 失败, 1470 跳过)

- [x] 4. Phase 2: 复合类型 - Parser 实现
  - [x] 4.1 实现 TSUnionType 和 TSIntersectionType 解析
    - 支持 `A | B | C` 和 `A & B & C` 语法
    - 正确处理运算符优先级
    - _Requirements: 4.1-4.4_
  - [x] 4.2 实现 TSArrayType 解析
    - 支持 `T[]` 语法
    - _Requirements: 5.1_
  - [x] 4.3 实现 TSTupleType 解析
    - 支持 `[T, U]`、命名元组 `[name: T]`、可选元素 `[T?]`、剩余元素 `[...T[]]`
    - _Requirements: 5.3-5.6_
  - [x] 4.4 实现 TSTypeLiteral 解析
    - 支持对象类型字面量 `{ name: string }`
    - 支持可选属性、只读属性、索引签名、方法签名
    - _Requirements: 6.1-6.7_
  - [x] 4.5 实现 TSFunctionType 和 TSConstructorType 解析
    - 支持 `(x: T) => U` 和 `new (x: T) => U` 语法
    - _Requirements: 7.1-7.5_
  - [ ]* 4.6 编写 Phase 2 单元测试
    - _Requirements: 4.1-4.4, 5.1-5.6, 6.1-6.7, 7.1-7.5_
  - [ ]* 4.7 编写属性测试: Union and Intersection Type Composition
    - **Property 5: Union and Intersection Type Composition**
    - **Validates: Requirements 4.1-4.4**

- [x] 5. Checkpoint - Phase 2 验证
  - 确保所有测试通过，如有问题请询问用户
  - ✅ 测试通过: 1732/3202 (0 失败, 1470 跳过)

- [x] 6. Phase 3: 类型注解位置 - 重写现有规则
  - [x] 6.1 重写 BindingIdentifier 支持类型注解
    - 在变量声明中支持 `let x: number`
    - _Requirements: 8.1-8.3_
  - [x] 6.2 重写 FormalParameter 支持参数类型
    - 支持 `function foo(x: number)`
    - 注意：由于 FormalParameter -> BindingElement -> SingleNameBinding -> BindingIdentifier，而 BindingIdentifier 已支持类型注解，所以参数类型已间接支持
    - _Requirements: 9.1_
  - [x] 6.3 重写 FunctionDeclaration/FunctionExpression 支持返回类型
    - 支持 `function foo(): number`
    - 同时重写了 GeneratorDeclaration/GeneratorExpression, AsyncFunctionDeclaration/AsyncFunctionExpression, AsyncGeneratorDeclaration/AsyncGeneratorExpression
    - _Requirements: 9.2_
  - [x] 6.4 重写 ArrowFunctionExpression 支持类型注解
    - 支持 `(x: string): number => x.length`
    - 同时重写了 AsyncArrowFunction
    - _Requirements: 9.3-9.4_
  - [x] 6.5 重写 ClassDeclaration 支持类成员类型
    - 支持属性类型、方法类型、可见性修饰符 (public, private, protected, readonly)
    - 重写了 ClassElement, FieldDefinition, MethodDefinition, GeneratorMethod, AsyncMethod, AsyncGeneratorMethod
    - _Requirements: 10.1-10.5_
  - [ ]* 6.6 编写属性测试: Round-Trip Consistency
    - **Property 1: Round-Trip Consistency for Type Annotations**
    - **Validates: Requirements 8.4, 9.6**

- [x] 7. Checkpoint - Phase 3 验证
  - 确保所有测试通过，如有问题请询问用户
  - ✅ 测试通过: 1732/3202 (0 失败, 1470 跳过)

- [x] 8. Phase 4: 类型声明
  - [x] 8.1 实现 TSInterfaceDeclaration 解析
    - 支持 `interface Foo extends Bar { }`
    - 支持泛型参数
    - _Requirements: 11.1-11.5_
  - [x] 8.2 实现 TSTypeAliasDeclaration 解析
    - 支持 `type Name<T> = Type`
    - _Requirements: 12.1-12.3_
  - [x] 8.3 实现 TSEnumDeclaration 解析
    - 支持 `enum Color { Red = 1 }` 和 `const enum`
    - _Requirements: 13.1-13.4_
  - [ ]* 8.4 编写属性测试: Interface Declaration Completeness
    - **Property 9: Interface Declaration Completeness**
    - **Validates: Requirements 11.1-11.5**
  - [ ]* 8.5 编写属性测试: Type Alias Declaration Equivalence
    - **Property 10: Type Alias Declaration Equivalence**
    - **Validates: Requirements 12.1-12.4**

- [x] 9. Checkpoint - Phase 4 验证
  - 确保所有测试通过，如有问题请询问用户
  - ✅ 测试通过: 1732/3202 (0 失败, 1470 跳过)

- [ ] 10. Phase 5: 泛型
  - [ ] 10.1 实现 TSTypeParameterDeclaration 解析
    - 支持 `<T>`, `<T extends Base>`, `<T = Default>`, `<T extends Base = Default>`
    - _Requirements: 14.1-14.6_
  - [ ] 10.2 实现 TSTypeParameterInstantiation 解析
    - 支持 `foo<number>()`, `new Box<string>()`
    - _Requirements: 15.1-15.3_
  - [ ] 10.3 更新函数和类解析以支持泛型
    - 在 FunctionDeclaration, ClassDeclaration 中添加泛型支持
    - _Requirements: 14.1-14.2_
  - [ ]* 10.4 编写属性测试: Generic Type Parameter Constraints and Defaults
    - **Property 12: Generic Type Parameter Constraints and Defaults**
    - **Validates: Requirements 14.1-14.6**

- [ ] 11. Checkpoint - Phase 5 验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 12. Phase 6: 类型操作符
  - [ ] 12.1 实现 TSTypeQuery 解析
    - 支持 `typeof x` 在类型位置
    - _Requirements: 16.1_
  - [ ] 12.2 实现 TSTypeOperator 解析
    - 支持 `keyof T`, `readonly T[]`, `unique symbol`
    - _Requirements: 16.2, 16.4_
  - [ ] 12.3 实现 TSIndexedAccessType 解析
    - 支持 `T[K]`
    - _Requirements: 16.3_
  - [ ] 12.4 实现 TSConditionalType 解析
    - 支持 `T extends U ? X : Y`
    - _Requirements: 17.1-17.3_
  - [ ] 12.5 实现 TSInferType 解析
    - 支持 `infer R` 在条件类型中
    - _Requirements: 17.2_
  - [ ] 12.6 实现 TSMappedType 解析
    - 支持 `{ [K in keyof T]: T[K] }` 及修饰符
    - _Requirements: 18.1-18.4_
  - [ ]* 12.7 编写 Phase 6 单元测试
    - _Requirements: 16.1-16.4, 17.1-17.3, 18.1-18.4_

- [ ] 13. Checkpoint - Phase 6 验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 14. Phase 7: 模块和命名空间
  - [ ] 14.1 实现类型导入导出解析
    - 支持 `import type { Foo }`, `export type { Foo }`
    - 支持内联类型导入 `import { type Foo }`
    - _Requirements: 19.1-19.4_
  - [ ] 14.2 实现 TSModuleDeclaration 解析
    - 支持 `namespace Foo { }`, `module Foo { }`
    - 支持嵌套命名空间 `namespace A.B.C { }`
    - _Requirements: 20.1-20.4_
  - [ ] 14.3 实现 declare 语句解析
    - 支持 `declare const`, `declare function`, `declare class`, `declare module`, `declare global`
    - _Requirements: 21.1-21.5_
  - [ ]* 14.4 编写属性测试: Type Import/Export Preservation
    - **Property 14: Type Import/Export Preservation**
    - **Validates: Requirements 19.1-19.4**
  - [ ]* 14.5 编写属性测试: Namespace Declaration Structure
    - **Property 15: Namespace Declaration Structure**
    - **Validates: Requirements 20.1-20.4**

- [ ] 15. Checkpoint - Phase 7 验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 16. Phase 8: 特殊语法
  - [ ] 16.1 实现 TSAsExpression 解析
    - 支持 `x as string`, `x as const`
    - _Requirements: 22.1, 22.3_
  - [ ] 16.2 实现 TSTypeAssertion 解析
    - 支持 `<string>x`
    - _Requirements: 22.2_
  - [ ] 16.3 实现 TSNonNullExpression 解析
    - 支持 `x!`
    - _Requirements: 22.4_
  - [ ] 16.4 实现 TSSatisfiesExpression 解析
    - 支持 `x satisfies Type`
    - _Requirements: 22.5_
  - [ ] 16.5 实现装饰器解析
    - 支持类、方法、属性装饰器
    - 支持装饰器工厂 `@decorator(args)`
    - _Requirements: 23.1-23.5_
  - [ ]* 16.6 编写属性测试: Type Assertion Syntax Preservation
    - **Property 13: Type Assertion Syntax Preservation**
    - **Validates: Requirements 22.1-22.5**
  - [ ]* 16.7 编写属性测试: Decorator Order Preservation
    - **Property 16: Decorator Order Preservation**
    - **Validates: Requirements 23.1-23.5**

- [ ] 17. Checkpoint - Phase 8 验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 18. Phase 9: 代码生成
  - [ ] 18.1 扩展 SlimeGenerator 支持 TypeScript 类型节点
    - 实现 generatorTSTypeAnnotation, generatorTSType 等方法
    - _Requirements: 25.1_
  - [ ] 18.2 实现类型声明代码生成
    - 支持 interface, type alias, enum 的代码生成
    - _Requirements: 25.2-25.3_
  - [ ] 18.3 实现泛型和复合类型代码生成
    - 支持泛型参数、联合类型、交叉类型的代码生成
    - _Requirements: 25.4-25.5_
  - [ ]* 18.4 编写 Round-Trip 属性测试
    - **Property 1: Round-Trip Consistency (完整版)**
    - **Validates: Requirements 25.6**

- [ ] 19. Checkpoint - Phase 9 验证
  - 确保所有测试通过，如有问题请询问用户

- [ ] 20. Phase 10: 容错解析
  - [ ] 20.1 实现不完整类型注解的容错解析
    - 处理 `let x:` 等不完整语法
    - _Requirements: 26.1_
  - [ ] 20.2 实现不完整泛型的容错解析
    - 处理 `Array<` 等不完整语法
    - _Requirements: 26.2_
  - [ ] 20.3 实现不完整声明的容错解析
    - 处理 `interface Foo {` 等不完整语法
    - _Requirements: 26.3_
  - [ ] 20.4 实现错误恢复和错误信息
    - 提供有用的错误位置和建议
    - _Requirements: 26.4-26.5_
  - [ ]* 20.5 编写容错解析测试
    - _Requirements: 26.1-26.5_

- [ ] 21. Final Checkpoint - 完整验证
  - 确保所有测试通过
  - 验证所有需求已覆盖
  - 如有问题请询问用户

## Notes

- 任务标记 `*` 的为可选任务（测试相关），可跳过以加快 MVP 开发
- 每个 Checkpoint 确保增量验证，及时发现问题
- 属性测试使用 fast-check 库，每个属性最少 100 次迭代
- 所有 TypeScript 类型关键字作为软关键字处理，使用 `consumeIdentifierValue()` 模式
