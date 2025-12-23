/**
 * MemberCallCstToAst - 成员访问/调用表达�?可选链转换
 */
import { SubhutiCst } from "subhuti";
import {
    SlimeJavascriptCreateUtils, type SlimeJavascriptCallArgument,
    SlimeJavascriptExpression,
    type SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, type SlimeJavascriptPattern, SlimeJavascriptSpreadElement, type SlimeJavascriptSuper,
    SlimeJavascriptTokenCreateUtils,
    type SlimeJavascriptVariableDeclarator
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptMemberCallCstToAstSingle {

    /**
     * ExpressionBody CST �?AST
     * ExpressionBody -> AssignmentExpression
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }


    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeJavascriptSuper {
        if (cst.name === SlimeJavascriptParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return SlimeCstToAstUtil.createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeJavascriptParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return SlimeCstToAstUtil.createSuperPropertyAst(cst)
        } else if (cst.name === SlimeJavascriptParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return SlimeCstToAstUtil.createMetaPropertyAst(cst)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return SlimeCstToAstUtil.createNewExpressionAst(cst)
        } else if (cst.name === 'New') {
            // Es2025Parser: new MemberExpression Arguments 是直接的 token 序列
            // 这种情况应该�?createMemberExpressionAst 中处�?
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
    }


    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.MemberExpression?.name);

        if (cst.children.length === 0) {
            throw new Error('MemberExpression has no children')
        }

        // 从第一个child创建base对象
        let current: SlimeExpression
        let startIdx = 1

        // Es2025Parser: 检查是否是 new MemberExpression Arguments 模式
        // 第一个子节点�?NewTok
        if (cst.children[0].name === 'New') {
            // new MemberExpression Arguments [后续成员访问]
            // children: [NewTok, MemberExpression, Arguments, Dot?, IdentifierName?, ...]
            const newCst = cst.children[0]
            const memberExprCst = cst.children[1]
            const argsCst = cst.children[2]

            const callee = SlimeCstToAstUtil.createMemberExpressionAst(memberExprCst)
            const args = argsCst ? SlimeCstToAstUtil.createArgumentsAst(argsCst) : []

            // 提取 tokens
            const newToken = SlimeJavascriptTokenCreateUtils.createNewToken(newCst.loc)
            let lParenToken: any = undefined
            let rParenToken: any = undefined

            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(child.loc)
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

            // �?Arguments 之后继续处理（如 .bar�?
            startIdx = 3
        } else {
            current = SlimeCstToAstUtil.createMemberExpressionFirstOr(cst.children[0]) as SlimeJavascriptExpression
        }

        // 循环处理剩余的children（Dot+IdentifierName、LBracket+Expression+RBracket、Arguments、TemplateLiteral�?
        for (let i = startIdx; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'DotIdentifier') {
                // .property - 成员访问 (旧版兼容)
                const dotToken = SlimeJavascriptTokenCreateUtils.createDotToken(child.children[0].loc)

                // children[1]是IdentifierName，可能是Identifier或关键字token
                let property: SlimeIdentifier | null = null
                if (child.children[1]) {
                    const identifierNameCst = child.children[1]
                    if (identifierNameCst.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                        // IdentifierName -> Identifier or Keyword token
                        const tokenCst = identifierNameCst.children[0]
                        property = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                    } else {
                        // 直接是token（向后兼容）
                        property = SlimeCstToAstUtil.createIdentifierAst(identifierNameCst)
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeJavascriptCreateUtils.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                // .property - 成员访问
                const dotToken = SlimeJavascriptTokenCreateUtils.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeJavascriptParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        // IdentifierName -> Identifier or Keyword token
                        const tokenCst = nextChild.children[0]
                        property = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        // 私有标识�?#prop
                        property = SlimeJavascriptCreateUtils.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeJavascriptCreateUtils.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'BracketExpression') {
                // [expression] - computed property access (旧版兼容)
                const propertyExpression = SlimeCstToAstUtil.createExpressionAst(child.children[1])
                current = {
                    type: SlimeAstTypeName.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any

            } else if (child.name === 'LBracket') {
                // Es2025Parser产生的是直接�?LBracket + Expression + RBracket
                // [expression] - computed property access
                const expressionChild = cst.children[i + 1]
                if (expressionChild) {
                    const propertyExpression = SlimeCstToAstUtil.createExpressionAst(expressionChild)
                    current = {
                        type: SlimeAstTypeName.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any
                    i += 2 // 跳过Expression和RBracket
                }

            } else if (child.name === SlimeJavascriptParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - function call
                const args = SlimeCstToAstUtil.createArgumentsAst(child)
                current = SlimeJavascriptCreateUtils.createCallExpression(current, args) as SlimeJavascriptExpression

            } else if (child.name === SlimeJavascriptParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                // `template` - Tagged Template
                const quasi = SlimeCstToAstUtil.createTemplateLiteralAst(child)
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any

            } else if (child.name === 'RBracket') {
                // 跳过RBracket，它已经在LBracket处理中被处理
                continue

            } else {
                throw new Error(`未知的MemberExpression子节点类�? ${child.name}`)
            }
        }

        return current
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeJavascriptParser.prototype.ArgumentList?.name) {
                const res = SlimeCstToAstUtil.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ArgumentList?.name);
        const arguments_: Array<SlimeJavascriptCallArgument> = []

        // 遍历children，处�?Ellipsis + AssignmentExpression + Comma 组合
        // 每个参数与其后面的逗号配对
        let currentArg: SlimeExpression | SlimeJavascriptSpreadElement | null = null
        let hasArg = false
        let pendingEllipsis: SubhutiCst | null = null

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'Ellipsis' || child.name === 'Ellipsis') {
                // 记录 ellipsis，下一个表达式�?spread
                pendingEllipsis = child
            } else if (child.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                // 如果之前有参数但没有逗号，先推入
                if (hasArg) {
                    arguments_.push(SlimeJavascriptCreateUtils.createCallArgument(currentArg!, undefined))
                }

                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                if (pendingEllipsis) {
                    // 创建 SpreadElement
                    const ellipsisToken = SlimeJavascriptTokenCreateUtils.createEllipsisToken(pendingEllipsis.loc)
                    currentArg = SlimeJavascriptCreateUtils.createSpreadElement(expr, child.loc, ellipsisToken)
                    pendingEllipsis = null
                } else {
                    currentArg = expr
                }
                hasArg = true
            } else if (child.name === SlimeJavascriptParser.prototype.SpreadElement?.name) {
                // 处理 spread 参数�?..args（旧结构兼容�?
                if (hasArg) {
                    arguments_.push(SlimeJavascriptCreateUtils.createCallArgument(currentArg!, undefined))
                }
                currentArg = SlimeCstToAstUtil.createSpreadElementAst(child)
                hasArg = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的参数配对
                const commaToken = SlimeJavascriptTokenCreateUtils.createCommaToken(child.loc)
                if (hasArg) {
                    arguments_.push(SlimeJavascriptCreateUtils.createCallArgument(currentArg!, commaToken))
                    hasArg = false
                    currentArg = null
                }
            }
        }

        // 处理最后一个参数（如果没有尾随逗号�?
        if (hasArg) {
            arguments_.push(SlimeJavascriptCreateUtils.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }


    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        // Support both CallExpression and CoverCallExpressionAndAsyncArrowHead
        const isCallExpr = cst.name === SlimeJavascriptParser.prototype.CallExpression?.name || cst.name === 'CallExpression'
        const isCoverExpr = cst.name === 'CoverCallExpressionAndAsyncArrowHead'

        if (!isCallExpr && !isCoverExpr) {
            throw new Error(`createCallExpressionAst: Expected CallExpression or CoverCallExpressionAndAsyncArrowHead, got ${cst.name}`)
        }

        if (cst.children.length === 1) {
            // 单个子节点，可能是SuperCall
            const first = cst.children[0]
            if (first.name === SlimeJavascriptParser.prototype.SuperCall?.name) {
                return SlimeCstToAstUtil.createSuperCallAst(first)
            }
            return SlimeCstToAstUtil.createExpressionAst(first)
        }

        // 多个children：MemberExpression + Arguments + 可选的链式调用
        // children[0]: MemberExpression �?CoverCallExpressionAndAsyncArrowHead
        // children[1]: Arguments (第一次调�?
        // children[2+]: Dot/Identifier/Arguments（链式调用）

        let current: SlimeExpression
        const firstChild = cst.children[0]

        // 处理第一个子节点
        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            // CoverCallExpressionAndAsyncArrowHead 结构: [MemberExpression, Arguments]
            // 递归处理�?
            current = SlimeCstToAstUtil.createCallExpressionAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = SlimeCstToAstUtil.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = SlimeCstToAstUtil.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = SlimeCstToAstUtil.createImportCallAst(firstChild)
        } else {
            // 尝试作为表达式处�?
            current = SlimeCstToAstUtil.createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeJavascriptParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - 函数调用
                const args = SlimeCstToAstUtil.createArgumentsAst(child)
                current = SlimeJavascriptCreateUtils.createCallExpression(current, args) as SlimeJavascriptExpression

            } else if (child.name === 'DotMemberExpression') {
                // DotMemberExpression包含Dot和IdentifierName (旧版兼容)
                const dotChild = child.children[0]  // Dot token
                const identifierNameCst = child.children[1]  // IdentifierName
                const tokenCst = identifierNameCst.children[0]  // 实际的token（Identifier或关键字�?
                const property = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                const dotOp = SlimeJavascriptTokenCreateUtils.createDotToken(dotChild.loc)
                current = SlimeJavascriptCreateUtils.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                const dotOp = SlimeJavascriptTokenCreateUtils.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeJavascriptParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeJavascriptCreateUtils.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }
                current = SlimeJavascriptCreateUtils.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'BracketExpression') {
                // [expr] - computed property (旧版兼容)
                const propertyExpression = SlimeCstToAstUtil.createExpressionAst(child.children[1])
                current = {
                    type: SlimeAstTypeName.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any

            } else if (child.name === 'LBracket') {
                // Es2025Parser产生的是直接�?LBracket + Expression + RBracket
                const expressionChild = cst.children[i + 1]
                if (expressionChild && expressionChild.name !== 'RBracket') {
                    const propertyExpression = SlimeCstToAstUtil.createExpressionAst(expressionChild)
                    current = {
                        type: SlimeAstTypeName.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any
                    i += 2 // 跳过Expression和RBracket
                }

            } else if (child.name === SlimeJavascriptParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                // `template` - Tagged Template
                const quasi = SlimeCstToAstUtil.createTemplateLiteralAst(child)
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any

            } else if (child.name === 'RBracket') {
                // 跳过RBracket
                continue
            }
        }

        return current
    }



    /**
     * CallMemberExpression CST �?AST
     * CallMemberExpression -> MemberExpression Arguments
     */
    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createCallExpressionAst(cst)
    }



    createNewExpressionAst(cst: SubhutiCst): any {
        // 支持两种类型：NewExpression �?NewMemberExpressionArguments
        const isNewMemberExpr = cst.name === 'NewMemberExpressionArguments'
        const isNewExpr = cst.name === SlimeJavascriptParser.prototype.NewExpression?.name

        if (!isNewMemberExpr && !isNewExpr) {
            throw new Error('createNewExpressionAst: 不支持的类型 ' + cst.name)
        }

        if (isNewMemberExpr) {
            // NewMemberExpressionArguments -> NewTok + MemberExpression + Arguments
            // Token fields
            let newToken: any = undefined
            let lParenToken: any = undefined
            let rParenToken: any = undefined

            // 提取 new token
            const newCst = cst.children[0]
            if (newCst && (newCst.name === 'New' || newCst.value === 'new')) {
                newToken = SlimeJavascriptTokenCreateUtils.createNewToken(newCst.loc)
            }

            // 提取 Arguments 中的 LParen/RParen tokens
            const argsCst = cst.children[2]
            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(child.loc)
                    }
                }
            }

            const calleeExpression = SlimeCstToAstUtil.createMemberExpressionAst(cst.children[1])
            const args = SlimeCstToAstUtil.createArgumentsAst(cst.children[2])

            return SlimeJavascriptCreateUtils.createNewExpression(
                calleeExpression, args, cst.loc,
                newToken, lParenToken, rParenToken
            )
        } else {
            // NewExpression 有两种形式：
            // 1. MemberExpression - 直接委托�?MemberExpression
            // 2. new NewExpression - 创建 NewExpression（无参数�?

            const firstChild = cst.children[0]
            if (firstChild.name === 'New' || firstChild.value === 'new') {
                // 这是 `new NewExpression` 形式，创建无参数�?NewExpression
                const newToken = SlimeJavascriptTokenCreateUtils.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = SlimeCstToAstUtil.createNewExpressionAst(innerNewExpr)

                return SlimeJavascriptCreateUtils.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                // 这是 MemberExpression 形式，递归处理
                return SlimeCstToAstUtil.createExpressionAst(firstChild)
            }
        }
    }


    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.SuperCall?.name);
        // SuperCall -> SuperTok + Arguments
        // children[0]: SuperTok token
        // children[1]: Arguments CST
        const argumentsCst = cst.children[1]
        const argumentsAst: SlimeCallArgument[] = SlimeCstToAstUtil.createArgumentsAst(argumentsCst)

        // 创建Super节点作为callee
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        return SlimeJavascriptCreateUtils.createCallExpression(superNode, argumentsAst) as SlimeJavascriptExpression
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        // SuperProperty:
        // 形式1: SuperTok + Dot + IdentifierName
        // 形式2: SuperTok + LBracket + Expression + RBracket
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        const second = cst.children[1]
        if (second.name === 'BracketExpression') {
            // super[expression] - 旧版兼容
            const propertyExpression = SlimeCstToAstUtil.createExpressionAst(second.children[1])
            return {
                type: SlimeAstTypeName.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any
        } else if (second.name === 'LBracket') {
            // Es2025Parser: super[expression]
            // children: [SuperTok, LBracket, Expression, RBracket]
            const expressionCst = cst.children[2]
            const propertyExpression = SlimeCstToAstUtil.createExpressionAst(expressionCst)
            return {
                type: SlimeAstTypeName.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any
        } else if (second.name === 'Dot') {
            // Es2025Parser: super.property
            // children: [SuperTok, Dot, IdentifierName]
            const identifierNameCst = cst.children[2]
            let property: SlimeIdentifier
            if (identifierNameCst.name === 'IdentifierName' || identifierNameCst.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                const tokenCst = identifierNameCst.children[0]
                property = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                // 直接是token
                property = SlimeJavascriptCreateUtils.createIdentifier(identifierNameCst.value, identifierNameCst.loc)
            }

            return {
                type: SlimeAstTypeName.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any
        } else {
            // 旧版兼容: super.property
            // children: [SuperTok, Dot, Identifier]
            const propToken = cst.children[2]
            const property = SlimeJavascriptCreateUtils.createIdentifier(propToken.value, propToken.loc)

            return {
                type: SlimeAstTypeName.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any
        }
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        // MetaProperty: children[0]是NewTarget或ImportMeta
        const first = cst.children[0]
        if (first.name === SlimeJavascriptParser.prototype.NewTarget?.name) {
            // new.target
            return {
                type: 'MetaProperty',
                meta: SlimeCreateUtils.createIdentifier('new', first.loc),
                property: SlimeCreateUtils.createIdentifier('target', first.loc),
                loc: cst.loc
            } as any
        } else {
            // import.meta
            return {
                type: 'MetaProperty',
                meta: SlimeCreateUtils.createIdentifier('import', first.loc),
                property: SlimeCreateUtils.createIdentifier('meta', first.loc),
                loc: cst.loc
            } as any
        }
    }



    /**
     * CoverCallExpressionAndAsyncArrowHead CST �?AST
     * 这是一�?cover grammar，通常作为 CallExpression 处理
     */
    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createCallExpressionAst(cst)
    }



    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LeftHandSideExpression?.name);
        // 容错：Parser在ASI场景下可能生成不完整的CST，返回空标识�?
        if (!cst.children || cst.children.length === 0) {
            return SlimeJavascriptCreateUtils.createIdentifier('', cst.loc)
        }
        if (cst.children.length > 1) {

        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
    }

}


export const SlimeJavascriptMemberCallCstToAst = new SlimeJavascriptMemberCallCstToAstSingle()
