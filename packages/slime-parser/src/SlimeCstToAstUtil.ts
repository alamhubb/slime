/**
 *
 * 包含 JavaScript ES2025 的基础实现。
 * 再此基础上扩展typescript，优先扩展不要新建方法
 * 
 */
import {
    type SlimeAssignmentExpression,
    SlimeBlockStatement,
    SlimeCallExpression,
    SlimeClassBody,
    SlimeClassDeclaration,
    SlimeConditionalExpression,
    SlimeDeclaration,
    SlimeExportDefaultDeclaration,
    SlimeExportNamedDeclaration,
    SlimeExpression,
    SlimeExpressionStatement,
    SlimeFunctionExpression,
    SlimeIdentifier,
    SlimeLiteral,
    SlimeModuleDeclaration,
    SlimePattern,
    SlimeProgram,
    SlimeStatement,
    SlimeStringLiteral,
    SlimeVariableDeclaration,
    SlimeVariableDeclarator,
    SlimeReturnStatement,
    SlimeSpreadElement,
    SlimeMethodDefinition,
    SlimeRestElement,
    SlimeMemberExpression,
    SlimeImportDeclaration,
    SlimeImportSpecifier,
    SlimeClassExpression,
    SlimeArrayPattern,
    SlimeObjectPattern,
    SlimeAssignmentProperty,
    // Wrapper types for comma token association
    type SlimeArrayElement,
    SlimeObjectPropertyItem,
    SlimeFunctionParam,
    SlimeCallArgument,
    SlimeArrayPatternElement,
    SlimeObjectPatternProperty,
    SlimeImportSpecifierItem,
    SlimeExportSpecifierItem,
    SlimeFunctionDeclaration,
    SlimeImportDefaultSpecifier,
    SlimeImportNamespaceSpecifier,
    // Additional needed types
    type SlimeObjectExpression,
    SlimeProperty,
    SlimeNumericLiteral,
    SlimeArrayExpression,
    SlimeArrowFunctionExpression,
    SlimeDotToken,
    SlimeAssignToken,
    SlimeLBracketToken,
    SlimeRBracketToken,
    SlimeCommaToken,
    SlimeLBraceToken,
    SlimeRBraceToken,
    SlimeSuper,
    SlimeThisExpression,
    SlimePropertyDefinition,
    SlimeMaybeNamedFunctionDeclaration,
    SlimeMaybeNamedClassDeclaration,
    SlimeExportAllDeclaration,
    SlimeExportSpecifier,
} from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import SlimeParser from "./SlimeParser.ts";
import {  SlimeTokenCreateUtils, SlimeAstTypeName } from "slime-ast";
import {
    SlimeArrowFunctionCstToAst,
    SlimeAssignmentPatternCstToAst,
    SlimeBinaryExpressionCstToAst,
    SlimeBindingPatternCstToAst,
    SlimeBlockCstToAst,
    SlimeCompoundLiteralCstToAst,
    SlimeControlFlowCstToAst,
    SlimeExpressionCstToAst,
    SlimeExportCstToAst,
    SlimeFunctionBodyCstToAst,
    SlimeFunctionDeclarationCstToAst,
    SlimeFunctionExpressionCstToAst,
    SlimeFunctionParameterCstToAst,
    SlimeIdentifierCstToAst,
    SlimeImportCstToAst,
    SlimeLiteralCstToAst,
    SlimeMemberCallCstToAst,
    SlimeMethodDefinitionCstToAst,
    SlimeModuleCstToAst,
    SlimeOptionalExpressionCstToAst,
    SlimeOtherStatementCstToAst,
    SlimePatternConvertCstToAst,
    SlimePrimaryExpressionCstToAst,
    SlimeUnaryExpressionCstToAst,
    SlimeVariableCstToAst,
    SlimeClassDeclarationCstToAst,
} from "./cstToAst";

// 函数调用表达式转换
import { SlimeCallExpressionCstToAst } from "./cstToAst/expressions/SlimeCallExpressionCstToAst.ts";

