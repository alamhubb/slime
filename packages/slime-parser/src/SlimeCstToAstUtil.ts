import {
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimePattern,
    type SlimeObjectPattern,
    type SlimeArrayPattern,
    type SlimeFunctionParam,
    type SlimeLiteral,
    type SlimeArrayExpression,
    type SlimeObjectExpression,
    type SlimeArrowFunctionExpression,
    type SlimeClassExpression,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
    type SlimeSpreadElement,
    type SlimeProperty,
    type SlimeIdentifier,
    type SlimeArrayElement,
    type SlimeFunctionExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";

// 导入子模块静态方法
import { ArrowFunctionCstToAst } from "./cstToAst/converters/function/ArrowFunctionCstToAst";
import { ParametersCstToAst } from "./cstToAst/converters/function/ParametersCstToAst";
import { BinaryExpressionCstToAst } from "./cstToAst/converters/expression/BinaryExpressionCstToAst";
import { UnaryExpressionCstToAst } from "./cstToAst/converters/expression/UnaryExpressionCstToAst";
import { PrimaryExpressionCstToAst } from "./cstToAst/converters/expression/PrimaryExpressionCstToAst";
import { MemberCallCstToAst } from "./cstToAst/converters/expression/MemberCallCstToAst";
import { ExpressionCstToAst } from "./cstToAst/converters/expression/ExpressionCstToAst";
import { IdentifierCstToAst } from "./cstToAst/converters/identifier/IdentifierCstToAst";
import { PatternConvertCstToAst } from "./cstToAst/converters/pattern/PatternConvertCstToAst";
import { BindingPatternCstToAst } from "./cstToAst/converters/pattern/BindingPatternCstToAst";
import { LiteralCstToAst } from "./cstToAst/converters/literal/LiteralCstToAst";
import { CompoundLiteralCstToAst } from "./cstToAst/converters/literal/CompoundLiteralCstToAst";
import { ClassDeclarationCstToAst } from "./cstToAst/converters/class/ClassDeclarationCstToAst";
import { TemplateCstToAst } from "./cstToAst/converters/misc/TemplateCstToAst";

// 重新导出工具类
export { SlimeAstUtils } from "./cstToAst/SlimeAstUtils";

/**
 * CST 到 AST 转换器
 */
export class SlimeCstToAst {

    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ImportCall?.name);
        // ImportCall -> ImportTok + LParen + AssignmentExpression + (Comma + AssignmentExpression)? + Comma? + RParen
        // children: [ImportTok, LParen, AssignmentExpression, (Comma, AssignmentExpression)?, Comma?, RParen]

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = this.createAssignmentExpressionAst(child)
                args.push(SlimeAstUtil.createCallArgument(expr))
            }
        }

        // 创建 import 标识符作�?callee
        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression
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
            const propertyExpression = this.createExpressionAst(second.children[1])
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
            const propertyExpression = this.createExpressionAst(expressionCst)
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

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
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

    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                const res = this.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
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
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }

                const expr = this.createAssignmentExpressionAst(child)
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
                // 处理 spread 参数�?..args（旧结构兼容�?
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }
                currentArg = this.createSpreadElementAst(child)
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

        // 处理最后一个参数（如果没有尾随逗号�?
        if (hasArg) {
            arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        if (cst.name === SlimeParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return this.createPrimaryExpressionAst(cst)
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return this.createSuperPropertyAst(cst)
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return this.createMetaPropertyAst(cst)
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return this.createNewExpressionAst(cst)
        } else if (cst.name === 'New') {
            // Es2025Parser: new MemberExpression Arguments 是直接的 token 序列
            // 这种情况应该�?createMemberExpressionAst 中处�?
            throw new Error('createMemberExpressionFirstOr: NewTok should be handled in createMemberExpressionAst')
        } else {
            throw new Error('createMemberExpressionFirstOr: 不支持的类型: ' + cst.name)
        }
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

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // 兼容 LexicalBinding �?VariableDeclaration
        // const astName = checkCstName(cst, 'LexicalBinding');

        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimePattern

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = this.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name) {
            id = this.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        // console.log(6565656)
        // console.log(id)
        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeTokenCreate.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const init = this.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = this.createExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                }
            } else {
                variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst)
            }
        } else {
            variableDeclarator = SlimeAstUtil.createVariableDeclarator(id)
        }
        variableDeclarator.loc = cst.loc
        return variableDeclarator
    }


    // ==================== 表达式相关转换方法 ====================

    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST 转 AST - 委托给 ExpressionCstToAst
     */
    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst);
    }

    /**
     * ParenthesizedExpression CST 转 AST - 委托给 ExpressionCstToAst
     */
    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createParenthesizedExpressionAst(cst);
    }

    /**
     * ComputedPropertyName CST 转 AST - 委托给 ExpressionCstToAst
     */
    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createComputedPropertyNameAst(cst);
    }

    /**
     * CoverInitializedName CST 转 AST - 委托给 ExpressionCstToAst
     */
    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return ExpressionCstToAst.createCoverInitializedNameAst(cst);
    }

    /**
     * CoverCallExpressionAndAsyncArrowHead CST 转 AST - 委托给 ExpressionCstToAst
     */
    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst);
    }

    /**
     * CallMemberExpression CST 转 AST - 委托给 ExpressionCstToAst
     */
    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCallMemberExpressionAst(cst);
    }

    /**
     * ShortCircuitExpression CST 转 AST（透传）- 委托给 ExpressionCstToAst
     */
    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createShortCircuitExpressionAst(cst);
    }

    /**
     * CoalesceExpressionHead CST 转 AST - 委托给 ExpressionCstToAst
     */
    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoalesceExpressionHeadAst(cst);
    }
    /**
     * MultiplicativeOperator CST 转 AST - 委托给 ExpressionCstToAst
     */
    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return ExpressionCstToAst.createMultiplicativeOperatorAst(cst);
    }

    /**
     * AssignmentOperator CST 转 AST - 委托给 ExpressionCstToAst
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return ExpressionCstToAst.createAssignmentOperatorAst(cst);
    }

    /**
     * ExpressionBody CST 转 AST - 委托给 ExpressionCstToAst
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createExpressionBodyAst(cst, this.createAssignmentExpressionAst.bind(this));
    }

    /**
     * 创建 OptionalExpression AST（ES2020）- 委托给 MemberCallCstToAst
     */
    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createOptionalExpressionAst(cst);
    }

    /**
     * 创建 OptionalChain AST - 委托给 MemberCallCstToAst
     */
    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createOptionalChainAst(object, chainCst);
    }

    /**
     * 创建 CoalesceExpression AST（ES2020）- 委托给 MemberCallCstToAst
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCoalesceExpressionAst(cst);
    }

    // ============================================
    // 字面量相关 - 委托给 LiteralCstToAst
    // ============================================

    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createBooleanLiteralAst(cst);
    }

    createElisionAst(cst: SubhutiCst): number {
        return LiteralCstToAst.createElisionAst(cst);
    }

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createLiteralAst(cst);
    }

    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        return LiteralCstToAst.createNumericLiteralAst(cst);
    }

    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        return LiteralCstToAst.createStringLiteralAst(cst);
    }

    createRegExpLiteralAst(cst: SubhutiCst): any {
        return LiteralCstToAst.createRegExpLiteralAst(cst);
    }

    createLiteralFromToken(token: any): SlimeExpression {
        return LiteralCstToAst.createLiteralFromToken(token);
    }


    // ============================================
    // 复合字面量相关 - 委托给 CompoundLiteralCstToAst
    // ============================================

    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        return CompoundLiteralCstToAst.createArrayLiteralAst(cst);
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        return CompoundLiteralCstToAst.createObjectLiteralAst(cst);
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return CompoundLiteralCstToAst.createPropertyDefinitionAst(cst);
    }

    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return CompoundLiteralCstToAst.createPropertyNameAst(cst);
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return CompoundLiteralCstToAst.createLiteralPropertyNameAst(cst);
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return CompoundLiteralCstToAst.createElementListAst(cst);
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return CompoundLiteralCstToAst.createSpreadElementAst(cst);
    }

    // ============================================
    // 模板字符串相关 - 委托给 TemplateCstToAst
    // ============================================

    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return TemplateCstToAst.processTemplateSpans(cst, quasis, expressions);
    }

    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return TemplateCstToAst.processTemplateMiddleList(cst, quasis, expressions);
    }

    // ============================================
    // Class 相关 - 委托给 ClassDeclarationCstToAst
    // ============================================

    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        return ClassDeclarationCstToAst.createClassExpressionAst(cst);
    }

    // ============================================
    // 二元表达式相关 - 委托给 BinaryExpressionCstToAst
    // ============================================

    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst);
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createExponentiationExpressionAst(cst);
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalORExpressionAst(cst);
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalANDExpressionAst(cst);
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseORExpressionAst(cst);
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst);
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst);
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createEqualityExpressionAst(cst);
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createRelationalExpressionAst(cst);
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShiftExpressionAst(cst);
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createAdditiveExpressionAst(cst);
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst);
    }

    // ============================================
    // 一元表达式相关 - 委托给 UnaryExpressionCstToAst
    // ============================================

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUnaryExpressionAst(cst);
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUpdateExpressionAst(cst);
    }


    // ============================================
    // 表达式相关 - 委托给 PrimaryExpressionCstToAst
    // ============================================

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createConditionalExpressionAst(cst);
    }

    createYieldExpressionAst(cst: SubhutiCst): any {
        return PrimaryExpressionCstToAst.createYieldExpressionAst(cst);
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return PrimaryExpressionCstToAst.createAwaitExpressionAst(cst);
    }

    // ============================================
    // Pattern 转换相关 - 委托给 PatternConvertCstToAst
    // ============================================

    convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        return PatternConvertCstToAst.convertObjectExpressionToPattern(expr);
    }

    convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        return PatternConvertCstToAst.convertArrayExpressionToPattern(expr);
    }

    convertAssignmentExpressionToPattern(expr: any): any {
        return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr);
    }

    convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        return PatternConvertCstToAst.convertExpressionToPatternFromAST(expr);
    }

    convertExpressionToPattern(expr: any): SlimePattern {
        return PatternConvertCstToAst.convertExpressionToPattern(expr);
    }

    convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        return PatternConvertCstToAst.convertCstToPattern(cst);
    }

    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        return PatternConvertCstToAst.convertCoverParameterCstToPattern(cst, hasEllipsis);
    }

    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        return PatternConvertCstToAst.convertObjectLiteralToPattern(cst);
    }

    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): any {
        return PatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(cst);
    }

    // ============================================
    // Binding Pattern 相关 - 委托给 BindingPatternCstToAst
    // ============================================

    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        return BindingPatternCstToAst.convertArrayLiteralToPattern(cst);
    }

    // ============================================
    // 参数处理相关 - 委托给 ParametersCstToAst
    // ============================================

    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ParametersCstToAst.createArrowFormalParametersAst(cst);
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return ParametersCstToAst.createArrowFormalParametersAstWrapped(cst);
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        return ParametersCstToAst.createArrowParametersFromCoverGrammar(cst);
    }

    extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        return ParametersCstToAst.extractParametersFromExpression(expressionCst);
    }

    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        return ParametersCstToAst.findFirstIdentifierInExpression(cst);
    }

    // ============================================
    // 箭头函数相关 - 委托给 ArrowFunctionCstToAst
    // ============================================

    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowParametersAst(cst);
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return ArrowFunctionCstToAst.createConciseBodyAst(cst);
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return ArrowFunctionCstToAst.createArrowFunctionAst(cst);
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return ArrowFunctionCstToAst.createAsyncArrowFunctionAst(cst);
    }

    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(cst);
    }


    // ============================================
    // 标识符相关 - 委托给 IdentifierCstToAst
    // ============================================

    createIdentifierAst(cst: SubhutiCst): any {
        return IdentifierCstToAst.createIdentifierAst(cst);
    }

    createIdentifierReferenceAst(cst: SubhutiCst): any {
        // IdentifierReference 通常包含一个 Identifier
        if (cst.children && cst.children.length > 0) {
            return IdentifierCstToAst.createIdentifierAst(cst.children[0]);
        }
        return IdentifierCstToAst.createIdentifierAst(cst);
    }

    createPrivateIdentifierAst(cst: SubhutiCst): any {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst);
    }
    // ============================================
    // 成员/调用表达式相关 - 委托给 MemberCallCstToAst
    // ============================================

    // ============================================
    // 以下方法需要后续实现
    // ============================================

    createBindingIdentifierAst(cst: SubhutiCst): SlimePattern {
        return IdentifierCstToAst.createBindingIdentifierAst(cst) as SlimePattern;
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        throw new Error('createFormalParameterListAst not implemented');
    }

    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        throw new Error('createUniqueFormalParametersAst not implemented');
    }

    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        throw new Error('createFormalParametersAst not implemented');
    }

    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        throw new Error('createUniqueFormalParametersAstWrapped not implemented');
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        throw new Error('createFormalParametersAstWrapped not implemented');
    }

    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        throw new Error('createFormalParameterListFromEs2025Wrapped not implemented');
    }

    createFunctionBodyAst(cst: SubhutiCst): any[] {
        throw new Error('createFunctionBodyAst not implemented');
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createAssignmentExpressionAst not implemented');
    }

    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createExpressionAst not implemented');
    }

    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        throw new Error('createBindingPatternAst not implemented');
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        throw new Error('createArrayBindingPatternAst not implemented');
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        throw new Error('createObjectBindingPatternAst not implemented');
    }

    createInitializerAst(cst: SubhutiCst): any {
        throw new Error('createInitializerAst not implemented');
    }

    isComputedPropertyName(cst: SubhutiCst): boolean {
        throw new Error('isComputedPropertyName not implemented');
    }

    createClassTailAst(cst: SubhutiCst): any {
        throw new Error('createClassTailAst not implemented');
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): any {
        throw new Error('createMethodDefinitionAst not implemented');
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createLeftHandSideExpressionAst not implemented');
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createPrimaryExpressionAst not implemented');
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createTemplateLiteralAst not implemented');
    }

    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        throw new Error('createFunctionExpressionAst not implemented');
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        throw new Error('createGeneratorExpressionAst not implemented');
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        throw new Error('createAsyncFunctionExpressionAst not implemented');
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        throw new Error('createAsyncGeneratorExpressionAst not implemented');
    }

    createStatementAst(cst: SubhutiCst): any {
        throw new Error('createStatementAst not implemented');
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createCallExpressionAst not implemented');
    }
}

const SlimeCstToAstUtil = new SlimeCstToAst();

export default SlimeCstToAstUtil;
