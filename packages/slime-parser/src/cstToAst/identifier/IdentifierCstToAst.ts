import {
    SlimeIdentifier, SlimeNodeType,
    type SlimePattern,
} from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import { SlimeAstUtil } from "slime-ast";
import { decodeUnicodeEscapes, checkCstName } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

/**
 * 标识符相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class IdentifierCstToAst {
    /**
     * 创建 IdentifierReference 的 AST
     *
     * 语法：IdentifierReference -> Identifier | yield | await
     *
     * IdentifierReference 是对 Identifier 的引用包装，
     * 在 ES 规范中用于区分标识符的不同使用场景。
     */
    static createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.IdentifierReference?.name || 'IdentifierReference'
        if (cst.name !== expectedName && cst.name !== 'IdentifierReference') {
            throw new Error(`Expected IdentifierReference, got ${cst.name}`)
        }

        // IdentifierReference -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('IdentifierReference has no children')
        }

        return IdentifierCstToAst.createIdentifierAst(child)
    }


    /**
     * 创建 LabelIdentifier 的 AST
     *
     * 语法：LabelIdentifier -> Identifier | [~Yield] yield | [~Await] await
     *
     * LabelIdentifier 用于 break/continue 语句的标签和 LabelledStatement 的标签。
     * 结构与 IdentifierReference 相同。
     */
    static createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.LabelIdentifier?.name || 'LabelIdentifier'
        if (cst.name !== expectedName && cst.name !== 'LabelIdentifier') {
            throw new Error(`Expected LabelIdentifier, got ${cst.name}`)
        }

        // LabelIdentifier -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('LabelIdentifier has no children')
        }

        return IdentifierCstToAst.createIdentifierAst(child)
    }

    static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Support Identifier, IdentifierName, and contextual keywords (yield, await) used as identifiers
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        // ES2025 Parser: Identifier 规则内部调用 IdentifierNameTok()
        // 所以 CST 结构是：Identifier -> IdentifierNameTok (token with value)
        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

        // 处理 yield/await 作为标识符的情况
        if (isYield || isAwait) {
            // 这是一个 token，直接使用其值
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
            // 直接的 token（旧版兼容）
            value = cst.value as string
            tokenLoc = cst.loc
        } else if (cst.children && cst.children.length > 0) {
            // ES2025: Identifier 规则，子节点是 IdentifierNameTok
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

        // 解码 Unicode 转义序列（如 \u0061 -> a）
        const decodedName = decodeUnicodeEscapes(value)
        // 使用 token 的 loc（包含原始值），而不是规则的 loc
        const identifier = SlimeAstUtil.createIdentifier(decodedName, tokenLoc || cst.loc)
        return identifier
    }

    static createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        // IdentifierName 可能是:
        // 1. 直接有 value 的 token
        // 2. 包含子节点的规则节点

        // 如果直接有 value，使用它
        if (cst.value !== undefined) {
            const decodedName = decodeUnicodeEscapes(cst.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, cst.loc)
        }

        // 否则递归查找 value
        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = decodeUnicodeEscapes(current.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, current.loc || cst.loc)
        }

        throw new Error(`createIdentifierNameAst: Cannot extract value from IdentifierName`)
    }

    static createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        checkCstName(cst, SlimeParser.prototype.BindingIdentifier?.name);
        // BindingIdentifier 结构：
        // ES2025: BindingIdentifier -> Identifier -> IdentifierNameTok
        // 或者: BindingIdentifier -> YieldTok | AwaitTok
        const first = cst.children[0]

        // 如果第一个子节点是 Identifier 规则
        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            // Identifier 规则内部包含 IdentifierNameTok
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
     * 创建 PrivateIdentifier 的 AST
     *
     * ES2022 私有标识符语法：
     * PrivateIdentifier :: # IdentifierName
     * AST 表示：{ type: "Identifier", name: "#count" }
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Es2025Parser: PrivateIdentifier 是一个直接的 token，value 已经包含 #
        // 例如：{ name: 'PrivateIdentifier', value: '#count' } 或 value: '#\u{61}'
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = decodeUnicodeEscapes(rawName)
            // 保存原始值和解码后的值
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeAstUtil.createIdentifier(name, cst.loc)
            // 如果原始值与解码值不同，保存 raw 以便生成器使用
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
            const decodedName = decodeUnicodeEscapes(rawName)
            const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
            // 保存原始值
            if (rawName !== decodedName) {
                (identifier as any).raw = '#' + rawName
            }
            return identifier
        }

        // 如果只有一个子节点，可能是直接的 IdentifierName
        if (cst.children && cst.children.length === 1) {
            const child = cst.children[0]
            if (child.value) {
                const rawName = child.value as string
                const decodedName = decodeUnicodeEscapes(rawName)
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
     * 在Expression中查找第一个Identifier（辅助方法）
     */
    static findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = IdentifierCstToAst.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

    /**
     * 将表达式转换为模式（用于箭头函数参数解构）
     * ObjectExpression -> ObjectPattern
     * ArrayExpression -> ArrayPattern
     * Identifier -> Identifier
     * SpreadElement -> RestElement
     */
    static convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr

        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            // 将 ObjectExpression 转换为 ObjectPattern
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: IdentifierCstToAst.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
                    // 转换 Property 的 value
                    const convertedValue = IdentifierCstToAst.convertExpressionToPattern(prop.value)
                    properties.push({
                        property: {
                            ...prop,
                            value: convertedValue
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    properties.push(item)
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any
        }

        if (expr.type === SlimeNodeType.ArrayExpression) {
            // 将 ArrayExpression 转换为 ArrayPattern
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: IdentifierCstToAst.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: IdentifierCstToAst.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any
        }

        if (expr.type === SlimeNodeType.AssignmentExpression) {
            // 将 AssignmentExpression 转换为 AssignmentPattern
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: IdentifierCstToAst.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            // SpreadElement -> RestElement
            return {
                type: SlimeNodeType.RestElement,
                argument: IdentifierCstToAst.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        // 其他类型直接返回
        return expr
    }

}
