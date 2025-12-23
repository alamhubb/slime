import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName, SlimeJavascriptAstTypeName} from "slime-ast";

export default class SlimeTSCompositeTypeCstToAst {

    /**
     * [TypeScript] 转换 TSConditionalType CST 为 AST
     */
    createTSConditionalTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const checkTypeCst = children.find(c => c.name === 'TSUnionOrIntersectionType')
        if (!checkTypeCst) {
            throw new Error('TSConditionalType missing checkType')
        }
        const checkType = this.createTSUnionOrIntersectionTypeAst(checkTypeCst)

        const extendsToken = children.find(c => c.name === 'Extends')
        if (!extendsToken) {
            return checkType
        }

        const unionTypes = children.filter(c => c.name === 'TSUnionOrIntersectionType')
        if (unionTypes.length < 2) {
            throw new Error('TSConditionalType missing extendsType')
        }
        const extendsType = this.createTSUnionOrIntersectionTypeAst(unionTypes[1])

        const tsTypes = children.filter(c => c.name === 'TSType')
        if (tsTypes.length < 2) {
            throw new Error('TSConditionalType missing trueType or falseType')
        }
        const trueType = this.createTSTypeAst(tsTypes[0])
        const falseType = this.createTSTypeAst(tsTypes[1])

        return {
            type: SlimeJavascriptAstTypeName.TSConditionalType,
            checkType,
            extendsType,
            trueType,
            falseType,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSUnionOrIntersectionType CST 为 AST
     */
    createTSUnionOrIntersectionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const intersectionTypes: any[] = []
        for (const child of children) {
            if (child.name === 'TSIntersectionType') {
                intersectionTypes.push(this.createTSIntersectionTypeAst(child))
            }
        }

        if (intersectionTypes.length === 1) {
            return intersectionTypes[0]
        }

        return {
            type: SlimeJavascriptAstTypeName.TSUnionType,
            types: intersectionTypes,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSIntersectionType CST 为 AST
     */
    createTSIntersectionTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const operandTypes: any[] = []
        for (const child of children) {
            if (child.name === 'TSTypeOperand') {
                operandTypes.push(this.createTSTypeOperandAst(child))
            }
        }

        if (operandTypes.length === 1) {
            return operandTypes[0]
        }

        return {
            type: SlimeJavascriptAstTypeName.TSIntersectionType,
            types: operandTypes,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeOperand CST 为 AST
     */
    createTSTypeOperandAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const prefixOrPrimaryCst = children.find(c => c.name === 'TSPrefixTypeOrPrimary')
        if (!prefixOrPrimaryCst) {
            const primaryCst = children.find(c => c.name === 'TSPrimaryType')
            if (!primaryCst) {
                throw new Error('TSTypeOperand: TSPrefixTypeOrPrimary or TSPrimaryType not found')
            }
            return this.createTSPrimaryTypeAst(primaryCst)
        }

        let result = this.createTSPrefixTypeOrPrimaryAst(prefixOrPrimaryCst)

        let i = children.indexOf(prefixOrPrimaryCst) + 1
        while (i < children.length) {
            const child = children[i]
            if (child.name === 'LBracket' || child.value === '[') {
                const next = children[i + 1]
                if (next && (next.name === 'RBracket' || next.value === ']')) {
                    result = {
                        type: SlimeJavascriptAstTypeName.TSArrayType,
                        elementType: result,
                        loc: cst.loc,
                    }
                    i += 2
                } else if (next && next.name === 'TSType') {
                    result = {
                        type: SlimeJavascriptAstTypeName.TSIndexedAccessType,
                        objectType: result,
                        indexType: this.createTSTypeAst(next),
                        loc: cst.loc,
                    }
                    i += 3
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
     */
    createTSPrefixTypeOrPrimaryAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSPrefixTypeOrPrimary has no children')
        }

        const name = child.name

        if (name === 'TSTypeQuery') {
            return this.createTSTypeQueryAst(child)
        }
        if (name === 'TSTypeOperator') {
            return this.createTSTypeOperatorAst(child)
        }
        if (name === 'TSInferType') {
            return this.createTSInferTypeAst(child)
        }
        if (name === 'TSPrimaryType') {
            return this.createTSPrimaryTypeAst(child)
        }

        throw new Error(`Unknown TSPrefixTypeOrPrimary child: ${name}`)
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
            type: SlimeJavascriptAstTypeName.TSNamedTupleMember,
            label,
            elementType,
            optional,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSMappedType CST 为 AST
     */
    createTSMappedTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let readonly: '+' | '-' | true | undefined = undefined
        let optional: '+' | '-' | true | undefined = undefined
        let typeParameter: any = undefined
        let nameType: any = undefined
        let typeAnnotation: any = undefined

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

        const identifierCst = children.find(c => c.name === 'Identifier')
        if (identifierCst) {
            typeParameter = {
                type: SlimeJavascriptAstTypeName.TSTypeParameter,
                name: this.createIdentifierAst(identifierCst),
                loc: identifierCst.loc,
            }

            const tsTypes = children.filter(c => c.name === 'TSType')
            if (tsTypes.length > 0) {
                typeParameter.constraint = this.createTSTypeAst(tsTypes[0])
            }

            const asIndex = children.findIndex(c => c.value === 'as')
            if (asIndex !== -1 && tsTypes.length > 1) {
                nameType = this.createTSTypeAst(tsTypes[1])
            }
        }

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.value === ']') {
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

        const colonIndex = children.findIndex(c => c.value === ':')
        if (colonIndex !== -1) {
            const tsTypesAfterColon = children.slice(colonIndex + 1).filter(c => c.name === 'TSType')
            if (tsTypesAfterColon.length > 0) {
                typeAnnotation = this.createTSTypeAst(tsTypesAfterColon[0])
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.TSMappedType,
            typeParameter,
            nameType,
            typeAnnotation,
            readonly,
            optional,
            loc: cst.loc,
        }
    }


}