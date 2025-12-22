/**
 * SlimeTokenCreateUtils.ts - Token 节点创建工厂
 *
 * 为每个 Token 类型提供创建方法
 * 与 SlimeAstNode.ts 中的 Token 类型一一对应
 */

import type {SubhutiSourceLocation} from "subhuti";
import type {
    // 变量声明关键字 Token
    SlimeVarToken,
    SlimeLetToken,
    SlimeConstToken,
    // 赋值运算符 Token
    SlimeAssignToken,
    // 标点符号 Token
    SlimeLParenToken,
    SlimeRParenToken,
    SlimeLBraceToken,
    SlimeRBraceToken,
    SlimeLBracketToken,
    SlimeRBracketToken,
    SlimeSemicolonToken,
    SlimeCommaToken,
    SlimeDotToken,
    SlimeArrowToken,
    SlimeQuestionToken,
    SlimeColonToken,
    SlimeEllipsisToken,
    SlimeOptionalChainingToken,
    SlimeAsteriskToken,
    // 函数/类关键字 Token
    SlimeFunctionToken,
    SlimeAsyncToken,
    SlimeClassToken,
    SlimeExtendsToken,
    SlimeStaticToken,
    SlimeGetToken,
    SlimeSetToken,
    // 控制流关键字 Token
    SlimeIfToken,
    SlimeElseToken,
    SlimeSwitchToken,
    SlimeCaseToken,
    SlimeDefaultToken,
    SlimeForToken,
    SlimeWhileToken,
    SlimeDoToken,
    SlimeInToken,
    SlimeOfToken,
    SlimeBreakToken,
    SlimeContinueToken,
    SlimeReturnToken,
    SlimeThrowToken,
    SlimeTryToken,
    SlimeCatchToken,
    SlimeFinallyToken,
    SlimeWithToken,
    SlimeDebuggerToken,
    // 操作符关键字 Token
    SlimeNewToken,
    SlimeYieldToken,
    SlimeAwaitToken,
    SlimeTypeofToken,
    SlimeVoidToken,
    SlimeDeleteToken,
    SlimeInstanceofToken,
    // 模块关键字 Token
    SlimeImportToken,
    SlimeExportToken,
    SlimeFromToken,
    SlimeAsToken,
    // 运算符 Token
    SlimeBinaryOperatorToken,
    SlimeUnaryOperatorToken,
    SlimeLogicalOperatorToken,
    SlimeAssignmentOperatorToken,
    SlimeUpdateOperatorToken,
    // 运算符值类型
    SlimeBinaryOperator,
    SlimeUnaryOperator,
    SlimeLogicalOperator,
    SlimeAssignmentOperator,
    SlimeUpdateOperator,
} from "./SlimeAstNode.ts";
import {
    SlimeJavascriptTokenType,
    SlimeJavascriptBinaryOperatorTokenTypes,
    SlimeJavascriptUnaryOperatorTokenTypes,
    SlimeJavascriptLogicalOperatorTokenTypes,
    SlimeJavascriptAssignmentOperatorTokenTypes,
    SlimeJavascriptUpdateOperatorTokenTypes,
} from "slime-token";

class SlimeTokenFactory {
    // ============================================
    // 变量声明关键字 Token
    // ============================================

    createVarToken(loc?: SubhutiSourceLocation): SlimeVarToken {
        return {type: SlimeJavascriptTokenType.Var, value: "var", loc} as SlimeVarToken;
    }

    createLetToken(loc?: SubhutiSourceLocation): SlimeLetToken {
        return {type: SlimeJavascriptTokenType.Let, value: "let", loc} as SlimeLetToken;
    }

    createConstToken(loc?: SubhutiSourceLocation): SlimeConstToken {
        return {type: SlimeJavascriptTokenType.Const, value: "const", loc} as SlimeConstToken;
    }

    // ============================================
    // 赋值运算符 Token
    // ============================================

    createAssignToken(loc?: SubhutiSourceLocation): SlimeAssignToken {
        return {type: SlimeJavascriptTokenType.Assign, value: "=", loc} as SlimeAssignToken;
    }

    // ============================================
    // 标点符号 Token
    // ============================================

    createLParenToken(loc?: SubhutiSourceLocation): SlimeLParenToken {
        return {type: SlimeJavascriptTokenType.LParen, value: "(", loc} as SlimeLParenToken;
    }

    createRParenToken(loc?: SubhutiSourceLocation): SlimeRParenToken {
        return {type: SlimeJavascriptTokenType.RParen, value: ")", loc} as SlimeRParenToken;
    }

    createLBraceToken(loc?: SubhutiSourceLocation): SlimeLBraceToken {
        return {type: SlimeJavascriptTokenType.LBrace, value: "{", loc} as SlimeLBraceToken;
    }

