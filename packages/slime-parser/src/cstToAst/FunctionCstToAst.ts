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
    type SlimeAssignmentProperty, type SlimeArrayPattern, type SlimeArrayPatternElement,
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

}
