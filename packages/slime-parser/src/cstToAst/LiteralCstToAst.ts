import {
    type SlimeLiteral,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
    type SlimeExpression,
    type SlimeArrayExpression,
    type SlimeObjectExpression,
    type SlimeArrayElement,
    type SlimeObjectPropertyItem,
    type SlimeSpreadElement,
    type SlimeProperty,
    type SlimeIdentifier,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import { IdentifierCstToAst } from "./IdentifierCstToAst";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createExpressionAst(cst: SubhutiCst): SlimeExpression;
    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement;
    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty;
    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression;
};

/**
 * 字面量相关的 CST to AST 转换
 */
export class LiteralCstToAst {
    /**
     * 创建 Literal 的 AST
     */
    static createLiteralAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeLiteral {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.Literal?.name);
        const firstChild = cst.children[0]
        let value: SlimeLiteral

        const childName = firstChild.name

        // 直接是 token 的情况
        if (childName === SlimeTokenConsumer.prototype.NumericLiteral?.name || childName === 'NumericLiteral') {
            const rawValue = firstChild.value as string
            value = SlimeAstUtil.createNumericLiteral(Number(rawValue), rawValue)
        } else if (childName === SlimeTokenConsumer.prototype.True?.name || childName === 'True') {
            value = SlimeAstUtil.createBooleanLiteral(true)
        } else if (childName === SlimeTokenConsumer.prototype.False?.name || childName === 'False') {
            value = SlimeAstUtil.createBooleanLiteral(false)
        } else if (childName === SlimeTokenConsumer.prototype.NullLiteral?.name || childName === 'NullLiteral' || childName === 'Null') {
            value = SlimeAstUtil.createNullLiteralToken()
        } else if (childName === SlimeTokenConsumer.prototype.StringLiteral?.name || childName === 'StringLiteral') {
            const rawValue = firstChild.value as string
            value = SlimeAstUtil.createStringLiteral(rawValue, firstChild.loc, rawValue)
        }
        // 包装节点的情况
        else if (childName === 'BooleanLiteral' || childName === SlimeParser.prototype.BooleanLiteral?.name) {
            const innerChild = firstChild.children?.[0]
            if (innerChild?.name === 'True' || innerChild?.value === 'true') {
                value = SlimeAstUtil.createBooleanLiteral(true)
            } else {
                value = SlimeAstUtil.createBooleanLiteral(false)
            }
            value.loc = innerChild?.loc || firstChild.loc
            return value
        }
        else if (childName === 'NullLiteral') {
            value = SlimeAstUtil.createNullLiteralToken()
        }
        else if (childName === 'BigIntLiteral') {
            const rawValue = firstChild.value as string || firstChild.children?.[0]?.value as string
            const numStr = rawValue.endsWith('n') ? rawValue.slice(0, -1) : rawValue
            value = SlimeAstUtil.createBigIntLiteral(numStr, rawValue) as any
        }
        else {
            const rawValue = firstChild.value as string
            if (rawValue !== undefined) {
                value = SlimeAstUtil.createStringLiteral(rawValue, firstChild.loc, rawValue)
            } else {
                const innerChild = firstChild.children?.[0]
                if (innerChild?.value) {
                    value = SlimeAstUtil.createStringLiteral(innerChild.value, innerChild.loc, innerChild.value)
                } else {
                    throw new Error(`Cannot extract value from Literal: ${childName}`)
                }
            }
        }

