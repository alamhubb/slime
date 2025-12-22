/**
 * ES2025 Parser - 完全符合 ECMAScript® 2025 规范的 Parser
 * 规范：https://tc39.es/ecma262/2025/#sec-grammar-summary
 *
 * 设计原则：
 * 1. 完全按照规范语法实现，一对一映射
 * 2. 每个规则都是独立的方法，使用 @SubhutiRule 装饰器
 * 3. 使用 Es2025TokenConsumer 提供类型安全的 token 消费
 * 4. 支持所有参数化规则 [Yield, Await, In, Return, Default, Tagged]
 *
 * @version 1.0.0
 */
import {
    Subhuti,
    SubhutiRule,
    type SubhutiCst,
    type SubhutiParserOptions,
    type SubhutiTokenConsumerConstructor,
} from "subhuti"
import SlimeTokenConsumer from "./SlimeTokenConsumer.ts"
import SlimeJavascriptParser, { type ExpressionParams } from "./deprecated/SlimeJavascriptParser.ts";
import { slimeJavascriptTokens } from "./deprecated/SlimeJavascriptTokens.ts";

// ============================================
// 保留字集合（用于 Identifier 验证）
// ============================================

/**
 * ES2025 保留字集合
 * 来源：ECMAScript® 2025 规范 12.7.2 Keywords and Reserved Words
 *
 * 分类说明：
 * 1. 硬关键字（永久保留，在此集合中）：
 *    break, case, catch, class, const, continue, debugger, default,
 *    delete, do, else, enum, export, extends, false, finally, for, function,
 *    if, import, in, instanceof, new, null, return, super, switch, this,
 *    throw, true, try, typeof, var, void, while, with, await, yield
 *    实现方式：createKeywordToken + 独立 Token
 *
 * 2. 软关键字（不在此集合中，可作标识符）：
 *    async, let, static, as, get, set, of, from, target, meta
 *    - async: 可作变量名，如 `let async = 1`
 *    - let, static: 非严格模式下可作标识符
 *    - 其他: 仅在特定语法位置是关键字
 *    实现方式：识别为 IdentifierName + consumeIdentifierValue()
 *
 * 用途：在 Parser 中验证标识符是否为保留字
 * 实现：自动从所有 isKeyword=true 的 token 中提取（仅包含硬关键字）
 */

// ============================================
// Es2025Parser 主类
// ============================================

@Subhuti
export default class SlimeParser<T extends SlimeTokenConsumer = SlimeTokenConsumer> extends SlimeJavascriptParser<T> {

    /**
     * 构造函数
     * @param sourceCode 原始源码
     * @param options 可选配置
     */
    constructor(sourceCode: string = '', options?: SubhutiParserOptions<T>) {
        const defaultTokenConsumer = SlimeTokenConsumer as unknown as SubhutiTokenConsumerConstructor<T>
        super(sourceCode, {
            tokenConsumer: options?.tokenConsumer ?? defaultTokenConsumer,
            tokenDefinitions: options?.tokenDefinitions ?? slimeJavascriptTokens
        })
    }

    // ============================================
    // TypeScript 扩展: 类型注解
    // ============================================

    /**
     * [TypeScript] 重写 BindingIdentifier 以支持可选的类型注解
     *
     * BindingIdentifier[Yield, Await] :
     *     Identifier
     *     yield
     *     await
     *
     * [TypeScript 扩展]:
     *     BindingIdentifier TSTypeAnnotation_opt
     */
    @SubhutiRule
    override BindingIdentifier(params: ExpressionParams = {}) {
        // 首先解析基础的 BindingIdentifier
        this.Or([
            { alt: () => this.Identifier() },
            { alt: () => this.tokenConsumer.Yield() },
            { alt: () => this.tokenConsumer.Await() }
        ])
        // [TypeScript] 可选的类型注解
        this.Option(() => this.TSTypeAnnotation())
    }

    // ============================================
    // TypeScript: 类型注解
    // ============================================

    /**
     * [TypeScript] 类型注解
     *
     * TSTypeAnnotation :
     *     : TSType
     */
    @SubhutiRule
    TSTypeAnnotation() {
        this.tokenConsumer.Colon()
        this.TSType()
    }

    // ============================================
    // TypeScript: 类型 (Phase 1 - 基础类型)
    // ============================================

    /**
     * [TypeScript] 类型
     *
     * TSType :
     *     TSPrimaryType
     *     TSUnionType
     *     TSIntersectionType
     *     TSConditionalType
     *     TSFunctionType
     *     TSConstructorType
     *
     * 优先级（从低到高）：
     * 1. 联合类型 |
     * 2. 交叉类型 &
     * 3. 条件类型 extends ? :
     * 4. 基础类型
     */
    @SubhutiRule
    TSType() {
        // Phase 1: 只支持基础类型，后续阶段会扩展
        this.TSPrimaryType()
    }

    /**
     * [TypeScript] 基础类型
     *
     * TSPrimaryType :
     *     TSKeywordType
     *     TSLiteralType
     *     TSTypeReference
     *     TSParenthesizedType
     *     TSTypeLiteral
     *     TSTupleType
     *     TSArrayType (后缀)
     */
    @SubhutiRule
    TSPrimaryType() {
        this.Or([
            // 基础类型关键字
            { alt: () => this.TSKeywordType() },
            // 字面量类型
            { alt: () => this.TSLiteralType() },
            // 类型引用 (MyType, Array<T>)
            { alt: () => this.TSTypeReference() },
            // 括号类型 (T)
            { alt: () => this.TSParenthesizedType() },
        ])
    }

