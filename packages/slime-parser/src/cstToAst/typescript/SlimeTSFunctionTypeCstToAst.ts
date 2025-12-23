/**
 * SlimeTSFunctionTypeCstToAst - TypeScript 函数类型
 *
 * 负责：
 * - createTSFunctionTypeAst
 * - createTSConstructorTypeAst
 * - createTSTypeParameterDeclarationAst
 * - createTSTypeParameterAst
 * - createTSTypeParameterInstantiationAst
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";

export class SlimeTSFunctionTypeCstToAstSingle {
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
                typeParameters = SlimeCstToAstUtil.createTSTypeParameterDeclarationAst(child)
            } else if (child.name === 'TSParameterList') {
                parameters = SlimeCstToAstUtil.createTSParameterListAst(child)
            } else if (child.name === 'TSType') {
                returnType = SlimeCstToAstUtil.createTSTypeAst(child)
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
                typeParameters = SlimeCstToAstUtil.createTSTypeParameterDeclarationAst(child)
            } else if (child.name === 'TSParameterList') {
                parameters = SlimeCstToAstUtil.createTSParameterListAst(child)
            } else if (child.name === 'TSType') {
                returnType = SlimeCstToAstUtil.createTSTypeAst(child)
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
     * [TypeScript] 转换 TSTypeParameterDeclaration CST 为 AST
     */
    createTSTypeParameterDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSTypeParameter') {
                params.push(SlimeCstToAstUtil.createTSTypeParameterAst(child))
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
                    constraint = SlimeCstToAstUtil.createTSTypeAst(children[i + 1])
                }
            } else if (child.name === 'Assign' || child.value === '=') {
                // 下一个是默认类型
                if (children[i + 1]?.name === 'TSType') {
                    defaultType = SlimeCstToAstUtil.createTSTypeAst(children[i + 1])
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

export const SlimeTSFunctionTypeCstToAst = new SlimeTSFunctionTypeCstToAstSingle()
