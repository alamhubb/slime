// ============================================
// Token 对象（用于 TokenConsumer 复用）
// ============================================
import {
    createEmptyValueRegToken, createKeywordToken,
    createValueRegToken, type SubhutiCreateToken,
} from "subhuti";
import { SlimeJavascriptTokenType } from "slime-token";

// ============================================
// 词法歧义处理说明
// ============================================
// ECMAScript 规范中，`/` 可以是除法运算符或正则表达式起始。
// 规范通过 InputElementDiv 和 InputElementRegExp 两种词法目标来区分。
//
// 我们的实现策略（方案 B：始终 Slash + 语法层 Rescan）：
// 1. 词法层：`/` 始终解析为 Slash（除法运算符）
// 2. 语法层：当期望表达式但遇到 Slash 时，调用 rescanSlashAsRegExp() 重新扫描
//
// 这种方式确保 100% 正确，因为只有语法分析器知道当前期望的是表达式还是运算符。
// ============================================

// ============================================
// ES2025 规范 12.7 标识符名称正则
//
// IdentifierStart ::
//     UnicodeIDStart | $ | _ | \ UnicodeEscapeSequence
//
// IdentifierPart ::
//     UnicodeIDContinue | $ | \ UnicodeEscapeSequence | <ZWNJ> | <ZWJ>
//
// 参考实现：Babel、Acorn、TypeScript
// ============================================

// IdentifierStart: UnicodeIDStart | $ | _ | \uXXXX | \u{XXXXX}
// 注意：Unicode 属性转义 \p{} 需要 'u' flag 才能正确工作
const ID_START_SOURCE = String.raw`[\p{ID_Start}$_]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}`

// IdentifierPart: UnicodeIDContinue | $ | \uXXXX | \u{XXXXX} | ZWNJ(\u200C) | ZWJ(\u200D)
const ID_CONTINUE_SOURCE = String.raw`[\p{ID_Continue}$\u200C\u200D]|\\u[0-9a-fA-F]{4}|\\u\{[0-9a-fA-F]+\}`

// IdentifierName: IdentifierStart IdentifierPart*
const IDENTIFIER_NAME_PATTERN = new RegExp(
    `(?:${ID_START_SOURCE})(?:${ID_CONTINUE_SOURCE})*`,
    'u'
)

// PrivateIdentifier: # IdentifierName
const PRIVATE_IDENTIFIER_PATTERN = new RegExp(
    `#(?:${ID_START_SOURCE})(?:${ID_CONTINUE_SOURCE})*`,
    'u'
)

