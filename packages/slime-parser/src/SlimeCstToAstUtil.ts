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
    type SlimeObjectExpression,
    type SlimeProperty,
    type SlimeNumericLiteral,
    type SlimeArrayExpression,
    type SlimeArrowFunctionExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "./SlimeParser";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";

// 导入所有 CST to AST 转换模块
import {
    SlimeCstToAstTools,
    IdentifierCstToAst,
    LiteralCstToAst,
    ExpressionCstToAst,
    StatementCstToAst,
    DeclarationCstToAst,
    FunctionCstToAst,
    ClassCstToAst,
    PropertyCstToAst,
    PatternCstToAst,
    ModuleCstToAst,
} from "./cstToAst";

// 导出工具函数（保持向后兼容）
export function checkCstName(cst: SubhutiCst, cstName: string) {
    return SlimeCstToAstTools.checkCstName(cst, cstName);
}

export function throwNewError(errorMsg: string = 'syntax error') {
    SlimeCstToAstTools.throwNewError(errorMsg);
}

/**
 * CST 转 AST 转换器
 *
 * ## 两层架构设计
 *
 * ### 第一层：AST 工厂层 (SlimeNodeCreate.ts / SlimeAstUtil)
 * - 与 ESTree AST 节点类型一一对应的纯粹创建方法
 * - 不依赖 CST 结构，只接收参数创建节点
 *
 * ### 第二层：CST 转换层 (本类 + cstToAst 模块)
 * - 与 CST 规则一一对应的转换方法 (createXxxAst)
 * - 解析 CST 结构，提取信息，调用 AST 工厂层
 * - 实际实现已提取到 cstToAst 文件夹中的各个模块
 * - 本类作为统一入口，转发调用到对应模块
 */
export class SlimeCstToAst {
    private readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>()

