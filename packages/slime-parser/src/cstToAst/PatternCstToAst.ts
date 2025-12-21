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
    type SlimeCommaToken,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeExpression;
    createInitializerAst(cst: SubhutiCst): SlimeExpression;
    isComputedPropertyName(cst: SubhutiCst): boolean;
};

/**
 * 解构模式相关的 CST to AST 转换
 */
export class PatternCstToAst {
    /**
     * 创建 BindingPattern 的 AST
     */
    static createBindingPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimePattern {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BindingPattern?.name)

        const child = cst.children[0]

        if (child.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
            return PatternCstToAst.createArrayBindingPatternAst(child, converter)
        } else if (child.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            return PatternCstToAst.createObjectBindingPatternAst(child, converter)
        } else {
            throw new Error(`Unknown BindingPattern type: ${child.name}`)
        }
    }


    /**
     * 创建 ArrayBindingPattern 的 AST
     */
    static createArrayBindingPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeArrayPattern {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ArrayBindingPattern?.name)

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
                    // 处理 Elision
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

                    // 处理 BindingElement
                    const bindingElement = child.children.find((ch: any) =>
                        ch.name === SlimeParser.prototype.BindingElement?.name)
                    if (bindingElement) {
                        const element = PatternCstToAst.createBindingElementAst(bindingElement, converter)
                        if (element) {
                            elements.push({ element })
                        }
                    }
                }
            }
        }

        // 处理直接子节点中的 Comma 和 Elision
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

        // 处理 BindingRestElement
        const restElement = cst.children.find(ch => ch.name === SlimeParser.prototype.BindingRestElement?.name)
        if (restElement) {
            const restNode = PatternCstToAst.createBindingRestElementAst(restElement, converter)
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
     * 创建 ObjectBindingPattern 的 AST
     */
    static createObjectBindingPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeObjectPattern {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ObjectBindingPattern?.name)

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
                        // 简写形式：{name} 或 {name = "Guest"}
                        const value = PatternCstToAst.createSingleNameBindingAst(singleName, converter)
                        const identifier = singleName.children.find((ch: any) =>
                            ch.name === SlimeParser.prototype.BindingIdentifier?.name)
                        const key = converter.createBindingIdentifierAst(identifier)

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
                            const key = converter.createPropertyNameAst(propName)
                            const value = PatternCstToAst.createBindingElementAst(bindingElement, converter)
                            const isComputed = converter.isComputedPropertyName(propName)

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

        // 处理外层逗号
        for (const child of cst.children) {
            if (child.value === ',') {
                if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                    properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                }
            }
        }

        // ES2018: 处理 BindingRestElement 或 BindingRestProperty
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
                const restId = converter.createBindingIdentifierAst(identifier)
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
     * 创建 BindingElement 的 AST
     */
    static createBindingElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BindingElement?.name)
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.SingleNameBinding?.name) {
            return PatternCstToAst.createSingleNameBindingAst(first, converter)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name ||
                   first.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
                   first.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            // 解构参数
            const initializer = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer')
            let pattern: SlimePattern
            if (first.name === SlimeParser.prototype.BindingPattern?.name) {
                pattern = PatternCstToAst.createBindingPatternAst(first, converter)
            } else if (first.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
                pattern = PatternCstToAst.createArrayBindingPatternAst(first, converter)
            } else {
                pattern = PatternCstToAst.createObjectBindingPatternAst(first, converter)
            }

            if (initializer) {
                const init = converter.createInitializerAst(initializer)
                return {
                    type: SlimeNodeType.AssignmentPattern,
                    left: pattern,
                    right: init,
                    loc: cst.loc
                }
            }
            return pattern
        }
        return PatternCstToAst.createSingleNameBindingAst(first, converter)
    }

    /**
     * 创建 SingleNameBinding 的 AST
     */
    static createSingleNameBindingAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.SingleNameBinding?.name)
        const first = cst.children[0]
        const id = converter.createBindingIdentifierAst(first)

        const initializer = cst.children.find(ch => ch.name === SlimeParser.prototype.Initializer?.name)
        if (initializer) {
            const init = converter.createInitializerAst(initializer)
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
     * 创建 BindingRestElement 的 AST
     */
    static createBindingRestElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeRestElement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BindingRestElement?.name)
        const argumentCst = cst.children[1]

        let argument: SlimeIdentifier | SlimePattern

        if (argumentCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            argument = converter.createBindingIdentifierAst(argumentCst)
        } else if (argumentCst.name === SlimeParser.prototype.BindingPattern?.name) {
            argument = PatternCstToAst.createBindingPatternAst(argumentCst, converter)
        } else {
            throw new Error(`BindingRestElement: 不支持的类型 ${argumentCst.name}`)
        }

        return SlimeAstUtil.createRestElement(argument)
    }

    /**
     * 创建 BindingRestProperty 的 AST
     */
    static createBindingRestPropertyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeRestElement {
        const argument = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        const id = argument ? converter.createBindingIdentifierAst(argument) : null

        return SlimeAstUtil.createRestElement(id as any)
    }


    /**
     * 创建 BindingProperty 的 AST
     */
    static createBindingPropertyAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        const children = cst.children || []

        const singleNameBinding = children.find(ch =>
            ch.name === SlimeParser.prototype.SingleNameBinding?.name ||
            ch.name === 'SingleNameBinding'
        )
        if (singleNameBinding) {
            return PatternCstToAst.createSingleNameBindingAst(singleNameBinding, converter)
        }

        const propertyName = children.find(ch =>
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )
        const bindingElement = children.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )

        const key = propertyName ? converter.createPropertyNameAst(propertyName) : null
        const value = bindingElement ? PatternCstToAst.createBindingElementAst(bindingElement, converter) : null

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
     * 创建 BindingPropertyList 的 AST
     */
    static createBindingPropertyListAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.BindingProperty?.name ||
                child.name === 'BindingProperty') {
                properties.push(PatternCstToAst.createBindingPropertyAst(child, converter))
            }
        }
        return properties
    }

    /**
     * 创建 BindingElementList 的 AST
     */
    static createBindingElementListAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.BindingElement?.name ||
                child.name === 'BindingElement') {
                elements.push(PatternCstToAst.createBindingElementAst(child, converter))
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name ||
                child.name === 'BindingRestElement') {
                elements.push(PatternCstToAst.createBindingRestElementAst(child, converter))
            } else if (child.name === SlimeParser.prototype.BindingElisionElement?.name ||
                child.name === 'BindingElisionElement') {
                elements.push(null)
                const bindingElement = child.children?.find((ch: SubhutiCst) =>
                    ch.name === SlimeParser.prototype.BindingElement?.name ||
                    ch.name === 'BindingElement'
                )
                if (bindingElement) {
                    elements.push(PatternCstToAst.createBindingElementAst(bindingElement, converter))
                }
            }
        }
        return elements
    }

    /**
     * 创建 BindingElisionElement 的 AST
     */
    static createBindingElisionElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        const bindingElement = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingElement?.name ||
            ch.name === 'BindingElement'
        )
        if (bindingElement) {
            return PatternCstToAst.createBindingElementAst(bindingElement, converter)
        }
        return null
    }


    // ==================== Assignment Pattern 相关方法 ====================

    /**
     * 创建 AssignmentPattern 的 AST
     */
    static createAssignmentPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return PatternCstToAst.createObjectAssignmentPatternAst(firstChild, converter) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return PatternCstToAst.createArrayAssignmentPatternAst(firstChild, converter) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * 创建 ObjectAssignmentPattern 的 AST
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeObjectPattern {
        return PatternCstToAst.createObjectBindingPatternAst(cst, converter)
    }

    /**
     * 创建 ArrayAssignmentPattern 的 AST
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeArrayPattern {
        return PatternCstToAst.createArrayBindingPatternAst(cst, converter)
    }

    /**
     * 创建 AssignmentPropertyList 的 AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(PatternCstToAst.createAssignmentPropertyAst(child, converter))
            }
        }
        return properties
    }

    /**
     * 创建 AssignmentProperty 的 AST
     */
    static createAssignmentPropertyAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        return PatternCstToAst.createBindingPropertyAst(cst, converter)
    }

    /**
     * 创建 AssignmentElementList 的 AST
     */
    static createAssignmentElementListAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        return PatternCstToAst.createBindingElementListAst(cst, converter)
    }

    /**
     * 创建 AssignmentElement 的 AST
     */
    static createAssignmentElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        return PatternCstToAst.createBindingElementAst(cst, converter)
    }

    /**
     * 创建 AssignmentElisionElement 的 AST
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        return PatternCstToAst.createBindingElisionElementAst(cst, converter)
    }

    /**
     * 创建 AssignmentRestElement 的 AST
     */
    static createAssignmentRestElementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        return PatternCstToAst.createBindingRestElementAst(cst, converter)
    }

    /**
     * 创建 AssignmentRestProperty 的 AST
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        return PatternCstToAst.createBindingRestPropertyAst(cst, converter)
    }
}
