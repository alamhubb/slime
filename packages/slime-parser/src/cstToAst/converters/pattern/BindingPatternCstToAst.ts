import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimePattern, SlimeArrayPattern, SlimeObjectPattern, SlimeRestElement, SlimeIdentifier, SlimeAssignmentProperty, SlimeArrayPatternElement, SlimeObjectPatternProperty, SlimeLBracketToken, SlimeRBracketToken, SlimeLBraceToken, SlimeRBraceToken, SlimeCommaToken } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * BindingPattern CST 到 AST 转换器
 * 
 * 负责处理：
 * - BindingPattern: 绑定模式
 * - ObjectBindingPattern: 对象解构模式
 * - ArrayBindingPattern: 数组解构模式
 * - BindingPropertyList: 绑定属性列表
 * - BindingProperty: 绑定属性
 * - BindingElementList: 绑定元素列表
 * - BindingElisionElement: 绑定省略元素
 * - BindingElement: 绑定元素
 * - BindingRestElement: 绑定剩余元素
 * - BindingRestProperty: 绑定剩余属性
 * - SingleNameBinding: 单名称绑定
 */
export class BindingPatternCstToAst {

    /**
     * 创建 BindingPattern AST
     */
    static createBindingPatternAst(cst: SubhutiCst): SlimePattern {
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

    /**
     * 创建 ArrayBindingPattern AST
     */
    static createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        checkCstName(cst, SlimeParser.prototype.ArrayBindingPattern?.name)

        const elements: SlimeArrayPatternElement[] = []

        // 提取 LBracket 和 RBracket tokens
        let lBracketToken: SlimeLBracketToken | undefined
        let rBracketToken: SlimeRBracketToken | undefined
        for (const child of cst.children) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            }
        }

        // 查找 BindingElementList
        const bindingList = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingElementList?.name)
        if (bindingList) {
            for (let i = 0; i < bindingList.children.length; i++) {
                const child = bindingList.children[i]
                if (child.value === ',') {
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name) {
                    const elision = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.Elision?.name)
                    if (elision) {
                        for (const elisionChild of elision.children || []) {
                            if (elisionChild.value === ',') {
                                elements.push({
                                    element: null,
                                    commaToken: SlimeTokenCreate.createCommaToken(elisionChild.loc)
                                })
                            }
                        }
                    }

                    const bindingElement = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.BindingElement?.name)

                    if (bindingElement) {
                        const element = SlimeCstToAstUtil.createBindingElementAst(bindingElement)
                        if (element) {
                            elements.push({ element })
                        }
                    }
                }
            }
        }

        // 处理尾部 Comma 和 Elision
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]
            if (child.value === '[' || child.value === ']' ||
                child.name === SlimeParser.prototype.BindingElementList?.name ||
                child.name === SlimeParser.prototype.BindingRestElement?.name) {
                continue
            }

            if (child.value === ',') {
                if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                    elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                }
            }

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

        // 检查 BindingRestElement
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

    /**
     * 创建 ObjectBindingPattern AST
     */
    static createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        checkCstName(cst, SlimeParser.prototype.ObjectBindingPattern?.name)

        const properties: SlimeObjectPatternProperty[] = []

        // 提取 LBrace 和 RBrace tokens
        let lBraceToken: SlimeLBraceToken | undefined
        let rBraceToken: SlimeRBraceToken | undefined
        for (const child of cst.children) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 查找 BindingPropertyList
        const propList = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingPropertyList?.name)
        if (propList) {
            for (let i = 0; i < propList.children.length; i++) {
                const child = propList.children[i]
                if (child.value === ',') {
                    if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                        properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    }
                } else if (child.name === SlimeParser.prototype.BindingProperty?.name) {
                    const singleName = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.SingleNameBinding?.name)

                    if (singleName) {
                        const value = this.createSingleNameBindingAst(singleName)
                        const identifier = singleName.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingIdentifier?.name)
                        const key = SlimeCstToAstUtil.createBindingIdentifierAst(identifier)

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
                        const propName = child.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.PropertyName?.name)
                        const bindingElement = child.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingElement?.name)

                        if (propName && bindingElement) {
                            const key = SlimeCstToAstUtil.createPropertyNameAst(propName)
                            const value = SlimeCstToAstUtil.createBindingElementAst(bindingElement)
                            const isComputed = SlimeCstToAstUtil.isComputedPropertyName(propName)

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

        // 检查 BindingRestProperty
        const restProp = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingRestProperty?.name)
        if (restProp) {
            const restNode = this.createBindingRestPropertyAst(restProp)
            properties.push({ property: restNode as any })
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
     * 创建 SingleNameBinding AST
     */
    static createSingleNameBindingAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.SingleNameBinding?.name);
        const bindingIdentifier = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name)
        const initializer = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name)

        if (!bindingIdentifier) {
            throw new Error('SingleNameBinding missing BindingIdentifier')
        }

        const id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingIdentifier)

        if (initializer) {
            const init = SlimeCstToAstUtil.createInitializerAst(initializer)
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
     * 创建 BindingRestElement AST
     */
    static createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        checkCstName(cst, SlimeParser.prototype.BindingRestElement?.name);
        const argumentCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === SlimeParser.prototype.BindingPattern?.name)

        if (!argumentCst) {
            throw new Error('BindingRestElement missing argument')
        }

        let argument: SlimePattern
        if (argumentCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            argument = SlimeCstToAstUtil.createBindingIdentifierAst(argumentCst)
        } else if (argumentCst.name === SlimeParser.prototype.BindingPattern?.name) {
            argument = this.createBindingPatternAst(argumentCst)
        } else {
            throw new Error(`BindingRestElement: unsupported type ${argumentCst.name}`)
        }

        return SlimeAstUtil.createRestElement(argument, cst.loc)
    }

    /**
     * 创建 BindingRestProperty AST
     */
    static createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        const argument = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier')

        if (!argument) {
            throw new Error('BindingRestProperty missing BindingIdentifier')
        }

        const id = SlimeCstToAstUtil.createBindingIdentifierAst(argument)
        return SlimeAstUtil.createRestElement(id, cst.loc)
    }

    /**
     * 创建 BindingPropertyList AST
     */
    static createBindingPropertyListAst(cst: SubhutiCst): any[] {
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
     * 创建 BindingProperty AST
     */
    static createBindingPropertyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const singleNameBinding = children.find(ch =>
            ch.name === SlimeParser.prototype.SingleNameBinding?.name ||
            ch.name === 'SingleNameBinding')
        if (singleNameBinding) {
            return this.createSingleNameBindingAst(singleNameBinding)
        }

        const propName = children.find(ch =>
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName')
        const bindingElement = children.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement')

        if (propName && bindingElement) {
            const key = SlimeCstToAstUtil.createPropertyNameAst(propName)
            const value = SlimeCstToAstUtil.createBindingElementAst(bindingElement)
            const isComputed = SlimeCstToAstUtil.isComputedPropertyName(propName)

            return {
                type: SlimeNodeType.Property,
                key: key,
                value: value,
                kind: 'init',
                computed: isComputed,
                shorthand: false,
                loc: cst.loc
            }
        }

        throw new Error('BindingProperty: invalid structure')
    }

    /**
     * 创建 BindingElementList AST
     */
    static createBindingElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.BindingElement?.name ||
                child.name === 'BindingElement') {
                elements.push(SlimeCstToAstUtil.createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name ||
                child.name === 'BindingRestElement') {
                elements.push(this.createBindingRestElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name ||
                child.name === 'BindingElisionElement') {
                elements.push(this.createBindingElisionElementAst(child))
            }
        }
        return elements
    }

    /**
     * 创建 BindingElisionElement AST
     */
    static createBindingElisionElementAst(cst: SubhutiCst): any {
        const bindingElement = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement')

        if (bindingElement) {
            return SlimeCstToAstUtil.createBindingElementAst(bindingElement)
        }

        return null
    }
}
