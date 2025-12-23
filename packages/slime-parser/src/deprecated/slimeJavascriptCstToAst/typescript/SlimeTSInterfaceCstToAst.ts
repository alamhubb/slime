import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";

export default class SlimeTSInterfaceCstToAst{

    // ============================================
    // TypeScript 声明转换 (Phase 4)
    // ============================================

    /**
     * [TypeScript] 转换 TSInterfaceDeclaration CST 为 AST
     */
    createTSInterfaceDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let typeParameters: any = undefined
        let extendsClause: any[] = []
        let body: any = undefined

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSTypeParameterDeclaration') {
                typeParameters = this.createTSTypeParameterDeclarationAst(child)
            } else if (child.name === 'TSInterfaceExtends') {
                extendsClause = this.createTSInterfaceExtendsAst(child)
            } else if (child.name === 'TSInterfaceBody') {
                body = this.createTSInterfaceBodyAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSInterfaceDeclaration,
            id,
            typeParameters,
            extends: extendsClause.length > 0 ? extendsClause : undefined,
            body,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSInterfaceExtends CST 为 AST
     */
    createTSInterfaceExtendsAst(cst: SubhutiCst): any[] {
        const children = cst.children || []
        const result: any[] = []

        for (const child of children) {
            if (child.name === 'TSExpressionWithTypeArguments') {
                result.push(this.createTSExpressionWithTypeArgumentsAst(child))
            }
        }

        return result
    }



    /**
     * [TypeScript] 转换 TSExpressionWithTypeArguments CST 为 AST
     */
    createTSExpressionWithTypeArgumentsAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let expression: any = undefined
        let typeParameters: any = undefined

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                expression = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSTypeParameterInstantiation') {
                typeParameters = this.createTSTypeParameterInstantiationAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSInterfaceHeritage,
            expression,
            typeParameters,
            loc: cst.loc,
        }
    }




    /**
     * [TypeScript] 转换 TSInterfaceBody CST 为 AST
     */
    createTSInterfaceBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const body: any[] = []

        for (const child of children) {
            if (child.name === 'TSTypeMember') {
                body.push(this.createTSTypeMemberAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSInterfaceBody,
            body,
            loc: cst.loc,
        }
    }


}