# Requirements Document

## Introduction

本文档定义了 Slime 解析器全面支持 TypeScript 语法的需求。目标是支持除类型体操（高级类型推导、条件类型嵌套等）以外的所有常用 TypeScript 语法。采用最小化渐进式推进策略，每个阶段实现一个语法类别。

## Glossary

- **Slime_Parser**: Slime 的语法解析器，负责将源代码解析为 CST
- **CST**: 具体语法树 (Concrete Syntax Tree)
- **AST**: 抽象语法树 (Abstract Syntax Tree)
- **Type_Annotation**: TypeScript 类型注解，如 `: number`
- **Type_Reference**: 类型引用，如 `Array<T>`, `Promise<string>`
- **Generic**: 泛型，如 `<T>`, `<T, U>`
- **Interface**: 接口定义
- **Type_Alias**: 类型别名，如 `type Name = string`
- **Union_Type**: 联合类型，如 `string | number`
- **Intersection_Type**: 交叉类型，如 `A & B`
- **Round_Trip**: 解析后再生成代码，应产生语义等价的结果

---

## Phase 1: 基础类型系统

### Requirement 1: 基础类型关键字

**User Story:** As a developer, I want to use TypeScript primitive type keywords, so that I can annotate with basic types.

#### Acceptance Criteria

1. WHEN the Parser encounters `number` as a type, THE Slime_Parser SHALL recognize it as TSNumberKeyword
2. WHEN the Parser encounters `string` as a type, THE Slime_Parser SHALL recognize it as TSStringKeyword
3. WHEN the Parser encounters `boolean` as a type, THE Slime_Parser SHALL recognize it as TSBooleanKeyword
4. WHEN the Parser encounters `any` as a type, THE Slime_Parser SHALL recognize it as TSAnyKeyword
5. WHEN the Parser encounters `unknown` as a type, THE Slime_Parser SHALL recognize it as TSUnknownKeyword
6. WHEN the Parser encounters `void` as a type, THE Slime_Parser SHALL recognize it as TSVoidKeyword
7. WHEN the Parser encounters `never` as a type, THE Slime_Parser SHALL recognize it as TSNeverKeyword
8. WHEN the Parser encounters `null` as a type, THE Slime_Parser SHALL recognize it as TSNullKeyword
9. WHEN the Parser encounters `undefined` as a type, THE Slime_Parser SHALL recognize it as TSUndefinedKeyword
10. WHEN the Parser encounters `object` as a type, THE Slime_Parser SHALL recognize it as TSObjectKeyword
11. WHEN the Parser encounters `symbol` as a type, THE Slime_Parser SHALL recognize it as TSSymbolKeyword
12. WHEN the Parser encounters `bigint` as a type, THE Slime_Parser SHALL recognize it as TSBigIntKeyword

### Requirement 2: 字面量类型

**User Story:** As a developer, I want to use literal types, so that I can constrain values to specific literals.

#### Acceptance Criteria

1. WHEN the Parser encounters a string literal type like `"hello"`, THE Slime_Parser SHALL recognize it as TSLiteralType with StringLiteral
2. WHEN the Parser encounters a number literal type like `42`, THE Slime_Parser SHALL recognize it as TSLiteralType with NumericLiteral
3. WHEN the Parser encounters a boolean literal type like `true` or `false`, THE Slime_Parser SHALL recognize it as TSLiteralType with BooleanLiteral
4. WHEN the Parser encounters a template literal type like `` `hello${string}` ``, THE Slime_Parser SHALL recognize it as TSTemplateLiteralType

### Requirement 3: 类型引用

**User Story:** As a developer, I want to reference named types, so that I can use custom types and built-in generic types.

#### Acceptance Criteria

1. WHEN the Parser encounters a type reference like `MyType`, THE Slime_Parser SHALL recognize it as TSTypeReference
2. WHEN the Parser encounters a qualified type reference like `Namespace.Type`, THE Slime_Parser SHALL recognize it as TSQualifiedName
3. WHEN the Parser encounters a generic type reference like `Array<number>`, THE Slime_Parser SHALL parse the type arguments correctly
4. WHEN the Parser encounters nested generics like `Map<string, Array<number>>`, THE Slime_Parser SHALL parse all type arguments correctly

