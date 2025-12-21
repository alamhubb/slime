import {
    type SlimeLiteral,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
    type SlimeExpression,
    type SlimeArrayExpression,
    type SlimeArrayElement,
    type SlimeSpreadElement,
    type SlimeObjectExpression,
    type SlimeObjectPropertyItem,
    type SlimeProperty,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import { checkCstName } from "./CstToAstContext";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import { PropertyCstToAst } from "./expression/PropertyCstToAst";
import { ExpressionCstToAst } from "./expression/ExpressionCstToAst";

/**
 * 字面量相关的 CST to AST 转换
 */
export class LiteralCstToAst {

    /**
     * 从 token 创建字面量 AST
     */
    static createLiteralFromToken(token: any): SlimeExpression {
        const tokenName = token.tokenName
        if (tokenName === SlimeTokenConsumer.prototype.NullLiteral?.name) {
            return SlimeAstUtil.createNullLiteralToken()
        } else if (tokenName === SlimeTokenConsumer.prototype.True?.name) {
            return SlimeAstUtil.createBooleanLiteral(true)
        } else if (tokenName === SlimeTokenConsumer.prototype.False?.name) {
            return SlimeAstUtil.createBooleanLiteral(false)
        } else if (tokenName === SlimeTokenConsumer.prototype.NumericLiteral?.name) {
            return SlimeAstUtil.createNumericLiteral(Number(token.tokenValue))
        } else if (tokenName === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeAstUtil.createStringLiteral(token.tokenValue)
        } else {
            throw new Error(`Unsupported literal token: ${tokenName}`)
        }
    }

    /**
     * 布尔字面量 CST 转 AST
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
     * Elision（逗号空位）CST 转 AST
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

    /**
     * Literal CST 转 AST
     */
    static createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        checkCstName(cst, SlimeParser.prototype.Literal?.name);
        if (!cst.children || cst.children.length === 0) {
            throw new Error('Literal CST has no children');
        }
        const firstChild = cst.children[0]
        let value: SlimeLiteral

        const childName = firstChild.name

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
            const rawValue = (firstChild.value as string) || (firstChild.children?.[0]?.value as string)
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

    static createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        const validNames = [SlimeTokenConsumer.prototype.NumericLiteral?.name, 'NumericLiteral', 'Number']
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected NumericLiteral, got ${cst.name}`)
        }
        const rawValue = cst.value as string
        return SlimeAstUtil.createNumericLiteral(Number(rawValue), rawValue)
    }

    static createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        const validNames = [SlimeTokenConsumer.prototype.StringLiteral?.name, 'StringLiteral', 'String']
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected StringLiteral, got ${cst.name}`)
        }
        const rawValue = cst.value as string
        return SlimeAstUtil.createStringLiteral(rawValue, cst.loc, rawValue)
    }

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
                regex: { pattern: pattern, flags: flags },
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
     * 数组字面量 CST 转 AST
     */
    static createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);
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
        const elements = elementList ? LiteralCstToAst.createElementListAst(elementList) : []

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
     * ElementList CST 转 AST
     */
    static createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = []
        let currentElement: SlimeExpression | SlimeSpreadElement | null = null
        let hasElement = false

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = ExpressionCstToAst.createAssignmentExpressionAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = LiteralCstToAst.createSpreadElementAst(child)
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
     * SpreadElement CST 转 AST
     */
    static createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);
        let ellipsisToken: any = undefined
        const ellipsisCst = cst.children.find(ch => ch.name === 'Ellipsis' || ch.value === '...')
        if (ellipsisCst) {
            ellipsisToken = SlimeTokenCreate.createEllipsisToken(ellipsisCst.loc)
        }
        const expression = cst.children.find(ch => ch.name === SlimeParser.prototype.AssignmentExpression?.name)
        if (!expression) throw new Error('SpreadElement missing AssignmentExpression')

        return SlimeAstUtil.createSpreadElement(
            ExpressionCstToAst.createAssignmentExpressionAst(expression),
            cst.loc,
            ellipsisToken
        )
    }

    /**
     * 对象字面量 CST 转 AST
     */
    static createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
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
            const listCst = cst.children[1]
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null
            let hasProperty = false

            for (const child of listCst.children) {
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
                    }
                    currentProperty = PropertyCstToAst.createPropertyDefinitionAst(child)
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
     * 模板字符串 CST 转 AST
     */
    static createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.TemplateLiteral?.name)
        const first = cst.children[0]

        if (first.name === SlimeTokenConsumer.prototype.NoSubstitutionTemplate?.name || first.name === 'NoSubstitutionTemplate') {
            const raw = first.value as string || '``'
            const cooked = raw.slice(1, -1)
            const quasis = [SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc)]
            return SlimeAstUtil.createTemplateLiteral(quasis, [], cst.loc)
        }

        let targetCst = cst
        if (first.name === SlimeParser.prototype.SubstitutionTemplate?.name || first.name === 'SubstitutionTemplate') {
            targetCst = first
        }

        const quasis: any[] = []
        const expressions: SlimeExpression[] = []

        for (let i = 0; i < targetCst.children.length; i++) {
            const child = targetCst.children[i]
            if (child.name === SlimeTokenConsumer.prototype.TemplateHead?.name || child.name === 'TemplateHead') {
                const raw = child.value as string || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                expressions.push(ExpressionCstToAst.createExpressionAst(child))
            } else if (child.name === SlimeParser.prototype.TemplateSpans?.name || child.name === 'TemplateSpans') {
                LiteralCstToAst.processTemplateSpans(child, quasis, expressions)
            }
        }

        return SlimeAstUtil.createTemplateLiteral(quasis, expressions, cst.loc)
    }

    static processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        const first = cst.children[0]
        if (first.name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
            const raw = first.value || ''
            const cooked = raw.slice(1, -1)
            quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc))
            return
        }
        if (first.name === SlimeParser.prototype.TemplateMiddleList?.name) {
            LiteralCstToAst.processTemplateMiddleList(first, quasis, expressions)
            if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
                const tail = cst.children[1]
                const raw = tail.value || ''
                const cooked = raw.slice(1, -1)
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, tail.loc))
            }
        }
    }

    static processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]
            if (child.name === SlimeTokenConsumer.prototype.TemplateMiddle?.name || child.name === 'TemplateMiddle') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                expressions.push(ExpressionCstToAst.createExpressionAst(child))
            }
        }
    }
}
