/**
 * IdentifierCstToAst - 标识符相关转换
 */
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import {
    SlimeAstUtil,
    SlimeClassBody, SlimeFunctionParam,
    SlimeIdentifier,
    SlimeMethodDefinition, SlimePattern,
    SlimePropertyDefinition,
    SlimeStatement,
    SlimeAstTypeName,
    SlimeTokenCreate,
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import { SlimeVariableCstToAstSingle } from "../statements/SlimeVariableCstToAst.ts";
import { SlimeJavascriptIdentifierCstToAstSingle } from "../../deprecated/slimeJavascriptCstToAst";
import SlimeJavascriptCstToAstUtil from "../../deprecated/SlimeJavascriptCstToAstUtil.ts";
import { SlimeJavascriptAstUtil } from "slime-ast";

export class SlimeIdentifierCstToAstSingle extends SlimeJavascriptIdentifierCstToAstSingle {

    /**
     * [TypeScript] 重写 createBindingIdentifierAst 以支持可选的类型注解
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const children = cst.children || []
        const first = children[0]

        let identifier: SlimeIdentifier

        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                identifier = SlimeJavascriptAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                throw new Error(`createBindingIdentifierAst: Cannot extract value from Identifier`)
            }
        } else if (first.value !== undefined) {
            identifier = SlimeJavascriptAstUtil.createIdentifier(first.value, first.loc)
        } else {
            throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
        }

        // [TypeScript] 检查是否有类型注解
        const tsTypeAnnotationName = SlimeParser.prototype.TSTypeAnnotation?.name || 'TSTypeAnnotation'
        const typeAnnotationCst = children.find(child =>
            child.name === tsTypeAnnotationName || child.name === 'TSTypeAnnotation'
        )
        if (typeAnnotationCst) {
            identifier.typeAnnotation = this.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
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
        const colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)

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
     * [TypeScript] 转换 TSConditionalType CST 为 AST
     * CST: TSConditionalType -> TSUnionOrIntersectionType (extends TSUnionOrIntersectionType ? TSType : TSType)?
     */
    createTSConditionalTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 第一个子节点是 checkType (TSUnionOrIntersectionType)
        const checkTypeCst = children.find(c => c.name === 'TSUnionOrIntersectionType')
        if (!checkTypeCst) {
            throw new Error('TSConditionalType missing checkType')
        }
        const checkType = this.createTSUnionOrIntersectionTypeAst(checkTypeCst)

        // 检查是否有条件部分 (extends ... ? ... : ...)
        const extendsToken = children.find(c => c.name === 'Extends')
        if (!extendsToken) {
            // 没有条件部分，直接返回 checkType
            return checkType
        }

        // 找到所有 TSUnionOrIntersectionType，第二个是 extendsType
        const unionTypes = children.filter(c => c.name === 'TSUnionOrIntersectionType')
        if (unionTypes.length < 2) {
            throw new Error('TSConditionalType missing extendsType')
        }
        const extendsType = this.createTSUnionOrIntersectionTypeAst(unionTypes[1])

        // 找到所有 TSType，第一个是 trueType，第二个是 falseType
        const tsTypes = children.filter(c => c.name === 'TSType')
        if (tsTypes.length < 2) {
            throw new Error('TSConditionalType missing trueType or falseType')
        }
        const trueType = this.createTSTypeAst(tsTypes[0])
        const falseType = this.createTSTypeAst(tsTypes[1])

        return {
            type: SlimeAstTypeName.TSConditionalType,
            checkType,
            extendsType,
            trueType,
            falseType,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSUnionOrIntersectionType CST 为 AST
     * CST: TSUnionOrIntersectionType -> TSIntersectionType (BitwiseOr TSIntersectionType)*
     */
    createTSUnionOrIntersectionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 收集所有 TSIntersectionType
        const intersectionTypes: any[] = []
        for (const child of children) {
            if (child.name === 'TSIntersectionType') {
                intersectionTypes.push(this.createTSIntersectionTypeAst(child))
            }
        }

        // 如果只有一个，直接返回
        if (intersectionTypes.length === 1) {
            return intersectionTypes[0]
        }

        // 多个则创建 TSUnionType
        return {
            type: SlimeAstTypeName.TSUnionType,
            types: intersectionTypes,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSIntersectionType CST 为 AST
     * CST: TSIntersectionType -> TSTypeOperand (BitwiseAnd TSTypeOperand)*
     */
    createTSIntersectionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 收集所有 TSTypeOperand
        const operandTypes: any[] = []
        for (const child of children) {
            if (child.name === 'TSTypeOperand') {
                operandTypes.push(this.createTSTypeOperandAst(child))
            }
        }

        // 如果只有一个，直接返回
        if (operandTypes.length === 1) {
            return operandTypes[0]
        }

        // 多个则创建 TSIntersectionType
        return {
            type: SlimeAstTypeName.TSIntersectionType,
            types: operandTypes,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypeOperand CST 为 AST
     * CST: TSTypeOperand -> TSPrefixTypeOrPrimary ([] | [TSType])*
     */
    createTSTypeOperandAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 第一个子节点是 TSPrefixTypeOrPrimary
        const prefixOrPrimaryCst = children.find(c => c.name === 'TSPrefixTypeOrPrimary')
        if (!prefixOrPrimaryCst) {
            // 兼容旧的 TSPrimaryType
            const primaryCst = children.find(c => c.name === 'TSPrimaryType')
            if (!primaryCst) {
                throw new Error('TSTypeOperand: TSPrefixTypeOrPrimary or TSPrimaryType not found')
            }
            return this.createTSPrimaryTypeAst(primaryCst)
        }
        
        let result = this.createTSPrefixTypeOrPrimaryAst(prefixOrPrimaryCst)
        
        // 检查是否有数组后缀 []
        let i = children.indexOf(prefixOrPrimaryCst) + 1
        while (i < children.length) {
            const child = children[i]
            if (child.name === 'LBracket' || child.value === '[') {
                // 检查下一个是 RBracket 还是 TSType
                const next = children[i + 1]
                if (next && (next.name === 'RBracket' || next.value === ']')) {
                    // 空括号 [] - 数组类型
                    result = {
                        type: SlimeAstTypeName.TSArrayType,
                        elementType: result,
                        loc: cst.loc,
                    }
                    i += 2
                } else if (next && next.name === 'TSType') {
                    // [TSType] - 索引访问类型
                    result = {
                        type: SlimeAstTypeName.TSIndexedAccessType,
                        objectType: result,
                        indexType: this.createTSTypeAst(next),
                        loc: cst.loc,
                    }
                    i += 3 // skip TSType and RBracket
                } else {
                    i++
                }
            } else {
                i++
            }
        }
        
        return result
    }

    /**
     * [TypeScript] 转换 TSPrefixTypeOrPrimary CST 为 AST
     * CST: TSPrefixTypeOrPrimary -> TSTypeQuery | TSTypeOperator | TSInferType | TSPrimaryType
     */
    createTSPrefixTypeOrPrimaryAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSPrefixTypeOrPrimary has no children')
        }

        const name = child.name

        // 类型查询 typeof x
        if (name === 'TSTypeQuery') {
            return this.createTSTypeQueryAst(child)
        }

        // 类型操作符 keyof, readonly, unique
        if (name === 'TSTypeOperator') {
            return this.createTSTypeOperatorAst(child)
        }

        // 推断类型 infer R
        if (name === 'TSInferType') {
            return this.createTSInferTypeAst(child)
        }

        // 基础类型
        if (name === 'TSPrimaryType') {
            return this.createTSPrimaryTypeAst(child)
        }

        throw new Error(`Unknown TSPrefixTypeOrPrimary child: ${name}`)
    }

    /**
     * [TypeScript] 转换 TSTypeQuery CST 为 AST (typeof x)
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
     * [TypeScript] 转换 TSTypeOperator CST 为 AST (keyof, readonly, unique)
     */
    createTSTypeOperatorAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 确定操作符类型
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
     * [TypeScript] 转换 TSInferType CST 为 AST (infer R)
     */
    createTSInferTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 找到标识符
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
     * [TypeScript] 转换 TSKeywordType 包装规则 CST 为 AST
     */
    createTSKeywordTypeWrapperAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSKeywordType has no children')
        }

        const name = child.name

        // 基础类型关键字
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
     * [TypeScript] 创建关键字类型 AST
     */
    createTSKeywordTypeAst(cst: SubhutiCst, typeName: string): any {
        return {
            type: typeName,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSLiteralType CST 为 AST
     */
    createTSLiteralTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSLiteralType has no children')
        }

        // 获取字面量值
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
            // 尝试从 token 获取值
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
     * [TypeScript] 转换 TSPropertyOrMethodSignature CST 为 AST
     * 这是一个合并的规则，需要根据内容判断是属性还是方法
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
                // PropertyName -> LiteralPropertyName -> IdentifierName -> IdentifierName (token)
                // 或 PropertyName -> ComputedPropertyName -> ...
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
            // 方法签名
            return {
                type: SlimeAstTypeName.TSMethodSignature,
                key,
                parameters,
                typeAnnotation,
                optional,
                loc: cst.loc,
            }
        } else {
            // 属性签名
            return {
                type: SlimeAstTypeName.TSPropertySignature,
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
     * [TypeScript] 转换 TSParenthesizedType CST 为 AST
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

    // ============================================
    // TypeScript Phase 2: 类型断言和表达式扩展
    // ============================================

    /**
     * [TypeScript] 转换 TSAsExpression CST 为 AST
     * expression as Type
     */
    createTSAsExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return {
            type: SlimeAstTypeName.TSAsExpression,
            expression,
            typeAnnotation: this.createTSTypeAst(typeCst),
            loc,
        }
    }

    /**
     * [TypeScript] 转换 TSSatisfiesExpression CST 为 AST
     * expression satisfies Type
     */
    createTSSatisfiesExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return {
            type: SlimeAstTypeName.TSSatisfiesExpression,
            expression,
            typeAnnotation: this.createTSTypeAst(typeCst),
            loc,
        }
    }

    /**
     * [TypeScript] 转换 TSNonNullExpression CST 为 AST
     * expression!
     */
    createTSNonNullExpressionAst(expression: any, loc: any): any {
        return {
            type: SlimeAstTypeName.TSNonNullExpression,
            expression,
            loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypeAssertion CST 为 AST
     * <Type>expression
     */
    createTSTypeAssertionAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 找到 TSType
        const typeCst = children.find(c => c.name === 'TSType')
        // 找到 UnaryExpression
        const exprCst = children.find(c => c.name === 'UnaryExpression')
        
        if (!typeCst || !exprCst) {
            throw new Error('TSTypeAssertion: missing TSType or UnaryExpression')
        }

        return {
            type: SlimeAstTypeName.TSTypeAssertion,
            typeAnnotation: this.createTSTypeAst(typeCst),
            expression: SlimeJavascriptCstToAstUtil.createUnaryExpressionAst(exprCst),
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSTypePredicate CST 为 AST
     * x is Type / asserts x is Type / asserts x
     */
    createTSTypePredicateAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        let asserts = false
        let parameterName: any = undefined
        let typeAnnotation: any = undefined

        for (const child of children) {
            if (child.name === 'TSAsserts' || child.value === 'asserts') {
                asserts = true
            } else if (child.name === 'This' || child.value === 'this') {
                parameterName = {
                    type: 'TSThisType',
                    loc: child.loc,
                }
            } else if (child.name === 'Identifier') {
                const tokenCst = child.children?.[0] || child
                parameterName = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSType') {
                typeAnnotation = this.createTSTypeAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSTypePredicate,
            asserts,
            parameterName,
            typeAnnotation,
            loc: cst.loc,
        }
    }
}

export const SlimeIdentifierCstToAst = new SlimeIdentifierCstToAstSingle()
