import {
    SlimeAstUtil,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeFunctionParam,
    SlimeNodeType,
    type SlimePattern
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser.ts";
import { SlimeAstUtils } from "../../SlimeAstUtils.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

export class PatternConversionCstToAst {
    /**
     * �?ArrayExpression AST 转换�?ArrayPattern
     */
    static convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null })
            } else {
                const element = elem.element || elem
                const pattern = SlimeCstToAstUtil.convertExpressionToPatternFromAST(element)
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
     * 将表达式 CST 转换�?Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     */
    /**
     * �?CST 表达式转换为 Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     * 注意：这个方法处�?CST 节点，convertExpressionToPattern 处理 AST 节点
     */
    static convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数 options = {})
        // 这必须在 findInnerExpr 之前处理，否则会丢失 = 和默认�?
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            // 检查是否有 Assign token (=)
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                // 这是默认参数: left = right
                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return SlimeCstToAstUtil.convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        // 递归查找最内层的表达式
        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            // 如果�?ObjectLiteral、ArrayLiteral、Identifier 等，返回�?
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            // 否则递归向下
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            // �?ObjectLiteral 转换�?ObjectPattern
            return SlimeCstToAstUtil.convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            // �?ArrayLiteral 转换�?ArrayPattern
            return SlimeCstToAstUtil.convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            // 标识符直接转�?
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return SlimeCstToAstUtil.createBindingIdentifierAst(inner)
        }

        // 尝试将表达式作为 AST 处理
        const expr = SlimeCstToAstUtil.createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            // ObjectExpression 需要转换为 ObjectPattern
            return SlimeCstToAstUtil.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            // ArrayExpression 需要转换为 ArrayPattern
            return SlimeCstToAstUtil.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            // AssignmentExpression 转换�?AssignmentPattern
            return SlimeCstToAstUtil.convertAssignmentExpressionToPattern(expr)
        }

        // 如果仍然无法转换，返�?null（不要返回原�?CST�?
        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换�?Pattern
     * 仅在“参数位置”调用，用于 Arrow / AsyncArrow 等场�?
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        // 1. 已经�?BindingIdentifier / BindingPattern 系列的，直接走绑定模式基础方法
        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = SlimeCstToAstUtil.createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = SlimeCstToAstUtil.createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = SlimeCstToAstUtil.createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = SlimeCstToAstUtil.createObjectBindingPatternAst(cst)
        }

        // 2. 其它情况（AssignmentExpression / ObjectLiteral / ArrayLiteral 等），使用通用�?CST→Pattern 逻辑
        if (!basePattern) {
            basePattern = SlimeCstToAstUtil.convertCstToPattern(cst)
        }

        // 3. 兼容兜底：仍然无法转换时，尝试从表达式中提取第一�?Identifier
        if (!basePattern) {
            const identifierCst = SlimeCstToAstUtil.findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = SlimeCstToAstUtil.createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        // 4. 处理 rest 参数：根据调用方传入�?hasEllipsis 决定是否包装�?RestElement
        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }


    /**
     * �?ObjectLiteral CST 转换�?ObjectPattern
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
                                const idCst = SlimeCstToAstUtil.findFirstIdentifierInExpression(assignExpr)
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
                            const patternProp = SlimeCstToAstUtil.convertPropertyDefinitionToPatternProperty(prop)
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
    static convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
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
            // 完整形式: { key: value }
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = SlimeCstToAstUtil.createPropertyNameAst(propName)
                const valueExpr = SlimeCstToAstUtil.createExpressionAst(valueCst)
                const value = SlimeCstToAstUtil.convertExpressionToPatternFromAST(valueExpr)
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
     * �?ObjectExpression AST 转换�?ObjectPattern
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
                const value = SlimeCstToAstUtil.convertExpressionToPatternFromAST(property.value)
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
     * �?AssignmentExpression AST 转换�?AssignmentPattern
     */
    static convertAssignmentExpressionToPattern(expr: any): any {
        const left = SlimeCstToAstUtil.convertExpressionToPatternFromAST(expr.left)
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
    static convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        if (!expr) return null
        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return SlimeCstToAstUtil.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return SlimeCstToAstUtil.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return SlimeCstToAstUtil.convertAssignmentExpressionToPattern(expr)
        }
        return null
    }

    /**
     * �?ArrayLiteral CST 转换�?ArrayPattern
     */
    static convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
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
                        const expr = SlimeCstToAstUtil.createExpressionAst(elem)
                        const pattern = SlimeCstToAstUtil.convertExpressionToPatternFromAST(expr)
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
     * 将表达式转换为模式（用于箭头函数参数解构�?
     * ObjectExpression -> ObjectPattern
     * ArrayExpression -> ArrayPattern
     * Identifier -> Identifier
     * SpreadElement -> RestElement
     */
    static convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr

        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            // �?ObjectExpression 转换�?ObjectPattern
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: SlimeCstToAstUtil.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
                    // 转换 Property �?value
                    const convertedValue = SlimeCstToAstUtil.convertExpressionToPattern(prop.value)
                    properties.push({
                        property: {
                            ...prop,
                            value: convertedValue
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    properties.push(item)
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any
        }

        if (expr.type === SlimeNodeType.ArrayExpression) {
            // �?ArrayExpression 转换�?ArrayPattern
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: SlimeCstToAstUtil.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: SlimeCstToAstUtil.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any
        }

        if (expr.type === SlimeNodeType.AssignmentExpression) {
            // �?AssignmentExpression 转换�?AssignmentPattern
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: SlimeCstToAstUtil.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            // SpreadElement -> RestElement
            return {
                type: SlimeNodeType.RestElement,
                argument: SlimeCstToAstUtil.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        // 其他类型直接返回
        return expr
    }
}