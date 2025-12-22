/**
 * BinaryExpressionCstToAst - 二元表达式转换
 */
import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement,
    SlimeExpression,
    type SlimeFunctionExpression, type SlimeFunctionParam,
    type SlimeIdentifier,
    SlimeNodeType
} from "slime-ast";
import { SlimeAstUtils } from "../SlimeAstUtils.ts";
import SlimeParser from "../../SlimeParser.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class BinaryExpressionCstToAst {
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



    /**
     * MultiplicativeOperator CST �?AST
     * MultiplicativeOperator -> * | / | %
     */
    static createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * AssignmentOperator CST �?AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    static createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    /**
     * 创建 ExponentiationExpression AST（ES2016�?
     * 处理 ** 幂运算符
     */
    static createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        // ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，右结合：a ** b ** c = a ** (b ** c)
        const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        const operator = cst.children[1]  // ** token
        const right = SlimeCstToAstUtil.createExponentiationExpressionAst(cst.children[2])  // 递归处理右侧
        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }


    static createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a || b || c
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a && b && c
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a | b | c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a ^ b ^ c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a & b & c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any  // ===, !==, ==, != 运算�?
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x < y < z => BinaryExpression(BinaryExpression(x, <, y), <, z)
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x << y << z => BinaryExpression(BinaryExpression(x, <<, y), <<, z)
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }


    /**
     * 创建 CoalesceExpression AST（ES2020�?
     * 处理 ?? 空值合并运算符
     */
    static createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
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
                type: SlimeNodeType.LogicalExpression,
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
    static createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
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
    static createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
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
    static createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
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
                    type: SlimeNodeType.LogicalExpression,
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
                    type: SlimeNodeType.LogicalExpression,
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
