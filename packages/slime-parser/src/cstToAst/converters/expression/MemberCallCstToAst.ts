/**
 * MemberCallCstToAst - 成员访问/调用表达式/可选链转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeCallArgument,
    type SlimeSpreadElement,
    type SlimeSuper,
    SlimeNodeType,
    SlimeAstUtil,
    SlimeTokenCreate,
} from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";
import SlimeParser from "../../../SlimeParser";

export class MemberCallCstToAst {
    /**
     * 创建 OptionalExpression AST（ES2020）
     * 处理可选链语法 ?.
     *
     * OptionalExpression:
     *   MemberExpression OptionalChain
     *   CallExpression OptionalChain
     *   OptionalExpression OptionalChain
     */
    static createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式（MemberExpression 或 CallExpression）
        let result = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

        // 处理 OptionalChain（可能有多个链式调用）
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = MemberCallCstToAst.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     *
     * 注意：只有紧跟在 ?. 后面的操作是 optional: true
     * 链式的后续操作（如 foo?.().bar() 中的 .bar()）是 optional: false
     */
    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        // 追踪是否刚遇到 ?. token，下一个操作是 optional
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                // 遇到 ?. token，下一个操作是 optional
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                // ()调用 - 可能是可选调用或普通调用
                const args = MemberCallCstToAst.createArgumentsAst(child)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                // [expr] 计算属性访问 - 可能是可选或普通
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = SlimeCstToAstUtil.createExpressionAst(chainCst.children[exprIndex])
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
                // .prop 属性访问 - 可能是可选或普通
                let property: SlimeIdentifier
                const tokenCst = child.children[0]
                property = MemberCallCstToAst.createIdentifier(tokenCst.value, tokenCst.loc)
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
                // #prop - 私有属性访问
                const property = SlimeCstToAstUtil.createPrivateIdentifierAst(child)
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
     * 创建 CoalesceExpression AST（ES2020）
     * 处理 ?? 空值合并运算符
     */
    static createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达式
        let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])
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
     * 创建 Arguments AST
     */
    static createArgumentsAst(cst: SubhutiCst): SlimeExpression[] {
        const args: SlimeExpression[] = []
        if (!cst.children) return args

        for (const child of cst.children) {
            if (child.name === 'ArgumentList' || child.name === 'ArgumentListElement') {
                // 递归处理参数列表
                args.push(...MemberCallCstToAst.createArgumentsAst(child))
            } else if (child.name === 'AssignmentExpression' || child.name === 'SpreadElement') {
                args.push(SlimeCstToAstUtil.createExpressionAst(child))
            } else if (child.value === '(' || child.value === ')' || child.value === ',') {
                // 跳过括号和逗号
                continue
            }
        }
        return args
    }

    /**
     * 创建 PrivateIdentifier AST
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): any {
        const name = cst.value || cst.children?.[0]?.value || ''
        return {
            type: 'PrivateIdentifier',
            name: name.startsWith('#') ? name.slice(1) : name,
            loc: cst.loc
        }
    }

    /**
     * 创建 Identifier
     */
    static createIdentifier(name: string, loc?: any): SlimeIdentifier {
        return {
            type: SlimeNodeType.Identifier,
            name: SlimeAstUtils.decodeUnicodeEscapes(name),
            loc: loc
        } as SlimeIdentifier
    }

    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    static createImportCallAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportCall?.name);
        // ImportCall -> ImportTok + LParen + AssignmentExpression + (Comma + AssignmentExpression)? + Comma? + RParen
        // children: [ImportTok, LParen, AssignmentExpression, (Comma, AssignmentExpression)?, Comma?, RParen]

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                args.push(SlimeAstUtil.createCallArgument(expr))
            }
        }

        // 创建 import 标识符作为 callee
        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression
    }

    /**
     * 创建 SuperProperty AST
     * SuperProperty:
     *   形式1: SuperTok + Dot + IdentifierName
     *   形式2: SuperTok + LBracket + Expression + RBracket
     */
    static createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        } as SlimeSuper

        const second = cst.children[1]
        if (second.name === 'BracketExpression') {
            // super[expression] - 旧版兼容
            const propertyExpression = SlimeCstToAstUtil.createExpressionAst(second.children[1])
            return {
                type: SlimeNodeType.MemberExpression,
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
                type: SlimeNodeType.MemberExpression,
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
            if (identifierNameCst.name === 'IdentifierName' || identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                const tokenCst = identifierNameCst.children[0]
                property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                // 直接是token
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
            // 旧版兼容: super.property
            // children: [SuperTok, Dot, Identifier]
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
     * MetaProperty: NewTarget | ImportMeta
     */
    static createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        // MetaProperty: children[0]是NewTarget或ImportMeta
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.NewTarget?.name) {
            // new.target
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('new', first.loc),
                property: SlimeAstUtil.createIdentifier('target', first.loc),
                loc: cst.loc
            } as any
        } else {
            // import.meta
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('import', first.loc),
                property: SlimeAstUtil.createIdentifier('meta', first.loc),
                loc: cst.loc
            } as any
        }
    }

    /**
     * 创建 ArgumentList AST（完整版本，处理逗号token）
     */
    static createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
        const arguments_: Array<SlimeCallArgument> = []

        // 遍历children，处理 Ellipsis + AssignmentExpression + Comma 组合
        // 每个参数与其后面的逗号配对
        let currentArg: SlimeExpression | SlimeSpreadElement | null = null
        let hasArg = false
        let pendingEllipsis: SubhutiCst | null = null

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'Ellipsis' || child.name === 'Ellipsis') {
                // 记录 ellipsis，下一个表达式是 spread
                pendingEllipsis = child
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                // 如果之前有参数但没有逗号，先推入
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }

                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                if (pendingEllipsis) {
                    // 创建 SpreadElement
                    const ellipsisToken = SlimeTokenCreate.createEllipsisToken(pendingEllipsis.loc)
                    currentArg = SlimeAstUtil.createSpreadElement(expr, child.loc, ellipsisToken)
                    pendingEllipsis = null
                } else {
                    currentArg = expr
                }
                hasArg = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                // 处理 spread 参数如 ...args（旧结构兼容）
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }
                currentArg = SlimeCstToAstUtil.createSpreadElementAst(child)
                hasArg = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的参数配对
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, commaToken))
                    hasArg = false
                    currentArg = null
                }
            }
        }

        // 处理最后一个参数（如果没有尾随逗号）
        if (hasArg) {
            arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }

    /**
     * 创建 MemberExpression 的第一个元素
     * 可能是 PrimaryExpression, SuperProperty, MetaProperty 或 NewMemberExpressionArguments
     */
    static createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        if (cst.name === SlimeParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return SlimeCstToAstUtil.createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return MemberCallCstToAst.createSuperPropertyAst(cst)
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return MemberCallCstToAst.createMetaPropertyAst(cst)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return MemberCallCstToAst.createNewExpressionAst(cst)
        } else if (cst.name === 'New') {
            // Es2025Parser: new MemberExpression Arguments 是直接的 token 序列
            // 这种情况应该在 createMemberExpressionAst 中处理
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
    }

    /**
     * 创建 NewExpression AST
     * 支持两种类型：NewExpression 和 NewMemberExpressionArguments
     */
    static createNewExpressionAst(cst: SubhutiCst): any {
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

            const calleeExpression = MemberCallCstToAst.createMemberExpressionAst(cst.children[1])
            const args = MemberCallCstToAst.createArgumentsAstFull(cst.children[2])

            return SlimeAstUtil.createNewExpression(
                calleeExpression, args, cst.loc,
                newToken, lParenToken, rParenToken
            )
        } else {
            // NewExpression 有两种形式：
            // 1. MemberExpression - 直接委托给 MemberExpression
            // 2. new NewExpression - 创建 NewExpression（无参数）

            const firstChild = cst.children[0]
            if (firstChild.name === 'New' || firstChild.value === 'new') {
                // 这是 `new NewExpression` 形式，创建无参数的 NewExpression
                const newToken = SlimeTokenCreate.createNewToken(firstChild.loc)
                const innerNewExpr = cst.children[1]
                const calleeExpression = MemberCallCstToAst.createNewExpressionAst(innerNewExpr)

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                )
            } else {
                // 这是 MemberExpression 形式，递归处理
                return SlimeCstToAstUtil.createExpressionAst(firstChild)
            }
        }
    }

    /**
     * 创建 Arguments AST（完整版本，返回 SlimeCallArgument 数组）
     */
    static createArgumentsAstFull(cst: SubhutiCst): Array<SlimeCallArgument> {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                const res = MemberCallCstToAst.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    /**
     * 创建 MemberExpression AST
     */
    static createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.MemberExpression?.name);

        if (cst.children.length === 0) {
            throw new Error('MemberExpression has no children')
        }

        // 从第一个child创建base对象
        let current: SlimeExpression
        let startIdx = 1

        // Es2025Parser: 检查是否是 new MemberExpression Arguments 模式
        // 第一个子节点是 NewTok
        if (cst.children[0].name === 'New') {
            // new MemberExpression Arguments [后续成员访问]
            // children: [NewTok, MemberExpression, Arguments, Dot?, IdentifierName?, ...]
            const newCst = cst.children[0]
            const memberExprCst = cst.children[1]
            const argsCst = cst.children[2]

            const callee = MemberCallCstToAst.createMemberExpressionAst(memberExprCst)
            const args = argsCst ? MemberCallCstToAst.createArgumentsAstFull(argsCst) : []

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

            // 从 Arguments 之后继续处理（如 .bar）
            startIdx = 3
        } else {
            current = MemberCallCstToAst.createMemberExpressionFirstOr(cst.children[0]) as SlimeExpression
        }

        // 循环处理剩余的children（Dot+IdentifierName、LBracket+Expression+RBracket、Arguments、TemplateLiteral）
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
                        property = SlimeCstToAstUtil.createIdentifierAst(identifierNameCst)
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接的 Dot token + IdentifierName
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
                        // 私有标识符 #prop
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }

                // 创建新的MemberExpression，current作为object
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property)

            } else if (child.name === 'BracketExpression') {
                // [expression] - computed property access (旧版兼容)
                const propertyExpression = SlimeCstToAstUtil.createExpressionAst(child.children[1])
                current = {
                    type: SlimeNodeType.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any

            } else if (child.name === 'LBracket') {
                // Es2025Parser产生的是直接的 LBracket + Expression + RBracket
                // [expression] - computed property access
                const expressionChild = cst.children[i + 1]
                if (expressionChild) {
                    const propertyExpression = SlimeCstToAstUtil.createExpressionAst(expressionChild)
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
                const args = MemberCallCstToAst.createArgumentsAstFull(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

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
                // 跳过RBracket，它已经在LBracket处理中被处理
                continue

            } else {
                throw new Error(`未知的MemberExpression子节点类型: ${child.name}`)
            }
        }

        return current
    }
}
