/**
 * UnaryExpressionCstToAst - 一�?更新表达式转�?
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils, type SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    type SlimeJavascriptFunctionExpression,
    type SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, SlimeJavascriptTokenCreateUtils
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptUnaryExpressionCstToAstSingle {

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.UnaryExpression?.name);

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
            type: SlimeAstTypeName.UnaryExpression,
            operator: operator,
            prefix: true,  // 前缀运算�?
            argument: argument,
            loc: cst.loc
        } as any
    }

    // Renamed from createPostfixExpressionAst - ES2025 uses UpdateExpression
    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
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
                    type: SlimeAstTypeName.UpdateExpression,
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
                        type: SlimeAstTypeName.UpdateExpression,
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

    createYieldExpressionAst(cst: SubhutiCst): any {
        // yield [*] AssignmentExpression?
        let yieldToken: any = undefined
        let asteriskToken: any = undefined
        let delegate = false
        let startIndex = 1

        // 提取 yield token
        if (cst.children[0] && (cst.children[0].name === 'Yield' || cst.children[0].value === 'yield')) {
            yieldToken = SlimeJavascriptTokenCreateUtils.createYieldToken(cst.children[0].loc)
        }

        if (cst.children[1] && cst.children[1].name === SlimeJavascriptTokenConsumer.prototype.Asterisk?.name) {
            asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(cst.children[1].loc)
            delegate = true
            startIndex = 2
        }
        let argument: any = null
        if (cst.children[startIndex]) {
            argument = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[startIndex])
        }

        return SlimeJavascriptCreateUtils.createYieldExpression(argument, delegate, cst.loc, yieldToken, asteriskToken)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        // await UnaryExpression
        SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined

        // 提取 await token
        if (cst.children[0] && (cst.children[0].name === 'Await' || cst.children[0].value === 'await')) {
            awaitToken = SlimeJavascriptTokenCreateUtils.createAwaitToken(cst.children[0].loc)
        }

        const argumentCst = cst.children[1]
        const argument = SlimeCstToAstUtil.createExpressionAst(argumentCst)

        return SlimeJavascriptCreateUtils.createAwaitExpression(argument, cst.loc, awaitToken)
    }


}


export const SlimeJavascriptUnaryExpressionCstToAst = new SlimeJavascriptUnaryExpressionCstToAstSingle()
