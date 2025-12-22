/**
 * IdentifierCstToAst - 标识符相关转换
 */
import {SubhutiCst, type SubhutiSourceLocation} from "subhuti";
import type {
    SlimeClassBody,
    SlimeIdentifier,
    SlimeMethodDefinition,
    SlimePropertyDefinition,
    SlimeStatement
} from "slime-ast";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

export class IdentifierCstToAst {

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        // IdentifierName 可能�?
        // 1. 直接�?value �?token
        // 2. 包含子节点的规则节点

        // 如果直接�?value，使用它
        if (cst.value !== undefined) {
            const decodedName = SlimeAstUtils.decodeUnicodeEscapes(cst.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, cst.loc)
        }

        // 否则递归查找 value
        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = SlimeAstUtils.decodeUnicodeEscapes(current.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, current.loc || cst.loc)
        }

        throw new Error(`createIdentifierNameAst: Cannot extract value from IdentifierName`)
    }


    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BindingIdentifier?.name);
        // BindingIdentifier 结构�?
        // ES2025: BindingIdentifier -> Identifier -> IdentifierNameTok
        // 或�? BindingIdentifier -> YieldTok | AwaitTok
        const first = cst.children[0]

        // 如果第一个子节点�?Identifier 规则
        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            // Identifier 规则内部包含 IdentifierNameTok
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                return SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            }
        }

        // 直接�?token 的情况（YieldTok, AwaitTok, 或旧版直接的 token�?
        if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
    }


    /**
     * [AST 类型映射] PrivateIdentifier 终端�?�?Identifier AST
     *
     * 存在必要性：PrivateIdentifier �?CST 中是一个终端符（token），
     * 但在 ESTree AST 中需要表示为 Identifier 节点，name �?# 开头�?
     *
     * PrivateIdentifier :: # IdentifierName
     * AST 表示：{ type: "Identifier", name: "#count" }
     */
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Es2025Parser: PrivateIdentifier 是一个直接的 token，value 已经包含 #
        // 例如：{ name: 'PrivateIdentifier', value: '#count' } �?value: '#\u{61}'
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = SlimeAstUtils.decodeUnicodeEscapes(rawName)
            // 保存原始值和解码后的�?
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeAstUtil.createIdentifier(name, cst.loc)
            // 如果原始值与解码值不同，保存 raw 以便生成器使�?
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
            const decodedName = SlimeAstUtils.decodeUnicodeEscapes(rawName)
            const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
            // 保存原始�?
            if (rawName !== decodedName) {
                (identifier as any).raw = '#' + rawName
            }
            return identifier
        }

        // 如果只有一个子节点，可能是直接�?IdentifierName
        if (cst.children && cst.children.length === 1) {
            const child = cst.children[0]
            if (child.value) {
                const rawName = child.value as string
                const decodedName = SlimeAstUtils.decodeUnicodeEscapes(rawName)
                const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
                if (rawName !== decodedName) {
                    (identifier as any).raw = '#' + rawName
                }
                return identifier
            }
        }

        throw new Error('createPrivateIdentifierAst: 无法解析 PrivateIdentifier')
    }

    /**
     * 创建 LabelIdentifier �?AST
     *
     * 语法：LabelIdentifier -> Identifier | [~Yield] yield | [~Await] await
     *
     * LabelIdentifier 用于 break/continue 语句的标签和 LabelledStatement 的标签�?
     * 结构�?IdentifierReference 相同�?
     */
    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.LabelIdentifier?.name || 'LabelIdentifier'
        if (cst.name !== expectedName && cst.name !== 'LabelIdentifier') {
            throw new Error(`Expected LabelIdentifier, got ${cst.name}`)
        }

        // LabelIdentifier -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('LabelIdentifier has no children')
        }

        return this.createIdentifierAst(child)
    }

}
