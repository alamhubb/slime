import {SubhutiCst, SubhutiSourceLocation} from "subhuti";
import {SlimeAstTypeName, SlimeJavascriptAstTypeName, SlimeJavascriptTokenCreateUtils} from "slime-ast";

export default class SlimeTsTypeAnnotationCstToAst{


    /**
     * [TypeScript] 转换 TSType CST 为 AST
     * 支持所有已实现的 TypeScript 类型
     */
    createTSTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSType has no children')
        }

        const name = child.name

        // 函数类型
        if (name === 'TSFunctionType') {
            return this.createTSFunctionTypeAst(child)
        }
        if (name === 'TSConstructorType') {
            return this.createTSConstructorTypeAst(child)
        }

        // 条件类型（包含联合/交叉类型）
        if (name === 'TSConditionalType') {
            return this.createTSConditionalTypeAst(child)
        }

        // 联合/交叉类型（兼容旧代码）
        if (name === 'TSUnionOrIntersectionType') {
            return this.createTSUnionOrIntersectionTypeAst(child)
        }

        throw new Error(`Unknown TSType child: ${name}`)
    }


    /**
     * [TypeScript] 转换 TSTypeAnnotation CST 为 AST
     */
    createTSTypeAnnotationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        if (children.length < 2) {
            throw new Error(`TSTypeAnnotation expected at least 2 children, got ${children.length}`)
        }

        const colonCst = children[0]
        const colonToken = SlimeJavascriptTokenCreateUtils.createColonToken(colonCst.loc)

        const typeCst = children[1]
        const typeAnnotation = this.createTSTypeAst(typeCst)

        return {
            type: SlimeJavascriptAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeName CST 为 AST
     */
    createTSTypeNameAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const nameParts: string[] = []

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                if (tokenCst.value) {
                    nameParts.push(tokenCst.value)
                }
            }
        }

        if (nameParts.length === 0) {
            throw new Error('TSTypeName: no identifier found')
        }

        return this.buildQualifiedName(nameParts, cst.loc)
    }

    /**
     * 构建限定名称
     */
    buildQualifiedName(parts: string[], loc: SubhutiSourceLocation): any {
        if (parts.length === 0) {
            throw new Error('buildQualifiedName: parts is empty')
        }
        if (parts.length === 1) {
            return {
                type: 'Identifier',
                name: parts[0],
                loc,
            }
        }

        let result: any = {
            type: 'Identifier',
            name: parts[0],
            loc,
        }

        for (let i = 1; i < parts.length; i++) {
            result = {
                type: SlimeJavascriptAstTypeName.TSQualifiedName,
                left: result,
                right: {
                    type: 'Identifier',
                    name: parts[i],
                    loc,
                },
                loc,
            }
        }

        return result
    }


    /**
     * [TypeScript] 转换 TSTypeParameterInstantiation CST 为 AST
     */
    createTSTypeParameterInstantiationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const params: any[] = []

        for (const child of children) {
            if (child.name === 'TSType') {
                params.push(this.createTSTypeAst(child))
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.TSTypeParameterInstantiation,
            params,
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
}