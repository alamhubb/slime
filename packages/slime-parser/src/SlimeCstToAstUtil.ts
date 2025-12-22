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

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        throw new Error('createCallExpressionAst not implemented');
    }
}

const SlimeCstToAstUtil = new SlimeCstToAst();

export default SlimeCstToAstUtil;
