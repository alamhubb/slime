import {
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeSpreadElement,
    type SlimeCallExpression,
    type SlimeMemberExpression,
    type SlimeSuper,
    type SlimeThisExpression,
    type SlimeCallArgument,
    type SlimeRestElement,
    type SlimePattern,
    type SlimeArrowFunctionExpression,
    type SlimeFunctionExpression,
    type SlimeBlockStatement,
    type SlimeFunctionParam,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import { checkCstName } from "../SlimeCstToAstUtil.ts";

// Util 引用，用于跨类调用
let _slimeCstToAstUtil: any = null;

export function setExpressionCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for ExpressionCstToAst');
    }
    return _slimeCstToAstUtil;
}

// 表达式 AST 缓存
const expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>();

/**
 * 表达式相关的 CST to AST 转换
 */
export class ExpressionCstToAst {

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
                return ExpressionCstToAst.createSuperCallAst(first)
            }
            return ExpressionCstToAst.createExpressionAst(first)
        }

        // 多个children：MemberExpression + Arguments + 可选的链式调用
        let current: SlimeExpression
        const firstChild = cst.children[0]

        // 处理第一个子节点
        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            current = ExpressionCstToAst.createCallExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = ExpressionCstToAst.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = ExpressionCstToAst.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = ExpressionCstToAst.createImportCallAst(firstChild)
        } else {
            current = ExpressionCstToAst.createExpressionAst(firstChild)
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
                const propertyExpression = ExpressionCstToAst.createExpressionAst(child.children[1])
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
                    const propertyExpression = ExpressionCstToAst.createExpressionAst(expressionChild)
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

            const calleeExpression = ExpressionCstToAst.createMemberExpressionAst(cst.children[1])
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
                const calleeExpression = ExpressionCstToAst.createNewExpressionAst(innerNewExpr)

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                return ExpressionCstToAst.createExpressionAst(firstChild)
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

            const callee = ExpressionCstToAst.createMemberExpressionAst(memberExprCst)
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
            current = ExpressionCstToAst.createMemberExpressionFirstOr(cst.children[0]) as SlimeExpression
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
                const propertyExpression = ExpressionCstToAst.createExpressionAst(child.children[1])
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
                    const propertyExpression = ExpressionCstToAst.createExpressionAst(expressionChild)
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

    static createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return ExpressionCstToAst.createExpressionAst(child)
            }
        }
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' && ch.value !== '(' && ch.value !== ')'
        )
        if (innerExpr) {
            return ExpressionCstToAst.createExpressionAst(innerExpr)
        }
        throw new Error('ParenthesizedExpression has no inner expression')
    }

    static createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCallExpressionAst(cst)
    }

    static createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return ExpressionCstToAst.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }

    static createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = ExpressionCstToAst.createExpressionAstUncached(cst)
        expressionAstCache.set(cst, result)
        return result
    }

    private static createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeParser.prototype.Expression?.name) {
            const expressions: SlimeExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    continue
                }
                expressions.push(ExpressionCstToAst.createExpressionAst(child))
            }

            if (expressions.length === 1) {
                left = expressions[0]
            } else if (expressions.length > 1) {
                left = {
                    type: 'SequenceExpression',
                    expressions: expressions,
                    loc: cst.loc
                } as any
            } else {
                throw new Error('Expression has no children')
            }
        } else if (astName === SlimeParser.prototype.Statement?.name) {
            left = getUtil().createStatementAst(cst)
        } else if (astName === SlimeParser.prototype.AssignmentExpression?.name) {
            left = ExpressionCstToAst.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ConditionalExpression?.name) {
            left = ExpressionCstToAst.createConditionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalORExpression?.name) {
            left = ExpressionCstToAst.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalANDExpression?.name) {
            left = ExpressionCstToAst.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseORExpression?.name) {
            left = ExpressionCstToAst.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseXORExpression?.name) {
            left = ExpressionCstToAst.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseANDExpression?.name) {
            left = ExpressionCstToAst.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.EqualityExpression?.name) {
            left = ExpressionCstToAst.createEqualityExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.RelationalExpression?.name) {
            left = ExpressionCstToAst.createRelationalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ShiftExpression?.name) {
            left = ExpressionCstToAst.createShiftExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AdditiveExpression?.name) {
            left = ExpressionCstToAst.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MultiplicativeExpression?.name) {
            left = ExpressionCstToAst.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UnaryExpression?.name) {
            left = ExpressionCstToAst.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = ExpressionCstToAst.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = ExpressionCstToAst.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LeftHandSideExpression?.name) {
            left = ExpressionCstToAst.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.CallExpression?.name) {
            left = ExpressionCstToAst.createCallExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.NewExpression?.name) {
            left = ExpressionCstToAst.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = ExpressionCstToAst.createNewExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MemberExpression?.name) {
            left = ExpressionCstToAst.createMemberExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.PrimaryExpression?.name) {
            left = ExpressionCstToAst.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.YieldExpression?.name) {
            left = ExpressionCstToAst.createYieldExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AwaitExpression?.name) {
            left = ExpressionCstToAst.createAwaitExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.SuperProperty?.name) {
            left = ExpressionCstToAst.createSuperPropertyAst(cst)
        } else if (astName === SlimeParser.prototype.MetaProperty?.name) {
            left = ExpressionCstToAst.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            left = ExpressionCstToAst.createExpressionAst(cst.children[0])
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    left = ExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            left = ExpressionCstToAst.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            left = ExpressionCstToAst.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            left = ExpressionCstToAst.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            left = ExpressionCstToAst.createOptionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            left = getUtil().createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            left = getUtil().createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            left = ExpressionCstToAst.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            left = getUtil().createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }

    static createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        let result = ExpressionCstToAst.createExpressionAst(cst.children[0])

        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = ExpressionCstToAst.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

    static createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length === 1) {
            return ExpressionCstToAst.createExpressionAst(cst.children[0])
        }

        let left = ExpressionCstToAst.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]
            const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeNodeType.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
    }

    static createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length === 1) {
            return ExpressionCstToAst.createExpressionAst(cst.children[0])
        }

        const left = ExpressionCstToAst.createExpressionAst(cst.children[0])
        const operator = cst.children[1]
        const right = ExpressionCstToAst.createExponentiationExpressionAst(cst.children[2])
        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }


    static createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            const left = ExpressionCstToAst.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any
            const right = ExpressionCstToAst.createExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }
            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }

            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            let left = ExpressionCstToAst.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = ExpressionCstToAst.createExpressionAst(cst.children[i + 1])

                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any
            }

            return left
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        if (!cst.children || cst.children.length === 0) {
            console.error('UnaryExpression CST没有children:', JSON.stringify(cst, null, 2))
            throw new Error(`UnaryExpression CST没有children，可能是Parser生成的CST不完整`)
        }

        if (cst.children.length === 1) {
            const child = cst.children[0]

            if (child.value !== undefined && !child.children) {
                throw new Error(
                    `UnaryExpression CST不完整：只有运算符token '${child.name}' (${child.value})，缺少操作数。` +
                    `这是Parser层的问题，请检查Es2025Parser.UnaryExpression的Or分支逻辑。`
                )
            }

            return ExpressionCstToAst.createExpressionAst(child)
        }

        const operatorToken = cst.children[0]
        const argumentCst = cst.children[1]

        const operatorMap: {[key: string]: string} = {
            'Exclamation': '!',
            'Plus': '+',
            'Minus': '-',
            'Tilde': '~',
            'Typeof': 'typeof',
            'Void': 'void',
            'Delete': 'delete',
            'PlusPlus': '++',
            'MinusMinus': '--',
        }

        const operator = operatorMap[operatorToken.name] || operatorToken.value
        const argument = ExpressionCstToAst.createExpressionAst(argumentCst)

        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,
            argument: argument,
            loc: cst.loc
        } as any
    }

    static createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length > 1) {
            const first = cst.children[0]
            const isPrefix = first.loc?.type === 'PlusPlus' || first.loc?.type === 'MinusMinus' ||
                first.value === '++' || first.value === '--'

            if (isPrefix) {
                const operator = first.value || first.loc?.value
                const argument = ExpressionCstToAst.createExpressionAst(cst.children[1])
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any
            } else {
                const argument = ExpressionCstToAst.createExpressionAst(cst.children[0])
                let operator: string | undefined
                for (let i = 1; i < cst.children.length; i++) {
                    const child = cst.children[i]
                    if (child.loc?.type === 'PlusPlus' || child.loc?.type === 'MinusMinus' ||
                        child.value === '++' || child.value === '--') {
                        operator = child.value || child.loc?.value
                        break
                    }
                }
                if (operator) {
                    return {
                        type: SlimeNodeType.UpdateExpression,
                        operator: operator,
                        argument: argument,
                        prefix: false,
                        loc: cst.loc
                    } as any
                }
            }
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }

    static createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LeftHandSideExpression?.name);
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createIdentifier('', cst.loc)
        }
        if (cst.children.length > 1) {
            // Handle multiple children if needed
        }
        return ExpressionCstToAst.createExpressionAst(cst.children[0])
    }


    static createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            return getUtil().createIdentifierAst(first.children[0])
        } else if (first.name === SlimeParser.prototype.Literal?.name) {
            return getUtil().createLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ArrayLiteral?.name) {
            return getUtil().createArrayLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.FunctionExpression?.name) {
            return getUtil().createFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ObjectLiteral?.name) {
            return getUtil().createObjectLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ClassExpression?.name) {
            return getUtil().createClassExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeTokenConsumer.prototype.This?.name) {
            return SlimeAstUtil.createThisExpression(first.loc)
        } else if (first.name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name) {
            return getUtil().createRegExpLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorExpression?.name || first.name === 'GeneratorExpression') {
            return ExpressionCstToAst.createGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncFunctionExpression?.name || first.name === 'AsyncFunctionExpression') {
            return ExpressionCstToAst.createAsyncFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorExpression?.name || first.name === 'AsyncGeneratorExpression') {
            return ExpressionCstToAst.createAsyncGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            first.name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            if (!first.children || first.children.length === 0) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            if (first.children.length === 2) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            const middleCst = first.children[1]
            if (!middleCst) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            if (middleCst.name === SlimeParser.prototype.Expression?.name || middleCst.name === 'Expression') {
                const innerExpr = ExpressionCstToAst.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            }

            if (middleCst.name === SlimeParser.prototype.AssignmentExpression?.name || middleCst.name === 'AssignmentExpression') {
                const innerExpr = ExpressionCstToAst.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            }

            if (middleCst.name === SlimeParser.prototype.FormalParameterList?.name || middleCst.name === 'FormalParameterList') {
                const params = getUtil().createFormalParameterListAst(middleCst)
                if (params.length === 1 && params[0].type === SlimeNodeType.Identifier) {
                    return SlimeAstUtil.createParenthesizedExpression(params[0] as any, first.loc)
                }
                if (params.length > 1) {
                    const expressions = params.map((p: any) => p as any)
                    return SlimeAstUtil.createParenthesizedExpression({
                        type: 'SequenceExpression',
                        expressions: expressions
                    } as any, first.loc)
                }
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            try {
                const innerExpr = ExpressionCstToAst.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            } catch (e) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }
        } else if (first.name === SlimeParser.prototype.TemplateLiteral?.name) {
            return getUtil().createTemplateLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ParenthesizedExpression?.name) {
            const expressionCst = first.children[1]
            const innerExpression = ExpressionCstToAst.createExpressionAst(expressionCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpression, first.loc)
        } else if (first.name === 'RegularExpressionLiteral' || first.name === 'RegularExpressionLiteral') {
            return getUtil().createRegExpLiteralAst(first)
        } else {
            throw new Error('未知的 PrimaryExpression 类型: ' + first.name)
        }
    }

    static createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, false, cst.loc)
        return func
    }

    static createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, false, true, cst.loc)
        return func
    }

    static createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, true, cst.loc)
        return func
    }

    static createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return getUtil().createArrowFunctionAst(child)
            }
            return ExpressionCstToAst.createExpressionAst(child)
        }

        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = ExpressionCstToAst.createExpressionAst(leftCst)
        const right = ExpressionCstToAst.createAssignmentExpressionAst(rightCst)
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: any = {
            type: 'AssignmentExpression',
            operator: operator as any,
            left: left as any,
            right: right,
            loc: cst.loc
        }
        return ast
    }

    static createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = ExpressionCstToAst.createExpressionAst(firstChild)
        let alternate
        let consequent

        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return ExpressionCstToAst.createExpressionAst(cst.children[0])
        } else {
            const questionCst = cst.children[1]
            const colonCst = cst.children[3]

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeTokenCreate.createQuestionToken(questionCst.loc)
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)
            }

            consequent = ExpressionCstToAst.createAssignmentExpressionAst(cst.children[2])
            alternate = ExpressionCstToAst.createAssignmentExpressionAst(cst.children[4])
        }

        return SlimeAstUtil.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }

    static createYieldExpressionAst(cst: SubhutiCst): any {
        let yieldToken: any = undefined
        let delegate = false
        let argument: SlimeExpression | null = null

        for (const child of cst.children) {
            if (child.name === 'Yield' || child.value === 'yield') {
                yieldToken = SlimeTokenCreate.createYieldToken(child.loc)
            } else if (child.name === 'Asterisk' || child.value === '*') {
                delegate = true
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name ||
                child.name === 'AssignmentExpression') {
                argument = ExpressionCstToAst.createAssignmentExpressionAst(child)
            }
        }

        return {
            type: 'YieldExpression',
            delegate: delegate,
            argument: argument,
            yieldToken: yieldToken,
            loc: cst.loc
        }
    }

    static createAwaitExpressionAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined
        let argument: SlimeExpression | null = null

        for (const child of cst.children) {
            if (child.name === 'Await' || child.value === 'await') {
                awaitToken = SlimeTokenCreate.createAwaitToken(child.loc)
            } else {
                argument = ExpressionCstToAst.createExpressionAst(child)
            }
        }

        return {
            type: 'AwaitExpression',
            argument: argument,
            awaitToken: awaitToken,
            loc: cst.loc
        }
    }


    // ==================== 从 SlimeCstToAstUtil.ts 提取的方法 ====================

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
                const expr = ExpressionCstToAst.createAssignmentExpressionAst(child)
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
            const propertyExpression = ExpressionCstToAst.createExpressionAst(second.children[1])
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
            const propertyExpression = ExpressionCstToAst.createExpressionAst(expressionCst)
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
            return ExpressionCstToAst.createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return ExpressionCstToAst.createSuperPropertyAst(cst)
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return ExpressionCstToAst.createMetaPropertyAst(cst)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return ExpressionCstToAst.createNewExpressionAst(cst)
        } else if (cst.name === 'New') {
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
    }

    /**
     * CoalesceExpressionHead CST 转 AST
     * CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    static createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return ExpressionCstToAst.createExpressionAst(firstChild)
        }
        throw new Error('CoalesceExpressionHead has no children')
    }

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     */
    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                const args = getUtil().createArgumentsAst(child)
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
                    const property = ExpressionCstToAst.createExpressionAst(chainCst.children[exprIndex])
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
                const property = getUtil().createPrivateIdentifierAst(child)
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
     * 处理 ShortCircuitExpressionTail (|| 或 ?? 运算符的尾部)
     */
    static createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        const tailChildren = tailCst.children || []

        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0]
            return ExpressionCstToAst.createShortCircuitExpressionTailAst(left, innerTail)
        }

        if (tailCst.name === 'LogicalORExpressionTail') {
            let result = left

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '||'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = ExpressionCstToAst.createExpressionAst(rightCst)

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        if (tailCst.name === 'CoalesceExpressionTail') {
            let result = left

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '??'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = ExpressionCstToAst.createExpressionAst(rightCst)

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        console.warn('Unknown ShortCircuitExpressionTail type:', tailCst.name)
        return left
    }

    // ==================== Assignment 相关方法 ====================

    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name || child.name === 'AssignmentProperty') {
                properties.push(ExpressionCstToAst.createAssignmentPropertyAst(child))
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
