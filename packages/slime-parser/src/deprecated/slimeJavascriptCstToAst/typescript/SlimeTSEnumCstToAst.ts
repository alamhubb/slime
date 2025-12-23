import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";

export default class SlimeTSEnumCstToAst{

    /**
     * [TypeScript] 转换 TSEnumDeclaration CST 为 AST
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
     * [TypeScript] 转换 TSEnumMember CST 为 AST
     *
     * CST 结构:
     * TSEnumMember
     *   - Identifier (成员名)
     *   - Assign (可选的 = 符号)
     *   - AssignmentExpression (可选的初始化表达式)
     */
    createTSEnumMemberAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let initializer: any = undefined

        for (const child of children) {
            if (child.name === 'Identifier') {
                // 枚举成员名
                const tokenCst = child.children?.[0] || child
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'StringLiteral') {
                // 字符串字面量作为成员名
                id = {
                    type: 'Literal',
                    value: child.value?.slice(1, -1),
                    raw: child.value,
                    loc: child.loc,
                }
            } else if (child.name === 'AssignmentExpression') {
                // 初始化表达式 - 使用 SlimeJavascriptCstToAstUtil 的方法
                // 注意：这里调用的是单例的方法，会被 SlimeCstToAstUtil 的拦截机制处理
                initializer = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(child)
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
     * [TypeScript] 转换 TSTypeAliasDeclaration CST 为 AST
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