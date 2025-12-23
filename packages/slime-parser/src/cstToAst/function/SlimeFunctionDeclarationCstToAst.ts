import {SubhutiCst} from "subhuti";
import {
     type SlimeBlockStatement, type SlimeClassBody, type SlimeClassDeclaration,
    SlimeClassExpression, type SlimeExpression,
    type SlimeFunctionDeclaration,
    type SlimeFunctionParam,
    SlimeIdentifier, SlimeMethodDefinition, SlimeAstTypeName, SlimeStatement, SlimeTokenCreateUtils
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";

export class SlimeFunctionDeclarationCstToAstSingle {


    /**
     * 创建函数声明 AST
     * ES2025 FunctionDeclaration structure:
     * - function BindingIdentifier ( FormalParameters ) { FunctionBody }
     * Children: [FunctionTok, BindingIdentifier, LParen, FormalParameters, RParen, LBrace, FunctionBody, RBrace]
     */
    createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null
        let isAsync = false
        let isGenerator = false

        // Token fields
        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name
            const value = child.value || child.loc?.value

            // Collect tokens
            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreateUtils.createFunctionToken(child.loc)
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreateUtils.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreateUtils.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }

            // BindingIdentifier - function name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - function parameters (使用包装类型)
            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody - function body
            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeAstCreateUtils.createBlockStatement(statements, child.loc)
                continue
            }
        }

        // Create default empty body if not found
        if (!body) {
            body = SlimeAstCreateUtils.createBlockStatement([])
        }

        return SlimeAstCreateUtils.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // GeneratorDeclaration: function* name(params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([])
        }

        return {
            type: SlimeAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }


    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // AsyncFunctionDeclaration: async function name(params) { body }
        // CST children: [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        // 或者旧�? [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListAstWrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([])
        }

        return SlimeAstCreateUtils.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }


    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // AsyncGeneratorDeclaration: async function* name(params) { body }
        // CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([])
        }

        return {
            type: SlimeAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }





}

export const SlimeFunctionDeclarationCstToAst = new SlimeFunctionDeclarationCstToAstSingle()