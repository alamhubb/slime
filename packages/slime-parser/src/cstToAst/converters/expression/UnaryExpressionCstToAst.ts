import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * 一元表达式 CST 到 AST 转换器
 * 
 * 负责处理：
 * - UnaryExpression: 一元运算符表达式 (!, +, -, ~, typeof, void, delete)
 * - UpdateExpression: 更新表达式 (++, --)
 * - AwaitExpression: await 表达式
 * - YieldExpression: yield 表达式
 */
export class UnaryExpressionCstToAst {

    /**
     * 创建 UnaryExpression AST
     * 
     * 语法：UnaryExpression -> UpdateExpression | (delete | void | typeof | + | - | ~ | !) UnaryExpression
     */
    static createUnaryExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        // 防御性检查：如果没有children，抛出更详细的错误
        if (!cst.children || cst.children.length === 0) {
            console.error('UnaryExpression CST没有children:', JSON.stringify(cst, null, 2))
            throw new Error(`UnaryExpression CST没有children，可能是Parser生成的CST不完整`)
        }

        // 如果只有一个子节点，检查是否是表达式节点还是token
        if (cst.children.length === 1) {
            const child = cst.children[0]

            // 检查是否是token（token有value属性但没有children）
            if (child.value !== undefined && !child.children) {
                // 这是一个token，说明Parser层生成的CST不完整
                throw new Error(
                    `UnaryExpression CST不完整：只有运算符token '${child.name}' (${child.value})，缺少操作数。` +
                    `这是Parser层的问题，请检查Es2025Parser.UnaryExpression的Or分支逻辑。`
                )
            }

            // 是表达式节点，递归处理
            return util.createExpressionAst(child)
        }

        // 如果有两个子节点，是一元运算符表达式
        // children[0]: 运算符 token (!, +, -, ~, typeof, void, delete)
        // children[1]: UnaryExpression（操作数）
        const operatorToken = cst.children[0]
        const argumentCst = cst.children[1]

        // 获取运算符类型
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

        // 递归处理操作数
        const argument = util.createExpressionAst(argumentCst)

        // 创建 UnaryExpression AST
        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,  // 前缀运算符
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 UpdateExpression AST
     * 
     * 语法：UpdateExpression -> LeftHandSideExpression (++ | --) | (++ | --) UnaryExpression
     */
    static createUpdateExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
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
                const argument = util.createExpressionAst(cst.children[1])
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any
            } else {
                // Postfix: argument++ or argument--
                const argument = util.createExpressionAst(cst.children[0])
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
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 YieldExpression AST
     * 
     * 语法：YieldExpression -> yield | yield AssignmentExpression | yield * AssignmentExpression
     */
    static createYieldExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        // yield [*] AssignmentExpression?
        let yieldToken: any = undefined
        let asteriskToken: any = undefined
        let delegate = false
        let startIndex = 1

        // 提取 yield token
        if (cst.children[0] && (cst.children[0].name === 'Yield' || cst.children[0].value === 'yield')) {
            yieldToken = SlimeTokenCreate.createYieldToken(cst.children[0].loc)
        }

        if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.Asterisk?.name) {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(cst.children[1].loc)
            delegate = true
            startIndex = 2
        }
        let argument: any = null
        if (cst.children[startIndex]) {
            argument = util.createAssignmentExpressionAst(cst.children[startIndex])
        }

        return SlimeAstUtil.createYieldExpression(argument, delegate, cst.loc, yieldToken, asteriskToken)
    }

    /**
     * 创建 AwaitExpression AST
     * 
     * 语法：AwaitExpression -> await UnaryExpression
     */
    static createAwaitExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        // await UnaryExpression
        checkCstName(cst, SlimeParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined

        // 提取 await token
        if (cst.children[0] && (cst.children[0].name === 'Await' || cst.children[0].value === 'await')) {
            awaitToken = SlimeTokenCreate.createAwaitToken(cst.children[0].loc)
        }

        const argumentCst = cst.children[1]
        const argument = util.createExpressionAst(argumentCst)

        return SlimeAstUtil.createAwaitExpression(argument, cst.loc, awaitToken)
    }
}
