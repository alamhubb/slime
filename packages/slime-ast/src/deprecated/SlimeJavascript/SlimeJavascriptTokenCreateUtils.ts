/**
 * SlimeJavascriptTokenCreateUtils.ts - Token 节点创建工厂
 *
 * 为每个 Token 类型提供创建方法
 * 与 SlimeJavascriptAstNode.ts 中的 Token 类型一一对应
 */

import type { SubhutiSourceLocation } from "subhuti";
import type {
    // 变量声明关键字 Token
    SlimeJavascriptVarToken,
    SlimeJavascriptLetToken,
    SlimeJavascriptConstToken,
    // 赋值运算符 Token
    SlimeJavascriptAssignToken,
    // 标点符号 Token
    SlimeJavascriptLParenToken,
    SlimeJavascriptRParenToken,
    SlimeJavascriptLBraceToken,
    SlimeJavascriptRBraceToken,
    SlimeJavascriptLBracketToken,
    SlimeJavascriptRBracketToken,
    SlimeJavascriptSemicolonToken,
    SlimeJavascriptCommaToken,
    SlimeJavascriptDotToken,
    SlimeJavascriptArrowToken,
    SlimeJavascriptQuestionToken,
    SlimeJavascriptColonToken,
    SlimeJavascriptEllipsisToken,
    SlimeJavascriptOptionalChainingToken,
    SlimeJavascriptAsteriskToken,
    // 函数/类关键字 Token
    SlimeJavascriptFunctionToken,
    SlimeJavascriptAsyncToken,
    SlimeJavascriptClassToken,
    SlimeJavascriptExtendsToken,
    SlimeJavascriptStaticToken,
    SlimeJavascriptGetToken,
    SlimeJavascriptSetToken,
    // 控制流关键字 Token
    SlimeJavascriptIfToken,
    SlimeJavascriptElseToken,
    SlimeJavascriptSwitchToken,
    SlimeJavascriptCaseToken,
    SlimeJavascriptDefaultToken,
    SlimeJavascriptForToken,
    SlimeJavascriptWhileToken,
    SlimeJavascriptDoToken,
    SlimeJavascriptInToken,
    SlimeJavascriptOfToken,
    SlimeJavascriptBreakToken,
    SlimeJavascriptContinueToken,
    SlimeJavascriptReturnToken,
    SlimeJavascriptThrowToken,
    SlimeJavascriptTryToken,
    SlimeJavascriptCatchToken,
    SlimeJavascriptFinallyToken,
    SlimeJavascriptWithToken,
    SlimeJavascriptDebuggerToken,
    // 操作符关键字 Token
    SlimeJavascriptNewToken,
    SlimeJavascriptYieldToken,
    SlimeJavascriptAwaitToken,
    SlimeJavascriptTypeofToken,
    SlimeJavascriptVoidToken,
    SlimeJavascriptDeleteToken,
    SlimeJavascriptInstanceofToken,
    // 模块关键字 Token
    SlimeJavascriptImportToken,
    SlimeJavascriptExportToken,
    SlimeJavascriptFromToken,
    SlimeJavascriptAsToken,
    // 运算符 Token
    SlimeJavascriptBinaryOperatorToken,
    SlimeJavascriptUnaryOperatorToken,
    SlimeJavascriptLogicalOperatorToken,
    SlimeJavascriptAssignmentOperatorToken,
    SlimeJavascriptUpdateOperatorToken,
    // 运算符值类型
    SlimeJavascriptBinaryOperator,
    SlimeJavascriptUnaryOperator,
    SlimeJavascriptLogicalOperator,
    SlimeJavascriptAssignmentOperator,
    SlimeJavascriptUpdateOperator,
} from "./SlimeJavascriptAstNode.ts";
import {
    SlimeJavascriptTokenType,
    SlimeJavascriptBinaryOperatorTokenTypes,
    SlimeJavascriptUnaryOperatorTokenTypes,
    SlimeJavascriptLogicalOperatorTokenTypes,
    SlimeJavascriptAssignmentOperatorTokenTypes,
    SlimeJavascriptUpdateOperatorTokenTypes,
} from "slime-token";

class SlimeJavascriptTokenFactory {
    // ============================================
    // 变量声明关键字 Token
    // ============================================