    createRBraceToken(loc?: SubhutiSourceLocation): SlimeRBraceToken {
        return {type: SlimeJavascriptTokenType.RBrace, value: "}", loc} as SlimeRBraceToken;
    }

    createLBracketToken(loc?: SubhutiSourceLocation): SlimeLBracketToken {
        return {type: SlimeJavascriptTokenType.LBracket, value: "[", loc} as SlimeLBracketToken;
    }

    createRBracketToken(loc?: SubhutiSourceLocation): SlimeRBracketToken {
        return {type: SlimeJavascriptTokenType.RBracket, value: "]", loc} as SlimeRBracketToken;
    }

    createSemicolonToken(loc?: SubhutiSourceLocation): SlimeSemicolonToken {
        return {type: SlimeJavascriptTokenType.Semicolon, value: ";", loc} as SlimeSemicolonToken;
    }

    createCommaToken(loc?: SubhutiSourceLocation): SlimeCommaToken {
        return {type: SlimeJavascriptTokenType.Comma, value: ",", loc} as SlimeCommaToken;
    }

    createDotToken(loc?: SubhutiSourceLocation): SlimeDotToken {
        return {type: SlimeJavascriptTokenType.Dot, value: ".", loc} as SlimeDotToken;
    }

    createSpreadToken(loc?: SubhutiSourceLocation): SlimeEllipsisToken {
        return {type: SlimeJavascriptTokenType.Ellipsis, value: "...", loc} as SlimeEllipsisToken;
    }

    createArrowToken(loc?: SubhutiSourceLocation): SlimeArrowToken {
        return {type: SlimeJavascriptTokenType.Arrow, value: "=>", loc} as SlimeArrowToken;
    }

    createQuestionToken(loc?: SubhutiSourceLocation): SlimeQuestionToken {
        return {type: SlimeJavascriptTokenType.Question, value: "?", loc} as SlimeQuestionToken;
    }

    createColonToken(loc?: SubhutiSourceLocation): SlimeColonToken {
        return {type: SlimeJavascriptTokenType.Colon, value: ":", loc} as SlimeColonToken;
    }

    createEllipsisToken(loc?: SubhutiSourceLocation): SlimeEllipsisToken {
        return {type: SlimeJavascriptTokenType.Ellipsis, value: "...", loc} as SlimeEllipsisToken;
    }

    createOptionalChainingToken(loc?: SubhutiSourceLocation): SlimeOptionalChainingToken {
        return {type: SlimeJavascriptTokenType.OptionalChaining, value: "?.", loc} as SlimeOptionalChainingToken;
    }

    createAsteriskToken(loc?: SubhutiSourceLocation): SlimeAsteriskToken {
        return {type: SlimeJavascriptTokenType.Asterisk, value: "*", loc} as SlimeAsteriskToken;
    }

    // ============================================
    // 函数/类关键字 Token
    // ============================================

    createFunctionToken(loc?: SubhutiSourceLocation): SlimeFunctionToken {
        return {type: SlimeJavascriptTokenType.Function, value: "function", loc} as SlimeFunctionToken;
    }

    createAsyncToken(loc?: SubhutiSourceLocation): SlimeAsyncToken {
        return {type: SlimeJavascriptTokenType.Async, value: "async", loc} as SlimeAsyncToken;
    }

    createClassToken(loc?: SubhutiSourceLocation): SlimeClassToken {
        return {type: SlimeJavascriptTokenType.Class, value: "class", loc} as SlimeClassToken;
    }

    createExtendsToken(loc?: SubhutiSourceLocation): SlimeExtendsToken {
        return {type: SlimeJavascriptTokenType.Extends, value: "extends", loc} as SlimeExtendsToken;
    }

    createStaticToken(loc?: SubhutiSourceLocation): SlimeStaticToken {
        return {type: SlimeJavascriptTokenType.Static, value: "static", loc} as SlimeStaticToken;
    }

    createGetToken(loc?: SubhutiSourceLocation): SlimeGetToken {
        return {type: SlimeJavascriptTokenType.Get, value: "get", loc} as SlimeGetToken;
    }

    createSetToken(loc?: SubhutiSourceLocation): SlimeSetToken {
        return {type: SlimeJavascriptTokenType.Set, value: "set", loc} as SlimeSetToken;
    }

    // ============================================
    // 控制流关键字 Token
    // ============================================

    createIfToken(loc?: SubhutiSourceLocation): SlimeIfToken {
        return {type: SlimeJavascriptTokenType.If, value: "if", loc} as SlimeIfToken;
    }

