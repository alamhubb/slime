import {
    type SlimeArrowFunctionExpression,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
    type SlimeFunctionParam,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";

// 导入拆分出去的类
import { CoverGrammarCstToAst, setCoverGrammarCstToAstUtil } from "./CoverGrammarCstToAst";

// Re-export 拆分出去的类，保持向后兼容
export { CoverGrammarCstToAst } from "./CoverGrammarCstToAst";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setArrowFunctionCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
    // 同时设置拆分出去的类的 util
    setCoverGrammarCstToAstUtil(util);
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for ArrowFunctionCstToAst');
    }
    return _slimeCstToAstUtil;
}

// 延迟导入以避免循环依赖
let _ParameterCstToAst: any = null;
function getParameterCstToAst() {
    if (!_ParameterCstToAst) {
        _ParameterCstToAst = require('./ParameterCstToAst.ts').ParameterCstToAst;
    }
    return _ParameterCstToAst;
}

let _FunctionCstToAst: any = null;
function getFunctionCstToAst() {
    if (!_FunctionCstToAst) {
        _FunctionCstToAst = require('./FunctionCstToAst.ts').FunctionCstToAst;
    }
    return _FunctionCstToAst;
}

/**
 * 箭头函数相关的 CST to AST 转换
 * 核心方法保留在此文件，Cover 语法转换已拆分到 CoverGrammarCstToAst
 */
export class ArrowFunctionCstToAst {

    // ==================== 委托到 CoverGrammarCstToAst ====================
    static createAsyncArrowParamsFromCover = CoverGrammarCstToAst.createAsyncArrowParamsFromCover;
    static convertCstToPattern = CoverGrammarCstToAst.convertCstToPattern;
    static convertCoverParameterCstToPattern = CoverGrammarCstToAst.convertCoverParameterCstToPattern;
    static createArrowParametersFromCoverGrammar = CoverGrammarCstToAst.createArrowParametersFromCoverGrammar;
    static extractParametersFromExpression = CoverGrammarCstToAst.extractParametersFromExpression;
    static createCoverParenthesizedExpressionAndArrowParameterListAst = CoverGrammarCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst;

    // ==================== 核心方法 ====================

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
            const rawParams = ArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(arrowParametersCst)
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
            const rawParams = ArrowFunctionCstToAst.createArrowParametersAst(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i]
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        const body = ArrowFunctionCstToAst.createConciseBodyAst(conciseBodyCst)

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
                    params = ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(child)
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
                params = ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(child)
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
                params = getParameterCstToAst().createArrowFormalParametersAst(child)
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
                body = ArrowFunctionCstToAst.createConciseBodyAst(bodyCst)
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
            return ArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(first)
        }

        if (first.name === SlimeParser.prototype.LParen?.name) {
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            )
            if (formalParameterListCst) {
                return getParameterCstToAst().createFormalParameterListAst(formalParameterListCst)
            }
            return []
        }

        return []
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
        return ArrowFunctionCstToAst.createConciseBodyAst(cst)
    }

    /**
     * AsyncArrowHead CST 到 AST（透传）
     */
    static createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return cst.children?.[0] ? getUtil().createAstFromCst(cst.children[0]) : null
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
                    const statements = getFunctionCstToAst().createFunctionBodyAst(funcBodyCst)
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
                const statements = getFunctionCstToAst().createFunctionBodyAst(child)
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
}
