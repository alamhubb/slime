/**
 * SlimeCallExpressionCstToAst - 函数调用表达式
 *
 * 负责：
 * - 普通函数调用
 * - new 表达式
 * - 标签模板调用
 * - import() 动态导入
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeAstTypeName,
    type SlimeCallArgument,
    SlimeExpression, type SlimeIdentifier, SlimeSpreadElement,
    type SlimeSuper,
    SlimeTokenCreateUtils
} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class SlimeCallExpressionCstToAstSingle {
    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                const res = SlimeCstToAstUtil.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
        const arguments_: Array<SlimeCallArgument> = []

        // 遍历children，处�?Ellipsis + AssignmentExpression + Comma 组合
        // 每个参数与其后面的逗号配对
        let currentArg: SlimeExpression | SlimeSpreadElement | null = null
        let hasArg = false
        let pendingEllipsis: SubhutiCst | null = null

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'Ellipsis' || child.name === 'Ellipsis') {
                // 记录 ellipsis，下一个表达式�?spread
                pendingEllipsis = child
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                // 如果之前有参数但没有逗号，先推入
                if (hasArg) {
                    arguments_.push(SlimeAstCreateUtils.createCallArgument(currentArg!, undefined))
                }

                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                if (pendingEllipsis) {
                    // 创建 SpreadElement
                    const ellipsisToken = SlimeTokenCreateUtils.createEllipsisToken(pendingEllipsis.loc)
                    currentArg = SlimeAstCreateUtils.createSpreadElement(expr, child.loc, ellipsisToken)
                    pendingEllipsis = null
                } else {
                    currentArg = expr
                }
                hasArg = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                // 处理 spread 参数�?..args（旧结构兼容�?
                if (hasArg) {
                    arguments_.push(SlimeAstCreateUtils.createCallArgument(currentArg!, undefined))
                }
                currentArg = SlimeCstToAstUtil.createSpreadElementAst(child)
                hasArg = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的参数配对
                const commaToken = SlimeTokenCreateUtils.createCommaToken(child.loc)
                if (hasArg) {
                    arguments_.push(SlimeAstCreateUtils.createCallArgument(currentArg!, commaToken))
                    hasArg = false
                    currentArg = null
                }
            }
        }

        // 处理最后一个参数（如果没有尾随逗号�?
        if (hasArg) {
            arguments_.push(SlimeAstCreateUtils.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }


    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
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
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = SlimeCstToAstUtil.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = SlimeCstToAstUtil.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = SlimeCstToAstUtil.createImportCallAst(firstChild)
        } else {
            // 尝试作为表达式处�?
            current = SlimeCstToAstUtil.createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - 函数调用
                const args = SlimeCstToAstUtil.createArgumentsAst(child)
                current = SlimeAstCreateUtils.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === 'DotMemberExpression') {
                // DotMemberExpression包含Dot和IdentifierName (旧版兼容)
                const dotChild = child.children[0]  // Dot token
                const identifierNameCst = child.children[1]  // IdentifierName
                const tokenCst = identifierNameCst.children[0]  // 实际的token（Identifier或关键字�?
                const property = SlimeAstCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                const dotOp = SlimeTokenCreateUtils.createDotToken(dotChild.loc)
                current = SlimeAstCreateUtils.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                const dotOp = SlimeTokenCreateUtils.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeAstCreateUtils.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }
                current = SlimeAstCreateUtils.createMemberExpression(current, dotOp, property)

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

            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
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


    createNewExpressionAst(cst: SubhutiCst): any {
        // 支持两种类型：NewExpression �?NewMemberExpressionArguments
        const isNewMemberExpr = cst.name === 'NewMemberExpressionArguments'
        const isNewExpr = cst.name === SlimeParser.prototype.NewExpression?.name

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
                newToken = SlimeTokenCreateUtils.createNewToken(newCst.loc)
            }

            // 提取 Arguments 中的 LParen/RParen tokens
            const argsCst = cst.children[2]
            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
                    }
                }
            }

            const calleeExpression = SlimeCstToAstUtil.createMemberExpressionAst(cst.children[1])
            const args = SlimeCstToAstUtil.createArgumentsAst(cst.children[2])

            return SlimeAstCreateUtils.createNewExpression(
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
                const newToken = SlimeTokenCreateUtils.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = SlimeCstToAstUtil.createNewExpressionAst(innerNewExpr)

                return SlimeAstCreateUtils.createNewExpression(
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
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.SuperCall?.name);
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

        return SlimeAstCreateUtils.createCallExpression(superNode, argumentsAst) as SlimeExpression
    }

}

export const SlimeCallExpressionCstToAst = new SlimeCallExpressionCstToAstSingle()