    /**
     * [TypeScript] 关键字类型
     *
     * TSKeywordType :
     *     TSNumberKeyword | TSStringKeyword | TSBooleanKeyword | ...
     */
    @SubhutiRule
    TSKeywordType() {
        this.Or([
            { alt: () => this.TSNumberKeyword() },
            { alt: () => this.TSStringKeyword() },
            { alt: () => this.TSBooleanKeyword() },
            { alt: () => this.TSAnyKeyword() },
            { alt: () => this.TSUnknownKeyword() },
            { alt: () => this.TSVoidKeyword() },
            { alt: () => this.TSNeverKeyword() },
            { alt: () => this.TSNullKeyword() },
            { alt: () => this.TSUndefinedKeyword() },
            { alt: () => this.TSObjectKeyword() },
            { alt: () => this.TSSymbolKeyword() },
            { alt: () => this.TSBigIntKeyword() },
        ])
    }

    // ============================================
    // TypeScript: 基础类型关键字 (Phase 1)
    // ============================================

    /**
     * [TypeScript] number 类型关键字
     */
    @SubhutiRule
    TSNumberKeyword() {
        this.tokenConsumer.TSNumber()
    }

    /**
     * [TypeScript] string 类型关键字
     */
    @SubhutiRule
    TSStringKeyword() {
        this.tokenConsumer.TSString()
    }

    /**
     * [TypeScript] boolean 类型关键字
     */
    @SubhutiRule
    TSBooleanKeyword() {
        this.tokenConsumer.TSBoolean()
    }

    /**
     * [TypeScript] any 类型关键字
     */
    @SubhutiRule
    TSAnyKeyword() {
        this.tokenConsumer.TSAny()
    }

    /**
     * [TypeScript] unknown 类型关键字
     */
    @SubhutiRule
    TSUnknownKeyword() {
        this.tokenConsumer.TSUnknown()
    }

    /**
     * [TypeScript] void 类型关键字
     * 注意：void 在表达式位置是硬关键字，在类型位置是软关键字
     */
    @SubhutiRule
    TSVoidKeyword() {
        // 尝试作为硬关键字消费（表达式位置的 void）
        // 如果失败，尝试作为软关键字消费
        this.Or([
            { alt: () => this.tokenConsumer.Void() },
        ])
    }

    /**
     * [TypeScript] never 类型关键字
     */
    @SubhutiRule
    TSNeverKeyword() {
        this.tokenConsumer.TSNever()
    }

    /**
     * [TypeScript] null 类型关键字
     * 注意：null 是硬关键字
     */
    @SubhutiRule
    TSNullKeyword() {
        this.tokenConsumer.NullLiteral()
    }

    /**
     * [TypeScript] undefined 类型关键字
     */
    @SubhutiRule
    TSUndefinedKeyword() {
        this.tokenConsumer.TSUndefined()
    }

    /**
     * [TypeScript] object 类型关键字
     */
    @SubhutiRule
    TSObjectKeyword() {
        this.tokenConsumer.TSObject()
    }

    /**
     * [TypeScript] symbol 类型关键字
     */
    @SubhutiRule
    TSSymbolKeyword() {
        this.tokenConsumer.TSSymbol()
    }

    /**
     * [TypeScript] bigint 类型关键字
     */
    @SubhutiRule
    TSBigIntKeyword() {
        this.tokenConsumer.TSBigint()
    }

    // ============================================
    // TypeScript: 字面量类型 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 字面量类型
     *
     * TSLiteralType :
     *     StringLiteral
     *     NumericLiteral
     *     BooleanLiteral
     */
    @SubhutiRule
    TSLiteralType() {
        this.Or([
            { alt: () => this.tokenConsumer.StringLiteral() },
            { alt: () => this.tokenConsumer.NumericLiteral() },
            { alt: () => this.tokenConsumer.True() },
            { alt: () => this.tokenConsumer.False() },
        ])
    }

    // ============================================
    // TypeScript: 类型引用 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 类型引用
     *
     * TSTypeReference :
     *     TSTypeName TSTypeArguments_opt
     *
     * TSTypeName :
     *     Identifier
     *     TSQualifiedName
     */
    @SubhutiRule
    TSTypeReference() {
        // 解析类型名称（可能是限定名称 Namespace.Type）
        this.TSTypeName()
        // 可选的类型参数 <T, U>
        this.Option(() => this.TSTypeParameterInstantiation())
        return undefined
    }

    /**
     * [TypeScript] 类型名称
     *
     * TSTypeName :
     *     Identifier
     *     TSQualifiedName
     *
     * TSQualifiedName :
     *     TSTypeName . Identifier
     */
    @SubhutiRule
    TSTypeName() {
        // 首先解析标识符
        this.Identifier()
        // 然后解析可能的限定名称 (.Identifier)*
        this.Many(() => {
            this.tokenConsumer.Dot()
            this.Identifier()
        })
        return undefined
    }

    /**
     * [TypeScript] 类型参数实例化
     *
     * TSTypeParameterInstantiation :
     *     < TSTypeList >
     *
     * TSTypeList :
     *     TSType
     *     TSTypeList , TSType
     */
    @SubhutiRule
    TSTypeParameterInstantiation() {
        this.tokenConsumer.Less()
        // 至少一个类型参数
        this.TSType()
        // 可选的更多类型参数
        this.Many(() => {
            this.tokenConsumer.Comma()
            this.TSType()
        })
        this.tokenConsumer.Greater()
        return undefined
    }

    // ============================================
    // TypeScript: 括号类型 (Phase 1)
    // ============================================

    /**
     * [TypeScript] 括号类型
     *
     * TSParenthesizedType :
     *     ( TSType )
     */
    @SubhutiRule
    TSParenthesizedType() {
        this.tokenConsumer.LParen()
        this.TSType()
        this.tokenConsumer.RParen()
        return undefined
    }
}