    createElseToken(loc?: SubhutiSourceLocation): SlimeElseToken {
        return {type: SlimeJavascriptTokenType.Else, value: "else", loc} as SlimeElseToken;
    }

    createSwitchToken(loc?: SubhutiSourceLocation): SlimeSwitchToken {
        return {type: SlimeJavascriptTokenType.Switch, value: "switch", loc} as SlimeSwitchToken;
    }

    createCaseToken(loc?: SubhutiSourceLocation): SlimeCaseToken {
        return {type: SlimeJavascriptTokenType.Case, value: "case", loc} as SlimeCaseToken;
    }

    createDefaultToken(loc?: SubhutiSourceLocation): SlimeDefaultToken {
        return {type: SlimeJavascriptTokenType.Default, value: "default", loc} as SlimeDefaultToken;
    }

    createForToken(loc?: SubhutiSourceLocation): SlimeForToken {
        return {type: SlimeJavascriptTokenType.For, value: "for", loc} as SlimeForToken;
    }

    createWhileToken(loc?: SubhutiSourceLocation): SlimeWhileToken {
        return {type: SlimeJavascriptTokenType.While, value: "while", loc} as SlimeWhileToken;
    }

    createDoToken(loc?: SubhutiSourceLocation): SlimeDoToken {
        return {type: SlimeJavascriptTokenType.Do, value: "do", loc} as SlimeDoToken;
    }

    createOfToken(loc?: SubhutiSourceLocation): SlimeOfToken {
        return {type: SlimeJavascriptTokenType.Of, value: "of", loc} as SlimeOfToken;
    }

    createBreakToken(loc?: SubhutiSourceLocation): SlimeBreakToken {
        return {type: SlimeJavascriptTokenType.Break, value: "break", loc} as SlimeBreakToken;
    }

    createContinueToken(loc?: SubhutiSourceLocation): SlimeContinueToken {
        return {type: SlimeJavascriptTokenType.Continue, value: "continue", loc} as SlimeContinueToken;
    }

    createReturnToken(loc?: SubhutiSourceLocation): SlimeReturnToken {
        return {type: SlimeJavascriptTokenType.Return, value: "return", loc} as SlimeReturnToken;
    }

    createThrowToken(loc?: SubhutiSourceLocation): SlimeThrowToken {
        return {type: SlimeJavascriptTokenType.Throw, value: "throw", loc} as SlimeThrowToken;
    }

    createTryToken(loc?: SubhutiSourceLocation): SlimeTryToken {
        return {type: SlimeJavascriptTokenType.Try, value: "try", loc} as SlimeTryToken;
    }

    createCatchToken(loc?: SubhutiSourceLocation): SlimeCatchToken {
        return {type: SlimeJavascriptTokenType.Catch, value: "catch", loc} as SlimeCatchToken;
    }

    createFinallyToken(loc?: SubhutiSourceLocation): SlimeFinallyToken {
        return {type: SlimeJavascriptTokenType.Finally, value: "finally", loc} as SlimeFinallyToken;
    }

    createWithToken(loc?: SubhutiSourceLocation): SlimeWithToken {
        return {type: SlimeJavascriptTokenType.With, value: "with", loc} as SlimeWithToken;
    }

    createDebuggerToken(loc?: SubhutiSourceLocation): SlimeDebuggerToken {
        return {type: SlimeJavascriptTokenType.Debugger, value: "debugger", loc} as SlimeDebuggerToken;
    }

    // ============================================
    // 操作符关键字 Token
    // ============================================

    createNewToken(loc?: SubhutiSourceLocation): SlimeNewToken {
        return {type: SlimeJavascriptTokenType.New, value: "new", loc} as SlimeNewToken;
    }

    createYieldToken(loc?: SubhutiSourceLocation): SlimeYieldToken {
        return {type: SlimeJavascriptTokenType.Yield, value: "yield", loc} as SlimeYieldToken;
    }

    createAwaitToken(loc?: SubhutiSourceLocation): SlimeAwaitToken {
        return {type: SlimeJavascriptTokenType.Await, value: "await", loc} as SlimeAwaitToken;
    }

    createTypeofToken(loc?: SubhutiSourceLocation): SlimeTypeofToken {
        return {type: SlimeJavascriptTokenType.Typeof, value: "typeof", loc} as SlimeTypeofToken;
    }

    createVoidToken(loc?: SubhutiSourceLocation): SlimeVoidToken {
        return {type: SlimeJavascriptTokenType.Void, value: "void", loc} as SlimeVoidToken;
    }

    createDeleteToken(loc?: SubhutiSourceLocation): SlimeDeleteToken {
        return {type: SlimeJavascriptTokenType.Delete, value: "delete", loc} as SlimeDeleteToken;
    }

