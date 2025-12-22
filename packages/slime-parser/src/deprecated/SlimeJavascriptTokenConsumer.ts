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

import {
    SlimeJavascriptBinaryOperatorTokenTypes,
    SlimeJavascriptContextualKeywordTokenTypes,
    SlimeJavascriptTokenType, SlimeJavascriptReservedWordTokenTypes, SlimeJavascriptUnaryOperatorTokenTypes
} from "slime-token"
import { SubhutiTokenConsumer, LexicalGoal } from "subhuti"

export default class SlimeJavascriptTokenConsumer extends SubhutiTokenConsumer {

    // ============================================
    // 软关键字消费辅助方法
    // ============================================

    /**
     * 消费一个 IdentifierName 并检查其值是否匹配
     *
     * 用于软关键字（如 get, set, of, target, meta, from）
     * 按照 ES2025 规范，这些在词法层是 IdentifierName，
     * 在语法层通过值检查来识别
     *
     * @param value 期望的标识符值
     * @returns CST 节点或 undefined
     */
    protected consumeIdentifierValue(value: string) {
        const token = this.parser.curToken
        if (token?.tokenName === SlimeJavascriptTokenType.IdentifierName && token.tokenValue === value) {
            return this.consume(SlimeJavascriptTokenType.IdentifierName)
        }
        // 标记解析失败
        this.parser._markParseFail()
        return undefined
    }

    // ============================================
    // 关键字 (Keywords)
    // ============================================

