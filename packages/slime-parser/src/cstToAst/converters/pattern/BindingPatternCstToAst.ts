/**
 * BindingPatternCstToAst - 绑定模式转换
 */
import {SubhutiCst} from "subhuti";
import {
    type SlimeArrayPattern,
    SlimeAstUtil, type SlimeBlockStatement, type SlimeExpressionStatement,
    type SlimeFunctionExpression, type SlimeFunctionParam,
    SlimeIdentifier, type SlimeObjectPattern,
    SlimePattern,
    SlimeRestElement, type SlimeReturnStatement,
    type SlimeStatement, SlimeTokenCreate
} from "slime-ast";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export class BindingPatternCstToAst {

    createBindingElementAst(cst: SubhutiCst): any {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BindingElement?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.SingleNameBinding?.name) {
            return this.createSingleNameBindingAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name ||
            first.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
            first.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            // 解构参数：function({name, age}) �?function([a, b])
            // 检查是否有 Initializer（默认值）
            const initializer = cst.children.find(ch => ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer')
            let pattern: SlimePattern
            if (first.name === SlimeParser.prototype.BindingPattern?.name) {
                pattern = this.createBindingPatternAst(first)
            } else if (first.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
                pattern = this.createArrayBindingPatternAst(first)
            } else {
                pattern = this.createObjectBindingPatternAst(first)
            }

            if (initializer) {
                // 有默认值，创建 AssignmentPattern
                const init = this.createInitializerAst(initializer)
                return {
                    type: SlimeNodeType.AssignmentPattern,
                    left: pattern,
                    right: init,
                    loc: cst.loc
                }
            }
            return pattern
        }
        return this.createSingleNameBindingAst(first)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.SingleNameBinding?.name);
        //BindingIdentifier + Initializer?
        const first = cst.children[0]
        const id = this.createBindingIdentifierAst(first)

        // 检查是否有默认值（Initializer�?
        const initializer = cst.children.find(ch => ch.name === SlimeParser.prototype.Initializer?.name)
        if (initializer) {
            // 有默认值，创建AssignmentPattern
            const init = this.createInitializerAst(initializer)
            return {
                type: SlimeNodeType.AssignmentPattern,
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
    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        const argument = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        const id = argument ? this.createBindingIdentifierAst(argument) : null

        return SlimeAstUtil.createRestElement(id as any)
    }

    /**
     * BindingProperty CST �?AST
     * BindingProperty -> SingleNameBinding | PropertyName : BindingElement
     */
    createBindingPropertyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 SingleNameBinding
        const singleNameBinding = children.find(ch =>
            ch.name === SlimeParser.prototype.SingleNameBinding?.name ||
            ch.name === 'SingleNameBinding'
        )
        if (singleNameBinding) {
            return this.createSingleNameBindingAst(singleNameBinding)
        }

        // 否则�?PropertyName : BindingElement
        const propertyName = children.find(ch =>
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )
        const bindingElement = children.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )

        const key = propertyName ? this.createPropertyNameAst(propertyName) : null
        const value = bindingElement ? this.createBindingElementAst(bindingElement) : null

        return {
            type: SlimeNodeType.Property,
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
            if (child.name === SlimeParser.prototype.BindingProperty?.name ||
                child.name === 'BindingProperty') {
                properties.push(this.createBindingPropertyAst(child))
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
            if (child.name === SlimeParser.prototype.BindingElement?.name ||
                child.name === 'BindingElement') {
                elements.push(this.createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name ||
                child.name === 'BindingRestElement') {
                elements.push(this.createBindingRestElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name ||
                child.name === 'BindingElisionElement') {
                // Elision 后跟 BindingElement
                elements.push(null) // 空位
                const bindingElement = child.children?.find((ch: SubhutiCst) =>
                    ch.name === SlimeParser.prototype.BindingElement?.name ||
                    ch.name === 'BindingElement'
                )
                if (bindingElement) {
                    elements.push(this.createBindingElementAst(bindingElement))
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
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )
        if (bindingElement) {
            return this.createBindingElementAst(bindingElement)
        }
        return null
    }




    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BindingPattern?.name)

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
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArrayBindingPattern?.name)

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
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ObjectBindingPattern?.name)

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
}
