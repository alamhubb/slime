/**
 * ExpressionCstToAst - 核心表达式转换（Expression 路由和操作符�?
 */
import {SubhutiCst} from "subhuti";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import {SlimeJavascriptCreateUtils, SlimeJavascriptExpression, SlimeJavascriptAstTypeName, SlimeJavascriptTokenCreateUtils} from "slime-ast";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptExpressionCstToAstSingle {
    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = SlimeCstToAstUtil.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = SlimeCstToAstUtil.createExpressionAstUncached(cst)
        SlimeCstToAstUtil.expressionAstCache.set(cst, result)
        return result
    }


    createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeJavascriptParser.prototype.Expression?.name) {
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
        } else if (astName === SlimeJavascriptParser.prototype.Statement?.name) {
            left = SlimeCstToAstUtil.createStatementAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
            left = SlimeCstToAstUtil.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ConditionalExpression?.name) {
            left = SlimeCstToAstUtil.createConditionalExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LogicalORExpression?.name) {
            left = SlimeCstToAstUtil.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LogicalANDExpression?.name) {
            left = SlimeCstToAstUtil.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseORExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseXORExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseANDExpression?.name) {
            left = SlimeCstToAstUtil.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.EqualityExpression?.name) {
            left = SlimeCstToAstUtil.createEqualityExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.RelationalExpression?.name) {
            left = SlimeCstToAstUtil.createRelationalExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ShiftExpression?.name) {
            left = SlimeCstToAstUtil.createShiftExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AdditiveExpression?.name) {
            left = SlimeCstToAstUtil.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MultiplicativeExpression?.name) {
            left = SlimeCstToAstUtil.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.UnaryExpression?.name) {
            left = SlimeCstToAstUtil.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = SlimeCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = SlimeCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LeftHandSideExpression?.name) {
            left = SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.CallExpression?.name) {
            left = SlimeCstToAstUtil.createCallExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.NewExpression?.name) {
            left = SlimeCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = SlimeCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MemberExpression?.name) {
            left = SlimeCstToAstUtil.createMemberExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.PrimaryExpression?.name) {
            left = SlimeCstToAstUtil.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.YieldExpression?.name) {
            left = SlimeCstToAstUtil.createYieldExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AwaitExpression?.name) {
            left = SlimeCstToAstUtil.createAwaitExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.SuperProperty?.name) {
            left = SlimeCstToAstUtil.createSuperPropertyAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MetaProperty?.name) {
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
        } else if (astName === SlimeJavascriptParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = SlimeCstToAstUtil.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = SlimeCstToAstUtil.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ImportCall?.name || astName === 'ImportCall') {
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


    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeJavascriptParser.prototype.ArrowFunction?.name) {
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

    /**
     * AssignmentOperator CST �?AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = SlimeCstToAstUtil.createExpressionAst(firstChild)
        let alternate
        let consequent

        // Token fields
        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        } else {
            // CST children: [LogicalORExpression, Question, AssignmentExpression, Colon, AssignmentExpression]
            const questionCst = cst.children[1]
            const colonCst = cst.children[3]

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeJavascriptTokenCreateUtils.createQuestionToken(questionCst.loc)
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeJavascriptTokenCreateUtils.createColonToken(colonCst.loc)
            }

            consequent = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[2])
            alternate = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[4])
        }

        return SlimeJavascriptCreateUtils.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }


    /**
     * 创建 CoalesceExpression AST（ES2020�?
     * 处理 ?? 空值合并运算符
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        // CoalesceExpression -> BitwiseORExpression ( ?? BitwiseORExpression )*
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达�?
        let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]  // ?? token
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeAstTypeName.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
    }


    /**
     * CoalesceExpressionHead CST �?AST
     * CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('CoalesceExpressionHead has no children')
    }


    /**
     * ShortCircuitExpression CST �?AST（透传�?
     * ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }

    /**
     * 处理 ShortCircuitExpressionTail (|| �??? 运算符的尾部)
     * CST 结构：ShortCircuitExpressionTail -> LogicalORExpressionTail | CoalesceExpressionTail
     * LogicalORExpressionTail -> LogicalOr LogicalANDExpression LogicalORExpressionTail?
     */
    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        const tailChildren = tailCst.children || []

        // 如果�?ShortCircuitExpressionTail，获取内部的 tail
        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0]
            return SlimeCstToAstUtil.createShortCircuitExpressionTailAst(left, innerTail)
        }

        // LogicalORExpressionTail: (LogicalOr LogicalANDExpression)+
        // 结构是平坦的：[LogicalOr, expr, LogicalOr, expr, ...]
        if (tailCst.name === 'LogicalORExpressionTail') {
            let result = left

            // 循环处理 (operator, operand) �?
            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '||'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = SlimeCstToAstUtil.createExpressionAst(rightCst)

                result = {
                    type: SlimeAstTypeName.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        // CoalesceExpressionTail: (?? BitwiseORExpression)+
        // 结构是平坦的：[??, expr, ??, expr, ...]
        if (tailCst.name === 'CoalesceExpressionTail') {
            let result = left

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '??'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = SlimeCstToAstUtil.createExpressionAst(rightCst)

                result = {
                    type: SlimeAstTypeName.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        // 未知�?tail 类型，返回左操作�?
        console.warn('Unknown ShortCircuitExpressionTail type:', tailCst.name)
        return left
    }



}

export const SlimeJavascriptExpressionCstToAst = new SlimeJavascriptExpressionCstToAstSingle()