    Await() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Await)
    }

    Break() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Break)
    }

    Case() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Case)
    }

    Catch() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Catch)
    }

    Class() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Class)
    }

    Const() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Const)
    }

    Continue() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Continue)
    }

    Debugger() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Debugger)
    }

    Default() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Default)
    }

    Do() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Do)
    }

    Else() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Else)
    }

    Enum() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Enum)
    }

    Export() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Export)
    }

    Extends() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Extends)
    }

    False() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.False)
    }

    Finally() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Finally)
    }

    For() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.For)
    }

    Function() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Function)
    }

    If() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.If)
    }

    Import() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Import)
    }

    New() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.New)
    }

    /**
     * NullLiteral
     * 规范 A.1: NullLiteral :: null
     */
    NullLiteral() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.NullLiteral)
    }

    Return() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Return)
    }

    Super() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Super)
    }

    Switch() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Switch)
    }

    This() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.This)
    }

    Throw() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Throw)
    }

    True() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.True)
    }

    Try() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Try)
    }


    Var() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Var)
    }
    While() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.While)
    }

    With() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.With)
    }

    Yield() {
        return this.consume(SlimeJavascriptReservedWordTokenTypes.Yield)
    }

    /**
     * 消费 'let' 软关键字
     * 用于 let 声明
     * 注意：let 在非严格模式下可作为标识符，因此作为软关键字处理
     */
    Let() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Let)
    }

    Void() {
        return this.consume(SlimeJavascriptUnaryOperatorTokenTypes.Void)
    }

    Typeof() {
        return this.consume(SlimeJavascriptUnaryOperatorTokenTypes.Typeof)
    }

    In() {
        return this.consume(SlimeJavascriptBinaryOperatorTokenTypes.In)
    }

    Instanceof() {
        return this.consume(SlimeJavascriptBinaryOperatorTokenTypes.Instanceof)
    }
    Delete() {
        return this.consume(SlimeJavascriptUnaryOperatorTokenTypes.Delete)
    }

    // ============================================
    // 软关键字 (Soft Keywords / Contextual Keywords)
    // 按照 ES2025 规范，这些在词法层是 IdentifierName
    // 在语法层通过值检查来识别
    // ============================================

    /**
     * 消费 'async' 软关键字
     * 用于 async 函数、async 箭头函数、async 方法
     * 注意：async 可作为标识符使用，如 `let async = 1`
     */
    Async() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Async)
    }

    /**
     * 消费 'static' 软关键字
     * 用于类的静态成员
     * 注意：非严格模式下可作为标识符
     */
    Static() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Static)
    }

    /**
     * 消费 'as' 软关键字
     * 用于 import/export 的重命名
     */
    As() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.As)
    }

    /**
     * 消费 'get' 软关键字
     * 用于 getter 方法定义
     */
    Get() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Get)
    }

    /**
     * 消费 'set' 软关键字
     * 用于 setter 方法定义
     */
    Set() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Set)
    }

    /**
     * 消费 'of' 软关键字
     * 用于 for-of 语句
     */
    Of() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Of)
    }

    /**
     * 消费 'target' 软关键字
     * 用于 new.target
     */
    Target() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Target)
    }

    /**
     * 消费 'meta' 软关键字
     * 用于 import.meta
     */
    Meta() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.Meta)
    }

    /**
     * 消费 'from' 软关键字
     * 用于 import/export 语句
     */
    From() {
        return this.consumeIdentifierValue(SlimeJavascriptContextualKeywordTokenTypes.From)
    }

    // ============================================
    // 字面量 (Literals)
    // ============================================

    /**
     * NumericLiteral
     * 规范中 NumericLiteral 包含所有数字变体：
     * - DecimalLiteral (如 123, 1.5, .5, 1e10)
     * - DecimalBigIntegerLiteral (如 123n)
     * - NonDecimalIntegerLiteral (如 0xFF, 0b11, 0o77)
     * - NonDecimalIntegerLiteral BigIntLiteralSuffix (如 0xFFn, 0b11n, 0o77n)
     * - LegacyOctalIntegerLiteral (如 077, Annex B)
     */
    NumericLiteral() {
        return this.consume(SlimeJavascriptTokenType.NumericLiteral)
    }

    StringLiteral() {
        return this.consume(SlimeJavascriptTokenType.StringLiteral)
    }

    NoSubstitutionTemplate() {
        return this.consume(SlimeJavascriptTokenType.NoSubstitutionTemplate)
    }

    TemplateHead() {
        return this.consume(SlimeJavascriptTokenType.TemplateHead)
    }

    /**
     * 消费 TemplateMiddle token (}...${)
     * 使用 InputElementTemplateTail 词法目标，确保 } 被识别为模板部分而非 RBrace
     */
    TemplateMiddle() {
        return this.consume(SlimeJavascriptTokenType.TemplateMiddle, LexicalGoal.InputElementTemplateTail)
    }

    /**
     * 消费 TemplateTail token (}...`)
     * 使用 InputElementTemplateTail 词法目标，确保 } 被识别为模板部分而非 RBrace
     */
    TemplateTail() {
        return this.consume(SlimeJavascriptTokenType.TemplateTail, LexicalGoal.InputElementTemplateTail)
    }

    RegularExpressionLiteral() {
        return this.consume(SlimeJavascriptTokenType.RegularExpressionLiteral)
    }

    // ============================================
    // 注释 (Comments)
    // ============================================

    /**
     * Hashbang 注释 (#!...)
     * 只能出现在文件开头，由 Parser 的 Program 规则显式调用
     */
    HashbangComment() {
        return this.consume(SlimeJavascriptTokenType.HashbangComment)
    }

    // ============================================
    // 标识符 (Identifiers)
    // ============================================

    /**
     * IdentifierName
     * 规范: IdentifierName :: IdentifierStart | IdentifierName IdentifierPart
     */
    IdentifierName() {
        return this.consume(SlimeJavascriptTokenType.IdentifierName)
    }

    /**
     * PrivateIdentifier
     * 规范: PrivateIdentifier :: # IdentifierName
     */
    PrivateIdentifier() {
        return this.consume(SlimeJavascriptTokenType.PrivateIdentifier)
    }
    
    // ============================================
    // 运算符 - 4字符 (4-character Operators)
    // ============================================

    UnsignedRightShiftAssign() {
        return this.consume(SlimeJavascriptTokenType.UnsignedRightShiftAssign)
    }

    // ============================================
    // 运算符 - 3字符 (3-character Operators)
    // ============================================

    Ellipsis() {
        return this.consume(SlimeJavascriptTokenType.Ellipsis)
    }

    UnsignedRightShift() {
        return this.consume(SlimeJavascriptTokenType.UnsignedRightShift)
    }

    StrictEqual() {
        return this.consume(SlimeJavascriptTokenType.StrictEqual)
    }

    StrictNotEqual() {
        return this.consume(SlimeJavascriptTokenType.StrictNotEqual)
    }

    LeftShiftAssign() {
        return this.consume(SlimeJavascriptTokenType.LeftShiftAssign)
    }

    RightShiftAssign() {
        return this.consume(SlimeJavascriptTokenType.RightShiftAssign)
    }

    ExponentiationAssign() {
        return this.consume(SlimeJavascriptTokenType.ExponentiationAssign)
    }

    LogicalAndAssign() {
        return this.consume(SlimeJavascriptTokenType.LogicalAndAssign)
    }

    LogicalOrAssign() {
        return this.consume(SlimeJavascriptTokenType.LogicalOrAssign)
    }

    NullishCoalescingAssign() {
        return this.consume(SlimeJavascriptTokenType.NullishCoalescingAssign)
    }

    // ============================================
    // 运算符 - 2字符 (2-character Operators)
    // ============================================

    Arrow() {
        return this.consume(SlimeJavascriptTokenType.Arrow)
    }

    PlusAssign() {
        return this.consume(SlimeJavascriptTokenType.PlusAssign)
    }

    MinusAssign() {
        return this.consume(SlimeJavascriptTokenType.MinusAssign)
    }

    MultiplyAssign() {
        return this.consume(SlimeJavascriptTokenType.MultiplyAssign)
    }

    DivideAssign() {
        return this.consume(SlimeJavascriptTokenType.DivideAssign)
    }

    ModuloAssign() {
        return this.consume(SlimeJavascriptTokenType.ModuloAssign)
    }

    LeftShift() {
        return this.consume(SlimeJavascriptTokenType.LeftShift)
    }

    RightShift() {
        return this.consume(SlimeJavascriptTokenType.RightShift)
    }

    LessEqual() {
        return this.consume(SlimeJavascriptTokenType.LessEqual)
    }

    GreaterEqual() {
        return this.consume(SlimeJavascriptTokenType.GreaterEqual)
    }

    Equal() {
        return this.consume(SlimeJavascriptTokenType.Equal)
    }

    NotEqual() {
        return this.consume(SlimeJavascriptTokenType.NotEqual)
    }

    LogicalAnd() {
        return this.consume(SlimeJavascriptTokenType.LogicalAnd)
    }

    LogicalOr() {
        return this.consume(SlimeJavascriptTokenType.LogicalOr)
    }

    NullishCoalescing() {
        return this.consume(SlimeJavascriptTokenType.NullishCoalescing)
    }

    Increment() {
        return this.consume(SlimeJavascriptTokenType.Increment)
    }

    Decrement() {
        return this.consume(SlimeJavascriptTokenType.Decrement)
    }

    Exponentiation() {
        return this.consume(SlimeJavascriptTokenType.Exponentiation)
    }

    BitwiseAndAssign() {
        return this.consume(SlimeJavascriptTokenType.BitwiseAndAssign)
    }

    BitwiseOrAssign() {
        return this.consume(SlimeJavascriptTokenType.BitwiseOrAssign)
    }

    BitwiseXorAssign() {
        return this.consume(SlimeJavascriptTokenType.BitwiseXorAssign)
    }

    OptionalChaining() {
        return this.consume(SlimeJavascriptTokenType.OptionalChaining)
    }
    
    // ============================================
    // 运算符 - 1字符 (1-character Operators)
    // ============================================

    LBrace() {
        return this.consume(SlimeJavascriptTokenType.LBrace)
    }

    RBrace() {
        return this.consume(SlimeJavascriptTokenType.RBrace)
    }

    LParen() {
        return this.consume(SlimeJavascriptTokenType.LParen)
    }

    RParen() {
        return this.consume(SlimeJavascriptTokenType.RParen)
    }

    LBracket() {
        return this.consume(SlimeJavascriptTokenType.LBracket)
    }

    RBracket() {
        return this.consume(SlimeJavascriptTokenType.RBracket)
    }

    Dot() {
        return this.consume(SlimeJavascriptTokenType.Dot)
    }

    Semicolon() {
        return this.consume(SlimeJavascriptTokenType.Semicolon)
    }

    Comma() {
        return this.consume(SlimeJavascriptTokenType.Comma)
    }

    Less() {
        return this.consume(SlimeJavascriptTokenType.Less)
    }

    Greater() {
        return this.consume(SlimeJavascriptTokenType.Greater)
    }

    Plus() {
        return this.consume(SlimeJavascriptTokenType.Plus)
    }

    Minus() {
        return this.consume(SlimeJavascriptTokenType.Minus)
    }

    Asterisk() {
        return this.consume(SlimeJavascriptTokenType.Asterisk)
    }

    Slash() {
        return this.consume(SlimeJavascriptTokenType.Slash)
    }

    Modulo() {
        return this.consume(SlimeJavascriptTokenType.Modulo)
    }

    BitwiseAnd() {
        return this.consume(SlimeJavascriptTokenType.BitwiseAnd)
    }

    BitwiseOr() {
        return this.consume(SlimeJavascriptTokenType.BitwiseOr)
    }

    BitwiseXor() {
        return this.consume(SlimeJavascriptTokenType.BitwiseXor)
    }

    BitwiseNot() {
        return this.consume(SlimeJavascriptTokenType.BitwiseNot)
    }

    LogicalNot() {
        return this.consume(SlimeJavascriptTokenType.LogicalNot)
    }

    Question() {
        return this.consume(SlimeJavascriptTokenType.Question)
    }

    Colon() {
        return this.consume(SlimeJavascriptTokenType.Colon)
    }

    Assign() {
        return this.consume(SlimeJavascriptTokenType.Assign)
    }
}

