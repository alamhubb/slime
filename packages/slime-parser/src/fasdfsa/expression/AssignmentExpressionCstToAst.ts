import { SubhutiCst } from "subhuti";
import {
    SlimeArrowFunctionExpression, SlimeAssignmentExpression, SlimeAstUtil,
    type SlimeBlockStatement, type SlimeClassExpression,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier,
    SlimeTokenCreate
} from "slime-ast";
import { SlimeAstUtils } from "../SlimeAstUtils.ts";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class AssignmentExpressionCstToAst {

    /**
     * ExpressionBody CST �?AST
     * ExpressionBody -> AssignmentExpression
     */
    static createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }



    static createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return SlimeCstToAstUtil.createArrowFunctionAst(child)
            }
            // 否则作为表达式处�?
            return SlimeCstToAstUtil.createExpressionAst(child)
        }

        // AssignmentExpression -> LeftHandSideExpression + Eq + AssignmentExpression
        // �?LeftHandSideExpression + AssignmentOperator + AssignmentExpression
        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = SlimeCstToAstUtil.createExpressionAst(leftCst)
        const right = SlimeCstToAstUtil.createAssignmentExpressionAst(rightCst)
        // AssignmentOperator节点下有子节�?PlusEq/MinusEq�?，需要从children[0].value获取
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: SlimeAssignmentExpression = {
            type: 'AssignmentExpression',
            operator: operator as any,
            left: left as any,
            right: right,
            loc: cst.loc
        }
        return ast
    }


    static createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = SlimeCstToAstUtil.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = SlimeCstToAstUtil.createExpressionAstUncached(cst)
        SlimeCstToAstUtil.expressionAstCache.set(cst, result)
        return result
    }

    static createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeParser.prototype.Expression?.name) {
            // Expression 可能是逗号表达�?(SequenceExpression)
            // 结构: Expression -> AssignmentExpression | Expression, AssignmentExpression
            // 收集所有表达式
            const expressions: SlimeExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    // 跳过逗号 token
                    continue
                }
                expressions.push(SlimeCstToAstUtil.createExpressionAst(child))
            }

            if (expressions.length === 1) {
                // 单个表达式，直接返回
                left = expressions[0]
            } else if (expressions.length > 1) {
                // 多个表达式，创建 SequenceExpression
                left = {
                    type: 'SequenceExpression',
                    expressions: expressions,
                    loc: cst.loc
                } as any
            } else {
                throw new Error('Expression has no children')
            }
        } else if (astName === SlimeParser.prototype.Statement?.name) {
            left = SlimeCstToAstUtil.createStatementAst(cst)
        } else if (astName === SlimeParser.prototype.AssignmentExpression?.name) {
            left = SlimeCstToAstUtil.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ConditionalExpression?.name) {
            left = SlimeCstToAstUtil.createConditionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalORExpression?.name) {
            left = SlimeCstToAstUtil.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalANDExpression?.name) {
            left = SlimeCstToAstUtil.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseORExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseXORExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseANDExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.EqualityExpression?.name) {
            left = SlimeCstToAstUtil.createEqualityExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.RelationalExpression?.name) {
            left = SlimeCstToAstUtil.createRelationalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ShiftExpression?.name) {
            left = SlimeCstToAstUtil.createShiftExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AdditiveExpression?.name) {
            left = SlimeCstToAstUtil.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MultiplicativeExpression?.name) {
            left = SlimeCstToAstUtil.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UnaryExpression?.name) {
            left = SlimeCstToAstUtil.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = SlimeCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = SlimeCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LeftHandSideExpression?.name) {
            left = SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.CallExpression?.name) {
            left = SlimeCstToAstUtil.createCallExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.NewExpression?.name) {
            left = SlimeCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = SlimeCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MemberExpression?.name) {
            left = SlimeCstToAstUtil.createMemberExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.PrimaryExpression?.name) {
            left = SlimeCstToAstUtil.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.YieldExpression?.name) {
            left = SlimeCstToAstUtil.createYieldExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AwaitExpression?.name) {
            left = SlimeCstToAstUtil.createAwaitExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.SuperProperty?.name) {
            left = SlimeCstToAstUtil.createSuperPropertyAst(cst)
        } else if (astName === SlimeParser.prototype.MetaProperty?.name) {
            left = SlimeCstToAstUtil.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            // ES2020: ShortCircuitExpression = LogicalORExpression | CoalesceExpression
            // ShortCircuitExpression: LogicalANDExpression ShortCircuitExpressionTail?
            left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            // 检查是否有 ShortCircuitExpressionTail (|| 运算�?
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    // 处理尾部：可能是 LogicalORExpressionTail �?CoalesceExpressionTail
                    left = SlimeCstToAstUtil.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            // ES2020: CoalesceExpression (处理 ?? 运算�?
            left = SlimeCstToAstUtil.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            // ES2016: ExponentiationExpression (处理 ** 运算�?
            left = SlimeCstToAstUtil.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            // ES2017+: Cover grammar for CallExpression and async arrow function
            // In non-async-arrow context, this is a CallExpression
            left = SlimeCstToAstUtil.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            // ES2020: Optional chaining (?.)
            left = SlimeCstToAstUtil.createOptionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = SlimeCstToAstUtil.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = SlimeCstToAstUtil.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            // ES2020: 动�?import()
            left = SlimeCstToAstUtil.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            // ES2022: PrivateIdentifier (e.g. #x in `#x in obj`)
            left = SlimeCstToAstUtil.createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }
}