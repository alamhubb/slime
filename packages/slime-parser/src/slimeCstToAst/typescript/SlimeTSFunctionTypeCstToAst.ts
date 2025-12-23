import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstCreateUtils,
    SlimeJavascriptAstTypeName, type SlimeJavascriptBlockStatement, type SlimeJavascriptFunctionDeclaration,
    type SlimeJavascriptFunctionParam, SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, SlimeJavascriptTokenCreateUtils
} from "SlimeJavascript-ast";
import {SlimeJavascriptTSExpressionCstToAstSingle} from "./SlimeTSExpressionCstToAst.ts";

export class SlimeJavascriptTSFunctionTypeCstToAstSingle {

    /**
     * [TypeScript] 转换 TSFunctionType CST �?AST
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
     * [TypeScript] 转换 TSConstructorType CST �?AST
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
     * [TypeScript] 转换 TSParameterList CST �?AST
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
     * [TypeScript] 转换 TSParameter CST �?AST
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
     * [TypeScript] 转换 TSTypeParameterDeclaration CST �?AST
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
     * [TypeScript] 转换 TSTypeParameter CST �?AST
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






}

export const SlimeJavascriptTSFunctionTypeCstToAst = new SlimeJavascriptTSFunctionTypeCstToAstSingle()