    createVarToken(loc?: SubhutiSourceLocation): SlimeJavascriptVarToken {
        return { type: SlimeJavascriptTokenType.Var, value: "var", loc } as SlimeJavascriptVarToken;
    }

    createLetToken(loc?: SubhutiSourceLocation): SlimeJavascriptLetToken {
        return { type: SlimeJavascriptTokenType.Let, value: "let", loc } as SlimeJavascriptLetToken;
    }

    createConstToken(loc?: SubhutiSourceLocation): SlimeJavascriptConstToken {
        return { type: SlimeJavascriptTokenType.Const, value: "const", loc } as SlimeJavascriptConstToken;
    }

    // ============================================
    // 赋值运算符 Token
    // ============================================

    createAssignToken(loc?: SubhutiSourceLocation): SlimeJavascriptAssignToken {
        return { type: SlimeJavascriptTokenType.Assign, value: "=", loc } as SlimeJavascriptAssignToken;
    }

    // ============================================
    // 标点符号 Token
    // ============================================

    createLParenToken(loc?: SubhutiSourceLocation): SlimeJavascriptLParenToken {
        return { type: SlimeJavascriptTokenType.LParen, value: "(", loc } as SlimeJavascriptLParenToken;
    }

    createRParenToken(loc?: SubhutiSourceLocation): SlimeJavascriptRParenToken {
        return { type: SlimeJavascriptTokenType.RParen, value: ")", loc } as SlimeJavascriptRParenToken;
    }

    createLBraceToken(loc?: SubhutiSourceLocation): SlimeJavascriptLBraceToken {
        return { type: SlimeJavascriptTokenType.LBrace, value: "{", loc } as SlimeJavascriptLBraceToken;
    }

    createRBraceToken(loc?: SubhutiSourceLocation): SlimeJavascriptRBraceToken {
        return { type: SlimeJavascriptTokenType.RBrace, value: "}", loc } as SlimeJavascriptRBraceToken;
    }

    createLBracketToken(loc?: SubhutiSourceLocation): SlimeJavascriptLBracketToken {
        return { type: SlimeJavascriptTokenType.LBracket, value: "[", loc } as SlimeJavascriptLBracketToken;
    }

    createRBracketToken(loc?: SubhutiSourceLocation): SlimeJavascriptRBracketToken {
        return { type: SlimeJavascriptTokenType.RBracket, value: "]", loc } as SlimeJavascriptRBracketToken;
    }

    createSemicolonToken(loc?: SubhutiSourceLocation): SlimeJavascriptSemicolonToken {
        return { type: SlimeJavascriptTokenType.Semicolon, value: ";", loc } as SlimeJavascriptSemicolonToken;
    }

    createCommaToken(loc?: SubhutiSourceLocation): SlimeJavascriptCommaToken {
        return { type: SlimeJavascriptTokenType.Comma, value: ",", loc } as SlimeJavascriptCommaToken;
    }

    createDotToken(loc?: SubhutiSourceLocation): SlimeJavascriptDotToken {
        return { type: SlimeJavascriptTokenType.Dot, value: ".", loc } as SlimeJavascriptDotToken;
    }

    createSpreadToken(loc?: SubhutiSourceLocation): SlimeJavascriptEllipsisToken {
        return { type: SlimeJavascriptTokenType.Ellipsis, value: "...", loc } as SlimeJavascriptEllipsisToken;
    }

    createArrowToken(loc?: SubhutiSourceLocation): SlimeJavascriptArrowToken {
        return { type: SlimeJavascriptTokenType.Arrow, value: "=>", loc } as SlimeJavascriptArrowToken;
    }

    createQuestionToken(loc?: SubhutiSourceLocation): SlimeJavascriptQuestionToken {
        return { type: SlimeJavascriptTokenType.Question, value: "?", loc } as SlimeJavascriptQuestionToken;
    }

    createColonToken(loc?: SubhutiSourceLocation): SlimeJavascriptColonToken {
        return { type: SlimeJavascriptTokenType.Colon, value: ":", loc } as SlimeJavascriptColonToken;
    }

