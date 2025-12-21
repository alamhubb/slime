import {
    type SlimePattern,
    type SlimeArrayPattern,
    type SlimeObjectPattern,
    type SlimeRestElement,
    type SlimeIdentifier,
    type SlimeExpression,
    type SlimeAssignmentProperty,
    type SlimeArrayPatternElement,
    type SlimeObjectPatternProperty,
    type SlimeLBracketToken,
    type SlimeRBracketToken,
    type SlimeLBraceToken,
    type SlimeRBraceToken,
    type SlimeCommaToken, type SlimeFunctionParam, type SlimeBlockStatement, type SlimeFunctionExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer.ts";
import {checkCstName} from "../SlimeCstToAstUtil.ts";


/**
 * 解构模式相关的 CST to AST 转换
 */
export class PatternCstToAst {

    /**
     * �?ObjectLiteral CST 转换�?ObjectPattern
     */
    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'PropertyDefinitionList') {
                for (const prop of child.children || []) {
                    if (prop.value === ',') {
                        // 将逗号关联到前一个属�?
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(prop.loc)
                        }
                        continue
                    }
                    if (prop.name === 'PropertyDefinition') {
                        // 检查是否是 SpreadElement (... identifier)
                        const ellipsis = prop.children?.find((c: any) => c.value === '...' || c.name === 'Ellipsis')
                        if (ellipsis) {
                            // 这是一�?RestElement
                            const assignExpr = prop.children?.find((c: any) => c.name === 'AssignmentExpression')
                            if (assignExpr) {
                                // �?AssignmentExpression 中提�?identifier
                                const idCst = this.findFirstIdentifierInExpression(assignExpr)
                                if (idCst) {
                                    const restId = this.createIdentifierAst(idCst)
                                    const restNode: SlimeRestElement = {
                                        type: SlimeNodeType.RestElement,
                                        argument: restId,
                                        ellipsisToken: SlimeTokenCreate.createEllipsisToken(ellipsis.loc),
                                        loc: prop.loc
                                    }
                                    properties.push({ property: restNode })
                                }
                            }
                        } else {
                            const patternProp = this.convertPropertyDefinitionToPatternProperty(prop)
                            if (patternProp) {
                                properties.push({ property: patternProp })
                            }
                        }
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeObjectPattern
    }

    /**
     * �?PropertyDefinition CST 转换�?Pattern 属�?
     */
    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        const first = cst.children?.[0]
        if (!first) return null

        if (first.name === 'IdentifierReference') {
            // 简写形�? { id } -> { id: id }
            const idNode = first.children?.[0]?.children?.[0]
            if (idNode) {
                const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                return {
                    type: SlimeNodeType.Property,
                    key: id,
                    value: id,
                    kind: 'init',
                    computed: false,
                    shorthand: true,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        } else if (first.name === 'CoverInitializedName') {
            // 带默认值的简写形�? { id = value }
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference')
            const initializer = first.children?.find((c: any) => c.name === 'Initializer')
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0]
                if (idNode) {
                    const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                    let value: any = id
                    if (initializer) {
                        const init = this.createInitializerAst(initializer)
                        value = {
                            type: SlimeNodeType.AssignmentPattern,
                            left: id,
                            right: init,
                            loc: first.loc
                        }
                    }
                    return {
                        type: SlimeNodeType.Property,
                        key: id,
                        value: value,
                        kind: 'init',
                        computed: false,
                        shorthand: true,
                        loc: cst.loc
                    } as SlimeAssignmentProperty
                }
            }
        } else if (first.name === 'PropertyName') {
            // 完整形式: { key: value }
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = this.createPropertyNameAst(propName)
                const valueExpr = this.createExpressionAst(valueCst)
                const value = this.convertExpressionToPatternFromAST(valueExpr)
                return {
                    type: SlimeNodeType.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: this.isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        }

        return null
    }

    /**
     * �?ObjectExpression AST 转换�?ObjectPattern
     */
    convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        for (const prop of expr.properties || []) {
            const property = prop.property || prop
            if (property.type === SlimeNodeType.SpreadElement) {
                properties.push({
                    property: {
                        type: SlimeNodeType.RestElement,
                        argument: property.argument,
                        loc: property.loc
                    } as SlimeRestElement
                })
            } else {
                const value = this.convertExpressionToPatternFromAST(property.value)
                properties.push({
                    property: {
                        type: SlimeNodeType.Property,
                        key: property.key,
                        value: value || property.value,
                        kind: 'init',
                        computed: property.computed,
                        shorthand: property.shorthand,
                        loc: property.loc
                    } as SlimeAssignmentProperty
                })
            }
        }
        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken: expr.lBraceToken,
            rBraceToken: expr.rBraceToken,
            loc: expr.loc
        } as SlimeObjectPattern
    }

    /**
     * �?ArrayExpression AST 转换�?ArrayPattern
     */
    convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null })
            } else {
                const element = elem.element || elem
                const pattern = this.convertExpressionToPatternFromAST(element)
                elements.push({ element: pattern || element, commaToken: elem.commaToken })
            }
        }
        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken: expr.lBracketToken,
            rBracketToken: expr.rBracketToken,
            loc: expr.loc
        } as SlimeArrayPattern
    }

    /**
     * �?AssignmentExpression AST 转换�?AssignmentPattern
     */
    convertAssignmentExpressionToPattern(expr: any): any {
        const left = this.convertExpressionToPatternFromAST(expr.left)
        return {
            type: SlimeNodeType.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        }
    }

    /**
     * 将表达式 AST 转换�?Pattern
     */
    convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        if (!expr) return null
        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return this.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return this.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return this.convertAssignmentExpressionToPattern(expr)
        }
        return null
    }

    /**
     * �?ArrayLiteral CST 转换�?ArrayPattern
     */
    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        // 简化实现：使用 createArrayBindingPatternAst 的逻辑
        const elements: SlimeArrayPatternElement[] = []
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        // 辅助函数：处�?Elision 节点
        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    // 将逗号关联到前一个元素（如果有）
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elisionChild.loc)
                    }
                    // 添加一个省略元�?
                    elements.push({ element: null })
                }
            }
        }

        for (const child of cst.children || []) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            } else if (child.name === 'Elision') {
                // 直接�?ArrayLiteral 下的 Elision（如 [,,]�?
                processElision(child)
            } else if (child.name === 'ElementList') {
                const elemChildren = child.children || []
                for (let i = 0; i < elemChildren.length; i++) {
                    const elem = elemChildren[i]
                    if (elem.value === ',') {
                        // 将逗号关联到前一个元�?
                        if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                            elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elem.loc)
                        }
                    } else if (elem.name === 'Elision') {
                        // ElementList 内的 Elision
                        processElision(elem)
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = this.createExpressionAst(elem)
                        const pattern = this.convertExpressionToPatternFromAST(expr)
                        elements.push({ element: pattern || expr as any })
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = this.createSpreadElementAst(elem)
                        elements.push({
                            element: {
                                type: SlimeNodeType.RestElement,
                                argument: restNode.argument,
                                loc: restNode.loc
                            } as SlimeRestElement
                        })
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeArrayPattern
    }


    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        checkCstName(cst, SlimeParser.prototype.BindingPattern?.name)

        const child = cst.children[0]

        if (child.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
            return this.createArrayBindingPatternAst(child)
        } else if (child.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            return this.createObjectBindingPatternAst(child)
        } else {
            throw new Error(`Unknown BindingPattern type: ${child.name}`)
        }
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        checkCstName(cst, SlimeParser.prototype.ArrayBindingPattern?.name)

        // CST结构：[LBracket, BindingElementList?, Comma?, Elision?, BindingRestElement?, RBracket]
        const elements: SlimeArrayPatternElement[] = []

        // 提取 LBracket �?RBracket tokens
        let lBracketToken: SlimeLBracketToken | undefined
        let rBracketToken: SlimeRBracketToken | undefined
        for (const child of cst.children) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            }
        }

        // 查找BindingElementList
        const bindingList = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingElementList?.name)
        if (bindingList) {
            // BindingElementList包含BindingElisionElement和Comma
            let pendingCommaToken: SlimeCommaToken | undefined
            for (let i = 0; i < bindingList.children.length; i++) {
                const child = bindingList.children[i]
                if (child.value === ',') {
                    // 如果有待处理的元素，将逗号关联到它
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    } else {
                        pendingCommaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name) {
                    // BindingElisionElement可能包含：Elision + BindingElement
                    // 先检查是否有Elision（跳过的元素�?
                    const elision = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.Elision?.name)
                    if (elision) {
                        // Elision可能包含多个逗号，每个逗号代表一个null
                        for (const elisionChild of elision.children || []) {
                            if (elisionChild.value === ',') {
                                elements.push({
                                    element: null,
                                    commaToken: SlimeTokenCreate.createCommaToken(elisionChild.loc)
                                })
                            }
                        }
                    }

                    // 然后检查是否有BindingElement
                    const bindingElement = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.BindingElement?.name)

                    if (bindingElement) {
                        // 使用 createBindingElementAst 正确处理 BindingElement（包�?Initializer�?
                        const element = this.createBindingElementAst(bindingElement)
                        if (element) {
                            elements.push({ element })
                        }
                    }
                }
            }
        }

        // 处理 ArrayBindingPattern 直接子节点中�?Comma �?Elision（尾部空位）
        // CST: [LBracket, BindingElementList, Comma, Elision, RBracket]
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]
            // 跳过 LBracket, RBracket, BindingElementList（已处理�?
            if (child.value === '[' || child.value === ']' ||
                child.name === SlimeParser.prototype.BindingElementList?.name ||
                child.name === SlimeParser.prototype.BindingRestElement?.name) {
                continue
            }

            // 处理 BindingElementList 之后�?Comma
            if (child.value === ',') {
                // 将逗号关联到最后一个元�?
                if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                    elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                }
            }

            // 处理尾部�?Elision
            if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                for (const elisionChild of child.children || []) {
                    if (elisionChild.value === ',') {
                        elements.push({
                            element: null,
                            commaToken: SlimeTokenCreate.createCommaToken(elisionChild.loc)
                        })
                    }
                }
            }
        }

        // 检查是否有BindingRestElement�?..rest �?...[a, b]�?
        const restElement = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingRestElement?.name)
        if (restElement) {
            const restNode = this.createBindingRestElementAst(restElement)
            elements.push({ element: restNode as any })
        }

        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeArrayPattern
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        checkCstName(cst, SlimeParser.prototype.ObjectBindingPattern?.name)

        // CST结构：[LBrace, BindingPropertyList?, RBrace]
        const properties: SlimeObjectPatternProperty[] = []

        // 提取 LBrace �?RBrace tokens
        let lBraceToken: SlimeLBraceToken | undefined
        let rBraceToken: SlimeRBraceToken | undefined
        for (const child of cst.children) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 查找BindingPropertyList
        const propList = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingPropertyList?.name)
        if (propList) {
            // BindingPropertyList包含BindingProperty和Comma节点
            for (let i = 0; i < propList.children.length; i++) {
                const child = propList.children[i]
                if (child.value === ',') {
                    // 将逗号关联到前一个属�?
                    if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                        properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeParser.prototype.BindingProperty?.name) {
                    // BindingProperty -> SingleNameBinding (简�? �?PropertyName + BindingElement (完整)
                    const singleName = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.SingleNameBinding?.name)

                    if (singleName) {
                        // 简写形式：{name} �?{name = "Guest"}
                        const value = this.createSingleNameBindingAst(singleName)
                        const identifier = singleName.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingIdentifier?.name)
                        const key = this.createBindingIdentifierAst(identifier)

                        properties.push({
                            property: {
                                type: SlimeNodeType.Property,
                                key: key,
                                value: value,
                                kind: 'init',
                                computed: false,
                                shorthand: true,
                                loc: child.loc
                            } as SlimeAssignmentProperty
                        })
                    } else {
                        // 完整形式：{name: userName}
                        const propName = child.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.PropertyName?.name)
                        const bindingElement = child.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingElement?.name)

                        if (propName && bindingElement) {
                            const key = this.createPropertyNameAst(propName)
                            const value = this.createBindingElementAst(bindingElement)
                            const isComputed = this.isComputedPropertyName(propName)

                            properties.push({
                                property: {
                                    type: SlimeNodeType.Property,
                                    key: key,
                                    value: value,
                                    kind: 'init',
                                    computed: isComputed,
                                    shorthand: false,
                                    loc: child.loc
                                } as SlimeAssignmentProperty
                            })
                        }
                    }
                }
            }
        }

        // 检查外层是否有逗号（在 BindingPropertyList 之后、BindingRestProperty 之前�?
        // CST 结构: { BindingPropertyList , BindingRestProperty }
        // 逗号�?ObjectBindingPattern 的直接子节点
        for (const child of cst.children) {
            if (child.value === ',') {
                // 将逗号关联到最后一个属�?
                if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                    properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                }
            }
        }

        // ES2018: 检查是否有BindingRestElement �?BindingRestProperty�?..rest�?
        const restElement = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingRestElement?.name ||
            ch.name === 'BindingRestElement' ||
            ch.name === SlimeParser.prototype.BindingRestProperty?.name ||
            ch.name === 'BindingRestProperty'
        )
        if (restElement) {
            const identifier = restElement.children.find((ch: any) =>
                ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
                ch.name === 'BindingIdentifier'
            )
            if (identifier) {
                const restId = this.createBindingIdentifierAst(identifier)
                // 提取 ellipsis token
                const ellipsisCst = restElement.children.find((ch: any) => ch.value === '...')
                const ellipsisToken = ellipsisCst ? SlimeTokenCreate.createEllipsisToken(ellipsisCst.loc) : undefined
                const restNode: SlimeRestElement = {
                    type: SlimeNodeType.RestElement,
                    argument: restId,
                    ellipsisToken,
                    loc: restElement.loc
                }
                properties.push({ property: restNode })
            }
        }

        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeObjectPattern
    }

    // ==================== 解构相关转换方法 ====================

    /**
     * AssignmentPattern CST �?AST
     * AssignmentPattern -> ObjectAssignmentPattern | ArrayAssignmentPattern
     */
    createAssignmentPatternAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return this.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return this.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * ObjectAssignmentPattern CST �?AST
     */
    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return this.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST �?AST
     */
    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return this.createArrayBindingPatternAst(cst)
    }
}
