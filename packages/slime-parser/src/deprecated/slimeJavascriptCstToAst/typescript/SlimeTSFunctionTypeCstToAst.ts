import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeAstTypeName, type SlimeBlockStatement, type SlimeFunctionDeclaration,
    type SlimeFunctionParam, SlimeIdentifier, SlimeJavascriptAstTypeName, SlimeTokenCreateUtils
} from "slime-ast";

export default class SlimeTSFunctionTypeCstToAst{

    /**
     * [TypeScript] 转换 TSFunctionType CST 为 AST
     */
    createTSFunctionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let typeParameters: any = undefined
        let parameters: any[] = []
        let returnType: any = undefined

        for (const child of children) {
            if (child.name === 'TSTypeParameterDeclaration') {
                typeParameters = this.createTSTypeParameterDeclarationAst(child)
            } else if (child.name === 'TSParameterList') {
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSType') {
                returnType = this.createTSTypeAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSFunctionType,
            typeParameters,
            parameters,
            returnType,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSConstructorType CST 为 AST
     */
    createTSConstructorTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let typeParameters: any = undefined
        let parameters: any[] = []
        let returnType: any = undefined

        for (const child of children) {
            if (child.name === 'TSTypeParameterDeclaration') {
                typeParameters = this.createTSTypeParameterDeclarationAst(child)
            } else if (child.name === 'TSParameterList') {
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSType') {
                returnType = this.createTSTypeAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSConstructorType,
            typeParameters,
            parameters,
            returnType,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSParameterList CST 为 AST
     */
    createTSParameterListAst(cst: SubhutiCst): any[] {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSParameter') {
                params.push(this.createTSParameterAst(child))
            }
        }

        return params
    }



    /**
     * [TypeScript] 转换 TSParameter CST 为 AST
     */
    createTSParameterAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let name: any = undefined
        let typeAnnotation: any = undefined
        let optional = false
        let rest = false

        for (const child of children) {
            if (child.name === 'Ellipsis' || child.value === '...') {
                rest = true
            } else if (child.name === 'BindingIdentifier' || child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0]?.children?.[0] || child.children?.[0] || child
                name = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        if (rest) {
            return {
                type: 'RestElement',
                argument: name,
                typeAnnotation,
                loc: cst.loc,
            }
        }

        return {
            type: 'Identifier',
            ...name,
            typeAnnotation,
            optional,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeParameterDeclaration CST 为 AST
     */
    createTSTypeParameterDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSTypeParameter') {
                params.push(this.createTSTypeParameterAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSTypeParameterDeclaration,
            params,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypeParameter CST 为 AST
     */
    createTSTypeParameterAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let name: any = undefined
        let constraint: any = undefined
        let defaultType: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                name = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'Extends' || child.value === 'extends') {
                // 下一个是约束类型
                if (children[i + 1]?.name === 'TSType') {
                    constraint = this.createTSTypeAst(children[i + 1])
                }
            } else if (child.name === 'Assign' || child.value === '=') {
                // 下一个是默认类型
                if (children[i + 1]?.name === 'TSType') {
                    defaultType = this.createTSTypeAst(children[i + 1])
                }
            }
        }

        return {
            type: SlimeAstTypeName.TSTypeParameter,
            name,
            constraint,
            default: defaultType,
            loc: cst.loc,
        }
    }

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