    createEllipsisToken(loc?: SubhutiSourceLocation): SlimeJavascriptEllipsisToken {
        return { type: SlimeJavascriptTokenType.Ellipsis, value: "...", loc } as SlimeJavascriptEllipsisToken;
    }

    createOptionalChainingToken(loc?: SubhutiSourceLocation): SlimeJavascriptOptionalChainingToken {
        return { type: SlimeJavascriptTokenType.OptionalChaining, value: "?.", loc } as SlimeJavascriptOptionalChainingToken;
    }

    createAsteriskToken(loc?: SubhutiSourceLocation): SlimeJavascriptAsteriskToken {
        return { type: SlimeJavascriptTokenType.Asterisk, value: "*", loc } as SlimeJavascriptAsteriskToken;
    }

    // ============================================
    // 函数/类关键字 Token
    // ============================================

    createFunctionToken(loc?: SubhutiSourceLocation): SlimeJavascriptFunctionToken {
        return { type: SlimeJavascriptTokenType.Function, value: "function", loc } as SlimeJavascriptFunctionToken;
    }

    createAsyncToken(loc?: SubhutiSourceLocation): SlimeJavascriptAsyncToken {
        return { type: SlimeJavascriptTokenType.Async, value: "async", loc } as SlimeJavascriptAsyncToken;
    }

    createClassToken(loc?: SubhutiSourceLocation): SlimeJavascriptClassToken {
        return { type: SlimeJavascriptTokenType.Class, value: "class", loc } as SlimeJavascriptClassToken;
    }

    createExtendsToken(loc?: SubhutiSourceLocation): SlimeJavascriptExtendsToken {
        return { type: SlimeJavascriptTokenType.Extends, value: "extends", loc } as SlimeJavascriptExtendsToken;
    }

    createStaticToken(loc?: SubhutiSourceLocation): SlimeJavascriptStaticToken {
        return { type: SlimeJavascriptTokenType.Static, value: "static", loc } as SlimeJavascriptStaticToken;
    }

    createGetToken(loc?: SubhutiSourceLocation): SlimeJavascriptGetToken {
        return { type: SlimeJavascriptTokenType.Get, value: "get", loc } as SlimeJavascriptGetToken;
    }

    createSetToken(loc?: SubhutiSourceLocation): SlimeJavascriptSetToken {
        return { type: SlimeJavascriptTokenType.Set, value: "set", loc } as SlimeJavascriptSetToken;
    }

    // ============================================
    // 控制流关键字 Token
    // ============================================

    createIfToken(loc?: SubhutiSourceLocation): SlimeJavascriptIfToken {
        return { type: SlimeJavascriptTokenType.If, value: "if", loc } as SlimeJavascriptIfToken;
    }

    createElseToken(loc?: SubhutiSourceLocation): SlimeJavascriptElseToken {
        return { type: SlimeJavascriptTokenType.Else, value: "else", loc } as SlimeJavascriptElseToken;
    }

    createSwitchToken(loc?: SubhutiSourceLocation): SlimeJavascriptSwitchToken {
        return { type: SlimeJavascriptTokenType.Switch, value: "switch", loc } as SlimeJavascriptSwitchToken;
    }

    createCaseToken(loc?: SubhutiSourceLocation): SlimeJavascriptCaseToken {
        return { type: SlimeJavascriptTokenType.Case, value: "case", loc } as SlimeJavascriptCaseToken;
    }

    createDefaultToken(loc?: SubhutiSourceLocation): SlimeJavascriptDefaultToken {
        return { type: SlimeJavascriptTokenType.Default, value: "default", loc } as SlimeJavascriptDefaultToken;
    }

    createForToken(loc?: SubhutiSourceLocation): SlimeJavascriptForToken {
        return { type: SlimeJavascriptTokenType.For, value: "for", loc } as SlimeJavascriptForToken;
    }

    createWhileToken(loc?: SubhutiSourceLocation): SlimeJavascriptWhileToken {
        return { type: SlimeJavascriptTokenType.While, value: "while", loc } as SlimeJavascriptWhileToken;
    }

    createDoToken(loc?: SubhutiSourceLocation): SlimeJavascriptDoToken {
        return { type: SlimeJavascriptTokenType.Do, value: "do", loc } as SlimeJavascriptDoToken;
    }

