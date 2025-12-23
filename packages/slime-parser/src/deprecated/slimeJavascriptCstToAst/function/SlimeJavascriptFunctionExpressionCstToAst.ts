/**
 * FunctionExpressionCstToAst - 函数表达式转换
 */
import { SubhutiCst } from "subhuti";
import {
    SlimeJavascriptCreateUtils, SlimeJavascriptBlockStatement,
    SlimeJavascriptClassExpression,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, SlimeJavascriptTokenCreateUtils
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptFunctionExpressionCstToAstSingle {



    createFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.FunctionExpression?.name);
        // Es2025Parser FunctionExpression 结构

        let isAsync = false;
        let isGenerator = false;
        let functionId: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

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
                functionToken = SlimeJavascriptTokenCreateUtils.createFunctionToken(child.loc)
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

            // BindingIdentifier（命名函数表达式�?
            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionId = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - 使用包装类型
            if (name === SlimeJavascriptParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody
            if (name === SlimeJavascriptParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, child.loc)
                continue
            }
        }

        // 空函数体
        if (!body!) {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return SlimeJavascriptCreateUtils.createFunctionExpression(
            body, functionId, params, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }


    // 生成器表达式处理：function* (...) { ... }
    createGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        // GeneratorExpression: function* [name](params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeJavascriptCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeJavascriptParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        const func = SlimeJavascriptCreateUtils.createFunctionExpression(body, id, params, true, false, cst.loc)
        return func
    }

    // Async 函数表达式处理：async function (...) { ... }
    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        // AsyncFunctionExpression: async function [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeJavascriptCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeJavascriptParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        const func = SlimeJavascriptCreateUtils.createFunctionExpression(body, id, params, false, true, cst.loc)
        return func
    }

    // Async Generator 表达式处理：async function* (...) { ... }
    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        // AsyncGeneratorExpression: async function* [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeJavascriptIdentifier | null = null
        let params: SlimeJavascriptFunctionParam[] = []
        let body: SlimeJavascriptBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeJavascriptParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(formalParams)
            } else {
                params = SlimeJavascriptCstToAstUtil.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeJavascriptParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeJavascriptParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyNode)
            body = SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        const func = SlimeJavascriptCreateUtils.createFunctionExpression(body, id, params, true, true, cst.loc)
        return func
    }


}


export const SlimeJavascriptFunctionExpressionCstToAst = new SlimeJavascriptFunctionExpressionCstToAstSingle()
