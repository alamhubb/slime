import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils, type SlimeJavascriptBlockStatement, type SlimeJavascriptClassBody, type SlimeJavascriptClassDeclaration,
    SlimeJavascriptClassExpression, type SlimeJavascriptExpression,
    type SlimeJavascriptFunctionDeclaration,
    type SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, SlimeJavascriptMethodDefinition, SlimeJavascriptAstTypeName, SlimeJavascriptStatement, SlimeJavascriptTokenCreateUtils
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptFunctionDeclarationCstToAstSingle {


    /**
     * 创建函数声明 AST
     * ES2025 FunctionDeclaration structure:
     * - function BindingIdentifier ( FormalParameters ) { FunctionBody }
     * Children: [FunctionTok, BindingIdentifier, LParen, FormalParameters, RParen, LBrace, FunctionBody, RBrace]
     */
    createFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement | null = null
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
                functionToken = SlimeJavascriptTokenCreateUtils.createFunctionToken(child.loc)
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }

            // BindingIdentifier - function name
            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - function parameters (使用包装类型)
            if (name === SlimeJavascriptParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody - function body
            if (name === SlimeJavascriptParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeJavascriptCreateUtils.createBlockStatement(statements, child.loc)
                continue
            }
        }

        // Create default empty body if not found
        if (!body) {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return SlimeJavascriptCreateUtils.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        // GeneratorDeclaration: function* name(params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeJavascriptParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return {
            type: SlimeJavascriptAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeJavascriptFunctionDeclaration
    }


    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        // AsyncFunctionDeclaration: async function name(params) { body }
        // CST children: [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        // 或者旧�? [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListAstWrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeJavascriptParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return SlimeJavascriptCreateUtils.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }


    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        // AsyncGeneratorDeclaration: async function* name(params) { body }
        // CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeJavascriptParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return {
            type: SlimeJavascriptAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeJavascriptFunctionDeclaration
    }





}

export const SlimeJavascriptFunctionDeclarationCstToAst = new SlimeJavascriptFunctionDeclarationCstToAstSingle()