/**
 * ExpressionCstToAst - 核心表达式转换（Expression 路由和操作符）
 */
import {SubhutiCst} from "subhuti";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import {SlimeJavascriptCreateUtils, SlimeJavascriptExpression, SlimeJavascriptAstTypeName, SlimeJavascriptTokenCreateUtils} from "slime-ast";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptExpressionCstToAstSingle {
    createExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const cached = SlimeJavascriptCstToAstUtil.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = SlimeJavascriptCstToAstUtil.createExpressionAstUncached(cst)
        SlimeJavascriptCstToAstUtil.expressionAstCache.set(cst, result)
        return result
    }


    createExpressionAstUncached(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = cst.name
        let left
        if (astName === SlimeJavascriptParser.prototype.Expression?.name) {
            // Expression 可能是逗号表达�?(SequenceExpression)
            // 结构: Expression -> AssignmentExpression | Expression, AssignmentExpression
            // 收集所有表达式
            const expressions: SlimeJavascriptExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    // 跳过逗号 token
                    continue
                }
                expressions.push(SlimeJavascriptCstToAstUtil.createExpressionAst(child))
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
            left = SlimeJavascriptCstToAstUtil.createStatementAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ConditionalExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createConditionalExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LogicalORExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LogicalANDExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseORExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseXORExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.BitwiseANDExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.EqualityExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createEqualityExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.RelationalExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createRelationalExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ShiftExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createShiftExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AdditiveExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MultiplicativeExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.UnaryExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = SlimeJavascriptCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = SlimeJavascriptCstToAstUtil.createUpdateExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.LeftHandSideExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.CallExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createCallExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.NewExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = SlimeJavascriptCstToAstUtil.createNewExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MemberExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createMemberExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.PrimaryExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.YieldExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createYieldExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.AwaitExpression?.name) {
            left = SlimeJavascriptCstToAstUtil.createAwaitExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.SuperProperty?.name) {
            left = SlimeJavascriptCstToAstUtil.createSuperPropertyAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.MetaProperty?.name) {
            left = SlimeJavascriptCstToAstUtil.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            // ES2020: ShortCircuitExpression = LogicalORExpression | CoalesceExpression
            // ShortCircuitExpression: LogicalANDExpression ShortCircuitExpressionTail?
            left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            // 检查是否有 ShortCircuitExpressionTail (|| 运算�?
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    // 处理尾部：可能是 LogicalORExpressionTail �?CoalesceExpressionTail
                    left = SlimeJavascriptCstToAstUtil.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            // ES2020: CoalesceExpression (处理 ?? 运算�?
            left = SlimeJavascriptCstToAstUtil.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            // ES2016: ExponentiationExpression (处理 ** 运算�?
            left = SlimeJavascriptCstToAstUtil.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            // ES2017+: Cover grammar for CallExpression and async arrow function
            // In non-async-arrow context, this is a CallExpression
            left = SlimeJavascriptCstToAstUtil.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            // ES2020: Optional chaining (?.)
            left = SlimeJavascriptCstToAstUtil.createOptionalExpressionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = SlimeJavascriptCstToAstUtil.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = SlimeJavascriptCstToAstUtil.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeJavascriptParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            // ES2020: 动�?import()
            left = SlimeJavascriptCstToAstUtil.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            // ES2022: PrivateIdentifier (e.g. #x in `#x in obj`)
            left = SlimeJavascriptCstToAstUtil.createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }


    createAssignmentExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeJavascriptParser.prototype.ArrowFunction?.name) {
                return SlimeJavascriptCstToAstUtil.createArrowFunctionAst(child)
            }
            // 否则作为表达式处�?
            return SlimeJavascriptCstToAstUtil.createExpressionAst(child)
        }

        // AssignmentExpression -> LeftHandSideExpression + Eq + AssignmentExpression
        // �?LeftHandSideExpression + AssignmentOperator + AssignmentExpression
        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = SlimeJavascriptCstToAstUtil.createExpressionAst(leftCst)
        const right = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(rightCst)
        // AssignmentOperator节点下有子节�?PlusEq/MinusEq�?，需要从children[0].value获取
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: SlimeJavascriptAssignmentExpression = {
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

    createConditionalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = SlimeJavascriptCstToAstUtil.createExpressionAst(firstChild)
        let alternate
        let consequent

        // Token fields
        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
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

            consequent = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(cst.children[2])
            alternate = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(cst.children[4])
        }

        return SlimeJavascriptCreateUtils.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }


    /**
     * 创建 CoalesceExpression AST（ES2020�?
     * 处理 ?? 空值合并运算符
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        // CoalesceExpression -> BitwiseORExpression ( ?? BitwiseORExpression )*
        if (cst.children.length === 1) {
            return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达�?
        let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]  // ?? token
            const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeJavascriptAstTypeName.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
    }


    /**
     * CoalesceExpressionHead CST 转 AST
     * CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeJavascriptCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('CoalesceExpressionHead has no children')
    }


    /**
     * ShortCircuitExpression CST �?AST（透传�?
     * ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeJavascriptCstToAstUtil.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }

    /**
     * 处理 ShortCircuitExpressionTail (|| �??? 运算符的尾部)
     * CST 结构：ShortCircuitExpressionTail -> LogicalORExpressionTail | CoalesceExpressionTail
     * LogicalORExpressionTail -> LogicalOr LogicalANDExpression LogicalORExpressionTail?
     */
    createShortCircuitExpressionTailAst(left: SlimeJavascriptExpression, tailCst: SubhutiCst): SlimeJavascriptExpression {
        const tailChildren = tailCst.children || []

        // 如果�?ShortCircuitExpressionTail，获取内部的 tail
        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0]
            return SlimeJavascriptCstToAstUtil.createShortCircuitExpressionTailAst(left, innerTail)
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

                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(rightCst)

                result = {
                    type: SlimeJavascriptAstTypeName.LogicalExpression,
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

                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(rightCst)

                result = {
                    type: SlimeJavascriptAstTypeName.LogicalExpression,
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
