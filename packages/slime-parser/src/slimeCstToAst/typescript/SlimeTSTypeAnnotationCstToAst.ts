import {
    SlimeJavascriptAstCreateUtils,
    SlimeJavascriptBlockStatement, SlimeJavascriptClassDeclaration, SlimeJavascriptClassExpression,
    SlimeJavascriptExpression, SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam, SlimeJavascriptIdentifier, SlimeJavascriptMethodDefinition, SlimeJavascriptPropertyDefinition,
    SlimeJavascriptTokenCreateUtils
} from "SlimeJavascript-ast";
import {SubhutiCst, SubhutiSourceLocation} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";
import {SlimeJavascriptTSTupleTypeCstToAstSingle} from "./SlimeTSTupleTypeCstToAst.ts";

export class SlimeJavascriptTSTypeAnnotationCstToAstSingle {


    /**
     * [TypeScript] 转换 TSTypeAnnotation CST �?AST
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
            type: SlimeAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSType CST �?AST
     * 支持所有已实现�?TypeScript 类型
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

        // 条件类型（包含联�?交叉类型�?
        if (name === 'TSConditionalType') {
            return this.createTSConditionalTypeAst(child)
        }

        // 联合/交叉类型（兼容旧代码�?
        if (name === 'TSUnionOrIntersectionType') {
            return this.createTSUnionOrIntersectionTypeAst(child)
        }

        throw new Error(`Unknown TSType child: ${name}`)
    }

    /**
     * [TypeScript] 转换 TSTypeQuery CST �?AST (typeof x)
     */
    createTSTypeQueryAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到 TSTypeName
        const typeNameCst = children.find(c => c.name === 'TSTypeName')
        if (!typeNameCst) {
            throw new Error('TSTypeQuery: TSTypeName not found')
        }

        const exprName = this.createTSTypeNameAst(typeNameCst)

        // 可选的类型参数
        const typeParamsCst = children.find(c => c.name === 'TSTypeParameterInstantiation')
        const typeParameters = typeParamsCst ? this.createTSTypeParameterInstantiationAst(typeParamsCst) : undefined

