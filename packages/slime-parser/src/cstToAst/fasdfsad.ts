export default class OtherNot{

    /**
     * AsyncConciseBody CST �?AST
     */
    static createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return SlimeCstToAstUtil.createConciseBodyAst(cst)
    }

    /**
     * 在Expression中查找第一个Identifier（辅助方法）
     */
    static findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = SlimeCstToAstUtil.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

    /**
     * 从Expression中提取箭头函数参�?
     * 处理逗号表达�?(a, b) 或单个参�?(x)
     */
    static extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        // Expression可能是：
        // 1. 单个Identifier: x
        // 2. 逗号表达�? a, b �?a, b, c
        // 3. 赋值表达式（默认参数）: a = 1

        // 检查是否是AssignmentExpression
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = SlimeCstToAstUtil.createAssignmentExpressionAst(expressionCst)
            // 如果是简单的identifier，返回它
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any]
            }
            // 如果是赋值（默认参数），返回AssignmentPattern
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        // 如果是Expression，检查children
        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = []

            // 遍历children，查找所有AssignmentExpression（用逗号分隔�?
            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                    // 转换为参�?
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        // 默认参数
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        // 对象解构参数�?{ a, b }) => ...
                        // 需要将 ObjectExpression 转换�?ObjectPattern
                        params.push(SlimeCstToAstUtil.convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        // 数组解构参数�?[a, b]) => ...
                        // 需要将 ArrayExpression 转换�?ArrayPattern
                        params.push(SlimeCstToAstUtil.convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        // 其他复杂情况，尝试提取identifier
                        const identifier = SlimeCstToAstUtil.findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(SlimeCstToAstUtil.createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        // 回退：尝试查找第一个identifier
        const identifierCst = SlimeCstToAstUtil.findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [SlimeCstToAstUtil.createIdentifierAst(identifierCst) as any]
        }

        return []
    }

    /**
     * 创建箭头函数�?AST
     */
    static createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        // 防御性检�?
        if (!cst) {
            throw new Error('createConciseBodyAst: cst is null or undefined')
        }

        // 支持 ConciseBody �?AsyncConciseBody
        const validNames = [
            SlimeParser.prototype.ConciseBody?.name,
            'ConciseBody',
            'AsyncConciseBody'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`createConciseBodyAst: 期望 ConciseBody �?AsyncConciseBody，实�?${cst.name}`)
        }

        const first = cst.children[0]

        // Es2025Parser: { FunctionBody } 格式
        // children: [LBrace, FunctionBody/AsyncFunctionBody, RBrace]
        if (first.name === 'LBrace') {
            // 找到 FunctionBody �?AsyncFunctionBody
            const functionBodyCst = cst.children.find(child =>
                child.name === 'FunctionBody' || child.name === SlimeParser.prototype.FunctionBody?.name ||
                child.name === 'AsyncFunctionBody' || child.name === SlimeParser.prototype.AsyncFunctionBody?.name
            )
            if (functionBodyCst) {
                const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(functionBodyCst)
                return SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc)
            }
            // 空函数体
            return SlimeAstUtil.createBlockStatement([], cst.loc)
        }

        // 否则是表达式，解析为表达�?
        if (first.name === SlimeParser.prototype.AssignmentExpression?.name || first.name === 'AssignmentExpression') {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first)
        }

        // Es2025Parser: ExpressionBody 类型
        if (first.name === 'ExpressionBody') {
            // ExpressionBody 内部包含 AssignmentExpression
            const innerExpr = first.children[0]
            if (innerExpr) {
                if (innerExpr.name === 'AssignmentExpression' || innerExpr.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    return SlimeCstToAstUtil.createAssignmentExpressionAst(innerExpr)
                }
                return SlimeCstToAstUtil.createExpressionAst(innerExpr)
            }
        }

        return SlimeCstToAstUtil.createExpressionAst(first)
    }









    /**
     * [内部方法] generator 方法
     * 处理 ES2025 Parser 的 * ClassElementName ( UniqueFormalParameters ) { GeneratorBody } 结构
     * @internal
     */
    static createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // GeneratorMethod children: [Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, GeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // GeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)

        return methodDef
    }


    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser 的 async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    static createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncMethod children: [AsyncTok, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncFunctionBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)

        return methodDef
    }


    /**
     * [内部方法] async generator 方法
     * 处理 ES2025 Parser 的 async * ClassElementName ( ... ) { AsyncGeneratorBody } 结构
     * @internal
     */
    static createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncGeneratorMethod children: [AsyncTok, Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = SlimeCstToAstUtil.createClassElementNameAst(classElementNameCst)
        const isComputed = SlimeCstToAstUtil.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = SlimeCstToAstUtil.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncGeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, SlimeCstToAstUtil.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)

        return methodDef
    }


}