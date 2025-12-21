import {
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeSuper,
    type SlimeFunctionExpression,
    type SlimeBlockStatement,
    type SlimeFunctionParam,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { checkCstName, getUtil } from "../core/CstToAstContext";

// 导入拆分出去的类
import { BinaryExpressionCstToAst } from "./BinaryExpressionCstToAst";
import { CallMemberExpressionCstToAst } from "./CallMemberExpressionCstToAst";

// Re-export 拆分出去的类，保持向后兼容
export { BinaryExpressionCstToAst } from "./BinaryExpressionCstToAst";
export { CallMemberExpressionCstToAst } from "./CallMemberExpressionCstToAst";

// 表达式 AST 缓存
const expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>();

/**
 * 表达式相关的 CST to AST 转换
 * 核心方法保留在此文件，二元表达式和调用/成员表达式已拆分到独立文件
 */
export class ExpressionCstToAst {

    // ==================== 委托到 BinaryExpressionCstToAst ====================
    static createLogicalORExpressionAst = BinaryExpressionCstToAst.createLogicalORExpressionAst;
    static createLogicalANDExpressionAst = BinaryExpressionCstToAst.createLogicalANDExpressionAst;
    static createBitwiseORExpressionAst = BinaryExpressionCstToAst.createBitwiseORExpressionAst;
    static createBitwiseXORExpressionAst = BinaryExpressionCstToAst.createBitwiseXORExpressionAst;
    static createBitwiseANDExpressionAst = BinaryExpressionCstToAst.createBitwiseANDExpressionAst;
    static createEqualityExpressionAst = BinaryExpressionCstToAst.createEqualityExpressionAst;
    static createRelationalExpressionAst = BinaryExpressionCstToAst.createRelationalExpressionAst;
    static createShiftExpressionAst = BinaryExpressionCstToAst.createShiftExpressionAst;
    static createAdditiveExpressionAst = BinaryExpressionCstToAst.createAdditiveExpressionAst;
    static createMultiplicativeExpressionAst = BinaryExpressionCstToAst.createMultiplicativeExpressionAst;
    static createCoalesceExpressionAst = BinaryExpressionCstToAst.createCoalesceExpressionAst;
    static createExponentiationExpressionAst = BinaryExpressionCstToAst.createExponentiationExpressionAst;
    static createUnaryExpressionAst = BinaryExpressionCstToAst.createUnaryExpressionAst;
    static createUpdateExpressionAst = BinaryExpressionCstToAst.createUpdateExpressionAst;
    static createShortCircuitExpressionTailAst = BinaryExpressionCstToAst.createShortCircuitExpressionTailAst;
    static createCoalesceExpressionHeadAst = BinaryExpressionCstToAst.createCoalesceExpressionHeadAst;

    // ==================== 委托到 CallMemberExpressionCstToAst ====================
    static createCallExpressionAst = CallMemberExpressionCstToAst.createCallExpressionAst;
    static createNewExpressionAst = CallMemberExpressionCstToAst.createNewExpressionAst;
    static createMemberExpressionAst = CallMemberExpressionCstToAst.createMemberExpressionAst;
    static createOptionalExpressionAst = CallMemberExpressionCstToAst.createOptionalExpressionAst;
    static createOptionalChainAst = CallMemberExpressionCstToAst.createOptionalChainAst;
    static createSuperCallAst = CallMemberExpressionCstToAst.createSuperCallAst;
    static createImportCallAst = CallMemberExpressionCstToAst.createImportCallAst;
    static createSuperPropertyAst = CallMemberExpressionCstToAst.createSuperPropertyAst;
    static createMetaPropertyAst = CallMemberExpressionCstToAst.createMetaPropertyAst;
    static createMemberExpressionFirstOr = CallMemberExpressionCstToAst.createMemberExpressionFirstOr;
    static createAssignmentPropertyListAst = CallMemberExpressionCstToAst.createAssignmentPropertyListAst;
    static createAssignmentPropertyAst = CallMemberExpressionCstToAst.createAssignmentPropertyAst;
    static createAssignmentElementListAst = CallMemberExpressionCstToAst.createAssignmentElementListAst;
    static createAssignmentElementAst = CallMemberExpressionCstToAst.createAssignmentElementAst;
    static createAssignmentElisionElementAst = CallMemberExpressionCstToAst.createAssignmentElisionElementAst;
    static createAssignmentRestElementAst = CallMemberExpressionCstToAst.createAssignmentRestElementAst;
    static createAssignmentRestPropertyAst = CallMemberExpressionCstToAst.createAssignmentRestPropertyAst;

    // ==================== 核心方法 ====================

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
}
