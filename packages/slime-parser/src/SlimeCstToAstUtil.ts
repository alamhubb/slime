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
    type SlimeVariableDeclarator,
    type SlimeCallArgument,
    type SlimeSuper,
    SlimeNodeType,
    SlimeAstUtil,
    SlimeTokenCreate,
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
import { VariableCstToAst } from "./cstToAst/converters/declaration/VariableCstToAst";
import { OtherStatementCstToAst } from "./cstToAst/converters/statement/OtherStatementCstToAst";
import SlimeParser from "./SlimeParser";
import { SlimeAstUtils } from "./cstToAst/SlimeAstUtils";

// checkCstName 辅助函数（直接使用 SlimeAstUtils.checkCstName）
const checkCstName = SlimeAstUtils.checkCstName;

// 重新导出工具类
export { SlimeAstUtils } from "./cstToAst/SlimeAstUtils";

/**
 * CST 到 AST 转换器
 */
export class SlimeCstToAst {

    /**
     * 创建 with 语句 AST - 委托给 OtherStatementCstToAst
     */
    createWithStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createWithStatementAst(cst);
    }


    /**
     * 创建 debugger 语句 AST - 委托给 OtherStatementCstToAst
     */
    createDebuggerStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createDebuggerStatementAst(cst);
    }

    /**
     * 创建空语�?AST
     */
    createEmptyStatementAst(cst: SubhutiCst): any {
        // 兼容 EmptyStatement 和旧�?NotEmptySemicolon
        // checkCstName(cst, Es2025Parser.prototype.EmptyStatement?.name);

        let semicolonToken: any = undefined

        // EmptyStatement 可能直接�?Semicolon token
        if (cst.value === ';' || cst.name === SlimeTokenConsumer.prototype.Semicolon?.name) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(cst.loc)
        } else {
            // �?semicolon token
            const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';')
            if (semicolonCst) {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
            }
        }

        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }

    /**
     * 创建函数声明 AST
     * ES2025 FunctionDeclaration structure:
     * - function BindingIdentifier ( FormalParameters ) { FunctionBody }
     * Children: [FunctionTok, BindingIdentifier, LParen, FormalParameters, RParen, LBrace, FunctionBody, RBrace]
     */
    createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null
        let isAsync = false
        let isGenerator = false

        // Token fields
        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name
            const value = child.value || child.loc?.value

            // Collect tokens
            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
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

            // BindingIdentifier - function name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = this.createBindingIdentifierAst(child)
                continue
            }

            // FormalParameters - function parameters (使用包装类型)
            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = this.createFormalParametersAstWrapped(child)
                continue
            }

            // FunctionBody - function body
            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = this.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
                continue
            }
        }

        // Create default empty body if not found
        if (!body) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
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

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        // Support both CallExpression and CoverCallExpressionAndAsyncArrowHead
        const isCallExpr = cst.name === SlimeParser.prototype.CallExpression?.name || cst.name === 'CallExpression'
        const isCoverExpr = cst.name === 'CoverCallExpressionAndAsyncArrowHead'

        if (!isCallExpr && !isCoverExpr) {
            throw new Error(`createCallExpressionAst: Expected CallExpression or CoverCallExpressionAndAsyncArrowHead, got ${cst.name}`)
        }

        if (cst.children.length === 1) {
            // 单个子节点，可能是SuperCall
            const first = cst.children[0]
            if (first.name === SlimeParser.prototype.SuperCall?.name) {
                return this.createSuperCallAst(first)
            }
            return this.createExpressionAst(first)
        }

        // 多个children：MemberExpression + Arguments + 可选的链式调用
        // children[0]: MemberExpression �?CoverCallExpressionAndAsyncArrowHead
        // children[1]: Arguments (第一次调�?
        // children[2+]: Dot/Identifier/Arguments（链式调用）

        let current: SlimeExpression
        const firstChild = cst.children[0]

        // 处理第一个子节点
        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            // CoverCallExpressionAndAsyncArrowHead 结构: [MemberExpression, Arguments]
            // 递归处理�?
            current = this.createCallExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = this.createMemberExpressionAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = this.createSuperCallAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = this.createImportCallAst(firstChild)
        } else {
            // 尝试作为表达式处�?
            current = this.createExpressionAst(firstChild)
        }

        // 循环处理所有后续children
        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                // () - 函数调用
                const args = this.createArgumentsAst(child)
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression

            } else if (child.name === 'DotMemberExpression') {
                // DotMemberExpression包含Dot和IdentifierName (旧版兼容)
                const dotChild = child.children[0]  // Dot token
                const identifierNameCst = child.children[1]  // IdentifierName
                const tokenCst = identifierNameCst.children[0]  // 实际的token（Identifier或关键字�?
                const property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                const dotOp = SlimeTokenCreate.createDotToken(dotChild.loc)
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'Dot') {
                // Es2025Parser产生的是直接�?Dot token + IdentifierName
                const dotOp = SlimeTokenCreate.createDotToken(child.loc)

                // 下一个child应该是IdentifierName或PrivateIdentifier
                const nextChild = cst.children[i + 1]
                let property: SlimeIdentifier | null = null
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children[0]
                        property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                        i++ // 跳过已处理的IdentifierName
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = SlimeAstUtil.createIdentifier(nextChild.value, nextChild.loc)
                        i++ // 跳过已处理的PrivateIdentifier
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property)

            } else if (child.name === 'BracketExpression') {
                // [expr] - computed property (旧版兼容)
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
                const expressionChild = cst.children[i + 1]
                if (expressionChild && expressionChild.name !== 'RBracket') {
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
                // 跳过RBracket
                continue
            }
        }

        return current
    }

    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.SuperCall?.name);
        // SuperCall -> SuperTok + Arguments
        // children[0]: SuperTok token
        // children[1]: Arguments CST
        const argumentsCst = cst.children[1]
        const argumentsAst: SlimeCallArgument[] = this.createArgumentsAst(argumentsCst)

        // 创建Super节点作为callee
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children[0].loc
        }

        return SlimeAstUtil.createCallExpression(superNode, argumentsAst) as SlimeExpression
    }


    /**
     * 创建 ImportCall AST - 委托给 MemberCallCstToAst
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createImportCallAst(cst);
    }


    /**
     * 创建 SuperProperty AST - 委托给 MemberCallCstToAst
     */
    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createSuperPropertyAst(cst);
    }


    /**
     * 创建 MetaProperty AST - 委托给 MemberCallCstToAst
     */
    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMetaPropertyAst(cst);
    }


    /**
     * 创建 Arguments AST - 委托给 MemberCallCstToAst
     */
    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentsAstFull(cst);
    }


    /**
     * 创建 ArgumentList AST - 委托给 MemberCallCstToAst
     */
    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentListAst(cst);
    }


    /**
     * 创建 MemberExpression 的第一个元素 - 委托给 MemberCallCstToAst
     */
    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        return MemberCallCstToAst.createMemberExpressionFirstOr(cst);
    }


    /**
     * 创建 NewExpression AST - 委托给 MemberCallCstToAst
     */
    createNewExpressionAst(cst: SubhutiCst): any {
        return MemberCallCstToAst.createNewExpressionAst(cst);
    }


    /**
     * 创建 MemberExpression AST - 委托给 MemberCallCstToAst
     */
    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMemberExpressionAst(cst);
    }

    /**
     * 创建 VariableDeclarator AST - 委托给 VariableCstToAst
     */
    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorAst(cst);
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
        return ExpressionCstToAst.createExpressionBodyAst(cst);
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
}

const SlimeCstToAstUtil = new SlimeCstToAst();

export default SlimeCstToAstUtil;