    createOfToken(loc?: SubhutiSourceLocation): SlimeJavascriptOfToken {
        return { type: SlimeJavascriptTokenType.Of, value: "of", loc } as SlimeJavascriptOfToken;
    }

    createBreakToken(loc?: SubhutiSourceLocation): SlimeJavascriptBreakToken {
        return { type: SlimeJavascriptTokenType.Break, value: "break", loc } as SlimeJavascriptBreakToken;
    }

    createContinueToken(loc?: SubhutiSourceLocation): SlimeJavascriptContinueToken {
        return { type: SlimeJavascriptTokenType.Continue, value: "continue", loc } as SlimeJavascriptContinueToken;
    }

    createReturnToken(loc?: SubhutiSourceLocation): SlimeJavascriptReturnToken {
        return { type: SlimeJavascriptTokenType.Return, value: "return", loc } as SlimeJavascriptReturnToken;
    }

    createThrowToken(loc?: SubhutiSourceLocation): SlimeJavascriptThrowToken {
        return { type: SlimeJavascriptTokenType.Throw, value: "throw", loc } as SlimeJavascriptThrowToken;
    }

    createTryToken(loc?: SubhutiSourceLocation): SlimeJavascriptTryToken {
        return { type: SlimeJavascriptTokenType.Try, value: "try", loc } as SlimeJavascriptTryToken;
    }

    createCatchToken(loc?: SubhutiSourceLocation): SlimeJavascriptCatchToken {
        return { type: SlimeJavascriptTokenType.Catch, value: "catch", loc } as SlimeJavascriptCatchToken;
    }

    createFinallyToken(loc?: SubhutiSourceLocation): SlimeJavascriptFinallyToken {
        return { type: SlimeJavascriptTokenType.Finally, value: "finally", loc } as SlimeJavascriptFinallyToken;
    }

    createWithToken(loc?: SubhutiSourceLocation): SlimeJavascriptWithToken {
        return { type: SlimeJavascriptTokenType.With, value: "with", loc } as SlimeJavascriptWithToken;
    }

    createDebuggerToken(loc?: SubhutiSourceLocation): SlimeJavascriptDebuggerToken {
        return { type: SlimeJavascriptTokenType.Debugger, value: "debugger", loc } as SlimeJavascriptDebuggerToken;
    }

    // ============================================
    // 操作符关键字 Token
    // ============================================

    createNewToken(loc?: SubhutiSourceLocation): SlimeJavascriptNewToken {
        return { type: SlimeJavascriptTokenType.New, value: "new", loc } as SlimeJavascriptNewToken;
    }

    createYieldToken(loc?: SubhutiSourceLocation): SlimeJavascriptYieldToken {
        return { type: SlimeJavascriptTokenType.Yield, value: "yield", loc } as SlimeJavascriptYieldToken;
    }

    createAwaitToken(loc?: SubhutiSourceLocation): SlimeJavascriptAwaitToken {
        return { type: SlimeJavascriptTokenType.Await, value: "await", loc } as SlimeJavascriptAwaitToken;
    }

    createTypeofToken(loc?: SubhutiSourceLocation): SlimeJavascriptTypeofToken {
        return { type: SlimeJavascriptTokenType.Typeof, value: "typeof", loc } as SlimeJavascriptTypeofToken;
    }

    createVoidToken(loc?: SubhutiSourceLocation): SlimeJavascriptVoidToken {
        return { type: SlimeJavascriptTokenType.Void, value: "void", loc } as SlimeJavascriptVoidToken;
    }

    createDeleteToken(loc?: SubhutiSourceLocation): SlimeJavascriptDeleteToken {
        return { type: SlimeJavascriptTokenType.Delete, value: "delete", loc } as SlimeJavascriptDeleteToken;
    }

    createInstanceofToken(loc?: SubhutiSourceLocation): SlimeJavascriptInstanceofToken {
        return { type: SlimeJavascriptTokenType.Instanceof, value: "instanceof", loc } as SlimeJavascriptInstanceofToken;
    }

    // ============================================
    // 模块关键字 Token
    // ============================================

