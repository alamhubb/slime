/**
 * IdentifierCstToAst - 标识符相关转�?
 */
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptClassBody, SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier,
    SlimeJavascriptMethodDefinition, SlimeJavascriptPattern,
    SlimeJavascriptPropertyDefinition,
    SlimeJavascriptStatement, SlimeIdentifier
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptIdentifierCstToAstSingle {

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        // IdentifierName 可能�?
        // 1. 直接�?value �?token
        // 2. 包含子节点的规则节点

        // 如果直接�?value，使用它
        if (cst.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(cst.value as string)
            return SlimeJavascriptCreateUtils.createIdentifier(decodedName, cst.loc)
        }

        // 否则递归查找 value
        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(current.value as string)
            return SlimeJavascriptCreateUtils.createIdentifier(decodedName, current.loc || cst.loc)
        }

        throw new Error(`createIdentifierNameAst: Cannot extract value from IdentifierName`)
    }


    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BindingIdentifier?.name);
        // BindingIdentifier 结构�?
        // ES2025: BindingIdentifier -> Identifier -> IdentifierNameTok
        // 或�? BindingIdentifier -> YieldTok | AwaitTok
        const first = cst.children[0]

        // 如果第一个子节点�?Identifier 规则
        if (first.name === 'Identifier' || first.name === SlimeJavascriptParser.prototype.Identifier?.name) {
            // Identifier 规则内部包含 IdentifierNameTok
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                return SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
            }
        }

        // 直接�?token 的情况（YieldTok, AwaitTok, 或旧版直接的 token�?
        if (first.value !== undefined) {
            return SlimeJavascriptCreateUtils.createIdentifier(first.value, first.loc)
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
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
            // 保存原始值和解码后的�?
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeJavascriptCreateUtils.createIdentifier(name, cst.loc)
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
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
            const identifier = SlimeJavascriptCreateUtils.createIdentifier('#' + decodedName)
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
                const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
                const identifier = SlimeJavascriptCreateUtils.createIdentifier('#' + decodedName)
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
        const expectedName = SlimeJavascriptParser.prototype.LabelIdentifier?.name || 'LabelIdentifier'
        if (cst.name !== expectedName && cst.name !== 'LabelIdentifier') {
            throw new Error(`Expected LabelIdentifier, got ${cst.name}`)
        }

        // LabelIdentifier -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('LabelIdentifier has no children')
        }

        return SlimeCstToAstUtil.createIdentifierAst(child)
    }


    /**
     * 创建 IdentifierReference �?AST
     *
     * 语法：IdentifierReference -> Identifier | yield | await
     *
     * IdentifierReference 是对 Identifier 的引用包装，
     * �?ES 规范中用于区分标识符的不同使用场景�?
     */
    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeJavascriptParser.prototype.IdentifierReference?.name || 'IdentifierReference'
        if (cst.name !== expectedName && cst.name !== 'IdentifierReference') {
            throw new Error(`Expected IdentifierReference, got ${cst.name}`)
        }

        // IdentifierReference -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('IdentifierReference has no children')
        }

        return SlimeCstToAstUtil.createIdentifierAst(child)
    }


    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Support Identifier, IdentifierName, and contextual keywords (yield, await) used as identifiers
        const expectedName = SlimeJavascriptParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeJavascriptParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        // ES2025 Parser: Identifier 规则内部调用 IdentifierNameTok()
        // 所�?CST 结构是：Identifier -> IdentifierNameTok (token with value)
        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

        // 处理 yield/await 作为标识符的情况
        if (isYield || isAwait) {
            // 这是一�?token，直接使用其�?
            value = cst.value as string || cst.name.toLowerCase()
            tokenLoc = cst.loc
        } else if (isIdentifierName) {
            // IdentifierName 结构：IdentifierName -> token (with value)
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
            // 直接�?token（旧版兼容）
            value = cst.value as string
            tokenLoc = cst.loc
        } else if (cst.children && cst.children.length > 0) {
            // ES2025: Identifier 规则，子节点�?IdentifierNameTok
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

        // 解码 Unicode 转义序列（如 \u0061 -> a�?
        const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(value)
        // 使用 token �?loc（包含原始值），而不是规则的 loc
        const identifier = SlimeJavascriptCreateUtils.createIdentifier(decodedName, tokenLoc || cst.loc)
        return identifier
    }

    /**
     * [TypeScript] 重写 createBindingIdentifierAst 以支持可选的类型注解
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const children = cst.children || []
        const first = children[0]

        let identifier: SlimeIdentifier

        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                identifier = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                throw new Error(`createBindingIdentifierAst: Cannot extract value from Identifier`)
            }
        } else if (first.value !== undefined) {
            identifier = SlimeJavascriptCreateUtils.createIdentifier(first.value, first.loc)
        } else {
            throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
        }

        // [TypeScript] 检查是否有类型注解
        const tsTypeAnnotationName = SlimeParser.prototype.TSTypeAnnotation?.name || 'TSTypeAnnotation'
        const typeAnnotationCst = children.find(child =>
            child.name === tsTypeAnnotationName || child.name === 'TSTypeAnnotation'
        )
        if (typeAnnotationCst) {
            identifier.typeAnnotation = this.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
    }
}

export const SlimeJavascriptIdentifierCstToAst = new SlimeJavascriptIdentifierCstToAstSingle()
