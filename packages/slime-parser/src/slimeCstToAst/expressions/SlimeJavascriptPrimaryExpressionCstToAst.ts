/**
 * PrimaryExpressionCstToAst - 基础表达式转�?
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, SlimeJavascriptPattern, SlimeJavascriptRestElement
} from "slime-ast";
import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";

import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptPrimaryExpressionCstToAstSingle {

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.PrimaryExpression?.name);
        const first = cst.children[0]
        if (first.name === SlimeJavascriptParser.prototype.IdentifierReference?.name) {
            return SlimeCstToAstUtil.createIdentifierAst(first.children[0])
        } else if (first.name === SlimeJavascriptParser.prototype.Literal?.name) {
            return SlimeCstToAstUtil.createLiteralAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.ArrayLiteral?.name) {
            return SlimeCstToAstUtil.createArrayLiteralAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.FunctionExpression?.name) {
            return SlimeCstToAstUtil.createFunctionExpressionAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.ObjectLiteral?.name) {
            return SlimeCstToAstUtil.createObjectLiteralAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.ClassExpression?.name) {
            return SlimeCstToAstUtil.createClassExpressionAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptTokenConsumer.prototype.This?.name) {
            // 处理 this 关键�?
            return SlimeJavascriptCreateUtils.createThisExpression(first.loc)
        } else if (first.name === SlimeJavascriptTokenConsumer.prototype.RegularExpressionLiteral?.name) {
            // 处理正则表达式字面量
            return SlimeCstToAstUtil.createRegExpLiteralAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.GeneratorExpression?.name || first.name === 'GeneratorExpression') {
            // 处理 function* 表达�?
            return SlimeCstToAstUtil.createGeneratorExpressionAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncFunctionExpression?.name || first.name === 'AsyncFunctionExpression') {
            // 处理 async function 表达�?
            return SlimeCstToAstUtil.createAsyncFunctionExpressionAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncGeneratorExpression?.name || first.name === 'AsyncGeneratorExpression') {
            // 处理 async function* 表达�?
            return SlimeCstToAstUtil.createAsyncGeneratorExpressionAst(first) as SlimeJavascriptExpression
        } else if (first.name === SlimeJavascriptParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            first.name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            // Cover Grammar - try to interpret as parenthesized expression
            // Structure varies: [LParen, content?, RParen] or [LParen, Expression, RParen]

            // Empty parentheses: ()
            if (!first.children || first.children.length === 0) {
                return SlimeJavascriptCreateUtils.createIdentifier('undefined', first.loc)
            }

            // Only 2 children (empty parens): LParen, RParen
            if (first.children.length === 2) {
                return SlimeJavascriptCreateUtils.createIdentifier('undefined', first.loc)
            }

            // Find the content (skip LParen at start, RParen at end)
            const middleCst = first.children[1]
            if (!middleCst) {
                return SlimeJavascriptCreateUtils.createIdentifier('undefined', first.loc)
            }

            // If it's an Expression, process it directly
            if (middleCst.name === SlimeJavascriptParser.prototype.Expression?.name || middleCst.name === 'Expression') {
                const innerExpr = SlimeCstToAstUtil.createExpressionAst(middleCst)
                return SlimeJavascriptCreateUtils.createParenthesizedExpression(innerExpr, first.loc)
            }

            // If it's AssignmentExpression, process it
            if (middleCst.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name || middleCst.name === 'AssignmentExpression') {
                const innerExpr = SlimeCstToAstUtil.createExpressionAst(middleCst)
                return SlimeJavascriptCreateUtils.createParenthesizedExpression(innerExpr, first.loc)
            }

            // If it's FormalParameterList, convert to expression
            if (middleCst.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || middleCst.name === 'FormalParameterList') {
                const params = SlimeCstToAstUtil.createFormalParameterListAst(middleCst)
                if (params.length === 1 && params[0].type === SlimeAstTypeName.Identifier) {
                    return SlimeJavascriptCreateUtils.createParenthesizedExpression(params[0] as any, first.loc)
                }
                if (params.length > 1) {
                    const expressions = params.map(p => p as any)
                    return SlimeJavascriptCreateUtils.createParenthesizedExpression({
                        type: 'SequenceExpression',
                        expressions: expressions
                    } as any, first.loc)
                }
                return SlimeJavascriptCreateUtils.createIdentifier('undefined', first.loc)
            }

            // Try to process the middle content as an expression
            try {
                const innerExpr = SlimeCstToAstUtil.createExpressionAst(middleCst)
                return SlimeJavascriptCreateUtils.createParenthesizedExpression(innerExpr, first.loc)
            } catch (e) {
                // Fallback: return the first child as identifier
                return SlimeJavascriptCreateUtils.createIdentifier('undefined', first.loc)
            }
        } else if (first.name === SlimeJavascriptParser.prototype.TemplateLiteral?.name) {
            // 处理模板字符�?
            return SlimeCstToAstUtil.createTemplateLiteralAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.ParenthesizedExpression?.name) {
            // 处理普通括号表达式�? Expression )
            // children[0]=LParen, children[1]=Expression, children[2]=RParen
            const expressionCst = first.children[1]
            const innerExpression = SlimeCstToAstUtil.createExpressionAst(expressionCst)
            return SlimeJavascriptCreateUtils.createParenthesizedExpression(innerExpression, first.loc)
        } else if (first.name === 'RegularExpressionLiteral' || first.name === 'RegularExpressionLiteral') {
            // 处理正则表达式字面量
            return SlimeCstToAstUtil.createRegExpLiteralAst(first)
        } else {
            throw new Error('未知�?PrimaryExpression 类型: ' + first.name)
        }
    }

    /**
     * ParenthesizedExpression CST �?AST
     * ParenthesizedExpression -> ( Expression )
     */
    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        // 查找内部�?Expression
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                return SlimeCstToAstUtil.createExpressionAst(child)
            }
        }
        // 如果没有找到 Expression，可能是空括号或者直接包含其他表达式
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' && ch.value !== '(' && ch.value !== ')'
        )
        if (innerExpr) {
            return SlimeCstToAstUtil.createExpressionAst(innerExpr)
        }
        throw new Error('ParenthesizedExpression has no inner expression')
    }


    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST �?AST
     * 这是一�?cover grammar，根据上下文可能是括号表达式或箭头函数参�?
     */
    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        // 通常作为括号表达式处理，箭头函数参数有专门的处理路径
        return SlimeCstToAstUtil.createParenthesizedExpressionAst(cst)
    }


    /**
     * 在Expression中查找第一个Identifier（辅助方法）
     */
    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeJavascriptTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = SlimeCstToAstUtil.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

}

export const SlimeJavascriptPrimaryExpressionCstToAst = new SlimeJavascriptPrimaryExpressionCstToAstSingle()