---

## Phase 2: 复合类型

### Requirement 4: 联合类型和交叉类型

**User Story:** As a developer, I want to use union and intersection types, so that I can combine types flexibly.

#### Acceptance Criteria

1. WHEN the Parser encounters a union type like `string | number`, THE Slime_Parser SHALL recognize it as TSUnionType
2. WHEN the Parser encounters multiple union members like `string | number | boolean`, THE Slime_Parser SHALL parse all members
3. WHEN the Parser encounters an intersection type like `A & B`, THE Slime_Parser SHALL recognize it as TSIntersectionType
4. WHEN the Parser encounters mixed union and intersection like `(A & B) | C`, THE Slime_Parser SHALL respect operator precedence

### Requirement 5: 数组和元组类型

**User Story:** As a developer, I want to use array and tuple types, so that I can type collections.

#### Acceptance Criteria

1. WHEN the Parser encounters array syntax like `number[]`, THE Slime_Parser SHALL recognize it as TSArrayType
2. WHEN the Parser encounters generic array like `Array<number>`, THE Slime_Parser SHALL recognize it as TSTypeReference with Array
3. WHEN the Parser encounters a tuple type like `[string, number]`, THE Slime_Parser SHALL recognize it as TSTupleType
4. WHEN the Parser encounters a named tuple like `[name: string, age: number]`, THE Slime_Parser SHALL parse the labels
5. WHEN the Parser encounters rest elements in tuple like `[string, ...number[]]`, THE Slime_Parser SHALL parse the rest element
6. WHEN the Parser encounters optional tuple elements like `[string, number?]`, THE Slime_Parser SHALL parse the optional marker

### Requirement 6: 对象类型和索引签名

**User Story:** As a developer, I want to use object types and index signatures, so that I can describe object shapes.

#### Acceptance Criteria

1. WHEN the Parser encounters an object type like `{ name: string }`, THE Slime_Parser SHALL recognize it as TSTypeLiteral
2. WHEN the Parser encounters optional properties like `{ name?: string }`, THE Slime_Parser SHALL parse the optional marker
3. WHEN the Parser encounters readonly properties like `{ readonly id: number }`, THE Slime_Parser SHALL parse the readonly modifier
4. WHEN the Parser encounters an index signature like `{ [key: string]: number }`, THE Slime_Parser SHALL recognize it as TSIndexSignature
5. WHEN the Parser encounters method signatures like `{ getName(): string }`, THE Slime_Parser SHALL parse the method signature
6. WHEN the Parser encounters call signatures like `{ (x: number): string }`, THE Slime_Parser SHALL parse the call signature
7. WHEN the Parser encounters construct signatures like `{ new (x: number): MyClass }`, THE Slime_Parser SHALL parse the construct signature

### Requirement 7: 函数类型

**User Story:** As a developer, I want to use function types, so that I can type callbacks and function references.

#### Acceptance Criteria

1. WHEN the Parser encounters a function type like `(x: number) => string`, THE Slime_Parser SHALL recognize it as TSFunctionType
2. WHEN the Parser encounters a constructor type like `new (x: number) => MyClass`, THE Slime_Parser SHALL recognize it as TSConstructorType
3. WHEN the Parser encounters optional parameters like `(x?: number) => void`, THE Slime_Parser SHALL parse the optional marker
4. WHEN the Parser encounters rest parameters like `(...args: number[]) => void`, THE Slime_Parser SHALL parse the rest parameter
5. WHEN the Parser encounters generic function types like `<T>(x: T) => T`, THE Slime_Parser SHALL parse the type parameters

---

## Phase 3: 类型注解位置

### Requirement 8: 变量声明类型注解

**User Story:** As a developer, I want to add type annotations to variable declarations, so that I can specify variable types.

#### Acceptance Criteria

1. WHEN a let declaration has a type annotation like `let x: number`, THE Slime_Parser SHALL parse the type annotation
2. WHEN a const declaration has a type annotation like `const y: string = "hello"`, THE Slime_Parser SHALL parse both type and initializer
3. WHEN a var declaration has a type annotation like `var z: boolean`, THE Slime_Parser SHALL parse the type annotation
4. FOR ALL valid type-annotated variable declarations, parsing then printing SHALL produce semantically equivalent code

