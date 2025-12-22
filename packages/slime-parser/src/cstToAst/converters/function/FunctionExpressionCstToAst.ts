/**
 * FunctionExpressionCstToAst - 函数表达式转换
 */

export class FunctionExpressionCstToAst {



    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.FunctionExpression?.name);
        // Es2025Parser FunctionExpression 结构

        let isAsync = false;
        let isGenerator = false;
        let functionId: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // Token fields
        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                continue
            }

            // BindingIdentifier（命名函数表达式�?
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionId = this.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - 使用包装类型
            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = this.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody
            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const bodyStatements = this.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(bodyStatements, child.loc)
                continue
            }
        }

        // 空函数体
        if (!body!) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionExpression(
            body, functionId, params, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }
}
