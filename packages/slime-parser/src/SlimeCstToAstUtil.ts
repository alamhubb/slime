import {
    type SlimeAssignmentExpression,
    type SlimeBlockStatement,
    type SlimeCallExpression,
    type SlimeClassBody,
    type SlimeClassDeclaration,
    type SlimeConditionalExpression,
    type SlimeDeclaration,
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration,
    type SlimeExpression,
    type SlimeExpressionStatement,
    type SlimeFunctionExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeModuleDeclaration,
    type SlimePattern,
    type SlimeProgram,
    type SlimeStatement,
    type SlimeStringLiteral,
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeReturnStatement,
    type SlimeSpreadElement,
    type SlimeMethodDefinition,
    type SlimeRestElement,
    type SlimeMemberExpression,
    type SlimeImportDeclaration,
    type SlimeImportSpecifier,
    type SlimeClassExpression,
    type SlimeArrayPattern,
    type SlimeObjectPattern,
    type SlimeAssignmentProperty,
    // Wrapper types for comma token association
    type SlimeArrayElement,
    type SlimeObjectPropertyItem,
    type SlimeFunctionParam,
    type SlimeCallArgument,
    type SlimeArrayPatternElement,
    type SlimeObjectPatternProperty,
    type SlimeImportSpecifierItem,
    type SlimeExportSpecifierItem,
    type SlimeFunctionDeclaration,
    type SlimeImportDefaultSpecifier,
    type SlimeImportNamespaceSpecifier,
    // Additional needed types
    type SlimeObjectExpression,
    type SlimeProperty,
    type SlimeNumericLiteral,
    type SlimeArrayExpression,
    type SlimeArrowFunctionExpression,
    type SlimeDotToken,
    type SlimeAssignToken,
    type SlimeLBracketToken,
    type SlimeRBracketToken,
    type SlimeCommaToken,
    type SlimeLBraceToken,
    type SlimeRBraceToken,
    type SlimeSuper,
    type SlimeThisExpression,
    type SlimePropertyDefinition,
    type SlimeMaybeNamedFunctionDeclaration,
    type SlimeMaybeNamedClassDeclaration,
    type SlimeExportAllDeclaration,
    type SlimeExportSpecifier,
} from "slime-ast";
import {SubhutiCst, type SubhutiSourceLocation} from "subhuti";
import SlimeParser from "./SlimeParser.ts";
import {SlimeAstUtil, SlimeTokenCreate, SlimeNodeType} from "slime-ast";
import {
    ArrowFunctionCstToAst,
    AssignmentPatternCstToAst,
    BinaryExpressionCstToAst,
    BindingPatternCstToAst,
    BlockCstToAst,
    CompoundLiteralCstToAst,
    ControlFlowCstToAst,
    ExpressionCstToAst,
    ExportCstToAst,
    FunctionBodyCstToAst,
    FunctionDeclarationCstToAst,
    FunctionExpressionCstToAst,
    FunctionParameterCstToAst,
    IdentifierCstToAst,
    ImportCstToAst,
    LiteralCstToAst,
    MemberCallCstToAst,
    MethodDefinitionCstToAst,
    ModuleCstToAst,
    OptionalExpressionCstToAst,
    OtherStatementCstToAst,
    PatternConvertCstToAst,
    PrimaryExpressionCstToAst,
    UnaryExpressionCstToAst,
    VariableCstToAst, ClassDeclarationCstToAst,
} from "./cstToAst";
import {SlimeAstUtils} from "./cstToAst/SlimeAstUtils.ts";

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
 * ### 第一层：AST 工厂类 (SlimeNodeCreate.ts / SlimeAstUtil)
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
 * 内部调用 SlimeNodeCreate / SlimeAstUtil 中与 AST 类型名一致的工厂方法。
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
            SlimeAstUtils.throwNewError(cst.name)
        }
        return cstName
    }

    /**
     * 抛出错误
     */
    throwNewError(errorMsg: string = 'syntax error') {
        throw new Error(errorMsg)
    }

    readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>()

    // === identifier / IdentifierCstToAst ===

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierNameAst(cst)
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst)
    }

    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createLabelIdentifierAst(cst)
    }

    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierReferenceAst(cst)
    }

    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierAst(cst)
    }

    // === literal / LiteralCstToAst ===

    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createBooleanLiteralAst(cst)
    }

    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        return LiteralCstToAst.createNumericLiteralAst(cst)
    }

    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        return LiteralCstToAst.createStringLiteralAst(cst)
    }

    createRegExpLiteralAst(cst: SubhutiCst): any {
        return LiteralCstToAst.createRegExpLiteralAst(cst)
    }

    createLiteralFromToken(token: any): SlimeExpression {
        return LiteralCstToAst.createLiteralFromToken(token)
    }

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createLiteralAst(cst)
    }

    createElisionAst(cst: SubhutiCst): number {
        return LiteralCstToAst.createElisionAst(cst)
    }

    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        LiteralCstToAst.processTemplateMiddleList(cst, quasis, expressions)
    }

    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        LiteralCstToAst.processTemplateSpans(cst, quasis, expressions)
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        return LiteralCstToAst.createTemplateLiteralAst(cst)
    }

    // === literal / CompoundLiteralCstToAst ===

    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return CompoundLiteralCstToAst.createPropertyNameAst(cst)
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return CompoundLiteralCstToAst.createLiteralPropertyNameAst(cst)
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return CompoundLiteralCstToAst.createSpreadElementAst(cst)
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return CompoundLiteralCstToAst.createElementListAst(cst)
    }

    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        return CompoundLiteralCstToAst.createArrayLiteralAst(cst)
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        return CompoundLiteralCstToAst.createObjectLiteralAst(cst)
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return CompoundLiteralCstToAst.createPropertyDefinitionAst(cst)
    }

    // === pattern / BindingPatternCstToAst ===

    createBindingElementAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingElementAst(cst)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createSingleNameBindingAst(cst)
    }

    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        return BindingPatternCstToAst.createBindingRestPropertyAst(cst)
    }

    createBindingPropertyAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingPropertyAst(cst)
    }

    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return BindingPatternCstToAst.createBindingPropertyListAst(cst)
    }

    createBindingElementListAst(cst: SubhutiCst): any[] {
        return BindingPatternCstToAst.createBindingElementListAst(cst)
    }

    createBindingElisionElementAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingElisionElementAst(cst)
    }

    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        return BindingPatternCstToAst.createBindingPatternAst(cst)
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return BindingPatternCstToAst.createArrayBindingPatternAst(cst)
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return BindingPatternCstToAst.createObjectBindingPatternAst(cst)
    }

    // === pattern / AssignmentPatternCstToAst ===

    createAssignmentPatternAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentPatternAst(cst)
    }

    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return AssignmentPatternCstToAst.createObjectAssignmentPatternAst(cst)
    }

    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return AssignmentPatternCstToAst.createArrayAssignmentPatternAst(cst)
    }

    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        return AssignmentPatternCstToAst.createAssignmentPropertyListAst(cst)
    }

    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentPropertyAst(cst)
    }

    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return AssignmentPatternCstToAst.createAssignmentElementListAst(cst)
    }

    createAssignmentElementAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentElementAst(cst)
    }

    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentElisionElementAst(cst)
    }

    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentRestElementAst(cst)
    }

    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentRestPropertyAst(cst)
    }

    // === pattern / PatternConvertCstToAst ===

    convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        return PatternConvertCstToAst.convertArrayExpressionToPattern(expr)
    }

    convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        return PatternConvertCstToAst.convertCstToPattern(cst)
    }

    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        return PatternConvertCstToAst.convertCoverParameterCstToPattern(cst, hasEllipsis)
    }

    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        return PatternConvertCstToAst.convertObjectLiteralToPattern(cst)
    }

    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        return PatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(cst)
    }

    convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        return PatternConvertCstToAst.convertObjectExpressionToPattern(expr)
    }

    convertAssignmentExpressionToPattern(expr: any): any {
        return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr)
    }

    convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        return PatternConvertCstToAst.convertExpressionToPatternFromAST(expr)
    }

    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        return PatternConvertCstToAst.convertArrayLiteralToPattern(cst)
    }

    convertExpressionToPattern(expr: any): SlimePattern {
        return PatternConvertCstToAst.convertExpressionToPattern(expr)
    }

    // === expression / ExpressionCstToAst ===

    createYieldExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createYieldExpressionAst(cst)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createAwaitExpressionAst(cst)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createConditionalExpressionAst(cst)
    }

    // === expression / PrimaryExpressionCstToAst ===

    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return CompoundLiteralCstToAst.createComputedPropertyNameAst(cst)
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createPrimaryExpressionAst(cst)
    }

    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst)
    }

    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
    }

    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return CompoundLiteralCstToAst.createCoverInitializedNameAst(cst)
    }

    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createLeftHandSideExpressionAst(cst)
    }

    // === expression / AssignmentExpressionCstToAst ===

    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createExpressionBodyAst(cst)
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createAssignmentExpressionAst(cst)
    }

    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createExpressionAst(cst)
    }

    createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createExpressionAstUncached(cst)
    }

    // === expression / BinaryExpressionCstToAst ===

    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return BinaryExpressionCstToAst.createMultiplicativeOperatorAst(cst)
    }

    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return ExpressionCstToAst.createAssignmentOperatorAst(cst)
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createExponentiationExpressionAst(cst)
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalORExpressionAst(cst)
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalANDExpressionAst(cst)
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseORExpressionAst(cst)
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst)
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst)
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createEqualityExpressionAst(cst)
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createRelationalExpressionAst(cst)
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShiftExpressionAst(cst)
    }

    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoalesceExpressionAst(cst)
    }

    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
    }

    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createShortCircuitExpressionAst(cst)
    }

    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
    }

    // === expression / UnaryExpressionCstToAst ===

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUnaryExpressionAst(cst)
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUpdateExpressionAst(cst)
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createAdditiveExpressionAst(cst)
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst)
    }

    // === expression / MemberCallCstToAst ===

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        return MemberCallCstToAst.createMemberExpressionFirstOr(cst)
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMemberExpressionAst(cst)
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentsAst(cst)
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentListAst(cst)
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCallExpressionAst(cst)
    }

    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCallMemberExpressionAst(cst)
    }

    createNewExpressionAst(cst: SubhutiCst): any {
        return MemberCallCstToAst.createNewExpressionAst(cst)
    }

    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createSuperCallAst(cst)
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createSuperPropertyAst(cst)
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMetaPropertyAst(cst)
    }

    // === expression / OptionalExpressionCstToAst ===

    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        return OptionalExpressionCstToAst.createOptionalChainAst(object, chainCst)
    }

    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return OptionalExpressionCstToAst.createOptionalExpressionAst(cst)
    }

    // === function / ArrowFunctionCstToAst ===

    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return FunctionBodyCstToAst.createAsyncConciseBodyAst(cst)
    }

    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return ArrowFunctionCstToAst.createAsyncArrowHeadAst(cst)
    }

    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return ArrowFunctionCstToAst.createAsyncArrowBindingIdentifierAst(cst)
    }

    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        return PrimaryExpressionCstToAst.findFirstIdentifierInExpression(cst)
    }

    extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        return FunctionParameterCstToAst.extractParametersFromExpression(expressionCst)
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(cst)
    }

    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowFormalParametersAst(cst)
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return ArrowFunctionCstToAst.createArrowFormalParametersAstWrapped(cst)
    }

    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowParametersAst(cst)
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return ArrowFunctionCstToAst.createArrowFunctionAst(cst)
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return ArrowFunctionCstToAst.createAsyncArrowFunctionAst(cst)
    }

    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(cst)
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return FunctionBodyCstToAst.createConciseBodyAst(cst)
    }

    // === function / FunctionExpressionCstToAst ===

    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionExpressionCstToAst.createFunctionExpressionAst(cst)
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionExpressionCstToAst.createGeneratorExpressionAst(cst)
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionExpressionCstToAst.createAsyncFunctionExpressionAst(cst)
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionExpressionCstToAst.createAsyncGeneratorExpressionAst(cst)
    }

    // === function / FunctionParameterCstToAst ===

    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        return PatternConvertCstToAst.createBindingRestElementAst(cst)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        return FunctionParameterCstToAst.createFunctionRestParameterAst(cst)
    }

    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeRestElement {
        return FunctionParameterCstToAst.createFunctionRestParameterAstAlt(cst)
    }

    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        return FunctionParameterCstToAst.createFormalParameterAst(cst)
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionParameterCstToAst.createFormalParameterListAst(cst)
    }

    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParameterListAstWrapped(cst)
    }

    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionParameterCstToAst.createFormalParametersAst(cst)
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParametersAstWrapped(cst)
    }

    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParameterListFromEs2025Wrapped(cst)
    }

    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionParameterCstToAst.createUniqueFormalParametersAst(cst)
    }

    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionParameterCstToAst.createUniqueFormalParametersAstWrapped(cst)
    }

    // === declaration / FunctionDeclarationCstToAst ===

    createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionDeclarationCstToAst.createFunctionDeclarationAst(cst)
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionDeclarationCstToAst.createGeneratorDeclarationAst(cst)
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionDeclarationCstToAst.createAsyncFunctionDeclarationAst(cst)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionDeclarationCstToAst.createAsyncGeneratorDeclarationAst(cst)
    }

    // === declaration / VariableCstToAst ===

    createLetOrConstAst(cst: SubhutiCst): string {
        return VariableCstToAst.createLetOrConstAst(cst)
    }

    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeVariableDeclaration {
        return VariableCstToAst.createVariableDeclarationFromList(cst, kind)
    }

    createForBindingAst(cst: SubhutiCst): any {
        return VariableCstToAst.createForBindingAst(cst)
    }

    createForDeclarationAst(cst: SubhutiCst): any {
        return VariableCstToAst.createForDeclarationAst(cst)
    }

    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        return VariableCstToAst.createInitializerAst(cst)
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorAst(cst)
    }

    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorFromVarDeclaration(cst)
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        return VariableCstToAst.createVariableDeclarationListAst(cst)
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createLexicalBindingAst(cst)
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createLexicalDeclarationAst(cst)
    }

    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createVariableDeclarationAst(cst)
    }

    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createVariableStatementAst(cst)
    }

    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return VariableCstToAst.createDeclarationAst(cst)
    }

    createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return VariableCstToAst.createHoistableDeclarationAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===

    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return ClassDeclarationCstToAst.createClassElementNameAst(cst)
    }

    isComputedPropertyName(cst: SubhutiCst): boolean {
        return ClassDeclarationCstToAst.isComputedPropertyName(cst)
    }

    isStaticModifier(cst: SubhutiCst | null): boolean {
        return ClassDeclarationCstToAst.isStaticModifier(cst)
    }

    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        return ClassDeclarationCstToAst.createClassDeclarationAst(cst)
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        return ClassDeclarationCstToAst.createClassTailAst(cst)
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        return ClassDeclarationCstToAst.createClassHeritageAst(cst)
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        return ClassDeclarationCstToAst.createClassHeritageAstWithToken(cst)
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        return ClassDeclarationCstToAst.createFieldDefinitionAst(staticCst, cst)
    }

    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        return ClassDeclarationCstToAst.createClassBodyAst(cst)
    }

    createClassStaticBlockAst(cst: SubhutiCst): any {
        return ClassDeclarationCstToAst.createClassStaticBlockAst(cst)
    }

    createClassElementAst(cst: SubhutiCst): any {
        return ClassDeclarationCstToAst.createClassElementAst(cst)
    }

    createClassElementListAst(cst: SubhutiCst): any[] {
        return ClassDeclarationCstToAst.createClassElementListAst(cst)
    }

    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassDeclarationCstToAst.createClassStaticBlockBodyAst(cst)
    }

    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassDeclarationCstToAst.createClassStaticBlockStatementListAst(cst)
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        return ClassDeclarationCstToAst.createClassExpressionAst(cst)
    }

    // === class / MethodDefinitionCstToAst ===

    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return MethodDefinitionCstToAst.createPropertySetParameterListAst(cst)
    }

    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return MethodDefinitionCstToAst.createPropertySetParameterListAstWrapped(cst)
    }

    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAstInternal(cst, kind, generator, async)
    }

    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createGeneratorMethodAst(cst)
    }

    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncMethodAst(cst)
    }

    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncGeneratorMethodAst(cst)
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, cst)
    }

    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
    }

    // === statement / BlockCstToAst ===

    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        return BlockCstToAst.createBlockAst(cst)
    }

    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        return BlockCstToAst.createBlockStatementAst(cst)
    }

    createStatementDeclarationAst(cst: SubhutiCst): any {
        return BlockCstToAst.createStatementDeclarationAst(cst)
    }

    createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        return BlockCstToAst.createStatementAst(cst)
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        return BlockCstToAst.createStatementListItemAst(cst)
    }

    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return BlockCstToAst.createStatementListAst(cst)
    }

    // === statement / ControlFlowCstToAst ===

    createBreakableStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createBreakableStatementAst(cst)
    }

    createIterationStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIterationStatementAst(cst)
    }

    createIfStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIfStatementAst(cst)
    }

    createIfStatementBodyAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIfStatementBodyAst(cst)
    }

    createForStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForStatementAst(cst)
    }

    createForInOfStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForInOfStatementAst(cst)
    }

    createWhileStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createWhileStatementAst(cst)
    }

    createDoWhileStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createDoWhileStatementAst(cst)
    }

    createSwitchStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createSwitchStatementAst(cst)
    }

    // === statement / FunctionBodyCstToAst ===

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionBodyCstToAst.createFunctionStatementListAst(cst)
    }

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionBodyCstToAst.createFunctionBodyAst(cst)
    }

    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionBodyCstToAst.createGeneratorBodyAst(cst)
    }

    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionBodyCstToAst.createAsyncFunctionBodyAst(cst)
    }

    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionBodyCstToAst.createAsyncGeneratorBodyAst(cst)
    }

    // === statement / OtherStatementCstToAst ===

    createSemicolonASIAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createSemicolonASIAst(cst)
    }

    createEmptyStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createEmptyStatementAst(cst)
    }

    createThrowStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createThrowStatementAst(cst)
    }

    createBreakStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createBreakStatementAst(cst)
    }

    createContinueStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createContinueStatementAst(cst)
    }

    createTryStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createTryStatementAst(cst)
    }

    createFinallyAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createFinallyAst(cst)
    }

    createCatchAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createCatchAst(cst)
    }

    createCatchParameterAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createCatchParameterAst(cst)
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        return OtherStatementCstToAst.createReturnStatementAst(cst)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        return OtherStatementCstToAst.createExpressionStatementAst(cst)
    }

    createLabelledStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createLabelledStatementAst(cst)
    }

    createWithStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createWithStatementAst(cst)
    }

    createDebuggerStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createDebuggerStatementAst(cst)
    }

    createLabelledItemAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createLabelledItemAst(cst)
    }

    // === statement / SwitchCstToAst ===

    createCaseClauseAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createCaseClauseAst(cst)
    }

    createDefaultClauseAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createDefaultClauseAst(cst)
    }

    createCaseClausesAst(cst: SubhutiCst): any[] {
        return ControlFlowCstToAst.createCaseClausesAst(cst)
    }

    createCaseBlockAst(cst: SubhutiCst): any[] {
        return ControlFlowCstToAst.createCaseBlockAst(cst)
    }

    createSwitchCaseAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createSwitchCaseAst(cst)
    }

    extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        return ControlFlowCstToAst.extractCasesFromCaseBlock(caseBlockCst)
    }

    // === module / ExportCstToAst ===

    createExportFromClauseAst(cst: SubhutiCst): any {
        return ExportCstToAst.createExportFromClauseAst(cst)
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        return ExportCstToAst.createExportDeclarationAst(cst)
    }

    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ExportCstToAst.createNamedExportsAst(cst)
    }

    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ExportCstToAst.createExportsListAst(cst)
    }

    createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        return ExportCstToAst.createExportSpecifierAst(cst)
    }

    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ExportCstToAst.createModuleExportNameAst(cst)
    }

    // === module / ImportCstToAst ===

    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        return ImportCstToAst.createImportCallAst(cst)
    }

    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        return ImportCstToAst.createNameSpaceImportAst(cst)
    }

    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ImportCstToAst.createNamedImportsAst(cst)
    }

    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ImportCstToAst.createImportsListAst(cst)
    }

    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        return ImportCstToAst.createImportSpecifierAst(cst)
    }

    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ImportCstToAst.createAttributeKeyAst(cst)
    }

    createWithEntriesAst(cst: SubhutiCst): any[] {
        return ImportCstToAst.createWithEntriesAst(cst)
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        return ImportCstToAst.createImportDeclarationAst(cst)
    }

    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return ImportCstToAst.createWithClauseAst(cst)
    }

    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        return ImportCstToAst.createFromClauseAst(cst)
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        return ImportCstToAst.createModuleSpecifierAst(cst)
    }

    createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return ImportCstToAst.createImportClauseAst(cst)
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        return ImportCstToAst.createImportedDefaultBindingAst(cst)
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        return ImportCstToAst.createImportedBindingAst(cst)
    }

    createNamedImportsListAstWrapped(cst: SubhutiCst): {
        specifiers: Array<SlimeImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return ImportCstToAst.createNamedImportsListAstWrapped(cst)
    }

    // === module / ModuleCstToAst ===

    createProgramAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createProgramAst(cst)
    }

    createScriptAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createScriptAst(cst)
    }

    createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createScriptBodyAst(cst)
    }

    createModuleAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createModuleAst(cst)
    }

    createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createModuleBodyAst(cst)
    }

    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        return ModuleCstToAst.createModuleItemAst(item)
    }

    toProgram(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.toProgram(cst)
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        return ModuleCstToAst.createModuleItemListAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===
}

const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
