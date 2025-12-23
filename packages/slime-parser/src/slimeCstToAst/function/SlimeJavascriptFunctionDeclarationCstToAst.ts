import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    type SlimeJavascriptBlockStatement,
    type SlimeJavascriptClassBody,
    type SlimeJavascriptClassDeclaration,
    SlimeJavascriptClassExpression,
    type SlimeJavascriptExpression,
    type SlimeJavascriptFunctionDeclaration,
    type SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptAstTypeName,
    SlimeJavascriptStatement,
    SlimeJavascriptTokenCreateUtils,
    SlimeFunctionDeclaration, SlimeIdentifier, SlimeFunctionParam, SlimeBlockStatement, SlimeTokenCreateUtils,
    SlimeAstCreateUtils
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptFunctionDeclarationCstToAstSingle {


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


    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // GeneratorDeclaration: function* name(params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

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
            type: SlimeAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeJavascriptFunctionDeclaration
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


    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // AsyncGeneratorDeclaration: async function* name(params) { body }
        // CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

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
            type: SlimeAstTypeName.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeJavascriptFunctionDeclaration
    }

    /**
     * [TypeScript] 重写创建函数声明 AST 以支持返回类�?
     * ES2025 + TypeScript FunctionDeclaration structure:
     * - function BindingIdentifier ( FormalParameters ) : TSTypeAnnotation { FunctionBody }
     */
    override createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null
        let isAsync = false
        let isGenerator = false
        let returnType: any = undefined  // [TypeScript] 返回类型

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

            // [TypeScript] TSTypeAnnotation - return type
            if (name === 'TSTypeAnnotation') {
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
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

        const result = SlimeAstCreateUtils.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        ) as any

        // [TypeScript] 添加返回类型
        if (returnType) {
            result.returnType = returnType
        }

        return result
    }

    /**
     * [TypeScript] 重写创建 Generator 声明 AST 以支持返回类�?
     */
    override createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // 调用父类方法获取基础结果
        const result = super.createGeneratorDeclarationAst(cst) as any

        // [TypeScript] 检查是否有返回类型
        const children = cst.children || []
        for (const child of children) {
            if (child.name === 'TSTypeAnnotation') {
                result.returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
                break
            }
        }

        return result
    }

    /**
     * [TypeScript] 重写创建 Async 函数声明 AST 以支持返回类�?
     */
    override createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // 调用父类方法获取基础结果
        const result = super.createAsyncFunctionDeclarationAst(cst) as any

        // [TypeScript] 检查是否有返回类型
        const children = cst.children || []
        for (const child of children) {
            if (child.name === 'TSTypeAnnotation') {
                result.returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
                break
            }
        }

        return result
    }

    /**
     * [TypeScript] 重写创建 Async Generator 声明 AST 以支持返回类�?
     */
    override createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // 调用父类方法获取基础结果
        const result = super.createAsyncGeneratorDeclarationAst(cst) as any

        // [TypeScript] 检查是否有返回类型
        const children = cst.children || []
        for (const child of children) {
            if (child.name === 'TSTypeAnnotation') {
                result.returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
                break
            }
        }

        return result
    }



}

export const SlimeJavascriptFunctionDeclarationCstToAst = new SlimeJavascriptFunctionDeclarationCstToAstSingle()