// TypeScript 类型转换
import { SlimeTSTypeAnnotationCstToAst } from "./cstToAst/typescript/SlimeTSTypeAnnotationCstToAst.ts";
import { SlimeTSCompositeTypeCstToAst } from "./cstToAst/typescript/SlimeTSCompositeTypeCstToAst.ts";
import { SlimeTSFunctionTypeCstToAst } from "./cstToAst/typescript/SlimeTSFunctionTypeCstToAst.ts";
import { SlimeTSKeywordTypeCstToAst } from "./cstToAst/typescript/SlimeTSKeywordTypeCstToAst.ts";
import { SlimeTSPrimaryTypeCstToAst } from "./cstToAst/typescript/SlimeTSPrimaryTypeCstToAst.ts";
import { SlimeTSTypeLiteralCstToAst } from "./cstToAst/typescript/SlimeTSTypeLiteralCstToAst.ts";
import { SlimeTSDeclarationCstToAst } from "./cstToAst/typescript/SlimeTSDeclarationCstToAst.ts";
import { SlimeTSExpressionCstToAst } from "./cstToAst/typescript/SlimeTSExpressionCstToAst.ts";



// ============================================
// Unicode 转义序列解码
// ES2025 规范 12.9.4 - \uXXXX \u{XXXXX} 转换为实际字符
// 参考实现：Babel、Acorn、TypeScript
// ============================================

/**
 * CST 到 AST 转换器
 *
 * ## 两层架构设计
 *
 * ### 第一层：AST 工厂类 (SlimeAstCreateUtils.ts / SlimeCreateUtils)
 * - 与 ESTree AST 节点类型一一对应的纯粹创建方法
 * - 不依赖 CST 结构，只接收参数创建节点
 * - 示例：createIdentifier(name, loc) -> SlimeIdentifier
 *
 * ### 第二层：CST 转换器 (本类)
 * - 与 CST 规则一一对应的转换方法 (createXxxAst)
 * - 解析 CST 结构，提取信息，调用 AST 工厂类
 * - 中心转发方法：createAstFromCst(cst) - 自动根据类型分发
 *
 * ## 方法命名规范
 *
 * | 方法类型 | 命名模式 | 说明 |
 * |----------|----------|------|
 * | CST 规则转换 | createXxxAst | 与 @SubhutiRule 规则一一对应 |
 * | AST 类型映射 | createXxxAst | CST 规则名与 AST 类型名不一致时使用 |
 * | 内部辅助方法 | createXxxAst | ES2025 专用处理等 |
 * | 工具方法 | convertXxx / isXxx | 表达式转模式、检查方法等 |
 *
 * ## 方法命名规范
 *
 * 所有 CST 转换方法命名为 createXxxAst，其中 Xxx 与 CST 规则名一致。
 * 内部调用 SlimeNodeCreate / SlimeCreateUtils 中与 AST 类型名一致的工厂方法。
 *
 * 例如：
 * - createArrayLiteralAst (CST 规则名) -> 内部调用 createArrayExpression (AST 类型名)
 * - createObjectLiteralAst (CST 规则名) -> 内部调用 createObjectExpression (AST 类型名)
 * - createCatchAst (CST 规则名) -> 内部调用 createCatchClause (AST 类型名)
 *
 * ## 核心分发方法
 * - createAstFromCst: 中心转发，根据 CST 类型显式分发到对应方法
 * - createStatementDeclarationAst: 语句/声明分发
 *
 * ## 辅助处理方法
 * - toProgram: Program 入口处理
 */
export class SlimeCstToAst {

    /**
     * 将 Unicode 转义序列解码为实际字符
     * 支持 \uXXXX 和 \u{XXXXX} 格式
     *
     * @param str 可能包含 Unicode 转义的字符串
     * @returns 解码后的字符串
     */
    decodeUnicodeEscapes(str: string | undefined): string {
        // 如果为空或不包含转义序列，直接返回（性能优化�?
        if (!str || !str.includes('\\u')) {
            return str || ''
        }

        return str.replace(/\\u\{([0-9a-fA-F]+)\}|\\u([0-9a-fA-F]{4})/g,
            (match, braceCode, fourDigitCode) => {
                const codePoint = parseInt(braceCode || fourDigitCode, 16)
                return String.fromCodePoint(codePoint)
            }
        )
    }

    /**
     * 检查 CST 节点名称是否匹配
     */
    checkCstName(cst: SubhutiCst, cstName: string) {
        if (cst.name !== cstName) {
            throw new Error(cst.name)
        }
        return cstName
    }

    readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>()

