/**
 * ArrowFunctionCstToAst - 箭头函数转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    type SlimeJavascriptFunctionParam,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptPattern,
    SlimeJavascriptTokenCreateUtils,
    SlimeJavascriptAstTypeName, SlimeJavascriptArrowFunctionExpression, SlimeJavascriptIdentifier
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptArrowFunctionCstToAstSingle {


    /**
     * 创建箭头函数 AST
     */
    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);
        // ArrowFunction 结构（带async）：
        // children[0]: AsyncTok (可�?
        // children[1]: BindingIdentifier �?CoverParenthesizedExpressionAndArrowParameterList (参数)
        // children[2]: Arrow (=>)
        // children[3]: ConciseBody (函数�?

        // Token fields
        let asyncToken: any = undefined
        let arrowToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        const commaTokens: any[] = []

        // 检查是否有async
        let offset = 0;
        let isAsync = false;
        if (cst.children[0] && cst.children[0].name === 'Async') {
            asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(cst.children[0].loc)
            isAsync = true;
            offset = 1;
        }

        // 防御性检查：确保children存在且有足够元素
        if (!cst.children || cst.children.length < 3 + offset) {
            throw new Error(`createArrowFunctionAst: 期望${3 + offset}个children，实�?{cst.children?.length || 0}个`)
        }

        const arrowParametersCst = cst.children[0 + offset]
        const arrowCst = cst.children[1 + offset]
        const conciseBodyCst = cst.children[2 + offset]

        // 提取箭头 token
        if (arrowCst && (arrowCst.name === 'Arrow' || arrowCst.value === '=>')) {
            arrowToken = SlimeJavascriptTokenCreateUtils.createArrowToken(arrowCst.loc)
        }

        // 解析参数 - 根据节点类型分别处理
        // SlimeJavascriptFunctionParam 是包装类型，包含 param 和可选的 commaToken
        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            // 单个参数：x => x * 2
            params = [{param: SlimeCstToAstUtil.createBindingIdentifierAst(arrowParametersCst)}]
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            // 括号参数�?a, b) => a + b �?() => 42
            // 提取括号 tokens
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(child.loc)
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(child.loc)
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeJavascriptTokenCreateUtils.createCommaToken(child.loc))
                }
            }
            // �?SlimeJavascriptPattern[] 转换�?SlimeJavascriptFunctionParam[]
            const rawParams = SlimeCstToAstUtil.createArrowParametersFromCoverGrammar(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i] // 为每个参数关联逗号 token（最后一个参数无逗号�?
            }))
        } else if (arrowParametersCst.name === SlimeParser.prototype.ArrowParameters?.name) {
            // ArrowParameters 规则：其子节点可能是 CoverParenthesizedExpressionAndArrowParameterList �?BindingIdentifier
            const firstChild = arrowParametersCst.children?.[0]
            if (firstChild?.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
                // �?CoverParenthesizedExpressionAndArrowParameterList 提取括号 tokens
                for (const child of firstChild.children || []) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(child.loc)
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeJavascriptTokenCreateUtils.createCommaToken(child.loc))
                    }
                }
            }
            const rawParams = SlimeCstToAstUtil.createArrowParametersAst(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i] // 为每个参数关联逗号 token（最后一个参数无逗号�?
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        // 解析函数�?
        const body = SlimeCstToAstUtil.createConciseBodyAst(conciseBodyCst)

        // 注意：createArrowFunctionExpression 参数顺序�?(body, params, expression, async, loc, arrowToken, asyncToken, lParenToken, rParenToken)
        // commaTokens 目前函数签名不支持，暂时忽略
        return SlimeJavascriptCreateUtils.createArrowFunctionExpression(
            body, params, body.type !== SlimeAstTypeName.BlockStatement, isAsync, cst.loc,
            arrowToken, asyncToken, lParenToken, rParenToken
        )
    }

    /**
     * 创建 Async 箭头函数 AST
     * AsyncArrowFunction: async AsyncArrowBindingIdentifier => AsyncConciseBody
     *                   | CoverCallExpressionAndAsyncArrowHead => AsyncConciseBody
     */
    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        // AsyncArrowFunction 结构�?
        // 形式1: [AsyncTok, BindingIdentifier, Arrow, AsyncConciseBody]
        // 形式2: [CoverCallExpressionAndAsyncArrowHead, Arrow, AsyncConciseBody]

        let params: SlimePattern[] = []
        let body: SlimeExpression | SlimeJavascriptBlockStatement
        let arrowIndex = -1
        let arrowToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        // 找到 Arrow token 的位�?
        for (let i = 0; i < cst.children.length; i++) {
            if (cst.children[i].name === 'Arrow' || cst.children[i].value === '=>') {
                arrowToken = SlimeJavascriptTokenCreateUtils.createArrowToken(cst.children[i].loc)
                arrowIndex = i
                break
            }
        }

        // 容错模式：如果找不到 Arrow token，尝试从不完整的 CST 中提取信�?
        if (arrowIndex === -1) {
            // 尝试�?CoverCallExpressionAndAsyncArrowHead 提取参数
            for (const child of cst.children) {
                if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                    params = SlimeCstToAstUtil.createAsyncArrowParamsFromCover(child)
                    break
                } else if (child.name === 'Async') {
                    continue
                } else if (child.name === 'BindingIdentifier' || child.name === SlimeParser.prototype.BindingIdentifier?.name) {
                    params = [SlimeCstToAstUtil.createBindingIdentifierAst(child)]
                    break
                }
            }
            // 返回不完整的箭头函数（没�?body�?
            return {
                type: SlimeAstTypeName.ArrowFunctionExpression,
                id: null,
                params: params,
                body: SlimeCreateUtils.createBlockStatement([]),
                generator: false,
                async: true,
                expression: false,
                loc: cst.loc
            } as any
        }

        // 解析参数（Arrow 之前的部分）
        for (let i = 0; i < arrowIndex; i++) {
            const child = cst.children[i]
            if (child.name === 'Async' || (child.name === 'IdentifierName' && child.value === 'async')) {
                asyncToken = SlimeJavascriptTokenCreateUtils.createAsyncToken(child.loc)
                continue // 跳过 async 关键�?
            }
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params = [SlimeCstToAstUtil.createBindingIdentifierAst(child)]
            } else if (child.name === 'AsyncArrowBindingIdentifier' || child.name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) {
                // AsyncArrowBindingIdentifier 包含一�?BindingIdentifier
                const bindingId = child.children?.find((c: any) =>
                    c.name === 'BindingIdentifier' || c.name === SlimeParser.prototype.BindingIdentifier?.name
                ) || child.children?.[0]
                if (bindingId) {
                    params = [SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)]
                }
            } else if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                // �?CoverCallExpressionAndAsyncArrowHead 提取参数和括�?tokens
                params = SlimeCstToAstUtil.createAsyncArrowParamsFromCover(child)
                // 提取括号 tokens
                for (const subChild of child.children || []) {
                    if (subChild.name === 'Arguments' || subChild.name === SlimeParser.prototype.Arguments?.name) {
                        for (const argChild of subChild.children || []) {
                            if (argChild.name === 'LParen' || argChild.value === '(') {
                                lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(argChild.loc)
                            } else if (argChild.name === 'RParen' || argChild.value === ')') {
                                rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(argChild.loc)
                            }
                        }
                    }
                }
            } else if (child.name === SlimeParser.prototype.ArrowFormalParameters?.name || child.name === 'ArrowFormalParameters') {
                params = SlimeCstToAstUtil.createArrowFormalParametersAst(child)
                // 提取括号 tokens
                for (const subChild of child.children || []) {
                    if (subChild.name === 'LParen' || subChild.value === '(') {
                        lParenToken = SlimeJavascriptTokenCreateUtils.createLParenToken(subChild.loc)
                    } else if (subChild.name === 'RParen' || subChild.value === ')') {
                        rParenToken = SlimeJavascriptTokenCreateUtils.createRParenToken(subChild.loc)
                    }
                }
            }
        }

        // 解析函数体（Arrow 之后的部分）
        const bodyIndex = arrowIndex + 1
        if (bodyIndex < cst.children.length) {
            const bodyCst = cst.children[bodyIndex]
            if (bodyCst.name === 'AsyncConciseBody' || bodyCst.name === 'ConciseBody') {
                body = SlimeCstToAstUtil.createConciseBodyAst(bodyCst)
            } else {
                body = SlimeCstToAstUtil.createExpressionAst(bodyCst)
            }
        } else {
            body = SlimeJavascriptCreateUtils.createBlockStatement([])
        }

        return {
            type: SlimeAstTypeName.ArrowFunctionExpression,
            id: null,
            params: params,
            body: body,
            generator: false,
            async: true,
            expression: body.type !== SlimeAstTypeName.BlockStatement,
            arrowToken: arrowToken,
            asyncToken: asyncToken,
            lParenToken: lParenToken,
            rParenToken: rParenToken,
            loc: cst.loc
        } as any
    }

    /**
     * AsyncArrowHead CST �?AST（透传�?
     */
    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        // AsyncArrowHead 主要用于解析，实�?AST 处理�?AsyncArrowFunction �?
        return cst.children?.[0] ? SlimeCstToAstUtil.createAstFromCst(cst.children[0]) : null
    }

    /**
     * 从CoverParenthesizedExpressionAndArrowParameterList提取箭头函数参数
     */
    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name);

        // CoverParenthesizedExpressionAndArrowParameterList 的children结构�?
        // LParen + (FormalParameterList | Expression | ...) + RParen
        // 或�?LParen + Expression + Comma + Ellipsis + BindingIdentifier + RParen

        if (cst.children.length === 0) {
            return []
        }

        // () - 空参�?
        if (cst.children.length === 2) {
            return []
        }

        const params: SlimePattern[] = []

        // 查找FormalParameterList
        const formalParameterListCst = cst.children.find(
            child => child.name === SlimeParser.prototype.FormalParameterList?.name
        )
        if (formalParameterListCst) {
            return SlimeCstToAstUtil.createFormalParameterListAst(formalParameterListCst)
        }

        // 查找Expression（可能是逗号表达式，�?(a, b) 或单个参�?(x)�?
        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        )
        if (expressionCst && expressionCst.children?.length) {
            // 直接�?Expression �?children 上遍�?AssignmentExpression 等候选参数节�?
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                const param = SlimeCstToAstUtil.convertCoverParameterCstToPattern(child, false)
                if (param) {
                    params.push(param)
                }
            }
        }

        // 检查是否有 rest 参数（Ellipsis + BindingIdentifier �?BindingPattern�?
        const hasEllipsis = cst.children.some(
            child => child.name === 'Ellipsis' || child.name === 'Ellipsis'
        )
        if (hasEllipsis) {
            // 首先查找 BindingIdentifier / BindingPattern 作为 rest 的目�?
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
                const restParam = SlimeCstToAstUtil.convertCoverParameterCstToPattern(restTarget, true)
                if (restParam) {
                    params.push(restParam)
                }
            }
        } else if (params.length === 0) {
            // 没有 Expression 也没�?rest，检查是否有单独�?BindingIdentifier
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            if (bindingIdentifierCst) {
                params.push(SlimeCstToAstUtil.createBindingIdentifierAst(bindingIdentifierCst))
            }
        }

        return params
    }

    /**
     * �?ArrowFormalParameters 提取参数
     */
    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // ArrowFormalParameters: ( UniqueFormalParameters )
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return SlimeCstToAstUtil.createUniqueFormalParametersAst(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return SlimeCstToAstUtil.createFormalParametersAst(child)
            }
        }

        return params
    }


    /**
     * �?ArrowFormalParameters 提取参数 (包装类型版本)
     */
    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // ArrowFormalParameters: ( UniqueFormalParameters )
        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
            }
        }

        return []
    }


    /**
     * 创建箭头函数参数 AST
     */
    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ArrowParameters?.name);

        // ArrowParameters 可以是多种形式，这里简化处�?
        if (cst.children.length === 0) {
            return []
        }

        const first = cst.children[0]

        // 单个参数：BindingIdentifier
        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            const param = SlimeCstToAstUtil.createBindingIdentifierAst(first)
            return [param]
        }

        // CoverParenthesizedExpressionAndArrowParameterList: 括号参数
        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return SlimeCstToAstUtil.createArrowParametersFromCoverGrammar(first)
        }

        // 参数列表�? FormalParameterList )
        if (first.name === SlimeJavascriptTokenConsumer.prototype.LParen?.name) {
            // 查找 FormalParameterList
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            )
            if (formalParameterListCst) {
                return SlimeCstToAstUtil.createFormalParameterListAst(formalParameterListCst)
            }
            return []
        }

        return []
    }


    /**
     * �?CoverCallExpressionAndAsyncArrowHead 提取 async 箭头函数参数
     */
    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        // CoverCallExpressionAndAsyncArrowHead 结构�?
        // [MemberExpression, Arguments] 或类似结�?
        // 我们需要从 Arguments 中提取参�?

        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'Arguments' || child.name === SlimeParser.prototype.Arguments?.name) {
                // �?Arguments 中提取参�?
                for (const argChild of child.children || []) {
                    if (argChild.name === 'ArgumentList' || argChild.name === SlimeParser.prototype.ArgumentList?.name) {
                        let hasEllipsis = false // 标记是否遇到�?...
                        for (const arg of argChild.children || []) {
                            if (arg.value === ',') continue // 跳过逗号
                            // 处理 rest 参数�?..ids
                            if (arg.name === 'Ellipsis' || arg.value === '...') {
                                hasEllipsis = true
                                continue
                            }
                            const param = SlimeCstToAstUtil.convertCoverParameterCstToPattern(arg, hasEllipsis)
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
     * AsyncArrowBindingIdentifier CST �?AST
     */
    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const bindingId = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        if (bindingId) {
            return SlimeCstToAstUtil.createBindingIdentifierAst(bindingId)
        }
        // 直接是标识符
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
        }
        throw new Error('AsyncArrowBindingIdentifier has no identifier')
    }


}


export const SlimeJavascriptArrowFunctionCstToAst = new SlimeJavascriptArrowFunctionCstToAstSingle()
