import {
    type SlimeLiteral,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
    type SlimeExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { checkCstName } from "../core/CstToAstContext";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";

/**
 * 字面量相关的 CST to AST 转换 (简单字面量)
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
}
