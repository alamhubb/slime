/**
 * UnaryExpressionCstToAst - 一元/更新表达式转换
 */
import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier
} from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export class UnaryExpressionCstToAst {


    static createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        // 防御性检查：如果没有children，抛出更详细的错�?
        if (!cst.children || cst.children.length === 0) {
            console.error('UnaryExpression CST没有children:', JSON.stringify(cst, null, 2))
            throw new Error(`UnaryExpression CST没有children，可能是Parser生成的CST不完整`)
        }

        // 如果只有一个子节点，检查是否是表达式节点还是token
        if (cst.children.length === 1) {
            const child = cst.children[0]

            // 检查是否是token（token有value属性但没有children�?
            if (child.value !== undefined && !child.children) {
                // 这是一个token，说明Parser层生成的CST不完�?
                // UnaryExpression应该有运算符+操作数两个子节点，或者直接是PostfixExpression
                throw new Error(
                    `UnaryExpression CST不完整：只有运算符token '${child.name}' (${child.value})，缺少操作数。` +
                    `这是Parser层的问题，请检查Es2025Parser.UnaryExpression的Or分支逻辑。`
                )
            }

            // 是表达式节点，递归处理
            return SlimeCstToAstUtil.createExpressionAst(child)
        }

        // 如果有两个子节点，是一元运算符表达�?
        // children[0]: 运算�?token (!, +, -, ~, typeof, void, delete�?
        // children[1]: UnaryExpression（操作数�?
        const operatorToken = cst.children[0]
        const argumentCst = cst.children[1]

        // 获取运算符类�?
        const operatorMap: { [key: string]: string } = {
            'Exclamation': '!',
            'Plus': '+',
            'Minus': '-',
            'Tilde': '~',
            'Typeof': 'typeof',
            'Void': 'void',
            'Delete': 'delete',
            'PlusPlus': '++',
            'MinusMinus': '--',
        }

        const operator = operatorMap[operatorToken.name] || operatorToken.value

        // 递归处理操作�?
        const argument = SlimeCstToAstUtil.createExpressionAst(argumentCst)

        // 创建 UnaryExpression AST
        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,  // 前缀运算�?
            argument: argument,
            loc: cst.loc
        } as any
    }

    // Renamed from createPostfixExpressionAst - ES2025 uses UpdateExpression
    static createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        // Support both PostfixExpression (old) and UpdateExpression (new)
        if (cst.children.length > 1) {
            // UpdateExpression: argument ++ | argument -- | ++argument | --argument
            // Check if prefix or postfix
            const first = cst.children[0]
            const isPrefix = first.loc?.type === 'PlusPlus' || first.loc?.type === 'MinusMinus' ||
                first.value === '++' || first.value === '--'

            if (isPrefix) {
                // Prefix: ++argument or --argument
                const operator = first.value || first.loc?.value
                const argument = SlimeCstToAstUtil.createExpressionAst(cst.children[1])
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any
            } else {
                // Postfix: argument++ or argument--
                const argument = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
                let operator: string | undefined
                for (let i = 1; i < cst.children.length; i++) {
                    const child = cst.children[i]
                    if (child.loc?.type === 'PlusPlus' || child.loc?.type === 'MinusMinus' ||
                        child.value === '++' || child.value === '--') {
                        operator = child.value || child.loc?.value
                        break
                    }
                }
                if (operator) {
                    return {
                        type: SlimeNodeType.UpdateExpression,
                        operator: operator,
                        argument: argument,
                        prefix: false,
                        loc: cst.loc
                    } as any
                }
            }
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

    static createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);
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

    static createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);
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

}
