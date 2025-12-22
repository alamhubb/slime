import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeBlockStatement, SlimeFunctionExpression, SlimeFunctionDeclaration, SlimeIdentifier, SlimeFunctionParam, SlimeStatement, SlimePattern, SlimeRestElement } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 函数表达式 CST 到 AST 转换器
 * 
 * 负责处理：
 * - FunctionDeclaration: 函数声明
 * - FunctionExpression: 函数表达式
 * - FunctionBody: 函数体
 * - FunctionStatementList: 函数语句列表
 * - AsyncFunctionDeclaration: 异步函数声明
 * - AsyncFunctionExpression: 异步函数表达式
 * - AsyncFunctionBody: 异步函数体
 * - GeneratorDeclaration: 生成器声明
 * - GeneratorExpression: 生成器表达式
 * - GeneratorBody: 生成器体
 * - AsyncGeneratorDeclaration: 异步生成器声明
 * - AsyncGeneratorExpression: 异步生成器表达式
 * - AsyncGeneratorBody: 异步生成器体
 */
export class FunctionExpressionCstToAst {

    /**
     * 创建 FunctionExpression AST
     */
    static createFunctionExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeFunctionExpression {
        checkCstName(cst, SlimeParser.prototype.FunctionExpression?.name);

        let isAsync = false;
        let isGenerator = false;
        let functionId: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

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

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionId = util.createBindingIdentifierAst(child)
                continue
            }

            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = util.createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const bodyStatements = this.createFunctionBodyAst(child, util)
                body = SlimeAstUtil.createBlockStatement(bodyStatements, child.loc)
                continue
            }
        }

        if (!body!) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionExpression(
            body, functionId, params, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    /**
     * 创建 FunctionBody AST
     */
    static createFunctionBodyAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const children = cst.children || []

        if (children.length === 0) {
            return []
        }

        const first = children[0]
        if (!first) {
            return []
        }

        const name = first.name

        if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
            return this.createFunctionBodyAst(first, util)
        }

        if (name === 'FunctionStatementList' || name === SlimeParser.prototype.FunctionStatementList?.name) {
            return this.createFunctionStatementListAst(first, util)
        }

        if (name === 'StatementList' || name === SlimeParser.prototype.StatementList?.name) {
            return util.createStatementListAst(first)
        }

        return util.createStatementListAst(first)
    }

    /**
     * 创建 FunctionStatementList AST
     */
    static createFunctionStatementListAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const children = cst.children || []

        if (children.length === 0) {
            return []
        }

        const first = children[0]
        if (!first) {
            return []
        }

        if (first.name === 'StatementList' || first.name === SlimeParser.prototype.StatementList?.name) {
            return util.createStatementListAst(first)
        }

        return util.createStatementListItemAst(first)
    }

    /**
     * 创建 AsyncFunctionBody AST（透传）
     */
    static createAsyncFunctionBodyAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createFunctionBodyAst(firstChild, util)
        }
        return []
    }

    /**
     * 创建 GeneratorBody AST（透传）
     */
    static createGeneratorBodyAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createFunctionBodyAst(firstChild, util)
        }
        return []
    }

    /**
     * 创建 AsyncGeneratorBody AST（透传）
     */
    static createAsyncGeneratorBodyAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeStatement> {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createFunctionBodyAst(firstChild, util)
        }
        return []
    }

    /**
     * 创建 GeneratorDeclaration AST
     */
    static createGeneratorDeclarationAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = util.createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = util.createFormalParametersAstWrapped(formalParams)
            } else {
                params = util.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode, util)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

    /**
     * 创建 AsyncFunctionDeclaration AST
     */
    static createAsyncFunctionDeclarationAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = util.createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = util.createFormalParametersAstWrapped(formalParams)
            } else {
                params = util.createFormalParameterListAstWrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode, util)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }

    /**
     * 创建 AsyncGeneratorDeclaration AST
     */
    static createAsyncGeneratorDeclarationAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = util.createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = util.createFormalParametersAstWrapped(formalParams)
            } else {
                params = util.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode, util)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }
}