        return {
            type: SlimeAstTypeName.TSTypeQuery,
            exprName,
            typeParameters,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypeOperator CST �?AST (keyof, readonly, unique)
     */
    createTSTypeOperatorAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 确定操作符类�?
        let operator: 'keyof' | 'readonly' | 'unique'
        let typeAnnotation: any

        // 检查第一个子节点来确定操作符
        const firstChild = children[0]
        if (!firstChild) {
            throw new Error('TSTypeOperator has no children')
        }

        if (firstChild.value === 'keyof' || firstChild.name?.includes('Keyof')) {
            operator = 'keyof'
            const operandCst = children.find(c => c.name === 'TSTypeOperand')
            if (!operandCst) {
                throw new Error('TSTypeOperator keyof: TSTypeOperand not found')
            }
            typeAnnotation = this.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'readonly' || firstChild.name?.includes('Readonly')) {
            operator = 'readonly'
            const operandCst = children.find(c => c.name === 'TSTypeOperand')
            if (!operandCst) {
                throw new Error('TSTypeOperator readonly: TSTypeOperand not found')
            }
            typeAnnotation = this.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'unique' || firstChild.name?.includes('Unique')) {
            operator = 'unique'
            // unique symbol - 找到 TSSymbolKeyword
            const symbolCst = children.find(c => c.name === 'TSSymbolKeyword')
            if (!symbolCst) {
                throw new Error('TSTypeOperator unique: TSSymbolKeyword not found')
            }
            typeAnnotation = this.createTSKeywordTypeAst(symbolCst, SlimeAstTypeName.TSSymbolKeyword)
        } else {
            throw new Error(`Unknown TSTypeOperator: ${firstChild.value || firstChild.name}`)
        }

        return {
            type: SlimeAstTypeName.TSTypeOperator,
            operator,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSInferType CST �?AST (infer R)
     */
    createTSInferTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到标识�?
        const identifierCst = children.find(c => c.name === 'Identifier')
        if (!identifierCst) {
            throw new Error('TSInferType: Identifier not found')
        }

        const typeParameter: any = {
            type: SlimeAstTypeName.TSTypeParameter,
            name: this.createIdentifierAst(identifierCst),
            loc: identifierCst.loc,
        }

        // 可选的约束 extends TSType
        const extendsCst = children.find(c => c.name === 'Extends')
        if (extendsCst) {
            const constraintCst = children.find(c => c.name === 'TSType')
            if (constraintCst) {
                typeParameter.constraint = this.createTSTypeAst(constraintCst)
            }
        }

        return {
            type: SlimeAstTypeName.TSInferType,
            typeParameter,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSPrimaryType CST �?AST
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

        // 字面量类�?
        if (name === 'TSLiteralType') return this.createTSLiteralTypeAst(child)

        // 类型引用
        if (name === 'TSTypeReference') return this.createTSTypeReferenceAst(child)

        // 元组类型
        if (name === 'TSTupleType') return this.createTSTupleTypeAst(child)

        // 对象类型字面�?
        if (name === 'TSTypeLiteral') return this.createTSTypeLiteralAst(child)

        // 括号类型
        if (name === 'TSParenthesizedType') return this.createTSParenthesizedTypeAst(child)

        throw new Error(`Unknown TSPrimaryType child: ${name}`)
    }

    /**
     * [TypeScript] 转换 TSKeywordType 包装规则 CST �?AST
     */
    createTSKeywordTypeWrapperAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSKeywordType has no children')
        }

        const name = child.name

        // 基础类型关键�?
        if (name === 'TSNumberKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNumberKeyword)
        if (name === 'TSStringKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSStringKeyword)
        if (name === 'TSBooleanKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBooleanKeyword)
        if (name === 'TSAnyKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSAnyKeyword)
        if (name === 'TSUnknownKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUnknownKeyword)
        if (name === 'TSNeverKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNeverKeyword)
        if (name === 'TSUndefinedKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUndefinedKeyword)
        if (name === 'TSNullKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNullKeyword)
        if (name === 'TSVoidKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSVoidKeyword)
        if (name === 'TSObjectKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSObjectKeyword)
        if (name === 'TSSymbolKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSSymbolKeyword)
        if (name === 'TSBigIntKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBigIntKeyword)

        throw new Error(`Unknown TSKeywordType child: ${name}`)
    }

    /**
     * [TypeScript] 创建关键字类�?AST
     */
    createTSKeywordTypeAst(cst: SubhutiCst, typeName: string): any {
        return {
            type: typeName,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSLiteralType CST �?AST
     */
    createTSLiteralTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSLiteralType has no children')
        }

        // 获取字面量�?
        let literal: any
        if (child.name === 'StringLiteral' || child.name === 'Literal') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'NumericLiteral') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: Number(tokenCst.value),
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'TrueTok' || child.value === 'true') {
            literal = {
                type: 'Literal',
                value: true,
                raw: 'true',
                loc: child.loc,
            }
        } else if (child.name === 'FalseTok' || child.value === 'false') {
            literal = {
                type: 'Literal',
                value: false,
                raw: 'false',
                loc: child.loc,
            }
        } else {
            // 尝试�?token 获取�?
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        }

        return {
            type: SlimeAstTypeName.TSLiteralType,
            literal,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeReference CST �?AST
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

        // 如果没有找到 TSTypeName，尝试直接从 children 中提�?
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
     * [TypeScript] 转换 TSTypeName CST �?AST
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
     * [TypeScript] 转换 TSTypeParameterInstantiation CST �?AST
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
     * [TypeScript] 转换 TSParenthesizedType CST �?AST
     */
    createTSParenthesizedTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const typeCst = children.find(c => c.name === 'TSType')

        if (typeCst) {
            return {
                type: SlimeAstTypeName.TSParenthesizedType,
                typeAnnotation: this.createTSTypeAst(typeCst),
                loc: cst.loc,
            }
        }

        throw new Error('TSParenthesizedType: no TSType found')
    }


    // ============================================
    // TypeScript Phase 2: 类型断言和表达式扩展
    // ============================================


    // ============================================
    // TypeScript: Phase 7 - 模块和命名空�?
    // ============================================


}

export const SlimeJavascriptTSTypeAnnotationCstToAst = new SlimeJavascriptTSTypeAnnotationCstToAstSingle()
