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
     * MultiplicativeOperator CST �?AST
     * MultiplicativeOperator -> * | / | %
     */
    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * AssignmentOperator CST �?AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    /**
     * ExpressionBody CST �?AST
     * ExpressionBody -> AssignmentExpression
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }

    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        const cached = this.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = this.createExpressionAstUncached(cst)
        this.expressionAstCache.set(cst, result)
        return result
    }

    createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        const astName = cst.name
        let left
        if (astName === SlimeParser.prototype.Expression?.name) {
            // Expression 可能是逗号表达�?(SequenceExpression)
            // 结构: Expression -> AssignmentExpression | Expression, AssignmentExpression
            // 收集所有表达式
            const expressions: SlimeExpression[] = []
            for (const child of cst.children || []) {
                if (child.name === 'Comma' || child.value === ',') {
                    // 跳过逗号 token
                    continue
                }
                expressions.push(this.createExpressionAst(child))
            }

            if (expressions.length === 1) {
                // 单个表达式，直接返回
                left = expressions[0]
            } else if (expressions.length > 1) {
                // 多个表达式，创建 SequenceExpression
                left = {
                    type: 'SequenceExpression',
                    expressions: expressions,
                    loc: cst.loc
                } as any
            } else {
                throw new Error('Expression has no children')
            }
        } else if (astName === SlimeParser.prototype.Statement?.name) {
            left = this.createStatementAst(cst)
        } else if (astName === SlimeParser.prototype.AssignmentExpression?.name) {
            left = this.createAssignmentExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ConditionalExpression?.name) {
            left = this.createConditionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalORExpression?.name) {
            left = this.createLogicalORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LogicalANDExpression?.name) {
            left = this.createLogicalANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseORExpression?.name) {
            left = this.createBitwiseORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseXORExpression?.name) {
            left = this.createBitwiseXORExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.BitwiseANDExpression?.name) {
            left = this.createBitwiseANDExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.EqualityExpression?.name) {
            left = this.createEqualityExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.RelationalExpression?.name) {
            left = this.createRelationalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ShiftExpression?.name) {
            left = this.createShiftExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AdditiveExpression?.name) {
            left = this.createAdditiveExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MultiplicativeExpression?.name) {
            left = this.createMultiplicativeExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UnaryExpression?.name) {
            left = this.createUnaryExpressionAst(cst)
        } else if (astName === 'PostfixExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.UpdateExpression?.name || astName === 'UpdateExpression') {
            left = this.createUpdateExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.LeftHandSideExpression?.name) {
            left = this.createLeftHandSideExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.CallExpression?.name) {
            left = this.createCallExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.NewExpression?.name) {
            left = this.createNewExpressionAst(cst)
        } else if (astName === 'NewMemberExpressionArguments') {
            left = this.createNewExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.MemberExpression?.name) {
            left = this.createMemberExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.PrimaryExpression?.name) {
            left = this.createPrimaryExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.YieldExpression?.name) {
            left = this.createYieldExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.AwaitExpression?.name) {
            left = this.createAwaitExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.SuperProperty?.name) {
            left = this.createSuperPropertyAst(cst)
        } else if (astName === SlimeParser.prototype.MetaProperty?.name) {
            left = this.createMetaPropertyAst(cst)
        } else if (astName === 'ShortCircuitExpression') {
            // ES2020: ShortCircuitExpression = LogicalORExpression | CoalesceExpression
            // ShortCircuitExpression: LogicalANDExpression ShortCircuitExpressionTail?
            left = this.createExpressionAst(cst.children[0])

            // 检查是否有 ShortCircuitExpressionTail (|| 运算�?
            if (cst.children.length > 1 && cst.children[1]) {
                const tailCst = cst.children[1]
                if (tailCst.name === 'ShortCircuitExpressionTail' ||
                    tailCst.name === 'LogicalORExpressionTail') {
                    // 处理尾部：可能是 LogicalORExpressionTail �?CoalesceExpressionTail
                    left = this.createShortCircuitExpressionTailAst(left, tailCst)
                }
            }
        } else if (astName === 'CoalesceExpression') {
            // ES2020: CoalesceExpression (处理 ?? 运算�?
            left = this.createCoalesceExpressionAst(cst)
        } else if (astName === 'ExponentiationExpression') {
            // ES2016: ExponentiationExpression (处理 ** 运算�?
            left = this.createExponentiationExpressionAst(cst)
        } else if (astName === 'CoverCallExpressionAndAsyncArrowHead') {
            // ES2017+: Cover grammar for CallExpression and async arrow function
            // In non-async-arrow context, this is a CallExpression
            left = this.createCallExpressionAst(cst)
        } else if (astName === 'OptionalExpression') {
            // ES2020: Optional chaining (?.)
            left = this.createOptionalExpressionAst(cst)
        } else if (astName === SlimeParser.prototype.ArrowFunction?.name || astName === 'ArrowFunction') {
            // 箭头函数
            left = this.createArrowFunctionAst(cst)
        } else if (astName === 'AsyncArrowFunction') {
            // Async 箭头函数
            left = this.createAsyncArrowFunctionAst(cst)
        } else if (astName === SlimeParser.prototype.ImportCall?.name || astName === 'ImportCall') {
            // ES2020: 动�?import()
            left = this.createImportCallAst(cst)
        } else if (astName === 'PrivateIdentifier') {
            // ES2022: PrivateIdentifier (e.g. #x in `#x in obj`)
            left = this.createPrivateIdentifierAst(cst)
        } else {
            throw new Error('Unsupported expression type: ' + cst.name)
        }
        return left
    }

    /**
     * 创建 OptionalExpression AST（ES2020�?
     * 处理可选链语法 ?.
     *
     * OptionalExpression:
     *   MemberExpression OptionalChain
     *   CallExpression OptionalChain
     *   OptionalExpression OptionalChain
     */
    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        // OptionalExpression 结构�?
        // children[0] = MemberExpression | CallExpression
        // children[1...n] = OptionalChain

        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式（MemberExpression �?CallExpression�?
        let result = this.createExpressionAst(cst.children[0])

        // 处理 OptionalChain（可能有多个链式调用�?
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = this.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     *
     * 注意：只有紧跟在 ?. 后面的操作是 optional: true
     * 链式的后续操作（�?foo?.().bar() 中的 .bar()）是 optional: false
     */
    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        // 追踪是否刚遇�??. token，下一个操作是 optional
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                // 遇到 ?. token，下一个操作是 optional
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                // ()调用 - 可能是可选调用或普通调�?
                const args = this.createArgumentsAst(child)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                // [expr] 计算属性访�?- 可能是可选或普�?
                // 下一个子节点是表达式，跳�?]
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = this.createExpressionAst(chainCst.children[exprIndex])
                    result = {
                        type: SlimeNodeType.OptionalMemberExpression,
                        object: result,
                        property: property,
                        computed: true,
                        optional: nextIsOptional,
                        loc: chainCst.loc
                    } as any
                    nextIsOptional = false
                }
            } else if (name === 'IdentifierName') {
                // .prop 属性访�?- 可能是可选或普�?
                let property: SlimeIdentifier
                // IdentifierName 内部包含一�?Identifier 或关键字 token
                const tokenCst = child.children[0]
                property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Dot' || child.value === '.') {
                // 普�?. token 不改�?optional 状�?
                continue
            } else if (name === 'RBracket' || child.value === ']') {
                // 跳过 ] token
                continue
            } else if (name === 'PrivateIdentifier') {
                // #prop - 私有属性访�?
                const property = this.createPrivateIdentifierAst(child)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Expression') {
                // 计算属性的表达式部分，已在 LBracket 处理中处�?
                continue
            }
        }

        return result
    }

    /**
     * 创建 CoalesceExpression AST（ES2020�?
     * 处理 ?? 空值合并运算符
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        // CoalesceExpression -> BitwiseORExpression ( ?? BitwiseORExpression )*
        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达�?
        let left = this.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const operator = cst.children[i]  // ?? token
            const right = this.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeNodeType.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
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
    // 以下方法需要后续实现
    // ============================================

    createBindingIdentifierAst(cst: SubhutiCst): SlimePattern {
        throw new Error('createBindingIdentifierAst not implemented');
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

    createIdentifierAst(cst: SubhutiCst): any {
        throw new Error('createIdentifierAst not implemented');
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
}

const SlimeCstToAstUtil = new SlimeCstToAst();

export default SlimeCstToAstUtil;
