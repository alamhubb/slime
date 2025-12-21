import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeBlockStatement, SlimeArrowFunctionExpression, SlimeExpression, SlimePattern, SlimeFunctionParam } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 箭头函数 CST 到 AST 转换器
 * 
 * 负责处理：
 * - ArrowFunction: 箭头函数
 * - ArrowParameters: 箭头函数参数
 * - ArrowFormalParameters: 箭头函数形式参数
 * - ConciseBody: 简洁函数体
 * - AsyncArrowFunction: 异步箭头函数
 * - AsyncArrowHead: 异步箭头头部
 * - AsyncArrowBindingIdentifier: 异步箭头绑定标识符
 * - AsyncConciseBody: 异步简洁函数体
 */
export class ArrowFunctionCstToAst {

    /**
     * 创建箭头函数 AST
     */
    static createArrowFunctionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeArrowFunctionExpression {
        checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);

        let asyncToken: any = undefined
        let arrowToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        const commaTokens: any[] = []

        let offset = 0;
        let isAsync = false;
        if (cst.children[0] && cst.children[0].name === 'Async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(cst.children[0].loc)
            isAsync = true;
            offset = 1;
        }

        if (!cst.children || cst.children.length < 3 + offset) {
            throw new Error(`createArrowFunctionAst: 期望${3 + offset}个children，实际${cst.children?.length || 0}个`)
        }

        const arrowParametersCst = cst.children[0 + offset]
        const arrowCst = cst.children[1 + offset]
        const conciseBodyCst = cst.children[2 + offset]

        if (arrowCst && (arrowCst.name === 'Arrow' || arrowCst.value === '=>')) {
            arrowToken = SlimeTokenCreate.createArrowToken(arrowCst.loc)
        }

        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            params = [{ param: util.createBindingIdentifierAst(arrowParametersCst) }]
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                }
            }
            const rawParams = util.createArrowParametersFromCoverGrammar(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }))
        } else if (arrowParametersCst.name === SlimeParser.prototype.ArrowParameters?.name) {
            const firstChild = arrowParametersCst.children?.[0]
            if (firstChild?.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
                for (const child of firstChild.children || []) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                    }
                }
            }
            const rawParams = this.createArrowParametersAst(arrowParametersCst, util)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        const body = this.createConciseBodyAst(conciseBodyCst, util)

        return SlimeAstUtil.createArrowFunctionExpression(
            body, params, body.type !== SlimeNodeType.BlockStatement, isAsync, cst.loc,
            arrowToken, asyncToken, lParenToken, rParenToken
        )
    }


    /**
     * 创建 ArrowParameters AST
     */
    static createArrowParametersAst(cst: SubhutiCst, util: SlimeCstToAst): SlimePattern[] {
        const firstChild = cst.children?.[0]
        if (!firstChild) return []

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return [util.createBindingIdentifierAst(firstChild)]
        }

        if (firstChild.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return util.createArrowParametersFromCoverGrammar(firstChild)
        }

        return []
    }

    /**
     * 创建 ArrowFormalParameters AST
     */
    static createArrowFormalParametersAst(cst: SubhutiCst, util: SlimeCstToAst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LParen' || child.value === '(' ||
                child.name === 'RParen' || child.value === ')' ||
                child.name === 'Comma' || child.value === ',') {
                continue
            }

            if (child.name === SlimeParser.prototype.UniqueFormalParameters?.name || child.name === 'UniqueFormalParameters') {
                return util.createFormalParametersAst(child.children?.[0] || child)
            }

            if (child.name === SlimeParser.prototype.FormalParameters?.name || child.name === 'FormalParameters') {
                return util.createFormalParametersAst(child)
            }

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params.push(util.createBindingIdentifierAst(child))
            }
        }

        return params
    }

    /**
     * 创建 ConciseBody AST
     */
    static createConciseBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression | SlimeBlockStatement {
        const firstChild = cst.children?.[0]
        if (!firstChild) {
            return SlimeAstUtil.createBlockStatement([])
        }

        if (firstChild.name === SlimeParser.prototype.ExpressionBody?.name || firstChild.name === 'ExpressionBody') {
            const exprChild = firstChild.children?.[0]
            if (exprChild) {
                return util.createExpressionAst(exprChild)
            }
        }

        if (firstChild.name === SlimeParser.prototype.FunctionBody?.name || firstChild.name === 'FunctionBody') {
            const statements = util.createFunctionBodyAst(firstChild)
            return SlimeAstUtil.createBlockStatement(statements, firstChild.loc)
        }

        if (firstChild.name === 'LBrace' || firstChild.value === '{') {
            const bodyChild = cst.children?.find(ch =>
                ch.name === SlimeParser.prototype.FunctionBody?.name || ch.name === 'FunctionBody'
            )
            if (bodyChild) {
                const statements = util.createFunctionBodyAst(bodyChild)
                return SlimeAstUtil.createBlockStatement(statements, cst.loc)
            }
            return SlimeAstUtil.createBlockStatement([])
        }

        return util.createExpressionAst(firstChild)
    }

    /**
     * 创建 AsyncConciseBody AST（透传）
     */
    static createAsyncConciseBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression | SlimeBlockStatement {
        return this.createConciseBodyAst(cst, util)
    }
}
