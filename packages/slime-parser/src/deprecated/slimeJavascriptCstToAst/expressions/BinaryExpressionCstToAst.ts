/**
 * BinaryExpressionCstToAst - 二元表达式转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstUtil, type SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    type SlimeJavascriptFunctionExpression, type SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier,
    SlimeJavascriptAstTypeName
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

export class BinaryExpressionCstToAst {
    static createLogicalORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a || b || c
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createLogicalANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a && b && c
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a | b | c�?
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a ^ b ^ c�?
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a & b & c�?
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }


    static createEqualityExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            const left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any  // ===, !==, ==, != 运算�?
            const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[2])

            return {
                type: SlimeJavascriptAstTypeName.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }


    static createRelationalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x < y < z => BinaryExpression(BinaryExpression(x, <, y), <, z)
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }


    static createShiftExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x << y << z => BinaryExpression(BinaryExpression(x, <<, y), <<, z)
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }


    static createAdditiveExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x + y + z => BinaryExpression(BinaryExpression(x, +, y), +, z)
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            // CST结构: [operand, operator, operand, operator, operand, ...]
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }

            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：a * b * c => BinaryExpression(BinaryExpression(a, *, b), *, c)
            let left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeJavascriptAstTypeName.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }

            return left
        }
        return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
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
     * 创建 ExponentiationExpression AST（ES2016�?
     * 处理 ** 幂运算符
     */
    static createExponentiationExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        // ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
        if (cst.children.length === 1) {
            return SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，右结合：a ** b ** c = a ** (b ** c)
        const left = SlimeJavascriptCstToAstUtil.createExpressionAst(cst.children[0])
        const operator = cst.children[1]  // ** token
        const right = SlimeJavascriptCstToAstUtil.createExponentiationExpressionAst(cst.children[2])  // 递归处理右侧
        return {
            type: SlimeJavascriptAstTypeName.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }


}
