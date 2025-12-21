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
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import SlimeParser from "./SlimeParser";
import SlimeTokenConsumer from "./SlimeTokenConsumer";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";

// 导入 CstToAst 类用于静态方法调用
import { IdentifierCstToAst } from "./cstToAst/IdentifierCstToAst";
import { LiteralCstToAst } from "./cstToAst/LiteralCstToAst";
import { ExpressionCstToAst } from "./cstToAst/ExpressionCstToAst";
import { StatementCstToAst } from "./cstToAst/StatementCstToAst";
import { DeclarationCstToAst } from "./cstToAst/DeclarationCstToAst";
import { FunctionCstToAst } from "./cstToAst/FunctionCstToAst";
import { ClassCstToAst } from "./cstToAst/ClassCstToAst";
import { PropertyCstToAst } from "./cstToAst/PropertyCstToAst";
import { PatternCstToAst } from "./cstToAst/PatternCstToAst";
import { ModuleCstToAst } from "./cstToAst/ModuleCstToAst";
import { TemplateCstToAst } from "./cstToAst/TemplateCstToAst";
import { OperatorCstToAst } from "./cstToAst/OperatorCstToAst";

// ============================================
// Unicode 转义序列解码
// ES2025 规范 12.9.4 - �?\uXXXX �?\u{XXXXX} 转换为实际字�?
// 参考实现：Babel、Acorn、TypeScript
// ============================================

/**
 * �?Unicode 转义序列解码为实际字�?
 * 支持 \uXXXX �?\u{XXXXX} 格式
 *
 * @param str 可能包含 Unicode 转义的字符串
 * @returns 解码后的字符�?
 */