### Requirement 9: 函数参数和返回类型

**User Story:** As a developer, I want to add type annotations to function parameters and return types.

#### Acceptance Criteria

1. WHEN a function parameter has a type like `function foo(x: number)`, THE Slime_Parser SHALL parse the parameter type
2. WHEN a function has a return type like `function foo(): number`, THE Slime_Parser SHALL parse the return type
3. WHEN an arrow function has typed parameters like `(x: string) => x`, THE Slime_Parser SHALL parse the parameter types
4. WHEN an arrow function has a return type like `(): string => "hello"`, THE Slime_Parser SHALL parse the return type
5. WHEN a method has types like `class A { foo(x: number): string {} }`, THE Slime_Parser SHALL parse parameter and return types
6. FOR ALL valid function type annotations, parsing then printing SHALL produce semantically equivalent code

### Requirement 10: 类成员类型注解

**User Story:** As a developer, I want to add type annotations to class members.

#### Acceptance Criteria

1. WHEN a class property has a type like `class A { name: string }`, THE Slime_Parser SHALL parse the property type
2. WHEN a class property has modifiers like `class A { readonly id: number }`, THE Slime_Parser SHALL parse the modifiers
3. WHEN a class property has visibility like `class A { private name: string }`, THE Slime_Parser SHALL parse the visibility modifier
4. WHEN a class has a constructor with typed parameters, THE Slime_Parser SHALL parse the parameter types
5. WHEN a constructor has parameter properties like `constructor(public name: string)`, THE Slime_Parser SHALL parse the parameter property

---

## Phase 4: 类型声明

### Requirement 11: 接口声明

**User Story:** As a developer, I want to declare interfaces, so that I can define object contracts.

#### Acceptance Criteria

1. WHEN the Parser encounters `interface Foo { }`, THE Slime_Parser SHALL recognize it as TSInterfaceDeclaration
2. WHEN an interface extends another like `interface Foo extends Bar`, THE Slime_Parser SHALL parse the extends clause
3. WHEN an interface extends multiple interfaces, THE Slime_Parser SHALL parse all extended interfaces
4. WHEN an interface has generic parameters like `interface Foo<T>`, THE Slime_Parser SHALL parse the type parameters
5. WHEN an interface has properties, methods, and signatures, THE Slime_Parser SHALL parse all members

### Requirement 12: 类型别名声明

**User Story:** As a developer, I want to declare type aliases, so that I can create named types.

#### Acceptance Criteria

1. WHEN the Parser encounters `type Name = string`, THE Slime_Parser SHALL recognize it as TSTypeAliasDeclaration
2. WHEN a type alias has generics like `type Container<T> = { value: T }`, THE Slime_Parser SHALL parse the type parameters
3. WHEN a type alias uses union types like `type ID = string | number`, THE Slime_Parser SHALL parse the union
4. FOR ALL valid type alias declarations, parsing then printing SHALL produce semantically equivalent code

### Requirement 13: 枚举声明

**User Story:** As a developer, I want to declare enums, so that I can define named constants.

#### Acceptance Criteria

1. WHEN the Parser encounters `enum Color { Red, Green, Blue }`, THE Slime_Parser SHALL recognize it as TSEnumDeclaration
2. WHEN enum members have initializers like `enum Color { Red = 1 }`, THE Slime_Parser SHALL parse the initializers
3. WHEN the Parser encounters `const enum`, THE Slime_Parser SHALL parse the const modifier
4. WHEN enum members have computed values, THE Slime_Parser SHALL parse the expressions

---

## Phase 5: 泛型

### Requirement 14: 泛型类型参数

**User Story:** As a developer, I want to use generic type parameters, so that I can create reusable typed components.

#### Acceptance Criteria

