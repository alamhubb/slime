import {
    type SlimeJavascriptAssignmentExpression,
    type SlimeJavascriptBlockStatement,
    type SlimeJavascriptCallExpression,
    type SlimeJavascriptClassBody,
    type SlimeJavascriptClassDeclaration,
    type SlimeJavascriptConditionalExpression,
    type SlimeJavascriptDeclaration,
    type SlimeJavascriptExportDefaultDeclaration,
    type SlimeJavascriptExportNamedDeclaration,
    type SlimeJavascriptExpression,
    type SlimeJavascriptExpressionStatement,
    type SlimeJavascriptFunctionExpression,
    type SlimeJavascriptIdentifier,
    type SlimeJavascriptLiteral,
    type SlimeJavascriptModuleDeclaration,
    type SlimeJavascriptPattern,
    type SlimeJavascriptProgram,
    type SlimeJavascriptStatement,
    type SlimeJavascriptStringLiteral,
    type SlimeJavascriptVariableDeclaration,
    type SlimeJavascriptVariableDeclarator,
    type SlimeJavascriptReturnStatement,
    type SlimeJavascriptSpreadElement,
    type SlimeJavascriptMethodDefinition,
    type SlimeJavascriptRestElement,
    type SlimeJavascriptMemberExpression,
    type SlimeJavascriptImportDeclaration,
    type SlimeJavascriptImportSpecifier,
    type SlimeJavascriptClassExpression,
    type SlimeJavascriptArrayPattern,
    type SlimeJavascriptObjectPattern,
    type SlimeJavascriptAssignmentProperty,
    // Wrapper types for comma token association
    type SlimeJavascriptArrayElement,
    type SlimeJavascriptObjectPropertyItem,
    type SlimeJavascriptFunctionParam,
    type SlimeJavascriptCallArgument,
    type SlimeJavascriptArrayPatternElement,
    type SlimeJavascriptObjectPatternProperty,
    type SlimeJavascriptImportSpecifierItem,
    type SlimeJavascriptExportSpecifierItem,
    type SlimeJavascriptFunctionDeclaration,
    type SlimeJavascriptImportDefaultSpecifier,
    type SlimeJavascriptImportNamespaceSpecifier,
    // Additional needed types
    type SlimeJavascriptObjectExpression,
    type SlimeJavascriptProperty,
    type SlimeJavascriptNumericLiteral,
    type SlimeJavascriptArrayExpression,
    type SlimeJavascriptArrowFunctionExpression,
    type SlimeJavascriptDotToken,
    type SlimeJavascriptAssignToken,
    type SlimeJavascriptLBracketToken,
    type SlimeJavascriptRBracketToken,
    type SlimeJavascriptCommaToken,
    type SlimeJavascriptLBraceToken,
    type SlimeJavascriptRBraceToken,
    type SlimeJavascriptSuper,
    type SlimeJavascriptThisExpression,
    type SlimeJavascriptPropertyDefinition,
    type SlimeJavascriptMaybeNamedFunctionDeclaration,
    type SlimeJavascriptMaybeNamedClassDeclaration,
    type SlimeJavascriptExportAllDeclaration,
    type SlimeJavascriptExportSpecifier,
} from "slime-ast";
import {SubhutiCst, type SubhutiSourceLocation} from "subhuti";
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
} from "./slimeJavascriptCstToAst";


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
 * ### 第一层：AST 工厂类 (SlimeJavascriptAstCreateUtils.ts / SlimeJavascriptAstUtil)
 * - 与 ESTree AST 节点类型一一对应的纯粹创建方法
 * - 不依赖 CST 结构，只接收参数创建节点
 * - 示例：createIdentifier(name, loc) -> SlimeJavascriptIdentifier
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
 * 内部调用 SlimeJavascriptNodeCreate / SlimeJavascriptAstUtil 中与 AST 类型名一致的工厂方法。
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
export class SlimeJavascriptCstToAst {

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

    readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeJavascriptExpression>()

    // === identifier / IdentifierCstToAst ===

    createIdentifierNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createIdentifierNameAst(cst)
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    createPrivateIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst)
    }

    createLabelIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createLabelIdentifierAst(cst)
    }

    createIdentifierReferenceAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createIdentifierReferenceAst(cst)
    }

    createIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return IdentifierCstToAst.createIdentifierAst(cst)
    }

    // === literal / LiteralCstToAst ===

    createBooleanLiteralAst(cst: SubhutiCst): SlimeJavascriptLiteral {
        return LiteralCstToAst.createBooleanLiteralAst(cst)
    }

    createNumericLiteralAst(cst: SubhutiCst): SlimeJavascriptNumericLiteral {
        return LiteralCstToAst.createNumericLiteralAst(cst)
    }

    createStringLiteralAst(cst: SubhutiCst): SlimeJavascriptStringLiteral {
        return LiteralCstToAst.createStringLiteralAst(cst)
    }

    createRegExpLiteralAst(cst: SubhutiCst): any {
        return LiteralCstToAst.createRegExpLiteralAst(cst)
    }

    createLiteralFromToken(token: any): SlimeJavascriptExpression {
        return LiteralCstToAst.createLiteralFromToken(token)
    }

    createLiteralAst(cst: SubhutiCst): SlimeJavascriptLiteral {
        return LiteralCstToAst.createLiteralAst(cst)
    }

    createElisionAst(cst: SubhutiCst): number {
        return LiteralCstToAst.createElisionAst(cst)
    }

    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeJavascriptExpression[]): void {
        LiteralCstToAst.processTemplateMiddleList(cst, quasis, expressions)
    }

    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeJavascriptExpression[]): void {
        LiteralCstToAst.processTemplateSpans(cst, quasis, expressions)
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return LiteralCstToAst.createTemplateLiteralAst(cst)
    }

    // === literal / CompoundLiteralCstToAst ===

    createPropertyNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression {
        return CompoundLiteralCstToAst.createPropertyNameAst(cst)
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return CompoundLiteralCstToAst.createLiteralPropertyNameAst(cst)
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeJavascriptSpreadElement {
        return CompoundLiteralCstToAst.createSpreadElementAst(cst)
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeJavascriptArrayElement> {
        return CompoundLiteralCstToAst.createElementListAst(cst)
    }

    createArrayLiteralAst(cst: SubhutiCst): SlimeJavascriptArrayExpression {
        return CompoundLiteralCstToAst.createArrayLiteralAst(cst)
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeJavascriptObjectExpression {
        return CompoundLiteralCstToAst.createObjectLiteralAst(cst)
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeJavascriptProperty {
        return CompoundLiteralCstToAst.createPropertyDefinitionAst(cst)
    }

    // === pattern / BindingPatternCstToAst ===

    createBindingElementAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingElementAst(cst)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createSingleNameBindingAst(cst)
    }

    createBindingRestPropertyAst(cst: SubhutiCst): SlimeJavascriptRestElement {
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

    createBindingPatternAst(cst: SubhutiCst): SlimeJavascriptPattern {
        return BindingPatternCstToAst.createBindingPatternAst(cst)
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return BindingPatternCstToAst.createArrayBindingPatternAst(cst)
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return BindingPatternCstToAst.createObjectBindingPatternAst(cst)
    }

    // === pattern / AssignmentPatternCstToAst ===

    createAssignmentPatternAst(cst: SubhutiCst): any {
        return AssignmentPatternCstToAst.createAssignmentPatternAst(cst)
    }

    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return AssignmentPatternCstToAst.createObjectAssignmentPatternAst(cst)
    }

    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
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

    convertArrayExpressionToPattern(expr: any): SlimeJavascriptArrayPattern {
        return PatternConvertCstToAst.convertArrayExpressionToPattern(expr)
    }

    convertCstToPattern(cst: SubhutiCst): SlimeJavascriptPattern | null {
        return PatternConvertCstToAst.convertCstToPattern(cst)
    }

    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimeJavascriptPattern | null {
        return PatternConvertCstToAst.convertCoverParameterCstToPattern(cst, hasEllipsis)
    }

    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return PatternConvertCstToAst.convertObjectLiteralToPattern(cst)
    }

    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeJavascriptAssignmentProperty | null {
        return PatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(cst)
    }

    convertObjectExpressionToPattern(expr: any): SlimeJavascriptObjectPattern {
        return PatternConvertCstToAst.convertObjectExpressionToPattern(expr)
    }

    convertAssignmentExpressionToPattern(expr: any): any {
        return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr)
    }

    convertExpressionToPatternFromAST(expr: any): SlimeJavascriptPattern | null {
        return PatternConvertCstToAst.convertExpressionToPatternFromAST(expr)
    }

    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return PatternConvertCstToAst.convertArrayLiteralToPattern(cst)
    }

    convertExpressionToPattern(expr: any): SlimeJavascriptPattern {
        return PatternConvertCstToAst.convertExpressionToPattern(expr)
    }

    // === expression / ExpressionCstToAst ===

    createYieldExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createYieldExpressionAst(cst)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createAwaitExpressionAst(cst)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createConditionalExpressionAst(cst)
    }

    // === expression / PrimaryExpressionCstToAst ===

    createComputedPropertyNameAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return CompoundLiteralCstToAst.createComputedPropertyNameAst(cst)
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return PrimaryExpressionCstToAst.createPrimaryExpressionAst(cst)
    }

    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return PrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst)
    }

    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return PrimaryExpressionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
    }

    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return CompoundLiteralCstToAst.createCoverInitializedNameAst(cst)
    }

    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createLeftHandSideExpressionAst(cst)
    }

    // === expression / AssignmentExpressionCstToAst ===

    createExpressionBodyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createExpressionBodyAst(cst)
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createAssignmentExpressionAst(cst)
    }

    createExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createExpressionAst(cst)
    }

    createExpressionAstUncached(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createExpressionAstUncached(cst)
    }

    // === expression / BinaryExpressionCstToAst ===

    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return BinaryExpressionCstToAst.createMultiplicativeOperatorAst(cst)
    }

    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return ExpressionCstToAst.createAssignmentOperatorAst(cst)
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createExponentiationExpressionAst(cst)
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createLogicalORExpressionAst(cst)
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createLogicalANDExpressionAst(cst)
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createBitwiseORExpressionAst(cst)
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst)
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst)
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createEqualityExpressionAst(cst)
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createRelationalExpressionAst(cst)
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createShiftExpressionAst(cst)
    }

    createCoalesceExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createCoalesceExpressionAst(cst)
    }

    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
    }

    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createShortCircuitExpressionAst(cst)
    }

    createShortCircuitExpressionTailAst(left: SlimeJavascriptExpression, tailCst: SubhutiCst): SlimeJavascriptExpression {
        return ExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
    }

    // === expression / UnaryExpressionCstToAst ===

    createUnaryExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return UnaryExpressionCstToAst.createUnaryExpressionAst(cst)
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return UnaryExpressionCstToAst.createUpdateExpressionAst(cst)
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createAdditiveExpressionAst(cst)
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return BinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst)
    }

    // === expression / MemberCallCstToAst ===

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeJavascriptExpression | SlimeJavascriptSuper {
        return MemberCallCstToAst.createMemberExpressionFirstOr(cst)
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createMemberExpressionAst(cst)
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        return MemberCallCstToAst.createArgumentsAst(cst)
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        return MemberCallCstToAst.createArgumentListAst(cst)
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createCallExpressionAst(cst)
    }

    createCallMemberExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createCallMemberExpressionAst(cst)
    }

    createNewExpressionAst(cst: SubhutiCst): any {
        return MemberCallCstToAst.createNewExpressionAst(cst)
    }

    createSuperCallAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createSuperCallAst(cst)
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createSuperPropertyAst(cst)
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return MemberCallCstToAst.createMetaPropertyAst(cst)
    }

    // === expression / OptionalExpressionCstToAst ===

    createOptionalChainAst(object: SlimeJavascriptExpression, chainCst: SubhutiCst): SlimeJavascriptExpression {
        return OptionalExpressionCstToAst.createOptionalChainAst(object, chainCst)
    }

    createOptionalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return OptionalExpressionCstToAst.createOptionalExpressionAst(cst)
    }

    // === function / ArrowFunctionCstToAst ===

    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeJavascriptBlockStatement | SlimeJavascriptExpression {
        return FunctionBodyCstToAst.createAsyncConciseBodyAst(cst)
    }

    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return ArrowFunctionCstToAst.createAsyncArrowHeadAst(cst)
    }

    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return ArrowFunctionCstToAst.createAsyncArrowBindingIdentifierAst(cst)
    }

    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        return PrimaryExpressionCstToAst.findFirstIdentifierInExpression(cst)
    }

    extractParametersFromExpression(expressionCst: SubhutiCst): SlimeJavascriptPattern[] {
        return FunctionParameterCstToAst.extractParametersFromExpression(expressionCst)
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return ArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(cst)
    }

    createArrowFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return ArrowFunctionCstToAst.createArrowFormalParametersAst(cst)
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return ArrowFunctionCstToAst.createArrowFormalParametersAstWrapped(cst)
    }

    createArrowParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return ArrowFunctionCstToAst.createArrowParametersAst(cst)
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeJavascriptArrowFunctionExpression {
        return ArrowFunctionCstToAst.createArrowFunctionAst(cst)
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeJavascriptArrowFunctionExpression {
        return ArrowFunctionCstToAst.createAsyncArrowFunctionAst(cst)
    }

    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return ArrowFunctionCstToAst.createAsyncArrowParamsFromCover(cst)
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeJavascriptBlockStatement | SlimeJavascriptExpression {
        return FunctionBodyCstToAst.createConciseBodyAst(cst)
    }

    // === function / FunctionExpressionCstToAst ===

    createFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return FunctionExpressionCstToAst.createFunctionExpressionAst(cst)
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return FunctionExpressionCstToAst.createGeneratorExpressionAst(cst)
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return FunctionExpressionCstToAst.createAsyncFunctionExpressionAst(cst)
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return FunctionExpressionCstToAst.createAsyncGeneratorExpressionAst(cst)
    }

    // === function / FunctionParameterCstToAst ===

    createBindingRestElementAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        return PatternConvertCstToAst.createBindingRestElementAst(cst)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        return FunctionParameterCstToAst.createFunctionRestParameterAst(cst)
    }

    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeJavascriptRestElement {
        return FunctionParameterCstToAst.createFunctionRestParameterAstAlt(cst)
    }

    createFormalParameterAst(cst: SubhutiCst): SlimeJavascriptPattern {
        return FunctionParameterCstToAst.createFormalParameterAst(cst)
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return FunctionParameterCstToAst.createFormalParameterListAst(cst)
    }

    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParameterListAstWrapped(cst)
    }

    createFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return FunctionParameterCstToAst.createFormalParametersAst(cst)
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParametersAstWrapped(cst)
    }

    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return FunctionParameterCstToAst.createFormalParameterListFromEs2025Wrapped(cst)
    }

    createUniqueFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return FunctionParameterCstToAst.createUniqueFormalParametersAst(cst)
    }

    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return FunctionParameterCstToAst.createUniqueFormalParametersAstWrapped(cst)
    }

    // === declaration / FunctionDeclarationCstToAst ===

    createFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return FunctionDeclarationCstToAst.createFunctionDeclarationAst(cst)
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return FunctionDeclarationCstToAst.createGeneratorDeclarationAst(cst)
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return FunctionDeclarationCstToAst.createAsyncFunctionDeclarationAst(cst)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return FunctionDeclarationCstToAst.createAsyncGeneratorDeclarationAst(cst)
    }

    // === declaration / VariableCstToAst ===

    createLetOrConstAst(cst: SubhutiCst): string {
        return VariableCstToAst.createLetOrConstAst(cst)
    }

    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeJavascriptVariableDeclaration {
        return VariableCstToAst.createVariableDeclarationFromList(cst, kind)
    }

    createForBindingAst(cst: SubhutiCst): any {
        return VariableCstToAst.createForBindingAst(cst)
    }

    createForDeclarationAst(cst: SubhutiCst): any {
        return VariableCstToAst.createForDeclarationAst(cst)
    }

    createInitializerAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return VariableCstToAst.createInitializerAst(cst)
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorAst(cst)
    }

    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorFromVarDeclaration(cst)
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator[] {
        return VariableCstToAst.createVariableDeclarationListAst(cst)
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return VariableCstToAst.createLexicalBindingAst(cst)
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return VariableCstToAst.createLexicalDeclarationAst(cst)
    }

    createVariableDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return VariableCstToAst.createVariableDeclarationAst(cst)
    }

    createVariableStatementAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return VariableCstToAst.createVariableStatementAst(cst)
    }

    createDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        return VariableCstToAst.createDeclarationAst(cst)
    }

    createHoistableDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        return VariableCstToAst.createHoistableDeclarationAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===

    createClassElementNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression {
        return ClassDeclarationCstToAst.createClassElementNameAst(cst)
    }

    isComputedPropertyName(cst: SubhutiCst): boolean {
        return ClassDeclarationCstToAst.isComputedPropertyName(cst)
    }

    isStaticModifier(cst: SubhutiCst | null): boolean {
        return ClassDeclarationCstToAst.isStaticModifier(cst)
    }

    createClassDeclarationAst(cst: SubhutiCst): SlimeJavascriptClassDeclaration {
        return ClassDeclarationCstToAst.createClassDeclarationAst(cst)
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeJavascriptExpression | null;
        body: SlimeJavascriptClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        return ClassDeclarationCstToAst.createClassTailAst(cst)
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ClassDeclarationCstToAst.createClassHeritageAst(cst)
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeJavascriptExpression; extendsToken?: any } {
        return ClassDeclarationCstToAst.createClassHeritageAstWithToken(cst)
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptPropertyDefinition {
        return ClassDeclarationCstToAst.createFieldDefinitionAst(staticCst, cst)
    }

    createClassBodyAst(cst: SubhutiCst): SlimeJavascriptClassBody {
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

    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return ClassDeclarationCstToAst.createClassStaticBlockBodyAst(cst)
    }

    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return ClassDeclarationCstToAst.createClassStaticBlockStatementListAst(cst)
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeJavascriptClassExpression {
        return ClassDeclarationCstToAst.createClassExpressionAst(cst)
    }

    // === class / MethodDefinitionCstToAst ===

    createPropertySetParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return MethodDefinitionCstToAst.createPropertySetParameterListAst(cst)
    }

    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return MethodDefinitionCstToAst.createPropertySetParameterListAstWrapped(cst)
    }

    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAstInternal(cst, kind, generator, async)
    }

    createGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createGeneratorMethodAst(cst)
    }

    createAsyncMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncMethodAst(cst)
    }

    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncGeneratorMethodAst(cst)
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, cst)
    }

    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
    }

    // === statement / BlockCstToAst ===

    createBlockAst(cst: SubhutiCst): SlimeJavascriptBlockStatement {
        return BlockCstToAst.createBlockAst(cst)
    }

    createBlockStatementAst(cst: SubhutiCst): SlimeJavascriptBlockStatement {
        return BlockCstToAst.createBlockStatementAst(cst)
    }

    createStatementDeclarationAst(cst: SubhutiCst): any {
        return BlockCstToAst.createStatementDeclarationAst(cst)
    }

    createStatementAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return BlockCstToAst.createStatementAst(cst)
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return BlockCstToAst.createStatementListItemAst(cst)
    }

    createStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
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

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return FunctionBodyCstToAst.createFunctionStatementListAst(cst)
    }

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return FunctionBodyCstToAst.createFunctionBodyAst(cst)
    }

    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return FunctionBodyCstToAst.createGeneratorBodyAst(cst)
    }

    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return FunctionBodyCstToAst.createAsyncFunctionBodyAst(cst)
    }

    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
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

    createReturnStatementAst(cst: SubhutiCst): SlimeJavascriptReturnStatement {
        return OtherStatementCstToAst.createReturnStatementAst(cst)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeJavascriptExpressionStatement {
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

    createExportDeclarationAst(cst: SubhutiCst): SlimeJavascriptExportDefaultDeclaration | SlimeJavascriptExportNamedDeclaration | SlimeJavascriptExportAllDeclaration {
        return ExportCstToAst.createExportDeclarationAst(cst)
    }

    createNamedExportsAst(cst: SubhutiCst): SlimeJavascriptExportSpecifierItem[] {
        return ExportCstToAst.createNamedExportsAst(cst)
    }

    createExportsListAst(cst: SubhutiCst): SlimeJavascriptExportSpecifierItem[] {
        return ExportCstToAst.createExportsListAst(cst)
    }

    createExportSpecifierAst(cst: SubhutiCst): SlimeJavascriptExportSpecifier {
        return ExportCstToAst.createExportSpecifierAst(cst)
    }

    createModuleExportNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return ExportCstToAst.createModuleExportNameAst(cst)
    }

    // === module / ImportCstToAst ===

    createImportCallAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return ImportCstToAst.createImportCallAst(cst)
    }

    createNameSpaceImportAst(cst: SubhutiCst): SlimeJavascriptImportNamespaceSpecifier {
        return ImportCstToAst.createNameSpaceImportAst(cst)
    }

    createNamedImportsAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        return ImportCstToAst.createNamedImportsAst(cst)
    }

    createImportsListAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        return ImportCstToAst.createImportsListAst(cst)
    }

    createImportSpecifierAst(cst: SubhutiCst): SlimeJavascriptImportSpecifier {
        return ImportCstToAst.createImportSpecifierAst(cst)
    }

    createAttributeKeyAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return ImportCstToAst.createAttributeKeyAst(cst)
    }

    createWithEntriesAst(cst: SubhutiCst): any[] {
        return ImportCstToAst.createWithEntriesAst(cst)
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeJavascriptImportDeclaration {
        return ImportCstToAst.createImportDeclarationAst(cst)
    }

    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return ImportCstToAst.createWithClauseAst(cst)
    }

    createFromClauseAst(cst: SubhutiCst): { source: SlimeJavascriptStringLiteral, fromToken?: any } {
        return ImportCstToAst.createFromClauseAst(cst)
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeJavascriptStringLiteral {
        return ImportCstToAst.createModuleSpecifierAst(cst)
    }

    createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return ImportCstToAst.createImportClauseAst(cst)
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeJavascriptImportDefaultSpecifier {
        return ImportCstToAst.createImportedDefaultBindingAst(cst)
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return ImportCstToAst.createImportedBindingAst(cst)
    }

    createNamedImportsListAstWrapped(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return ImportCstToAst.createNamedImportsListAstWrapped(cst)
    }

    // === module / ModuleCstToAst ===

    createProgramAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.createProgramAst(cst)
    }

    createScriptAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.createScriptAst(cst)
    }

    createScriptBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.createScriptBodyAst(cst)
    }

    createModuleAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.createModuleAst(cst)
    }

    createModuleBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.createModuleBodyAst(cst)
    }

    createModuleItemAst(item: SubhutiCst): SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration | SlimeJavascriptStatement[] | undefined {
        return ModuleCstToAst.createModuleItemAst(item)
    }

    toProgram(cst: SubhutiCst): SlimeJavascriptProgram {
        return ModuleCstToAst.toProgram(cst)
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration> {
        return ModuleCstToAst.createModuleItemListAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===
}

const SlimeJavascriptCstToAstUtil = new SlimeJavascriptCstToAst()

export default SlimeJavascriptCstToAstUtil
