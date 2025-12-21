import { SubhutiCst } from "subhuti";
import { SlimeIdentifier, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class IdentifierCstToAst {

    /**
     * 创建 IdentifierReference 的 AST
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
     * 创建 LabelIdentifier 的 AST
     * 语法：LabelIdentifier -> Identifier | yield | await
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
     * 创建基础 Identifier AST
     */
    static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        let value: string
        let tokenLoc: any = undefined

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

        const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(value)
        return SlimeAstUtil.createIdentifier(decodedName, tokenLoc || cst.loc)
    }

    static createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        if (cst.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(cst.value as string)
            return SlimeAstUtil.createIdentifier(decodedName, cst.loc)
        }

        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(current.value as string)
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

    /**
     * 创建 PrivateIdentifier AST
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
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
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
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
                const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
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
