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
import { SlimeCstToAstTools, checkCstName } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setLiteralCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for LiteralCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 字面量相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class LiteralCstToAst {

    // ==================== 字面量相关转换方法 ====================

    /**
     * 布尔字面量 CST 转 AST
     * BooleanLiteral -> true | false
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
     * Elision -> , | Elision ,
     * 返回 null 元素的数量
     */
    static createElisionAst(cst: SubhutiCst): number {
        // 计算逗号数量，每个逗号代表一个空位
        let count = 0
        for (const child of cst.children || []) {
            if (child.value === ',') {
                count++
            }
        }
        return count
    }

    static createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const astName = checkCstName(cst, SlimeParser.prototype.Literal?.name);
        const firstChild = cst.children[0]
        let value: SlimeLiteral

        // 处理各种字面量类型
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
        // 包装节点的情况（如 BooleanLiteral 包含 True/False）
        else if (childName === 'BooleanLiteral' || childName === SlimeParser.prototype.BooleanLiteral?.name) {
            // BooleanLiteral 是 True | False
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
        // BigInt 字面量
        else if (childName === 'BigIntLiteral') {
            const rawValue = firstChild.value as string || firstChild.children?.[0]?.value as string
            // 去掉末尾的 'n'
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
     * [AST 类型映射] NumericLiteral 终端符转 Literal AST
     *
     * 存在必要性：NumericLiteral 在 CST 中是终端符，在 ESTree AST 中是 Literal 类型。
     */
    static createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
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
        // 保存原始值（raw）以保持格式（如十六进制 0xFF）
        const rawValue = cst.value as string
        return SlimeAstUtil.createNumericLiteral(Number(rawValue), rawValue)
    }

    /**
     * [AST 类型映射] StringLiteral 终端符转 Literal AST
     *
     * 存在必要性：StringLiteral 在 CST 中是终端符，在 ESTree AST 中是 Literal 类型。
     */
    static createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
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
     * [AST 类型映射] RegularExpressionLiteral 终端符转 Literal AST
     *
     * 存在必要性：RegularExpressionLiteral 在 CST 中是终端符，
     * 在 ESTree AST 中是 Literal 类型，需要解析正则表达式的 pattern 和 flags。
     *
     * RegularExpressionLiteral: /pattern/flags
     */
    static createRegExpLiteralAst(cst: SubhutiCst): any {
        const rawValue = cst.value as string
        // 解析正则表达式字面量的 pattern/flags
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
        // 如果无法解析，返回原始值
        return {
            type: SlimeNodeType.Literal,
            value: rawValue,
            raw: rawValue,
            loc: cst.loc
        }
    }

    /**
     * ElementList CST 转 AST
     * ElementList -> Elision? AssignmentExpression | ElementList , Elision? AssignmentExpression | ElementList , Elision? SpreadElement
     */
    static createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = []

        // 遍历所有子节点，处理 AssignmentExpression、SpreadElement、Elision 和 Comma
        // 每个元素与其后面的逗号配对
        let currentElement: SlimeExpression | SlimeSpreadElement | null = null
        let hasElement = false

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                // 如果之前有元素但没有逗号，先推入
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = getUtil().createAssignmentExpressionAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = LiteralCstToAst.createSpreadElementAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.Elision?.name) {
                // Elision 代表空元素：[1, , 3] - 可能包含多个逗号
                // 每个 Elision 内部的逗号数量决定空元素数量
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    if (hasElement) {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                        hasElement = false
                        currentElement = null
                    } else {
                        // 连续的空元素
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(null, commaToken))
                    }
                }
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的元素配对
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                hasElement = false
                currentElement = null
            }
        }

        // 处理最后一个元素（如果没有尾随逗号）
        if (hasElement) {
            elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
        }

        return elements
    }

    /**
     * SpreadElement CST 转 AST
     * SpreadElement -> ... AssignmentExpression
     */
    static createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);
        // SpreadElement: [Ellipsis, AssignmentExpression]

        // 提取 Ellipsis token
        let ellipsisToken: any = undefined
        const ellipsisCst = cst.children.find(ch =>
            ch.name === 'Ellipsis' || ch.name === 'Ellipsis' || ch.value === '...'
        )
        if (ellipsisCst) {
            ellipsisToken = SlimeTokenCreate.createEllipsisToken(ellipsisCst.loc)
        }

        const expression = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name
        )
        if (!expression) {
            throw new Error('SpreadElement missing AssignmentExpression')
        }

        return SlimeAstUtil.createSpreadElement(
            getUtil().createAssignmentExpressionAst(expression),
            cst.loc,
            ellipsisToken
        )
    }
}
