import {
    type SlimeFunctionDeclaration,
    type SlimeFunctionExpression,
    type SlimeArrowFunctionExpression,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
    type SlimeRestElement,
    type SlimeFunctionParam, type SlimeMethodDefinition,
    type SlimeStatement,
    type SlimeCallArgument,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { ArrowFunctionCstToAst } from "./ArrowFunctionCstToAst";
import { ParameterCstToAst } from "./ParameterCstToAst";


/**
 * 函数相关的 CST to AST 转换
 * 箭头函数相关方法委托给 ArrowFunctionCstToAst
 * 参数相关方法委托给 ParameterCstToAst
 */
export class FunctionCstToAst {

    // ========== 委托给 ArrowFunctionCstToAst ==========
    static createArrowFunctionAst = ArrowFunctionCstToAst.createArrowFunctionAst;
    static createAsyncArrowFunctionAst = ArrowFunctionCstToAst.createAsyncArrowFunctionAst;
    static createAsyncArrowParamsFromCover = ArrowFunctionCstToAst.createAsyncArrowParamsFromCover;
    static convertCstToPattern = ArrowFunctionCstToAst.convertCstToPattern;
    static convertCoverParameterCstToPattern = ArrowFunctionCstToAst.convertCoverParameterCstToPattern;
    static createArrowParametersFromCoverGrammar = ArrowFunctionCstToAst.createArrowParametersFromCoverGrammar;
    static extractParametersFromExpression = ArrowFunctionCstToAst.extractParametersFromExpression;
    static createArrowParametersAst = ArrowFunctionCstToAst.createArrowParametersAst;
    static createCoverParenthesizedExpressionAndArrowParameterListAst = ArrowFunctionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst;
    static createAsyncArrowBindingIdentifierAst = ArrowFunctionCstToAst.createAsyncArrowBindingIdentifierAst;
    static createAsyncConciseBodyAst = ArrowFunctionCstToAst.createAsyncConciseBodyAst;
    static createAsyncArrowHeadAst = ArrowFunctionCstToAst.createAsyncArrowHeadAst;
    static createConciseBodyAst = ArrowFunctionCstToAst.createConciseBodyAst;
    static createComputedPropertyNameAst = ArrowFunctionCstToAst.createComputedPropertyNameAst;
    static createCoverInitializedNameAst = ArrowFunctionCstToAst.createCoverInitializedNameAst;
    static createCoverCallExpressionAndAsyncArrowHeadAst = ArrowFunctionCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst;

    // ========== 委托给 ParameterCstToAst ==========
    static createArrowFormalParametersAst = ParameterCstToAst.createArrowFormalParametersAst;
    static createArrowFormalParametersAstWrapped = ParameterCstToAst.createArrowFormalParametersAstWrapped;
    static createFormalParametersAstWrapped = ParameterCstToAst.createFormalParametersAstWrapped;
    static createFormalParameterListFromEs2025Wrapped = ParameterCstToAst.createFormalParameterListFromEs2025Wrapped;
    static createFunctionRestParameterAst = ParameterCstToAst.createFunctionRestParameterAst;
    static createBindingRestElementAst = ParameterCstToAst.createBindingRestElementAst;
    static createCatchParameterAst = ParameterCstToAst.createCatchParameterAst;
    static createArgumentsAst = ParameterCstToAst.createArgumentsAst;
    static createArgumentListAst = ParameterCstToAst.createArgumentListAst;
    static createFormalParametersAst = ParameterCstToAst.createFormalParametersAst;
    static createFormalParameterListAst = ParameterCstToAst.createFormalParameterListAst;
    static createFormalParameterAst = ParameterCstToAst.createFormalParameterAst;
    static createBindingElementAst = ParameterCstToAst.createBindingElementAst;
    static createSingleNameBindingAst = ParameterCstToAst.createSingleNameBindingAst;
    static createUniqueFormalParametersAst = ParameterCstToAst.createUniqueFormalParametersAst;
    static createUniqueFormalParametersAstWrapped = ParameterCstToAst.createUniqueFormalParametersAstWrapped;
    static createPropertySetParameterListAst = ParameterCstToAst.createPropertySetParameterListAst;
    static createPropertySetParameterListAstWrapped = ParameterCstToAst.createPropertySetParameterListAstWrapped;

    // ========== 本地方法 ==========

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
     * AsyncFunctionExpression CST 到 AST
     */
    static createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createFunctionExpressionAst(cst)
    }

    /**
     * GeneratorExpression CST 到 AST
     */
    static createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createFunctionExpressionAst(cst)
    }

    /**
     * AsyncGeneratorExpression CST 到 AST
     */
    static createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createFunctionExpressionAst(cst)
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
                params = ParameterCstToAst.createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody' ||
                name === 'GeneratorBody' || name === 'AsyncFunctionBody' || name === 'AsyncGeneratorBody' ||
                name === SlimeParser.prototype.GeneratorBody?.name ||
                name === SlimeParser.prototype.AsyncFunctionBody?.name ||
                name === SlimeParser.prototype.AsyncGeneratorBody?.name) {
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
}

// Re-export for backward compatibility
export { ArrowFunctionCstToAst } from "./ArrowFunctionCstToAst.ts";
export { ParameterCstToAst } from "./ParameterCstToAst.ts";
