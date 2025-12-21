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
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

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

        const decodedName = decodeUnicodeEscapes(value)
        return SlimeAstUtil.createIdentifier(decodedName, tokenLoc || cst.loc)
    }

    static createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        if (cst.value !== undefined) {
            const decodedName = decodeUnicodeEscapes(cst.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, cst.loc)
        }

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
        const first = cst.children[0]

        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                return SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            }
        }

        if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
    }

    static createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = decodeUnicodeEscapes(rawName)
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeAstUtil.createIdentifier(name, cst.loc)
            if (raw !== name) {
                (identifier as any).raw = raw
            }
            return identifier
        }

        if (cst.children && cst.children.length >= 2) {
            const identifierNameCst = cst.children[1]
            const identifierCst = identifierNameCst.children[0]
            const rawName = identifierCst.value as string
            const decodedName = decodeUnicodeEscapes(rawName)
            const identifier = SlimeAstUtil.createIdentifier('#' + decodedName)
            if (rawName !== decodedName) {
                (identifier as any).raw = '#' + rawName
            }
            return identifier
        }

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

    static convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr

        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: IdentifierCstToAst.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
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
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeNodeType.SpreadElement) {
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
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: IdentifierCstToAst.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            return {
                type: SlimeNodeType.RestElement,
                argument: IdentifierCstToAst.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        return expr
    }
}
