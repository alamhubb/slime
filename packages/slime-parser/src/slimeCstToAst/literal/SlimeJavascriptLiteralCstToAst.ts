/**
 * LiteralCstToAst - 基础字面量（数字/字符�?布尔等）转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeJavascriptArrayElement,
    type SlimeJavascriptArrayExpression, type SlimeJavascriptArrowFunctionExpression, type SlimeJavascriptAssignmentExpression,
    SlimeJavascriptCreateUtils, type SlimeJavascriptClassExpression,
    type SlimeJavascriptExpression, type SlimeJavascriptFunctionParam, type SlimeJavascriptIdentifier, SlimeJavascriptLiteral,
    SlimeAstTypeName, SlimeJavascriptNumericLiteral, type SlimeJavascriptSpreadElement,
    SlimeJavascriptStringLiteral, SlimeJavascriptTokenCreateUtils
} from "slime-ast";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptLiteralCstToAstSingle {
    // ==================== 字面量相关转换方�?====================

    /**
     * 布尔字面�?CST �?AST
     * BooleanLiteral -> true | false
     */
    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (firstChild?.name === 'True' || firstChild?.value === 'true') {
            const lit = SlimeJavascriptCreateUtils.createBooleanLiteral(true)
            lit.loc = firstChild.loc || cst.loc
            return lit
        } else {
            const lit = SlimeJavascriptCreateUtils.createBooleanLiteral(false)
            lit.loc = firstChild?.loc || cst.loc
            return lit
        }
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
        return SlimeJavascriptCreateUtils.createNumericLiteral(Number(rawValue), rawValue)
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
        const ast = SlimeJavascriptCreateUtils.createStringLiteral(rawValue, cst.loc, rawValue)
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
                type: SlimeAstTypeName.Literal,
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
            type: SlimeAstTypeName.Literal,
            value: rawValue,
            raw: rawValue,
            loc: cst.loc
        }
    }



    createLiteralFromToken(token: any): SlimeExpression {
        const tokenName = token.tokenName
        if (tokenName === SlimeTokenConsumer.prototype.NullLiteral?.name) {
            return SlimeJavascriptCreateUtils.createNullLiteralToken()
        } else if (tokenName === SlimeTokenConsumer.prototype.True?.name) {
            return SlimeJavascriptCreateUtils.createBooleanLiteral(true)
        } else if (tokenName === SlimeTokenConsumer.prototype.False?.name) {
            return SlimeJavascriptCreateUtils.createBooleanLiteral(false)
        } else if (tokenName === SlimeTokenConsumer.prototype.NumericLiteral?.name) {
            return SlimeJavascriptCreateUtils.createNumericLiteral(Number(token.tokenValue))
        } else if (tokenName === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeJavascriptCreateUtils.createStringLiteral(token.tokenValue)
        } else {
            throw new Error(`Unsupported literal token: ${tokenName}`)
        }
    }


    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.Literal?.name);
        const firstChild = cst.children[0]
        let value: SlimeLiteral

        // 处理各种字面量类�?
        const childName = firstChild.name

        // 直接�?token 的情�?
        if (childName === SlimeTokenConsumer.prototype.NumericLiteral?.name || childName === 'NumericLiteral') {
            const rawValue = firstChild.value as string
            value = SlimeJavascriptCreateUtils.createNumericLiteral(Number(rawValue), rawValue)
        } else if (childName === SlimeTokenConsumer.prototype.True?.name || childName === 'True') {
            value = SlimeJavascriptCreateUtils.createBooleanLiteral(true)
        } else if (childName === SlimeTokenConsumer.prototype.False?.name || childName === 'False') {
            value = SlimeJavascriptCreateUtils.createBooleanLiteral(false)
        } else if (childName === SlimeTokenConsumer.prototype.NullLiteral?.name || childName === 'NullLiteral' || childName === 'Null') {
            value = SlimeJavascriptCreateUtils.createNullLiteralToken()
        } else if (childName === SlimeTokenConsumer.prototype.StringLiteral?.name || childName === 'StringLiteral') {
            const rawValue = firstChild.value as string
            value = SlimeJavascriptCreateUtils.createStringLiteral(rawValue, firstChild.loc, rawValue)
        }
        // 包装节点的情况（�?BooleanLiteral 包含 True/False�?
        else if (childName === 'BooleanLiteral' || childName === SlimeParser.prototype.BooleanLiteral?.name) {
            // BooleanLiteral �?True | False
            const innerChild = firstChild.children?.[0]
            if (innerChild?.name === 'True' || innerChild?.value === 'true') {
                value = SlimeJavascriptCreateUtils.createBooleanLiteral(true)
            } else {
                value = SlimeJavascriptCreateUtils.createBooleanLiteral(false)
            }
            value.loc = innerChild?.loc || firstChild.loc
            return value
        }
        // Null 字面量的包装
        else if (childName === 'NullLiteral') {
            value = SlimeJavascriptCreateUtils.createNullLiteralToken()
        }
        // BigInt 字面�?
        else if (childName === 'BigIntLiteral') {
            const rawValue = firstChild.value as string || firstChild.children?.[0]?.value as string
            // 去掉末尾�?'n'
            const numStr = rawValue.endsWith('n') ? rawValue.slice(0, -1) : rawValue
            value = SlimeJavascriptCreateUtils.createBigIntLiteral(numStr, rawValue) as any
        }
        // 默认处理为字符串
        else {
            const rawValue = firstChild.value as string
            if (rawValue !== undefined) {
                value = SlimeJavascriptCreateUtils.createStringLiteral(rawValue, firstChild.loc, rawValue)
            } else {
                // 递归处理嵌套的子节点
                const innerChild = firstChild.children?.[0]
                if (innerChild?.value) {
                    value = SlimeJavascriptCreateUtils.createStringLiteral(innerChild.value, innerChild.loc, innerChild.value)
                } else {
                    throw new Error(`Cannot extract value from Literal: ${childName}`)
                }
            }
        }

        value.loc = firstChild.loc
        return value
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


    // 处理TemplateMiddleList：处理多个TemplateMiddle+Expression�?
    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        // TemplateMiddleList结构（Es2025）：
        // - children = [TemplateMiddle, Expression, TemplateMiddle, Expression, ...]
        // 或者递归结构�?
        // - children[0] = TemplateMiddle (token)
        // - children[1] = Expression
        // - children[2] = TemplateMiddleList (递归，可�?

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeTokenConsumer.prototype.TemplateMiddle?.name ||
                child.name === 'TemplateMiddle') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -2) // 去掉 } �?${
                quasis.push(SlimeJavascriptCreateUtils.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression') {
                expressions.push(SlimeCstToAstUtil.createExpressionAst(child))
            } else if (child.name === SlimeParser.prototype.TemplateMiddleList?.name ||
                child.name === 'TemplateMiddleList') {
                // 递归处理嵌套�?TemplateMiddleList
                SlimeCstToAstUtil.processTemplateMiddleList(child, quasis, expressions)
            }
        }
    }


    // 处理TemplateSpans：可能是TemplateTail或TemplateMiddleList+TemplateTail
    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        const first = cst.children[0]

        // 情况1：直接是TemplateTail -> }` 结束
        if (first.name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
            const raw = first.value || ''
            const cooked = raw.slice(1, -1) // 去掉 } �?`
            quasis.push(SlimeJavascriptCreateUtils.createTemplateElement(true, raw, cooked, first.loc))
            return
        }

        // 情况2：TemplateMiddleList -> 有更多插�?
        if (first.name === SlimeParser.prototype.TemplateMiddleList?.name) {
            SlimeCstToAstUtil.processTemplateMiddleList(first, quasis, expressions)

            // 然后处理TemplateTail
            if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
                const tail = cst.children[1]
                const raw = tail.value || ''
                const cooked = raw.slice(1, -1) // 去掉 } �?`
                quasis.push(SlimeJavascriptCreateUtils.createTemplateElement(true, raw, cooked, tail.loc))
            }
        }
    }


    // 模板字符串处�?
    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.TemplateLiteral?.name)

        const first = cst.children[0]

        // 简单模板：`hello` (无插�?
        if (first.name === SlimeTokenConsumer.prototype.NoSubstitutionTemplate?.name ||
            first.name === 'NoSubstitutionTemplate') {
            // 返回 TemplateLiteral AST，保持原始格�?
            const raw = first.value as string || '``'
            const cooked = raw.slice(1, -1) // 去掉 ` �?`
            const quasis = [SlimeJavascriptCreateUtils.createTemplateElement(true, raw, cooked, first.loc)]
            return SlimeJavascriptCreateUtils.createTemplateLiteral(quasis, [], cst.loc)
        }

        // 带插值模板：`hello ${name}` �?`a ${x} b ${y} c`
        // ES2025 结构: TemplateLiteral -> SubstitutionTemplate -> [TemplateHead, Expression, TemplateSpans]
        // 检查是否是 SubstitutionTemplate 包装
        let targetCst = cst
        if (first.name === SlimeParser.prototype.SubstitutionTemplate?.name ||
            first.name === 'SubstitutionTemplate') {
            targetCst = first
        }

        const quasis: any[] = []
        const expressions: SlimeExpression[] = []

        // 遍历 targetCst.children 处理模板结构
        for (let i = 0; i < targetCst.children.length; i++) {
            const child = targetCst.children[i]

            // TemplateHead: `xxx${
            if (child.name === SlimeTokenConsumer.prototype.TemplateHead?.name ||
                child.name === 'TemplateHead') {
                const raw = child.value as string || ''
                const cooked = raw.slice(1, -2) // 去掉 ` �?${
                quasis.push(SlimeJavascriptCreateUtils.createTemplateElement(false, raw, cooked, child.loc))
            }
            // Expression
            else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression') {
                expressions.push(SlimeCstToAstUtil.createExpressionAst(child))
            }
            // TemplateSpans
            else if (child.name === SlimeParser.prototype.TemplateSpans?.name ||
                child.name === 'TemplateSpans') {
                SlimeCstToAstUtil.processTemplateSpans(child, quasis, expressions)
            }
        }

        return SlimeJavascriptCreateUtils.createTemplateLiteral(quasis, expressions, cst.loc)
    }

}


export const SlimeJavascriptLiteralCstToAst = new SlimeJavascriptLiteralCstToAstSingle()
