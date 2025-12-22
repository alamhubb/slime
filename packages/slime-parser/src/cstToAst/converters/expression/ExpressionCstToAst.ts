/**
 * ExpressionCstToAst - 核心表达式转换（Expression 路由和操作符）
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeExpression,
    SlimeNodeType,
} from "slime-ast";
import SlimeParser from "../../../SlimeParser";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class ExpressionCstToAst {
    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST 转 AST
     * 这是一个 cover grammar，根据上下文可能是括号表达式或箭头函数参数
     */
    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createParenthesizedExpressionAst(cst)
    }

    /**
     * ParenthesizedExpression CST 转 AST
     * ParenthesizedExpression -> ( Expression )
     */
    static createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        // 查找内部的 Expression
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
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
     * ComputedPropertyName CST 转 AST
     * ComputedPropertyName -> [ AssignmentExpression ]
     */
    static createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }

    /**
     * CoverInitializedName CST 转 AST
     * CoverInitializedName -> IdentifierReference Initializer
     */
    static createCoverInitializedNameAst(cst: SubhutiCst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.IdentifierReference?.name ||
            ch.name === 'IdentifierReference'
        )
        const init = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name ||
            ch.name === 'Initializer'
        )

        const id = idRef ? SlimeCstToAstUtil.createIdentifierReferenceAst(idRef) : null
        const initValue = init ? SlimeCstToAstUtil.createInitializerAst(init) : null

        return {
            type: SlimeNodeType.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        }
    }

    /**
     * CoverCallExpressionAndAsyncArrowHead CST 转 AST
     * 这是一个 cover grammar，通常作为 CallExpression 处理
     */
    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createCallExpressionAst(cst)
    }

    /**
     * CallMemberExpression CST 转 AST
     * CallMemberExpression -> MemberExpression Arguments
     */
    static createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createCallExpressionAst(cst)
    }

    /**
     * ShortCircuitExpression CST 转 AST（透传）
     * ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    static createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }

    /**
     * CoalesceExpressionHead CST 转 AST
     * CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    static createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('CoalesceExpressionHead has no children')
    }

    /**
     * MultiplicativeOperator CST 转 AST
     * MultiplicativeOperator -> * | / | %
     */
    static createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * AssignmentOperator CST 转 AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    static createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    /**
     * ExpressionBody CST 转 AST
     * ExpressionBody -> AssignmentExpression
     */
    static createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }

    /**
     * 创建 SequenceExpression AST
     * 处理逗号表达式
     */
    static createSequenceExpressionAst(cst: SubhutiCst): SlimeExpression {
        const expressions: SlimeExpression[] = []
        for (const child of cst.children || []) {
            if (child.name === 'Comma' || child.value === ',') {
                continue
            }
            expressions.push(SlimeCstToAstUtil.createExpressionAst(child))
        }

        if (expressions.length === 1) {
            return expressions[0]
        } else if (expressions.length > 1) {
            return {
                type: SlimeNodeType.SequenceExpression,
                expressions: expressions,
                loc: cst.loc
            } as any
        } else {
            throw new Error('Expression has no children')
        }
    }
}
