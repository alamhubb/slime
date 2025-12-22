import {SlimeJavascriptTokenType} from "./deprecated/SlimeJavascriptTokenType.ts";

/**
 * TypeScript 软关键字（Contextual Keywords）Token 类型
 *
 * 这些标识符在词法层是 IdentifierName，在特定语法位置作为关键字处理。
 * 可以作为变量名使用，如 `let number = 1` 是合法的。
 * 使用 consumeIdentifierValue() 匹配。
 *
 * 硬关键字说明（复用 JavaScript 已有定义）：
 * - null: SlimeJavascriptReservedWordTokenTypes.NullLiteral
 * - void: SlimeJavascriptUnaryOperatorTokenTypes.Void (表达式位置)
 * - typeof: SlimeJavascriptUnaryOperatorTokenTypes.Typeof (表达式位置)
 * - enum: SlimeJavascriptReservedWordTokenTypes.Enum
 */
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
    // 注意：in 在 for-in 中是硬关键字，泛型逆变 `in T` 需要特殊处理
} as const;

export const SlimeTokenType = {
    ...SlimeJavascriptTokenType,
    ...SlimeTypescriptContextualKeywordTokenTypes,
} as const;

