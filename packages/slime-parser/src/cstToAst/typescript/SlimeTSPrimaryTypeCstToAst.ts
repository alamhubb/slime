/**
 * SlimeTSPrimaryTypeCstToAst - TypeScript 基础类型
 *
 * 负责：
 * - createTSPrimaryTypeAst
 * - createTSTypeReferenceAst
 * - createTSTypeNameAst
 * - createTSTupleTypeAst
 * - createTSMappedTypeAst
 * - createTSArrayType
 * - createTSIndexedAccessType
 */
import {SubhutiCst, SubhutiSourceLocation} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";

export class SlimeTSPrimaryTypeCstToAstSingle {
    /**
     * [TypeScript] 转换 TSPrimaryType CST 为 AST
     */
    createTSPrimaryTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSPrimaryType has no children')
        }

        const name = child.name

        // 映射类型
        if (name === 'TSMappedType') return this.createTSMappedTypeAst(child)

        // TSKeywordType 包装规则
        if (name === 'TSKeywordType') {
            return this.createTSKeywordTypeWrapperAst(child)
        }

        // 字面量类型
        if (name === 'TSLiteralType') return this.createTSLiteralTypeAst(child)

        // 类型引用
        if (name === 'TSTypeReference') return this.createTSTypeReferenceAst(child)

        // 元组类型
        if (name === 'TSTupleType') return this.createTSTupleTypeAst(child)

        // 对象类型字面量
        if (name === 'TSTypeLiteral') return this.createTSTypeLiteralAst(child)

        // 括号类型
        if (name === 'TSParenthesizedType') return this.createTSParenthesizedTypeAst(child)

        throw new Error(`Unknown TSPrimaryType child: ${name}`)
    }


    /**
     * [TypeScript] 转换 TSTypeReference CST 为 AST
     */
    createTSTypeReferenceAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let typeName: any = undefined
        let typeArguments: any = undefined

        for (const child of children) {
            if (child.name === 'TSTypeName') {
                typeName = this.createTSTypeNameAst(child)
            } else if (child.name === 'TSTypeParameterInstantiation') {
                typeArguments = this.createTSTypeParameterInstantiationAst(child)
            }
        }

        // 如果没有找到 TSTypeName，尝试直接从 children 中提取
        if (!typeName) {
            const nameParts: string[] = []
            for (const child of children) {
                if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                    const tokenCst = child.children?.[0] || child
                    if (tokenCst.value) {
                        nameParts.push(tokenCst.value)
                    }
                }
            }
            if (nameParts.length > 0) {
                typeName = this.buildQualifiedName(nameParts, cst.loc)
            }
        }

        if (!typeName) {
            throw new Error('TSTypeReference: no type name found')
        }

        const result: any = {
            type: SlimeAstTypeName.TSTypeReference,
            typeName,
            loc: cst.loc,
        }

        if (typeArguments) {
            result.typeParameters = typeArguments
        }

        return result
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

        // 从左到右构建: A.B.C -> TSQualifiedName(TSQualifiedName(A, B), C)
        let result: any = {
            type: 'Identifier',
            name: parts[0],
            loc,
        }

        for (let i = 1; i < parts.length; i++) {
            result = {
                type: SlimeAstTypeName.TSQualifiedName,
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
            type: SlimeAstTypeName.TSTypeParameterInstantiation,
            params,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTupleType CST 为 AST
     */
    createTSTupleTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const elementTypes: any[] = []

        for (const child of children) {
            if (child.name === 'TSTupleElement' || child.name === 'TSTupleElementType') {
                elementTypes.push(this.createTSTupleElementAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSTupleType,
            elementTypes,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTupleElement CST 为 AST
     */
    createTSTupleElementAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是剩余元素 TSRestType
        const restCst = children.find(c => c.name === 'TSRestType')
        if (restCst) {
            return this.createTSRestTypeAst(restCst)
        }

        // 检查是否是命名元组 TSNamedTupleMember
        const namedCst = children.find(c => c.name === 'TSNamedTupleMember')
        if (namedCst) {
            return this.createTSNamedTupleMemberAst(namedCst)
        }

        // 检查是否有 Ellipsis（旧格式）
        const hasEllipsis = children.some(c => c.name === 'Ellipsis' || c.value === '...')
        if (hasEllipsis) {
            const typeCst = children.find(c => c.name === 'TSType')
            return {
                type: SlimeAstTypeName.TSRestType,
                typeAnnotation: typeCst ? this.createTSTypeAst(typeCst) : undefined,
                loc: cst.loc,
            }
        }

        // 普通元素 - 直接是 TSType
        const typeCst = children.find(c => c.name === 'TSType')
        const hasQuestion = children.some(c => c.name === 'Question' || c.value === '?')

        if (typeCst) {
            const typeAst = this.createTSTypeAst(typeCst)
            if (hasQuestion) {
                return {
                    type: SlimeAstTypeName.TSOptionalType,
                    typeAnnotation: typeAst,
                    loc: cst.loc,
                }
            }
            return typeAst
        }

        // 如果没有找到 TSType，可能子节点本身就是类型
        // 尝试直接处理第一个子节点
        const firstChild = children[0]
        if (firstChild && firstChild.name) {
            // 可能是 TSConditionalType 或其他类型
            if (firstChild.name === 'TSConditionalType') {
                return this.createTSConditionalTypeAst(firstChild)
            }
            if (firstChild.name === 'TSUnionOrIntersectionType') {
                return this.createTSUnionOrIntersectionTypeAst(firstChild)
            }
        }

        throw new Error(`TSTupleElement: no type found, children: ${children.map(c => c.name).join(', ')}`)
    }

    /**
     * [TypeScript] 转换 TSRestType CST 为 AST
     */
    createTSRestTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const typeCst = children.find(c => c.name === 'TSType')

        return {
            type: SlimeAstTypeName.TSRestType,
            typeAnnotation: typeCst ? this.createTSTypeAst(typeCst) : undefined,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSNamedTupleMember CST 为 AST
     */
    createTSNamedTupleMemberAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let label: any = undefined
        let elementType: any = undefined
        let optional = false

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                label = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSType') {
                elementType = this.createTSTypeAst(child)
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            }
        }

        return {
            type: SlimeAstTypeName.TSNamedTupleMember,
            label,
            elementType,
            optional,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSMappedType CST 为 AST
     * { [K in keyof T]: T[K] }
     */
    createTSMappedTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let readonly: '+' | '-' | true | undefined = undefined
        let optional: '+' | '-' | true | undefined = undefined
        let typeParameter: any = undefined
        let nameType: any = undefined
        let typeAnnotation: any = undefined

        // 解析 readonly 修饰符
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.value === '+' && children[i + 1]?.value === 'readonly') {
                readonly = '+'
                i++
            } else if (child.value === '-' && children[i + 1]?.value === 'readonly') {
                readonly = '-'
                i++
            } else if (child.value === 'readonly') {
                readonly = true
            }
        }

        // 找到类型参数 [K in T]
        const identifierCst = children.find(c => c.name === 'Identifier')
        if (identifierCst) {
            typeParameter = {
                type: SlimeAstTypeName.TSTypeParameter,
                name: this.createIdentifierAst(identifierCst),
                loc: identifierCst.loc,
            }

            // 找到 in 后面的约束类型
            const tsTypes = children.filter(c => c.name === 'TSType')
            if (tsTypes.length > 0) {
                typeParameter.constraint = this.createTSTypeAst(tsTypes[0])
            }

            // 找到 as 后面的 nameType
            const asIndex = children.findIndex(c => c.value === 'as')
            if (asIndex !== -1 && tsTypes.length > 1) {
                nameType = this.createTSTypeAst(tsTypes[1])
            }
        }

        // 解析 optional 修饰符 (?, +?, -?)
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            // 跳过 LBracket 内的 ?
            if (child.value === ']') {
                // 检查 ] 后面的 ?
                const next = children[i + 1]
                if (next?.value === '?') {
                    optional = true
                } else if (next?.value === '+' && children[i + 2]?.value === '?') {
                    optional = '+'
                } else if (next?.value === '-' && children[i + 2]?.value === '?') {
                    optional = '-'
                }
            }
        }

        // 找到值类型（冒号后面的 TSType）
        const colonIndex = children.findIndex(c => c.value === ':')
        if (colonIndex !== -1) {
            const tsTypesAfterColon = children.slice(colonIndex + 1).filter(c => c.name === 'TSType')
            if (tsTypesAfterColon.length > 0) {
                typeAnnotation = this.createTSTypeAst(tsTypesAfterColon[0])
            }
        }

        return {
            type: SlimeAstTypeName.TSMappedType,
            typeParameter,
            nameType,
            typeAnnotation,
            readonly,
            optional,
            loc: cst.loc,
        }
    }
}

export const SlimeTSPrimaryTypeCstToAst = new SlimeTSPrimaryTypeCstToAstSingle()