function decodeUnicodeEscapes(str: string | undefined): string {
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

export function checkCstName(cst: SubhutiCst, cstName: string) {
    if (cst.name !== cstName) {
        throwNewError(cst.name)
    }
    return cstName
}

export function throwNewError(errorMsg: string = 'syntax error') {
    throw new Error(errorMsg)
}

/**
 * CST �?AST 转换�?
 *
 * ## 两层架构设计
 *
 * ### 第一层：AST 工厂�?(SlimeNodeCreate.ts / SlimeAstUtil)
 * - �?ESTree AST 节点类型一一对应的纯粹创建方�?
 * - 不依�?CST 结构，只接收参数创建节点
 * - 示例：createIdentifier(name, loc) �?SlimeIdentifier
 *
 * ### 第二层：CST 转换�?(本类)
 * - �?CST 规则一一对应的转换方�?(createXxxAst)
 * - 解析 CST 结构，提取信息，调用 AST 工厂�?
 * - 中心转发方法：createAstFromCst(cst) - 自动根据类型分发
 *
 * ## 方法命名规范
 *
 * | 方法类型 | 命名模式 | 说明 |
 * |----------|----------|------|
 * | CST 规则转换 | createXxxAst | �?@SubhutiRule 规则一一对应 |
 * | AST 类型映射 | createXxxAst | CST 规则�?�?AST 类型名时使用 |
 * | 内部辅助方法 | private createXxxAst | ES2025 专用处理�?|
 * | 工具方法 | convertXxx / isXxx | 表达式转模式、检查方法等 |
 *
 * ## 方法命名规范
 *
 * 所�?CST 转换方法命名�?createXxxAst，其�?Xxx �?CST 规则名一致�?
 * 内部调用 SlimeNodeCreate / SlimeAstUtil 中与 AST 类型名一致的工厂方法�?
 *
 * 例如�?
 * - createArrayLiteralAst (CST 规则�? �?内部调用 createArrayExpression (AST 类型�?
 * - createObjectLiteralAst (CST 规则�? �?内部调用 createObjectExpression (AST 类型�?
 * - createCatchAst (CST 规则�? �?内部调用 createCatchClause (AST 类型�?
 *
 * ## 核心分发方法
 * - createAstFromCst: 中心转发，根�?CST 类型显式分发到对应方�?
 * - createStatementDeclarationAst: 语句/声明分发
 *
 * ## 辅助处理方法
 * - toProgram: Program 入口处理
 */
export class SlimeCstToAst {
    private readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>()

    /**
     * 中心转发方法：根�?CST 节点类型显式分发到对应的转换方法
     *
     * 这是 CST �?AST 两层架构的核心入口：
     * - 第一层：AST 工厂�?(SlimeNodeCreate.ts) - 纯粹�?AST 节点创建
     * - 第二层：CST 转换�?(本类) - 解析 CST 结构，调�?AST 工厂�?
     *
     * @param cst CST 节点
     * @returns 对应�?AST 节点
     */
    createAstFromCst(cst: SubhutiCst): any {
        const name = cst.name

        // ==================== 标识符相关 ====================
        if (name === SlimeParser.prototype.IdentifierReference?.name) return IdentifierCstToAst.createIdentifierReferenceAst(cst)
        if (name === SlimeParser.prototype.BindingIdentifier?.name) return IdentifierCstToAst.createBindingIdentifierAst(cst)
        if (name === SlimeParser.prototype.LabelIdentifier?.name) return IdentifierCstToAst.createLabelIdentifierAst(cst)
        if (name === SlimeParser.prototype.Identifier?.name) return IdentifierCstToAst.createIdentifierAst(cst)
        if (name === SlimeParser.prototype.IdentifierName?.name) return IdentifierCstToAst.createIdentifierNameAst(cst)

        // ==================== 字面量相关 ====================
        if (name === SlimeParser.prototype.Literal?.name) return LiteralCstToAst.createLiteralAst(cst)
        if (name === SlimeParser.prototype.BooleanLiteral?.name) return LiteralCstToAst.createBooleanLiteralAst(cst)
        if (name === SlimeParser.prototype.ArrayLiteral?.name) return LiteralCstToAst.createArrayLiteralAst(cst)
        if (name === SlimeParser.prototype.ObjectLiteral?.name) return LiteralCstToAst.createObjectLiteralAst(cst)
        if (name === SlimeParser.prototype.TemplateLiteral?.name) return TemplateCstToAst.createTemplateLiteralAst(cst)
        if (name === SlimeParser.prototype.LiteralPropertyName?.name) return PropertyCstToAst.createLiteralPropertyNameAst(cst)
        if (name === SlimeTokenConsumer.prototype.NumericLiteral?.name) return LiteralCstToAst.createNumericLiteralAst(cst)
        if (name === SlimeTokenConsumer.prototype.StringLiteral?.name) return LiteralCstToAst.createStringLiteralAst(cst)
        if (name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name) return LiteralCstToAst.createRegExpLiteralAst(cst)

        // ==================== 表达式相�?====================
        // ==================== 表达式相关 ====================
        if (name === SlimeParser.prototype.PrimaryExpression?.name) return ExpressionCstToAst.createPrimaryExpressionAst(cst)
        if (name === SlimeParser.prototype.Expression?.name) return ExpressionCstToAst.createExpressionAst(cst)
        if (name === SlimeParser.prototype.AssignmentExpression?.name) return ExpressionCstToAst.createAssignmentExpressionAst(cst)
        if (name === SlimeParser.prototype.ConditionalExpression?.name) return ExpressionCstToAst.createConditionalExpressionAst(cst)
        if (name === SlimeParser.prototype.ShortCircuitExpression?.name) return ExpressionCstToAst.createShortCircuitExpressionAst(cst)
        if (name === SlimeParser.prototype.LogicalORExpression?.name) return ExpressionCstToAst.createLogicalORExpressionAst(cst)
        if (name === SlimeParser.prototype.LogicalANDExpression?.name) return ExpressionCstToAst.createLogicalANDExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseORExpression?.name) return ExpressionCstToAst.createBitwiseORExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseXORExpression?.name) return ExpressionCstToAst.createBitwiseXORExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseANDExpression?.name) return ExpressionCstToAst.createBitwiseANDExpressionAst(cst)
        if (name === SlimeParser.prototype.EqualityExpression?.name) return ExpressionCstToAst.createEqualityExpressionAst(cst)
        if (name === SlimeParser.prototype.RelationalExpression?.name) return ExpressionCstToAst.createRelationalExpressionAst(cst)
        if (name === SlimeParser.prototype.ShiftExpression?.name) return ExpressionCstToAst.createShiftExpressionAst(cst)
        if (name === SlimeParser.prototype.AdditiveExpression?.name) return ExpressionCstToAst.createAdditiveExpressionAst(cst)
        if (name === SlimeParser.prototype.MultiplicativeExpression?.name) return ExpressionCstToAst.createMultiplicativeExpressionAst(cst)
        if (name === SlimeParser.prototype.ExponentiationExpression?.name) return ExpressionCstToAst.createExponentiationExpressionAst(cst)
        if (name === SlimeParser.prototype.UnaryExpression?.name) return ExpressionCstToAst.createUnaryExpressionAst(cst)
        if (name === SlimeParser.prototype.UpdateExpression?.name) return ExpressionCstToAst.createUpdateExpressionAst(cst)
        if (name === SlimeParser.prototype.LeftHandSideExpression?.name) return ExpressionCstToAst.createLeftHandSideExpressionAst(cst)
        if (name === SlimeParser.prototype.NewExpression?.name) return ExpressionCstToAst.createNewExpressionAst(cst)
        if (name === SlimeParser.prototype.CallExpression?.name) return ExpressionCstToAst.createCallExpressionAst(cst)
        if (name === SlimeParser.prototype.CallMemberExpression?.name) return ExpressionCstToAst.createCallMemberExpressionAst(cst)
        if (name === SlimeParser.prototype.MemberExpression?.name) return ExpressionCstToAst.createMemberExpressionAst(cst)
        if (name === SlimeParser.prototype.OptionalExpression?.name) return ExpressionCstToAst.createOptionalExpressionAst(cst)
        // OptionalChain 需要 object 参数，不能直接从中心分发调用，应通过 OptionalExpression 处理
        if (name === SlimeParser.prototype.CoalesceExpression?.name) return ExpressionCstToAst.createCoalesceExpressionAst(cst)
        if (name === SlimeParser.prototype.CoalesceExpressionHead?.name) return ExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
        // ShortCircuitExpressionTail 需要 left 参数，通过 ShortCircuitExpression 处理
        if (name === SlimeParser.prototype.ParenthesizedExpression?.name) return ExpressionCstToAst.createParenthesizedExpressionAst(cst)
        if (name === SlimeParser.prototype.AwaitExpression?.name) return ExpressionCstToAst.createAwaitExpressionAst(cst)
        if (name === SlimeParser.prototype.YieldExpression?.name) return ExpressionCstToAst.createYieldExpressionAst(cst)
        if (name === SlimeParser.prototype.MetaProperty?.name) return ExpressionCstToAst.createMetaPropertyAst(cst)
        if (name === SlimeParser.prototype.SuperProperty?.name) return ExpressionCstToAst.createSuperPropertyAst(cst)
        if (name === SlimeParser.prototype.SuperCall?.name) return ExpressionCstToAst.createSuperCallAst(cst)
        if (name === SlimeParser.prototype.ImportCall?.name) return ExpressionCstToAst.createImportCallAst(cst)
        if (name === SlimeParser.prototype.SpreadElement?.name) return LiteralCstToAst.createSpreadElementAst(cst)
        if (name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) return FunctionCstToAst.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
        if (name === SlimeParser.prototype.CoverCallExpressionAndAsyncArrowHead?.name) return FunctionCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
        if (name === SlimeParser.prototype.CoverInitializedName?.name) return FunctionCstToAst.createCoverInitializedNameAst(cst)

        // ==================== 语句相关 ====================
        if (name === SlimeParser.prototype.Statement?.name) return StatementCstToAst.createStatementAst(cst)
        if (name === SlimeParser.prototype.StatementList?.name) return StatementCstToAst.createStatementListAst(cst)
        if (name === SlimeParser.prototype.StatementListItem?.name) return StatementCstToAst.createStatementListItemAst(cst)
        if (name === SlimeParser.prototype.Block?.name) return StatementCstToAst.createBlockAst(cst)
        if (name === SlimeParser.prototype.BlockStatement?.name) return StatementCstToAst.createBlockStatementAst(cst)
        if (name === SlimeParser.prototype.EmptyStatement?.name) return StatementCstToAst.createEmptyStatementAst(cst)
        if (name === SlimeParser.prototype.ExpressionStatement?.name) return StatementCstToAst.createExpressionStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatement?.name) return StatementCstToAst.createIfStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatementBody?.name) return StatementCstToAst.createIfStatementBodyAst(cst)
        if (name === SlimeParser.prototype.BreakableStatement?.name) return StatementCstToAst.createBreakableStatementAst(cst)
        if (name === SlimeParser.prototype.IterationStatement?.name) return StatementCstToAst.createIterationStatementAst(cst)
        if (name === SlimeParser.prototype.ForStatement?.name) return StatementCstToAst.createForStatementAst(cst)
        if (name === SlimeParser.prototype.ForInOfStatement?.name) return StatementCstToAst.createForInOfStatementAst(cst)
        if (name === SlimeParser.prototype.ForDeclaration?.name) return DeclarationCstToAst.createForDeclarationAst(cst)
        if (name === SlimeParser.prototype.ForBinding?.name) return DeclarationCstToAst.createForBindingAst(cst)
        if (name === SlimeParser.prototype.WhileStatement?.name) return StatementCstToAst.createWhileStatementAst(cst)
        if (name === SlimeParser.prototype.DoWhileStatement?.name) return StatementCstToAst.createDoWhileStatementAst(cst)
        if (name === SlimeParser.prototype.SwitchStatement?.name) return StatementCstToAst.createSwitchStatementAst(cst)
        if (name === SlimeParser.prototype.CaseBlock?.name) return StatementCstToAst.createCaseBlockAst(cst)
        if (name === SlimeParser.prototype.CaseClauses?.name) return StatementCstToAst.createCaseClausesAst(cst)
        if (name === SlimeParser.prototype.CaseClause?.name) return StatementCstToAst.createCaseClauseAst(cst)
        if (name === SlimeParser.prototype.DefaultClause?.name) return StatementCstToAst.createDefaultClauseAst(cst)
        if (name === SlimeParser.prototype.BreakStatement?.name) return StatementCstToAst.createBreakStatementAst(cst)
        if (name === SlimeParser.prototype.ContinueStatement?.name) return StatementCstToAst.createContinueStatementAst(cst)
        if (name === SlimeParser.prototype.ReturnStatement?.name) return StatementCstToAst.createReturnStatementAst(cst)
        if (name === SlimeParser.prototype.WithStatement?.name) return StatementCstToAst.createWithStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledStatement?.name) return StatementCstToAst.createLabelledStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledItem?.name) return DeclarationCstToAst.createLabelledItemAst(cst)
        if (name === SlimeParser.prototype.ThrowStatement?.name) return StatementCstToAst.createThrowStatementAst(cst)
        if (name === SlimeParser.prototype.TryStatement?.name) return StatementCstToAst.createTryStatementAst(cst)
        if (name === SlimeParser.prototype.Catch?.name) return StatementCstToAst.createCatchAst(cst)
        if (name === SlimeParser.prototype.CatchParameter?.name) return FunctionCstToAst.createCatchParameterAst(cst)
        if (name === SlimeParser.prototype.Finally?.name) return StatementCstToAst.createFinallyAst(cst)
        if (name === SlimeParser.prototype.DebuggerStatement?.name) return StatementCstToAst.createDebuggerStatementAst(cst)
        if (name === SlimeParser.prototype.SemicolonASI?.name) return StatementCstToAst.createSemicolonASIAst(cst)
        if (name === SlimeParser.prototype.ExpressionBody?.name) return OperatorCstToAst.createExpressionBodyAst(cst)

        // ==================== 声明相关 ====================
        if (name === SlimeParser.prototype.Declaration?.name) return DeclarationCstToAst.createDeclarationAst(cst)
        if (name === SlimeParser.prototype.HoistableDeclaration?.name) return DeclarationCstToAst.createHoistableDeclarationAst(cst)
        if (name === SlimeParser.prototype.VariableStatement?.name) return StatementCstToAst.createVariableStatementAst(cst)
        if (name === SlimeParser.prototype.VariableDeclaration?.name) return DeclarationCstToAst.createVariableDeclarationAst(cst)
        if (name === SlimeParser.prototype.VariableDeclarationList?.name) return DeclarationCstToAst.createVariableDeclarationListAst(cst)
        if (name === SlimeParser.prototype.LexicalDeclaration?.name) return DeclarationCstToAst.createLexicalDeclarationAst(cst)
        if (name === SlimeParser.prototype.LetOrConst?.name) return StatementCstToAst.createLetOrConstAst(cst)
        if (name === SlimeParser.prototype.LexicalBinding?.name) return DeclarationCstToAst.createLexicalBindingAst(cst)
        if (name === SlimeParser.prototype.Initializer?.name) return DeclarationCstToAst.createInitializerAst(cst)

        // ==================== 函数相关 ====================
        if (name === SlimeParser.prototype.FunctionDeclaration?.name) return DeclarationCstToAst.createFunctionDeclarationAst(cst)
        if (name === SlimeParser.prototype.FunctionExpression?.name) return FunctionCstToAst.createFunctionExpressionAst(cst)
        if (name === SlimeParser.prototype.FunctionBody?.name) return FunctionCstToAst.createFunctionBodyAst(cst)
        if (name === SlimeParser.prototype.FunctionStatementList?.name) return FunctionCstToAst.createFunctionStatementListAst(cst)
        if (name === SlimeParser.prototype.FormalParameters?.name) return FunctionCstToAst.createFormalParametersAst(cst)
        if (name === SlimeParser.prototype.FormalParameterList?.name) return FunctionCstToAst.createFormalParameterListAst(cst)
        if (name === SlimeParser.prototype.FormalParameter?.name) return FunctionCstToAst.createFormalParameterAst(cst)
        if (name === SlimeParser.prototype.FunctionRestParameter?.name) return FunctionCstToAst.createFunctionRestParameterAst(cst)
        if (name === SlimeParser.prototype.UniqueFormalParameters?.name) return FunctionCstToAst.createUniqueFormalParametersAst(cst)
        if (name === SlimeParser.prototype.ArrowFunction?.name) return FunctionCstToAst.createArrowFunctionAst(cst)
        if (name === SlimeParser.prototype.ArrowParameters?.name) return FunctionCstToAst.createArrowParametersAst(cst)
        if (name === SlimeParser.prototype.ArrowFormalParameters?.name) return FunctionCstToAst.createArrowFormalParametersAst(cst)
        if (name === SlimeParser.prototype.ConciseBody?.name) return FunctionCstToAst.createConciseBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionDeclaration?.name) return DeclarationCstToAst.createAsyncFunctionDeclarationAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionExpression?.name) return FunctionCstToAst.createAsyncFunctionExpressionAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionBody?.name) return FunctionCstToAst.createAsyncFunctionBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowFunction?.name) return FunctionCstToAst.createAsyncArrowFunctionAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowHead?.name) return FunctionCstToAst.createAsyncArrowHeadAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) return FunctionCstToAst.createAsyncArrowBindingIdentifierAst(cst)
        if (name === SlimeParser.prototype.AsyncConciseBody?.name) return FunctionCstToAst.createAsyncConciseBodyAst(cst)
        if (name === SlimeParser.prototype.GeneratorDeclaration?.name) return DeclarationCstToAst.createGeneratorDeclarationAst(cst)
        if (name === SlimeParser.prototype.GeneratorExpression?.name) return FunctionCstToAst.createGeneratorExpressionAst(cst)
        if (name === SlimeParser.prototype.GeneratorBody?.name) return FunctionCstToAst.createGeneratorBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name) return DeclarationCstToAst.createAsyncGeneratorDeclarationAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorExpression?.name) return FunctionCstToAst.createAsyncGeneratorExpressionAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorBody?.name) return FunctionCstToAst.createAsyncGeneratorBodyAst(cst)

        // ==================== 类相关 ====================
        if (name === SlimeParser.prototype.ClassDeclaration?.name) return ClassCstToAst.createClassDeclarationAst(cst)
        if (name === SlimeParser.prototype.ClassExpression?.name) return ClassCstToAst.createClassExpressionAst(cst)
        if (name === SlimeParser.prototype.ClassTail?.name) return ClassCstToAst.createClassTailAst(cst)
        if (name === SlimeParser.prototype.ClassHeritage?.name) return ClassCstToAst.createClassHeritageAst(cst)
        if (name === SlimeParser.prototype.ClassBody?.name) return ClassCstToAst.createClassBodyAst(cst)
        if (name === SlimeParser.prototype.ClassElementList?.name) return ClassCstToAst.createClassElementListAst(cst)
        if (name === SlimeParser.prototype.ClassElement?.name) return ClassCstToAst.createClassElementAst(cst)
        if (name === SlimeParser.prototype.ClassElementName?.name) return ClassCstToAst.createClassElementNameAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlock?.name) return ClassCstToAst.createClassStaticBlockAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlockBody?.name) return ClassCstToAst.createClassStaticBlockBodyAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlockStatementList?.name) return ClassCstToAst.createClassStaticBlockStatementListAst(cst)
        if (name === SlimeParser.prototype.MethodDefinition?.name) return ClassCstToAst.createMethodDefinitionAst(null, cst)
        if (name === SlimeParser.prototype.FieldDefinition?.name) return ClassCstToAst.createFieldDefinitionAst(null, cst)
        if (name === SlimeParser.prototype.GeneratorMethod?.name) return FunctionCstToAst.createGeneratorMethodAst(cst)
        if (name === SlimeParser.prototype.AsyncMethod?.name) return FunctionCstToAst.createAsyncMethodAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorMethod?.name) return FunctionCstToAst.createAsyncGeneratorMethodAst(cst)
        if (name === 'PrivateIdentifier') return IdentifierCstToAst.createPrivateIdentifierAst(cst)

        // ==================== 对象属性相关 ====================
        if (name === SlimeParser.prototype.PropertyDefinition?.name) return PropertyCstToAst.createPropertyDefinitionAst(cst)
        if (name === SlimeParser.prototype.PropertyName?.name) return PropertyCstToAst.createPropertyNameAst(cst)
        if (name === SlimeParser.prototype.ComputedPropertyName?.name) return FunctionCstToAst.createComputedPropertyNameAst(cst)
        if (name === SlimeParser.prototype.PropertySetParameterList?.name) return FunctionCstToAst.createPropertySetParameterListAst(cst)

        // ==================== 解构相关 ====================
        if (name === SlimeParser.prototype.BindingPattern?.name) return PatternCstToAst.createBindingPatternAst(cst)
        if (name === SlimeParser.prototype.ObjectBindingPattern?.name) return PatternCstToAst.createObjectBindingPatternAst(cst)
        if (name === SlimeParser.prototype.ArrayBindingPattern?.name) return PatternCstToAst.createArrayBindingPatternAst(cst)
        if (name === SlimeParser.prototype.BindingPropertyList?.name) return PatternCstToAst.createBindingPropertyListAst(cst)
        if (name === SlimeParser.prototype.BindingProperty?.name) return PatternCstToAst.createBindingPropertyAst(cst)
        if (name === SlimeParser.prototype.BindingElementList?.name) return PatternCstToAst.createBindingElementListAst(cst)
        if (name === SlimeParser.prototype.BindingElisionElement?.name) return PatternCstToAst.createBindingElisionElementAst(cst)
        if (name === SlimeParser.prototype.BindingElement?.name) return FunctionCstToAst.createBindingElementAst(cst)
        if (name === SlimeParser.prototype.BindingRestElement?.name) return FunctionCstToAst.createBindingRestElementAst(cst)
        if (name === SlimeParser.prototype.BindingRestProperty?.name) return PatternCstToAst.createBindingRestPropertyAst(cst)
        if (name === SlimeParser.prototype.SingleNameBinding?.name) return FunctionCstToAst.createSingleNameBindingAst(cst)
        if (name === SlimeParser.prototype.AssignmentPattern?.name) return PatternCstToAst.createAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.ObjectAssignmentPattern?.name) return PatternCstToAst.createObjectAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.ArrayAssignmentPattern?.name) return PatternCstToAst.createArrayAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.AssignmentPropertyList?.name) return ExpressionCstToAst.createAssignmentPropertyListAst(cst)
        if (name === SlimeParser.prototype.AssignmentProperty?.name) return ExpressionCstToAst.createAssignmentPropertyAst(cst)
        if (name === SlimeParser.prototype.AssignmentElementList?.name) return ExpressionCstToAst.createAssignmentElementListAst(cst)
        if (name === SlimeParser.prototype.AssignmentElisionElement?.name) return ExpressionCstToAst.createAssignmentElisionElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentElement?.name) return ExpressionCstToAst.createAssignmentElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentRestElement?.name) return ExpressionCstToAst.createAssignmentRestElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentRestProperty?.name) return ExpressionCstToAst.createAssignmentRestPropertyAst(cst)
        if (name === SlimeParser.prototype.Elision?.name) return LiteralCstToAst.createElisionAst(cst)
        if (name === SlimeParser.prototype.ElementList?.name) return LiteralCstToAst.createElementListAst(cst)

        // ==================== 模块相关 ====================
        if (name === SlimeParser.prototype.Module?.name) return ModuleCstToAst.createModuleAst(cst)
        if (name === SlimeParser.prototype.ModuleBody?.name) return ModuleCstToAst.createModuleBodyAst(cst)
        if (name === SlimeParser.prototype.ModuleItem?.name) return ModuleCstToAst.createModuleItemAst(cst)
        if (name === SlimeParser.prototype.ModuleItemList?.name) return ModuleCstToAst.createModuleItemListAst(cst)
        if (name === SlimeParser.prototype.ImportDeclaration?.name) return ModuleCstToAst.createImportDeclarationAst(cst)
        if (name === SlimeParser.prototype.ImportClause?.name) return ModuleCstToAst.createImportClauseAst(cst)
        if (name === SlimeParser.prototype.ImportedDefaultBinding?.name) return ModuleCstToAst.createImportedDefaultBindingAst(cst)
        if (name === SlimeParser.prototype.NameSpaceImport?.name) return ModuleCstToAst.createNameSpaceImportAst(cst)
        if (name === SlimeParser.prototype.NamedImports?.name) return ModuleCstToAst.createNamedImportsAst(cst)
        if (name === SlimeParser.prototype.ImportsList?.name) return ModuleCstToAst.createImportsListAst(cst)
        if (name === SlimeParser.prototype.ImportSpecifier?.name) return ModuleCstToAst.createImportSpecifierAst(cst)
        if (name === SlimeParser.prototype.ImportedBinding?.name) return ModuleCstToAst.createImportedBindingAst(cst)
        if (name === SlimeParser.prototype.ModuleSpecifier?.name) return ModuleCstToAst.createModuleSpecifierAst(cst)
        if (name === SlimeParser.prototype.FromClause?.name) return ModuleCstToAst.createFromClauseAst(cst)
        if (name === SlimeParser.prototype.ModuleExportName?.name) return ModuleCstToAst.createModuleExportNameAst(cst)
        if (name === SlimeParser.prototype.ExportDeclaration?.name) return ModuleCstToAst.createExportDeclarationAst(cst)
        if (name === SlimeParser.prototype.ExportFromClause?.name) return ModuleCstToAst.createExportFromClauseAst(cst)
        if (name === SlimeParser.prototype.NamedExports?.name) return ModuleCstToAst.createNamedExportsAst(cst)
        if (name === SlimeParser.prototype.ExportsList?.name) return ModuleCstToAst.createExportsListAst(cst)
        if (name === SlimeParser.prototype.ExportSpecifier?.name) return ModuleCstToAst.createExportSpecifierAst(cst)
        if (name === SlimeParser.prototype.WithClause?.name) return ModuleCstToAst.createWithClauseAst(cst)
        if (name === SlimeParser.prototype.WithEntries?.name) return ModuleCstToAst.createWithEntriesAst(cst)
        if (name === SlimeParser.prototype.AttributeKey?.name) return ModuleCstToAst.createAttributeKeyAst(cst)

        // ==================== 程序入口 ====================
        if (name === SlimeParser.prototype.Program?.name) return ModuleCstToAst.createProgramAst(cst)
        if (name === SlimeParser.prototype.Script?.name) return ModuleCstToAst.createScriptAst(cst)
        if (name === SlimeParser.prototype.ScriptBody?.name) return ModuleCstToAst.createScriptBodyAst(cst)

        // ==================== 参数列表相关 ====================
        if (name === SlimeParser.prototype.Arguments?.name) return FunctionCstToAst.createArgumentsAst(cst)
        if (name === SlimeParser.prototype.ArgumentList?.name) return FunctionCstToAst.createArgumentListAst(cst)

        // ==================== 运算符相关 ====================
        if (name === SlimeParser.prototype.AssignmentOperator?.name) return OperatorCstToAst.createAssignmentOperatorAst(cst)
        if (name === SlimeParser.prototype.MultiplicativeOperator?.name) return OperatorCstToAst.createMultiplicativeOperatorAst(cst)

        // ==================== 对于没有专门方法的 CST 节点，透传到子节点 ====================
        if (cst.children && cst.children.length === 1) {
            return this.createAstFromCst(cst.children[0])
        }

        throw new Error(`No conversion method found for CST node: ${name}`)
    }

    /**
     * 重置状态钩子方法
     *
     * [入口方法] 将顶层 CST 转换为 Program AST
     *
     * 存在必要性：这是外部调用的主入口，支持 Module、Script、Program 多种顶层 CST
     *
     * 注意：子类如需重置状态，应重写此方法，先调用自己的 resetState()，再调用 super.toProgram()
     */
    toProgram(cst: SubhutiCst): SlimeProgram {
        // Support both Module and Script entry points
        const isModule = cst.name === SlimeParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeProgram
        let hashbangComment: string | null = null

        // If children is empty, return empty program
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        // 遍历子节点，处理 HashbangComment 和主体内�?
        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                // 提取 Hashbang 注释的�?
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                child.name === 'ModuleItemList' || child.name === SlimeParser.prototype.ModuleItemList?.name ||
                child.name === 'StatementList' || child.name === SlimeParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        // 处理主体内容
        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeParser.prototype.ModuleItemList?.name)) {
                    const body = ModuleCstToAst.createModuleItemListAst(moduleItemList)
                    program = SlimeAstUtil.createProgram(body, 'module')
                } else {
                    program = SlimeAstUtil.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = ModuleCstToAst.createModuleItemListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    const body = StatementCstToAst.createStatementListAst(statementList)
                    program = SlimeAstUtil.createProgram(body, 'script')
                } else {
                    program = SlimeAstUtil.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                const body = StatementCstToAst.createStatementListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            // 没有主体内容（可能只�?HashbangComment�?
            program = SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        // 设置 hashbang 注释（如果存在）
        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    /*createImportClauseAst(cst: SubhutiCst.ts):Array<SlimeImportSpecifier | SlimeImportDefaultSpecifier | SlimeImportNamespaceSpecifier>{
    let astName = checkCstName(cst, Es2025Parser.prototype.ImportClause?.name);


  }*/

    /**
     * [核心分发方法] 根据 CST 节点类型创建对应的 Statement/Declaration AST
     * 委托给 StatementCstToAst.createStatementDeclarationAst 静态方法
     */
    createStatementDeclarationAst(cst: SubhutiCst) {
        return StatementCstToAst.createStatementDeclarationAst(cst)
    }

    /**
     * 委托给 DeclarationCstToAst.createLexicalBindingAst 静态方法
     */
    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return DeclarationCstToAst.createLexicalBindingAst(cst)
    }

    /**
     * 委托给 DeclarationCstToAst.createInitializerAst 静态方法
     */
    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        return DeclarationCstToAst.createInitializerAst(cst)
    }

    /**
     * 委托给 ClassCstToAst.createFieldDefinitionAst 静态方法
     */
    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        return ClassCstToAst.createFieldDefinitionAst(staticCst, cst)
    }

    /**
     * 委托给 ClassCstToAst.isComputedPropertyName 静态方法
     */
    isComputedPropertyName(cst: SubhutiCst): boolean {
        return ClassCstToAst.isComputedPropertyName(cst)
    }

    /**
     * 委托给 IdentifierCstToAst.createPrivateIdentifierAst 静态方法
     */
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFormalParameterListAst 静态方法
     */
    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionCstToAst.createFormalParameterListAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createBindingElementAst 静态方法
     */
    createBindingElementAst(cst: SubhutiCst): any {
        return FunctionCstToAst.createBindingElementAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createSingleNameBindingAst 静态方法
     */
    createSingleNameBindingAst(cst: SubhutiCst): any {
        return FunctionCstToAst.createSingleNameBindingAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFunctionRestParameterAst 静态方法
     */
    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        return FunctionCstToAst.createFunctionRestParameterAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createBindingRestElementAst 静态方法
     */
    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        return FunctionCstToAst.createBindingRestElementAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFunctionBodyAst 静态方法
     */
    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionCstToAst.createFunctionBodyAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFunctionStatementListAst 静态方法
     */
    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionCstToAst.createFunctionStatementListAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFormalParameterListAstWrapped 静态方法
     */
    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createFormalParameterListAstWrapped(cst)
    }

    /**
     * 委托给 ClassCstToAst.createMethodDefinitionAst 静态方法
     */
    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return ClassCstToAst.createMethodDefinitionAst(staticCst, cst)
    }

    /**
     * 处理 UniqueFormalParameters CST 节点
     */
    /**
     * 委托给 FunctionCstToAst.createUniqueFormalParametersAst 静态方法
     */
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionCstToAst.createUniqueFormalParametersAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createUniqueFormalParametersAstWrapped 静态方法
     */
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createUniqueFormalParametersAstWrapped(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createPropertySetParameterListAst 静态方法
     */
    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return FunctionCstToAst.createPropertySetParameterListAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createPropertySetParameterListAstWrapped 静态方法
     */
    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        return FunctionCstToAst.createPropertySetParameterListAstWrapped(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createFormalParameterAst 静态方法
     */
    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        return FunctionCstToAst.createFormalParameterAst(cst)
    }

    /**
     * 委托给 PatternCstToAst.createBindingPropertyAst 静态方法
     */
    createBindingPropertyAst(cst: SubhutiCst): any {
        return PatternCstToAst.createBindingPropertyAst(cst)
    }

    /**
     * 委托给 PatternCstToAst.createBindingPropertyListAst 静态方法
     */
    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createBindingPropertyListAst(cst)
    }

    /**
     * 委托给 PatternCstToAst.createBindingElementListAst 静态方法
     */
    createBindingElementListAst(cst: SubhutiCst): any[] {
        return PatternCstToAst.createBindingElementListAst(cst)
    }

    /**
     * 委托给 PatternCstToAst.createBindingElisionElementAst 静态方法
     */
    createBindingElisionElementAst(cst: SubhutiCst): any {
        return PatternCstToAst.createBindingElisionElementAst(cst)
    }

    /**
     * 委托给 PatternCstToAst.createBindingRestPropertyAst 静态方法
     */
    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        return PatternCstToAst.createBindingRestPropertyAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createCaseBlockAst 静态方法
     */
    createCaseBlockAst(cst: SubhutiCst): any[] {
        return StatementCstToAst.createCaseBlockAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createCaseClausesAst 静态方法
     */
    createCaseClausesAst(cst: SubhutiCst): any[] {
        return StatementCstToAst.createCaseClausesAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createCaseClauseAst 静态方法
     */
    createCaseClauseAst(cst: SubhutiCst): any {
        return StatementCstToAst.createCaseClauseAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createDefaultClauseAst 静态方法
     */
    createDefaultClauseAst(cst: SubhutiCst): any {
        return StatementCstToAst.createDefaultClauseAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createCatchAst 静态方法
     */
    createCatchAst(cst: SubhutiCst): any {
        return StatementCstToAst.createCatchAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createSemicolonASIAst 静态方法
     */
    createSemicolonASIAst(cst: SubhutiCst): any {
        return StatementCstToAst.createSemicolonASIAst(cst)
    }

    /**
     * 委托给 DeclarationCstToAst.createForBindingAst 静态方法
     */
    createForBindingAst(cst: SubhutiCst): any {
        return DeclarationCstToAst.createForBindingAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createLetOrConstAst 静态方法
     */
    createLetOrConstAst(cst: SubhutiCst): string {
        return StatementCstToAst.createLetOrConstAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createBlockAst 静态方法
     */
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        return StatementCstToAst.createBlockAst(cst)
    }

    /**
     * 委托给 StatementCstToAst.createFinallyAst 静态方法
     */
    createFinallyAst(cst: SubhutiCst): any {
        return StatementCstToAst.createFinallyAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createSuperCallAst 静态方法
     */
    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createSuperCallAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createImportCallAst 静态方法
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createImportCallAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createSuperPropertyAst 静态方法
     */
    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createSuperPropertyAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createMetaPropertyAst 静态方法
     */
    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createMetaPropertyAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createMemberExpressionFirstOr 静态方法
     */
    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        return ExpressionCstToAst.createMemberExpressionFirstOr(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createCoalesceExpressionHeadAst 静态方法
     */
    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createCoalesceExpressionHeadAst(cst)
    }

    /**
     * 委托给 OperatorCstToAst.createMultiplicativeOperatorAst 静态方法
     */
    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return OperatorCstToAst.createMultiplicativeOperatorAst(cst)
    }

    /**
     * 委托给 OperatorCstToAst.createAssignmentOperatorAst 静态方法
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return OperatorCstToAst.createAssignmentOperatorAst(cst)
    }

    /**
     * 委托给 OperatorCstToAst.createExpressionBodyAst 静态方法
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return OperatorCstToAst.createExpressionBodyAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createOptionalChainAst 静态方法
     */
    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createOptionalChainAst(object, chainCst)
    }

    /**
     * 委托给 TemplateCstToAst.createTemplateLiteralAst 静态方法
     */
    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        return TemplateCstToAst.createTemplateLiteralAst(cst)
    }

    /**
     * 委托给 TemplateCstToAst.processTemplateSpans 静态方法
     */
    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return TemplateCstToAst.processTemplateSpans(cst, quasis, expressions)
    }

    /**
     * 委托给 TemplateCstToAst.processTemplateMiddleList 静态方法
     */
    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        return TemplateCstToAst.processTemplateMiddleList(cst, quasis, expressions)
    }

    /**
     * 委托给 PropertyCstToAst.createPropertyDefinitionAst 静态方法
     */
    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return PropertyCstToAst.createPropertyDefinitionAst(cst)
    }

    /**
     * 委托给 PropertyCstToAst.createPropertyNameAst 静态方法
     */
    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        return PropertyCstToAst.createPropertyNameAst(cst)
    }

    /**
     * 委托给 PropertyCstToAst.createLiteralPropertyNameAst 静态方法
     */
    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return PropertyCstToAst.createLiteralPropertyNameAst(cst)
    }

    /**
     * 委托给 LiteralCstToAst.createLiteralFromToken 静态方法
     */
    createLiteralFromToken(token: any): SlimeExpression {
        return LiteralCstToAst.createLiteralFromToken(token)
    }

    /**
     * 委托给 LiteralCstToAst.createElementListAst 静态方法
     */
    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return LiteralCstToAst.createElementListAst(cst)
    }

    /**
     * 委托给 LiteralCstToAst.createSpreadElementAst 静态方法
     */
    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return LiteralCstToAst.createSpreadElementAst(cst)
    }

    /**
     * 委托给 FunctionCstToAst.createConciseBodyAst 静态方法
     */
    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return FunctionCstToAst.createConciseBodyAst(cst)
    }

    /**
     * 委托给 ExpressionCstToAst.createShortCircuitExpressionTailAst 静态方法
     */
    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        return ExpressionCstToAst.createShortCircuitExpressionTailAst(left, tailCst)
    }
}

