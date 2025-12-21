import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeIdentifier, SlimeSuper, SlimeCallArgument, SlimeSpreadElement } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 成员调用表达式 CST 到 AST 转换器
 * 
 * 负责处理：
 * - MemberExpression: 成员访问表达式 (obj.prop, obj[expr])
 * - CallExpression: 函数调用表达式 (fn(), obj.method())
 * - CallMemberExpression: 成员调用表达式
 * - NewExpression: new 表达式
 * - LeftHandSideExpression: 左值表达式
 * - OptionalExpression: 可选链表达式 (?.)
 * - SuperProperty: super 属性访问
 * - SuperCall: super 调用
 * - ImportCall: import() 动态导入
 * - MetaProperty: 元属性 (new.target, import.meta)
 * - Arguments: 参数列表
 * - ArgumentList: 参数列表项
 */
export class MemberCallCstToAst {

    /**
     * 创建 CallExpression AST
     */
    static createCallExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
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
                return this.createSuperCallAst(first, util)
            }
            return util.createExpressionAst(first)
        }

        // 多个children：MemberExpression + Arguments + 可选的链式调用
        let current: SlimeExpression
        const firstChild = cst.children[0]

        // 处理第一个子节点
        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            current = this.createCallExpressionAst(firstChild, util)
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = this.createMemberExpressionAst(firstChild, util)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = this.createSuperCallAst(firstChild, util)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = this.createImportCallAst(firstChild, util)
        } else {
            current = util.createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                const args = this.createArgumentsAst(child, util)
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
                const propertyExpression = util.createExpressionAst(child.children[1])
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
                    const propertyExpression = util.createExpressionAst(expressionChild)
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
                const quasi = util.createTemplateLiteralAst(child)
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


    /**
     * 创建 SuperCall AST
     */
    static createSuperCallAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.SuperCall?.name);
        const argumentsCst = cst.children[1]
        const argumentsAst: SlimeCallArgument[] = this.createArgumentsAst(argumentsCst, util)

        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        return SlimeAstUtil.createCallExpression(superNode, argumentsAst) as SlimeExpression
    }

    /**
     * 创建 ImportCall AST
     */
    static createImportCallAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ImportCall?.name);

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = util.createAssignmentExpressionAst(child)
                args.push(SlimeAstUtil.createCallArgument(expr))
            }
        }

        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression
    }

    /**
     * 创建 SuperProperty AST
     */
    static createSuperPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        const second = cst.children[1]
        if (second.name === 'BracketExpression') {
            const propertyExpression = util.createExpressionAst(second.children[1])
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
            const propertyExpression = util.createExpressionAst(expressionCst)
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
     */
    static createMetaPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
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
     * 创建 Arguments AST
     */
    static createArgumentsAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeCallArgument> {
        checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                return this.createArgumentListAst(first1, util)
            }
        }
        return []
    }

    /**
     * 创建 ArgumentList AST
     */
    static createArgumentListAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeCallArgument> {
        checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
        const arguments_: Array<SlimeCallArgument> = []

        let currentArg: SlimeExpression | SlimeSpreadElement | null = null
        let hasArg = false
        let pendingEllipsis: SubhutiCst | null = null

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'Ellipsis' || child.name === 'Ellipsis') {
                pendingEllipsis = child
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }

                const expr = util.createAssignmentExpressionAst(child)
                if (pendingEllipsis) {
                    const ellipsisToken = SlimeTokenCreate.createEllipsisToken(pendingEllipsis.loc)
                    currentArg = SlimeAstUtil.createSpreadElement(expr, child.loc, ellipsisToken)
                    pendingEllipsis = null
                } else {
                    currentArg = expr
                }
                hasArg = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }
                currentArg = util.createSpreadElementAst(child)
                hasArg = true
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, commaToken))
                    hasArg = false
                    currentArg = null
                }
            }
        }

        if (hasArg) {
            arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }


    /**
     * 创建 MemberExpressionFirstOr AST
     */
    static createMemberExpressionFirstOr(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression | SlimeSuper {
        if (cst.name === SlimeParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return util.createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return this.createSuperPropertyAst(cst, util)
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return this.createMetaPropertyAst(cst, util)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return this.createNewExpressionAst(cst, util)
        } else if (cst.name === 'New') {
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
    }

    /**
     * 创建 NewExpression AST
     */
    static createNewExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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

            const calleeExpression = this.createMemberExpressionAst(cst.children[1], util)
            const args = this.createArgumentsAst(cst.children[2], util)

            return SlimeAstUtil.createNewExpression(
                calleeExpression, args, cst.loc,
                newToken, lParenToken, rParenToken
            )
        } else {
            const firstChild = cst.children[0]
            if (firstChild.name === 'New' || firstChild.value === 'new') {
                const newToken = SlimeTokenCreate.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = this.createNewExpressionAst(innerNewExpr, util)

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                return util.createExpressionAst(firstChild)
            }
        }
    }

    /**
     * 创建 MemberExpression AST
     */
    static createMemberExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.MemberExpression?.name);

        if (cst.children.length === 0) {
            throw new Error('MemberExpression has no children')
        }

        let current: SlimeExpression
        let startIdx = 1

        // 检查是否是 new MemberExpression Arguments 模式
        if (cst.children[0].name === 'New') {
            const newCst = cst.children[0]
            const memberExprCst = cst.children[1]
            const argsCst = cst.children[2]

            const callee = this.createMemberExpressionAst(memberExprCst, util)
            const args = argsCst ? this.createArgumentsAst(argsCst, util) : []

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
            current = this.createMemberExpressionFirstOr(cst.children[0], util) as SlimeExpression
        }

        // 循环处理剩余的children
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
                        property = util.createIdentifierAst(identifierNameCst)
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
                const propertyExpression = util.createExpressionAst(child.children[1])
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
                    const propertyExpression = util.createExpressionAst(expressionChild)
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
                const args = this.createArgumentsAst(child, util)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression
            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                const quasi = util.createTemplateLiteralAst(child)
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
     * 创建 LeftHandSideExpression AST
     */
    static createLeftHandSideExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.LeftHandSideExpression?.name);
        // 容错：Parser在ASI场景下可能生成不完整的CST，返回空标识符
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createIdentifier('', cst.loc)
        }
        return util.createExpressionAst(cst.children[0])
    }

    /**
     * 创建 OptionalExpression AST
     */
    static createOptionalExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式
        let result = util.createExpressionAst(cst.children[0])

        // 处理 OptionalChain
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = this.createOptionalChainAst(result, chainCst, util)
            }
        }

        return result
    }

    /**
     * 创建 OptionalChain AST
     */
    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        let result = object
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                const args = this.createArgumentsAst(child, util)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = util.createExpressionAst(chainCst.children[exprIndex])
                    result = {
                        type: SlimeNodeType.OptionalMemberExpression,
                        object: result,
                        property: property,
                        computed: true,
                        optional: nextIsOptional,
                        loc: chainCst.loc
                    } as any
                    nextIsOptional = false
                }
            } else if (name === 'IdentifierName') {
                let property: SlimeIdentifier
                const tokenCst = child.children[0]
                property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Dot' || child.value === '.') {
                continue
            } else if (name === 'RBracket' || child.value === ']') {
                continue
            } else if (name === 'PrivateIdentifier') {
                const property = util.createPrivateIdentifierAst(child)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Expression') {
                continue
            }
        }

        return result
    }

    /**
     * 创建 CallMemberExpression AST
     */
    static createCallMemberExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        return this.createCallExpressionAst(cst, util)
    }

    /**
     * 创建 CoverCallExpressionAndAsyncArrowHead AST
     */
    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        return this.createCallExpressionAst(cst, util)
    }
}
