import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils, type SlimeBlockStatement, type SlimeClassBody, type SlimeClassDeclaration,
    SlimeClassExpression, type SlimeExpression,
    type SlimeFunctionDeclaration,
    type SlimeFunctionParam,
    SlimeIdentifier, SlimeMethodDefinition, SlimeAstTypeName, SlimeStatement, SlimeTokenCreateUtils
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptFunctionDeclarationCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";
import {SlimeIdentifierCstToAst} from "../identifier/SlimeIdentifierCstToAst.ts";

export class SlimeFunctionDeclarationCstToAstSingle extends SlimeJavascriptFunctionDeclarationCstToAstSingle{

    /**
     * [TypeScript] 重写创建函数声明 AST 以支持返回类型
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
     * [TypeScript] 重写创建 Generator 声明 AST 以支持返回类型
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
     * [TypeScript] 重写创建 Async 函数声明 AST 以支持返回类型
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
     * [TypeScript] 重写创建 Async Generator 声明 AST 以支持返回类型
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

export const SlimeFunctionDeclarationCstToAst = new SlimeFunctionDeclarationCstToAstSingle()