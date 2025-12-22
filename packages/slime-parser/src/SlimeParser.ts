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
} from "subhuti"
import SlimeTokenConsumer from "./SlimeTokenConsumer.ts"
import SlimeJavascriptParser, { type ExpressionParams } from "./deprecated/SlimeJavascriptParser.ts";

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
    override BindingIdentifier(params: ExpressionParams = {}): SubhutiCst | undefined {
        // 首先解析基础的 BindingIdentifier
        this.Or([
            { alt: () => this.Identifier() },
            { alt: () => this.tokenConsumer.Yield() },
            { alt: () => this.tokenConsumer.Await() }
        ])
        // [TypeScript] 可选的类型注解
        return this.Option(() => this.TSTypeAnnotation())
    }

    /**
     * [TypeScript] 类型注解
     *
     * TSTypeAnnotation :
     *     : TSType
     */
    @SubhutiRule
    TSTypeAnnotation(): SubhutiCst | undefined {
        this.tokenConsumer.Colon()
        return this.TSType()
    }

    /**
     * [TypeScript] 类型
     *
     * TSType :
     *     TSNumberKeyword
     *     (future: TSStringKeyword | TSBooleanKeyword | ...)
     */
    @SubhutiRule
    TSType(): SubhutiCst | undefined {
        return this.Or([
            { alt: () => this.TSNumberKeyword() }
        ])
    }

    /**
     * [TypeScript] number 类型关键字
     *
     * TSNumberKeyword :
     *     number
     */
    @SubhutiRule
    TSNumberKeyword(): SubhutiCst | undefined {
        // number 是上下文关键字，使用 IdentifierName 匹配并验证值
        const token = this.tokenConsumer.IdentifierName()
        if (!token || token.value !== 'number') {
            return this.setParseFail()
        }
        return token
    }
}