1. WHEN a function has type parameters like `function foo<T>()`, THE Slime_Parser SHALL parse the type parameters
2. WHEN a class has type parameters like `class Box<T>`, THE Slime_Parser SHALL parse the type parameters
3. WHEN type parameters have constraints like `<T extends Base>`, THE Slime_Parser SHALL parse the constraint
4. WHEN type parameters have defaults like `<T = string>`, THE Slime_Parser SHALL parse the default
5. WHEN multiple type parameters exist like `<T, U, V>`, THE Slime_Parser SHALL parse all parameters
6. WHEN type parameters have both constraint and default like `<T extends Base = Default>`, THE Slime_Parser SHALL parse both

### Requirement 15: 泛型调用

**User Story:** As a developer, I want to provide type arguments when calling generic functions.

#### Acceptance Criteria

1. WHEN calling a generic function like `foo<number>()`, THE Slime_Parser SHALL parse the type arguments
2. WHEN instantiating a generic class like `new Box<string>()`, THE Slime_Parser SHALL parse the type arguments
3. WHEN calling with multiple type arguments like `foo<string, number>()`, THE Slime_Parser SHALL parse all arguments

---

## Phase 6: 类型操作符

### Requirement 16: 类型查询和索引访问

**User Story:** As a developer, I want to use typeof and keyof operators, so that I can derive types from values and keys.

#### Acceptance Criteria

1. WHEN the Parser encounters `typeof x` in type position, THE Slime_Parser SHALL recognize it as TSTypeQuery
2. WHEN the Parser encounters `keyof T`, THE Slime_Parser SHALL recognize it as TSTypeOperator with keyof
3. WHEN the Parser encounters indexed access like `T[K]`, THE Slime_Parser SHALL recognize it as TSIndexedAccessType
4. WHEN the Parser encounters `readonly T[]`, THE Slime_Parser SHALL recognize it as TSTypeOperator with readonly

### Requirement 17: 条件类型（基础）

**User Story:** As a developer, I want to use basic conditional types, so that I can create type-level conditionals.

#### Acceptance Criteria

1. WHEN the Parser encounters `T extends U ? X : Y`, THE Slime_Parser SHALL recognize it as TSConditionalType
2. WHEN the Parser encounters `infer` in conditional types, THE Slime_Parser SHALL recognize it as TSInferType
3. WHEN conditional types are nested, THE Slime_Parser SHALL parse the nesting correctly

### Requirement 18: 映射类型（基础）

**User Story:** As a developer, I want to use basic mapped types, so that I can transform object types.

#### Acceptance Criteria

1. WHEN the Parser encounters `{ [K in keyof T]: T[K] }`, THE Slime_Parser SHALL recognize it as TSMappedType
2. WHEN mapped types have modifiers like `{ readonly [K in keyof T]: T[K] }`, THE Slime_Parser SHALL parse the modifiers
3. WHEN mapped types have optional modifiers like `{ [K in keyof T]?: T[K] }`, THE Slime_Parser SHALL parse the optional marker
4. WHEN mapped types have +/- modifiers like `{ -readonly [K in keyof T]: T[K] }`, THE Slime_Parser SHALL parse the modifier signs

---

## Phase 7: 模块和命名空间

### Requirement 19: 类型导入导出

**User Story:** As a developer, I want to import and export types, so that I can share type definitions across modules.

#### Acceptance Criteria

1. WHEN the Parser encounters `import type { Foo } from 'module'`, THE Slime_Parser SHALL recognize it as type-only import
2. WHEN the Parser encounters `export type { Foo }`, THE Slime_Parser SHALL recognize it as type-only export
3. WHEN the Parser encounters `import { type Foo } from 'module'`, THE Slime_Parser SHALL parse inline type import
4. WHEN the Parser encounters `export { type Foo }`, THE Slime_Parser SHALL parse inline type export

### Requirement 20: 命名空间

**User Story:** As a developer, I want to use namespaces, so that I can organize code and types.

#### Acceptance Criteria

1. WHEN the Parser encounters `namespace Foo { }`, THE Slime_Parser SHALL recognize it as TSModuleDeclaration
2. WHEN the Parser encounters `module Foo { }`, THE Slime_Parser SHALL recognize it as TSModuleDeclaration
3. WHEN namespaces are nested like `namespace A.B.C { }`, THE Slime_Parser SHALL parse the qualified name
4. WHEN namespaces contain exports, THE Slime_Parser SHALL parse the exported members