        value.loc = firstChild.loc
        return value
    }

    /**
     * 创建 BooleanLiteral 的 AST
     */
    static createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (firstChild?.name === 'True' || firstChild?.value === 'true') {
            const lit = SlimeAstUtil.createBooleanLiteral(true)
            lit.loc = firstChild.loc || cst.loc
            return lit
        } else {
            const lit = SlimeAstUtil.createBooleanLiteral(false)
            lit.loc = firstChild?.loc || cst.loc
            return lit
        }
    }

    /**
     * 创建 NumericLiteral 的 AST
     */
    static createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        const validNames = [
            SlimeTokenConsumer.prototype.NumericLiteral?.name,
            'NumericLiteral',
            'Number'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected NumericLiteral, got ${cst.name}`)
        }
        const rawValue = cst.value as string
        return SlimeAstUtil.createNumericLiteral(Number(rawValue), rawValue)
    }

    /**
     * 创建 StringLiteral 的 AST
     */
    static createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        const validNames = [
            SlimeTokenConsumer.prototype.StringLiteral?.name,
            'StringLiteral',
            'String'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected StringLiteral, got ${cst.name}`)
        }
        const rawValue = cst.value as string
        return SlimeAstUtil.createStringLiteral(rawValue, cst.loc, rawValue)
    }

    /**
     * 创建 RegExpLiteral 的 AST
     */
    static createRegExpLiteralAst(cst: SubhutiCst): any {
        const rawValue = cst.value as string
        const match = rawValue.match(/^\/(.*)\/([gimsuy]*)$/)
        if (match) {
            const pattern = match[1]
            const flags = match[2]
            return {
                type: SlimeNodeType.Literal,
                value: new RegExp(pattern, flags),
                raw: rawValue,
                regex: {
                    pattern: pattern,
                    flags: flags
                },
                loc: cst.loc
            }
        }
        return {
            type: SlimeNodeType.Literal,
            value: rawValue,
            raw: rawValue,
            loc: cst.loc
        }
    }


    /**
     * 创建 ArrayLiteral 的 AST
     */
    static createArrayLiteralAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeArrayExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);

        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBracket' || firstChild.value === '[')) {
                lBracketToken = SlimeTokenCreate.createLBracketToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBracket' || lastChild.value === ']')) {
                rBracketToken = SlimeTokenCreate.createRBracketToken(lastChild.loc)
            }
        }

        const elementList = cst.children.find(ch => ch.name === SlimeParser.prototype.ElementList?.name)
        const elements = elementList ? LiteralCstToAst.createElementListAst(elementList, converter) : []

        // 处理尾随逗号和省略
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                    elements.push(SlimeAstUtil.createArrayElement(null, commaToken))
                }
            }
        }

        return SlimeAstUtil.createArrayExpression(elements, cst.loc, lBracketToken, rBracketToken)
    }

    /**
     * 创建 ElementList 的 AST
     */
    static createElementListAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeArrayElement> {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = []

        let currentElement: SlimeExpression | SlimeSpreadElement | null = null
        let hasElement = false

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = converter.createAssignmentExpressionAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = converter.createSpreadElementAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.Elision?.name) {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    if (hasElement) {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                        hasElement = false
                        currentElement = null
                    } else {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(null, commaToken))
                    }
                }
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                hasElement = false
                currentElement = null
            }
        }

        if (hasElement) {
            elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
        }

        return elements
    }

    /**
     * 创建 ObjectLiteral 的 AST
     */
    static createObjectLiteralAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeObjectExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
        const properties: Array<SlimeObjectPropertyItem> = []

        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBrace' || firstChild.value === '{')) {
                lBraceToken = SlimeTokenCreate.createLBraceToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBrace' || lastChild.value === '}')) {
                rBraceToken = SlimeTokenCreate.createRBraceToken(lastChild.loc)
            }
        }

        if (cst.children.length > 2) {
            const PropertyDefinitionListCst = cst.children[1]
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null
            let hasProperty = false

            for (const child of PropertyDefinitionListCst.children) {
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
                    }
                    currentProperty = converter.createPropertyDefinitionAst(child)
                    hasProperty = true
                } else if (child.name === 'Comma' || child.value === ',') {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, commaToken))
                        hasProperty = false
                        currentProperty = null
                    }
                }
            }

            if (hasProperty) {
                properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
            }
        }
        return SlimeAstUtil.createObjectExpression(properties, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * 创建 TemplateLiteral 的 AST
     */
    static createTemplateLiteralAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.TemplateLiteral?.name)

        const first = cst.children[0]

        // 简单模板：`hello` (无插值)
        if (first.name === SlimeTokenConsumer.prototype.NoSubstitutionTemplate?.name ||
            first.name === 'NoSubstitutionTemplate') {
            const raw = first.value as string || '``'
            const cooked = raw.slice(1, -1)
            const quasis = [SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc)]
            return SlimeAstUtil.createTemplateLiteral(quasis, [], cst.loc)
        }

        // 带插值模板
        let targetCst = cst
        if (first.name === SlimeParser.prototype.SubstitutionTemplate?.name ||
            first.name === 'SubstitutionTemplate') {
            targetCst = first
        }

        const quasis: any[] = []
        const expressions: SlimeExpression[] = []

        for (let i = 0; i < targetCst.children.length; i++) {
            const child = targetCst.children[i]

            if (child.name === SlimeTokenConsumer.prototype.TemplateHead?.name ||
                child.name === 'TemplateHead') {
                const raw = child.value as string || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            }
            else if (child.name === SlimeParser.prototype.Expression?.name ||
                     child.name === 'Expression') {
                expressions.push(converter.createExpressionAst(child))
            }
            else if (child.name === SlimeParser.prototype.TemplateSpans?.name ||
                     child.name === 'TemplateSpans') {
                LiteralCstToAst.processTemplateSpans(child, quasis, expressions, converter)
            }
        }

        return SlimeAstUtil.createTemplateLiteral(quasis, expressions, cst.loc)
    }

    /**
     * 处理 TemplateSpans
     */
    private static processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[], converter: SlimeCstToAstType): void {
        const first = cst.children[0]

        if (first.name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
            const raw = first.value || ''
            const cooked = raw.slice(1, -1)
            quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc))
            return
        }

        if (first.name === SlimeParser.prototype.TemplateMiddleList?.name) {
            LiteralCstToAst.processTemplateMiddleList(first, quasis, expressions, converter)

            if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
                const tail = cst.children[1]
                const raw = tail.value || ''
                const cooked = raw.slice(1, -1)
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, tail.loc))
            }
        }
    }

    /**
     * 处理 TemplateMiddleList
     */
    private static processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[], converter: SlimeCstToAstType): void {
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeTokenConsumer.prototype.TemplateMiddle?.name ||
                child.name === 'TemplateMiddle') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                       child.name === 'Expression') {
                expressions.push(converter.createExpressionAst(child))
            } else if (child.name === SlimeParser.prototype.TemplateMiddleList?.name ||
                       child.name === 'TemplateMiddleList') {
                LiteralCstToAst.processTemplateMiddleList(child, quasis, expressions, converter)
            }
        }
    }

    /**
     * 创建 LiteralPropertyName 的 AST
     */
    static createLiteralPropertyNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('LiteralPropertyName has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName') {
            // 使用 IdentifierCstToAst
            return IdentifierCstToAst.createIdentifierNameAst(firstChild)
        } else if (firstChild.name === SlimeTokenConsumer.prototype.StringLiteral?.name ||
                   firstChild.name === 'StringLiteral') {
            return LiteralCstToAst.createStringLiteralAst(firstChild)
        } else if (firstChild.name === SlimeTokenConsumer.prototype.NumericLiteral?.name ||
                   firstChild.name === 'NumericLiteral') {
            return LiteralCstToAst.createNumericLiteralAst(firstChild)
        }

        throw new Error(`Unknown LiteralPropertyName type: ${firstChild.name}`)
    }

    /**
     * 创建 Elision 的 AST（返回空元素数量）
     */
    static createElisionAst(cst: SubhutiCst): number {
        let count = 0
        for (const child of cst.children || []) {
            if (child.value === ',') {
                count++
            }
        }
        return count
    }
}
