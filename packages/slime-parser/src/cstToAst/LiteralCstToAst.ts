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
import {checkCstName} from "../SlimeCstToAstUtil.ts";


/**
 * 字面量相关的 CST to AST 转换
 */
export class LiteralCstToAst {

    // ==================== 字面量相关转换方�?====================

    /**
     * 布尔字面�?CST �?AST
     * BooleanLiteral -> true | false
     */
    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
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
     * ArrayLiteral CST �?ArrayExpression AST
     * ArrayLiteral -> [ Elision? ] | [ ElementList ] | [ ElementList , Elision? ]
     */
    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);
        // ArrayLiteral: [LBracket, ElementList?, Comma?, Elision?, RBracket]

        // 提取 LBracket �?RBracket tokens
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
        const elements = elementList ? this.createElementListAst(elementList) : []

        // 处理 ArrayLiteral 顶层�?Comma �?Elision（尾随逗号和省略）
        // 例如 [x,,] -> ElementList 后面�?Comma �?Elision
        let hasTrailingComma = false
        for (const child of cst.children) {
            if (child.name === 'Comma' || child.value === ',') {
                // 顶层逗号，表示尾随逗号
                hasTrailingComma = true
            } else if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                // 顶层 Elision，添加空元素
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
     * 对象字面�?CST �?AST（透传�?ObjectExpression�?
     * ObjectLiteral -> { } | { PropertyDefinitionList } | { PropertyDefinitionList , }
     */
    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
        const properties: Array<SlimeObjectPropertyItem> = []

        // 提取 LBrace �?RBrace tokens
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ObjectLiteral: { PropertyDefinitionList? ,? }
        // children[0] = LBrace, children[last] = RBrace (if exists)
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
                // 跳过没有children的PropertyDefinition节点（SubhutiParser优化导致�?
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    // 如果之前有属性但没有逗号，先推入
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
                    }
                    currentProperty = this.createPropertyDefinitionAst(child)
                    hasProperty = true
                } else if (child.name === 'Comma' || child.value === ',') {
                    // 逗号与前面的属性配�?
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, commaToken))
                        hasProperty = false
                        currentProperty = null
                    }
                }
            }

            // 处理最后一个属性（如果没有尾随逗号�?
            if (hasProperty) {
                properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
            }
        }
        return SlimeAstUtil.createObjectExpression(properties, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * Elision（逗号空位）CST �?AST
     * Elision -> , | Elision ,
     * 返回 null 元素的数�?
     */
    createElisionAst(cst: SubhutiCst): number {
        // 计算逗号数量，每个逗号代表一个空�?
        let count = 0
        for (const child of cst.children || []) {
            if (child.value === ',') {
                count++
            }
        }
        return count
    }

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const astName = checkCstName(cst, SlimeParser.prototype.Literal?.name);
        const firstChild = cst.children[0]
        let value: SlimeLiteral

        // 处理各种字面量类�?
        const childName = firstChild.name

        // 直接�?token 的情�?
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
        // 包装节点的情况（�?BooleanLiteral 包含 True/False�?
        else if (childName === 'BooleanLiteral' || childName === SlimeParser.prototype.BooleanLiteral?.name) {
            // BooleanLiteral �?True | False
            const innerChild = firstChild.children?.[0]
            if (innerChild?.name === 'True' || innerChild?.value === 'true') {
                value = SlimeAstUtil.createBooleanLiteral(true)
            } else {
                value = SlimeAstUtil.createBooleanLiteral(false)
            }
            value.loc = innerChild?.loc || firstChild.loc
            return value
        }
        // Null 字面量的包装
        else if (childName === 'NullLiteral') {
            value = SlimeAstUtil.createNullLiteralToken()
        }
        // BigInt 字面�?
        else if (childName === 'BigIntLiteral') {
            const rawValue = firstChild.value as string || firstChild.children?.[0]?.value as string
            // 去掉末尾�?'n'
            const numStr = rawValue.endsWith('n') ? rawValue.slice(0, -1) : rawValue
            value = SlimeAstUtil.createBigIntLiteral(numStr, rawValue) as any
        }
        // 默认处理为字符串
        else {
            const rawValue = firstChild.value as string
            if (rawValue !== undefined) {
                value = SlimeAstUtil.createStringLiteral(rawValue, firstChild.loc, rawValue)
            } else {
                // 递归处理嵌套的子节点
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
     * [AST 类型映射] NumericLiteral 终端�?�?Literal AST
     *
     * 存在必要性：NumericLiteral �?CST 中是终端符，�?ESTree AST 中是 Literal 类型�?
     */
    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        // 兼容多种 NumericLiteral 名称：NumericLiteral, NumericLiteralTok, Number
        const validNames = [
            SlimeTokenConsumer.prototype.NumericLiteral?.name,
            'NumericLiteral',
            'NumericLiteral',
            'Number'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected NumericLiteral, got ${cst.name}`)
        }
        // 保存原始值（raw）以保持格式（如十六进制 0xFF�?
        const rawValue = cst.value as string
        return SlimeAstUtil.createNumericLiteral(Number(rawValue), rawValue)
    }

    /**
     * [AST 类型映射] StringLiteral 终端�?�?Literal AST
     *
     * 存在必要性：StringLiteral �?CST 中是终端符，�?ESTree AST 中是 Literal 类型�?
     */
    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        // 兼容多种 StringLiteral 名称：StringLiteral, StringLiteralTok, String
        const validNames = [
            SlimeTokenConsumer.prototype.StringLiteral?.name,
            'StringLiteral',
            'StringLiteral',
            'String'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`Expected StringLiteral, got ${cst.name}`)
        }
        // 保存原始值（raw）以保持引号格式
        const rawValue = cst.value as string
        const ast = SlimeAstUtil.createStringLiteral(rawValue, cst.loc, rawValue)
        return ast
    }

    /**
     * [AST 类型映射] RegularExpressionLiteral 终端�?�?Literal AST
     *
     * 存在必要性：RegularExpressionLiteral �?CST 中是终端符，
     * �?ESTree AST 中是 Literal 类型，需要解析正则表达式�?pattern �?flags�?
     *
     * RegularExpressionLiteral: /pattern/flags
     */
    createRegExpLiteralAst(cst: SubhutiCst): any {
        const rawValue = cst.value as string
        // 解析正则表达式字面量�?pattern/flags
        // 正则字面量格式：/.../ 后面可能跟着 flags
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
        // 如果无法解析，返回原始�?
        return {
            type: SlimeNodeType.Literal,
            value: rawValue,
            raw: rawValue,
            loc: cst.loc
        }
    }
}