    createInstanceofToken(loc?: SubhutiSourceLocation): SlimeInstanceofToken {
        return {type: SlimeJavascriptTokenType.Instanceof, value: "instanceof", loc} as SlimeInstanceofToken;
    }

    // ============================================
    // 模块关键字 Token
    // ============================================

    createImportToken(loc?: SubhutiSourceLocation): SlimeImportToken {
        return {type: SlimeJavascriptTokenType.Import, value: "import", loc} as SlimeImportToken;
    }

    createExportToken(loc?: SubhutiSourceLocation): SlimeExportToken {
        return {type: SlimeJavascriptTokenType.Export, value: "export", loc} as SlimeExportToken;
    }

    createFromToken(loc?: SubhutiSourceLocation): SlimeFromToken {
        return {type: SlimeJavascriptTokenType.From, value: "from", loc} as SlimeFromToken;
    }

    createAsToken(loc?: SubhutiSourceLocation): SlimeAsToken {
        return {type: SlimeJavascriptTokenType.As, value: "as", loc} as SlimeAsToken;
    }

    createInToken(loc?: SubhutiSourceLocation): SlimeInToken {
        return {type: SlimeJavascriptTokenType.In, value: "in", loc} as SlimeInToken;
    }

    // ============================================
    // 运算符 Token
    // ============================================

    /**
     * 创建二元运算符 Token
     * 支持: == != === !== < <= > >= << >> >>> + - * / % ** | ^ & in instanceof
     */
    createBinaryOperatorToken(operator: SlimeBinaryOperator, loc?: SubhutiSourceLocation): SlimeBinaryOperatorToken {
        const typeMap: Record<SlimeBinaryOperator, string> = {
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
        return {type: typeMap[operator], value: operator, loc} as SlimeBinaryOperatorToken;
    }

    /**
     * 创建一元运算符 Token
     * 支持: - + ! ~ typeof void delete
     */
    createUnaryOperatorToken(operator: SlimeUnaryOperator, loc?: SubhutiSourceLocation): SlimeUnaryOperatorToken {
        const typeMap: Record<SlimeUnaryOperator, string> = {
            "-": SlimeJavascriptUnaryOperatorTokenTypes.Minus,
            "+": SlimeJavascriptUnaryOperatorTokenTypes.Plus,
            "!": SlimeJavascriptUnaryOperatorTokenTypes.LogicalNot,
            "~": SlimeJavascriptUnaryOperatorTokenTypes.BitwiseNot,
            "typeof": SlimeJavascriptUnaryOperatorTokenTypes.Typeof,
            "void": SlimeJavascriptUnaryOperatorTokenTypes.Void,
            "delete": SlimeJavascriptUnaryOperatorTokenTypes.Delete,
        };
        return {type: typeMap[operator], value: operator, loc} as SlimeUnaryOperatorToken;
    }

    /**
     * 创建逻辑运算符 Token
     * 支持: || && ??
     */
    createLogicalOperatorToken(operator: SlimeLogicalOperator, loc?: SubhutiSourceLocation): SlimeLogicalOperatorToken {
        const typeMap: Record<SlimeLogicalOperator, string> = {
            "||": SlimeJavascriptLogicalOperatorTokenTypes.LogicalOr,
            "&&": SlimeJavascriptLogicalOperatorTokenTypes.LogicalAnd,
            "??": SlimeJavascriptLogicalOperatorTokenTypes.NullishCoalescing,
        };
        return {type: typeMap[operator], value: operator, loc} as SlimeLogicalOperatorToken;
    }

    /**
     * 创建赋值运算符 Token
     * 支持: = += -= *= /= %= **= <<= >>= >>>= |= ^= &= ||= &&= ??=
     */
    createAssignmentOperatorToken(operator: SlimeAssignmentOperator, loc?: SubhutiSourceLocation): SlimeAssignmentOperatorToken {
        const typeMap: Record<SlimeAssignmentOperator, string> = {
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
        return {type: typeMap[operator], value: operator, loc} as SlimeAssignmentOperatorToken;
    }

    /**
     * 创建更新运算符 Token
     * 支持: ++ --
     */
    createUpdateOperatorToken(operator: SlimeUpdateOperator, loc?: SubhutiSourceLocation): SlimeUpdateOperatorToken {
        const typeMap: Record<SlimeUpdateOperator, string> = {
            "++": SlimeJavascriptUpdateOperatorTokenTypes.Increment,
            "--": SlimeJavascriptUpdateOperatorTokenTypes.Decrement,
        };
        return {type: typeMap[operator], value: operator, loc} as SlimeUpdateOperatorToken;
    }
}

const SlimeTokenCreateUtils = new SlimeTokenFactory();
export default SlimeTokenCreateUtils;

