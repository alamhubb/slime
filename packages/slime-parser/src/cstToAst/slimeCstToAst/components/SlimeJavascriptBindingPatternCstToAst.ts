/**
 * BindingPatternCstToAst - 绑定模式转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeJavascriptArrayPattern,
    SlimeJavascriptAstUtil, type SlimeJavascriptBlockStatement, type SlimeJavascriptExpressionStatement,
    type SlimeJavascriptFunctionExpression, type SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, type SlimeJavascriptObjectPattern,
    SlimeJavascriptPattern,
    SlimeJavascriptRestElement, type SlimeJavascriptReturnStatement,
    type SlimeJavascriptStatement, SlimeJavascriptTokenCreate, SlimeJavascriptAstTypeName,
    type SlimeJavascriptArrayPatternElement, type SlimeJavascriptLBracketToken, type SlimeJavascriptRBracketToken,
    type SlimeJavascriptCommaToken, type SlimeJavascriptLBraceToken, type SlimeJavascriptRBraceToken,
    type SlimeJavascriptObjectPatternProperty, type SlimeJavascriptAssignmentProperty
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptBindingPatternCstToAstSingle {

    createBindingElementAst(cst: SubhutiCst): any {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BindingElement?.name);
        const first = cst.children[0]

        if (first.name === SlimeJavascriptParser.prototype.SingleNameBinding?.name) {
            return SlimeJavascriptCstToAstUtil.createSingleNameBindingAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.BindingPattern?.name ||
            first.name === SlimeJavascriptParser.prototype.ArrayBindingPattern?.name ||
            first.name === SlimeJavascriptParser.prototype.ObjectBindingPattern?.name) {
            // 解构参数：function({name, age}) �?function([a, b])
            // 检查是否有 Initializer（默认值）
            const initializer = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Initializer?.name || ch.name === 'Initializer')
            let pattern: SlimeJavascriptPattern
            if (first.name === SlimeJavascriptParser.prototype.BindingPattern?.name) {
                pattern = SlimeJavascriptCstToAstUtil.createBindingPatternAst(first)
            } else if (first.name === SlimeJavascriptParser.prototype.ArrayBindingPattern?.name) {
                pattern = SlimeJavascriptCstToAstUtil.createArrayBindingPatternAst(first)
            } else {
                pattern = SlimeJavascriptCstToAstUtil.createObjectBindingPatternAst(first)
            }

            if (initializer) {
                // 有默认值，创建 AssignmentPattern
                const init = SlimeJavascriptCstToAstUtil.createInitializerAst(initializer)
                return {
                    type: SlimeJavascriptAstTypeName.AssignmentPattern,
                    left: pattern,
                    right: init,
                    loc: cst.loc
                }
            }
            return pattern
        }
        return SlimeJavascriptCstToAstUtil.createSingleNameBindingAst(first)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.SingleNameBinding?.name);
        //BindingIdentifier + Initializer?
        const first = cst.children[0]
        const id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(first)

        // 检查是否有默认值（Initializer�?
        const initializer = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Initializer?.name)
        if (initializer) {
            // 有默认值，创建AssignmentPattern
            const init = SlimeJavascriptCstToAstUtil.createInitializerAst(initializer)
            return {
                type: SlimeJavascriptAstTypeName.AssignmentPattern,
                left: id,
                right: init,
                loc: cst.loc
            }
        }

        return id
    }


    /**
     * BindingRestProperty CST �?AST
     */
    createBindingRestPropertyAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        const argument = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        const id = argument ? SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(argument) : null

        return SlimeJavascriptAstUtil.createRestElement(id as any)
    }

    /**
     * BindingProperty CST �?AST
     * BindingProperty -> SingleNameBinding | PropertyName : BindingElement
     */
    createBindingPropertyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 SingleNameBinding
        const singleNameBinding = children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.SingleNameBinding?.name ||
            ch.name === 'SingleNameBinding'
        )
        if (singleNameBinding) {
            return SlimeJavascriptCstToAstUtil.createSingleNameBindingAst(singleNameBinding)
        }

        // 否则�?PropertyName : BindingElement
        const propertyName = children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )
        const bindingElement = children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )

        const key = propertyName ? SlimeJavascriptCstToAstUtil.createPropertyNameAst(propertyName) : null
        const value = bindingElement ? SlimeJavascriptCstToAstUtil.createBindingElementAst(bindingElement) : null

        return {
            type: SlimeJavascriptAstTypeName.Property,
            key: key,
            value: value,
            kind: 'init',
            method: false,
            shorthand: false,
            computed: false,
            loc: cst.loc
        }
    }

    /**
     * BindingPropertyList CST 转 AST
     */
    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.BindingProperty?.name ||
                child.name === 'BindingProperty') {
                properties.push(SlimeJavascriptCstToAstUtil.createBindingPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * BindingElementList CST �?AST
     */
    createBindingElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.BindingElement?.name ||
                child.name === 'BindingElement') {
                elements.push(SlimeJavascriptCstToAstUtil.createBindingElementAst(child))
            } else if (child.name === SlimeJavascriptParser.prototype.BindingRestElement?.name ||
                child.name === 'BindingRestElement') {
                elements.push(SlimeJavascriptCstToAstUtil.createBindingRestElementAst(child))
            } else if (child.name === SlimeJavascriptParser.prototype.BindingElisionElement?.name ||
                child.name === 'BindingElisionElement') {
                // Elision 后跟 BindingElement
                elements.push(null) // 空位
                const bindingElement = child.children?.find((ch: SubhutiCst) =>
                    ch.name === SlimeJavascriptParser.prototype.BindingElement?.name ||
                    ch.name === 'BindingElement'
                )
                if (bindingElement) {
                    elements.push(SlimeJavascriptCstToAstUtil.createBindingElementAst(bindingElement))
                }
            }
        }
        return elements
    }

    /**
     * BindingElisionElement CST �?AST
     */
    createBindingElisionElementAst(cst: SubhutiCst): any {
        const bindingElement = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )
        if (bindingElement) {
            return SlimeJavascriptCstToAstUtil.createBindingElementAst(bindingElement)
        }
        return null
    }




    createBindingPatternAst(cst: SubhutiCst): SlimeJavascriptPattern {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BindingPattern?.name)

        const child = cst.children[0]

        if (child.name === SlimeJavascriptParser.prototype.ArrayBindingPattern?.name) {
            return SlimeJavascriptCstToAstUtil.createArrayBindingPatternAst(child)
        } else if (child.name === SlimeJavascriptParser.prototype.ObjectBindingPattern?.name) {
            return SlimeJavascriptCstToAstUtil.createObjectBindingPatternAst(child)
        } else {
            throw new Error(`Unknown BindingPattern type: ${child.name}`)
        }
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ArrayBindingPattern?.name)

        // CST结构：[LBracket, BindingElementList?, Comma?, Elision?, BindingRestElement?, RBracket]
        const elements: SlimeJavascriptArrayPatternElement[] = []

        // 提取 LBracket �?RBracket tokens
        let lBracketToken: SlimeJavascriptLBracketToken | undefined
        let rBracketToken: SlimeJavascriptRBracketToken | undefined
        for (const child of cst.children) {
            if (child.value === '[') {
                lBracketToken = SlimeJavascriptTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeJavascriptTokenCreate.createRBracketToken(child.loc)
            }
        }

        // 查找BindingElementList
        const bindingList = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.BindingElementList?.name)
        if (bindingList) {
            // BindingElementList包含BindingElisionElement和Comma
            let pendingCommaToken: SlimeJavascriptCommaToken | undefined
            for (let i = 0; i < bindingList.children.length; i++) {
                const child = bindingList.children[i]
                if (child.value === ',') {
                    // 如果有待处理的元素，将逗号关联到它
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    } else {
                        pendingCommaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeJavascriptParser.prototype.BindingElisionElement?.name) {
                    // BindingElisionElement可能包含：Elision + BindingElement
                    // 先检查是否有Elision（跳过的元素�?
                    const elision = child.children.find((ch: any) =>
                        ch.name === SlimeJavascriptParser.prototype.Elision?.name)
                    if (elision) {
                        // Elision可能包含多个逗号，每个逗号代表一个null
                        for (const elisionChild of elision.children || []) {
                            if (elisionChild.value === ',') {
                                elements.push({
                                    element: null,
                                    commaToken: SlimeJavascriptTokenCreate.createCommaToken(elisionChild.loc)
                                })
                            }
                        }
                    }

                    // 然后检查是否有BindingElement
                    const bindingElement = child.children.find((ch: any) =>
                        ch.name === SlimeJavascriptParser.prototype.BindingElement?.name)

                    if (bindingElement) {
                        // 使用 createBindingElementAst 正确处理 BindingElement（包�?Initializer�?
                        const element = SlimeJavascriptCstToAstUtil.createBindingElementAst(bindingElement)
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
                child.name === SlimeJavascriptParser.prototype.BindingElementList?.name ||
                child.name === SlimeJavascriptParser.prototype.BindingRestElement?.name) {
                continue
            }

            // 处理 BindingElementList 之后�?Comma
            if (child.value === ',') {
                // 将逗号关联到最后一个元�?
                if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                    elements[elements.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                }
            }

            // 处理尾部�?Elision
            if (child.name === SlimeJavascriptParser.prototype.Elision?.name || child.name === 'Elision') {
                for (const elisionChild of child.children || []) {
                    if (elisionChild.value === ',') {
                        elements.push({
                            element: null,
                            commaToken: SlimeJavascriptTokenCreate.createCommaToken(elisionChild.loc)
                        })
                    }
                }
            }
        }

        // 检查是否有BindingRestElement�?..rest �?...[a, b]�?
        const restElement = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.BindingRestElement?.name)
        if (restElement) {
            const restNode = SlimeJavascriptCstToAstUtil.createBindingRestElementAst(restElement)
            elements.push({ element: restNode as any })
        }

        return {
            type: SlimeJavascriptAstTypeName.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeJavascriptArrayPattern
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ObjectBindingPattern?.name)

        // CST结构：[LBrace, BindingPropertyList?, RBrace]
        const properties: SlimeJavascriptObjectPatternProperty[] = []

        // 提取 LBrace �?RBrace tokens
        let lBraceToken: SlimeJavascriptLBraceToken | undefined
        let rBraceToken: SlimeJavascriptRBraceToken | undefined
        for (const child of cst.children) {
            if (child.value === '{') {
                lBraceToken = SlimeJavascriptTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 查找BindingPropertyList
        const propList = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.BindingPropertyList?.name)
        if (propList) {
            // BindingPropertyList包含BindingProperty和Comma节点
            for (let i = 0; i < propList.children.length; i++) {
                const child = propList.children[i]
                if (child.value === ',') {
                    // 将逗号关联到前一个属�?
                    if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                        properties[properties.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeJavascriptParser.prototype.BindingProperty?.name) {
                    // BindingProperty -> SingleNameBinding (简�? �?PropertyName + BindingElement (完整)
                    const singleName = child.children.find((ch: any) =>
                        ch.name === SlimeJavascriptParser.prototype.SingleNameBinding?.name)

                    if (singleName) {
                        // 简写形式：{name} �?{name = "Guest"}
                        const value = SlimeJavascriptCstToAstUtil.createSingleNameBindingAst(singleName)
                        const identifier = singleName.children.find((ch: any) =>
                            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name)
                        const key = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(identifier)

                        properties.push({
                            property: {
                                type: SlimeJavascriptAstTypeName.Property,
                                key: key,
                                value: value,
                                kind: 'init',
                                computed: false,
                                shorthand: true,
                                loc: child.loc
                            } as SlimeJavascriptAssignmentProperty
                        })
                    } else {
                        // 完整形式：{name: userName}
                        const propName = child.children.find((ch: any) =>
                            ch.name === SlimeJavascriptParser.prototype.PropertyName?.name)
                        const bindingElement = child.children.find((ch: any) =>
                            ch.name === SlimeJavascriptParser.prototype.BindingElement?.name)

                        if (propName && bindingElement) {
                            const key = SlimeJavascriptCstToAstUtil.createPropertyNameAst(propName)
                            const value = SlimeJavascriptCstToAstUtil.createBindingElementAst(bindingElement)
                            const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(propName)

                            properties.push({
                                property: {
                                    type: SlimeJavascriptAstTypeName.Property,
                                    key: key,
                                    value: value,
                                    kind: 'init',
                                    computed: isComputed,
                                    shorthand: false,
                                    loc: child.loc
                                } as SlimeJavascriptAssignmentProperty
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
                    properties[properties.length - 1].commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                }
            }
        }

        // ES2018: 检查是否有BindingRestElement �?BindingRestProperty�?..rest�?
        const restElement = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingRestElement?.name ||
            ch.name === 'BindingRestElement' ||
            ch.name === SlimeJavascriptParser.prototype.BindingRestProperty?.name ||
            ch.name === 'BindingRestProperty'
        )
        if (restElement) {
            const identifier = restElement.children.find((ch: any) =>
                ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name ||
                ch.name === 'BindingIdentifier'
            )
            if (identifier) {
                const restId = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(identifier)
                // 提取 ellipsis token
                const ellipsisCst = restElement.children.find((ch: any) => ch.value === '...')
                const ellipsisToken = ellipsisCst ? SlimeJavascriptTokenCreate.createEllipsisToken(ellipsisCst.loc) : undefined
                const restNode: SlimeJavascriptRestElement = {
                    type: SlimeJavascriptAstTypeName.RestElement,
                    argument: restId,
                    ellipsisToken,
                    loc: restElement.loc
                }
                properties.push({ property: restNode })
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
}

export const SlimeJavascriptBindingPatternCstToAst = new SlimeJavascriptBindingPatternCstToAstSingle()
