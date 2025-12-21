import {
    type SlimePattern,
    type SlimeArrayPattern,
    type SlimeObjectPattern,
    type SlimeRestElement,
    type SlimeAssignmentProperty,
    type SlimeArrayPatternElement,
    type SlimeObjectPatternProperty,
    type SlimeLBracketToken,
    type SlimeRBracketToken,
    type SlimeLBraceToken,
    type SlimeRBraceToken,
    type SlimeCommaToken,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import SlimeParser from "../SlimeParser";
import { checkCstName } from "../SlimeCstToAstUtil.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setBindingPatternCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for BindingPatternCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * Binding Pattern 相关的 CST to AST 转换
 * 包含 BindingPattern、ArrayBindingPattern、ObjectBindingPattern 等方法
 */
export class BindingPatternCstToAst {

    static createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        checkCstName(cst, SlimeParser.prototype.BindingPattern?.name)

        const child = cst.children[0]

        if (child.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
            return BindingPatternCstToAst.createArrayBindingPatternAst(child)
        } else if (child.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            return BindingPatternCstToAst.createObjectBindingPatternAst(child)
        } else {
            throw new Error(`Unknown BindingPattern type: ${child.name}`)
        }
    }

    static createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        checkCstName(cst, SlimeParser.prototype.ArrayBindingPattern?.name)

        const elements: SlimeArrayPatternElement[] = []
        let lBracketToken: SlimeLBracketToken | undefined
        let rBracketToken: SlimeRBracketToken | undefined

        for (const child of cst.children) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            }
        }

        const bindingList = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingElementList?.name)
        if (bindingList) {
            let pendingCommaToken: SlimeCommaToken | undefined
            for (let i = 0; i < bindingList.children.length; i++) {
                const child = bindingList.children[i]
                if (child.value === ',') {
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    } else {
                        pendingCommaToken = SlimeTokenCreate.createCommaToken(child.loc)
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
                        const element = getUtil().createBindingElementAst(bindingElement)
                        if (element) {
                            elements.push({ element })
                        }
                    }
                }
            }
        }

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

        const restElement = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingRestElement?.name)
        if (restElement) {
            const restNode = getUtil().createBindingRestElementAst(restElement)
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

    static createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        checkCstName(cst, SlimeParser.prototype.ObjectBindingPattern?.name)

        const properties: SlimeObjectPatternProperty[] = []
        let lBraceToken: SlimeLBraceToken | undefined
        let rBraceToken: SlimeRBraceToken | undefined

        for (const child of cst.children) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

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
                        const value = getUtil().createSingleNameBindingAst(singleName)
                        const identifier = singleName.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingIdentifier?.name)
                        const key = getUtil().createBindingIdentifierAst(identifier)

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
                            const key = getUtil().createPropertyNameAst(propName)
                            const value = getUtil().createBindingElementAst(bindingElement)
                            const isComputed = getUtil().isComputedPropertyName(propName)

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

        for (const child of cst.children) {
            if (child.value === ',') {
                if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                    properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                }
            }
        }

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
                const restId = getUtil().createBindingIdentifierAst(identifier)
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

    /**
     * ObjectAssignmentPattern CST 到 AST
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return BindingPatternCstToAst.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST 到 AST
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return BindingPatternCstToAst.createArrayBindingPatternAst(cst)
    }

    /**
     * BindingProperty CST 转 AST
     */
    static createBindingPropertyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const singleNameBinding = children.find(ch =>
            ch.name === SlimeParser.prototype.SingleNameBinding?.name ||
            ch.name === 'SingleNameBinding'
        )
        if (singleNameBinding) {
            return getUtil().createSingleNameBindingAst(singleNameBinding)
        }

        const propertyName = children.find(ch =>
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )
        const bindingElement = children.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )

        const key = propertyName ? getUtil().createPropertyNameAst(propertyName) : null
        const value = bindingElement ? getUtil().createBindingElementAst(bindingElement) : null

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
    static createBindingPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.BindingProperty?.name ||
                child.name === 'BindingProperty') {
                properties.push(BindingPatternCstToAst.createBindingPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * BindingElementList CST 转 AST
     */
    static createBindingElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.BindingElement?.name ||
                child.name === 'BindingElement') {
                elements.push(getUtil().createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name ||
                child.name === 'BindingRestElement') {
                elements.push(getUtil().createBindingRestElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name ||
                child.name === 'BindingElisionElement') {
                elements.push(null)
                const bindingElement = child.children?.find((ch: SubhutiCst) =>
                    ch.name === SlimeParser.prototype.BindingElement?.name ||
                    ch.name === 'BindingElement'
                )
                if (bindingElement) {
                    elements.push(getUtil().createBindingElementAst(bindingElement))
                }
            }
        }
        return elements
    }

    /**
     * BindingElisionElement CST 转 AST
     */
    static createBindingElisionElementAst(cst: SubhutiCst): any {
        const bindingElement = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )
        if (bindingElement) {
            return getUtil().createBindingElementAst(bindingElement)
        }
        return null
    }

    /**
     * BindingRestProperty CST 转 AST
     */
    static createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        const argument = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        const id = argument ? getUtil().createBindingIdentifierAst(argument) : null

        return SlimeAstUtil.createRestElement(id as any)
    }
}