export const SlimeTokensObj = {

    // ============================================
    // A.1.2 注释 (Comments)
    // ============================================

    // HashbangComment 只能出现在文件开头（index === 0），不作为 skip token
    // 由 Parser 的 Program 规则显式处理
    // LineTerminator 包括: LF(\n), CR(\r), LS(\u2028), PS(\u2029)
    // 使用 onlyAtStart 约束确保只在文件开头匹配
    HashbangComment: createValueRegToken(
        SlimeJavascriptTokenType.HashbangComment,
        /#![^\n\r\u2028\u2029]*/,
        '',
        false,
        undefined,  // lookahead
        {onlyAtStart: true}  // 只在文件开头匹配
    ),
    // SingleLineComment 和 MultiLineComment 也需要正确处理 LineTerminator
    MultiLineComment: createValueRegToken(SlimeJavascriptTokenType.MultiLineComment, /\/\*[\s\S]*?\*\//, '', true),
    SingleLineComment: createValueRegToken(SlimeJavascriptTokenType.SingleLineComment, /\/\/[^\n\r\u2028\u2029]*/, '', true),

    // B.1.1 HTML-like Comments (Web 兼容性扩展)
    // SingleLineHTMLOpenComment: <!-- 作为单行注释（无位置约束）
    // 规范: SingleLineHTMLOpenComment :: <!-- SingleLineCommentChars_opt
    SingleLineHTMLOpenComment: createValueRegToken(
        SlimeJavascriptTokenType.SingleLineHTMLOpenComment,
        /<!--[^\n\r\u2028\u2029]*/,  // <!-- 后跟到行尾的所有字符
        '',
        true  // skip = true，作为注释跳过
    ),

    // SingleLineHTMLCloseComment: --> 在行首时作为单行注释
    // 规范: HTMLCloseComment :: WhiteSpaceSequence_opt SingleLineDelimitedCommentSequence_opt --> SingleLineCommentChars_opt
    // 使用 onlyAtLineStart 约束：只有当前行号 > 上一个非 skip token 的行号时才匹配
    // 这确保 `x = y-->10;` 中的 --> 被解析为 -- 和 >，而 ` --> nothing` 被解析为注释
    SingleLineHTMLCloseComment: createValueRegToken(
        SlimeJavascriptTokenType.SingleLineHTMLCloseComment,
        /-->[^\n\r\u2028\u2029]*/,  // --> 后跟到行尾的所有字符
        '',
        true,  // skip = true，作为注释跳过
        undefined,  // lookahead
        {onlyAtLineStart: true}  // 只在行首匹配
    ),

    // ============================================
    // A.1.1 空白符和换行符
    // ============================================

    // ECMAScript 12.2 White Space
    // 包含: TAB, VT, FF, SP, NBSP, BOM, 以及所有 Unicode Zs 类别字符
    // Zs 类别包括: U+0020 (SP), U+00A0 (NBSP), U+1680, U+2000-U+200A, U+202F, U+205F, U+3000
    WhiteSpace: createValueRegToken(SlimeJavascriptTokenType.WhiteSpace, /[\t\v\f \u00A0\u1680\u2000-\u200A\u202F\u205F\u3000\uFEFF]+/, '', true),
    LineTerminatorCRLF: createValueRegToken(SlimeJavascriptTokenType.LineTerminator, /\r\n/, '', true),
    LineTerminator: createValueRegToken(SlimeJavascriptTokenType.LineTerminator, /[\n\r\u2028\u2029]/, '', true),

    // ============================================
    // A.1.5 关键字和保留字
    // ============================================

    AwaitTok: createKeywordToken(SlimeJavascriptTokenType.Await, 'await'),
    BreakTok: createKeywordToken(SlimeJavascriptTokenType.Break, 'break'),
    CaseTok: createKeywordToken(SlimeJavascriptTokenType.Case, 'case'),
    CatchTok: createKeywordToken(SlimeJavascriptTokenType.Catch, 'catch'),
    ClassTok: createKeywordToken(SlimeJavascriptTokenType.Class, 'class'),
    ConstTok: createKeywordToken(SlimeJavascriptTokenType.Const, 'const'),
    ContinueTok: createKeywordToken(SlimeJavascriptTokenType.Continue, 'continue'),
    DebuggerTok: createKeywordToken(SlimeJavascriptTokenType.Debugger, 'debugger'),
    DefaultTok: createKeywordToken(SlimeJavascriptTokenType.Default, 'default'),
    DeleteTok: createKeywordToken(SlimeJavascriptTokenType.Delete, 'delete'),
    DoTok: createKeywordToken(SlimeJavascriptTokenType.Do, 'do'),
    ElseTok: createKeywordToken(SlimeJavascriptTokenType.Else, 'else'),
    EnumTok: createKeywordToken(SlimeJavascriptTokenType.Enum, 'enum'),
    ExportTok: createKeywordToken(SlimeJavascriptTokenType.Export, 'export'),
    ExtendsTok: createKeywordToken(SlimeJavascriptTokenType.Extends, 'extends'),
    FalseTok: createKeywordToken(SlimeJavascriptTokenType.False, 'false'),
    FinallyTok: createKeywordToken(SlimeJavascriptTokenType.Finally, 'finally'),
    ForTok: createKeywordToken(SlimeJavascriptTokenType.For, 'for'),
    FunctionTok: createKeywordToken(SlimeJavascriptTokenType.Function, 'function'),
    IfTok: createKeywordToken(SlimeJavascriptTokenType.If, 'if'),
    ImportTok: createKeywordToken(SlimeJavascriptTokenType.Import, 'import'),
    InTok: createKeywordToken(SlimeJavascriptTokenType.In, 'in'),
    InstanceofTok: createKeywordToken(SlimeJavascriptTokenType.Instanceof, 'instanceof'),
    // let 作为软关键字处理，不再定义为硬关键字 token
    // LetTok: createKeywordToken(SlimeJavascriptTokenType.Let, 'let'),
    NewTok: createKeywordToken(SlimeJavascriptTokenType.New, 'new'),
    NullTok: createKeywordToken(SlimeJavascriptTokenType.NullLiteral, 'null'),
    ReturnTok: createKeywordToken(SlimeJavascriptTokenType.Return, 'return'),
    SuperTok: createKeywordToken(SlimeJavascriptTokenType.Super, 'super'),
    SwitchTok: createKeywordToken(SlimeJavascriptTokenType.Switch, 'switch'),
    ThisTok: createKeywordToken(SlimeJavascriptTokenType.This, 'this'),
    ThrowTok: createKeywordToken(SlimeJavascriptTokenType.Throw, 'throw'),
    TrueTok: createKeywordToken(SlimeJavascriptTokenType.True, 'true'),
    TryTok: createKeywordToken(SlimeJavascriptTokenType.Try, 'try'),
    TypeofTok: createKeywordToken(SlimeJavascriptTokenType.Typeof, 'typeof'),
    VarTok: createKeywordToken(SlimeJavascriptTokenType.Var, 'var'),
    VoidTok: createKeywordToken(SlimeJavascriptTokenType.Void, 'void'),
    WhileTok: createKeywordToken(SlimeJavascriptTokenType.While, 'while'),
    WithTok: createKeywordToken(SlimeJavascriptTokenType.With, 'with'),
    YieldTok: createKeywordToken(SlimeJavascriptTokenType.Yield, 'yield'),
    // 软关键字（async, static, as, get, set, of, target, meta, from）
    // 在词法层作为 IdentifierName 处理，在 Parser 中通过值检查识别

    // ============================================
    // A.1.9 数字字面量
    // 规范: NumericLiteral :: DecimalLiteral | DecimalBigIntegerLiteral | NonDecimalIntegerLiteral | LegacyOctalIntegerLiteral
    // 所有数字变体都映射到 NumericLiteral
    //
    // 设计说明（参考 Babel 的实现）：
    // 1. 词法层：用正则匹配所有数字字面量，不区分 legacy octal 和 non-octal decimal
    // 2. 语义层（Parser/AST）：判断具体类型并检查语法错误
    // 3. 这样避免了多个正则规则之间的优先级和冲突问题
    // ============================================

    // BigInt 变体 - 必须在普通数字之前匹配（因为后缀 n）
    // DecimalBigIntegerLiteral :: 0n | NonZeroDigit DecimalDigits_opt n
    // NonDecimalIntegerLiteral BigIntLiteralSuffix
    NumericLiteralBigIntHex: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[xX][0-9a-fA-F](_?[0-9a-fA-F])*n/),
    NumericLiteralBigIntBinary: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[bB][01](_?[01])*n/),
    NumericLiteralBigIntOctal: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[oO][0-7](_?[0-7])*n/),
    NumericLiteralBigIntDecimal: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /(?:0|[1-9](_?[0-9])*)n/),

    // 非十进制整数 (NonDecimalIntegerLiteral) - 必须在十进制之前匹配
    // HexIntegerLiteral :: 0x HexDigits | 0X HexDigits
    // BinaryIntegerLiteral :: 0b BinaryDigits | 0B BinaryDigits
    // OctalIntegerLiteral :: 0o OctalDigits | 0O OctalDigits
    NumericLiteralHex: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[xX][0-9a-fA-F](_?[0-9a-fA-F])*/),
    NumericLiteralBinary: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[bB][01](_?[01])*/),
    NumericLiteralOctal: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /0[oO][0-7](_?[0-7])*/),

    // 十进制数字（统一匹配，包括 LegacyOctal 和 NonOctalDecimal）
    // 参考 Babel 的 readNumber 实现：先匹配所有数字，语义层再区分类型
    //
    // 匹配规则：
    // 1. 0[0-9]* - 以 0 开头的数字序列（可能是 legacy octal 如 07，或 non-octal decimal 如 09）
    // 2. [1-9](_?[0-9])* - 以 1-9 开头的数字序列（支持 numeric separator）
    // 3. \.([0-9](_?[0-9])*)? - 可选的小数部分
    // 4. ([eE][+-]?[0-9](_?[0-9])*)? - 可选的指数部分
    // 5. \.[0-9]... - 单独的 .xxx 形式
    //
    // 语义层检查（在 Parser 中处理）：
    // - LegacyOctalIntegerLiteral (07, 077): 严格模式报错
    // - NonOctalDecimalIntegerLiteral (08, 09): 严格模式报错，非严格模式当十进制
    // - 以 0 开头的数字不能有小数点或指数（如 07.5 是语法错误）
    NumericLiteralDecimal: createEmptyValueRegToken(SlimeJavascriptTokenType.NumericLiteral, /(?:0[0-9]*|[1-9](_?[0-9])*)(?:\.([0-9](_?[0-9])*)?)?([eE][+-]?[0-9](_?[0-9])*)?|\.[0-9](_?[0-9])*([eE][+-]?[0-9](_?[0-9])*)?/),

    // ============================================
    // A.1.10 字符串字面量
    // ============================================

    /**
     * StringLiteral :
     *     " DoubleStringCharacters_opt "
     *     ' SingleStringCharacters_opt '
     *
     * 注意：Lexer 会将双引号和单引号字符串都输出为 StringLiteral token
     */
    // 支持行续符 (LineContinuation): \ 后跟 \r\n | \r | \n
    // 参考 ES2025 规范 12.9.4 String Literals 和 Annex B
    // Annex B: 支持八进制转义序列 \0-\7, \00-\77, \000-\377
    DoubleStringCharacters: createEmptyValueRegToken(SlimeJavascriptTokenType.StringLiteral, /"(?:[^\n\r"\\]|\\(?:\r\n|\r|\n|['"\\bfnrtv]|[^'"\\bfnrtv\n\r]|x[0-9a-fA-F]{2}|u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]+\})))*"/),
    SingleStringCharacters: createEmptyValueRegToken(SlimeJavascriptTokenType.StringLiteral, /'(?:[^\n\r'\\]|\\(?:\r\n|\r|\n|['"\\bfnrtv]|[^'"\\bfnrtv\n\r]|x[0-9a-fA-F]{2}|u(?:[0-9a-fA-F]{4}|\{[0-9a-fA-F]+\})))*'/),

    // ============================================
    // A.1.12 模板字面量
    // ============================================

    TemplateHead: createEmptyValueRegToken(SlimeJavascriptTokenType.TemplateHead, /`(?:[^`\\$]|\\[\s\S]|\$(?!\{))*\$\{/),
    TemplateMiddle: createEmptyValueRegToken(SlimeJavascriptTokenType.TemplateMiddle, /\}(?:[^`\\$]|\\[\s\S]|\$(?!\{))*\$\{/),
    TemplateTail: createEmptyValueRegToken(SlimeJavascriptTokenType.TemplateTail, /\}(?:[^`\\$]|\\[\s\S]|\$(?!\{))*`/),
    NoSubstitutionTemplate: createEmptyValueRegToken(SlimeJavascriptTokenType.NoSubstitutionTemplate, /`(?:[^`\\$]|\\[\s\S]|\$(?!\{))*`/),

    // ============================================
    // A.1.8 运算符和标点符号
    // ============================================

    // 4 字符
    UnsignedRightShiftAssign: createValueRegToken(SlimeJavascriptTokenType.UnsignedRightShiftAssign, />>>=/, '>>>='),

    // 3 字符
    Ellipsis: createValueRegToken(SlimeJavascriptTokenType.Ellipsis, /\.\.\./, '...'),
    UnsignedRightShift: createValueRegToken(SlimeJavascriptTokenType.UnsignedRightShift, />>>/, '>>>'),
    StrictEqual: createValueRegToken(SlimeJavascriptTokenType.StrictEqual, /===/, '==='),
    StrictNotEqual: createValueRegToken(SlimeJavascriptTokenType.StrictNotEqual, /!==/, '!=='),
    LeftShiftAssign: createValueRegToken(SlimeJavascriptTokenType.LeftShiftAssign, /<<=/, '<<='),
    RightShiftAssign: createValueRegToken(SlimeJavascriptTokenType.RightShiftAssign, />>=/, '>>='),
    ExponentiationAssign: createValueRegToken(SlimeJavascriptTokenType.ExponentiationAssign, /\*\*=/, '**='),
    LogicalAndAssign: createValueRegToken(SlimeJavascriptTokenType.LogicalAndAssign, /&&=/, '&&='),
    LogicalOrAssign: createValueRegToken(SlimeJavascriptTokenType.LogicalOrAssign, /\|\|=/, '||='),
    NullishCoalescingAssign: createValueRegToken(SlimeJavascriptTokenType.NullishCoalescingAssign, /\?\?=/, '??='),

    // 2 字符
    Arrow: createValueRegToken(SlimeJavascriptTokenType.Arrow, /=>/, '=>'),
    PlusAssign: createValueRegToken(SlimeJavascriptTokenType.PlusAssign, /\+=/, '+='),
    MinusAssign: createValueRegToken(SlimeJavascriptTokenType.MinusAssign, /-=/, '-='),
    MultiplyAssign: createValueRegToken(SlimeJavascriptTokenType.MultiplyAssign, /\*=/, '*='),
    // DivideAssign 词法层始终匹配（无上下文约束）
    // /=xxx/g 的情况由语法层 rescanSlashAsRegExp() 处理
    DivideAssign: createValueRegToken(SlimeJavascriptTokenType.DivideAssign, /\/=/, '/='),
    ModuloAssign: createValueRegToken(SlimeJavascriptTokenType.ModuloAssign, /%=/, '%='),
    LeftShift: createValueRegToken(SlimeJavascriptTokenType.LeftShift, /<</, '<<'),
    RightShift: createValueRegToken(SlimeJavascriptTokenType.RightShift, />>/, '>>'),
    LessEqual: createValueRegToken(SlimeJavascriptTokenType.LessEqual, /<=/, '<='),
    GreaterEqual: createValueRegToken(SlimeJavascriptTokenType.GreaterEqual, />=/, '>='),
    Equal: createValueRegToken(SlimeJavascriptTokenType.Equal, /==/, '=='),
    NotEqual: createValueRegToken(SlimeJavascriptTokenType.NotEqual, /!=/, '!='),
    LogicalAnd: createValueRegToken(SlimeJavascriptTokenType.LogicalAnd, /&&/, '&&'),
    LogicalOr: createValueRegToken(SlimeJavascriptTokenType.LogicalOr, /\|\|/, '||'),
    NullishCoalescing: createValueRegToken(SlimeJavascriptTokenType.NullishCoalescing, /\?\?/, '??'),
    Increment: createValueRegToken(SlimeJavascriptTokenType.Increment, /\+\+/, '++'),
    Decrement: createValueRegToken(SlimeJavascriptTokenType.Decrement, /--/, '--'),
    Exponentiation: createValueRegToken(SlimeJavascriptTokenType.Exponentiation, /\*\*/, '**'),
    BitwiseAndAssign: createValueRegToken(SlimeJavascriptTokenType.BitwiseAndAssign, /&=/, '&='),
    BitwiseOrAssign: createValueRegToken(SlimeJavascriptTokenType.BitwiseOrAssign, /\|=/, '|='),
    BitwiseXorAssign: createValueRegToken(SlimeJavascriptTokenType.BitwiseXorAssign, /\^=/, '^='),
    OptionalChaining: createValueRegToken(SlimeJavascriptTokenType.OptionalChaining, /\?\./, '?.', false, {not: /^\d/}),

    // 1 字符
    LBrace: createValueRegToken(SlimeJavascriptTokenType.LBrace, /\{/, '{'),
    RBrace: createValueRegToken(SlimeJavascriptTokenType.RBrace, /\}/, '}'),
    LParen: createValueRegToken(SlimeJavascriptTokenType.LParen, /\(/, '('),
    RParen: createValueRegToken(SlimeJavascriptTokenType.RParen, /\)/, ')'),
    LBracket: createValueRegToken(SlimeJavascriptTokenType.LBracket, /\[/, '['),
    RBracket: createValueRegToken(SlimeJavascriptTokenType.RBracket, /\]/, ']'),
    Dot: createValueRegToken(SlimeJavascriptTokenType.Dot, /\./, '.'),
    Semicolon: createValueRegToken(SlimeJavascriptTokenType.Semicolon, /;/, ';'),
    Comma: createValueRegToken(SlimeJavascriptTokenType.Comma, /,/, ','),
    Less: createValueRegToken(SlimeJavascriptTokenType.Less, /</, '<'),
    Greater: createValueRegToken(SlimeJavascriptTokenType.Greater, />/, '>'),
    Plus: createValueRegToken(SlimeJavascriptTokenType.Plus, /\+/, '+'),
    Minus: createValueRegToken(SlimeJavascriptTokenType.Minus, /-/, '-'),
    Asterisk: createValueRegToken(SlimeJavascriptTokenType.Asterisk, /\*/, '*'),

    // ============================================
    // 除法运算符（词法层始终匹配为 Slash）
    // 正则表达式由语法层 rescanSlashAsRegExp() 处理
    // ============================================
    Slash: createValueRegToken(SlimeJavascriptTokenType.Slash, /\//, '/'),

    // 注意：RegularExpressionLiteral 不在词法层定义
    // 正则表达式完全由语法层的 rescanSlashAsRegExp() 方法处理
    // 这确保了 100% 正确性，因为只有语法分析器知道当前上下文

    Modulo: createValueRegToken(SlimeJavascriptTokenType.Modulo, /%/, '%'),
    BitwiseAnd: createValueRegToken(SlimeJavascriptTokenType.BitwiseAnd, /&/, '&'),
    BitwiseOr: createValueRegToken(SlimeJavascriptTokenType.BitwiseOr, /\|/, '|'),
    BitwiseXor: createValueRegToken(SlimeJavascriptTokenType.BitwiseXor, /\^/, '^'),
    BitwiseNot: createValueRegToken(SlimeJavascriptTokenType.BitwiseNot, /~/, '~'),
    LogicalNot: createValueRegToken(SlimeJavascriptTokenType.LogicalNot, /!/, '!'),
    Question: createValueRegToken(SlimeJavascriptTokenType.Question, /\?/, '?'),
    Colon: createValueRegToken(SlimeJavascriptTokenType.Colon, /:/, ':'),
    Assign: createValueRegToken(SlimeJavascriptTokenType.Assign, /=/, '='),

    // ============================================
    // A.1.5 标识符
    // ============================================
    // ES2025 规范 12.7 Identifier Names
    //
    // IdentifierName ::
    //     IdentifierStart
    //     IdentifierName IdentifierPart
    //
    // IdentifierStart ::
    //     UnicodeIDStart
    //     $
    //     _
    //     \ UnicodeEscapeSequence
    //
    // IdentifierPart ::
    //     UnicodeIDContinue
    //     $
    //     \ UnicodeEscapeSequence
    //     <ZWNJ>
    //     <ZWJ>
    //
    // UnicodeIDStart :: any Unicode code point with the Unicode property "ID_Start"
    // UnicodeIDContinue :: any Unicode code point with the Unicode property "ID_Continue"
    //
    // 参考实现：Babel、Acorn、TypeScript
    // ============================================

    PrivateIdentifier: createEmptyValueRegToken(SlimeJavascriptTokenType.PrivateIdentifier, PRIVATE_IDENTIFIER_PATTERN),
    IdentifierName: createEmptyValueRegToken(SlimeJavascriptTokenType.IdentifierName, IDENTIFIER_NAME_PATTERN),
}

export const slimeTokens: SubhutiCreateToken[] = Object.values(SlimeTokensObj)