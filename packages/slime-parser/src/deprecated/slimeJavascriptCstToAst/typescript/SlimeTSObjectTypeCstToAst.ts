import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName, SlimeJavascriptAstTypeName} from "slime-ast";

export default class SlimeTSObjectTypeCstToAst{
    /**
     * [TypeScript] 转换 TSTypeLiteral CST 为 AST
     */
    createTSTypeLiteralAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const members: any[] = []

        for (const child of children) {
            if (child.name === 'TSTypeMember') {
                members.push(this.createTSTypeMemberAst(child))
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.TSTypeLiteral,
            members,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeMember CST 为 AST
     */
    createTSTypeMemberAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSTypeMember has no children')
        }

        const name = child.name

        if (name === 'TSPropertySignature') {
            return this.createTSPropertySignatureAst(child)
        }
        if (name === 'TSMethodSignature') {
            return this.createTSMethodSignatureAst(child)
        }
        if (name === 'TSIndexSignature') {
            return this.createTSIndexSignatureAst(child)
        }
        if (name === 'TSCallSignatureDeclaration') {
            return this.createTSCallSignatureDeclarationAst(child)
        }
        if (name === 'TSConstructSignatureDeclaration') {
            return this.createTSConstructSignatureDeclarationAst(child)
        }
        if (name === 'TSPropertyOrMethodSignature') {
            return this.createTSPropertyOrMethodSignatureAst(child)
        }

        throw new Error(`Unknown TSTypeMember child: ${name}`)
    }



    /**
     * [TypeScript] 转换 TSPropertyOrMethodSignature CST 为 AST
     */
    createTSPropertyOrMethodSignatureAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let key: any = undefined
        let typeAnnotation: any = undefined
        let readonly = false
        let optional = false
        let hasParams = false
        let parameters: any[] = []

        for (const child of children) {
            if (child.name === 'TSReadonly' || child.value === 'readonly') {
                readonly = true
            } else if (child.name === 'PropertyName') {
                key = this.extractPropertyNameKey(child)
            } else if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                key = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            } else if (child.name === 'TSParameterList' || child.name === 'FormalParameters') {
                hasParams = true
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        if (hasParams) {
            return {
                type: SlimeJavascriptAstTypeName.TSMethodSignature,
                key,
                parameters,
                typeAnnotation,
                optional,
                loc: cst.loc,
            }
        } else {
            return {
                type: SlimeJavascriptAstTypeName.TSPropertySignature,
                key,
                typeAnnotation,
                readonly,
                optional,
                computed: false,
                loc: cst.loc,
            }
        }
    }