    // ==================== 标识符相关 - 转发到 IdentifierCstToAst ====================

    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierReferenceAst(cst);
    }

    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createLabelIdentifierAst(cst);
    }

    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierAst(cst);
    }

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierNameAst(cst);
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createBindingIdentifierAst(cst);
    }

    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst);
    }

    // ==================== 字面量相关 - 转发到 LiteralCstToAst ====================

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createLiteralAst(cst, this);
    }

    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createBooleanLiteralAst(cst);
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

    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        return LiteralCstToAst.createArrayLiteralAst(cst, this);
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return LiteralCstToAst.createElementListAst(cst, this);
    }

    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        return LiteralCstToAst.createObjectLiteralAst(cst, this);
    }

    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        return LiteralCstToAst.createTemplateLiteralAst(cst, this);
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return LiteralCstToAst.createLiteralPropertyNameAst(cst, this);
    }

    createElisionAst(cst: SubhutiCst): number {
        return LiteralCstToAst.createElisionAst(cst);
    }

    // ==================== 表达式相关 - 转发到 ExpressionCstToAst ====================

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createPrimaryExpressionAst(cst, this);
    }

    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createParenthesizedExpressionAst(cst, this);
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createConditionalExpressionAst(cst, this);
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createLogicalORExpressionAst(cst, this);
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createLogicalANDExpressionAst(cst, this);
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createBitwiseORExpressionAst(cst, this);
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createBitwiseXORExpressionAst(cst, this);
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createBitwiseANDExpressionAst(cst, this);
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createEqualityExpressionAst(cst, this);
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createRelationalExpressionAst(cst, this);
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createShiftExpressionAst(cst, this);
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createAdditiveExpressionAst(cst, this);
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createMultiplicativeExpressionAst(cst, this);
    }

    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createExponentiationExpressionAst(cst, this);
    }

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createUnaryExpressionAst(cst, this);
    }

    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createUpdateExpressionAst(cst, this);
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return ExpressionCstToAst.createSpreadElementAst(cst, this);
    }

    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoalesceExpressionAst(cst, this);
    }

    // ==================== 其他表达式方法（需要在本类实现） ====================

    createArgumentsAst(cst: SubhutiCst): any[] {
        // TODO: 实现 Arguments
        const args: any[] = []
        for (const child of cst.children || []) {
            if (child.name === 'LParen' || child.name === 'RParen' || 
                child.value === '(' || child.value === ')' ||
                child.value === ',') continue
            if (child.name === SlimeParser.prototype.ArgumentList?.name || child.name === 'ArgumentList') {
                for (const arg of child.children || []) {
                    if (arg.value === ',') continue
                    if (arg.name === SlimeParser.prototype.AssignmentExpression?.name) {
                        args.push(this.createAssignmentExpressionAst(arg))
                    } else if (arg.name === SlimeParser.prototype.SpreadElement?.name) {
                        args.push(this.createSpreadElementAst(arg))
                    }
                }
            }
        }
        return args
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 SuperProperty
        throw new Error('createSuperPropertyAst not implemented')
    }

    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 SuperCall
        throw new Error('createSuperCallAst not implemented')
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 MetaProperty
        throw new Error('createMetaPropertyAst not implemented')
    }

    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 ImportCall
        throw new Error('createImportCallAst not implemented')
    }

    createYieldExpressionAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 YieldExpression
        throw new Error('createYieldExpressionAst not implemented')
    }

    createAwaitExpressionAst(cst: SubhutiCst): SlimeExpression {
        // TODO: 实现 AwaitExpression
        throw new Error('createAwaitExpressionAst not implemented')
    }

    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        // 处理括号表达式
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return this.createExpressionAst(child)
            }
        }
        throw new Error('CoverParenthesizedExpressionAndArrowParameterList has no inner expression')
    }

    // ==================== 语句相关 - 转发到 StatementCstToAst ====================

    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        return StatementCstToAst.createBlockStatementAst(cst, this);
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        return StatementCstToAst.createReturnStatementAst(cst, this);
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        return StatementCstToAst.createExpressionStatementAst(cst, this);
    }

    createIfStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createIfStatementAst(cst, this);
    }

    createIfStatementBodyAst(cst: SubhutiCst): any {
        return StatementCstToAst.createIfStatementBodyAst(cst, this);
    }

    createWhileStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createWhileStatementAst(cst, this);
    }

    createDoWhileStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createDoWhileStatementAst(cst, this);
    }

    createBreakStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createBreakStatementAst(cst, this);
    }

    createContinueStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createContinueStatementAst(cst, this);
    }

    createThrowStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createThrowStatementAst(cst, this);
    }

    createTryStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createTryStatementAst(cst, this);
    }

    createCatchAst(cst: SubhutiCst): any {
        return StatementCstToAst.createCatchAst(cst, this);
    }

    createFinallyAst(cst: SubhutiCst): SlimeBlockStatement {
        return StatementCstToAst.createFinallyAst(cst, this);
    }

    createLabelledStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createLabelledStatementAst(cst, this);
    }

    createWithStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createWithStatementAst(cst, this);
    }

    createDebuggerStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createDebuggerStatementAst(cst);
    }

    createEmptyStatementAst(cst: SubhutiCst): any {
        return StatementCstToAst.createEmptyStatementAst(cst);
    }

    // ==================== 声明相关 - 转发到 DeclarationCstToAst ====================

    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return DeclarationCstToAst.createVariableDeclarationAst(cst, this);
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        return DeclarationCstToAst.createVariableDeclarationListAst(cst, this);
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return DeclarationCstToAst.createVariableDeclaratorAst(cst, this);
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return DeclarationCstToAst.createLexicalDeclarationAst(cst, this);
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return DeclarationCstToAst.createLexicalBindingAst(cst, this);
    }

    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        return DeclarationCstToAst.createInitializerAst(cst, this);
    }

    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return DeclarationCstToAst.createVariableStatementAst(cst, this);
    }

    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        return DeclarationCstToAst.createVariableDeclaratorFromVarDeclaration(cst, this);
    }

    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return DeclarationCstToAst.createDeclarationAst(cst, this);
    }

    createHoistableDeclarationAst(cst: SubhutiCst): any {
        return DeclarationCstToAst.createHoistableDeclarationAst(cst, this);
    }

    createLetOrConstAst(cst: SubhutiCst): string {
        return DeclarationCstToAst.createLetOrConstAst(cst);
    }

    // ==================== 函数相关 - 转发到 FunctionCstToAst ====================

    createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionCstToAst.createFunctionDeclarationAst(cst, this);
    }

    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createFunctionExpressionAst(cst, this);
    }

    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // 返回不带包装的参数数组
        const wrapped = FunctionCstToAst.createFormalParametersAstWrapped(cst, this);
        return wrapped.map(p => p.param);
    }

    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createFormalParametersAstWrapped(cst, this);
    }

    createFormalParameterListWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createFormalParameterListWrapped(cst, this);
    }

    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        return FunctionCstToAst.createFormalParameterAst(cst, this);
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        return FunctionCstToAst.createFunctionRestParameterAst(cst, this);
    }

    createFunctionBodyAst(cst: SubhutiCst): any[] {
        return FunctionCstToAst.createFunctionBodyAst(cst, this);
    }

    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return FunctionCstToAst.createArrowFunctionAst(cst, this);
    }

    createArrowParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createArrowParametersAstWrapped(cst, this);
    }

    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createArrowFormalParametersAstWrapped(cst, this);
    }

    createConciseBodyAst(cst: SubhutiCst): { body: SlimeBlockStatement | SlimeExpression; expression: boolean } {
        return FunctionCstToAst.createConciseBodyAst(cst, this);
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionCstToAst.createAsyncFunctionDeclarationAst(cst, this);
    }

    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createAsyncFunctionExpressionAst(cst, this);
    }

    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        return FunctionCstToAst.createAsyncArrowFunctionAst(cst, this);
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionCstToAst.createGeneratorDeclarationAst(cst, this);
    }

    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createGeneratorExpressionAst(cst, this);
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionCstToAst.createAsyncGeneratorDeclarationAst(cst, this);
    }

    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionCstToAst.createAsyncGeneratorExpressionAst(cst, this);
    }

    // ==================== 类相关 - 转发到 ClassCstToAst ====================

    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        return ClassCstToAst.createClassDeclarationAst(cst, this);
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        return ClassCstToAst.createClassExpressionAst(cst, this);
    }

    createClassTailAst(cst: SubhutiCst): any {
        return ClassCstToAst.createClassTailAst(cst, this);
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        return ClassCstToAst.createClassHeritageAst(cst, this);
    }

    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        return ClassCstToAst.createClassBodyAst(cst, this);
    }

    createClassElementListAst(cst: SubhutiCst): any[] {
        return ClassCstToAst.createClassElementListAst(cst, this);
    }

    createClassElementAst(cst: SubhutiCst): any {
        return ClassCstToAst.createClassElementAst(cst, this);
    }

    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return ClassCstToAst.createClassElementNameAst(cst, this);
    }

    createClassStaticBlockAst(cst: SubhutiCst): any {
        return ClassCstToAst.createClassStaticBlockAst(cst, this);
    }

    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassCstToAst.createClassStaticBlockBodyAst(cst, this);
    }

    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassCstToAst.createClassStaticBlockStatementListAst(cst, this);
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): any {
        return ClassCstToAst.createFieldDefinitionAst(staticCst, cst, this);
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionAst(staticCst, cst, this);
    }

    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createGeneratorMethodAst(cst, this);
    }

    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createAsyncMethodAst(cst, this);
    }

    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createAsyncGeneratorMethodAst(cst, this);
    }

    // ==================== 对象属性相关 - 转发到 PropertyCstToAst ====================

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return PropertyCstToAst.createPropertyDefinitionAst(cst, this);
    }

    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return PropertyCstToAst.createPropertyNameAst(cst, this);
    }

    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return PropertyCstToAst.createComputedPropertyNameAst(cst, this);
    }

    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return PropertyCstToAst.createPropertySetParameterListAst(cst, this);
    }

    // ==================== 解构模式相关 - 转发到 PatternCstToAst ====================

    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        return PatternCstToAst.createBindingPatternAst(cst, this);
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return PatternCstToAst.createArrayBindingPatternAst(cst, this);
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return PatternCstToAst.createObjectBindingPatternAst(cst, this);
    }

    createBindingElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createBindingElementAst(cst, this);
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        return PatternCstToAst.createSingleNameBindingAst(cst, this);
    }

    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        return PatternCstToAst.createBindingRestElementAst(cst, this);
    }

    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        return PatternCstToAst.createBindingRestPropertyAst(cst, this);
    }

    createBindingPropertyAst(cst: SubhutiCst): any {
        return PatternCstToAst.createBindingPropertyAst(cst, this);
    }

    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createBindingPropertyListAst(cst, this);
    }

    createBindingElementListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createBindingElementListAst(cst, this);
    }

    createBindingElisionElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createBindingElisionElementAst(cst, this);
    }

    createAssignmentPatternAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentPatternAst(cst, this);
    }

    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return PatternCstToAst.createObjectAssignmentPatternAst(cst, this);
    }

    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return PatternCstToAst.createArrayAssignmentPatternAst(cst, this);
    }

    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createAssignmentPropertyListAst(cst, this);
    }

    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentPropertyAst(cst, this);
    }

    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createAssignmentElementListAst(cst, this);
    }

    createAssignmentElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentElementAst(cst, this);
    }

    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentElisionElementAst(cst, this);
    }

    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentRestElementAst(cst, this);
    }

    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return PatternCstToAst.createAssignmentRestPropertyAst(cst, this);
    }

    // ==================== 模块相关 - 转发到 ModuleCstToAst ====================

    createProgramAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createProgramAst(cst, this);
    }

    createScriptAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createScriptAst(cst, this);
    }

    createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createScriptBodyAst(cst, this);
    }

    createModuleAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createModuleAst(cst, this);
    }

    createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        return ModuleCstToAst.createModuleBodyAst(cst, this);
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        return ModuleCstToAst.createModuleItemListAst(cst, this);
    }

    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        return ModuleCstToAst.createModuleItemAst(item, this);
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        return ModuleCstToAst.createImportDeclarationAst(cst, this);
    }

    createImportClauseAst(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        return ModuleCstToAst.createImportClauseAst(cst, this);
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        return ModuleCstToAst.createImportedDefaultBindingAst(cst, this);
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        return ModuleCstToAst.createImportedBindingAst(cst, this);
    }

    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        return ModuleCstToAst.createNameSpaceImportAst(cst, this);
    }

    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ModuleCstToAst.createNamedImportsAst(cst, this);
    }

    createNamedImportsListAstWrapped(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        return ModuleCstToAst.createNamedImportsListAstWrapped(cst, this);
    }

    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ModuleCstToAst.createImportsListAst(cst, this);
    }

    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        return ModuleCstToAst.createImportSpecifierAst(cst, this);
    }

    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        return ModuleCstToAst.createFromClauseAst(cst, this);
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        return ModuleCstToAst.createModuleSpecifierAst(cst);
    }

    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ModuleCstToAst.createModuleExportNameAst(cst, this);
    }

    createExportDeclarationAst(cst: SubhutiCst): any {
        return ModuleCstToAst.createExportDeclarationAst(cst, this);
    }

    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ModuleCstToAst.createNamedExportsAst(cst, this);
    }

    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ModuleCstToAst.createExportsListAst(cst, this);
    }

    createExportSpecifierAst(cst: SubhutiCst): any {
        return ModuleCstToAst.createExportSpecifierAst(cst, this);
    }

    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return ModuleCstToAst.createWithClauseAst(cst, this);
    }

    createWithEntriesAst(cst: SubhutiCst): any[] {
        return ModuleCstToAst.createWithEntriesAst(cst, this);
    }

    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ModuleCstToAst.createAttributeKeyAst(cst, this);
    }

    createExportFromClauseAst(cst: SubhutiCst): any {
        return ModuleCstToAst.createExportFromClauseAst(cst, this);
    }

    // ==================== 入口方法和核心分发方法 ====================

    /**
     * [入口方法] 将顶层 CST 转换为 Program AST
     */
    toProgram(cst: SubhutiCst): SlimeProgram {
        const isModule = cst.name === SlimeParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeProgram
        let hashbangComment: string | null = null

        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                       child.name === 'ModuleItemList' || child.name === SlimeParser.prototype.ModuleItemList?.name ||
                       child.name === 'StatementList' || child.name === SlimeParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeParser.prototype.ModuleItemList?.name)) {
                    const body = this.createModuleItemListAst(moduleItemList)
                    program = SlimeAstUtil.createProgram(body, 'module')
                } else {
                    program = SlimeAstUtil.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = this.createModuleItemListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    const body = this.createStatementListAst(statementList)
                    program = SlimeAstUtil.createProgram(body, 'script')
                } else {
                    program = SlimeAstUtil.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                const body = this.createStatementListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            program = SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    /**
     * 创建 StatementList 的 AST
     */
    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => this.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    /**
     * 创建 StatementListItem 的 AST
     */
    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            if (item.name === SlimeParser.prototype.Declaration?.name) {
                return [this.createDeclarationAst(item) as any]
            }
            const statement = this.createStatementAst(item)
            const result = statement.flat()
            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression
                    if (expr.type === SlimeNodeType.FunctionExpression) {
                        const funcExpr = expr as SlimeFunctionExpression
                        if (funcExpr.id) {
                            return {
                                type: SlimeNodeType.FunctionDeclaration,
                                id: funcExpr.id,
                                params: funcExpr.params,
                                body: funcExpr.body,
                                generator: funcExpr.generator,
                                async: funcExpr.async,
                                loc: funcExpr.loc
                            } as SlimeFunctionDeclaration
                        }
                    }
                    if (expr.type === SlimeNodeType.ClassExpression) {
                        const classExpr = expr as any
                        if (classExpr.id) {
                            return {
                                type: SlimeNodeType.ClassDeclaration,
                                id: classExpr.id,
                                superClass: classExpr.superClass,
                                body: classExpr.body,
                                loc: classExpr.loc
                            } as any
                        }
                    }
                }
                return stmt
            })
        }).flat()
        return statements
    }

    /**
     * 创建 Statement 的 AST
     */
    createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => this.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)
        return statements
    }

    /**
     * [核心分发方法] 根据 CST 节点类型创建对应的 Statement/Declaration AST
     */
    createStatementDeclarationAst(cst: SubhutiCst) {
        if (cst.name === SlimeParser.prototype.Statement?.name || cst.name === 'Statement') {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        else if (cst.name === SlimeParser.prototype.BreakableStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        else if (cst.name === SlimeParser.prototype.IterationStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        else if (cst.name === 'IfStatementBody') {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        else if (cst.name === SlimeParser.prototype.VariableStatement?.name || cst.name === 'VariableStatement') {
            return this.createVariableStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.VariableDeclaration?.name) {
            return this.createVariableDeclarationAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ExpressionStatement?.name) {
            return this.createExpressionStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ReturnStatement?.name) {
            return this.createReturnStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.IfStatement?.name) {
            return this.createIfStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ForStatement?.name) {
            return this.createForStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ForInOfStatement?.name) {
            return this.createForInOfStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.WhileStatement?.name) {
            return this.createWhileStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.DoWhileStatement?.name) {
            return this.createDoWhileStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            return this.createBlockStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.SwitchStatement?.name) {
            return this.createSwitchStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.TryStatement?.name) {
            return this.createTryStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ThrowStatement?.name) {
            return this.createThrowStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.BreakStatement?.name) {
            return this.createBreakStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ContinueStatement?.name) {
            return this.createContinueStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.LabelledStatement?.name) {
            return this.createLabelledStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.WithStatement?.name) {
            return this.createWithStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.DebuggerStatement?.name) {
            return this.createDebuggerStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.EmptyStatement?.name) {
            return this.createEmptyStatementAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.FunctionDeclaration?.name) {
            return this.createFunctionDeclarationAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.ClassDeclaration?.name) {
            return this.createClassDeclarationAst(cst)
        }
    }

    // ==================== 尚未提取到模块的方法（需要在本类实现） ====================

    /**
     * 创建 Expression 的 AST
     */
    createExpressionAst(cst: SubhutiCst): SlimeExpression {
        // 检查缓存
        const cached = this.expressionAstCache.get(cst)
        if (cached) return cached

        // 透传到子节点
        if (cst.children && cst.children.length === 1) {
            const result = this.createExpressionAst(cst.children[0])
            this.expressionAstCache.set(cst, result)
            return result
        }

        // 处理逗号表达式
        if (cst.children && cst.children.length > 1) {
            const expressions: SlimeExpression[] = []
            for (const child of cst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                expressions.push(this.createAssignmentExpressionAst(child))
            }
            if (expressions.length === 1) {
                return expressions[0]
            }
            return {
                type: SlimeNodeType.SequenceExpression,
                expressions,
                loc: cst.loc
            } as any
        }

        throw new Error(`createExpressionAst: Cannot handle CST ${cst.name}`)
    }

    /**
     * 创建 AssignmentExpression 的 AST
     */
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children && cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }

        // 处理赋值表达式
        if (cst.children && cst.children.length >= 3) {
            const left = this.createLeftHandSideExpressionAst(cst.children[0])
            const operator = cst.children[1].value
            const right = this.createAssignmentExpressionAst(cst.children[2])

            return {
                type: SlimeNodeType.AssignmentExpression,
                operator,
                left,
                right,
                loc: cst.loc
            } as any
        }

        return this.createExpressionAst(cst)
    }

    /**
     * 创建 LeftHandSideExpression 的 AST
     */
    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children && cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        }
        return this.createExpressionAst(cst)
    }

    /**
     * 创建 Block 的 AST
     */
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        const stmtListCst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.StatementList?.name || ch.name === 'StatementList'
        )
        const statements = stmtListCst ? this.createStatementListAst(stmtListCst) : []
        return SlimeAstUtil.createBlockStatement(statements, cst.loc)
    }

    /**
     * 创建 CatchParameter 的 AST
     */
    createCatchParameterAst(cst: SubhutiCst): SlimePattern | SlimeIdentifier {
        const first = cst.children?.[0]
        if (!first) throw new Error('CatchParameter has no children')

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier') {
            return this.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name || first.name === 'BindingPattern') {
            return this.createBindingPatternAst(first)
        }

        return this.createBindingIdentifierAst(first)
    }

    /**
     * 检查 PropertyName 是否是计算属性名
     */
    isComputedPropertyName(cst: SubhutiCst): boolean {
        return ClassCstToAst.isComputedPropertyName(cst);
    }

    /**
     * 创建 UniqueFormalParameters 的 AST
     */
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return this.createFormalParametersAst(cst);
    }

    /**
     * 创建 UniqueFormalParameters 的 AST（包装类型）
     */
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return this.createFormalParametersAstWrapped(cst);
    }

    // ==================== 占位方法（需要后续实现或已在其他地方实现） ====================

    createForStatementAst(cst: SubhutiCst): any {
        // TODO: 实现 ForStatement
        throw new Error('createForStatementAst not implemented - should be in StatementCstToAst')
    }

    createForInOfStatementAst(cst: SubhutiCst): any {
        // TODO: 实现 ForInOfStatement
        throw new Error('createForInOfStatementAst not implemented - should be in StatementCstToAst')
    }

    createSwitchStatementAst(cst: SubhutiCst): any {
        // TODO: 实现 SwitchStatement
        throw new Error('createSwitchStatementAst not implemented - should be in StatementCstToAst')
    }
}
