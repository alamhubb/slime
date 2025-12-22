/**
 * ES2025 Token Consumer - Token 消费封装
 *
 * 职责：
 * 1. 为每个 ES2025 token 提供类型安全的消费方法
 * 2. 提供语义化的 API（方法名即文档）
 * 3. 支持 IDE 自动补全和编译时检查
 *
 * 设计模式：
 * - 继承 SubhutiTokenConsumer（基于接口依赖）
 * - 为每个 TokenNames 提供对应的消费方法
 * - 方法名与 token 名一致，易于理解
 *
 * @version 1.0.0
 */


import SlimeJavascriptTokenConsumer from "./deprecated/SlimeJavascriptTokenConsumer.ts";
import { SlimeTypescriptContextualKeywordTokenTypes } from "slime-token";

export default class SlimeTokenConsumer extends SlimeJavascriptTokenConsumer {

    // ============================================
    // TypeScript 软关键字消费方法
    // 使用 consumeIdentifierValue() 匹配 IdentifierName 的值
    // ============================================

    // ============================================
    // 基础类型关键字
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

    /** 消费 'never' 类型关键字 */
    TSNever() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Never)
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

    // ============================================
    // 类型声明关键字
    // ============================================

    /** 消费 'interface' 关键字 */
    TSInterface() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Interface)
    }

    /** 消费 'type' 关键字 */
    TSType() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Type)
    }

    /** 消费 'namespace' 关键字 */
    TSNamespace() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Namespace)
    }

    /** 消费 'module' 关键字 */
    TSModule() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Module)
    }

    /** 消费 'declare' 关键字 */
    TSDeclare() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Declare)
    }

    // ============================================
    // 类型操作符关键字
    // ============================================

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

    /** 消费 'unique' 关键字 */
    TSUnique() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Unique)
    }

    // ============================================
    // 类成员修饰符
    // ============================================

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

    // ============================================
    // 类型断言和谓词
    // ============================================

    /** 消费 'satisfies' 关键字 */
    TSSatisfies() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Satisfies)
    }

    /** 消费 'is' 关键字（类型谓词） */
    TSIs() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Is)
    }

    /** 消费 'asserts' 关键字（断言函数） */
    TSAsserts() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Asserts)
    }

    // ============================================
    // 其他
    // ============================================

    /** 消费 'global' 关键字 */
    TSGlobal() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Global)
    }

    /** 消费 'require' 关键字 */
    TSRequire() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Require)
    }

    /** 消费 'out' 关键字（泛型协变） */
    TSOut() {
        return this.consumeIdentifierValue(SlimeTypescriptContextualKeywordTokenTypes.Out)
    }
}

