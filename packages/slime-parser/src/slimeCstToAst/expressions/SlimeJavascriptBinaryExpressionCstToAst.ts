/**
 * BinaryExpressionCstToAst - 二元表达式转�?
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils, type SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    type SlimeJavascriptFunctionExpression, type SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier,
    SlimeJavascriptAstTypeName
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptBinaryExpressionCstToAstSingle {
    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a || b || c
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.LogicalExpression,
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

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a && b && c
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.LogicalExpression,
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

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a | b | c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.BinaryExpression,
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

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a ^ b ^ c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.BinaryExpression,
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

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a & b & c�?
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.BinaryExpression,
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


    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any  // ===, !==, ==, != 运算�?
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[2])

            return {
                type: SlimeAstTypeName.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }


    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.RelationalExpression?.name);
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
                    type: SlimeAstTypeName.BinaryExpression,
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


    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ShiftExpression?.name);
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
                    type: SlimeAstTypeName.BinaryExpression,
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


    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x + y + z => BinaryExpression(BinaryExpression(x, +, y), +, z)
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            // CST结构: [operand, operator, operand, operator, operand, ...]
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.BinaryExpression,
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

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：a * b * c => BinaryExpression(BinaryExpression(a, *, b), *, c)
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeAstTypeName.BinaryExpression,
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
     * MultiplicativeOperator CST �?AST
     * MultiplicativeOperator -> * | / | %
     */
    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * 创建 ExponentiationExpression AST（ES2016�?
     * 处理 ** 幂运算符
     */
    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        // ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，右结合：a ** b ** c = a ** (b ** c)
        const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        const operator = cst.children[1]  // ** token
        const right = SlimeCstToAstUtil.createExponentiationExpressionAst(cst.children[2])  // 递归处理右侧
        return {
            type: SlimeAstTypeName.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }


}

export const SlimeJavascriptBinaryExpressionCstToAst = new SlimeJavascriptBinaryExpressionCstToAstSingle()
