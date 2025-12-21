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
    type SlimePattern, type SlimeArrowFunctionExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import {checkCstName} from "../SlimeCstToAstUtil.ts";



/**
 * 表达式相关的 CST to AST 转换
 */
export class ExpressionCstToAst {

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
                return this.createSuperCallAst(first)
            }
            return this.createExpressionAst(first)
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
            current = this.createCallExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = this.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = this.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = this.createImportCallAst(firstChild)
        } else {
            // 尝试作为表达式处�?
            current = this.createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - 函数调用
                const args = this.createArgumentsAst(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === 'DotMemberExpression') {
                // DotMemberExpression包含Dot和IdentifierName (旧版兼容)
                const dotChild = child.children[0]  // Dot token
                const identifierNameCst = child.children[1]  // IdentifierName
                const tokenCst = identifierNameCst.children[0]  // 实际的token（Identifier或关键字�?
                const property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                const dotOp = SlimeTokenCreate.createDotToken(dotChild.loc)
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                const dotOp = SlimeTokenCreate.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'BracketExpression') {
                // [expr] - computed property (旧版兼容)
                const propertyExpression = this.createExpressionAst(child.children[1])
                current = {
                    type: SlimeNodeType.MemberExpression,
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
                    const propertyExpression = this.createExpressionAst(expressionChild)
                    current = {
                        type: SlimeNodeType.MemberExpression,
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
                const quasi = this.createTemplateLiteralAst(child)
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
                newToken = SlimeTokenCreate.createNewToken(newCst.loc)
            }

            // 提取 Arguments 中的 LParen/RParen tokens
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

            const calleeExpression = this.createMemberExpressionAst(cst.children[1])
            const args = this.createArgumentsAst(cst.children[2])

            return SlimeAstUtil.createNewExpression(
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
                const newToken = SlimeTokenCreate.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = this.createNewExpressionAst(innerNewExpr)

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                // 这是 MemberExpression 形式，递归处理
                return this.createExpressionAst(firstChild)
            }
        }
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.MemberExpression?.name);

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

            const callee = this.createMemberExpressionAst(memberExprCst)
            const args = argsCst ? this.createArgumentsAst(argsCst) : []

            // 提取 tokens
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

            // �?Arguments 之后继续处理（如 .bar�?
            startIdx = 3
        } else {
            current = this.createMemberExpressionFirstOr(cst.children[0]) as SlimeExpression
        }

        // 循环处理剩余的children（Dot+IdentifierName、LBracket+Expression+RBracket、Arguments、TemplateLiteral�?
        for (let i = startIdx; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'DotIdentifier') {
                // .property - 成员访问 (旧版兼容)
                const dotToken = SlimeTokenCreate.createDotToken(child.children[0].loc)

                // children[1]是IdentifierName，可能是Identifier或关键字token
                let property: SlimeIdentifier | null = null
                if (child.children[1]) {
                    const identifierNameCst = child.children[1]
                    if (identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                        // IdentifierName -> Identifier or Keyword token
                        const tokenCst = identifierNameCst.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                    } else {
                        // 直接是token（向后兼容）
                        property = this.createIdentifierAst(identifierNameCst)
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                // .property - 成员访问
                const dotToken = SlimeTokenCreate.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        // IdentifierName -> Identifier or Keyword token
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        // 私有标识�?#prop
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'BracketExpression') {
                // [expression] - computed property access (旧版兼容)
                const propertyExpression = this.createExpressionAst(child.children[1])
                current = {
                    type: SlimeNodeType.MemberExpression,
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
                    const propertyExpression = this.createExpressionAst(expressionChild)
                    current = {
                        type: SlimeNodeType.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any
                    i += 2 // 跳过Expression和RBracket
                }

            } else if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - function call
                const args = this.createArgumentsAst(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                // `template` - Tagged Template
                const quasi = this.createTemplateLiteralAst(child)
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


    /**
     * ParenthesizedExpression CST �?AST
     * ParenthesizedExpression -> ( Expression )
     */
    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        // 查找内部�?Expression
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return this.createExpressionAst(child)
            }
        }
        // 如果没有找到 Expression，可能是空括号或者直接包含其他表达式
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' && ch.value !== '(' && ch.value !== ')'
        )
        if (innerExpr) {
            return this.createExpressionAst(innerExpr)
        }
        throw new Error('ParenthesizedExpression has no inner expression')
    }

    /**
     * CallMemberExpression CST �?AST
     * CallMemberExpression -> MemberExpression Arguments
     */
    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return this.createCallExpressionAst(cst)
    }

    /**
     * ShortCircuitExpression CST �?AST（透传�?
     * ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createExpressionAst(firstChild)
        }
        throw new Error('ShortCircuitExpression has no children')
    }


    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = this.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = this.createExpressionAstUncached(cst)
        this.expressionAstCache.set(cst, result)
        return result
    }

    private createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeParser.prototype.Expression?.name) {
            // Expression 可能是逗号表达�?(SequenceExpression)
            // 结构: Expression -> AssignmentExpression | Expression, AssignmentExpression
            // 收集所有表达式
            const expressions: SlimeExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    // 跳过逗号 token
                    continue
                }
                expressions.push(this.createExpressionAst(child))
            }

            if (expressions.length === 1) {
                // 单个表达式，直接返回
                left = expressions[0]
            } else if (expressions.length > 1) {
                // 多个表达式，创建 SequenceExpression
                left = {
                    type: 'SequenceExpression',
                    expressions: expressions,
                    loc: cst.loc
                } as any
            } else {
                throw new Error('Expression has no children')
            }
        } else if (astName === SlimeParser.prototype.Statement?.name) {
            left = this.createStatementAst(cst)
        } else if (astName === SlimeParser.prototype.AssignmentExpression?.name) {
            left = this.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ConditionalExpression?.name) {
            left = this.createConditionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalORExpression?.name) {
            left = this.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalANDExpression?.name) {
            left = this.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseORExpression?.name) {
            left = this.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseXORExpression?.name) {
            left = this.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseANDExpression?.name) {
            left = this.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.EqualityExpression?.name) {
            left = this.createEqualityExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.RelationalExpression?.name) {
            left = this.createRelationalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ShiftExpression?.name) {
            left = this.createShiftExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AdditiveExpression?.name) {
            left = this.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MultiplicativeExpression?.name) {
            left = this.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UnaryExpression?.name) {
            left = this.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LeftHandSideExpression?.name) {
            left = this.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.CallExpression?.name) {
            left = this.createCallExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.NewExpression?.name) {
            left = this.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = this.createNewExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MemberExpression?.name) {
            left = this.createMemberExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.PrimaryExpression?.name) {
            left = this.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.YieldExpression?.name) {
            left = this.createYieldExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AwaitExpression?.name) {
            left = this.createAwaitExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.SuperProperty?.name) {
            left = this.createSuperPropertyAst(cst)
        } else if (astName === SlimeParser.prototype.MetaProperty?.name) {
            left = this.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            // ES2020: ShortCircuitExpression = LogicalORExpression | CoalesceExpression
            // ShortCircuitExpression: LogicalANDExpression ShortCircuitExpressionTail?
            left = this.createExpressionAst(cst.children[0])

            // 检查是否有 ShortCircuitExpressionTail (|| 运算�?
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    // 处理尾部：可能是 LogicalORExpressionTail �?CoalesceExpressionTail
                    left = this.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            // ES2020: CoalesceExpression (处理 ?? 运算�?
            left = this.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            // ES2016: ExponentiationExpression (处理 ** 运算�?
            left = this.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            // ES2017+: Cover grammar for CallExpression and async arrow function
            // In non-async-arrow context, this is a CallExpression
            left = this.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            // ES2020: Optional chaining (?.)
            left = this.createOptionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = this.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = this.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            // ES2020: 动�?import()
            left = this.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            // ES2022: PrivateIdentifier (e.g. #x in `#x in obj`)
            left = this.createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }

    /**
     * 创建 OptionalExpression AST（ES2020�?
     * 处理可选链语法 ?.
     *
     * OptionalExpression:
     *   MemberExpression OptionalChain
     *   CallExpression OptionalChain
     *   OptionalExpression OptionalChain
     */
    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        // OptionalExpression 结构�?
        // children[0] = MemberExpression | CallExpression
        // children[1...n] = OptionalChain

        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式（MemberExpression �?CallExpression�?
        let result = this.createExpressionAst(cst.children[0])

        // 处理 OptionalChain（可能有多个链式调用�?
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = this.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }


    /**
     * 创建 CoalesceExpression AST（ES2020�?
     * 处理 ?? 空值合并运算符
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        // CoalesceExpression -> BitwiseORExpression ( ?? BitwiseORExpression )*
        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达�?
        let left = this.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]  // ?? token
            const right = this.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeNodeType.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
    }

    /**
     * 创建 ExponentiationExpression AST（ES2016�?
     * 处理 ** 幂运算符
     */
    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        // ExponentiationExpression -> UnaryExpression | UpdateExpression ** ExponentiationExpression
        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，右结合：a ** b ** c = a ** (b ** c)
        const left = this.createExpressionAst(cst.children[0])
        const operator = cst.children[1]  // ** token
        const right = this.createExponentiationExpressionAst(cst.children[2])  // 递归处理右侧
        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a || b || c
            let left = this.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?LogicalExpression
            // 支持多个运算符：a && b && c
            let left = this.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a | b | c�?
            let left = this.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a ^ b ^ c�?
            let left = this.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression（支持链式：a & b & c�?
            let left = this.createExpressionAst(cst.children[0])

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            const left = this.createExpressionAst(cst.children[0])
            const operator = cst.children[1].value as any  // ===, !==, ==, != 运算�?
            const right = this.createExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any
        }
        return this.createExpressionAst(cst.children[0])
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x < y < z => BinaryExpression(BinaryExpression(x, <, y), <, z)
            let left = this.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x << y << z => BinaryExpression(BinaryExpression(x, <<, y), <<, z)
            let left = this.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value
                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：x + y + z => BinaryExpression(BinaryExpression(x, +, y), +, z)
            let left = this.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            // CST结构: [operand, operator, operand, operator, operand, ...]
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            // 有运算符，创�?BinaryExpression
            // 支持多个运算符：a * b * c => BinaryExpression(BinaryExpression(a, *, b), *, c)
            let left = this.createExpressionAst(cst.children[0])

            // 循环处理剩余�?(operator, operand) �?
            for (let i = 1; i < cst.children.length; i += 2) {
                // 获取运算�?- 可能是token也可能是CST节点
                const operatorNode = cst.children[i]
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value

                const right = this.createExpressionAst(cst.children[i + 1])

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
        return this.createExpressionAst(cst.children[0])
    }

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        // 防御性检查：如果没有children，抛出更详细的错�?
        if (!cst.children || cst.children.length === 0) {
            console.error('UnaryExpression CST没有children:', JSON.stringify(cst, null, 2))
            throw new Error(`UnaryExpression CST没有children，可能是Parser生成的CST不完整`)
        }

        // 如果只有一个子节点，检查是否是表达式节点还是token
        if (cst.children.length === 1) {
            const child = cst.children[0]

            // 检查是否是token（token有value属性但没有children�?
            if (child.value !== undefined && !child.children) {
                // 这是一个token，说明Parser层生成的CST不完�?
                // UnaryExpression应该有运算符+操作数两个子节点，或者直接是PostfixExpression
                throw new Error(
                    `UnaryExpression CST不完整：只有运算符token '${child.name}' (${child.value})，缺少操作数。` +
                    `这是Parser层的问题，请检查Es2025Parser.UnaryExpression的Or分支逻辑。`
                )
            }

            // 是表达式节点，递归处理
            return this.createExpressionAst(child)
        }

        // 如果有两个子节点，是一元运算符表达�?
        // children[0]: 运算�?token (!, +, -, ~, typeof, void, delete�?
        // children[1]: UnaryExpression（操作数�?
        const operatorToken = cst.children[0]
        const argumentCst = cst.children[1]

        // 获取运算符类�?
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

        // 递归处理操作�?
        const argument = this.createExpressionAst(argumentCst)

        // 创建 UnaryExpression AST
        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,  // 前缀运算�?
            argument: argument,
            loc: cst.loc
        } as any
    }

    // Renamed from createPostfixExpressionAst - ES2025 uses UpdateExpression
    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        // Support both PostfixExpression (old) and UpdateExpression (new)
        if (cst.children.length > 1) {
            // UpdateExpression: argument ++ | argument -- | ++argument | --argument
            // Check if prefix or postfix
            const first = cst.children[0]
            const isPrefix = first.loc?.type === 'PlusPlus' || first.loc?.type === 'MinusMinus' ||
                first.value === '++' || first.value === '--'

            if (isPrefix) {
                // Prefix: ++argument or --argument
                const operator = first.value || first.loc?.value
                const argument = this.createExpressionAst(cst.children[1])
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any
            } else {
                // Postfix: argument++ or argument--
                const argument = this.createExpressionAst(cst.children[0])
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
        return this.createExpressionAst(cst.children[0])
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.LeftHandSideExpression?.name);
        // 容错：Parser在ASI场景下可能生成不完整的CST，返回空标识�?
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createIdentifier('', cst.loc)
        }
        if (cst.children.length > 1) {

        }
        return this.createExpressionAst(cst.children[0])
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            return this.createIdentifierAst(first.children[0])
        } else if (first.name === SlimeParser.prototype.Literal?.name) {
            return this.createLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ArrayLiteral?.name) {
            return this.createArrayLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.FunctionExpression?.name) {
            return this.createFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ObjectLiteral?.name) {
            return this.createObjectLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ClassExpression?.name) {
            return this.createClassExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeTokenConsumer.prototype.This?.name) {
            // 处理 this 关键�?
            return SlimeAstUtil.createThisExpression(first.loc)
        } else if (first.name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name) {
            // 处理正则表达式字面量
            return this.createRegExpLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorExpression?.name || first.name === 'GeneratorExpression') {
            // 处理 function* 表达�?
            return this.createGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncFunctionExpression?.name || first.name === 'AsyncFunctionExpression') {
            // 处理 async function 表达�?
            return this.createAsyncFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorExpression?.name || first.name === 'AsyncGeneratorExpression') {
            // 处理 async function* 表达�?
            return this.createAsyncGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            first.name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            // Cover Grammar - try to interpret as parenthesized expression
            // Structure varies: [LParen, content?, RParen] or [LParen, Expression, RParen]

            // Empty parentheses: ()
            if (!first.children || first.children.length === 0) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            // Only 2 children (empty parens): LParen, RParen
            if (first.children.length === 2) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            // Find the content (skip LParen at start, RParen at end)
            const middleCst = first.children[1]
            if (!middleCst) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            // If it's an Expression, process it directly
            if (middleCst.name === SlimeParser.prototype.Expression?.name || middleCst.name === 'Expression') {
                const innerExpr = this.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            }

            // If it's AssignmentExpression, process it
            if (middleCst.name === SlimeParser.prototype.AssignmentExpression?.name || middleCst.name === 'AssignmentExpression') {
                const innerExpr = this.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            }

            // If it's FormalParameterList, convert to expression
            if (middleCst.name === SlimeParser.prototype.FormalParameterList?.name || middleCst.name === 'FormalParameterList') {
                const params = this.createFormalParameterListAst(middleCst)
                if (params.length === 1 && params[0].type === SlimeNodeType.Identifier) {
                    return SlimeAstUtil.createParenthesizedExpression(params[0] as any, first.loc)
                }
                if (params.length > 1) {
                    const expressions = params.map(p => p as any)
                    return SlimeAstUtil.createParenthesizedExpression({
                        type: 'SequenceExpression',
                        expressions: expressions
                    } as any, first.loc)
                }
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }

            // Try to process the middle content as an expression
            try {
                const innerExpr = this.createExpressionAst(middleCst)
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc)
            } catch (e) {
                // Fallback: return the first child as identifier
                return SlimeAstUtil.createIdentifier('undefined', first.loc)
            }
        } else if (first.name === SlimeParser.prototype.TemplateLiteral?.name) {
            // 处理模板字符�?
            return this.createTemplateLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ParenthesizedExpression?.name) {
            // 处理普通括号表达式�? Expression )
            // children[0]=LParen, children[1]=Expression, children[2]=RParen
            const expressionCst = first.children[1]
            const innerExpression = this.createExpressionAst(expressionCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpression, first.loc)
        } else if (first.name === 'RegularExpressionLiteral' || first.name === 'RegularExpressionLiteral') {
            // 处理正则表达式字面量
            return this.createRegExpLiteralAst(first)
        } else {
            throw new Error('未知的 PrimaryExpression 类型: ' + first.name)
        }
    }

    // 生成器表达式处理：function* (...) { ... }
    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // GeneratorExpression: function* [name](params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, false, cst.loc)
        return func
    }

    // Async 函数表达式处理：async function (...) { ... }
    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // AsyncFunctionExpression: async function [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, false, true, cst.loc)
        return func
    }

    // Async Generator 表达式处理：async function* (...) { ... }
    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // AsyncGeneratorExpression: async function* [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, true, cst.loc)
        return func
    }


    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return this.createArrowFunctionAst(child)
            }
            // 否则作为表达式处�?
            return this.createExpressionAst(child)
        }

        // AssignmentExpression -> LeftHandSideExpression + Eq + AssignmentExpression
        // �?LeftHandSideExpression + AssignmentOperator + AssignmentExpression
        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = this.createExpressionAst(leftCst)
        const right = this.createAssignmentExpressionAst(rightCst)
        // AssignmentOperator节点下有子节�?PlusEq/MinusEq�?，需要从children[0].value获取
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: SlimeAssignmentExpression = {
            type: 'AssignmentExpression',
            operator: operator as any,
            left: left as any,
            right: right,
            loc: cst.loc
        }
        return ast
    }


    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = this.createExpressionAst(firstChild)
        let alternate
        let consequent

        // Token fields
        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        } else {
            // CST children: [LogicalORExpression, Question, AssignmentExpression, Colon, AssignmentExpression]
            const questionCst = cst.children[1]
            const colonCst = cst.children[3]

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeTokenCreate.createQuestionToken(questionCst.loc)
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)
            }

            consequent = this.createAssignmentExpressionAst(cst.children[2])
            alternate = this.createAssignmentExpressionAst(cst.children[4])
        }

        return SlimeAstUtil.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }

    createYieldExpressionAst(cst: SubhutiCst): any {
        // yield [*] AssignmentExpression?
        let yieldToken: any = undefined
        let asteriskToken: any = undefined
        let delegate = false
        let startIndex = 1

        // 提取 yield token
        if (cst.children[0] && (cst.children[0].name === 'Yield' || cst.children[0].value === 'yield')) {
            yieldToken = SlimeTokenCreate.createYieldToken(cst.children[0].loc)
        }

        if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.Asterisk?.name) {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(cst.children[1].loc)
            delegate = true
            startIndex = 2
        }
        let argument: any = null
        if (cst.children[startIndex]) {
            argument = this.createAssignmentExpressionAst(cst.children[startIndex])
        }

        return SlimeAstUtil.createYieldExpression(argument, delegate, cst.loc, yieldToken, asteriskToken)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        // await UnaryExpression
        checkCstName(cst, SlimeParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined

        // 提取 await token
        if (cst.children[0] && (cst.children[0].name === 'Await' || cst.children[0].value === 'await')) {
            awaitToken = SlimeTokenCreate.createAwaitToken(cst.children[0].loc)
        }

        const argumentCst = cst.children[1]
        const argument = this.createExpressionAst(argumentCst)

        return SlimeAstUtil.createAwaitExpression(argument, cst.loc, awaitToken)
    }

}