### Requirement 21: 声明文件语法

**User Story:** As a developer, I want to use declare statements, so that I can describe external APIs.

#### Acceptance Criteria

1. WHEN the Parser encounters `declare const x: number`, THE Slime_Parser SHALL parse the declare modifier
2. WHEN the Parser encounters `declare function foo(): void`, THE Slime_Parser SHALL parse the ambient function
3. WHEN the Parser encounters `declare class Foo { }`, THE Slime_Parser SHALL parse the ambient class
4. WHEN the Parser encounters `declare module 'foo' { }`, THE Slime_Parser SHALL parse the ambient module
5. WHEN the Parser encounters `declare global { }`, THE Slime_Parser SHALL parse the global augmentation

---

## Phase 8: 特殊语法

### Requirement 22: 类型断言

**User Story:** As a developer, I want to use type assertions, so that I can override inferred types.

#### Acceptance Criteria

1. WHEN the Parser encounters `x as string`, THE Slime_Parser SHALL recognize it as TSAsExpression
2. WHEN the Parser encounters `<string>x`, THE Slime_Parser SHALL recognize it as TSTypeAssertion
3. WHEN the Parser encounters `x as const`, THE Slime_Parser SHALL recognize it as const assertion
4. WHEN the Parser encounters `x!`, THE Slime_Parser SHALL recognize it as TSNonNullExpression
5. WHEN the Parser encounters `x satisfies Type`, THE Slime_Parser SHALL recognize it as TSSatisfiesExpression

### Requirement 23: 装饰器

**User Story:** As a developer, I want to use decorators, so that I can add metadata to classes and members.

#### Acceptance Criteria

1. WHEN the Parser encounters `@decorator class Foo { }`, THE Slime_Parser SHALL parse the class decorator
2. WHEN the Parser encounters `@decorator method() { }`, THE Slime_Parser SHALL parse the method decorator
3. WHEN the Parser encounters `@decorator property: string`, THE Slime_Parser SHALL parse the property decorator
4. WHEN the Parser encounters `@decorator(args)`, THE Slime_Parser SHALL parse the decorator factory call
5. WHEN multiple decorators are present, THE Slime_Parser SHALL parse all decorators in order

### Requirement 24: 可选链和空值合并的类型支持

**User Story:** As a developer, I want optional chaining and nullish coalescing to work with TypeScript types.

#### Acceptance Criteria

1. WHEN the Parser encounters `x?.y` with type annotations, THE Slime_Parser SHALL preserve type information
2. WHEN the Parser encounters `x ?? y` with type annotations, THE Slime_Parser SHALL preserve type information

---

## Phase 9: 代码生成

### Requirement 25: TypeScript 代码生成

**User Story:** As a developer, I want the generator to output valid TypeScript code from AST.

#### Acceptance Criteria

1. WHEN generating code from AST with type annotations, THE Slime_Generator SHALL output valid TypeScript syntax
2. WHEN generating interface declarations, THE Slime_Generator SHALL output correct interface syntax
3. WHEN generating type alias declarations, THE Slime_Generator SHALL output correct type alias syntax
4. WHEN generating generic types, THE Slime_Generator SHALL output correct angle bracket syntax
5. WHEN generating union and intersection types, THE Slime_Generator SHALL output correct operator syntax
6. FOR ALL valid TypeScript AST nodes, generating then parsing SHALL produce equivalent AST (round-trip property)

---

## Phase 10: 容错解析

### Requirement 26: 容错解析支持

**User Story:** As a developer using an editor, I want the parser to handle incomplete TypeScript code gracefully.

#### Acceptance Criteria

1. WHEN a type annotation is incomplete like `let x:`, THE Slime_Parser SHALL parse as much as possible
2. WHEN a generic is incomplete like `Array<`, THE Slime_Parser SHALL recover gracefully
3. WHEN an interface body is incomplete like `interface Foo {`, THE Slime_Parser SHALL parse the declaration
4. IF an unexpected token appears in a type position, THEN THE Slime_Parser SHALL recover and continue parsing
5. WHEN type syntax is malformed, THE Slime_Parser SHALL provide useful error information