    createImportToken(loc?: SubhutiSourceLocation): SlimeJavascriptImportToken {
        return { type: SlimeJavascriptTokenType.Import, value: "import", loc } as SlimeJavascriptImportToken;
    }

    createExportToken(loc?: SubhutiSourceLocation): SlimeJavascriptExportToken {
        return { type: SlimeJavascriptTokenType.Export, value: "export", loc } as SlimeJavascriptExportToken;
    }

    createFromToken(loc?: SubhutiSourceLocation): SlimeJavascriptFromToken {
        return { type: SlimeJavascriptTokenType.From, value: "from", loc } as SlimeJavascriptFromToken;
    }

    createAsToken(loc?: SubhutiSourceLocation): SlimeJavascriptAsToken {
        return { type: SlimeJavascriptTokenType.As, value: "as", loc } as SlimeJavascriptAsToken;
    }

    createInToken(loc?: SubhutiSourceLocation): SlimeJavascriptInToken {
        return { type: SlimeJavascriptTokenType.In, value: "in", loc } as SlimeJavascriptInToken;
    }

    // ============================================
    // 运算符 Token
    // ============================================

    /**
     * 创建二元运算符 Token
     * 支持: == != === !== < <= > >= << >> >>> + - * / % ** | ^ & in instanceof
     */
    createBinaryOperatorToken(operator: SlimeJavascriptBinaryOperator, loc?: SubhutiSourceLocation): SlimeJavascriptBinaryOperatorToken {
        const typeMap: Record<SlimeJavascriptBinaryOperator, string> = {
            "==": SlimeJavascriptBinaryOperatorTokenTypes.Equal,
            "!=": SlimeJavascriptBinaryOperatorTokenTypes.NotEqual,
            "===": SlimeJavascriptBinaryOperatorTokenTypes.StrictEqual,
            "!==": SlimeJavascriptBinaryOperatorTokenTypes.StrictNotEqual,
            "<": SlimeJavascriptBinaryOperatorTokenTypes.Less,
            "<=": SlimeJavascriptBinaryOperatorTokenTypes.LessEqual,
            ">": SlimeJavascriptBinaryOperatorTokenTypes.Greater,
            ">=": SlimeJavascriptBinaryOperatorTokenTypes.GreaterEqual,
            "<<": SlimeJavascriptBinaryOperatorTokenTypes.LeftShift,
            ">>": SlimeJavascriptBinaryOperatorTokenTypes.RightShift,
            ">>>": SlimeJavascriptBinaryOperatorTokenTypes.UnsignedRightShift,
            "+": SlimeJavascriptBinaryOperatorTokenTypes.Plus,
            "-": SlimeJavascriptBinaryOperatorTokenTypes.Minus,
            "*": SlimeJavascriptBinaryOperatorTokenTypes.Asterisk,
            "/": SlimeJavascriptBinaryOperatorTokenTypes.Slash,
            "%": SlimeJavascriptBinaryOperatorTokenTypes.Modulo,
            "**": SlimeJavascriptBinaryOperatorTokenTypes.Exponentiation,
            "|": SlimeJavascriptBinaryOperatorTokenTypes.BitwiseOr,
            "^": SlimeJavascriptBinaryOperatorTokenTypes.BitwiseXor,
            "&": SlimeJavascriptBinaryOperatorTokenTypes.BitwiseAnd,
            "in": SlimeJavascriptBinaryOperatorTokenTypes.In,
            "instanceof": SlimeJavascriptBinaryOperatorTokenTypes.Instanceof,
        };
        return { type: typeMap[operator], value: operator, loc } as SlimeJavascriptBinaryOperatorToken;
    }

    /**
     * 创建一元运算符 Token
     * 支持: - + ! ~ typeof void delete
     */
    createUnaryOperatorToken(operator: SlimeJavascriptUnaryOperator, loc?: SubhutiSourceLocation): SlimeJavascriptUnaryOperatorToken {
        const typeMap: Record<SlimeJavascriptUnaryOperator, string> = {
            "-": SlimeJavascriptUnaryOperatorTokenTypes.Minus,
            "+": SlimeJavascriptUnaryOperatorTokenTypes.Plus,
            "!": SlimeJavascriptUnaryOperatorTokenTypes.LogicalNot,
            "~": SlimeJavascriptUnaryOperatorTokenTypes.BitwiseNot,
            "typeof": SlimeJavascriptUnaryOperatorTokenTypes.Typeof,
            "void": SlimeJavascriptUnaryOperatorTokenTypes.Void,
            "delete": SlimeJavascriptUnaryOperatorTokenTypes.Delete,
        };
        return { type: typeMap[operator], value: operator, loc } as SlimeJavascriptUnaryOperatorToken;
    }

