import {
    type SlimeFunctionDeclaration,
    type SlimeFunctionExpression,
    type SlimeArrowFunctionExpression,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
    type SlimeRestElement,
    type SlimeFunctionParam, type SlimeMethodDefinition, type SlimeObjectPattern, type SlimeObjectPatternProperty,
    type SlimeAssignmentProperty, type SlimeArrayPattern, type SlimeArrayPatternElement, type SlimeStatement,
    type SlimeCallArgument, type SlimeSuper, type SlimeSpreadElement,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools, checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";
import SlimeTokenConsumer from "../SlimeTokenConsumer.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setFunctionCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for FunctionCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 函数相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class FunctionCstToAst {

    /**
     * AsyncMethod CST 到 AST
     */
    static createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return getUtil().createMethodDefinitionAstInternal(cst, 'method', false, true)
    }

    /**
     * AsyncFunctionBody CST 到 AST（透传到 FunctionBody）
     */
    static createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionCstToAst.createFunctionBodyAst(cst)
    }

    /**
     * AsyncGeneratorMethod CST 到 AST
     */
    static createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return getUtil().createMethodDefinitionAstInternal(cst, 'method', true, true)
    }

    /**
     * AsyncGeneratorBody CST 到 AST（透传到 FunctionBody）
     */
    static createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionCstToAst.createFunctionBodyAst(cst)
    }

    /**
     * AsyncArrowBindingIdentifier CST 到 AST
     */
    static createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const bindingId = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        if (bindingId) {
            return getUtil().createBindingIdentifierAst(bindingId)
        }
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return getUtil().createBindingIdentifierAst(firstChild)
        }
        throw new Error('AsyncArrowBindingIdentifier has no identifier')
    }

    /**
     * AsyncConciseBody CST 到 AST
     */
    static createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return FunctionCstToAst.createConciseBodyAst(cst)
    }

    /**
     * AsyncArrowHead CST 到 AST（透传）
     */
    static createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return cst.children?.[0] ? getUtil().createAstFromCst(cst.children[0]) : null
    }

    /**
     * 创建箭头函数 AST
     */
    static createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);

        let asyncToken: any = undefined
        let arrowToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        const commaTokens: any[] = []

        let offset = 0;
        let isAsync = false;
        if (cst.children[0] && cst.children[0].name === 'Async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(cst.children[0].loc)
            isAsync = true;
            offset = 1;
        }

        if (!cst.children || cst.children.length < 3 + offset) {
            throw new Error(`createArrowFunctionAst: 期望${3 + offset}个children，实际${cst.children?.length || 0}个`)
        }

        const arrowParametersCst = cst.children[0 + offset]
        const arrowCst = cst.children[1 + offset]
        const conciseBodyCst = cst.children[2 + offset]

        if (arrowCst && (arrowCst.name === 'Arrow' || arrowCst.value === '=>')) {
            arrowToken = SlimeTokenCreate.createArrowToken(arrowCst.loc)
        }

        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            params = [{ param: getUtil().createBindingIdentifierAst(arrowParametersCst) }]
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                }
            }
            const rawParams = FunctionCstToAst.createArrowParametersFromCoverGrammar(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }))
        } else if (arrowParametersCst.name === SlimeParser.prototype.ArrowParameters?.name) {
            const firstChild = arrowParametersCst.children?.[0]
            if (firstChild?.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
                for (const child of firstChild.children || []) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                    }
                }
            }
            const rawParams = FunctionCstToAst.createArrowParametersAst(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        const body = FunctionCstToAst.createConciseBodyAst(conciseBodyCst)

        return SlimeAstUtil.createArrowFunctionExpression(
            body, params, body.type !== SlimeNodeType.BlockStatement, isAsync, cst.loc,
            arrowToken, asyncToken, lParenToken, rParenToken
        )
    }

    /**
     * 创建 Async 箭头函数 AST
     */
    static createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        let params: SlimePattern[] = []
        let body: SlimeExpression | SlimeBlockStatement
        let arrowIndex = -1
        let arrowToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (let i = 0; i < cst.children.length; i++) {
            if (cst.children[i].name === 'Arrow' || cst.children[i].value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(cst.children[i].loc)
                arrowIndex = i
                break
            }
        }

        if (arrowIndex === -1) {
            for (const child of cst.children) {
                if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                    params = FunctionCstToAst.createAsyncArrowParamsFromCover(child)
                    break
                } else if (child.name === 'Async') {
                    continue
                } else if (child.name === 'BindingIdentifier' || child.name === SlimeParser.prototype.BindingIdentifier?.name) {
                    params = [getUtil().createBindingIdentifierAst(child)]
                    break
                }
            }
            return {
                type: SlimeNodeType.ArrowFunctionExpression,
                id: null,
                params: params,
                body: SlimeAstUtil.createBlockStatement([]),
                generator: false,
                async: true,
                expression: false,
                loc: cst.loc
            } as any
        }

        for (let i = 0; i < arrowIndex; i++) {
            const child = cst.children[i]
            if (child.name === 'Async' || (child.name === 'IdentifierName' && child.value === 'async')) {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                continue
            }
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params = [getUtil().createBindingIdentifierAst(child)]
            } else if (child.name === 'AsyncArrowBindingIdentifier' || child.name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) {
                const bindingId = child.children?.find((c: any) =>
                    c.name === 'BindingIdentifier' || c.name === SlimeParser.prototype.BindingIdentifier?.name
                ) || child.children?.[0]
                if (bindingId) {
                    params = [getUtil().createBindingIdentifierAst(bindingId)]
                }
            } else if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                params = FunctionCstToAst.createAsyncArrowParamsFromCover(child)
                for (const subChild of child.children || []) {
                    if (subChild.name === 'Arguments' || subChild.name === SlimeParser.prototype.Arguments?.name) {
                        for (const argChild of subChild.children || []) {
                            if (argChild.name === 'LParen' || argChild.value === '(') {
                                lParenToken = SlimeTokenCreate.createLParenToken(argChild.loc)
                            } else if (argChild.name === 'RParen' || argChild.value === ')') {
                                rParenToken = SlimeTokenCreate.createRParenToken(argChild.loc)
                            }
                        }
                    }
                }
            } else if (child.name === SlimeParser.prototype.ArrowFormalParameters?.name || child.name === 'ArrowFormalParameters') {
                params = FunctionCstToAst.createArrowFormalParametersAst(child)
                for (const subChild of child.children || []) {
                    if (subChild.name === 'LParen' || subChild.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(subChild.loc)
                    } else if (subChild.name === 'RParen' || subChild.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(subChild.loc)
                    }
                }
            }
        }

        const bodyIndex = arrowIndex + 1
        if (bodyIndex < cst.children.length) {
            const bodyCst = cst.children[bodyIndex]
            if (bodyCst.name === 'AsyncConciseBody' || bodyCst.name === 'ConciseBody') {
                body = FunctionCstToAst.createConciseBodyAst(bodyCst)
            } else {
                body = getUtil().createExpressionAst(bodyCst)
            }
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.ArrowFunctionExpression,
            id: null,
            params: params,
            body: body,
            generator: false,
            async: true,
            expression: body.type !== SlimeNodeType.BlockStatement,
            arrowToken: arrowToken,
            asyncToken: asyncToken,
            lParenToken: lParenToken,
            rParenToken: rParenToken,
            loc: cst.loc
        } as any
    }

    /**
     * 从 CoverCallExpressionAndAsyncArrowHead 提取 async 箭头函数参数
     */
    static createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'Arguments' || child.name === SlimeParser.prototype.Arguments?.name) {
                for (const argChild of child.children || []) {
                    if (argChild.name === 'ArgumentList' || argChild.name === SlimeParser.prototype.ArgumentList?.name) {
                        let hasEllipsis = false
                        for (const arg of argChild.children || []) {
                            if (arg.value === ',') continue
                            if (arg.name === 'Ellipsis' || arg.value === '...') {
                                hasEllipsis = true
                                continue
                            }
                            const param = FunctionCstToAst.convertCoverParameterCstToPattern(arg, hasEllipsis)
                            if (param) {
                                params.push(param)
                                hasEllipsis = false
                            }
                        }
                    }
                }
            }
        }

        return params
    }

    /**
     * 从 CST 表达式转换为 Pattern
     */
    static convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                const expr = getUtil().createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return getUtil().convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            return getUtil().convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            return getUtil().convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return getUtil().createBindingIdentifierAst(inner)
        }

        const expr = getUtil().createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return getUtil().convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return getUtil().convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return getUtil().convertAssignmentExpressionToPattern(expr)
        }

        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换为 Pattern
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = getUtil().createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = getUtil().createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = getUtil().createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = getUtil().createObjectBindingPatternAst(cst)
        }

        if (!basePattern) {
            basePattern = FunctionCstToAst.convertCstToPattern(cst)
        }

        if (!basePattern) {
            const identifierCst = getUtil().findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = getUtil().createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }

    /**
     * GeneratorMethod CST 到 AST
     */
    static createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return getUtil().createMethodDefinitionAstInternal(cst, 'method', true, false)
    }

    /**
     * GeneratorBody CST 到 AST（透传到 FunctionBody）
     */
    static createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionCstToAst.createFunctionBodyAst(cst)
    }

    /**
     * 从 ArrowFormalParameters 提取参数
     */
    static createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return FunctionCstToAst.createUniqueFormalParametersAst(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return FunctionCstToAst.createFormalParametersAst(child)
            }
        }

        return params
    }

    /**
     * 从 ArrowFormalParameters 提取参数 (包装类型版本)
     */
    static createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return FunctionCstToAst.createUniqueFormalParametersAstWrapped(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return FunctionCstToAst.createFormalParametersAstWrapped(child)
            }
        }

        return []
    }

    /**
     * 从 CoverParenthesizedExpressionAndArrowParameterList 提取箭头函数参数
     */
    static createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name);

        if (cst.children.length === 0) {
            return []
        }

        if (cst.children.length === 2) {
            return []
        }

        const params: SlimePattern[] = []

        const formalParameterListCst = cst.children.find(
            child => child.name === SlimeParser.prototype.FormalParameterList?.name
        )
        if (formalParameterListCst) {
            return FunctionCstToAst.createFormalParameterListAst(formalParameterListCst)
        }

        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        )
        if (expressionCst && expressionCst.children?.length) {
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                const param = FunctionCstToAst.convertCoverParameterCstToPattern(child, false)
                if (param) {
                    params.push(param)
                }
            }
        }

        const hasEllipsis = cst.children.some(
            child => child.name === 'Ellipsis' || child.name === 'Ellipsis'
        )
        if (hasEllipsis) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            const bindingPatternCst = bindingIdentifierCst
                ? null
                : cst.children.find(
                    child => child.name === SlimeParser.prototype.BindingPattern?.name ||
                        child.name === 'BindingPattern' ||
                        child.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
                        child.name === 'ArrayBindingPattern' ||
                        child.name === SlimeParser.prototype.ObjectBindingPattern?.name ||
                        child.name === 'ObjectBindingPattern'
                )

            const restTarget = bindingIdentifierCst || bindingPatternCst
            if (restTarget) {
                const restParam = FunctionCstToAst.convertCoverParameterCstToPattern(restTarget, true)
                if (restParam) {
                    params.push(restParam)
                }
            }
        } else if (params.length === 0) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            if (bindingIdentifierCst) {
                params.push(getUtil().createBindingIdentifierAst(bindingIdentifierCst))
            }
        }

        return params
    }


    /**
     * 从 Expression 中提取箭头函数参数
     */
    static extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = getUtil().createAssignmentExpressionAst(expressionCst)
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any]
            }
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = []

            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = getUtil().createAssignmentExpressionAst(child)
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        params.push(getUtil().convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        params.push(getUtil().convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        const identifier = getUtil().findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(getUtil().createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        const identifierCst = getUtil().findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [getUtil().createIdentifierAst(identifierCst) as any]
        }

        return []
    }

    /**
     * 创建箭头函数参数 AST
     */
    static createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.ArrowParameters?.name);

        if (cst.children.length === 0) {
            return []
        }

        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            const param = getUtil().createBindingIdentifierAst(first)
            return [param]
        }

        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return FunctionCstToAst.createArrowParametersFromCoverGrammar(first)
        }

        if (first.name === SlimeTokenConsumer.prototype.LParen?.name) {
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            )
            if (formalParameterListCst) {
                return FunctionCstToAst.createFormalParameterListAst(formalParameterListCst)
            }
            return []
        }

        return []
    }

    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST 到 AST
     */
    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return getUtil().createParenthesizedExpressionAst(cst)
    }

    /**
     * ComputedPropertyName CST 到 AST
     */
    static createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return getUtil().createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }

    /**
     * CoverInitializedName CST 到 AST
     */
    static createCoverInitializedNameAst(cst: SubhutiCst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.IdentifierReference?.name ||
            ch.name === 'IdentifierReference'
        )
        const init = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name ||
            ch.name === 'Initializer'
        )

        const id = idRef ? getUtil().createIdentifierReferenceAst(idRef) : null
        const initValue = init ? getUtil().createInitializerAst(init) : null

        return {
            type: SlimeNodeType.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        }
    }

    /**
     * CoverCallExpressionAndAsyncArrowHead CST 到 AST
     */
    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return getUtil().createCallExpressionAst(cst)
    }

    /**
     * Create FormalParameters AST (包装类型)
     */
    static createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name

            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...FunctionCstToAst.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = getUtil().createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 从 ES2025 FormalParameterList 创建参数 AST（包装类型）
     */
    static createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = FunctionCstToAst.createFormalParameterAst(child)
                hasParam = true
            }
        }

        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 创建 FunctionRestParameter AST
     */
    static createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = getUtil().createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                return FunctionCstToAst.createBindingRestElementAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = getUtil().createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 BindingRestElement AST
     */
    static createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = getUtil().createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = getUtil().createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 CatchParameter AST
     */
    static createCatchParameterAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return getUtil().createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return getUtil().createBindingPatternAst(first)
        }

        return null
    }

    /**
     * 创建 Arguments AST
     */
    static createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                const res = FunctionCstToAst.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    /**
     * 创建 ArgumentList AST
     */
    static createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
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

                const expr = getUtil().createAssignmentExpressionAst(child)
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
                currentArg = getUtil().createSpreadElementAst(child)
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
     * 处理 FormalParameters CST 节点
     */
    static createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return FunctionCstToAst.createFormalParameterListAst(child)
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(FunctionCstToAst.createFormalParameterAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(getUtil().createBindingIdentifierAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(FunctionCstToAst.createBindingElementAst(child))
                continue
            }

            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(FunctionCstToAst.createFunctionRestParameterAst(child))
                continue
            }

            if (child.value === ',' || child.value === '(' || child.value === ')') {
                continue
            }
        }

        return params
    }

    /**
     * 创建 FormalParameterList AST
     */
    static createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.value === ',') continue

            if (child.name === SlimeParser.prototype.FormalParameter?.name || child.name === 'FormalParameter') {
                params.push(FunctionCstToAst.createFormalParameterAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElement?.name || child.name === 'BindingElement') {
                params.push(FunctionCstToAst.createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params.push(getUtil().createBindingIdentifierAst(child))
            }
        }

        return params
    }

    /**
     * 创建 FormalParameter AST
     */
    static createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === SlimeParser.prototype.BindingElement?.name || firstChild.name === 'BindingElement') {
                return FunctionCstToAst.createBindingElementAst(firstChild)
            }
            if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
                return getUtil().createBindingIdentifierAst(firstChild)
            }
        }
        return FunctionCstToAst.createBindingElementAst(cst)
    }

    /**
     * 创建 BindingElement AST
     */
    static createBindingElementAst(cst: SubhutiCst): SlimePattern {
        const children = cst.children || []
        let pattern: SlimePattern | null = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.SingleNameBinding?.name || name === 'SingleNameBinding') {
                return FunctionCstToAst.createSingleNameBindingAst(child)
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                pattern = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                pattern = getUtil().createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = getUtil().createInitializerAst(child)
            }
        }

        if (init && pattern) {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: pattern,
                right: init,
                loc: cst.loc
            } as any
        }

        return pattern || { type: SlimeNodeType.Identifier, name: '', loc: cst.loc } as any
    }

    /**
     * 创建 SingleNameBinding AST
     */
    static createSingleNameBindingAst(cst: SubhutiCst): SlimePattern {
        const children = cst.children || []
        let id: SlimeIdentifier | null = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = getUtil().createInitializerAst(child)
            }
        }

        if (init && id) {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: id,
                right: init,
                loc: cst.loc
            } as any
        }

        return id || { type: SlimeNodeType.Identifier, name: '', loc: cst.loc } as any
    }

    /**
     * 创建 UniqueFormalParameters AST
     */
    static createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters'
        )
        if (formalParams) {
            return FunctionCstToAst.createFormalParametersAst(formalParams)
        }
        return FunctionCstToAst.createFormalParametersAst(cst)
    }

    /**
     * 创建 UniqueFormalParameters AST (包装类型)
     */
    static createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters'
        )
        if (formalParams) {
            return FunctionCstToAst.createFormalParametersAstWrapped(formalParams)
        }
        return FunctionCstToAst.createFormalParametersAstWrapped(cst)
    }

    /**
     * 创建 FunctionBody AST
     */
    static createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        const statementListCst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FunctionStatementList?.name ||
            ch.name === 'FunctionStatementList' ||
            ch.name === SlimeParser.prototype.StatementList?.name ||
            ch.name === 'StatementList'
        )
        if (statementListCst) {
            return getUtil().createStatementListAst(statementListCst)
        }
        return []
    }

    /**
     * 创建 ConciseBody AST
     */
    static createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.ExpressionBody?.name || name === 'ExpressionBody') {
                const exprChild = child.children?.[0]
                if (exprChild) {
                    return getUtil().createAssignmentExpressionAst(exprChild)
                }
            }

            if (name === SlimeParser.prototype.AssignmentExpression?.name || name === 'AssignmentExpression') {
                return getUtil().createAssignmentExpressionAst(child)
            }

            if (name === 'LBrace' || child.value === '{') {
                const funcBodyCst = children.find(ch =>
                    ch.name === SlimeParser.prototype.FunctionBody?.name || ch.name === 'FunctionBody'
                )
                if (funcBodyCst) {
                    const statements = FunctionCstToAst.createFunctionBodyAst(funcBodyCst)
                    return SlimeAstUtil.createBlockStatement(statements, cst.loc)
                }
                const statementListCst = children.find(ch =>
                    ch.name === SlimeParser.prototype.FunctionStatementList?.name || ch.name === 'FunctionStatementList'
                )
                if (statementListCst) {
                    const statements = getUtil().createStatementListAst(statementListCst)
                    return SlimeAstUtil.createBlockStatement(statements, cst.loc)
                }
                return SlimeAstUtil.createBlockStatement([], cst.loc)
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = FunctionCstToAst.createFunctionBodyAst(child)
                return SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
        }

        if (children.length > 0) {
            const firstChild = children[0]
            if (firstChild.name !== 'LBrace' && firstChild.value !== '{') {
                return getUtil().createExpressionAst(firstChild)
            }
        }

        return SlimeAstUtil.createBlockStatement([], cst.loc)
    }

    /**
     * 创建 FunctionExpression AST
     */
    static createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.FunctionExpression?.name);

        let isAsync = false;
        let isGenerator = false;
        let functionId: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name
            const value = child.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionId = getUtil().createBindingIdentifierAst(child)
                continue
            }

            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = FunctionCstToAst.createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const bodyStatements = FunctionCstToAst.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(bodyStatements, child.loc)
                continue
            }
        }

        if (!body!) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionExpression(
            body, functionId, params, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

    /**
     * FunctionStatementList CST 到 AST
     */
    static createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const children = cst.children || []

        if (children.length === 0) {
            return []
        }

        const first = children[0]
        if (!first) {
            return []
        }

        if (first.name === 'StatementList' || first.name === SlimeParser.prototype.StatementList?.name) {
            return getUtil().createStatementListAst(first)
        }

        return getUtil().createStatementListItemAst(first)
    }

    /**
     * PropertySetParameterList CST 到 AST
     */
    static createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [FunctionCstToAst.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [FunctionCstToAst.createBindingElementAst(first)]
        }
        return []
    }

    /**
     * PropertySetParameterList CST 到 AST (包装类型版本)
     */
    static createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeAstUtil.createFunctionParam(FunctionCstToAst.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeAstUtil.createFunctionParam(FunctionCstToAst.createBindingElementAst(first), undefined)]
        }
        return []
    }
}
