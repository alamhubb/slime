import { SlimeIdentifier } from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import { SlimeAstUtil } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";

/**
 * 标识符相关的 CST to AST 转换
 */
export class IdentifierCstToAst {
    /**
     * 创建 IdentifierReference 的 AST
     *
     * 语法：IdentifierReference -> Identifier | yield | await
     */
    static createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.IdentifierReference?.name || 'IdentifierReference'
        if (cst.name !== expectedName && cst.name !== 'IdentifierReference') {
            throw new Error(`Expected IdentifierReference, got ${cst.name}`)
        }

        const child = cst.children?.[0]
        if (!child) {
            throw new Error('IdentifierReference has no children')
        }

        return IdentifierCstToAst.createIdentifierAst(child)
    }

    /**
     * 创建 BindingIdentifier 的 AST
     */
    static createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BindingIdentifier?.name)
        const first = cst.children[0]

        // 如果第一个子节点是 Identifier 规则
        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                return SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            }
        }

        // 直接是 token 的情况（YieldTok, AwaitTok, 或旧版直接的 token）
        if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
    }

    /**
     * 创建 LabelIdentifier 的 AST
     *
     * 语法：LabelIdentifier -> Identifier | [~Yield] yield | [~Await] await
     */
    static createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.LabelIdentifier?.name || 'LabelIdentifier'
        if (cst.name !== expectedName && cst.name !== 'LabelIdentifier') {
            throw new Error(`Expected LabelIdentifier, got ${cst.name}`)
        }

        const child = cst.children?.[0]
        if (!child) {
            throw new Error('LabelIdentifier has no children')
        }

        return IdentifierCstToAst.createIdentifierAst(child)
    }

    /**
     * 创建 Identifier 的 AST
     */
    static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

        // 处理 yield/await 作为标识符的情况
        if (isYield || isAwait) {
            value = cst.value as string || cst.name.toLowerCase()
            tokenLoc = cst.loc
        } else if (isIdentifierName) {
            if (cst.value !== undefined && cst.value !== null) {
                value = cst.value as string
                tokenLoc = cst.loc
            } else if (cst.children && cst.children.length > 0) {
                const tokenCst = cst.children[0]
                if (tokenCst.value !== undefined) {
                    value = tokenCst.value as string
                    tokenLoc = tokenCst.loc || cst.loc
                } else {
                    throw new Error(`createIdentifierAst: Cannot extract value from IdentifierName CST`)
                }
            } else {
                throw new Error(`createIdentifierAst: Invalid IdentifierName CST structure`)
            }
        } else if (!isIdentifier) {
            throw new Error(`Expected Identifier, got ${cst.name}`)
        } else if (cst.value !== undefined && cst.value !== null) {
            value = cst.value as string
            tokenLoc = cst.loc
        } else if (cst.children && cst.children.length > 0) {
            const tokenCst = cst.children[0]
            if (tokenCst.value !== undefined) {
                value = tokenCst.value as string
                tokenLoc = tokenCst.loc || cst.loc
            } else {
                throw new Error(`createIdentifierAst: Cannot extract value from Identifier CST`)
            }
        } else {
            throw new Error(`createIdentifierAst: Invalid Identifier CST structure`)
        }

        // 解码 Unicode 转义序列
        const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(value)
        return SlimeAstUtil.createIdentifier(decodedName, tokenLoc || cst.loc)
    }

    /**
     * 创建 IdentifierName 的 AST
     */
    static createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        // 如果直接有 value，使用它
        if (cst.value !== undefined) {
            const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(cst.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, cst.loc)
        }

        // 否则递归查找 value
        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(current.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, current.loc || cst.loc)
        }

        throw new Error(`createIdentifierNameAst: Cannot extract value from IdentifierName`)
    }

    /**
     * 创建 PrivateIdentifier 的 AST
     * PrivateIdentifier :: # IdentifierName
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Es2025Parser: PrivateIdentifier 是一个直接的 token，value 已经包含 #
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(rawName)
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeAstUtil.createIdentifier(name, cst.loc)
            if (raw !== name) {
                (identifier as any).raw = raw
            }
            return identifier
        }

        // 旧版兼容：PrivateIdentifier -> HashTok + IdentifierName
        if (cst.children && cst.children.length >= 2) {
            const identifierNameCst = cst.children[1]
            const identifierCst = identifierNameCst.children[0]
            const rawName = identifierCst.value as string
            const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(rawName)
            const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
            if (rawName !== decodedName) {
                (identifier as any).raw = '#' + rawName
            }
            return identifier
        }

        // 如果只有一个子节点
        if (cst.children && cst.children.length === 1) {
            const child = cst.children[0]
            if (child.value) {
                const rawName = child.value as string
                const decodedName = SlimeCstToAstTools.decodeUnicodeEscapes(rawName)
                const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
                if (rawName !== decodedName) {
                    (identifier as any).raw = '#' + rawName
                }
                return identifier
            }
        }

        throw new Error('createPrivateIdentifierAst: 无法解析 PrivateIdentifier')
    }
}