    /**
     * 创建逻辑运算符 Token
     * 支持: || && ??
     */
    createLogicalOperatorToken(operator: SlimeJavascriptLogicalOperator, loc?: SubhutiSourceLocation): SlimeJavascriptLogicalOperatorToken {
        const typeMap: Record<SlimeJavascriptLogicalOperator, string> = {
            "||": SlimeJavascriptLogicalOperatorTokenTypes.LogicalOr,
            "&&": SlimeJavascriptLogicalOperatorTokenTypes.LogicalAnd,
            "??": SlimeJavascriptLogicalOperatorTokenTypes.NullishCoalescing,
        };
        return { type: typeMap[operator], value: operator, loc } as SlimeJavascriptLogicalOperatorToken;
    }

    /**
     * 创建赋值运算符 Token
     * 支持: = += -= *= /= %= **= <<= >>= >>>= |= ^= &= ||= &&= ??=
     */
    createAssignmentOperatorToken(operator: SlimeJavascriptAssignmentOperator, loc?: SubhutiSourceLocation): SlimeJavascriptAssignmentOperatorToken {
        const typeMap: Record<SlimeJavascriptAssignmentOperator, string> = {
            "=": SlimeJavascriptAssignmentOperatorTokenTypes.Assign,
            "+=": SlimeJavascriptAssignmentOperatorTokenTypes.PlusAssign,
            "-=": SlimeJavascriptAssignmentOperatorTokenTypes.MinusAssign,
            "*=": SlimeJavascriptAssignmentOperatorTokenTypes.MultiplyAssign,
            "/=": SlimeJavascriptAssignmentOperatorTokenTypes.DivideAssign,
            "%=": SlimeJavascriptAssignmentOperatorTokenTypes.ModuloAssign,
            "**=": SlimeJavascriptAssignmentOperatorTokenTypes.ExponentiationAssign,
            "<<=": SlimeJavascriptAssignmentOperatorTokenTypes.LeftShiftAssign,
            ">>=": SlimeJavascriptAssignmentOperatorTokenTypes.RightShiftAssign,
            ">>>=": SlimeJavascriptAssignmentOperatorTokenTypes.UnsignedRightShiftAssign,
            "|=": SlimeJavascriptAssignmentOperatorTokenTypes.BitwiseOrAssign,
            "^=": SlimeJavascriptAssignmentOperatorTokenTypes.BitwiseXorAssign,
            "&=": SlimeJavascriptAssignmentOperatorTokenTypes.BitwiseAndAssign,
            "||=": SlimeJavascriptAssignmentOperatorTokenTypes.LogicalOrAssign,
            "&&=": SlimeJavascriptAssignmentOperatorTokenTypes.LogicalAndAssign,
            "??=": SlimeJavascriptAssignmentOperatorTokenTypes.NullishCoalescingAssign,
        };
        return { type: typeMap[operator], value: operator, loc } as SlimeJavascriptAssignmentOperatorToken;
    }

    /**
     * 创建更新运算符 Token
     * 支持: ++ --
     */
    createUpdateOperatorToken(operator: SlimeJavascriptUpdateOperator, loc?: SubhutiSourceLocation): SlimeJavascriptUpdateOperatorToken {
        const typeMap: Record<SlimeJavascriptUpdateOperator, string> = {
            "++": SlimeJavascriptUpdateOperatorTokenTypes.Increment,
            "--": SlimeJavascriptUpdateOperatorTokenTypes.Decrement,
        };
        return { type: typeMap[operator], value: operator, loc } as SlimeJavascriptUpdateOperatorToken;
    }
}

const SlimeJavascriptTokenCreateUtils = new SlimeJavascriptTokenFactory();
export default SlimeJavascriptTokenCreateUtils;

