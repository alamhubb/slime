import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeNodeType } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 二元表达式 CST 到 AST 转换器
 * 
 * 负责处理：
 * - LogicalORExpression: || 逻辑或表达式
 * - LogicalANDExpression: && 逻辑与表达式
 * - BitwiseORExpression: | 位或表达式
 * - BitwiseXORExpression: ^ 位异或表达式
 * - BitwiseANDExpression: & 位与表达式
 * - EqualityExpression: ==, !=, ===, !== 相等表达式
 * - RelationalExpression: <, >, <=, >=, in, instanceof 关系表达式
 * - ShiftExpression: <<, >>, >>> 移位表达式
 * - AdditiveExpression: +, - 加减表达式
 * - MultiplicativeExpression: *, /, % 乘除表达式
 * - ExponentiationExpression: ** 幂运算表达式
 * - CoalesceExpression: ?? 空值合并表达式
 * - ShortCircuitExpression: 短路表达式
 */
export class BinaryExpressionCstToAst {

    /**
     * 创建 LogicalORExpression AST
     * 
     * 语法：LogicalORExpression -> LogicalANDExpression (|| LogicalANDExpression)*
     */
    static createLogicalORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 LogicalExpression
            // 支持多个运算符：a || b || c
            let left = util.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 LogicalANDExpression AST
     * 
     * 语法：LogicalANDExpression -> BitwiseORExpression (&& BitwiseORExpression)*
     */
    static createLogicalANDExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 LogicalExpression
            // 支持多个运算符：a && b && c
            let left = util.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }


    /**
     * 创建 BitwiseORExpression AST
     * 
     * 语法：BitwiseORExpression -> BitwiseXORExpression (| BitwiseXORExpression)*
     */
    static createBitwiseORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression（支持链式：a | b | c）
            let left = util.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 BitwiseXORExpression AST
     * 
     * 语法：BitwiseXORExpression -> BitwiseANDExpression (^ BitwiseANDExpression)*
     */
    static createBitwiseXORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression（支持链式：a ^ b ^ c）
            let left = util.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 BitwiseANDExpression AST
     * 
     * 语法：BitwiseANDExpression -> EqualityExpression (& EqualityExpression)*
     */
    static createBitwiseANDExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression（支持链式：a & b & c）
            let left = util.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 EqualityExpression AST
     * 
     * 语法：EqualityExpression -> RelationalExpression ((== | != | === | !==) RelationalExpression)*
     */
    static createEqualityExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression
            const left = util.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any  // ===, !==, ==, != 运算符
            const right = util.createExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return util.createExpressionAst(cst.children[0])
    }


    /**
     * 创建 RelationalExpression AST
     * 
     * 语法：RelationalExpression -> ShiftExpression ((<|>|<=|>=|instanceof|in) ShiftExpression)*
     */
    static createRelationalExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression
            // 支持多个运算符：x < y < z => BinaryExpression(BinaryExpression(x, <, y), <, z)
            let left = util.createExpressionAst(cst.children[0])

            // 循环处理剩余的 (operator, operand) 对
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 ShiftExpression AST
     * 
     * 语法：ShiftExpression -> AdditiveExpression ((<<|>>|>>>) AdditiveExpression)*
     */
    static createShiftExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression
            // 支持多个运算符：x << y << z => BinaryExpression(BinaryExpression(x, <<, y), <<, z)
            let left = util.createExpressionAst(cst.children[0])

            // 循环处理剩余的 (operator, operand) 对
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 AdditiveExpression AST
     * 
     * 语法：AdditiveExpression -> MultiplicativeExpression ((+|-) MultiplicativeExpression)*
     */
    static createAdditiveExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression
            // 支持多个运算符：x + y + z => BinaryExpression(BinaryExpression(x, +, y), +, z)
            let left = util.createExpressionAst(cst.children[0])

            // 循环处理剩余的 (operator, operand) 对
            // CST结构: [operand, operator, operand, operator, operand, ...]
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算符 - 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }


    /**
     * 创建 MultiplicativeExpression AST
     * 
     * 语法：MultiplicativeExpression -> ExponentiationExpression ((*|/|%) ExponentiationExpression)*
     */
    static createMultiplicativeExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创建 BinaryExpression
            // 支持多个运算符：a * b * c => BinaryExpression(BinaryExpression(a, *, b), *, c)
            let left = util.createExpressionAst(cst.children[0])

            // 循环处理剩余的 (operator, operand) 对
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算符 - 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = util.createExpressionAst(cst.children[i + 1])

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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 ExponentiationExpression AST（ES2016）
     * 处理 ** 幂运算符
     * 
     * 语法：ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
     * 注意：** 是右结合的，a ** b ** c = a ** (b ** c)
     */
    static createExponentiationExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        // ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
        if (cst.children.length === 1) {
            return util.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，右结合：a ** b ** c = a ** (b ** c)
        const left = util.createExpressionAst(cst.children[0])
        const operator = cst.children[1]  // ** token
        const right = BinaryExpressionCstToAst.createExponentiationExpressionAst(cst.children[2], util)  // 递归处理右侧
        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }

    /**
     * 创建 CoalesceExpression AST（ES2020）
     * 处理 ?? 空值合并运算符
     * 
     * 语法：CoalesceExpression -> BitwiseORExpression (?? BitwiseORExpression)*
     */
    static createCoalesceExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        // CoalesceExpression -> BitwiseORExpression ( ?? BitwiseORExpression )*
        if (cst.children.length === 1) {
            return util.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达式
        let left = util.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]  // ?? token
            const right = util.createExpressionAst(cst.children[i + 1])
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
     * 创建 CoalesceExpressionHead AST
     * 
     * 语法：CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    static createCoalesceExpressionHeadAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createExpressionAst(firstChild)
        }
        throw new Error('CoalesceExpressionHead has no children')
    }

    /**
     * 创建 ShortCircuitExpression AST（透传）
     * 
     * 语法：ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    static createShortCircuitExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }
}
