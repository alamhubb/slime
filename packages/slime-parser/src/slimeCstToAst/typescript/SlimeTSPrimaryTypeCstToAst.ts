import {SubhutiCst} from "subhuti";
import {SlimeJavascriptAstTypeName, SlimeJavascriptAstTypeName} from "SlimeJavascript-ast";
import {SlimeJavascriptTSObjectTypeCstToAstSingle} from "./SlimeTSObjectTypeCstToAst.ts";

export class SlimeJavascriptTSPrimaryTypeCstToAstSingle {

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
     * [TypeScript] 转换 TSTypeQuery CST 为 AST (typeof x)
     */
    createTSTypeQueryAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const typeNameCst = children.find(c => c.name === 'TSTypeName')
        if (!typeNameCst) {
            throw new Error('TSTypeQuery: TSTypeName not found')
        }

        const exprName = this.createTSTypeNameAst(typeNameCst)

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

        let operator: 'keyof' | 'readonly' | 'unique'
        let typeAnnotation: any

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





}

export const SlimeJavascriptTSPrimaryTypeCstToAst = new SlimeJavascriptTSPrimaryTypeCstToAstSingle()