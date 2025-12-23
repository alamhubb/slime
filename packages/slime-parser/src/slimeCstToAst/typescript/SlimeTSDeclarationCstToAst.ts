import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName} from "SlimeJavascript-ast";
import {SlimeJavascriptTSCompositeTypeCstToAstSingle} from "./SlimeTSCompositeTypeCstToAst.ts";

export class SlimeJavascriptTSDeclarationCstToAstSingle {

    // ============================================
    // TypeScript 声明转换 (Phase 4)
    // ============================================

    /**
     * [TypeScript] 转换 TSInterfaceDeclaration CST �?AST
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
     * [TypeScript] 转换 TSInterfaceExtends CST �?AST
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
     * [TypeScript] 转换 TSExpressionWithTypeArguments CST �?AST
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
     * [TypeScript] 转换 TSInterfaceBody CST �?AST
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


    /**
     * [TypeScript] 转换 TSEnumDeclaration CST �?AST
     */
    createTSEnumDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let members: any[] = []
        let isConst = false

        for (const child of children) {
            if (child.name === 'Const' || child.value === 'const') {
                isConst = true
            } else if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSEnumMember') {
                members.push(this.createTSEnumMemberAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSEnumDeclaration,
            id,
            members,
            const: isConst,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSEnumMember CST �?AST
     *
     * CST 结构:
     * TSEnumMember
     *   - Identifier (成员�?
     *   - Assign (可选的 = 符号)
     *   - AssignmentExpression (可选的初始化表达式)
     */
    createTSEnumMemberAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let initializer: any = undefined

        for (const child of children) {
            if (child.name === 'Identifier') {
                // 枚举成员�?
                const tokenCst = child.children?.[0] || child
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'StringLiteral') {
                // 字符串字面量作为成员�?
                id = {
                    type: 'Literal',
                    value: child.value?.slice(1, -1),
                    raw: child.value,
                    loc: child.loc,
                }
            } else if (child.name === 'AssignmentExpression') {
                // 初始化表达式 - 使用 SlimeCstToAstUtil 的方�?
                // 注意：这里调用的是单例的方法，会�?SlimeCstToAstUtil 的拦截机制处�?
                initializer = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSEnumMember,
            id,
            initializer,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeAliasDeclaration CST �?AST
     */
    createTSTypeAliasDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let typeParameters: any = undefined
        let typeAnnotation: any = undefined

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
            } else if (child.name === 'TSType') {
                typeAnnotation = this.createTSTypeAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSTypeAliasDeclaration,
            id,
            typeParameters,
            typeAnnotation,
            loc: cst.loc,
        }
    }


}

export const SlimeJavascriptTSDeclarationCstToAst = new SlimeJavascriptTSDeclarationCstToAstSingle()
