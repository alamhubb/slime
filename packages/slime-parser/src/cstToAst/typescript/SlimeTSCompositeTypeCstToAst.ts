/**
 * SlimeTSCompositeTypeCstToAst - TypeScript 复合类型
 *
 * 负责：
 * - createTSUnionOrIntersectionTypeAst
 * - createTSIntersectionTypeAst
 * - createTSConditionalTypeAst
 * - createTSTypeOperandAst
 * - createTSPrefixTypeOrPrimaryAst
 * - createTSTypeQueryAst
 * - createTSTypeOperatorAst
 * - createTSInferTypeAst
 */
import {SubhutiCst, type SubhutiSourceLocation} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class SlimeTSCompositeTypeCstToAstSingle {

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
                intersectionTypes.push(SlimeCstToAstUtil.createTSIntersectionTypeAst(child))
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
        const checkType = SlimeCstToAstUtil.createTSUnionOrIntersectionTypeAst(checkTypeCst)

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
        const extendsType = SlimeCstToAstUtil.createTSUnionOrIntersectionTypeAst(unionTypes[1])

        // 找到所有 TSType，第一个是 trueType，第二个是 falseType
        const tsTypes = children.filter(c => c.name === 'TSType')
        if (tsTypes.length < 2) {
            throw new Error('TSConditionalType missing trueType or falseType')
        }
        const trueType = SlimeCstToAstUtil.createTSTypeAst(tsTypes[0])
        const falseType = SlimeCstToAstUtil.createTSTypeAst(tsTypes[1])

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
     * [TypeScript] 转换 TSIntersectionType CST 为 AST
     * CST: TSIntersectionType -> TSTypeOperand (BitwiseAnd TSTypeOperand)*
     */
    createTSIntersectionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 收集所有 TSTypeOperand
        const operandTypes: any[] = []
        for (const child of children) {
            if (child.name === 'TSTypeOperand') {
                operandTypes.push(SlimeCstToAstUtil.createTSTypeOperandAst(child))
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
            return SlimeCstToAstUtil.createTSPrimaryTypeAst(primaryCst)
        }

        let result = SlimeCstToAstUtil.createTSPrefixTypeOrPrimaryAst(prefixOrPrimaryCst)

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
                        indexType: SlimeCstToAstUtil.createTSTypeAst(next),
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
            return SlimeCstToAstUtil.createTSTypeQueryAst(child)
        }

        // 类型操作符 keyof, readonly, unique
        if (name === 'TSTypeOperator') {
            return SlimeCstToAstUtil.createTSTypeOperatorAst(child)
        }

        // 推断类型 infer R
        if (name === 'TSInferType') {
            return SlimeCstToAstUtil.createTSInferTypeAst(child)
        }

        // 基础类型
        if (name === 'TSPrimaryType') {
            return SlimeCstToAstUtil.createTSPrimaryTypeAst(child)
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

        const exprName = SlimeCstToAstUtil.createTSTypeNameAst(typeNameCst)

        // 可选的类型参数
        const typeParamsCst = children.find(c => c.name === 'TSTypeParameterInstantiation')
        const typeParameters = typeParamsCst ? SlimeCstToAstUtil.createTSTypeParameterInstantiationAst(typeParamsCst) : undefined

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
            typeAnnotation = SlimeCstToAstUtil.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'readonly' || firstChild.name?.includes('Readonly')) {
            operator = 'readonly'
            const operandCst = children.find(c => c.name === 'TSTypeOperand')
            if (!operandCst) {
                throw new Error('TSTypeOperator readonly: TSTypeOperand not found')
            }
            typeAnnotation = SlimeCstToAstUtil.createTSTypeOperandAst(operandCst)
        } else if (firstChild.value === 'unique' || firstChild.name?.includes('Unique')) {
            operator = 'unique'
            // unique symbol - 找到 TSSymbolKeyword
            const symbolCst = children.find(c => c.name === 'TSSymbolKeyword')
            if (!symbolCst) {
                throw new Error('TSTypeOperator unique: TSSymbolKeyword not found')
            }
            typeAnnotation = SlimeCstToAstUtil.createTSKeywordTypeAst(symbolCst, SlimeAstTypeName.TSSymbolKeyword)
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
            name: SlimeCstToAstUtil.createIdentifierAst(identifierCst),
            loc: identifierCst.loc,
        }

        // 可选的约束 extends TSType
        const extendsCst = children.find(c => c.name === 'Extends')
        if (extendsCst) {
            const constraintCst = children.find(c => c.name === 'TSType')
            if (constraintCst) {
                typeParameter.constraint = SlimeCstToAstUtil.createTSTypeAst(constraintCst)
            }
        }

        return {
            type: SlimeAstTypeName.TSInferType,
            typeParameter,
            loc: cst.loc,
        }
    }
}

export const SlimeTSCompositeTypeCstToAst = new SlimeTSCompositeTypeCstToAstSingle()
