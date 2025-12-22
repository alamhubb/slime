import {
    SlimeJavascriptAstUtil,
    type SlimeJavascriptBlockStatement,
    type SlimeJavascriptExpression,
    type SlimeJavascriptFunctionParam,
    SlimeJavascriptAstTypeName,
    type SlimeJavascriptPattern,
    SlimeJavascriptTokenCreate,
    type SlimeJavascriptArrayPattern,
    type SlimeJavascriptArrayPatternElement,
    type SlimeJavascriptObjectPattern,
    type SlimeJavascriptObjectPatternProperty,
    type SlimeJavascriptAssignmentProperty,
    type SlimeJavascriptRestElement, SlimeJavascriptStatement, SlimeJavascriptIdentifier
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";

import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

export class PatternConvertCstToAst {
    /**
     * �?ArrayExpression AST 转换�?ArrayPattern
     */
    static convertArrayExpressionToPattern(expr: any): SlimeJavascriptArrayPattern {
        const elements: SlimeJavascriptArrayPatternElement[] = []
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null })
            } else {
                const element = elem.element || elem
                const pattern = SlimeJavascriptCstToAstUtil.convertExpressionToPatternFromAST(element)
                elements.push({ element: pattern || element, commaToken: elem.commaToken })
            }
        }
        return {
            type: SlimeJavascriptAstTypeName.ArrayPattern,
            elements,
            lBracketToken: expr.lBracketToken,
            rBracketToken: expr.rBracketToken,
            loc: expr.loc
        } as SlimeJavascriptArrayPattern
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
    static convertCstToPattern(cst: SubhutiCst): SlimeJavascriptPattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数 options = {})
        // 这必须在 findInnerExpr 之前处理，否则会丢失 = 和默认�?
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
            // 检查是否有 Assign token (=)
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                // 这是默认参数: left = right
                const expr = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(cst)
                if (expr.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
                    return SlimeJavascriptCstToAstUtil.convertAssignmentExpressionToPattern(expr)
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
            return SlimeJavascriptCstToAstUtil.convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            // �?ArrayLiteral 转换�?ArrayPattern
            return SlimeJavascriptCstToAstUtil.convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            // 标识符直接转�?
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeJavascriptAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(inner)
        }

        // 尝试将表达式作为 AST 处理
        const expr = SlimeJavascriptCstToAstUtil.createExpressionAst(cst)
        if (expr.type === SlimeJavascriptAstTypeName.Identifier) {
            return expr as any
        } else if (expr.type === SlimeJavascriptAstTypeName.ObjectExpression) {
            // ObjectExpression 需要转换为 ObjectPattern
            return SlimeJavascriptCstToAstUtil.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeJavascriptAstTypeName.ArrayExpression) {
            // ArrayExpression 需要转换为 ArrayPattern
            return SlimeJavascriptCstToAstUtil.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
            // AssignmentExpression 转换�?AssignmentPattern
            return SlimeJavascriptCstToAstUtil.convertAssignmentExpressionToPattern(expr)
        }

        // 如果仍然无法转换，返�?null（不要返回原�?CST�?
        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换�?Pattern
     * 仅在“参数位置”调用，用于 Arrow / AsyncArrow 等场�?
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimeJavascriptPattern | null {
        let basePattern: SlimeJavascriptPattern | null = null

        // 1. 已经�?BindingIdentifier / BindingPattern 系列的，直接走绑定模式基础方法
        if (cst.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeJavascriptParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = SlimeJavascriptCstToAstUtil.createBindingPatternAst(cst)
        } else if (cst.name === SlimeJavascriptParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = SlimeJavascriptCstToAstUtil.createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeJavascriptParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = SlimeJavascriptCstToAstUtil.createObjectBindingPatternAst(cst)
        }

        // 2. 其它情况（AssignmentExpression / ObjectLiteral / ArrayLiteral 等），使用通用�?CST→Pattern 逻辑
        if (!basePattern) {
            basePattern = SlimeJavascriptCstToAstUtil.convertCstToPattern(cst)
        }

        // 3. 兼容兜底：仍然无法转换时，尝试从表达式中提取第一�?Identifier
        if (!basePattern) {
            const identifierCst = SlimeJavascriptCstToAstUtil.findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = SlimeJavascriptCstToAstUtil.createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        // 4. 处理 rest 参数：根据调用方传入�?hasEllipsis 决定是否包装�?RestElement
        if (hasEllipsis) {
            return SlimeJavascriptAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }


    /**
     * �?ObjectLiteral CST 转换�?ObjectPattern
     */
    static convertObjectLiteralToPattern(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        const properties: SlimeJavascriptObjectPatternProperty[] = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (child.value === '{') {
                lBraceToken = SlimeJavascriptTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'PropertyDefinitionList') {
                for (const prop of child.children || []) {
                    if (prop.value === ',') {
                        // 将逗号关联到前一个属�?
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(prop.loc)
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
                                const idCst = SlimeJavascriptCstToAstUtil.findFirstIdentifierInExpression(assignExpr)
                                if (idCst) {
                                    const restId = SlimeJavascriptCstToAstUtil.createIdentifierAst(idCst)
                                    const restNode: SlimeJavascriptRestElement = {
                                        type: SlimeJavascriptAstTypeName.RestElement,
                                        argument: restId,
                                        ellipsisToken: SlimeJavascriptTokenCreate.createEllipsisToken(ellipsis.loc),
                                        loc: prop.loc
                                    }
                                    properties.push({ property: restNode })
                                }
                            }
                        } else {
                            const patternProp = SlimeJavascriptCstToAstUtil.convertPropertyDefinitionToPatternProperty(prop)
                            if (patternProp) {
                                properties.push({ property: patternProp })
                            }
                        }
                    }
                }
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeJavascriptObjectPattern
    }

    /**
     * �?PropertyDefinition CST 转换�?Pattern 属�?
     */
    static convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeJavascriptAssignmentProperty | null {
        const first = cst.children?.[0]
        if (!first) return null

        if (first.name === 'IdentifierReference') {
            // 简写形�? { id } -> { id: id }
            const idNode = first.children?.[0]?.children?.[0]
            if (idNode) {
                const id = SlimeJavascriptAstUtil.createIdentifier(idNode.value, idNode.loc)
                return {
                    type: SlimeJavascriptAstTypeName.Property,
                    key: id,
                    value: id,
                    kind: 'init',
                    computed: false,
                    shorthand: true,
                    loc: cst.loc
                } as SlimeJavascriptAssignmentProperty
            }
        } else if (first.name === 'CoverInitializedName') {
            // 带默认值的简写形�? { id = value }
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference')
            const initializer = first.children?.find((c: any) => c.name === 'Initializer')
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0]
                if (idNode) {
                    const id = SlimeJavascriptAstUtil.createIdentifier(idNode.value, idNode.loc)
                    let value: any = id
                    if (initializer) {
                        const init = SlimeJavascriptCstToAstUtil.createInitializerAst(initializer)
                        value = {
                            type: SlimeJavascriptAstTypeName.AssignmentPattern,
                            left: id,
                            right: init,
                            loc: first.loc
                        }
                    }
                    return {
                        type: SlimeJavascriptAstTypeName.Property,
                        key: id,
                        value: value,
                        kind: 'init',
                        computed: false,
                        shorthand: true,
                        loc: cst.loc
                    } as SlimeJavascriptAssignmentProperty
                }
            }
        } else if (first.name === 'PropertyName') {
            // 完整形式: { key: value }
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = SlimeJavascriptCstToAstUtil.createPropertyNameAst(propName)
                const valueExpr = SlimeJavascriptCstToAstUtil.createExpressionAst(valueCst)
                const value = SlimeJavascriptCstToAstUtil.convertExpressionToPatternFromAST(valueExpr)
                return {
                    type: SlimeJavascriptAstTypeName.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: SlimeJavascriptCstToAstUtil.isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeJavascriptAssignmentProperty
            }
        }

        return null
    }

    /**
     * �?ObjectExpression AST 转换�?ObjectPattern
     */
    static convertObjectExpressionToPattern(expr: any): SlimeJavascriptObjectPattern {
        const properties: SlimeJavascriptObjectPatternProperty[] = []
        for (const prop of expr.properties || []) {
            const property = prop.property || prop
            if (property.type === SlimeJavascriptAstTypeName.SpreadElement) {
                properties.push({
                    property: {
                        type: SlimeJavascriptAstTypeName.RestElement,
                        argument: property.argument,
                        loc: property.loc
                    } as SlimeJavascriptRestElement
                })
            } else {
                const value = SlimeJavascriptCstToAstUtil.convertExpressionToPatternFromAST(property.value)
                properties.push({
                    property: {
                        type: SlimeJavascriptAstTypeName.Property,
                        key: property.key,
                        value: value || property.value,
                        kind: 'init',
                        computed: property.computed,
                        shorthand: property.shorthand,
                        loc: property.loc
                    } as SlimeJavascriptAssignmentProperty
                })
            }
        }
        return {
            type: SlimeJavascriptAstTypeName.ObjectPattern,
            properties,
            lBraceToken: expr.lBraceToken,
            rBraceToken: expr.rBraceToken,
            loc: expr.loc
        } as SlimeJavascriptObjectPattern
    }



    /**
     * �?AssignmentExpression AST 转换�?AssignmentPattern
     */
    static convertAssignmentExpressionToPattern(expr: any): any {
        const left = SlimeJavascriptCstToAstUtil.convertExpressionToPatternFromAST(expr.left)
        return {
            type: SlimeJavascriptAstTypeName.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        }
    }

    /**
     * 将表达式 AST 转换�?Pattern
     */
    static convertExpressionToPatternFromAST(expr: any): SlimeJavascriptPattern | null {
        if (!expr) return null
        if (expr.type === SlimeJavascriptAstTypeName.Identifier) {
            return expr
        } else if (expr.type === SlimeJavascriptAstTypeName.ObjectExpression) {
            return SlimeJavascriptCstToAstUtil.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeJavascriptAstTypeName.ArrayExpression) {
            return SlimeJavascriptCstToAstUtil.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
            return SlimeJavascriptCstToAstUtil.convertAssignmentExpressionToPattern(expr)
        }
        return null
    }

    /**
     * �?ArrayLiteral CST 转换�?ArrayPattern
     */
    static convertArrayLiteralToPattern(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        // 简化实现：使用 createArrayBindingPatternAst 的逻辑
        const elements: SlimeJavascriptArrayPatternElement[] = []
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        // 辅助函数：处�?Elision 节点
        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    // 将逗号关联到前一个元素（如果有）
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(elisionChild.loc)
                    }
                    // 添加一个省略元�?
                    elements.push({ element: null })
                }
            }
        }

        for (const child of cst.children || []) {
            if (child.value === '[') {
                lBracketToken = SlimeJavascriptTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeJavascriptTokenCreate.createRBracketToken(child.loc)
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
                            elements[elements.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(elem.loc)
                        }
                    } else if (elem.name === 'Elision') {
                        // ElementList 内的 Elision
                        processElision(elem)
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = SlimeJavascriptCstToAstUtil.createExpressionAst(elem)
                        const pattern = SlimeJavascriptCstToAstUtil.convertExpressionToPatternFromAST(expr)
                        elements.push({ element: pattern || expr as any })
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = SlimeJavascriptCstToAstUtil.createSpreadElementAst(elem)
                        elements.push({
                            element: {
                                type: SlimeJavascriptAstTypeName.RestElement,
                                argument: restNode.argument,
                                loc: restNode.loc
                            } as SlimeJavascriptRestElement
                        })
                    }
                }
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeJavascriptArrayPattern
    }

    /**
     * 将表达式转换为模式（用于箭头函数参数解构�?
     * ObjectExpression -> ObjectPattern
     * ArrayExpression -> ArrayPattern
     * Identifier -> Identifier
     * SpreadElement -> RestElement
     */
    static convertExpressionToPattern(expr: any): SlimeJavascriptPattern {
        if (!expr) return expr

        if (expr.type === SlimeJavascriptAstTypeName.Identifier) {
            return expr
        }

        if (expr.type === SlimeJavascriptAstTypeName.ObjectExpression) {
            // �?ObjectExpression 转换�?ObjectPattern
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    // SpreadElement -> RestElement
                    properties.push({
                        property: {
                            type: SlimeJavascriptAstTypeName.RestElement,
                            argument: SlimeJavascriptCstToAstUtil.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeJavascriptAstTypeName.Property) {
                    // 转换 Property �?value
                    const convertedValue = SlimeJavascriptCstToAstUtil.convertExpressionToPattern(prop.value)
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
                type: SlimeJavascriptAstTypeName.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any
        }

        if (expr.type === SlimeJavascriptAstTypeName.ArrayExpression) {
            // �?ArrayExpression 转换�?ArrayPattern
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeJavascriptAstTypeName.SpreadElement) {
                    // SpreadElement -> RestElement
                    elements.push({
                        element: {
                            type: SlimeJavascriptAstTypeName.RestElement,
                            argument: SlimeJavascriptCstToAstUtil.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: SlimeJavascriptCstToAstUtil.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeJavascriptAstTypeName.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any
        }

        if (expr.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
            // �?AssignmentExpression 转换�?AssignmentPattern
            return {
                type: SlimeJavascriptAstTypeName.AssignmentPattern,
                left: SlimeJavascriptCstToAstUtil.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeJavascriptAstTypeName.SpreadElement) {
            // SpreadElement -> RestElement
            return {
                type: SlimeJavascriptAstTypeName.RestElement,
                argument: SlimeJavascriptCstToAstUtil.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        // 其他类型直接返回
        return expr
    }


    static createBindingRestElementAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BindingRestElement?.name);
        // BindingRestElement: ... BindingIdentifier | ... BindingPattern
        const argumentCst = cst.children[1]

        let argument: SlimeJavascriptIdentifier | SlimeJavascriptPattern

        if (argumentCst.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name) {
            // 简单情况：...rest
            argument = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(argumentCst)
        } else if (argumentCst.name === SlimeJavascriptParser.prototype.BindingPattern?.name) {
            // 嵌套解构�?..[a, b] �?...{x, y}
            argument = SlimeJavascriptCstToAstUtil.createBindingPatternAst(argumentCst)
        } else {
            throw new Error(`BindingRestElement: 不支持的类型 ${argumentCst.name}`)
        }

        return SlimeJavascriptAstUtil.createRestElement(argument)
    }
}