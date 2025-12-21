import { SubhutiCst } from "subhuti";
import { SlimeLiteral, SlimeNumericLiteral, SlimeStringLiteral, SlimeAstUtil } from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class LiteralCstToAst {

    /**
     * [AST 类型映射] NumericLiteral 终端符 -> Literal AST
     */
    static createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        let value: number;
        const raw = cst.value as string;

        if (raw.startsWith('0x') || raw.startsWith('0X')) {
            value = parseInt(raw, 16);
        } else if (raw.startsWith('0b') || raw.startsWith('0B')) {
            value = parseInt(raw.substring(2), 2);
        } else if (raw.startsWith('0o') || raw.startsWith('0O')) {
            value = parseInt(raw.substring(2), 8);
        } else {
            value = Number(raw);
        }

        return SlimeAstUtil.createNumericLiteral(value, raw, cst.loc);
    }

    /**
     * [AST 类型映射] StringLiteral 终端符 -> Literal AST
     */
    static createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        const raw = cst.value as string;
        // 去掉引号并解码
        const content = raw.substring(1, raw.length - 1);
        const value = SlimeCstToAstUtil.decodeUnicodeEscapes(content);
        return SlimeAstUtil.createStringLiteral(value, raw, cst.loc);
    }

    /**
     * 布尔字面量 CST -> AST
     */
    static createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const value = cst.value === 'true';
        return SlimeAstUtil.createBooleanLiteral(value, cst.value as string, cst.loc);
    }

    /**
     * Null 字面量
     */
    static createNullLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return SlimeAstUtil.createNullLiteral(cst.loc);
    }

    /**
     * [AST 类型映射] RegularExpressionLiteral 终端符 -> Literal AST
     */
    static createRegExpLiteralAst(cst: SubhutiCst): any {
        const rawValue = cst.value as string;
        const match = rawValue.match(/^\/(.*)\/([gimsuy]*)$/);
        if (match) {
            const pattern = match[1];
            const flags = match[2];
            return {
                type: "Literal",
                value: new RegExp(pattern, flags),
                raw: rawValue,
                regex: {
                    pattern: pattern,
                    flags: flags
                },
                loc: cst.loc
            };
        }
        return {
            type: "Literal",
            value: rawValue,
            raw: rawValue,
            loc: cst.loc
        };
    }

    /**
     * BigInt 字面量
     */
    static createBigIntLiteralAst(cst: SubhutiCst): any {
        const rawValue = cst.value as string || (cst.children?.[0]?.value as string);
        const numStr = rawValue.endsWith('n') ? rawValue.slice(0, -1) : rawValue;
        return (SlimeAstUtil as any).createBigIntLiteral?.(numStr, rawValue) || {
            type: "Literal",
            value: BigInt(numStr),
            raw: rawValue,
            loc: cst.loc
        };
    }

    static createLiteralFromToken(token: any): any {
        if (token.name === 'NumericLiteral' || token.name === 'NumericLiteralTok') {
            return LiteralCstToAst.createNumericLiteralAst(token);
        }
        if (token.name === 'StringLiteral' || token.name === 'StringLiteralTok') {
            return LiteralCstToAst.createStringLiteralAst(token);
        }
        if (token.name === 'BooleanLiteral' || token.name === 'BooleanLiteralTok') {
            return LiteralCstToAst.createBooleanLiteralAst(token);
        }
        if (token.name === 'NullLiteral' || token.name === 'NullLiteralTok' || token.name === 'Null') {
            return LiteralCstToAst.createNullLiteralAst(token);
        }
        if (token.name === 'RegularExpressionLiteral' || token.name === 'RegularExpressionLiteralTok' || token.name === 'RegExp') {
            return LiteralCstToAst.createRegExpLiteralAst(token);
        }
        return null;
    }

    /**
     * 核心字面量分发
     */
    static createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        const child = cst.children?.[0] || cst;
        const literal = LiteralCstToAst.createLiteralFromToken(child);
        if (literal) {
            literal.loc = child.loc || cst.loc;
            return literal;
        }

        const childName = child.name;
        if (childName === 'BigIntLiteral') {
            return LiteralCstToAst.createBigIntLiteralAst(child);
        }

        throw new Error(`createLiteralAst: Unknown literal type ${childName}`);
    }
}
