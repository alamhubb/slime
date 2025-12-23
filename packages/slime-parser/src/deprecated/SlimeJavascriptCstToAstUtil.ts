/**
 * ⚠️ 警告：请勿直接修改此文件！
 * 
 * 此文件属于 deprecated 包，包含 JavaScript ES2025 的基础实现。
 * 
 * 如需添加 TypeScript 支持或扩展功能：
 * 1. 在 SlimeCstToAstUtil.ts 中重写方法
 * 2. 在 _setupMethodInterception() 中添加方法拦截
 * 3. 或在 cstToAst/ 目录下的对应文件中实现
 * 
 * 参考：packages/slime-parser/src/SlimeCstToAstUtil.ts
 */
import {
    type SlimeJavascriptAssignmentExpression,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptCallExpression,
    SlimeJavascriptClassBody,
    SlimeJavascriptClassDeclaration,
    SlimeJavascriptConditionalExpression,
    SlimeJavascriptDeclaration,
    SlimeJavascriptExportDefaultDeclaration,
    SlimeJavascriptExportNamedDeclaration,
    SlimeJavascriptExpression,
    SlimeJavascriptExpressionStatement,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptIdentifier,
    SlimeJavascriptLiteral,
    SlimeJavascriptModuleDeclaration,
    SlimeJavascriptPattern,
    SlimeJavascriptProgram,
    SlimeJavascriptStatement,
    SlimeJavascriptStringLiteral,
    SlimeJavascriptVariableDeclaration,
    SlimeJavascriptVariableDeclarator,
    SlimeJavascriptReturnStatement,
    SlimeJavascriptSpreadElement,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptRestElement,
    SlimeJavascriptMemberExpression,
    SlimeJavascriptImportDeclaration,
    SlimeJavascriptImportSpecifier,
    SlimeJavascriptClassExpression,
    SlimeJavascriptArrayPattern,
    SlimeJavascriptObjectPattern,
    SlimeJavascriptAssignmentProperty,
    // Wrapper types for comma token association
    type SlimeJavascriptArrayElement,
    SlimeJavascriptObjectPropertyItem,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptCallArgument,
    SlimeJavascriptArrayPatternElement,
    SlimeJavascriptObjectPatternProperty,
    SlimeJavascriptImportSpecifierItem,
    SlimeJavascriptExportSpecifierItem,
    SlimeJavascriptFunctionDeclaration,
    SlimeJavascriptImportDefaultSpecifier,
    SlimeJavascriptImportNamespaceSpecifier,
    // Additional needed types
    type SlimeJavascriptObjectExpression,
    SlimeJavascriptProperty,
    SlimeJavascriptNumericLiteral,
    SlimeJavascriptArrayExpression,
    SlimeJavascriptArrowFunctionExpression,
    SlimeJavascriptDotToken,
    SlimeJavascriptAssignToken,
    SlimeJavascriptLBracketToken,
    SlimeJavascriptRBracketToken,
    SlimeJavascriptCommaToken,
    SlimeJavascriptLBraceToken,
    SlimeJavascriptRBraceToken,
    SlimeJavascriptSuper,
    SlimeJavascriptThisExpression,
    SlimeJavascriptPropertyDefinition,
    SlimeJavascriptMaybeNamedFunctionDeclaration,
    SlimeJavascriptMaybeNamedClassDeclaration,
    SlimeJavascriptExportAllDeclaration,
    SlimeJavascriptExportSpecifier,
} from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import SlimeJavascriptParser from "./SlimeJavascriptParser.ts";
import { SlimeJavascriptAstUtil, SlimeJavascriptTokenCreate, SlimeJavascriptAstTypeName } from "slime-ast";
import {
    SlimeJavascriptArrowFunctionCstToAst,
    SlimeJavascriptAssignmentPatternCstToAst,
    SlimeJavascriptBinaryExpressionCstToAst,
    SlimeJavascriptBindingPatternCstToAst,
    SlimeJavascriptBlockCstToAst,
    SlimeJavascriptCompoundLiteralCstToAst,
    SlimeJavascriptControlFlowCstToAst,
    SlimeJavascriptExpressionCstToAst,
    SlimeJavascriptExportCstToAst,
    SlimeJavascriptFunctionBodyCstToAst,
    SlimeJavascriptFunctionDeclarationCstToAst,
    SlimeJavascriptFunctionExpressionCstToAst,
    SlimeJavascriptFunctionParameterCstToAst,
    SlimeJavascriptIdentifierCstToAst,
    SlimeJavascriptImportCstToAst,
    SlimeJavascriptLiteralCstToAst,
    SlimeJavascriptMemberCallCstToAst,
    SlimeJavascriptMethodDefinitionCstToAst,
    SlimeJavascriptModuleCstToAst,
    SlimeJavascriptOptionalExpressionCstToAst,
    SlimeJavascriptOtherStatementCstToAst,
    SlimeJavascriptPatternConvertCstToAst,
    SlimeJavascriptPrimaryExpressionCstToAst,
    SlimeJavascriptUnaryExpressionCstToAst,
    SlimeJavascriptVariableCstToAst,
    SlimeJavascriptClassDeclarationCstToAst,
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
        return SlimeJavascriptIdentifierCstToAst.createIdentifierNameAst(cst)
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptIdentifierCstToAst.createBindingIdentifierAst(cst)
    }

    createPrivateIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptIdentifierCstToAst.createPrivateIdentifierAst(cst)
    }

    createLabelIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptIdentifierCstToAst.createLabelIdentifierAst(cst)
    }

    createIdentifierReferenceAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptIdentifierCstToAst.createIdentifierReferenceAst(cst)
    }

    createIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptIdentifierCstToAst.createIdentifierAst(cst)
    }

    // === literal / LiteralCstToAst ===

    createBooleanLiteralAst(cst: SubhutiCst): SlimeJavascriptLiteral {
        return SlimeJavascriptLiteralCstToAst.createBooleanLiteralAst(cst)
    }

    createNumericLiteralAst(cst: SubhutiCst): SlimeJavascriptNumericLiteral {
        return SlimeJavascriptLiteralCstToAst.createNumericLiteralAst(cst)
    }

    createStringLiteralAst(cst: SubhutiCst): SlimeJavascriptStringLiteral {
        return SlimeJavascriptLiteralCstToAst.createStringLiteralAst(cst)
    }

    createRegExpLiteralAst(cst: SubhutiCst): any {
        return SlimeJavascriptLiteralCstToAst.createRegExpLiteralAst(cst)
    }

    createLiteralFromToken(token: any): SlimeJavascriptExpression {
        return SlimeJavascriptLiteralCstToAst.createLiteralFromToken(token)
    }

    createLiteralAst(cst: SubhutiCst): SlimeJavascriptLiteral {
        return SlimeJavascriptLiteralCstToAst.createLiteralAst(cst)
    }

    createElisionAst(cst: SubhutiCst): number {
        return SlimeJavascriptLiteralCstToAst.createElisionAst(cst)
    }

    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeJavascriptExpression[]): void {
        return SlimeJavascriptLiteralCstToAst.processTemplateMiddleList(cst, quasis, expressions)
    }

    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeJavascriptExpression[]): void {
        return SlimeJavascriptLiteralCstToAst.processTemplateSpans(cst, quasis, expressions)
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptLiteralCstToAst.createTemplateLiteralAst(cst)
    }

    // === literal / CompoundLiteralCstToAst ===

    createPropertyNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression {
        return SlimeJavascriptCompoundLiteralCstToAst.createPropertyNameAst(cst)
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return SlimeJavascriptCompoundLiteralCstToAst.createLiteralPropertyNameAst(cst)
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeJavascriptSpreadElement {
        return SlimeJavascriptCompoundLiteralCstToAst.createSpreadElementAst(cst)
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeJavascriptArrayElement> {
        return SlimeJavascriptCompoundLiteralCstToAst.createElementListAst(cst)
    }

    createArrayLiteralAst(cst: SubhutiCst): SlimeJavascriptArrayExpression {
        return SlimeJavascriptCompoundLiteralCstToAst.createArrayLiteralAst(cst)
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeJavascriptObjectExpression {
        return SlimeJavascriptCompoundLiteralCstToAst.createObjectLiteralAst(cst)
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeJavascriptProperty {
        return SlimeJavascriptCompoundLiteralCstToAst.createPropertyDefinitionAst(cst)
    }

    // === pattern / BindingPatternCstToAst ===

    createBindingElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptBindingPatternCstToAst.createBindingElementAst(cst)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        return SlimeJavascriptBindingPatternCstToAst.createSingleNameBindingAst(cst)
    }

    createBindingRestPropertyAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        return SlimeJavascriptBindingPatternCstToAst.createBindingRestPropertyAst(cst)
    }

    createBindingPropertyAst(cst: SubhutiCst): any {
        return SlimeJavascriptBindingPatternCstToAst.createBindingPropertyAst(cst)
    }

    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptBindingPatternCstToAst.createBindingPropertyListAst(cst)
    }

    createBindingElementListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptBindingPatternCstToAst.createBindingElementListAst(cst)
    }

    createBindingElisionElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptBindingPatternCstToAst.createBindingElisionElementAst(cst)
    }

    createBindingPatternAst(cst: SubhutiCst): SlimeJavascriptPattern {
        return SlimeJavascriptBindingPatternCstToAst.createBindingPatternAst(cst)
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return SlimeJavascriptBindingPatternCstToAst.createArrayBindingPatternAst(cst)
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return SlimeJavascriptBindingPatternCstToAst.createObjectBindingPatternAst(cst)
    }

    // === pattern / AssignmentPatternCstToAst ===

    createAssignmentPatternAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentPatternAst(cst)
    }

    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return SlimeJavascriptAssignmentPatternCstToAst.createObjectAssignmentPatternAst(cst)
    }

    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return SlimeJavascriptAssignmentPatternCstToAst.createArrayAssignmentPatternAst(cst)
    }

    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentPropertyListAst(cst)
    }

    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentPropertyAst(cst)
    }

    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentElementListAst(cst)
    }

    createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentElementAst(cst)
    }

    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentElisionElementAst(cst)
    }

    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentRestElementAst(cst)
    }

    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeJavascriptAssignmentPatternCstToAst.createAssignmentRestPropertyAst(cst)
    }

    // === pattern / PatternConvertCstToAst ===

    convertArrayExpressionToPattern(expr: any): SlimeJavascriptArrayPattern {
        return SlimeJavascriptPatternConvertCstToAst.convertArrayExpressionToPattern(expr)
    }

    convertCstToPattern(cst: SubhutiCst): SlimeJavascriptPattern | null {
        return SlimeJavascriptPatternConvertCstToAst.convertCstToPattern(cst)
    }

    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimeJavascriptPattern | null {
        return SlimeJavascriptPatternConvertCstToAst.convertCoverParameterCstToPattern(cst, hasEllipsis)
    }

    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return SlimeJavascriptPatternConvertCstToAst.convertObjectLiteralToPattern(cst)
    }

    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeJavascriptAssignmentProperty | null {
        return SlimeJavascriptPatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(cst)
    }

    convertObjectExpressionToPattern(expr: any): SlimeJavascriptObjectPattern {
        return SlimeJavascriptPatternConvertCstToAst.convertObjectExpressionToPattern(expr)
    }

    convertAssignmentExpressionToPattern(expr: any): any {
        return SlimeJavascriptPatternConvertCstToAst.convertAssignmentExpressionToPattern(expr)
    }

    convertExpressionToPatternFromAST(expr: any): SlimeJavascriptPattern | null {
        return SlimeJavascriptPatternConvertCstToAst.convertExpressionToPatternFromAST(expr)
    }

    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return SlimeJavascriptPatternConvertCstToAst.convertArrayLiteralToPattern(cst)
    }

    convertExpressionToPattern(expr: any): SlimeJavascriptPattern {
        return SlimeJavascriptPatternConvertCstToAst.convertExpressionToPattern(expr)
    }

    // === expression / ExpressionCstToAst ===

    createYieldExpressionAst(cst: SubhutiCst): any {
        return SlimeJavascriptUnaryExpressionCstToAst.createYieldExpressionAst(cst)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return SlimeJavascriptUnaryExpressionCstToAst.createAwaitExpressionAst(cst)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createConditionalExpressionAst(cst)
    }

    // === expression / PrimaryExpressionCstToAst ===

    createComputedPropertyNameAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptCompoundLiteralCstToAst.createComputedPropertyNameAst(cst)
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptPrimaryExpressionCstToAst.createPrimaryExpressionAst(cst)
    }

    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptPrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst)
    }

    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptPrimaryExpressionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
    }

    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return SlimeJavascriptCompoundLiteralCstToAst.createCoverInitializedNameAst(cst)
    }

    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createLeftHandSideExpressionAst(cst)
    }

    // === expression / AssignmentExpressionCstToAst ===

    createExpressionBodyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createExpressionBodyAst(cst)
    }

    createAssignmentExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createAssignmentExpressionAst(cst)
    }

    createExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const cached = this.expressionAstCache.get(cst)
        if (cached) {
            return cached
        }
        const result = this.createExpressionAstUncached(cst)
        this.expressionAstCache.set(cst, result)
        return result
    }

    createExpressionAstUncached(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createExpressionAstUncached(cst)
    }

    // === expression / BinaryExpressionCstToAst ===

    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return SlimeJavascriptBinaryExpressionCstToAst.createMultiplicativeOperatorAst(cst)
    }

    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return SlimeJavascriptExpressionCstToAst.createAssignmentOperatorAst(cst)
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createExponentiationExpressionAst(cst)
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createLogicalORExpressionAst(cst)
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createLogicalANDExpressionAst(cst)
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createBitwiseORExpressionAst(cst)
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst)
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst)
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createEqualityExpressionAst(cst)
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createRelationalExpressionAst(cst)
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createShiftExpressionAst(cst)
    }

    createCoalesceExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createCoalesceExpressionAst(cst)
    }

    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
    }

    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createShortCircuitExpressionAst(cst)
    }

    createShortCircuitExpressionTailAst(left: SlimeJavascriptExpression, tailCst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
    }

    // === expression / UnaryExpressionCstToAst ===

    createUnaryExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptUnaryExpressionCstToAst.createUnaryExpressionAst(cst)
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptUnaryExpressionCstToAst.createUpdateExpressionAst(cst)
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createAdditiveExpressionAst(cst)
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptBinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst)
    }

    // === expression / MemberCallCstToAst ===

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeJavascriptExpression | SlimeJavascriptSuper {
        return SlimeJavascriptMemberCallCstToAst.createMemberExpressionFirstOr(cst)
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createMemberExpressionAst(cst)
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        return SlimeJavascriptMemberCallCstToAst.createArgumentsAst(cst)
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeJavascriptCallArgument> {
        return SlimeJavascriptMemberCallCstToAst.createArgumentListAst(cst)
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createCallExpressionAst(cst)
    }

    createCallMemberExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createCallMemberExpressionAst(cst)
    }

    createNewExpressionAst(cst: SubhutiCst): any {
        return SlimeJavascriptMemberCallCstToAst.createNewExpressionAst(cst)
    }

    createSuperCallAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createSuperCallAst(cst)
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createSuperPropertyAst(cst)
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptMemberCallCstToAst.createMetaPropertyAst(cst)
    }

    // === expression / OptionalExpressionCstToAst ===

    createOptionalChainAst(object: SlimeJavascriptExpression, chainCst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptOptionalExpressionCstToAst.createOptionalChainAst(object, chainCst)
    }

    createOptionalExpressionAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptOptionalExpressionCstToAst.createOptionalExpressionAst(cst)
    }

    // === function / ArrowFunctionCstToAst ===

    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeJavascriptBlockStatement | SlimeJavascriptExpression {
        return SlimeJavascriptFunctionBodyCstToAst.createAsyncConciseBodyAst(cst)
    }

    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        return SlimeJavascriptArrowFunctionCstToAst.createAsyncArrowHeadAst(cst)
    }

    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptArrowFunctionCstToAst.createAsyncArrowBindingIdentifierAst(cst)
    }

    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        return SlimeJavascriptPrimaryExpressionCstToAst.findFirstIdentifierInExpression(cst)
    }

    extractParametersFromExpression(expressionCst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptFunctionParameterCstToAst.extractParametersFromExpression(expressionCst)
    }

    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptArrowFunctionCstToAst.createArrowParametersFromCoverGrammar(cst)
    }

    createArrowFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptArrowFunctionCstToAst.createArrowFormalParametersAst(cst)
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptArrowFunctionCstToAst.createArrowFormalParametersAstWrapped(cst)
    }

    createArrowParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptArrowFunctionCstToAst.createArrowParametersAst(cst)
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeJavascriptArrowFunctionExpression {
        return SlimeJavascriptArrowFunctionCstToAst.createArrowFunctionAst(cst)
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeJavascriptArrowFunctionExpression {
        return SlimeJavascriptArrowFunctionCstToAst.createAsyncArrowFunctionAst(cst)
    }

    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptArrowFunctionCstToAst.createAsyncArrowParamsFromCover(cst)
    }

    createConciseBodyAst(cst: SubhutiCst): SlimeJavascriptBlockStatement | SlimeJavascriptExpression {
        return SlimeJavascriptFunctionBodyCstToAst.createConciseBodyAst(cst)
    }

    // === function / FunctionExpressionCstToAst ===

    createFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return SlimeJavascriptFunctionExpressionCstToAst.createFunctionExpressionAst(cst)
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return SlimeJavascriptFunctionExpressionCstToAst.createGeneratorExpressionAst(cst)
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return SlimeJavascriptFunctionExpressionCstToAst.createAsyncFunctionExpressionAst(cst)
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeJavascriptFunctionExpression {
        return SlimeJavascriptFunctionExpressionCstToAst.createAsyncGeneratorExpressionAst(cst)
    }

    // === function / FunctionParameterCstToAst ===

    createBindingRestElementAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        return SlimeJavascriptPatternConvertCstToAst.createBindingRestElementAst(cst)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        return SlimeJavascriptFunctionParameterCstToAst.createFunctionRestParameterAst(cst)
    }

    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeJavascriptRestElement {
        return SlimeJavascriptFunctionParameterCstToAst.createFunctionRestParameterAstAlt(cst)
    }

    createFormalParameterAst(cst: SubhutiCst): SlimeJavascriptPattern {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParameterAst(cst)
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParameterListAst(cst)
    }

    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParameterListAstWrapped(cst)
    }

    createFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParametersAst(cst)
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParametersAstWrapped(cst)
    }

    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptFunctionParameterCstToAst.createFormalParameterListFromEs2025Wrapped(cst)
    }

    createUniqueFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptFunctionParameterCstToAst.createUniqueFormalParametersAst(cst)
    }

    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptFunctionParameterCstToAst.createUniqueFormalParametersAstWrapped(cst)
    }

    // === declaration / FunctionDeclarationCstToAst ===

    createFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return SlimeJavascriptFunctionDeclarationCstToAst.createFunctionDeclarationAst(cst)
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return SlimeJavascriptFunctionDeclarationCstToAst.createGeneratorDeclarationAst(cst)
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return SlimeJavascriptFunctionDeclarationCstToAst.createAsyncFunctionDeclarationAst(cst)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeJavascriptFunctionDeclaration {
        return SlimeJavascriptFunctionDeclarationCstToAst.createAsyncGeneratorDeclarationAst(cst)
    }

    // === declaration / VariableCstToAst ===

    createLetOrConstAst(cst: SubhutiCst): string {
        return SlimeJavascriptVariableCstToAst.createLetOrConstAst(cst)
    }

    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeJavascriptVariableDeclaration {
        return SlimeJavascriptVariableCstToAst.createVariableDeclarationFromList(cst, kind)
    }

    createForBindingAst(cst: SubhutiCst): any {
        return SlimeJavascriptVariableCstToAst.createForBindingAst(cst)
    }

    createForDeclarationAst(cst: SubhutiCst): any {
        return SlimeJavascriptVariableCstToAst.createForDeclarationAst(cst)
    }

    createInitializerAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptVariableCstToAst.createInitializerAst(cst)
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return SlimeJavascriptVariableCstToAst.createVariableDeclaratorAst(cst)
    }

    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return SlimeJavascriptVariableCstToAst.createVariableDeclaratorFromVarDeclaration(cst)
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator[] {
        return SlimeJavascriptVariableCstToAst.createVariableDeclarationListAst(cst)
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        return SlimeJavascriptVariableCstToAst.createLexicalBindingAst(cst)
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return SlimeJavascriptVariableCstToAst.createLexicalDeclarationAst(cst)
    }

    createVariableDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return SlimeJavascriptVariableCstToAst.createVariableDeclarationAst(cst)
    }

    createVariableStatementAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        return SlimeJavascriptVariableCstToAst.createVariableStatementAst(cst)
    }

    createDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        return SlimeJavascriptVariableCstToAst.createDeclarationAst(cst)
    }

    createHoistableDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        return SlimeJavascriptVariableCstToAst.createHoistableDeclarationAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===

    createClassElementNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral | SlimeJavascriptExpression {
        return SlimeJavascriptClassDeclarationCstToAst.createClassElementNameAst(cst)
    }

    isComputedPropertyName(cst: SubhutiCst): boolean {
        return SlimeJavascriptClassDeclarationCstToAst.isComputedPropertyName(cst)
    }

    isStaticModifier(cst: SubhutiCst | null): boolean {
        return SlimeJavascriptClassDeclarationCstToAst.isStaticModifier(cst)
    }

    createClassDeclarationAst(cst: SubhutiCst): SlimeJavascriptClassDeclaration {
        return SlimeJavascriptClassDeclarationCstToAst.createClassDeclarationAst(cst)
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeJavascriptExpression | null;
        body: SlimeJavascriptClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        return SlimeJavascriptClassDeclarationCstToAst.createClassTailAst(cst)
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptClassDeclarationCstToAst.createClassHeritageAst(cst)
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeJavascriptExpression; extendsToken?: any } {
        return SlimeJavascriptClassDeclarationCstToAst.createClassHeritageAstWithToken(cst)
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptPropertyDefinition {
        return SlimeJavascriptClassDeclarationCstToAst.createFieldDefinitionAst(staticCst, cst)
    }

    createClassBodyAst(cst: SubhutiCst): SlimeJavascriptClassBody {
        return SlimeJavascriptClassDeclarationCstToAst.createClassBodyAst(cst)
    }

    createClassStaticBlockAst(cst: SubhutiCst): any {
        return SlimeJavascriptClassDeclarationCstToAst.createClassStaticBlockAst(cst)
    }

    createClassElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptClassDeclarationCstToAst.createClassElementAst(cst)
    }

    createClassElementListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptClassDeclarationCstToAst.createClassElementListAst(cst)
    }

    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptClassDeclarationCstToAst.createClassStaticBlockBodyAst(cst)
    }

    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptClassDeclarationCstToAst.createClassStaticBlockStatementListAst(cst)
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeJavascriptClassExpression {
        return SlimeJavascriptClassDeclarationCstToAst.createClassExpressionAst(cst)
    }

    // === class / MethodDefinitionCstToAst ===

    createPropertySetParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        return SlimeJavascriptMethodDefinitionCstToAst.createPropertySetParameterListAst(cst)
    }

    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        return SlimeJavascriptMethodDefinitionCstToAst.createPropertySetParameterListAstWrapped(cst)
    }

    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionAstInternal(cst, kind, generator, async)
    }

    createGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createGeneratorMethodAst(cst)
    }

    createAsyncMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createAsyncMethodAst(cst)
    }

    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createAsyncGeneratorMethodAst(cst)
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, cst)
    }

    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionClassElementNameAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionGetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionSetterMethodAst(staticCst, cst)
    }

    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionGeneratorMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
    }

    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeJavascriptMethodDefinition {
        return SlimeJavascriptMethodDefinitionCstToAst.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
    }

    // === statement / BlockCstToAst ===

    createBlockAst(cst: SubhutiCst): SlimeJavascriptBlockStatement {
        return SlimeJavascriptBlockCstToAst.createBlockAst(cst)
    }

    createBlockStatementAst(cst: SubhutiCst): SlimeJavascriptBlockStatement {
        return SlimeJavascriptBlockCstToAst.createBlockStatementAst(cst)
    }

    createStatementDeclarationAst(cst: SubhutiCst): any {
        return SlimeJavascriptBlockCstToAst.createStatementDeclarationAst(cst)
    }

    createStatementAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptBlockCstToAst.createStatementAst(cst)
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptBlockCstToAst.createStatementListItemAst(cst)
    }

    createStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptBlockCstToAst.createStatementListAst(cst)
    }

    // === statement / ControlFlowCstToAst ===

    createBreakableStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createBreakableStatementAst(cst)
    }

    createIterationStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createIterationStatementAst(cst)
    }

    createIfStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createIfStatementAst(cst)
    }

    createIfStatementBodyAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createIfStatementBodyAst(cst)
    }

    createForStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createForStatementAst(cst)
    }

    createForInOfStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createForInOfStatementAst(cst)
    }

    createWhileStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createWhileStatementAst(cst)
    }

    createDoWhileStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createDoWhileStatementAst(cst)
    }

    createSwitchStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createSwitchStatementAst(cst)
    }

    // === statement / FunctionBodyCstToAst ===

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptFunctionBodyCstToAst.createFunctionStatementListAst(cst)
    }

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptFunctionBodyCstToAst.createFunctionBodyAst(cst)
    }

    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptFunctionBodyCstToAst.createGeneratorBodyAst(cst)
    }

    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptFunctionBodyCstToAst.createAsyncFunctionBodyAst(cst)
    }

    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeJavascriptFunctionBodyCstToAst.createAsyncGeneratorBodyAst(cst)
    }

    // === statement / OtherStatementCstToAst ===

    createSemicolonASIAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createSemicolonASIAst(cst)
    }

    createEmptyStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createEmptyStatementAst(cst)
    }

    createThrowStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createThrowStatementAst(cst)
    }

    createBreakStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createBreakStatementAst(cst)
    }

    createContinueStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createContinueStatementAst(cst)
    }

    createTryStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createTryStatementAst(cst)
    }

    createFinallyAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createFinallyAst(cst)
    }

    createCatchAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createCatchAst(cst)
    }

    createCatchParameterAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createCatchParameterAst(cst)
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeJavascriptReturnStatement {
        return SlimeJavascriptOtherStatementCstToAst.createReturnStatementAst(cst)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeJavascriptExpressionStatement {
        return SlimeJavascriptOtherStatementCstToAst.createExpressionStatementAst(cst)
    }

    createLabelledStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createLabelledStatementAst(cst)
    }

    createWithStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createWithStatementAst(cst)
    }

    createDebuggerStatementAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createDebuggerStatementAst(cst)
    }

    createLabelledItemAst(cst: SubhutiCst): any {
        return SlimeJavascriptOtherStatementCstToAst.createLabelledItemAst(cst)
    }

    // === statement / SwitchCstToAst ===

    createCaseClauseAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createCaseClauseAst(cst)
    }

    createDefaultClauseAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createDefaultClauseAst(cst)
    }

    createCaseClausesAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptControlFlowCstToAst.createCaseClausesAst(cst)
    }

    createCaseBlockAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptControlFlowCstToAst.createCaseBlockAst(cst)
    }

    createSwitchCaseAst(cst: SubhutiCst): any {
        return SlimeJavascriptControlFlowCstToAst.createSwitchCaseAst(cst)
    }

    extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        return SlimeJavascriptControlFlowCstToAst.extractCasesFromCaseBlock(caseBlockCst)
    }

    // === module / ExportCstToAst ===

    createExportFromClauseAst(cst: SubhutiCst): any {
        return SlimeJavascriptExportCstToAst.createExportFromClauseAst(cst)
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeJavascriptExportDefaultDeclaration | SlimeJavascriptExportNamedDeclaration | SlimeJavascriptExportAllDeclaration {
        return SlimeJavascriptExportCstToAst.createExportDeclarationAst(cst)
    }

    createNamedExportsAst(cst: SubhutiCst): SlimeJavascriptExportSpecifierItem[] {
        return SlimeJavascriptExportCstToAst.createNamedExportsAst(cst)
    }

    createExportsListAst(cst: SubhutiCst): SlimeJavascriptExportSpecifierItem[] {
        return SlimeJavascriptExportCstToAst.createExportsListAst(cst)
    }

    createExportSpecifierAst(cst: SubhutiCst): SlimeJavascriptExportSpecifier {
        return SlimeJavascriptExportCstToAst.createExportSpecifierAst(cst)
    }

    createModuleExportNameAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return SlimeJavascriptExportCstToAst.createModuleExportNameAst(cst)
    }

    // === module / ImportCstToAst ===

    createImportCallAst(cst: SubhutiCst): SlimeJavascriptExpression {
        return SlimeJavascriptImportCstToAst.createImportCallAst(cst)
    }

    createNameSpaceImportAst(cst: SubhutiCst): SlimeJavascriptImportNamespaceSpecifier {
        return SlimeJavascriptImportCstToAst.createNameSpaceImportAst(cst)
    }

    createNamedImportsAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        return SlimeJavascriptImportCstToAst.createNamedImportsAst(cst)
    }

    createImportsListAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        return SlimeJavascriptImportCstToAst.createImportsListAst(cst)
    }

    createImportSpecifierAst(cst: SubhutiCst): SlimeJavascriptImportSpecifier {
        return SlimeJavascriptImportCstToAst.createImportSpecifierAst(cst)
    }

    createAttributeKeyAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        return SlimeJavascriptImportCstToAst.createAttributeKeyAst(cst)
    }

    createWithEntriesAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptImportCstToAst.createWithEntriesAst(cst)
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeJavascriptImportDeclaration {
        return SlimeJavascriptImportCstToAst.createImportDeclarationAst(cst)
    }

    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return SlimeJavascriptImportCstToAst.createWithClauseAst(cst)
    }

    createFromClauseAst(cst: SubhutiCst): { source: SlimeJavascriptStringLiteral, fromToken?: any } {
        return SlimeJavascriptImportCstToAst.createFromClauseAst(cst)
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeJavascriptStringLiteral {
        return SlimeJavascriptImportCstToAst.createModuleSpecifierAst(cst)
    }

    createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return SlimeJavascriptImportCstToAst.createImportClauseAst(cst)
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeJavascriptImportDefaultSpecifier {
        return SlimeJavascriptImportCstToAst.createImportedDefaultBindingAst(cst)
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        return SlimeJavascriptImportCstToAst.createImportedBindingAst(cst)
    }

    createNamedImportsListAstWrapped(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        return SlimeJavascriptImportCstToAst.createNamedImportsListAstWrapped(cst)
    }

    // === module / ModuleCstToAst ===

    createProgramAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.createProgramAst(cst)
    }

    createScriptAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.createScriptAst(cst)
    }

    createScriptBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.createScriptBodyAst(cst)
    }

    createModuleAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.createModuleAst(cst)
    }

    createModuleBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.createModuleBodyAst(cst)
    }

    createModuleItemAst(item: SubhutiCst): SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration | SlimeJavascriptStatement[] | undefined {
        return SlimeJavascriptModuleCstToAst.createModuleItemAst(item)
    }

    toProgram(cst: SubhutiCst): SlimeJavascriptProgram {
        return SlimeJavascriptModuleCstToAst.toProgram(cst)
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration> {
        return SlimeJavascriptModuleCstToAst.createModuleItemListAst(cst)
    }

    // === class / ClassDeclarationCstToAst ===
}

const SlimeJavascriptCstToAstUtil = new SlimeJavascriptCstToAst()

export default SlimeJavascriptCstToAstUtil
