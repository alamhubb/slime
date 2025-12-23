/**
 * ES2025 Token 名称 - 完全符合 ECMAScript® 2025 规范 A.1 词法语法
 * 规范：https://tc39.es/ecma262/2025/#sec-grammar-summary
 *
 * 设计原则：
 * 1. TokenNames 属性名和值与规范 A.1 顶层规则名称完全一致
 * 2. 关键字名与规范 ReservedWord 一致（首字母大写）
 * 3. 标点符号使用语义化名称
 */

// ============================================
// 运算符 Token 类型分组（先定义，供 TokenNames 引用）
// ============================================

/**
 * 赋值运算符 Token 类型
 * 对应: = += -= *= /= %= **= <<= >>= >>>= &= |= ^= &&= ||= ??=
 * 
 * 命名说明：
 * - 使用 `Assign` 而非 ES2025 规范中的 `Eq`
 * - 原因：
 *   1. 语义清晰：`Assign` 明确表达赋值操作，`Eq` 容易与相等比较 `==`/`===` 混淆
 *   2. 命名一致：与复合赋值运算符 `PlusAssign`、`MinusAssign` 等保持统一风格
 *   3. 避免歧义：代码中看到 `Eq` 可能让人困惑是 `=` 还是 `==`
 */
export const SlimeJavascriptAssignmentOperatorTokenTypes = {
    Assign: 'Assign',                                       // =
    PlusAssign: 'PlusAssign',                               // +=
    MinusAssign: 'MinusAssign',                             // -=
    MultiplyAssign: 'MultiplyAssign',                       // *=
    DivideAssign: 'DivideAssign',                           // /=
    ModuloAssign: 'ModuloAssign',                           // %=
    ExponentiationAssign: 'ExponentiationAssign',           // **=
    LeftShiftAssign: 'LeftShiftAssign',                     // <<=
    RightShiftAssign: 'RightShiftAssign',                   // >>=
    UnsignedRightShiftAssign: 'UnsignedRightShiftAssign',   // >>>=
    BitwiseAndAssign: 'BitwiseAndAssign',                   // &=
    BitwiseOrAssign: 'BitwiseOrAssign',                     // |=
    BitwiseXorAssign: 'BitwiseXorAssign',                   // ^=
    LogicalAndAssign: 'LogicalAndAssign',                   // &&=
    LogicalOrAssign: 'LogicalOrAssign',                     // ||=
    NullishCoalescingAssign: 'NullishCoalescingAssign',     // ??=
} as const;

/**
 * 更新运算符 Token 类型
 * 对应: ++ --
 */
export const SlimeJavascriptUpdateOperatorTokenTypes = {
    Increment: 'Increment',   // ++
    Decrement: 'Decrement',   // --
} as const;

/**
 * 一元运算符 Token 类型
 * 对应: - + ! ~ typeof void delete
 */
export const SlimeJavascriptUnaryOperatorTokenTypes = {
    Minus: 'Minus',           // -
    Plus: 'Plus',             // +
    LogicalNot: 'LogicalNot', // !
    BitwiseNot: 'BitwiseNot', // ~
    Typeof: 'Typeof',         // typeof
    Void: 'Void',             // void
    Delete: 'Delete',         // delete
} as const;

/**
 * 二元运算符 Token 类型
 * 对应: == != === !== < > <= >= << >> >>> + - * / % ** | ^ & in instanceof
 */
export const SlimeJavascriptBinaryOperatorTokenTypes = {
    // 相等运算符
    Equal: 'Equal',                       // ==
    NotEqual: 'NotEqual',                 // !=
    StrictEqual: 'StrictEqual',           // ===
    StrictNotEqual: 'StrictNotEqual',     // !==
    // 关系运算符
    Less: 'Less',                         // <
    Greater: 'Greater',                   // >
    LessEqual: 'LessEqual',               // <=
    GreaterEqual: 'GreaterEqual',         // >=
    // 移位运算符
    LeftShift: 'LeftShift',               // <<
    RightShift: 'RightShift',             // >>
    UnsignedRightShift: 'UnsignedRightShift', // >>>
    // 算术运算符
    Plus: 'Plus',                         // +
    Minus: 'Minus',                       // -
    Asterisk: 'Asterisk',                 // *
    Slash: 'Slash',                       // /
    Modulo: 'Modulo',                     // %
    Exponentiation: 'Exponentiation',     // **
    // 位运算符
    BitwiseOr: 'BitwiseOr',               // |
    BitwiseXor: 'BitwiseXor',             // ^
    BitwiseAnd: 'BitwiseAnd',             // &
    // 关系关键字运算符
    In: 'In',                             // in
    Instanceof: 'Instanceof',             // instanceof
} as const;

/**
 * 逻辑运算符 Token 类型
 * 对应: || && ??
 */
export const SlimeJavascriptLogicalOperatorTokenTypes = {
    LogicalOr: 'LogicalOr',               // ||
    LogicalAnd: 'LogicalAnd',             // &&
    NullishCoalescing: 'NullishCoalescing', // ??
} as const;

/**
 * 软关键字（Contextual Keywords）Token 类型
 *
 * 这些标识符在词法层是 IdentifierName，在特定语法位置作为关键字处理。
 * 规范中没有作为 ReservedWord，可以作为变量名使用。
 *
 * 使用场景：
 * - async: 异步函数声明 `async function`、异步方法、异步箭头函数
 * - static: 类静态成员 `static method()` / `static field`
 * - get: 访问器 `get prop()` (MethodDefinition)
 * - set: 访问器 `set prop(v)` (MethodDefinition)
 * - of: for-of 循环 `for (x of iterable)`
 * - from: 模块导入导出 `import x from 'module'` / `export * from 'module'`
 * - as: 模块重命名 `import { x as y }` / `export { x as y }`
 * - target: 元属性 `new.target` (NewTarget)
 * - meta: 元属性 `import.meta` (ImportMeta)
 */
