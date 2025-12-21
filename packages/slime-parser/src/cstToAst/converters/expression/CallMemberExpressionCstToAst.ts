import {
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeSuper,
    type SlimeCallArgument,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { checkCstName, getUtil } from "../core/CstToAstContext";

// 导入拆分出去的类
import { OptionalChainCstToAst } from "./OptionalChainCstToAst";

// Re-export 拆分出去的类，保持向后兼容
export { OptionalChainCstToAst } from "./OptionalChainCstToAst";

// 前向声明，用于调用 ExpressionCstToAst 的方法
function createExpressionAst(cst: SubhutiCst): SlimeExpression {
    return getUtil().createExpressionAst(cst);
}

/**
 * 调用和成员访问表达式相关的 CST to AST 转换
 * 核心方法保留在此文件，可选链相关方法已拆分到 OptionalChainCstToAst
 */
export class CallMemberExpressionCstToAst {

    // ==================== 委托到 OptionalChainCstToAst ====================
    static createOptionalExpressionAst = OptionalChainCstToAst.createOptionalExpressionAst;
    static createOptionalChainAst = OptionalChainCstToAst.createOptionalChainAst;

    // ==================== 核心方法 ====================

    static createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        // Support both CallExpression and CoverCallExpressionAndAsyncArrowHead
        const isCallExpr = cst.name === SlimeParser.prototype.CallExpression?.name || cst.name === 'CallExpression'
        const isCoverExpr = cst.name === 'CoverCallExpressionAndAsyncArrowHead'

        if (!isCallExpr && !isCoverExpr) {
            throw new Error(`createCallExpressionAst: Expected CallExpression or CoverCallExpressionAndAsyncArrowHead, got ${cst.name}`)
        }

        if (cst.children.length === 1) {
            // 单个子节点，可能是SuperCall
            const first = cst.children[0]
            if (first.name === SlimeParser.prototype.SuperCall?.name) {
                return CallMemberExpressionCstToAst.createSuperCallAst(first)
            }
            return createExpressionAst(first)
        }

        // 多个children：MemberExpression + Arguments + 可选的链式调用
        let current: SlimeExpression
        const firstChild = cst.children[0]

        // 处理第一个子节点
        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            current = CallMemberExpressionCstToAst.createCallExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = CallMemberExpressionCstToAst.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = CallMemberExpressionCstToAst.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = CallMemberExpressionCstToAst.createImportCallAst(firstChild)
        } else {
            current = createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                const args = getUtil().createArgumentsAst(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === 'DotMemberExpression') {
                const dotChild = child.children[0]
                const identifierNameCst = child.children[1]
                const tokenCst = identifierNameCst.children[0]
                const property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                const dotOp = SlimeTokenCreate.createDotToken(dotChild.loc)
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'Dot') {
                const dotOp = SlimeTokenCreate.createDotToken(child.loc)
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'BracketExpression') {
                const propertyExpression = createExpressionAst(child.children[1])
                current = {
                    type: SlimeNodeType.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any

            } else if (child.name === 'LBracket') {
                const expressionChild = cst.children[i + 1]
                if (expressionChild && expressionChild.name !== 'RBracket') {
                    const propertyExpression = createExpressionAst(expressionChild)
                    current = {
                        type: SlimeNodeType.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any
                    i += 2
                }

            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                const quasi = getUtil().createTemplateLiteralAst(child)
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any

            } else if (child.name === 'RBracket') {
                continue
            }
        }

        return current
    }

    static createNewExpressionAst(cst: SubhutiCst): any {
        const isNewMemberExpr = cst.name === 'NewMemberExpressionArguments'
        const isNewExpr = cst.name === SlimeParser.prototype.NewExpression?.name

        if (!isNewMemberExpr && !isNewExpr) {
            throw new Error('createNewExpressionAst: 不支持的类型 ' + cst.name)
        }

        if (isNewMemberExpr) {
            let newToken: any = undefined
            let lParenToken: any = undefined
            let rParenToken: any = undefined

            const newCst = cst.children[0]
            if (newCst && (newCst.name === 'New' || newCst.value === 'new')) {
                newToken = SlimeTokenCreate.createNewToken(newCst.loc)
            }

            const argsCst = cst.children[2]
            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    }
                }
            }

            const calleeExpression = CallMemberExpressionCstToAst.createMemberExpressionAst(cst.children[1])
            const args = getUtil().createArgumentsAst(cst.children[2])

            return SlimeAstUtil.createNewExpression(
                calleeExpression, args, cst.loc,
                newToken, lParenToken, rParenToken
            )
        } else {
            const firstChild = cst.children[0]
            if (firstChild.name === 'New' || firstChild.value === 'new') {
                const newToken = SlimeTokenCreate.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = CallMemberExpressionCstToAst.createNewExpressionAst(innerNewExpr)

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                return createExpressionAst(firstChild)
            }
        }
    }

    static createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.MemberExpression?.name);

        if (cst.children.length === 0) {
            throw new Error('MemberExpression has no children')
        }

        let current: SlimeExpression
        let startIdx = 1

        if (cst.children[0].name === 'New') {
            const newCst = cst.children[0]
            const memberExprCst = cst.children[1]
            const argsCst = cst.children[2]

            const callee = CallMemberExpressionCstToAst.createMemberExpressionAst(memberExprCst)
            const args = argsCst ? getUtil().createArgumentsAst(argsCst) : []

            const newToken = SlimeTokenCreate.createNewToken(newCst.loc)
            let lParenToken: any = undefined
            let rParenToken: any = undefined

            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    }
                }
            }

            current = {
                type: 'NewExpression',
                callee: callee,
                arguments: args,
                newToken: newToken,
                lParenToken: lParenToken,
                rParenToken: rParenToken,
                loc: cst.loc
            } as any

            startIdx = 3
        } else {
            current = CallMemberExpressionCstToAst.createMemberExpressionFirstOr(cst.children[0]) as SlimeExpression
        }

        for (let i = startIdx; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'DotIdentifier') {
                const dotToken = SlimeTokenCreate.createDotToken(child.children[0].loc)
                let property: SlimeIdentifier | null = null
                if (child.children[1]) {
                    const identifierNameCst = child.children[1]
                    if (identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                        const tokenCst = identifierNameCst.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                    } else {
                        property = getUtil().createIdentifierAst(identifierNameCst)
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'Dot') {
                const dotToken = SlimeTokenCreate.createDotToken(child.loc)
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'BracketExpression') {
                const propertyExpression = createExpressionAst(child.children[1])
                current = {
                    type: SlimeNodeType.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any

            } else if (child.name === 'LBracket') {
                const expressionChild = cst.children[i + 1]
                if (expressionChild) {
                    const propertyExpression = createExpressionAst(expressionChild)
                    current = {
                        type: SlimeNodeType.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any
                    i += 2
                }

            } else if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                const args = getUtil().createArgumentsAst(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                const quasi = getUtil().createTemplateLiteralAst(child)
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any

            } else if (child.name === 'RBracket') {
                continue

            } else {
                throw new Error(`未知的MemberExpression子节点类型: ${child.name}`)
            }
        }

        return current
    }

    /**
     * 创建 SuperCall AST
     * SuperCall -> SuperTok + Arguments
     */
    static createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.SuperCall?.name);
        const argumentsCst = cst.children[1]
        const argumentsAst: SlimeCallArgument[] = getUtil().createArgumentsAst(argumentsCst)

        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        return SlimeAstUtil.createCallExpression(superNode, argumentsAst) as SlimeExpression
    }

    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    static createImportCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ImportCall?.name);

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = getUtil().createAssignmentExpressionAst(child)
                args.push(SlimeAstUtil.createCallArgument(expr))
            }
        }

        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression
    }

    /**
     * 创建 SuperProperty AST
     * SuperProperty:
     * 形式1: SuperTok + Dot + IdentifierName
     * 形式2: SuperTok + LBracket + Expression + RBracket
     */
    static createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        const second = cst.children[1]
        if (second.name === 'BracketExpression') {
            const propertyExpression = createExpressionAst(second.children[1])
            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any
        } else if (second.name === 'LBracket') {
            const expressionCst = cst.children[2]
            const propertyExpression = createExpressionAst(expressionCst)
            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any
        } else if (second.name === 'Dot') {
            const identifierNameCst = cst.children[2]
            let property: SlimeIdentifier
            if (identifierNameCst.name === 'IdentifierName' || identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                const tokenCst = identifierNameCst.children[0]
                property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                property = SlimeAstUtil.createIdentifier(identifierNameCst.value, identifierNameCst.loc)
            }

            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any
        } else {
            const propToken = cst.children[2]
            const property = SlimeAstUtil.createIdentifier(propToken.value, propToken.loc)

            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any
        }
    }

    /**
     * 创建 MetaProperty AST
     * MetaProperty: children[0]是NewTarget或ImportMeta
     */
    static createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.NewTarget?.name) {
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('new', first.loc),
                property: SlimeAstUtil.createIdentifier('target', first.loc),
                loc: cst.loc
            } as any
        } else {
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('import', first.loc),
                property: SlimeAstUtil.createIdentifier('meta', first.loc),
                loc: cst.loc
            } as any
        }
    }

    /**
     * 创建 MemberExpression 的第一个子节点 AST
     */
    static createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        if (cst.name === SlimeParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return getUtil().createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return CallMemberExpressionCstToAst.createSuperPropertyAst(cst)
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return CallMemberExpressionCstToAst.createMetaPropertyAst(cst)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return CallMemberExpressionCstToAst.createNewExpressionAst(cst)
        } else if (cst.name === 'New') {
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
    }

    // ==================== Assignment 相关辅助方法 ====================

    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name || child.name === 'AssignmentProperty') {
                properties.push(CallMemberExpressionCstToAst.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    static createAssignmentPropertyAst(cst: SubhutiCst): any {
        return getUtil().createBindingPropertyAst(cst)
    }

    static createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return getUtil().createBindingElementListAst(cst)
    }

    static createAssignmentElementAst(cst: SubhutiCst): any {
        return getUtil().createBindingElementAst(cst)
    }

    static createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return getUtil().createBindingElisionElementAst(cst)
    }

    static createAssignmentRestElementAst(cst: SubhutiCst): any {
        return getUtil().createBindingRestElementAst(cst)
    }

    static createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return getUtil().createBindingRestPropertyAst(cst)
    }
}