    // === identifier / IdentifierCstToAst ===

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createIdentifierNameAst(cst)
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createPrivateIdentifierAst(cst)
    }

    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createLabelIdentifierAst(cst)
    }

    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createIdentifierReferenceAst(cst)
    }

    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeIdentifierCstToAst.createIdentifierAst(cst)
    }

    // === literal / LiteralCstToAst ===

    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return SlimeLiteralCstToAst.createBooleanLiteralAst(cst)
    }

    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        return SlimeLiteralCstToAst.createNumericLiteralAst(cst)
    }

    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        return SlimeLiteralCstToAst.createStringLiteralAst(cst)
    }

    createRegExpLiteralAst(cst: SubhutiCst): any {
        return SlimeLiteralCstToAst.createRegExpLiteralAst(cst)
    }

    createLiteralFromToken(token: any): SlimeExpression {
        return SlimeLiteralCstToAst.createLiteralFromToken(token)
    }

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return SlimeLiteralCstToAst.createLiteralAst(cst)
    }

    createElisionAst(cst: SubhutiCst): number {
        return SlimeLiteralCstToAst.createElisionAst(cst)
    }

    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return SlimeLiteralCstToAst.processTemplateMiddleList(cst, quasis, expressions)
    }

    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return SlimeLiteralCstToAst.processTemplateSpans(cst, quasis, expressions)
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        return SlimeLiteralCstToAst.createTemplateLiteralAst(cst)
    }

    // === literal / CompoundLiteralCstToAst ===

    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return SlimeCompoundLiteralCstToAst.createPropertyNameAst(cst)
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return SlimeCompoundLiteralCstToAst.createLiteralPropertyNameAst(cst)
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return SlimeCompoundLiteralCstToAst.createSpreadElementAst(cst)
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return SlimeCompoundLiteralCstToAst.createElementListAst(cst)
    }

    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        return SlimeCompoundLiteralCstToAst.createArrayLiteralAst(cst)
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        return SlimeCompoundLiteralCstToAst.createObjectLiteralAst(cst)
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return SlimeCompoundLiteralCstToAst.createPropertyDefinitionAst(cst)
    }

    // === pattern / BindingPatternCstToAst ===

    createBindingElementAst(cst: SubhutiCst): any {
        return SlimeBindingPatternCstToAst.createBindingElementAst(cst)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        return SlimeBindingPatternCstToAst.createSingleNameBindingAst(cst)
    }

    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        return SlimeBindingPatternCstToAst.createBindingRestPropertyAst(cst)
    }

    createBindingPropertyAst(cst: SubhutiCst): any {
        return SlimeBindingPatternCstToAst.createBindingPropertyAst(cst)
    }

    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return SlimeBindingPatternCstToAst.createBindingPropertyListAst(cst)
    }

    createBindingElementListAst(cst: SubhutiCst): any[] {
        return SlimeBindingPatternCstToAst.createBindingElementListAst(cst)
    }

    createBindingElisionElementAst(cst: SubhutiCst): any {
        return SlimeBindingPatternCstToAst.createBindingElisionElementAst(cst)
    }

    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        return SlimeBindingPatternCstToAst.createBindingPatternAst(cst)
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return SlimeBindingPatternCstToAst.createArrayBindingPatternAst(cst)
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return SlimeBindingPatternCstToAst.createObjectBindingPatternAst(cst)
    }

    // === pattern / AssignmentPatternCstToAst ===

    createAssignmentPatternAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentPatternAst(cst)
    }

    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return SlimeAssignmentPatternCstToAst.createObjectAssignmentPatternAst(cst)
    }

    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return SlimeAssignmentPatternCstToAst.createArrayAssignmentPatternAst(cst)
    }

    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        return SlimeAssignmentPatternCstToAst.createAssignmentPropertyListAst(cst)
    }

    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentPropertyAst(cst)
    }

    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeAssignmentPatternCstToAst.createAssignmentElementListAst(cst)
    }

    createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentElementAst(cst)
    }

    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentElisionElementAst(cst)
    }

    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentRestElementAst(cst)
    }

    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeAssignmentPatternCstToAst.createAssignmentRestPropertyAst(cst)
    }

    // === pattern / PatternConvertCstToAst ===

    convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        return SlimePatternConvertCstToAst.convertArrayExpressionToPattern(expr)
    }

    convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        return SlimePatternConvertCstToAst.convertCstToPattern(cst)
    }

    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        return SlimePatternConvertCstToAst.convertCoverParameterCstToPattern(cst, hasEllipsis)
    }

    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        return SlimePatternConvertCstToAst.convertObjectLiteralToPattern(cst)
    }

    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        return SlimePatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(cst)
    }

    convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        return SlimePatternConvertCstToAst.convertObjectExpressionToPattern(expr)
    }

    convertAssignmentExpressionToPattern(expr: any): any {
        return SlimePatternConvertCstToAst.convertAssignmentExpressionToPattern(expr)
    }

    convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        return SlimePatternConvertCstToAst.convertExpressionToPatternFromAST(expr)
    }

    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        return SlimePatternConvertCstToAst.convertArrayLiteralToPattern(cst)
    }

    convertExpressionToPattern(expr: any): SlimePattern {
        return SlimePatternConvertCstToAst.convertExpressionToPattern(expr)
    }

    // === expression / ExpressionCstToAst ===

    createYieldExpressionAst(cst: SubhutiCst): any {
        return SlimeUnaryExpressionCstToAst.createYieldExpressionAst(cst)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return SlimeUnaryExpressionCstToAst.createAwaitExpressionAst(cst)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createConditionalExpressionAst(cst)
    }

    // === expression / PrimaryExpressionCstToAst ===

    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCompoundLiteralCstToAst.createComputedPropertyNameAst(cst)
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimePrimaryExpressionCstToAst.createPrimaryExpressionAst(cst)
    }

    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimePrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst)
    }

    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return SlimePrimaryExpressionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
    }

    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return SlimeCompoundLiteralCstToAst.createCoverInitializedNameAst(cst)
    }

    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createLeftHandSideExpressionAst(cst)
    }

    // === expression / AssignmentExpressionCstToAst ===

    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createExpressionBodyAst(cst)
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createAssignmentExpressionAst(cst)
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
        return SlimeExpressionCstToAst.createExpressionAstUncached(cst)
    }

    // === expression / BinaryExpressionCstToAst ===

    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return SlimeBinaryExpressionCstToAst.createMultiplicativeOperatorAst(cst)
    }

    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return SlimeExpressionCstToAst.createAssignmentOperatorAst(cst)
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createExponentiationExpressionAst(cst)
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createLogicalORExpressionAst(cst)
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createLogicalANDExpressionAst(cst)
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createBitwiseORExpressionAst(cst)
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst)
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst)
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createEqualityExpressionAst(cst)
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createRelationalExpressionAst(cst)
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createShiftExpressionAst(cst)
    }

    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createCoalesceExpressionAst(cst)
    }

    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
    }

    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createShortCircuitExpressionAst(cst)
    }

    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        return SlimeExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
    }

    // === expression / UnaryExpressionCstToAst ===

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeUnaryExpressionCstToAst.createUnaryExpressionAst(cst)
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeUnaryExpressionCstToAst.createUpdateExpressionAst(cst)
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createAdditiveExpressionAst(cst)
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeBinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst)
    }

    // === expression / MemberCallCstToAst ===

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        return SlimeMemberCallCstToAst.createMemberExpressionFirstOr(cst)
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createMemberExpressionAst(cst)
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return SlimeCallExpressionCstToAst.createArgumentsAst(cst)
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return SlimeCallExpressionCstToAst.createArgumentListAst(cst)
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCallExpressionCstToAst.createCallExpressionAst(cst)
    }

    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createCallMemberExpressionAst(cst)
    }

    createNewExpressionAst(cst: SubhutiCst): any {
        return SlimeCallExpressionCstToAst.createNewExpressionAst(cst)
    }

    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCallExpressionCstToAst.createSuperCallAst(cst)
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createSuperPropertyAst(cst)
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        return SlimeMemberCallCstToAst.createMetaPropertyAst(cst)
    }

    // === expression / OptionalExpressionCstToAst ===

    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        return SlimeOptionalExpressionCstToAst.createOptionalChainAst(object, chainCst)
    }

    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeOptionalExpressionCstToAst.createOptionalExpressionAst(cst)
    }

    // === function / ArrowFunctionCstToAst ===

    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return SlimeFunctionBodyCstToAst.createAsyncConciseBodyAst(cst)
    }

    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return SlimeArrowFunctionCstToAst.createAsyncArrowHeadAst(cst)
    }

    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeArrowFunctionCstToAst.createAsyncArrowBindingIdentifierAst(cst)
    }

    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        return SlimePrimaryExpressionCstToAst.findFirstIdentifierInExpression(cst)
    }

    extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        return SlimeFunctionParameterCstToAst.extractParametersFromExpression(expressionCst)
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        return SlimeArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(cst)
    }

    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeArrowFunctionCstToAst.createArrowFormalParametersAst(cst)
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeArrowFunctionCstToAst.createArrowFormalParametersAstWrapped(cst)
    }

    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeArrowFunctionCstToAst.createArrowParametersAst(cst)
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return SlimeArrowFunctionCstToAst.createArrowFunctionAst(cst)
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return SlimeArrowFunctionCstToAst.createAsyncArrowFunctionAst(cst)
    }

    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        return SlimeArrowFunctionCstToAst.createAsyncArrowParamsFromCover(cst)
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return SlimeFunctionBodyCstToAst.createConciseBodyAst(cst)
    }

    // === function / FunctionExpressionCstToAst ===

    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return SlimeFunctionExpressionCstToAst.createFunctionExpressionAst(cst)
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return SlimeFunctionExpressionCstToAst.createGeneratorExpressionAst(cst)
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return SlimeFunctionExpressionCstToAst.createAsyncFunctionExpressionAst(cst)
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return SlimeFunctionExpressionCstToAst.createAsyncGeneratorExpressionAst(cst)
    }

    // === function / FunctionParameterCstToAst ===

    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        return SlimePatternConvertCstToAst.createBindingRestElementAst(cst)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        return SlimeFunctionParameterCstToAst.createFunctionRestParameterAst(cst)
    }

    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeRestElement {
        return SlimeFunctionParameterCstToAst.createFunctionRestParameterAstAlt(cst)
    }

    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        return SlimeFunctionParameterCstToAst.createFormalParameterAst(cst)
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeFunctionParameterCstToAst.createFormalParameterListAst(cst)
    }

    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeFunctionParameterCstToAst.createFormalParameterListAstWrapped(cst)
    }

    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeFunctionParameterCstToAst.createFormalParametersAst(cst)
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeFunctionParameterCstToAst.createFormalParametersAstWrapped(cst)
    }

    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeFunctionParameterCstToAst.createFormalParameterListFromEs2025Wrapped(cst)
    }

    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeFunctionParameterCstToAst.createUniqueFormalParametersAst(cst)
    }

    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeFunctionParameterCstToAst.createUniqueFormalParametersAstWrapped(cst)
    }

    // === declaration / FunctionDeclarationCstToAst ===

    createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return SlimeFunctionDeclarationCstToAst.createFunctionDeclarationAst(cst)
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return SlimeFunctionDeclarationCstToAst.createGeneratorDeclarationAst(cst)
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return SlimeFunctionDeclarationCstToAst.createAsyncFunctionDeclarationAst(cst)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return SlimeFunctionDeclarationCstToAst.createAsyncGeneratorDeclarationAst(cst)
    }

    // === declaration / VariableCstToAst ===

    createLetOrConstAst(cst: SubhutiCst): string {
        return SlimeVariableCstToAst.createLetOrConstAst(cst)
    }

    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeVariableDeclaration {
        return SlimeVariableCstToAst.createVariableDeclarationFromList(cst, kind)
    }

    createForBindingAst(cst: SubhutiCst): any {
        return SlimeVariableCstToAst.createForBindingAst(cst)
    }

    createForDeclarationAst(cst: SubhutiCst): any {
        return SlimeVariableCstToAst.createForDeclarationAst(cst)
    }

    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        return SlimeVariableCstToAst.createInitializerAst(cst)
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return SlimeVariableCstToAst.createVariableDeclaratorAst(cst)
    }

    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        return SlimeVariableCstToAst.createVariableDeclaratorFromVarDeclaration(cst)
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        return SlimeVariableCstToAst.createVariableDeclarationListAst(cst)
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return SlimeVariableCstToAst.createLexicalBindingAst(cst)
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return SlimeVariableCstToAst.createLexicalDeclarationAst(cst)
    }

    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return SlimeVariableCstToAst.createVariableDeclarationAst(cst)
    }

    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return SlimeVariableCstToAst.createVariableStatementAst(cst)
    }

    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return SlimeVariableCstToAst.createDeclarationAst(cst)
    }

    createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return SlimeVariableCstToAst.createHoistableDeclarationAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===

    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return SlimeClassDeclarationCstToAst.createClassElementNameAst(cst)
    }

    isComputedPropertyName(cst: SubhutiCst): boolean {
        return SlimeClassDeclarationCstToAst.isComputedPropertyName(cst)
    }

    isStaticModifier(cst: SubhutiCst | null): boolean {
        return SlimeClassDeclarationCstToAst.isStaticModifier(cst)
    }

    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        return SlimeClassDeclarationCstToAst.createClassDeclarationAst(cst)
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        return SlimeClassDeclarationCstToAst.createClassTailAst(cst)
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        return SlimeClassDeclarationCstToAst.createClassHeritageAst(cst)
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        return SlimeClassDeclarationCstToAst.createClassHeritageAstWithToken(cst)
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        return SlimeClassDeclarationCstToAst.createFieldDefinitionAst(staticCst, cst)
    }

    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        return SlimeClassDeclarationCstToAst.createClassBodyAst(cst)
    }

    createClassStaticBlockAst(cst: SubhutiCst): any {
        return SlimeClassDeclarationCstToAst.createClassStaticBlockAst(cst)
    }

    createClassElementAst(cst: SubhutiCst): any {
        return SlimeClassDeclarationCstToAst.createClassElementAst(cst)
    }

    createClassElementListAst(cst: SubhutiCst): any[] {
        return SlimeClassDeclarationCstToAst.createClassElementListAst(cst)
    }

    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeClassDeclarationCstToAst.createClassStaticBlockBodyAst(cst)
    }

    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeClassDeclarationCstToAst.createClassStaticBlockStatementListAst(cst)
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        return SlimeClassDeclarationCstToAst.createClassExpressionAst(cst)
    }

    // === class / MethodDefinitionCstToAst ===

    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return SlimeMethodDefinitionCstToAst.createPropertySetParameterListAst(cst)
    }

    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return SlimeMethodDefinitionCstToAst.createPropertySetParameterListAstWrapped(cst)
    }

    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionAstInternal(cst, kind, generator, async)
    }

    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createGeneratorMethodAst(cst)
    }

    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createAsyncMethodAst(cst)
    }

    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createAsyncGeneratorMethodAst(cst)
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, cst)
    }

    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return SlimeMethodDefinitionCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
    }

    // === statement / BlockCstToAst ===

    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        return SlimeBlockCstToAst.createBlockAst(cst)
    }

    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        return SlimeBlockCstToAst.createBlockStatementAst(cst)
    }

    createStatementDeclarationAst(cst: SubhutiCst): any {
        return SlimeBlockCstToAst.createStatementDeclarationAst(cst)
    }

    createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeBlockCstToAst.createStatementAst(cst)
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeBlockCstToAst.createStatementListItemAst(cst)
    }

    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeBlockCstToAst.createStatementListAst(cst)
    }

    // === statement / ControlFlowCstToAst ===

    createBreakableStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createBreakableStatementAst(cst)
    }

    createIterationStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createIterationStatementAst(cst)
    }

    createIfStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createIfStatementAst(cst)
    }

    createIfStatementBodyAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createIfStatementBodyAst(cst)
    }

    createForStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createForStatementAst(cst)
    }

    createForInOfStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createForInOfStatementAst(cst)
    }

    createWhileStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createWhileStatementAst(cst)
    }

    createDoWhileStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createDoWhileStatementAst(cst)
    }

    createSwitchStatementAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createSwitchStatementAst(cst)
    }

    // === statement / FunctionBodyCstToAst ===

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeFunctionBodyCstToAst.createFunctionStatementListAst(cst)
    }

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeFunctionBodyCstToAst.createFunctionBodyAst(cst)
    }

    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeFunctionBodyCstToAst.createGeneratorBodyAst(cst)
    }

    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeFunctionBodyCstToAst.createAsyncFunctionBodyAst(cst)
    }

    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return SlimeFunctionBodyCstToAst.createAsyncGeneratorBodyAst(cst)
    }

    // === statement / OtherStatementCstToAst ===

    createSemicolonASIAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createSemicolonASIAst(cst)
    }

    createEmptyStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createEmptyStatementAst(cst)
    }

    createThrowStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createThrowStatementAst(cst)
    }

    createBreakStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createBreakStatementAst(cst)
    }

    createContinueStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createContinueStatementAst(cst)
    }

    createTryStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createTryStatementAst(cst)
    }

    createFinallyAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createFinallyAst(cst)
    }

    createCatchAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createCatchAst(cst)
    }

    createCatchParameterAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createCatchParameterAst(cst)
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        return SlimeOtherStatementCstToAst.createReturnStatementAst(cst)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        return SlimeOtherStatementCstToAst.createExpressionStatementAst(cst)
    }

    createLabelledStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createLabelledStatementAst(cst)
    }

    createWithStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createWithStatementAst(cst)
    }

    createDebuggerStatementAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createDebuggerStatementAst(cst)
    }

    createLabelledItemAst(cst: SubhutiCst): any {
        return SlimeOtherStatementCstToAst.createLabelledItemAst(cst)
    }

    // === statement / SwitchCstToAst ===

    createCaseClauseAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createCaseClauseAst(cst)
    }

    createDefaultClauseAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createDefaultClauseAst(cst)
    }

    createCaseClausesAst(cst: SubhutiCst): any[] {
        return SlimeControlFlowCstToAst.createCaseClausesAst(cst)
    }

    createCaseBlockAst(cst: SubhutiCst): any[] {
        return SlimeControlFlowCstToAst.createCaseBlockAst(cst)
    }

    createSwitchCaseAst(cst: SubhutiCst): any {
        return SlimeControlFlowCstToAst.createSwitchCaseAst(cst)
    }

    extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        return SlimeControlFlowCstToAst.extractCasesFromCaseBlock(caseBlockCst)
    }

    // === module / ExportCstToAst ===

    createExportFromClauseAst(cst: SubhutiCst): any {
        return SlimeExportCstToAst.createExportFromClauseAst(cst)
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        return SlimeExportCstToAst.createExportDeclarationAst(cst)
    }

    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return SlimeExportCstToAst.createNamedExportsAst(cst)
    }

    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return SlimeExportCstToAst.createExportsListAst(cst)
    }

    createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        return SlimeExportCstToAst.createExportSpecifierAst(cst)
    }

    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return SlimeExportCstToAst.createModuleExportNameAst(cst)
    }

    // === module / ImportCstToAst ===

    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        return SlimeImportCstToAst.createImportCallAst(cst)
    }

    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        return SlimeImportCstToAst.createNameSpaceImportAst(cst)
    }

    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return SlimeImportCstToAst.createNamedImportsAst(cst)
    }

    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return SlimeImportCstToAst.createImportsListAst(cst)
    }

    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        return SlimeImportCstToAst.createImportSpecifierAst(cst)
    }

    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return SlimeImportCstToAst.createAttributeKeyAst(cst)
    }

    createWithEntriesAst(cst: SubhutiCst): any[] {
        return SlimeImportCstToAst.createWithEntriesAst(cst)
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        return SlimeImportCstToAst.createImportDeclarationAst(cst)
    }

    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return SlimeImportCstToAst.createWithClauseAst(cst)
    }

    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        return SlimeImportCstToAst.createFromClauseAst(cst)
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        return SlimeImportCstToAst.createModuleSpecifierAst(cst)
    }

    createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return SlimeImportCstToAst.createImportClauseAst(cst)
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        return SlimeImportCstToAst.createImportedDefaultBindingAst(cst)
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        return SlimeImportCstToAst.createImportedBindingAst(cst)
    }

    createNamedImportsListAstWrapped(cst: SubhutiCst): {
        specifiers: Array<SlimeImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return SlimeImportCstToAst.createNamedImportsListAstWrapped(cst)
    }

    // === module / ModuleCstToAst ===

    createProgramAst(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.createProgramAst(cst)
    }

    createScriptAst(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.createScriptAst(cst)
    }

    createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.createScriptBodyAst(cst)
    }

    createModuleAst(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.createModuleAst(cst)
    }

    createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.createModuleBodyAst(cst)
    }

    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        return SlimeModuleCstToAst.createModuleItemAst(item)
    }

    toProgram(cst: SubhutiCst): SlimeProgram {
        return SlimeModuleCstToAst.toProgram(cst)
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        return SlimeModuleCstToAst.createModuleItemListAst(cst)
    }

    // ============================================
    // TypeScript 类型转换方法 - 委托到 typescript/ 目录
    // ============================================

    createTSTypeAst(cst: SubhutiCst): any {
        return SlimeTSTypeAnnotationCstToAst.createTSTypeAst(cst)
    }

    createTSTypeAnnotationAst(cst: SubhutiCst): any {
        return SlimeTSTypeAnnotationCstToAst.createTSTypeAnnotationAst(cst)
    }

    createTSUnionOrIntersectionTypeAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSUnionOrIntersectionTypeAst(cst)
    }

    createTSIntersectionTypeAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSIntersectionTypeAst(cst)
    }

    createTSConditionalTypeAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSConditionalTypeAst(cst)
    }

    createTSTypeOperandAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSTypeOperandAst(cst)
    }

    createTSPrefixTypeOrPrimaryAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSPrefixTypeOrPrimaryAst(cst)
    }

    createTSTypeQueryAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSTypeQueryAst(cst)
    }

    createTSTypeOperatorAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSTypeOperatorAst(cst)
    }

    createTSInferTypeAst(cst: SubhutiCst): any {
        return SlimeTSCompositeTypeCstToAst.createTSInferTypeAst(cst)
    }

    createTSFunctionTypeAst(cst: SubhutiCst): any {
        return SlimeTSFunctionTypeCstToAst.createTSFunctionTypeAst(cst)
    }

    createTSConstructorTypeAst(cst: SubhutiCst): any {
        return SlimeTSFunctionTypeCstToAst.createTSConstructorTypeAst(cst)
    }

    createTSTypeParameterDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSFunctionTypeCstToAst.createTSTypeParameterDeclarationAst(cst)
    }

    createTSTypeParameterAst(cst: SubhutiCst): any {
        return SlimeTSFunctionTypeCstToAst.createTSTypeParameterAst(cst)
    }

    createTSKeywordTypeWrapperAst(cst: SubhutiCst): any {
        return SlimeTSKeywordTypeCstToAst.createTSKeywordTypeWrapperAst(cst)
    }

    createTSKeywordTypeAst(cst: SubhutiCst, typeName: string): any {
        return SlimeTSKeywordTypeCstToAst.createTSKeywordTypeAst(cst, typeName)
    }

    createTSLiteralTypeAst(cst: SubhutiCst): any {
        return SlimeTSKeywordTypeCstToAst.createTSLiteralTypeAst(cst)
    }

    createTSPrimaryTypeAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSPrimaryTypeAst(cst)
    }

    createTSTypeReferenceAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSTypeReferenceAst(cst)
    }

    createTSTypeNameAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSTypeNameAst(cst)
    }

    buildQualifiedName(parts: string[], loc: SubhutiSourceLocation): any {
        return SlimeTSPrimaryTypeCstToAst.buildQualifiedName(parts, loc)
    }

    createTSTypeParameterInstantiationAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSTypeParameterInstantiationAst(cst)
    }

    createTSTupleTypeAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSTupleTypeAst(cst)
    }

    createTSTupleElementAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSTupleElementAst(cst)
    }

    createTSRestTypeAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSRestTypeAst(cst)
    }

    createTSNamedTupleMemberAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSNamedTupleMemberAst(cst)
    }

    createTSMappedTypeAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSMappedTypeAst(cst)
    }

    createTSParenthesizedTypeAst(cst: SubhutiCst): any {
        return SlimeTSPrimaryTypeCstToAst.createTSParenthesizedTypeAst(cst)
    }

    createTSTypeLiteralAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSTypeLiteralAst(cst)
    }

    createTSTypeMemberAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSTypeMemberAst(cst)
    }

    createTSPropertyOrMethodSignatureAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSPropertyOrMethodSignatureAst(cst)
    }

    extractPropertyNameKey(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.extractPropertyNameKey(cst)
    }

    createTSPropertySignatureAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSPropertySignatureAst(cst)
    }

    createTSMethodSignatureAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSMethodSignatureAst(cst)
    }

    createTSIndexSignatureAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSIndexSignatureAst(cst)
    }

    createTSCallSignatureDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSCallSignatureDeclarationAst(cst)
    }

    createTSConstructSignatureDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSConstructSignatureDeclarationAst(cst)
    }

    createTSParameterListAst(cst: SubhutiCst): any[] {
        return SlimeTSTypeLiteralCstToAst.createTSParameterListAst(cst)
    }

    createTSParameterAst(cst: SubhutiCst): any {
        return SlimeTSTypeLiteralCstToAst.createTSParameterAst(cst)
    }

    createTSInterfaceDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSInterfaceDeclarationAst(cst)
    }

    createTSInterfaceExtendsAst(cst: SubhutiCst): any[] {
        return SlimeTSDeclarationCstToAst.createTSInterfaceExtendsAst(cst)
    }

    createTSExpressionWithTypeArgumentsAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSExpressionWithTypeArgumentsAst(cst)
    }

    createTSInterfaceBodyAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSInterfaceBodyAst(cst)
    }

    createTSTypeAliasDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSTypeAliasDeclarationAst(cst)
    }

    createTSEnumDeclarationAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSEnumDeclarationAst(cst)
    }

    createTSEnumMemberAst(cst: SubhutiCst): any {
        return SlimeTSDeclarationCstToAst.createTSEnumMemberAst(cst)
    }

    createTSAsExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return SlimeTSExpressionCstToAst.createTSAsExpressionAst(expression, typeCst, loc)
    }

    createTSSatisfiesExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return SlimeTSExpressionCstToAst.createTSSatisfiesExpressionAst(expression, typeCst, loc)
    }

    createTSNonNullExpressionAst(expression: any, loc: any): any {
        return SlimeTSExpressionCstToAst.createTSNonNullExpressionAst(expression, loc)
    }

    createTSTypeAssertionAst(cst: SubhutiCst): any {
        return SlimeTSExpressionCstToAst.createTSTypeAssertionAst(cst)
    }

    createTSTypePredicateAst(cst: SubhutiCst): any {
        return SlimeTSExpressionCstToAst.createTSTypePredicateAst(cst)
    }

}

const slimeCstToAstUtil = new SlimeCstToAst()

export default slimeCstToAstUtil
