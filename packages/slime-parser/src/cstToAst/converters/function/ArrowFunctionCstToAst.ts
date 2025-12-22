/**
 * ArrowFunctionCstToAst - 箭头函数转换
 */
import {
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimePattern,
    type SlimeArrowFunctionExpression,
    type SlimeFunctionParam,
    SlimeAstUtil,
    SlimeTokenCreate,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class ArrowFunctionCstToAst {
    /**
     * 创建箭头函数参数 AST
     */
    static createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArrowParameters?.name);

        if (cst.children.length === 0) {
            return [];
        }

        const first = cst.children[0];

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            const param = SlimeCstToAstUtil.createBindingIdentifierAst(first);
            return [param];
        }

        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return SlimeCstToAstUtil.createArrowParametersFromCoverGrammar(first);
        }

        if (first.name === SlimeTokenConsumer.prototype.LParen?.name) {
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            );
            if (formalParameterListCst) {
                return SlimeCstToAstUtil.createFormalParameterListAst(formalParameterListCst);
            }
            return [];
        }

        return [];
    }

    /**
     * 创建箭头函数体 AST
     */
    static createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        if (!cst) {
            throw new Error('createConciseBodyAst: cst is null or undefined');
        }

        const validNames = [
            SlimeParser.prototype.ConciseBody?.name,
            'ConciseBody',
            'AsyncConciseBody'
        ];
        if (!validNames.includes(cst.name)) {
            throw new Error(`createConciseBodyAst: 期望 ConciseBody 或 AsyncConciseBody，实际 ${cst.name}`);
        }

        const first = cst.children[0];

        if (first.name === 'LBrace') {
            const functionBodyCst = cst.children.find(child =>
                child.name === 'FunctionBody' || child.name === SlimeParser.prototype.FunctionBody?.name ||
                child.name === 'AsyncFunctionBody' || child.name === SlimeParser.prototype.AsyncFunctionBody?.name
            );
            if (functionBodyCst) {
                const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(functionBodyCst);
                return SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc);
            }
            return SlimeAstUtil.createBlockStatement([], cst.loc);
        }

        if (first.name === SlimeParser.prototype.AssignmentExpression?.name || first.name === 'AssignmentExpression') {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first);
        }

        if (first.name === 'ExpressionBody') {
            const innerExpr = first.children[0];
            if (innerExpr) {
                if (innerExpr.name === 'AssignmentExpression' || innerExpr.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    return SlimeCstToAstUtil.createAssignmentExpressionAst(innerExpr);
                }
                return SlimeCstToAstUtil.createExpressionAst(innerExpr);
            }
        }

        return SlimeCstToAstUtil.createExpressionAst(first);
    }

    /**
     * 创建箭头函数 AST
     */
    static createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);

        let asyncToken: any = undefined;
        let arrowToken: any = undefined;
        let lParenToken: any = undefined;
        let rParenToken: any = undefined;
        const commaTokens: any[] = [];

        let offset = 0;
        let isAsync = false;
        if (cst.children[0] && cst.children[0].name === 'Async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(cst.children[0].loc);
            isAsync = true;
            offset = 1;
        }

        if (!cst.children || cst.children.length < 3 + offset) {
            throw new Error(`createArrowFunctionAst: 期望${3 + offset}个children，实际${cst.children?.length || 0}个`);
        }

        const arrowParametersCst = cst.children[0 + offset];
        const arrowCst = cst.children[1 + offset];
        const conciseBodyCst = cst.children[2 + offset];

        if (arrowCst && (arrowCst.name === 'Arrow' || arrowCst.value === '=>')) {
            arrowToken = SlimeTokenCreate.createArrowToken(arrowCst.loc);
        }

        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            params = [{ param: SlimeCstToAstUtil.createBindingIdentifierAst(arrowParametersCst) }];
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeTokenCreate.createLParenToken(child.loc);
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeTokenCreate.createRParenToken(child.loc);
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc));
                }
            }
            const rawParams = SlimeCstToAstUtil.createArrowParametersFromCoverGrammar(arrowParametersCst);
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }));
        } else if (arrowParametersCst.name === SlimeParser.prototype.ArrowParameters?.name) {
            const firstChild = arrowParametersCst.children?.[0];
            if (firstChild?.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
                for (const child of firstChild.children || []) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc);
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc);
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc));
                    }
                }
            }
            const rawParams = ArrowFunctionCstToAst.createArrowParametersAst(arrowParametersCst);
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }));
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`);
        }

        const body = ArrowFunctionCstToAst.createConciseBodyAst(conciseBodyCst);

        return SlimeAstUtil.createArrowFunctionExpression(
            body, params, body.type !== SlimeNodeType.BlockStatement, isAsync, cst.loc,
            arrowToken, asyncToken, lParenToken, rParenToken
        );
    }

    /**
     * 创建 Async 箭头函数 AST
     */
    static createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        let params: SlimePattern[] = [];
        let body: SlimeExpression | SlimeBlockStatement;
        let arrowIndex = -1;
        let arrowToken: any = undefined;
        let asyncToken: any = undefined;
        let lParenToken: any = undefined;
        let rParenToken: any = undefined;

        for (let i = 0; i < cst.children.length; i++) {
            if (cst.children[i].name === 'Arrow' || cst.children[i].value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(cst.children[i].loc);
                arrowIndex = i;
                break;
            }
        }

        if (arrowIndex === -1) {
            for (const child of cst.children) {
                if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                    params = ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(child);
                    break;
                } else if (child.name === 'Async') {
                    continue;
                } else if (child.name === 'BindingIdentifier' || child.name === SlimeParser.prototype.BindingIdentifier?.name) {
                    params = [SlimeCstToAstUtil.createBindingIdentifierAst(child)];
                    break;
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
            } as any;
        }

        for (let i = 0; i < arrowIndex; i++) {
            const child = cst.children[i];
            if (child.name === 'Async' || (child.name === 'IdentifierName' && child.value === 'async')) {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc);
                continue;
            }
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params = [SlimeCstToAstUtil.createBindingIdentifierAst(child)];
            } else if (child.name === 'AsyncArrowBindingIdentifier' || child.name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) {
                const bindingId = child.children?.find((c: any) =>
                    c.name === 'BindingIdentifier' || c.name === SlimeParser.prototype.BindingIdentifier?.name
                ) || child.children?.[0];
                if (bindingId) {
                    params = [SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)];
                }
            } else if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                params = ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(child);
                for (const subChild of child.children || []) {
                    if (subChild.name === 'Arguments' || subChild.name === SlimeParser.prototype.Arguments?.name) {
                        for (const argChild of subChild.children || []) {
                            if (argChild.name === 'LParen' || argChild.value === '(') {
                                lParenToken = SlimeTokenCreate.createLParenToken(argChild.loc);
                            } else if (argChild.name === 'RParen' || argChild.value === ')') {
                                rParenToken = SlimeTokenCreate.createRParenToken(argChild.loc);
                            }
                        }
                    }
                }
            } else if (child.name === SlimeParser.prototype.ArrowFormalParameters?.name || child.name === 'ArrowFormalParameters') {
                params = SlimeCstToAstUtil.createArrowFormalParametersAst(child);
                for (const subChild of child.children || []) {
                    if (subChild.name === 'LParen' || subChild.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(subChild.loc);
                    } else if (subChild.name === 'RParen' || subChild.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(subChild.loc);
                    }
                }
            }
        }

        const bodyIndex = arrowIndex + 1;
        if (bodyIndex < cst.children.length) {
            const bodyCst = cst.children[bodyIndex];
            if (bodyCst.name === 'AsyncConciseBody' || bodyCst.name === 'ConciseBody') {
                body = ArrowFunctionCstToAst.createConciseBodyAst(bodyCst);
            } else {
                body = SlimeCstToAstUtil.createExpressionAst(bodyCst);
            }
        } else {
            body = SlimeAstUtil.createBlockStatement([]);
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
        } as any;
    }

    /**
     * 从 CoverCallExpressionAndAsyncArrowHead 提取 async 箭头函数参数
     */
    static createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = [];

        for (const child of cst.children || []) {
            if (child.name === 'Arguments' || child.name === SlimeParser.prototype.Arguments?.name) {
                for (const argChild of child.children || []) {
                    if (argChild.name === 'ArgumentList' || argChild.name === SlimeParser.prototype.ArgumentList?.name) {
                        let hasEllipsis = false;
                        for (const arg of argChild.children || []) {
                            if (arg.value === ',') continue;
                            if (arg.name === 'Ellipsis' || arg.value === '...') {
                                hasEllipsis = true;
                                continue;
                            }
                            const param = SlimeCstToAstUtil.convertCoverParameterCstToPattern(arg, hasEllipsis);
                            if (param) {
                                params.push(param);
                                hasEllipsis = false;
                            }
                        }
                    }
                }
            }
        }

        return params;
    }
}
