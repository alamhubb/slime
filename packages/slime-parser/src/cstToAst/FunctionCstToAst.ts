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
    type SlimeCallArgument, type SlimeSuper,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import {checkCstName} from "../SlimeCstToAstUtil.ts";

/**
 * 函数相关的 CST to AST 转换
 */
export class FunctionCstToAst {

    /**
     * AsyncMethod CST �?AST
     * AsyncMethod -> async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody }
     */
    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', false, true)
    }

    /**
     * AsyncFunctionBody CST �?AST（透传�?FunctionBody�?
     */
    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }

    /**
     * AsyncGeneratorMethod CST �?AST
     */
    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, true)
    }

    /**
     * AsyncGeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
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
            return this.createBindingIdentifierAst(bindingId)
        }
        // 直接是标识符
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createBindingIdentifierAst(firstChild)
        }
        throw new Error('AsyncArrowBindingIdentifier has no identifier')
    }

    /**
     * AsyncConciseBody CST �?AST
     */
    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return this.createConciseBodyAst(cst)
    }

    /**
     * AsyncArrowHead CST �?AST（透传�?
     */
    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        // AsyncArrowHead 主要用于解析，实�?AST 处理�?AsyncArrowFunction �?
        return cst.children?.[0] ? this.createAstFromCst(cst.children[0]) : null
    }

    /**
     * 创建箭头函数 AST
     */
    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);
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
            asyncToken = SlimeTokenCreate.createAsyncToken(cst.children[0].loc)
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
            arrowToken = SlimeTokenCreate.createArrowToken(arrowCst.loc)
        }

        // 解析参数 - 根据节点类型分别处理
        // SlimeFunctionParam 是包装类型，包含 param 和可选的 commaToken
        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            // 单个参数：x => x * 2
            params = [{ param: this.createBindingIdentifierAst(arrowParametersCst) }]
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            // 括号参数�?a, b) => a + b �?() => 42
            // 提取括号 tokens
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                }
            }
            // �?SlimePattern[] 转换�?SlimeFunctionParam[]
            const rawParams = this.createArrowParametersFromCoverGrammar(arrowParametersCst)
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
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                    }
                }
            }
            const rawParams = this.createArrowParametersAst(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i] // 为每个参数关联逗号 token（最后一个参数无逗号�?
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        // 解析函数�?
        const body = this.createConciseBodyAst(conciseBodyCst)

        // 注意：createArrowFunctionExpression 参数顺序�?(body, params, expression, async, loc, arrowToken, asyncToken, lParenToken, rParenToken)
        // commaTokens 目前函数签名不支持，暂时忽略
        return SlimeAstUtil.createArrowFunctionExpression(
            body, params, body.type !== SlimeNodeType.BlockStatement, isAsync, cst.loc,
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
        let body: SlimeExpression | SlimeBlockStatement
        let arrowIndex = -1
        let arrowToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        // 找到 Arrow token 的位�?
        for (let i = 0; i < cst.children.length; i++) {
            if (cst.children[i].name === 'Arrow' || cst.children[i].value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(cst.children[i].loc)
                arrowIndex = i
                break
            }
        }

        // 容错模式：如果找不到 Arrow token，尝试从不完整的 CST 中提取信�?
        if (arrowIndex === -1) {
            // 尝试�?CoverCallExpressionAndAsyncArrowHead 提取参数
            for (const child of cst.children) {
                if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                    params = this.createAsyncArrowParamsFromCover(child)
                    break
                } else if (child.name === 'Async') {
                    continue
                } else if (child.name === 'BindingIdentifier' || child.name === SlimeParser.prototype.BindingIdentifier?.name) {
                    params = [this.createBindingIdentifierAst(child)]
                    break
                }
            }
            // 返回不完整的箭头函数（没�?body�?
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

        // 解析参数（Arrow 之前的部分）
        for (let i = 0; i < arrowIndex; i++) {
            const child = cst.children[i]
            if (child.name === 'Async' || (child.name === 'IdentifierName' && child.value === 'async')) {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                continue // 跳过 async 关键�?
            }
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params = [this.createBindingIdentifierAst(child)]
            } else if (child.name === 'AsyncArrowBindingIdentifier' || child.name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) {
                // AsyncArrowBindingIdentifier 包含一�?BindingIdentifier
                const bindingId = child.children?.find((c: any) =>
                    c.name === 'BindingIdentifier' || c.name === SlimeParser.prototype.BindingIdentifier?.name
                ) || child.children?.[0]
                if (bindingId) {
                    params = [this.createBindingIdentifierAst(bindingId)]
                }
            } else if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                // �?CoverCallExpressionAndAsyncArrowHead 提取参数和括�?tokens
                params = this.createAsyncArrowParamsFromCover(child)
                // 提取括号 tokens
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
                params = this.createArrowFormalParametersAst(child)
                // 提取括号 tokens
                for (const subChild of child.children || []) {
                    if (subChild.name === 'LParen' || subChild.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(subChild.loc)
                    } else if (subChild.name === 'RParen' || subChild.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(subChild.loc)
                    }
                }
            }
        }

        // 解析函数体（Arrow 之后的部分）
        const bodyIndex = arrowIndex + 1
        if (bodyIndex < cst.children.length) {
            const bodyCst = cst.children[bodyIndex]
            if (bodyCst.name === 'AsyncConciseBody' || bodyCst.name === 'ConciseBody') {
                body = this.createConciseBodyAst(bodyCst)
            } else {
                body = this.createExpressionAst(bodyCst)
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
                            const param = this.convertCoverParameterCstToPattern(arg, hasEllipsis)
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
     * 将表达式 CST 转换�?Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     */
    /**
     * �?CST 表达式转换为 Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     * 注意：这个方法处�?CST 节点，convertExpressionToPattern 处理 AST 节点
     */
    convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数 options = {})
        // 这必须在 findInnerExpr 之前处理，否则会丢失 = 和默认�?
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            // 检查是否有 Assign token (=)
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                // 这是默认参数: left = right
                const expr = this.createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return this.convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        // 递归查找最内层的表达式
        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            // 如果�?ObjectLiteral、ArrayLiteral、Identifier 等，返回�?
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            // 否则递归向下
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            // �?ObjectLiteral 转换�?ObjectPattern
            return this.convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            // �?ArrayLiteral 转换�?ArrayPattern
            return this.convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            // 标识符直接转�?
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return this.createBindingIdentifierAst(inner)
        }

        // 尝试将表达式作为 AST 处理
        const expr = this.createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            // ObjectExpression 需要转换为 ObjectPattern
            return this.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            // ArrayExpression 需要转换为 ArrayPattern
            return this.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            // AssignmentExpression 转换�?AssignmentPattern
            return this.convertAssignmentExpressionToPattern(expr)
        }

        // 如果仍然无法转换，返�?null（不要返回原�?CST�?
        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换�?Pattern
     * 仅在“参数位置”调用，用于 Arrow / AsyncArrow 等场�?
     */
    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        // 1. 已经�?BindingIdentifier / BindingPattern 系列的，直接走绑定模式基础方法
        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = this.createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = this.createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = this.createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = this.createObjectBindingPatternAst(cst)
        }

        // 2. 其它情况（AssignmentExpression / ObjectLiteral / ArrayLiteral 等），使用通用�?CST→Pattern 逻辑
        if (!basePattern) {
            basePattern = this.convertCstToPattern(cst)
        }

        // 3. 兼容兜底：仍然无法转换时，尝试从表达式中提取第一�?Identifier
        if (!basePattern) {
            const identifierCst = this.findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = this.createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        // 4. 处理 rest 参数：根据调用方传入�?hasEllipsis 决定是否包装�?RestElement
        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }



    // ==================== 函数/类相关转换方�?====================

    /**
     * GeneratorMethod CST �?AST
     * GeneratorMethod -> * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
     */
    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, false)
    }

    /**
     * GeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }



    /**
     * �?ArrowFormalParameters 提取参数
     */
    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // ArrowFormalParameters: ( UniqueFormalParameters )
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return this.createUniqueFormalParametersAst(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return this.createFormalParametersAst(child)
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
                return this.createUniqueFormalParametersAstWrapped(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return this.createFormalParametersAstWrapped(child)
            }
        }

        return []
    }

    /**
     * 从CoverParenthesizedExpressionAndArrowParameterList提取箭头函数参数
     */
    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name);

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
            return this.createFormalParameterListAst(formalParameterListCst)
        }

        // 查找Expression（可能是逗号表达式，�?(a, b) 或单个参�?(x)�?
        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        )
        if (expressionCst && expressionCst.children?.length) {
            // 直接�?Expression �?children 上遍�?AssignmentExpression 等候选参数节�?
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                const param = this.convertCoverParameterCstToPattern(child, false)
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
                const restParam = this.convertCoverParameterCstToPattern(restTarget, true)
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
                params.push(this.createBindingIdentifierAst(bindingIdentifierCst))
            }
        }

        return params
    }

    /**
     * 从Expression中提取箭头函数参�?
     * 处理逗号表达�?(a, b) 或单个参�?(x)
     */
    extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        // Expression可能是：
        // 1. 单个Identifier: x
        // 2. 逗号表达�? a, b �?a, b, c
        // 3. 赋值表达式（默认参数）: a = 1

        // 检查是否是AssignmentExpression
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = this.createAssignmentExpressionAst(expressionCst)
            // 如果是简单的identifier，返回它
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any]
            }
            // 如果是赋值（默认参数），返回AssignmentPattern
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        // 如果是Expression，检查children
        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = []

            // 遍历children，查找所有AssignmentExpression（用逗号分隔�?
            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = this.createAssignmentExpressionAst(child)
                    // 转换为参�?
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        // 默认参数
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        // 对象解构参数�?{ a, b }) => ...
                        // 需要将 ObjectExpression 转换�?ObjectPattern
                        params.push(this.convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        // 数组解构参数�?[a, b]) => ...
                        // 需要将 ArrayExpression 转换�?ArrayPattern
                        params.push(this.convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        // 其他复杂情况，尝试提取identifier
                        const identifier = this.findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(this.createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        // 回退：尝试查找第一个identifier
        const identifierCst = this.findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [this.createIdentifierAst(identifierCst) as any]
        }

        return []
    }


    /**
     * 创建箭头函数参数 AST
     */
    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.ArrowParameters?.name);

        // ArrowParameters 可以是多种形式，这里简化处�?
        if (cst.children.length === 0) {
            return []
        }

        const first = cst.children[0]

        // 单个参数：BindingIdentifier
        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            const param = this.createBindingIdentifierAst(first)
            return [param]
        }

        // CoverParenthesizedExpressionAndArrowParameterList: 括号参数
        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return this.createArrowParametersFromCoverGrammar(first)
        }

        // 参数列表�? FormalParameterList )
        if (first.name === SlimeTokenConsumer.prototype.LParen?.name) {
            // 查找 FormalParameterList
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            )
            if (formalParameterListCst) {
                return this.createFormalParameterListAst(formalParameterListCst)
            }
            return []
        }

        return []
    }



    // ==================== 表达式相关转换方�?====================

    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST �?AST
     * 这是一�?cover grammar，根据上下文可能是括号表达式或箭头函数参�?
     */
    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        // 通常作为括号表达式处理，箭头函数参数有专门的处理路径
        return this.createParenthesizedExpressionAst(cst)
    }


    /**
     * ComputedPropertyName CST �?AST
     * ComputedPropertyName -> [ AssignmentExpression ]
     */
    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return this.createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }

    /**
     * CoverInitializedName CST �?AST
     * CoverInitializedName -> IdentifierReference Initializer
     */
    createCoverInitializedNameAst(cst: SubhutiCst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.IdentifierReference?.name ||
            ch.name === 'IdentifierReference'
        )
        const init = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name ||
            ch.name === 'Initializer'
        )

        const id = idRef ? this.createIdentifierReferenceAst(idRef) : null
        const initValue = init ? this.createInitializerAst(init) : null

        return {
            type: SlimeNodeType.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        }
    }

    /**
     * CoverCallExpressionAndAsyncArrowHead CST �?AST
     * 这是一�?cover grammar，通常作为 CallExpression 处理
     */
    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return this.createCallExpressionAst(cst)
    }

    /**
     * Create FormalParameters AST
     * ES2025 FormalParameters:
     *   [empty]
     *   FunctionRestParameter
     *   FormalParameterList
     *   FormalParameterList ,
     *   FormalParameterList , FunctionRestParameter
     */
    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name

            // Skip parentheses
            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameterList：包�?FormalParameter (多个以逗号分隔)
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                // 如果之前有参数没处理，先推入
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...this.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            // Direct FormalParameter（ES2025 结构�?
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            // Direct BindingElement or BindingIdentifier
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        // 处理最后一个参数（没有尾随逗号�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * �?ES2025 FormalParameterList 创建参数 AST（包装类型）
     * FormalParameterList: FormalParameter (, FormalParameter)*
     */
    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameter -> BindingElement
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
            }
        }

        // 处理最后一个参�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }


    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeRestElement {
        // FunctionRestParameter: ... BindingIdentifier | ... BindingPattern
        // 或�?FunctionRestParameter -> BindingRestElement
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = this.createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                // BindingRestElement 已经包含�?RestElement 的完整结构，直接返回
                return this.createBindingRestElementAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = this.createBindingPatternAst(child)
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
    createCatchParameterAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        // CatchParameter: BindingIdentifier | BindingPattern
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return this.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return this.createBindingPatternAst(first)
        }

        return null
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

    /**
     * 处理 FormalParameters CST 节点
     */
    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // FormalParameters 可能包含 FormalParameterList 或为�?
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            // FormalParameterList
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return this.createFormalParameterListAst(child)
            }

            // FormalParameter
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(this.createFormalParameterAst(child))
                continue
            }

            // BindingIdentifier - 直接作为参数
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(this.createBindingIdentifierAst(child))
                continue
            }

            // BindingElement
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(this.createBindingElementAst(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(this.createFunctionRestParameterAst(child))
                continue
            }

            // 跳过逗号和括�?
            if (child.value === ',' || child.value === '(' || child.value === ')') {
                continue
            }
        }

        return params
    }


    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.FunctionExpression?.name);
        // Es2025Parser FunctionExpression 结构

        let isAsync = false;
        let isGenerator = false;
        let functionId: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // Token fields
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

            // BindingIdentifier（命名函数表达式�?
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionId = this.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - 使用包装类型
            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = this.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody
            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const bodyStatements = this.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(bodyStatements, child.loc)
                continue
            }
        }

        // 空函数体
        if (!body!) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionExpression(
            body, functionId, params, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

}
