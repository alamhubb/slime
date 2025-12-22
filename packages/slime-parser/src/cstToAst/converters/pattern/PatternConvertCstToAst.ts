import { SubhutiCst } from "subhuti";
import { SlimeNodeType, SlimePattern, SlimeArrayPattern, SlimeObjectPattern, SlimeAssignmentProperty, SlimeObjectPatternProperty, SlimeRestElement, SlimeTokenCreate, SlimeAstUtil, SlimeArrayPatternElement } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * PatternConvert CST 到 AST 转换器
 * 
 * 负责处理：
 * - AssignmentPattern: 赋值模式
 * - ObjectAssignmentPattern: 对象赋值模式
 * - ArrayAssignmentPattern: 数组赋值模式
 * - AssignmentPropertyList: 赋值属性列表
 * - AssignmentProperty: 赋值属性
 * - AssignmentElementList: 赋值元素列表
 * - AssignmentElisionElement: 赋值省略元素
 * - AssignmentElement: 赋值元素
 * - AssignmentRestElement: 赋值剩余元素
 * - AssignmentRestProperty: 赋值剩余属性
 * - convertExpressionToPattern: 表达式转模式
 */
export class PatternConvertCstToAst {

    /**
     * 创建 AssignmentPattern AST
     */
    static createAssignmentPatternAst(cst: SubhutiCst): any {
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
     * 创建 ObjectAssignmentPattern AST
     * 委托到 ObjectBindingPattern
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return SlimeCstToAstUtil.createObjectBindingPatternAst(cst)
    }

    /**
     * 创建 ArrayAssignmentPattern AST
     * 委托到 ArrayBindingPattern
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return SlimeCstToAstUtil.createArrayBindingPatternAst(cst)
    }

    /**
     * 创建 AssignmentPropertyList AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(this.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * 创建 AssignmentProperty AST
     * 委托到 BindingProperty
     */
    static createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingPropertyAst(cst)
    }

    /**
     * 创建 AssignmentElementList AST
     * 委托到 BindingElementList
     */
    static createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeCstToAstUtil.createBindingElementListAst(cst)
    }

    /**
     * 创建 AssignmentElement AST
     * 委托到 BindingElement
     */
    static createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElementAst(cst)
    }

    /**
     * 创建 AssignmentElisionElement AST
     * 委托到 BindingElisionElement
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElisionElementAst(cst)
    }

    /**
     * 创建 AssignmentRestElement AST
     * 委托到 BindingRestElement
     */
    static createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestElementAst(cst)
    }

    /**
     * 创建 AssignmentRestProperty AST
     * 委托到 BindingRestProperty
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestPropertyAst(cst)
    }

    /**
     * 将表达式 CST 转换为 Pattern（用于 cover grammar）
     * 这用于处理 async (expr) => body 中的 expr 到 pattern 的转换
     */
    static convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数 options = {})
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return this.convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        // 递归查找最内层的表达式
        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            return this.convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            return this.convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return SlimeCstToAstUtil.createBindingIdentifierAst(inner)
        }

        const expr = SlimeCstToAstUtil.createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
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
     * Cover 语法下，将单个参数相关的 CST 节点转换为 Pattern
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = SlimeCstToAstUtil.createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = SlimeCstToAstUtil.createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = SlimeCstToAstUtil.createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = SlimeCstToAstUtil.createObjectBindingPatternAst(cst)
        }

        if (!basePattern) {
            basePattern = this.convertCstToPattern(cst)
        }

        if (!basePattern) {
            const identifierCst = this.findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = SlimeCstToAstUtil.createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }

    /**
     * 将 ObjectLiteral CST 转换为 ObjectPattern
     */
    static convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
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
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(prop.loc)
                        }
                        continue
                    }
                    if (prop.name === 'PropertyDefinition') {
                        const ellipsis = prop.children?.find((c: any) => c.value === '...' || c.name === 'Ellipsis')
                        if (ellipsis) {
                            const assignExpr = prop.children?.find((c: any) => c.name === 'AssignmentExpression')
                            if (assignExpr) {
                                const idCst = this.findFirstIdentifierInExpression(assignExpr)
                                if (idCst) {
                                    const restId = SlimeCstToAstUtil.createIdentifierAst(idCst)
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
     * 将 PropertyDefinition CST 转换为 Pattern 属性
     */
    static convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        const first = cst.children?.[0]
        if (!first) return null

        if (first.name === 'IdentifierReference') {
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
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference')
            const initializer = first.children?.find((c: any) => c.name === 'Initializer')
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0]
                if (idNode) {
                    const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                    let value: any = id
                    if (initializer) {
                        const init = SlimeCstToAstUtil.createInitializerAst(initializer)
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
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = SlimeCstToAstUtil.createPropertyNameAst(propName)
                const valueExpr = SlimeCstToAstUtil.createExpressionAst(valueCst)
                const value = this.convertExpressionToPatternFromAST(valueExpr)
                return {
                    type: SlimeNodeType.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: SlimeCstToAstUtil.isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        }

        return null
    }

    /**
     * 将 ObjectExpression AST 转换为 ObjectPattern
     */
    static convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
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
     * 将 ArrayExpression AST 转换为 ArrayPattern
     */
    static convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
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
     * 将 AssignmentExpression AST 转换为 AssignmentPattern
     */
    static convertAssignmentExpressionToPattern(expr: any): any {
        const left = this.convertExpressionToPatternFromAST(expr.left)
        return {
            type: SlimeNodeType.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        }
    }

    /**
     * 将表达式 AST 转换为 Pattern
     */
    static convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
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
     * 将 ArrayLiteral CST 转换为 ArrayPattern
     */
    static convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elisionChild.loc)
                    }
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
                processElision(child)
            } else if (child.name === 'ElementList') {
                const elemChildren = child.children || []
                for (let i = 0; i < elemChildren.length; i++) {
                    const elem = elemChildren[i]
                    if (elem.value === ',') {
                        if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                            elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elem.loc)
                        }
                    } else if (elem.name === 'Elision') {
                        processElision(elem)
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = SlimeCstToAstUtil.createExpressionAst(elem)
                        const pattern = this.convertExpressionToPatternFromAST(expr)
                        elements.push({ element: pattern || expr as any })
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = SlimeCstToAstUtil.createSpreadElementAst(elem)
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

    /**
     * 在Expression中查找第一个Identifier
     */
    static findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = this.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

    /**
     * 统一导出为原始接口，兼容旧引用
     */
    static convertExpressionToPattern(expr: any): SlimePattern {
        return this.convertExpressionToPatternFromAST(expr) as any || expr
    }
}