    /**
     * [TypeScript] 从 PropertyName CST 中提取 key
     */
    extractPropertyNameKey(cst: SubhutiCst): any {
        const children = cst.children || []
        const firstChild = children[0]

        if (!firstChild) {
            throw new Error('PropertyName has no children')
        }

        if (firstChild.name === 'LiteralPropertyName') {
            // LiteralPropertyName -> IdentifierName | StringLiteral | NumericLiteral
            const literalChild = firstChild.children?.[0]
            if (!literalChild) {
                throw new Error('LiteralPropertyName has no children')
            }

            if (literalChild.name === 'IdentifierName') {
                // IdentifierName -> IdentifierName (token)
                const tokenCst = literalChild.children?.[0] || literalChild
                return {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (literalChild.name === 'StringLiteral') {
                const tokenCst = literalChild.children?.[0] || literalChild
                return {
                    type: 'Literal',
                    value: tokenCst.value,
                    raw: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (literalChild.name === 'NumericLiteral') {
                const tokenCst = literalChild.children?.[0] || literalChild
                return {
                    type: 'Literal',
                    value: Number(tokenCst.value),
                    raw: tokenCst.value,
                    loc: tokenCst.loc,
                }
            }
        } else if (firstChild.name === 'ComputedPropertyName') {
            // TODO: 处理计算属性名
            throw new Error('ComputedPropertyName not yet supported in TSPropertyOrMethodSignature')
        }

        // 回退：尝试直接从 children 中提取
        const tokenCst = firstChild.children?.[0]?.children?.[0] || firstChild.children?.[0] || firstChild
        return {
            type: 'Identifier',
            name: tokenCst.value,
            loc: tokenCst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSPropertySignature CST 为 AST
     */
    createTSPropertySignatureAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let key: any = undefined
        let typeAnnotation: any = undefined
        let readonly = false
        let optional = false
        let computed = false

        for (const child of children) {
            if (child.name === 'TSReadonly' || child.value === 'readonly') {
                readonly = true
            } else if (child.name === 'PropertyName') {
                const propChild = child.children?.[0]
                if (propChild?.name === 'ComputedPropertyName') {
                    computed = true
                    // TODO: 处理计算属性名
                } else if (propChild?.name === 'LiteralPropertyName') {
                    const tokenCst = propChild.children?.[0]
                    key = {
                        type: 'Identifier',
                        name: tokenCst?.value,
                        loc: tokenCst?.loc,
                    }
                }
            } else if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                key = {
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

        return {
            type: SlimeAstTypeName.TSPropertySignature,
            key,
            typeAnnotation,
            readonly,
            optional,
            computed,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSMethodSignature CST 为 AST
     */
    createTSMethodSignatureAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let key: any = undefined
        let parameters: any[] = []
        let typeAnnotation: any = undefined
        let optional = false

        for (const child of children) {
            if (child.name === 'PropertyName' || child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                key = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            } else if (child.name === 'TSParameterList') {
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSMethodSignature,
            key,
            parameters,
            typeAnnotation,
            optional,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSCallSignatureDeclaration CST 为 AST
     */
    createTSCallSignatureDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let parameters: any[] = []
        let typeAnnotation: any = undefined

        for (const child of children) {
            if (child.name === 'TSParameterList') {
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSCallSignatureDeclaration,
            parameters,
            typeAnnotation,
            loc: cst.loc,
        }
    }



    /**
     * [TypeScript] 转换 TSConstructSignatureDeclaration CST 为 AST
     */
    createTSConstructSignatureDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let parameters: any[] = []
        let typeAnnotation: any = undefined

        for (const child of children) {
            if (child.name === 'TSParameterList') {
                parameters = this.createTSParameterListAst(child)
            } else if (child.name === 'TSTypeAnnotation') {
                typeAnnotation = this.createTSTypeAnnotationAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSConstructSignatureDeclaration,
            parameters,
            typeAnnotation,
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



    /**
     * [TypeScript] 转换 TSIndexSignature CST 为 AST
     */
    createTSIndexSignatureAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let parameters: any[] = []
        let typeAnnotation: any = undefined
        let readonly = false

        for (const child of children) {
            if (child.name === 'TSReadonly' || child.value === 'readonly') {
                readonly = true
            } else if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                // 索引参数名
                const tokenCst = child.children?.[0] || child
                // 查找后面的类型注解
                const idx = children.indexOf(child)
                const colonIdx = children.findIndex((c, i) => i > idx && (c.name === 'Colon' || c.value === ':'))
                if (colonIdx !== -1 && children[colonIdx + 1]?.name === 'TSType') {
                    parameters.push({
                        type: 'Identifier',
                        name: tokenCst.value,
                        typeAnnotation: {
                            type: SlimeAstTypeName.TSTypeAnnotation,
                            typeAnnotation: this.createTSTypeAst(children[colonIdx + 1]),
                        },
                        loc: tokenCst.loc,
                    })
                }
            } else if (child.name === 'TSType' && !parameters.length) {
                // 跳过索引参数的类型，已在上面处理
            } else if (child.name === 'TSType' && parameters.length) {
                // 返回类型
                typeAnnotation = {
                    type: SlimeAstTypeName.TSTypeAnnotation,
                    typeAnnotation: this.createTSTypeAst(child),
                }
            }
        }

        return {
            type: SlimeAstTypeName.TSIndexSignature,
            parameters,
            typeAnnotation,
            readonly,
            loc: cst.loc,
        }
    }



    /**
     * [TypeScript] 转换 TSTypeMember CST 为 AST
     */
    createTSTypeMemberAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSTypeMember has no children')
        }

        const name = child.name

        if (name === 'TSPropertySignature') {
            return this.createTSPropertySignatureAst(child)
        }
        if (name === 'TSMethodSignature') {
            return this.createTSMethodSignatureAst(child)
        }
        if (name === 'TSIndexSignature') {
            return this.createTSIndexSignatureAst(child)
        }
        if (name === 'TSCallSignatureDeclaration') {
            return this.createTSCallSignatureDeclarationAst(child)
        }
        if (name === 'TSConstructSignatureDeclaration') {
            return this.createTSConstructSignatureDeclarationAst(child)
        }
        // 处理 TSPropertyOrMethodSignature（合并的属性/方法签名）
        if (name === 'TSPropertyOrMethodSignature') {
            return this.createTSPropertyOrMethodSignatureAst(child)
        }

        throw new Error(`Unknown TSTypeMember child: ${name}`)
    }


    /**
     * [TypeScript] 转换 TSTypeLiteral CST 为 AST
     */
    createTSTypeLiteralAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const members: any[] = []

        for (const child of children) {
            if (child.name === 'TSTypeMember') {
                members.push(this.createTSTypeMemberAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSTypeLiteral,
            members,
            loc: cst.loc,
        }
    }

}