const SlimeCstToAstUtil = new SlimeCstToAst()

// 初始化各个 CstToAst 类的 util 引用
import { setSlimeCstToAstUtil } from "./cstToAst/StatementCstToAst";
import { setControlFlowCstToAstUtil } from "./cstToAst/ControlFlowCstToAst";
import { setDeclarationCstToAstUtil } from "./cstToAst/DeclarationCstToAst";
import { setFunctionCstToAstUtil } from "./cstToAst/FunctionCstToAst";
import { setClassCstToAstUtil } from "./cstToAst/ClassCstToAst";
import { setPatternCstToAstUtil } from "./cstToAst/PatternCstToAst";
import { setModuleCstToAstUtil } from "./cstToAst/ModuleCstToAst";
import { setImportCstToAstUtil } from "./cstToAst/ImportCstToAst";
import { setExportCstToAstUtil } from "./cstToAst/ExportCstToAst";
import { setTemplateCstToAstUtil } from "./cstToAst/TemplateCstToAst";
import { setOperatorCstToAstUtil } from "./cstToAst/OperatorCstToAst";
import { setLiteralCstToAstUtil } from "./cstToAst/LiteralCstToAst";
import { setPropertyCstToAstUtil } from "./cstToAst/PropertyCstToAst";
import { setExpressionCstToAstUtil } from "./cstToAst/ExpressionCstToAst";
setSlimeCstToAstUtil(SlimeCstToAstUtil);
setControlFlowCstToAstUtil(SlimeCstToAstUtil);
setDeclarationCstToAstUtil(SlimeCstToAstUtil);
setFunctionCstToAstUtil(SlimeCstToAstUtil);
setClassCstToAstUtil(SlimeCstToAstUtil);
setPatternCstToAstUtil(SlimeCstToAstUtil);
setModuleCstToAstUtil(SlimeCstToAstUtil);
setImportCstToAstUtil(SlimeCstToAstUtil);
setExportCstToAstUtil(SlimeCstToAstUtil);
setTemplateCstToAstUtil(SlimeCstToAstUtil);
setOperatorCstToAstUtil(SlimeCstToAstUtil);
setLiteralCstToAstUtil(SlimeCstToAstUtil);
setPropertyCstToAstUtil(SlimeCstToAstUtil);
setExpressionCstToAstUtil(SlimeCstToAstUtil);

export default SlimeCstToAstUtil