export const SlimeJavascriptContextualKeywordTokenTypes = {
    // 注意：值必须使用小写，与实际源码中的写法一致
    // consumeIdentifierValue() 会比较 token.tokenValue === value
    Async: 'async',     // async function, async () =>
    Static: 'static',   // static method(), static field
    Let: 'let',         // let x = 1 (非严格模式下可作为标识符)
    Get: 'get',         // get prop()
    Set: 'set',         // set prop(v)
    Of: 'of',           // for (x of iterable)
    From: 'from',       // import/export from
    As: 'as',           // import/export as
    Target: 'target',   // new.target
    Meta: 'meta',       // import.meta
} as const;

/**
 * 保留字（Reserved Words）Token 类型
 *
 * 规范 A.1.7: ReservedWord :: one of
 *   await break case catch class const continue debugger default
 *   delete do else enum export extends false finally for function
 *   if import in instanceof new null return super switch this
 *   throw true try typeof var void while with yield
 *
 * 注意：
 * - let 在 ES2025 规范中不是 ReservedWord，在非严格模式下可作为标识符
 *   因此 let 被放在 SlimeJavascriptContextualKeywordTokenTypes 作为软关键字处理
 * - delete, typeof, void, in, instanceof 同时也是运算符（已在运算符分组中定义）
 */
export const SlimeJavascriptReservedWordTokenTypes = {
    Await: 'Await',
    Break: 'Break',
    Case: 'Case',
    Catch: 'Catch',
    Class: 'Class',
    Const: 'Const',
    Continue: 'Continue',
    Debugger: 'Debugger',
    Default: 'Default',
    Do: 'Do',
    Else: 'Else',
    Enum: 'Enum',
    Export: 'Export',
    Extends: 'Extends',
    False: 'False',
    Finally: 'Finally',
    For: 'For',
    Function: 'Function',
    If: 'If',
    Import: 'Import',
    New: 'New',
    NullLiteral: 'NullLiteral',  // 规范 A.1: NullLiteral :: null
    Return: 'Return',
    Super: 'Super',
    Switch: 'Switch',
    This: 'This',
    Throw: 'Throw',
    True: 'True',
    Try: 'Try',
    Var: 'Var',
    While: 'While',
    With: 'With',
    Yield: 'Yield',
} as const;

// ============================================
// Token 名称常量（与规范 A.1 词法规则名一致）
// ============================================

export const SlimeJavascriptTokenType = {

    // ============================================
    // A.1.2 White Space
    // ============================================
    WhiteSpace: 'WhiteSpace',

    // ============================================
    // A.1.3 Line Terminators
    // ============================================
    LineTerminator: 'LineTerminator',

    // ============================================
    // A.1.4 Comments
    // ============================================
    HashbangComment: 'HashbangComment',
    MultiLineComment: 'MultiLineComment',
    SingleLineComment: 'SingleLineComment',
    // B.1.1 HTML-like Comments (Web 兼容性扩展)
    SingleLineHTMLOpenComment: 'SingleLineHTMLOpenComment',    // <!--
    SingleLineHTMLCloseComment: 'SingleLineHTMLCloseComment',  // --> at line start

    // ============================================
    // A.1.5 Tokens (CommonToken)
    // ============================================
    IdentifierName: 'IdentifierName',
    PrivateIdentifier: 'PrivateIdentifier',
    NumericLiteral: 'NumericLiteral',
    StringLiteral: 'StringLiteral',
    NoSubstitutionTemplate: 'NoSubstitutionTemplate',
    TemplateHead: 'TemplateHead',
    TemplateMiddle: 'TemplateMiddle',
    TemplateTail: 'TemplateTail',
    RegularExpressionLiteral: 'RegularExpressionLiteral',

    // ============================================
    // A.1.6 Punctuators（非运算符部分）
    // ============================================
    Ellipsis: 'Ellipsis',                 // ...
    Arrow: 'Arrow',                       // =>
    OptionalChaining: 'OptionalChaining', // ?.
    LBrace: 'LBrace',                     // {
    RBrace: 'RBrace',                     // }
    LParen: 'LParen',                     // (
    RParen: 'RParen',                     // )
    LBracket: 'LBracket',                 // [
    RBracket: 'RBracket',                 // ]
    Dot: 'Dot',                           // .
    Semicolon: 'Semicolon',               // ;
    Comma: 'Comma',                       // ,
    Question: 'Question',                 // ?
    Colon: 'Colon',                       // :

    // ============================================
    // A.1.7 Reserved Words（从分组常量引入）
    // ============================================
    ...SlimeJavascriptReservedWordTokenTypes,

    // ============================================
    // 运算符 Token（从分组常量引入）
    // ============================================
    ...SlimeJavascriptAssignmentOperatorTokenTypes,
    ...SlimeJavascriptUpdateOperatorTokenTypes,
    ...SlimeJavascriptUnaryOperatorTokenTypes,
    ...SlimeJavascriptBinaryOperatorTokenTypes,
    ...SlimeJavascriptLogicalOperatorTokenTypes,

    // ============================================
    // 软关键字（从分组常量引入）
    // ============================================
    ...SlimeJavascriptContextualKeywordTokenTypes,

} as const;

