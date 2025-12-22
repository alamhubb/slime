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
import SlimeParser from "./SlimeParser.ts";
import SlimeTokenConsumer from "./SlimeTokenConsumer.ts";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import {SlimeAstUtils} from "./cstToAst";

// ============================================
// Unicode 转义序列解码
// ES2025 规范 12.9.4 - �?\uXXXX �?\u{XXXXX} 转换为实际字�?
// 参考实现：Babel、Acorn、TypeScript
// ============================================

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
 * | 内部辅助方法 | createXxxAst | ES2025 专用处理�?|
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
    readonly expressionAstCache = new WeakMap<SubhutiCst, SlimeExpression>()

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

        // ==================== 标识符相�?====================
        if (name === SlimeParser.prototype.IdentifierReference?.name) return this.createIdentifierReferenceAst(cst)
        if (name === SlimeParser.prototype.BindingIdentifier?.name) return this.createBindingIdentifierAst(cst)
        if (name === SlimeParser.prototype.LabelIdentifier?.name) return this.createLabelIdentifierAst(cst)
        if (name === SlimeParser.prototype.Identifier?.name) return this.createIdentifierAst(cst)
        if (name === SlimeParser.prototype.IdentifierName?.name) return this.createIdentifierNameAst(cst)

        // ==================== 字面量相�?====================
        if (name === SlimeParser.prototype.Literal?.name) return this.createLiteralAst(cst)
        if (name === SlimeParser.prototype.BooleanLiteral?.name) return this.createBooleanLiteralAst(cst)
        if (name === SlimeParser.prototype.ArrayLiteral?.name) return this.createArrayLiteralAst(cst)
        if (name === SlimeParser.prototype.ObjectLiteral?.name) return this.createObjectLiteralAst(cst)
        if (name === SlimeParser.prototype.TemplateLiteral?.name) return this.createTemplateLiteralAst(cst)
        if (name === SlimeParser.prototype.LiteralPropertyName?.name) return this.createLiteralPropertyNameAst(cst)
        if (name === SlimeTokenConsumer.prototype.NumericLiteral?.name) return this.createNumericLiteralAst(cst)
        if (name === SlimeTokenConsumer.prototype.StringLiteral?.name) return this.createStringLiteralAst(cst)
        if (name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name) return this.createRegExpLiteralAst(cst)

        // ==================== 表达式相�?====================
        if (name === SlimeParser.prototype.PrimaryExpression?.name) return this.createPrimaryExpressionAst(cst)
        if (name === SlimeParser.prototype.Expression?.name) return this.createExpressionAst(cst)
        if (name === SlimeParser.prototype.AssignmentExpression?.name) return this.createAssignmentExpressionAst(cst)
        if (name === SlimeParser.prototype.ConditionalExpression?.name) return this.createConditionalExpressionAst(cst)
        if (name === SlimeParser.prototype.ShortCircuitExpression?.name) return this.createShortCircuitExpressionAst(cst)
        if (name === SlimeParser.prototype.LogicalORExpression?.name) return this.createLogicalORExpressionAst(cst)
        if (name === SlimeParser.prototype.LogicalANDExpression?.name) return this.createLogicalANDExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseORExpression?.name) return this.createBitwiseORExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseXORExpression?.name) return this.createBitwiseXORExpressionAst(cst)
        if (name === SlimeParser.prototype.BitwiseANDExpression?.name) return this.createBitwiseANDExpressionAst(cst)
        if (name === SlimeParser.prototype.EqualityExpression?.name) return this.createEqualityExpressionAst(cst)
        if (name === SlimeParser.prototype.RelationalExpression?.name) return this.createRelationalExpressionAst(cst)
        if (name === SlimeParser.prototype.ShiftExpression?.name) return this.createShiftExpressionAst(cst)
        if (name === SlimeParser.prototype.AdditiveExpression?.name) return this.createAdditiveExpressionAst(cst)
        if (name === SlimeParser.prototype.MultiplicativeExpression?.name) return this.createMultiplicativeExpressionAst(cst)
        if (name === SlimeParser.prototype.ExponentiationExpression?.name) return this.createExponentiationExpressionAst(cst)
        if (name === SlimeParser.prototype.UnaryExpression?.name) return this.createUnaryExpressionAst(cst)
        if (name === SlimeParser.prototype.UpdateExpression?.name) return this.createUpdateExpressionAst(cst)
        if (name === SlimeParser.prototype.LeftHandSideExpression?.name) return this.createLeftHandSideExpressionAst(cst)
        if (name === SlimeParser.prototype.NewExpression?.name) return this.createNewExpressionAst(cst)
        if (name === SlimeParser.prototype.CallExpression?.name) return this.createCallExpressionAst(cst)
        if (name === SlimeParser.prototype.CallMemberExpression?.name) return this.createCallMemberExpressionAst(cst)
        if (name === SlimeParser.prototype.MemberExpression?.name) return this.createMemberExpressionAst(cst)
        if (name === SlimeParser.prototype.OptionalExpression?.name) return this.createOptionalExpressionAst(cst)
        // OptionalChain 需要 object 参数，不能直接从中心分发调用，应通过 OptionalExpression 处理
        if (name === SlimeParser.prototype.CoalesceExpression?.name) return this.createCoalesceExpressionAst(cst)
        if (name === SlimeParser.prototype.CoalesceExpressionHead?.name) return this.createCoalesceExpressionHeadAst(cst)
        // ShortCircuitExpressionTail 需要 left 参数，通过 ShortCircuitExpression 处理
        if (name === SlimeParser.prototype.ParenthesizedExpression?.name) return this.createParenthesizedExpressionAst(cst)
        if (name === SlimeParser.prototype.AwaitExpression?.name) return this.createAwaitExpressionAst(cst)
        if (name === SlimeParser.prototype.YieldExpression?.name) return this.createYieldExpressionAst(cst)
        if (name === SlimeParser.prototype.MetaProperty?.name) return this.createMetaPropertyAst(cst)
        if (name === SlimeParser.prototype.SuperProperty?.name) return this.createSuperPropertyAst(cst)
        if (name === SlimeParser.prototype.SuperCall?.name) return this.createSuperCallAst(cst)
        if (name === SlimeParser.prototype.ImportCall?.name) return this.createImportCallAst(cst)
        if (name === SlimeParser.prototype.SpreadElement?.name) return this.createSpreadElementAst(cst)
        if (name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) return this.createCoverParenthesizedExpressionAndArrowParameterListAst(cst)
        if (name === SlimeParser.prototype.CoverCallExpressionAndAsyncArrowHead?.name) return this.createCoverCallExpressionAndAsyncArrowHeadAst(cst)
        if (name === SlimeParser.prototype.CoverInitializedName?.name) return this.createCoverInitializedNameAst(cst)

        // ==================== 语句相关 ====================
        if (name === SlimeParser.prototype.Statement?.name) return this.createStatementAst(cst)
        if (name === SlimeParser.prototype.StatementList?.name) return this.createStatementListAst(cst)
        if (name === SlimeParser.prototype.StatementListItem?.name) return this.createStatementListItemAst(cst)
        if (name === SlimeParser.prototype.Block?.name) return this.createBlockAst(cst)
        if (name === SlimeParser.prototype.BlockStatement?.name) return this.createBlockStatementAst(cst)
        if (name === SlimeParser.prototype.EmptyStatement?.name) return this.createEmptyStatementAst(cst)
        if (name === SlimeParser.prototype.ExpressionStatement?.name) return this.createExpressionStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatement?.name) return this.createIfStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatementBody?.name) return this.createIfStatementBodyAst(cst)
        if (name === SlimeParser.prototype.BreakableStatement?.name) return this.createBreakableStatementAst(cst)
        if (name === SlimeParser.prototype.IterationStatement?.name) return this.createIterationStatementAst(cst)
        if (name === SlimeParser.prototype.ForStatement?.name) return this.createForStatementAst(cst)
        if (name === SlimeParser.prototype.ForInOfStatement?.name) return this.createForInOfStatementAst(cst)
        if (name === SlimeParser.prototype.ForDeclaration?.name) return this.createForDeclarationAst(cst)
        if (name === SlimeParser.prototype.ForBinding?.name) return this.createForBindingAst(cst)
        if (name === SlimeParser.prototype.WhileStatement?.name) return this.createWhileStatementAst(cst)
        if (name === SlimeParser.prototype.DoWhileStatement?.name) return this.createDoWhileStatementAst(cst)
        if (name === SlimeParser.prototype.SwitchStatement?.name) return this.createSwitchStatementAst(cst)
        if (name === SlimeParser.prototype.CaseBlock?.name) return this.createCaseBlockAst(cst)
        if (name === SlimeParser.prototype.CaseClauses?.name) return this.createCaseClausesAst(cst)
        if (name === SlimeParser.prototype.CaseClause?.name) return this.createCaseClauseAst(cst)
        if (name === SlimeParser.prototype.DefaultClause?.name) return this.createDefaultClauseAst(cst)
        if (name === SlimeParser.prototype.BreakStatement?.name) return this.createBreakStatementAst(cst)
        if (name === SlimeParser.prototype.ContinueStatement?.name) return this.createContinueStatementAst(cst)
        if (name === SlimeParser.prototype.ReturnStatement?.name) return this.createReturnStatementAst(cst)
        if (name === SlimeParser.prototype.WithStatement?.name) return this.createWithStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledStatement?.name) return this.createLabelledStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledItem?.name) return this.createLabelledItemAst(cst)
        if (name === SlimeParser.prototype.ThrowStatement?.name) return this.createThrowStatementAst(cst)
        if (name === SlimeParser.prototype.TryStatement?.name) return this.createTryStatementAst(cst)
        if (name === SlimeParser.prototype.Catch?.name) return this.createCatchAst(cst)
        if (name === SlimeParser.prototype.CatchParameter?.name) return this.createCatchParameterAst(cst)
        if (name === SlimeParser.prototype.Finally?.name) return this.createFinallyAst(cst)
        if (name === SlimeParser.prototype.DebuggerStatement?.name) return this.createDebuggerStatementAst(cst)
        if (name === SlimeParser.prototype.SemicolonASI?.name) return this.createSemicolonASIAst(cst)
        if (name === SlimeParser.prototype.ExpressionBody?.name) return this.createExpressionBodyAst(cst)

        // ==================== 声明相关 ====================
        if (name === SlimeParser.prototype.Declaration?.name) return this.createDeclarationAst(cst)
        if (name === SlimeParser.prototype.HoistableDeclaration?.name) return this.createHoistableDeclarationAst(cst)
        if (name === SlimeParser.prototype.VariableStatement?.name) return this.createVariableStatementAst(cst)
        if (name === SlimeParser.prototype.VariableDeclaration?.name) return this.createVariableDeclarationAst(cst)
        if (name === SlimeParser.prototype.VariableDeclarationList?.name) return this.createVariableDeclarationListAst(cst)
        if (name === SlimeParser.prototype.LexicalDeclaration?.name) return this.createLexicalDeclarationAst(cst)
        if (name === SlimeParser.prototype.LetOrConst?.name) return this.createLetOrConstAst(cst)
        if (name === SlimeParser.prototype.LexicalBinding?.name) return this.createLexicalBindingAst(cst)
        if (name === SlimeParser.prototype.Initializer?.name) return this.createInitializerAst(cst)

        // ==================== 函数相关 ====================
        if (name === SlimeParser.prototype.FunctionDeclaration?.name) return this.createFunctionDeclarationAst(cst)
        if (name === SlimeParser.prototype.FunctionExpression?.name) return this.createFunctionExpressionAst(cst)
        if (name === SlimeParser.prototype.FunctionBody?.name) return this.createFunctionBodyAst(cst)
        if (name === SlimeParser.prototype.FunctionStatementList?.name) return this.createFunctionStatementListAst(cst)
        if (name === SlimeParser.prototype.FormalParameters?.name) return this.createFormalParametersAst(cst)
        if (name === SlimeParser.prototype.FormalParameterList?.name) return this.createFormalParameterListAst(cst)
        if (name === SlimeParser.prototype.FormalParameter?.name) return this.createFormalParameterAst(cst)
        if (name === SlimeParser.prototype.FunctionRestParameter?.name) return this.createFunctionRestParameterAst(cst)
        if (name === SlimeParser.prototype.UniqueFormalParameters?.name) return this.createUniqueFormalParametersAst(cst)
        if (name === SlimeParser.prototype.ArrowFunction?.name) return this.createArrowFunctionAst(cst)
        if (name === SlimeParser.prototype.ArrowParameters?.name) return this.createArrowParametersAst(cst)
        if (name === SlimeParser.prototype.ArrowFormalParameters?.name) return this.createArrowFormalParametersAst(cst)
        if (name === SlimeParser.prototype.ConciseBody?.name) return this.createConciseBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionDeclaration?.name) return this.createAsyncFunctionDeclarationAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionExpression?.name) return this.createAsyncFunctionExpressionAst(cst)
        if (name === SlimeParser.prototype.AsyncFunctionBody?.name) return this.createAsyncFunctionBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowFunction?.name) return this.createAsyncArrowFunctionAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowHead?.name) return this.createAsyncArrowHeadAst(cst)
        if (name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) return this.createAsyncArrowBindingIdentifierAst(cst)
        if (name === SlimeParser.prototype.AsyncConciseBody?.name) return this.createAsyncConciseBodyAst(cst)
        if (name === SlimeParser.prototype.GeneratorDeclaration?.name) return this.createGeneratorDeclarationAst(cst)
        if (name === SlimeParser.prototype.GeneratorExpression?.name) return this.createGeneratorExpressionAst(cst)
        if (name === SlimeParser.prototype.GeneratorBody?.name) return this.createGeneratorBodyAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name) return this.createAsyncGeneratorDeclarationAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorExpression?.name) return this.createAsyncGeneratorExpressionAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorBody?.name) return this.createAsyncGeneratorBodyAst(cst)

        // ==================== 类相�?====================
        if (name === SlimeParser.prototype.ClassDeclaration?.name) return this.createClassDeclarationAst(cst)
        if (name === SlimeParser.prototype.ClassExpression?.name) return this.createClassExpressionAst(cst)
        if (name === SlimeParser.prototype.ClassTail?.name) return this.createClassTailAst(cst)
        if (name === SlimeParser.prototype.ClassHeritage?.name) return this.createClassHeritageAst(cst)
        if (name === SlimeParser.prototype.ClassBody?.name) return this.createClassBodyAst(cst)
        if (name === SlimeParser.prototype.ClassElementList?.name) return this.createClassElementListAst(cst)
        if (name === SlimeParser.prototype.ClassElement?.name) return this.createClassElementAst(cst)
        if (name === SlimeParser.prototype.ClassElementName?.name) return this.createClassElementNameAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlock?.name) return this.createClassStaticBlockAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlockBody?.name) return this.createClassStaticBlockBodyAst(cst)
        if (name === SlimeParser.prototype.ClassStaticBlockStatementList?.name) return this.createClassStaticBlockStatementListAst(cst)
        if (name === SlimeParser.prototype.MethodDefinition?.name) return this.createMethodDefinitionAst(null, cst)
        if (name === SlimeParser.prototype.FieldDefinition?.name) return this.createFieldDefinitionAst(null, cst)
        if (name === SlimeParser.prototype.GeneratorMethod?.name) return this.createGeneratorMethodAst(cst)
        if (name === SlimeParser.prototype.AsyncMethod?.name) return this.createAsyncMethodAst(cst)
        if (name === SlimeParser.prototype.AsyncGeneratorMethod?.name) return this.createAsyncGeneratorMethodAst(cst)
        if (name === 'PrivateIdentifier') return this.createPrivateIdentifierAst(cst)

        // ==================== 对象属性相�?====================
        if (name === SlimeParser.prototype.PropertyDefinition?.name) return this.createPropertyDefinitionAst(cst)
        if (name === SlimeParser.prototype.PropertyName?.name) return this.createPropertyNameAst(cst)
        if (name === SlimeParser.prototype.ComputedPropertyName?.name) return this.createComputedPropertyNameAst(cst)
        if (name === SlimeParser.prototype.PropertySetParameterList?.name) return this.createPropertySetParameterListAst(cst)

        // ==================== 解构相关 ====================
        if (name === SlimeParser.prototype.BindingPattern?.name) return this.createBindingPatternAst(cst)
        if (name === SlimeParser.prototype.ObjectBindingPattern?.name) return this.createObjectBindingPatternAst(cst)
        if (name === SlimeParser.prototype.ArrayBindingPattern?.name) return this.createArrayBindingPatternAst(cst)
        if (name === SlimeParser.prototype.BindingPropertyList?.name) return this.createBindingPropertyListAst(cst)
        if (name === SlimeParser.prototype.BindingProperty?.name) return this.createBindingPropertyAst(cst)
        if (name === SlimeParser.prototype.BindingElementList?.name) return this.createBindingElementListAst(cst)
        if (name === SlimeParser.prototype.BindingElisionElement?.name) return this.createBindingElisionElementAst(cst)
        if (name === SlimeParser.prototype.BindingElement?.name) return this.createBindingElementAst(cst)
        if (name === SlimeParser.prototype.BindingRestElement?.name) return this.createBindingRestElementAst(cst)
        if (name === SlimeParser.prototype.BindingRestProperty?.name) return this.createBindingRestPropertyAst(cst)
        if (name === SlimeParser.prototype.SingleNameBinding?.name) return this.createSingleNameBindingAst(cst)
        if (name === SlimeParser.prototype.AssignmentPattern?.name) return this.createAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.ObjectAssignmentPattern?.name) return this.createObjectAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.ArrayAssignmentPattern?.name) return this.createArrayAssignmentPatternAst(cst)
        if (name === SlimeParser.prototype.AssignmentPropertyList?.name) return this.createAssignmentPropertyListAst(cst)
        if (name === SlimeParser.prototype.AssignmentProperty?.name) return this.createAssignmentPropertyAst(cst)
        if (name === SlimeParser.prototype.AssignmentElementList?.name) return this.createAssignmentElementListAst(cst)
        if (name === SlimeParser.prototype.AssignmentElisionElement?.name) return this.createAssignmentElisionElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentElement?.name) return this.createAssignmentElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentRestElement?.name) return this.createAssignmentRestElementAst(cst)
        if (name === SlimeParser.prototype.AssignmentRestProperty?.name) return this.createAssignmentRestPropertyAst(cst)
        if (name === SlimeParser.prototype.Elision?.name) return this.createElisionAst(cst)
        if (name === SlimeParser.prototype.ElementList?.name) return this.createElementListAst(cst)

        // ==================== 模块相关 ====================
        if (name === SlimeParser.prototype.Module?.name) return this.createModuleAst(cst)
        if (name === SlimeParser.prototype.ModuleBody?.name) return this.createModuleBodyAst(cst)
        if (name === SlimeParser.prototype.ModuleItem?.name) return this.createModuleItemAst(cst)
        if (name === SlimeParser.prototype.ModuleItemList?.name) return this.createModuleItemListAst(cst)
        if (name === SlimeParser.prototype.ImportDeclaration?.name) return this.createImportDeclarationAst(cst)
        if (name === SlimeParser.prototype.ImportClause?.name) return this.createImportClauseAst(cst)
        if (name === SlimeParser.prototype.ImportedDefaultBinding?.name) return this.createImportedDefaultBindingAst(cst)
        if (name === SlimeParser.prototype.NameSpaceImport?.name) return this.createNameSpaceImportAst(cst)
        if (name === SlimeParser.prototype.NamedImports?.name) return this.createNamedImportsAst(cst)
        if (name === SlimeParser.prototype.ImportsList?.name) return this.createImportsListAst(cst)
        if (name === SlimeParser.prototype.ImportSpecifier?.name) return this.createImportSpecifierAst(cst)
        if (name === SlimeParser.prototype.ImportedBinding?.name) return this.createImportedBindingAst(cst)
        if (name === SlimeParser.prototype.ModuleSpecifier?.name) return this.createModuleSpecifierAst(cst)
        if (name === SlimeParser.prototype.FromClause?.name) return this.createFromClauseAst(cst)
        if (name === SlimeParser.prototype.ModuleExportName?.name) return this.createModuleExportNameAst(cst)
        if (name === SlimeParser.prototype.ExportDeclaration?.name) return this.createExportDeclarationAst(cst)
        if (name === SlimeParser.prototype.ExportFromClause?.name) return this.createExportFromClauseAst(cst)
        if (name === SlimeParser.prototype.NamedExports?.name) return this.createNamedExportsAst(cst)
        if (name === SlimeParser.prototype.ExportsList?.name) return this.createExportsListAst(cst)
        if (name === SlimeParser.prototype.ExportSpecifier?.name) return this.createExportSpecifierAst(cst)
        if (name === SlimeParser.prototype.WithClause?.name) return this.createWithClauseAst(cst)
        if (name === SlimeParser.prototype.WithEntries?.name) return this.createWithEntriesAst(cst)
        if (name === SlimeParser.prototype.AttributeKey?.name) return this.createAttributeKeyAst(cst)

        // ==================== 程序入口 ====================
        if (name === SlimeParser.prototype.Program?.name) return this.createProgramAst(cst)
        if (name === SlimeParser.prototype.Script?.name) return this.createScriptAst(cst)
        if (name === SlimeParser.prototype.ScriptBody?.name) return this.createScriptBodyAst(cst)

        // ==================== 参数列表相关 ====================
        if (name === SlimeParser.prototype.Arguments?.name) return this.createArgumentsAst(cst)
        if (name === SlimeParser.prototype.ArgumentList?.name) return this.createArgumentListAst(cst)

        // ==================== 运算符相�?====================
        if (name === SlimeParser.prototype.AssignmentOperator?.name) return this.createAssignmentOperatorAst(cst)
        if (name === SlimeParser.prototype.MultiplicativeOperator?.name) return this.createMultiplicativeOperatorAst(cst)

        // ==================== 对于没有专门方法�?CST 节点，透传到子节点 ====================
        if (cst.children && cst.children.length === 1) {
            return this.createAstFromCst(cst.children[0])
        }

        throw new Error(`No conversion method found for CST node: ${name}`)
    }

    /**
     * 创建 IdentifierReference �?AST
     *
     * 语法：IdentifierReference -> Identifier | yield | await
     *
     * IdentifierReference 是对 Identifier 的引用包装，
     * �?ES 规范中用于区分标识符的不同使用场景�?
     */
    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.IdentifierReference?.name || 'IdentifierReference'
        if (cst.name !== expectedName && cst.name !== 'IdentifierReference') {
            throw new Error(`Expected IdentifierReference, got ${cst.name}`)
        }

        // IdentifierReference -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('IdentifierReference has no children')
        }

        return this.createIdentifierAst(child)
    }



    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Support Identifier, IdentifierName, and contextual keywords (yield, await) used as identifiers
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        // ES2025 Parser: Identifier 规则内部调用 IdentifierNameTok()
        // 所�?CST 结构是：Identifier -> IdentifierNameTok (token with value)
        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

        // 处理 yield/await 作为标识符的情况
        if (isYield || isAwait) {
            // 这是一�?token，直接使用其�?
            value = cst.value as string || cst.name.toLowerCase()
            tokenLoc = cst.loc
        } else if (isIdentifierName) {
            // IdentifierName 结构：IdentifierName -> token (with value)
            if (cst.value !== undefined && cst.value !== null) {
                value = cst.value as string
                tokenLoc = cst.loc
            } else if (cst.children && cst.children.length > 0) {
                const tokenCst = cst.children[0]
                if (tokenCst.value !== undefined) {
                    value = tokenCst.value as string
                    tokenLoc = tokenCst.loc || cst.loc
                } else {
                    throw new Error(`createIdentifierAst: Cannot extract value from IdentifierName CST`)
                }
            } else {
                throw new Error(`createIdentifierAst: Invalid IdentifierName CST structure`)
            }
        } else if (!isIdentifier) {
            throw new Error(`Expected Identifier, got ${cst.name}`)
        } else if (cst.value !== undefined && cst.value !== null) {
            // 直接�?token（旧版兼容）
            value = cst.value as string
            tokenLoc = cst.loc
        } else if (cst.children && cst.children.length > 0) {
            // ES2025: Identifier 规则，子节点�?IdentifierNameTok
            const tokenCst = cst.children[0]
            if (tokenCst.value !== undefined) {
                value = tokenCst.value as string
                tokenLoc = tokenCst.loc || cst.loc
            } else {
                throw new Error(`createIdentifierAst: Cannot extract value from Identifier CST`)
            }
        } else {
            throw new Error(`createIdentifierAst: Invalid Identifier CST structure`)
        }

        // 解码 Unicode 转义序列（如 \u0061 -> a�?
        const decodedName = SlimeAstUtils.decodeUnicodeEscapes(value)
        // 使用 token �?loc（包含原始值），而不是规则的 loc
        const identifier = SlimeAstUtil.createIdentifier(decodedName, tokenLoc || cst.loc)
        return identifier
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

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        const asts = cst.children.map(item => {
            // Es2025Parser uses ModuleItem wrapper
            if (item.name === SlimeParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return this.createModuleItemAst(innerItem)
            }
            // Fallback: direct type
            return this.createModuleItemAst(item)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }

    // ==================== 模块相关转换方法 ====================

    /**
     * Program CST �?AST
     *
     * 存在必要性：Program 是顶层入口规则，需要处�?Script �?Module 两种情况�?
     */
    createProgramAst(cst: SubhutiCst): SlimeProgram {
        // 处理 Program -> Script | Module
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === 'Script' || firstChild.name === SlimeParser.prototype.Script?.name) {
                return this.createScriptAst(firstChild)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeParser.prototype.Module?.name) {
                return this.createModuleAst(firstChild)
            }
        }
        // 如果直接就是内容，调�?toProgram
        return this.toProgram(cst)
    }

    /**
     * Script CST �?AST
     */
    createScriptAst(cst: SubhutiCst): SlimeProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return this.createScriptBodyAst(scriptBody)
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * ScriptBody CST �?AST
     */
    createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            const body = this.createStatementListAst(stmtList)
            return SlimeAstUtil.createProgram(body, 'script')
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * Module CST �?AST
     */
    createModuleAst(cst: SubhutiCst): SlimeProgram {
        const moduleBody = cst.children?.find(ch =>
            ch.name === 'ModuleBody' || ch.name === SlimeParser.prototype.ModuleBody?.name
        )
        if (moduleBody) {
            return this.createModuleBodyAst(moduleBody)
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * ModuleBody CST �?AST
     */
    createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        const moduleItemList = cst.children?.find(ch =>
            ch.name === 'ModuleItemList' || ch.name === SlimeParser.prototype.ModuleItemList?.name
        )
        if (moduleItemList) {
            const body = this.createModuleItemListAst(moduleItemList)
            return SlimeAstUtil.createProgram(body, 'module')
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * NameSpaceImport CST �?AST
     * NameSpaceImport -> * as ImportedBinding
     */
    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        // NameSpaceImport: Asterisk as ImportedBinding
        // children: [Asterisk, AsTok, ImportedBinding]
        let asteriskToken: any = undefined
        let asToken: any = undefined

        for (const child of cst.children) {
            if (child.name === 'Asterisk' || child.value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        const binding = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportedBinding?.name)
        if (!binding) throw new Error('NameSpaceImport missing ImportedBinding')
        const local = this.createImportedBindingAst(binding)

        return SlimeAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }

    /**
     * NamedImports CST 转 AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        if (!importsList) return []

        const specifiers: Array<SlimeImportSpecifier> = []
        for (const child of importsList.children) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // ImportSpecifier有两种形式：
                // 1. ImportedBinding （简写）
                // 2. IdentifierName AsTok ImportedBinding （重命名）

                const identifierName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.IdentifierName?.name)
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name)

                if (identifierName && binding) {
                    // import {name as localName} 或 import {default as MyClass} - 重命名形式
                    const imported = this.createIdentifierNameAst(identifierName)
                    const local = this.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    // import {name} - 简写形式
                    const id = this.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any)
                }
            }
        }
        return specifiers
    }

    /**
     * ImportsList CST �?AST
     * ImportsList -> ImportSpecifier (, ImportSpecifier)*
     */
    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(this.createImportSpecifierAst(child))
            }
        }
        return specifiers
    }

    /**
     * ImportSpecifier CST �?AST
     * ImportSpecifier -> ImportedBinding | ModuleExportName as ImportedBinding
     */
    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        const children = cst.children || []
        let imported: SlimeIdentifier | null = null
        let local: SlimeIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = this.createImportedBindingAst(child)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = this.createModuleExportNameAst(child) as SlimeIdentifier
                }
            }
        }

        // 如果没有 as，imported �?local 相同
        if (!local && imported) {
            local = { ...imported }
        }
        if (!imported && local) {
            imported = { ...local }
        }

        return SlimeAstUtil.createImportSpecifier(imported!, local!, asToken)
    }

    /**
     * AttributeKey CST �?AST
     * AttributeKey -> IdentifierName | StringLiteral
     */
    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return this.createIdentifierNameAst(firstChild)
        } else {
            return this.createStringLiteralAst(firstChild)
        }
    }

    /**
     * ExportFromClause CST �?AST
     * ExportFromClause -> * | * as ModuleExportName | NamedExports
     */
    createExportFromClauseAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 * (export all)
        const asterisk = children.find(ch => ch.name === 'Asterisk' || ch.value === '*')
        if (asterisk) {
            const asTok = children.find(ch => ch.name === 'As' || ch.value === 'as')
            const exportedName = children.find(ch =>
                ch.name === SlimeParser.prototype.ModuleExportName?.name ||
                ch.name === 'ModuleExportName'
            )

            if (asTok && exportedName) {
                // * as name
                return {
                    type: 'exportAll',
                    exported: this.createModuleExportNameAst(exportedName)
                }
            } else {
                // * (export all)
                return { type: 'exportAll', exported: null }
            }
        }

        // NamedExports
        const namedExports = children.find(ch =>
            ch.name === SlimeParser.prototype.NamedExports?.name ||
            ch.name === 'NamedExports'
        )
        if (namedExports) {
            return {
                type: 'namedExports',
                specifiers: this.createNamedExportsAst(namedExports)
            }
        }

        return { type: 'unknown' }
    }

    /**
     * WithEntries CST �?AST
     * WithEntries -> AttributeKey : StringLiteral (, AttributeKey : StringLiteral)*
     */
    createWithEntriesAst(cst: SubhutiCst): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AttributeKey?.name ||
                child.name === 'AttributeKey') {
                currentKey = this.createAttributeKeyAst(child)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: this.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }

    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        const name = item.name
        if (name === SlimeParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return this.createExportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return this.createImportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return this.createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportDeclaration?.name);
        const first = cst.children[0]
        const first1 = cst.children[1]
        let importDeclaration!: SlimeImportDeclaration

        // Token fields
        let importToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 import token
        if (first && (first.name === 'Import' || first.value === 'import')) {
            importToken = SlimeTokenCreate.createImportToken(first.loc)
        }

        // 查找 semicolon
        const semicolonCst = cst.children.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
        }

        // 查找 WithClause (ES2025 Import Attributes)
        const withClauseCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.WithClause?.name || ch.name === 'WithClause'
        )
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = this.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = this.createImportClauseAst(first1)
            const fromClause = this.createFromClauseAst(cst.children[2])
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) �?import 'module' with {...}
            const source = this.createModuleSpecifierAst(first1)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    /** 解析 WithClause: with { type: "json" } */
    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        // WithClause: With, LBrace, WithEntries?, RBrace
        let withToken: any = undefined
        const attributes: any[] = []

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = { type: 'With', value: 'with', loc: child.loc }
            } else if (child.name === SlimeParser.prototype.WithEntries?.name || child.name === 'WithEntries') {
                // WithEntries 包含 AttributeKey, Colon, StringLiteral, 可能有多个用逗号分隔
                let currentKey: any = null
                for (const entry of child.children || []) {
                    if (entry.name === SlimeParser.prototype.AttributeKey?.name || entry.name === 'AttributeKey') {
                        // AttributeKey 可能�?IdentifierName �?StringLiteral
                        const keyChild = entry.children?.[0]
                        if (keyChild) {
                            if (keyChild.name === 'IdentifierName' || keyChild.name === SlimeParser.prototype.IdentifierName?.name) {
                                const nameToken = keyChild.children?.[0]
                                currentKey = {
                                    type: SlimeNodeType.Identifier,
                                    name: nameToken?.value || keyChild.value,
                                    loc: keyChild.loc
                                }
                            } else if (keyChild.name === 'StringLiteral' || keyChild.value?.startsWith('"') || keyChild.value?.startsWith("'")) {
                                currentKey = this.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        // 这是 attribute 的�?
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: this.createStringLiteralAst(entry),
                                loc: { ...currentKey.loc, end: entry.loc?.end }
                            })
                            currentKey = null
                        }
                    }
                    // 跳过 Colon �?Comma
                }
            }
        }

        return { attributes, withToken }
    }


    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = this.createModuleSpecifierAst(cst.children[1])

        // 提取 from token
        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeTokenCreate.createFromToken(first.loc)
        }

        return {
            source: ModuleSpecifier,
            fromToken: fromToken
        }
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        const ast = SlimeAstUtil.createStringLiteral(first.value)
        return ast
    }

    createImportClauseAst(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportClause?.name);
        const result: Array<SlimeImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = this.createImportedDefaultBindingAst(first)
            // 查找后面的逗号
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeTokenCreate.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeAstUtil.createImportSpecifierItem(specifier, commaToken))

            // 检查是否还�?NamedImports �?NameSpaceImport（混合导入）
            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = this.createNamedImportsListAstWrapped(namedImportsCst)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeAstUtil.createImportSpecifierItem(
                    this.createNameSpaceImportAst(namespaceImportCst), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeAstUtil.createImportSpecifierItem(this.createNameSpaceImportAst(first), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = this.createNamedImportsListAstWrapped(first)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return { specifiers: result, lBraceToken, rBraceToken }
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = this.createImportedBindingAst(first)
        const importDefaultSpecifier: SlimeImportDefaultSpecifier = SlimeAstUtil.createImportDefaultSpecifier(id)
        return importDefaultSpecifier
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return this.createBindingIdentifierAst(first)
    }

    /** 返回包装类型的版本，包含 brace tokens */
    createNamedImportsListAstWrapped(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 提取 brace tokens
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        // 空命名导�?import {} from "foo" - 返回�?specifiers 但有 brace tokens
        if (!importsList) return { specifiers: [], lBraceToken, rBraceToken }

        const specifiers: Array<SlimeImportSpecifierItem> = []
        let currentSpec: SlimeImportSpecifier | null = null
        let hasSpec = false

        for (let i = 0; i < importsList.children.length; i++) {
            const child = importsList.children[i]

            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // 如果之前�?specifier 但没有逗号，先推入
                if (hasSpec) {
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
                }

                // ES2025: ImportSpecifier 结构可能�?
                // 1. ModuleExportName "as" ImportedBinding (别名形式)
                // 2. ImportedBinding (简写形�?
                const moduleExportName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name || ch.name === 'ModuleExportName')
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name || ch.name === 'ImportedBinding')

                if (moduleExportName && binding) {
                    // 别名形式: import { foo as bar }
                    const imported = this.createModuleExportNameAst(moduleExportName)
                    const local = this.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    // 简写形�? import { foo }
                    const id = this.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any
                }
                hasSpec = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的 specifier 配对
                if (hasSpec) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, commaToken))
                    hasSpec = false
                    currentSpec = null
                }
            }
        }

        // 处理最后一�?specifier（没有尾随逗号�?
        if (hasSpec) {
            specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
        }

        return { specifiers, lBraceToken, rBraceToken }
    }




    /*createImportClauseAst(cst: SubhutiCst.ts):Array<SlimeImportSpecifier | SlimeImportDefaultSpecifier | SlimeImportNamespaceSpecifier>{
    let astName = SlimeAstUtils.checkCstName(cst, Es2025Parser.prototype.ImportClause?.name);


  }*/


    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => this.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            // 如果�?Declaration，直接处�?
            if (item.name === SlimeParser.prototype.Declaration?.name) {
                return [this.createDeclarationAst(item) as any]
            }

            // 如果�?Statement，需要特殊处�?FunctionExpression �?ClassExpression
            const statement = this.createStatementAst(item)
            const result = statement.flat()

            // 检查是否是命名�?FunctionExpression �?ClassExpression（应该转�?Declaration�?
            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression

                    // 命名�?FunctionExpression �?FunctionDeclaration
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

                    // ClassExpression �?ClassDeclaration
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

    createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => this.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)  // 过滤�?undefined
        return statements
    }

    /**
     * [核心分发方法] 根据 CST 节点类型创建对应�?Statement/Declaration AST
     *
     * 存在必要性：ECMAScript 语法�?Statement �?Declaration 有多种具体类型，
     * 需要一个统一的分发方法来处理各种语句和声明�?
     *
     * 处理的节点类型包括：
     * - Statement 包装节点 �?递归处理子节�?
     * - BreakableStatement �?IterationStatement | SwitchStatement
     * - VariableStatement �?VariableDeclaration
     * - ExpressionStatement �?ExpressionStatement
     * - IfStatement, ForStatement, WhileStatement 等具体语�?
     * - FunctionDeclaration, ClassDeclaration 等声�?
     */
    createStatementDeclarationAst(cst: SubhutiCst) {
        // Statement - 包装节点，递归处理子节�?
        if (cst.name === SlimeParser.prototype.Statement?.name || cst.name === 'Statement') {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // BreakableStatement - 包装节点，递归处理子节�?
        else if (cst.name === SlimeParser.prototype.BreakableStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // IterationStatement - 循环语句包装节点
        else if (cst.name === SlimeParser.prototype.IterationStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // IfStatementBody - if/else 语句体包装节点，递归处理子节�?
        else if (cst.name === 'IfStatementBody') {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // var 变量声明语句 (ES2025: VariableStatement)
        else if (cst.name === SlimeParser.prototype.VariableStatement?.name || cst.name === 'VariableStatement') {
            return this.createVariableStatementAst(cst)
        }
        // 变量声明 (用于 for 循环�?
        else if (cst.name === SlimeParser.prototype.VariableDeclaration?.name) {
            return this.createVariableDeclarationAst(cst)
        }
        // 表达式语�?
        else if (cst.name === SlimeParser.prototype.ExpressionStatement?.name) {
            return this.createExpressionStatementAst(cst)
        }
        // return 语句
        else if (cst.name === SlimeParser.prototype.ReturnStatement?.name) {
            return this.createReturnStatementAst(cst)
        }
        // if 语句
        else if (cst.name === SlimeParser.prototype.IfStatement?.name) {
            return this.createIfStatementAst(cst)
        }
        // for 语句
        else if (cst.name === SlimeParser.prototype.ForStatement?.name) {
            return this.createForStatementAst(cst)
        }
        // for...in / for...of 语句
        else if (cst.name === SlimeParser.prototype.ForInOfStatement?.name) {
            return this.createForInOfStatementAst(cst)
        }
        // while 语句
        else if (cst.name === SlimeParser.prototype.WhileStatement?.name) {
            return this.createWhileStatementAst(cst)
        }
        // do...while 语句
        else if (cst.name === SlimeParser.prototype.DoWhileStatement?.name) {
            return this.createDoWhileStatementAst(cst)
        }
        // 块语�?
        else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            return this.createBlockStatementAst(cst)
        }
        // switch 语句
        else if (cst.name === SlimeParser.prototype.SwitchStatement?.name) {
            return this.createSwitchStatementAst(cst)
        }
        // try 语句
        else if (cst.name === SlimeParser.prototype.TryStatement?.name) {
            return this.createTryStatementAst(cst)
        }
        // throw 语句
        else if (cst.name === SlimeParser.prototype.ThrowStatement?.name) {
            return this.createThrowStatementAst(cst)
        }
        // break 语句
        else if (cst.name === SlimeParser.prototype.BreakStatement?.name) {
            return this.createBreakStatementAst(cst)
        }
        // continue 语句
        else if (cst.name === SlimeParser.prototype.ContinueStatement?.name) {
            return this.createContinueStatementAst(cst)
        }
        // 标签语句
        else if (cst.name === SlimeParser.prototype.LabelledStatement?.name) {
            return this.createLabelledStatementAst(cst)
        }
        // with 语句
        else if (cst.name === SlimeParser.prototype.WithStatement?.name) {
            return this.createWithStatementAst(cst)
        }
        // debugger 语句
        else if (cst.name === SlimeParser.prototype.DebuggerStatement?.name) {
            return this.createDebuggerStatementAst(cst)
        }
        // 空语�?
        else if (cst.name === SlimeParser.prototype.EmptyStatement?.name) {
            return this.createEmptyStatementAst(cst)
        }
        // 函数声明
        else if (cst.name === SlimeParser.prototype.FunctionDeclaration?.name) {
            return this.createFunctionDeclarationAst(cst)
        }
        // 类声�?
        else if (cst.name === SlimeParser.prototype.ClassDeclaration?.name) {
            return this.createClassDeclarationAst(cst)
        }
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        let astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ExportDeclaration?.name);
        const children = cst.children || []

        // Token fields
        let exportToken: any = undefined
        let defaultToken: any = undefined
        let asteriskToken: any = undefined
        let semicolonToken: any = undefined
        let asToken: any = undefined

        // 遍历子节点提取信�?
        let exportFromClause: SubhutiCst | null = null
        let fromClause: SubhutiCst | null = null
        let namedExports: SubhutiCst | null = null
        let variableStatement: SubhutiCst | null = null
        let declaration: SubhutiCst | null = null
        let hoistableDeclaration: SubhutiCst | null = null
        let classDeclaration: SubhutiCst | null = null
        let assignmentExpression: SubhutiCst | null = null
        let withClauseCst: SubhutiCst | null = null
        let isDefault = false

        for (const child of children) {
            const name = child.name
            if (name === SlimeTokenConsumer.prototype.Export?.name || child.value === 'export') {
                exportToken = SlimeTokenCreate.createExportToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.Default?.name || child.value === 'default') {
                defaultToken = SlimeTokenCreate.createDefaultToken(child.loc)
                isDefault = true
            } else if (name === SlimeTokenConsumer.prototype.Asterisk?.name || child.value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.Semicolon?.name || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (name === SlimeParser.prototype.ExportFromClause?.name) {
                exportFromClause = child
            } else if (name === SlimeParser.prototype.FromClause?.name) {
                fromClause = child
            } else if (name === SlimeParser.prototype.NamedExports?.name) {
                namedExports = child
            } else if (name === SlimeParser.prototype.VariableStatement?.name) {
                variableStatement = child
            } else if (name === SlimeParser.prototype.Declaration?.name) {
                declaration = child
            } else if (name === SlimeParser.prototype.HoistableDeclaration?.name) {
                hoistableDeclaration = child
            } else if (name === SlimeParser.prototype.ClassDeclaration?.name) {
                classDeclaration = child
            } else if (name === SlimeParser.prototype.AssignmentExpression?.name) {
                assignmentExpression = child
            } else if (name === SlimeParser.prototype.WithClause?.name || name === 'WithClause') {
                withClauseCst = child
            }
        }

        // 解析 WithClause (ES2025 Import Attributes)
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = this.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        // export default ...
        if (isDefault) {
            let decl: any = null
            if (hoistableDeclaration) {
                decl = this.createHoistableDeclarationAst(hoistableDeclaration)
            } else if (classDeclaration) {
                decl = this.createClassDeclarationAst(classDeclaration)
            } else if (assignmentExpression) {
                decl = this.createAssignmentExpressionAst(assignmentExpression)
            }
            return SlimeAstUtil.createExportDefaultDeclaration(decl, cst.loc, exportToken, defaultToken)
        }

        // export ExportFromClause FromClause ; (export * from ... or export { } from ...)
        if (exportFromClause && fromClause) {
            const fromClauseResult = this.createFromClauseAst(fromClause)

            // Check if it's export * or export * as name
            const hasAsterisk = exportFromClause.children?.some((ch: any) =>
                ch.name === SlimeTokenConsumer.prototype.Asterisk?.name || ch.value === '*')

            if (hasAsterisk) {
                // export * from ... or export * as name from ...
                let exported: any = null
                const moduleExportName = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name)
                if (moduleExportName) {
                    exported = this.createModuleExportNameAst(moduleExportName)
                }
                const result = SlimeAstUtil.createExportAllDeclaration(
                    fromClauseResult.source, exported, cst.loc,
                    exportToken, asteriskToken, asToken, fromClauseResult.fromToken, semicolonToken
                ) as any
                // 添加 attributes（如果有 withToken，即�?attributes 为空也要添加�?
                if (withToken) {
                    result.attributes = attributes
                    result.withToken = withToken
                }
                return result
            } else {
                // export { ... } from ...
                // exportFromClause 的结构是 [NamedExports]，需要从中提�?NamedExports
                const namedExportsCst = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.NamedExports?.name || ch.name === 'NamedExports'
                )
                const specifiers = namedExportsCst
                    ? this.createNamedExportsAst(namedExportsCst)
                    : []
                const result = SlimeAstUtil.createExportNamedDeclaration(
                    null, specifiers, fromClauseResult.source, cst.loc,
                    exportToken, fromClauseResult.fromToken, semicolonToken
                )
                // 添加 attributes（如果有 withToken，即�?attributes 为空也要添加�?
                if (withToken) {
                    (result as any).attributes = attributes;
                    (result as any).withToken = withToken
                }
                return result
            }
        }

        // export NamedExports ; (export { ... })
        if (namedExports) {
            const specifiers = this.createNamedExportsAst(namedExports)
            return SlimeAstUtil.createExportNamedDeclaration(
                null, specifiers, null, cst.loc, exportToken, undefined, semicolonToken
            )
        }

        // export VariableStatement
        if (variableStatement) {
            const decl = this.createVariableStatementAst(variableStatement)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        // export Declaration
        if (declaration) {
            const decl = this.createDeclarationAst(declaration)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        throw new Error(`Unsupported export declaration structure`)
    }

    /**
     * 创建 NamedExports AST (export { a, b, c })
     */
    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        // NamedExports: { ExportsList? }
        const specifiers: SlimeExportSpecifierItem[] = []

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportsList?.name) {
                return this.createExportsListAst(child)
            } else if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                specifiers.push({ specifier: this.createExportSpecifierAst(child) })
            }
        }

        return specifiers
    }

    /**
     * 创建 ExportsList AST
     */
    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []
        let lastSpecifier: SlimeExportSpecifier | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                if (lastSpecifier) {
                    specifiers.push({ specifier: lastSpecifier })
                }
                lastSpecifier = this.createExportSpecifierAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastSpecifier) {
                    specifiers.push({
                        specifier: lastSpecifier,
                        commaToken: SlimeTokenCreate.createCommaToken(child.loc)
                    })
                    lastSpecifier = null
                }
            }
        }

        if (lastSpecifier) {
            specifiers.push({ specifier: lastSpecifier })
        }

        return specifiers
    }

    /**
     * 创建 ExportSpecifier AST
     */
    createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        // ExportSpecifier: ModuleExportName | ModuleExportName as ModuleExportName
        const children = cst.children || []
        let local: any = null
        let exported: any = null
        let asToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === SlimeParser.prototype.ModuleExportName?.name) {
                if (!local) {
                    local = this.createModuleExportNameAst(child)
                } else {
                    exported = this.createModuleExportNameAst(child)
                }
            } else if (child.name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        // If no 'as', exported is same as local
        if (!exported) {
            exported = local
        }

        return SlimeAstUtil.createExportSpecifier(local, exported, cst.loc, asToken)
    }

    /**
     * 创建 ModuleExportName AST
     */
    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const first = cst.children?.[0]
        if (!first) {
            throw new Error('ModuleExportName has no children')
        }

        if (first.name === SlimeParser.prototype.IdentifierName?.name) {
            return this.createIdentifierNameAst(first)
        } else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeAstUtil.createStringLiteral(first.value, first.loc)
        } else {
            // Direct token
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }
    }





    createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return this.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            // GeneratorDeclaration -> 类似FunctionDeclaration但有*�?
            return this.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            // AsyncFunctionDeclaration -> async function
            return this.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            // AsyncGeneratorDeclaration -> async function*
            return this.createAsyncGeneratorDeclarationAst(first)
        } else {
            throw new Error(`Unsupported HoistableDeclaration type: ${first.name}`)
        }
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // GeneratorDeclaration: function* name(params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // AsyncFunctionDeclaration: async function name(params) { body }
        // CST children: [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        // 或者旧�? [AsyncTok, FunctionTok, BindingIdentifier, LParen, FormalParameterList?, RParen, FunctionBodyDefine]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListAstWrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        // AsyncGeneratorDeclaration: async function* name(params) { body }
        // CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }



    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        // 检�?CST 节点名称是否�?ClassDeclaration
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        // Token fields
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点，提取 class token、标识符�?ClassTail
        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = this.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        // ClassTail 是必须的
        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        // 解析 ClassTail，获取类体和父类信息
        const classTailResult = this.createClassTailAst(classTailCst)

        // 创建类声�?AST 节点（id 可能�?null，用于匿名类�?
        const ast = SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )

        return ast
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null // 超类默认�?null
        let body: SlimeClassBody = {type: SlimeNodeType.ClassBody as any, body: [], loc: cst.loc} // 默认空类�?
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ClassTail = ClassHeritage? { ClassBody? }
        // 遍历 children 找到 ClassHeritage �?ClassBody
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = this.createClassHeritageAstWithToken(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = this.createClassBodyAst(child)
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 设置 body �?brace tokens
        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return {superClass, body, extendsToken, lBraceToken, rBraceToken}
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return this.createLeftHandSideExpressionAst(cst.children[1]) // ClassHeritage -> extends + LeftHandSideExpression
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined

        // ClassHeritage: extends LeftHandSideExpression
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc)
        }

        const superClass = this.createLeftHandSideExpressionAst(cst.children[1])
        return { superClass, extendsToken }
    }


    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.FieldDefinition?.name);

        // FieldDefinition -> (ClassElementName | PropertyName) + Initializer?
        // ES2022: ClassElementName = PrivateIdentifier | PropertyName
        const elementNameCst = cst.children[0]
        const key = this.createClassElementNameAst(elementNameCst)

        // 检查是否是计算属�?
        const isComputed = this.isComputedPropertyName(elementNameCst)

        // 检查是否有初始化器
        let value: SlimeExpression | null = null
        if (cst.children.length > 1) {
            const initializerCst = cst.children[1]
            if (initializerCst && initializerCst.name === SlimeParser.prototype.Initializer?.name) {
                value = this.createInitializerAst(initializerCst)
            }
        }

        // 检查是否有 static 修饰�?
        const isStatic = this.isStaticModifier(staticCst)

        // 注意参数顺序�?key, value, computed, isStatic, loc)
        return SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
    }



    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassBody?.name);
        const elementsWrapper = cst.children && cst.children[0] // ClassBody -> ClassElementList?，第一项为列表容器
        const body: Array<SlimeMethodDefinition | SlimePropertyDefinition | any> = [] // 收集类成员 (any 用于 StaticBlock)
        if (elementsWrapper && Array.isArray(elementsWrapper.children)) {
            for (const element of elementsWrapper.children) { // 遍历 ClassElement
                const elementChildren = element.children ?? [] // 兼容无子节点情况
                if (!elementChildren.length) {
                    continue // 没有内容�?ClassElement 直接忽略
                }

                // 找到真正的成员定义（跳过 static �?SemicolonASI�?
                let staticCst: SubhutiCst | null = null
                let targetCst: SubhutiCst | null = null
                let classStaticBlockCst: SubhutiCst | null = null

                for (const child of elementChildren) {
                    if (child.name === 'Static' || child.value === 'static') {
                        staticCst = child
                    } else if (child.name === 'SemicolonASI' || child.name === 'Semicolon' || child.value === ';') {
                        // 跳过分号
                        continue
                    } else if (child.name === 'ClassStaticBlock') {
                        // ES2022 静态块
                        classStaticBlockCst = child
                    } else if (child.name === SlimeParser.prototype.MethodDefinition?.name ||
                        child.name === SlimeParser.prototype.FieldDefinition?.name ||
                        child.name === 'MethodDefinition' || child.name === 'FieldDefinition') {
                        targetCst = child
                    }
                }

                // 处理静态块
                if (classStaticBlockCst) {
                    const staticBlock = this.createClassStaticBlockAst(classStaticBlockCst)
                    if (staticBlock) {
                        body.push(staticBlock)
                    }
                    continue
                }

                if (targetCst) {
                    // 根据成员类型直接调用对应方法
                    if (targetCst.name === SlimeParser.prototype.MethodDefinition?.name) {
                        body.push(this.createMethodDefinitionAst(staticCst, targetCst))
                    } else if (targetCst.name === SlimeParser.prototype.FieldDefinition?.name) {
                        body.push(this.createFieldDefinitionAst(staticCst, targetCst))
                    }
                }
            }
        }
        return {
            type: astName as any, // 构�?ClassBody AST
            body: body, // 挂载类成员数�?
            loc: cst.loc // 透传位置信息
        }
    }

    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    createClassStaticBlockAst(cst: SubhutiCst): any {
        // CST 结构: ClassStaticBlock -> [IdentifierName:"static", LBrace, ClassStaticBlockBody, RBrace]
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let bodyStatements: SlimeStatement[] = []

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'ClassStaticBlockBody') {
                // ClassStaticBlockBody -> ClassStaticBlockStatementList -> StatementList
                const stmtListCst = child.children?.find((c: any) =>
                    c.name === 'ClassStaticBlockStatementList' || c.name === 'StatementList'
                )
                if (stmtListCst) {
                    const actualStatementList = stmtListCst.name === 'ClassStaticBlockStatementList'
                        ? stmtListCst.children?.find((c: any) => c.name === 'StatementList')
                        : stmtListCst
                    if (actualStatementList) {
                        bodyStatements = this.createStatementListAst(actualStatementList)
                    }
                }
            }
        }

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken)
    }

    // ==================== 函数/类相关转换方�?====================

    /**
     * GeneratorMethod CST �?AST
     * GeneratorMethod -> * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
     */
    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, false)
    }



    /**
     * AsyncMethod CST �?AST
     * AsyncMethod -> async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody }
     */
    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', false, true)
    }

    /**
     * AsyncGeneratorMethod CST �?AST
     */
    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionAstInternal(cst, 'method', true, true)
    }


    /**
     * 内部辅助方法：创建 MethodDefinition AST
     */
    createMethodDefinitionAstInternal(cst: SubhutiCst, kind: 'method' | 'get' | 'set', generator: boolean, async: boolean): SlimeMethodDefinition {
        // 查找属性名
        const classElementName = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ClassElementName?.name ||
            ch.name === 'ClassElementName' ||
            ch.name === SlimeParser.prototype.PropertyName?.name ||
            ch.name === 'PropertyName'
        )

        const key = classElementName ? this.createClassElementNameAst(classElementName) : null

        // 查找参数
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.UniqueFormalParameters?.name ||
            ch.name === 'UniqueFormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameters?.name ||
            ch.name === 'FormalParameters'
        )
        const params = formalParams ? this.createFormalParametersAst(formalParams) : []

        // 查找函数�?
        const bodyNode = cst.children?.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === 'AsyncFunctionBody' ||
            ch.name === 'AsyncGeneratorBody' || ch.name === 'FunctionBody' ||
            ch.name === SlimeParser.prototype.FunctionBody?.name
        )
        const bodyStatements = bodyNode ? this.createFunctionBodyAst(bodyNode) : []
        const body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode?.loc)

        const value: SlimeFunctionExpression = {
            type: SlimeNodeType.FunctionExpression,
            id: null,
            params: params as any,
            body: body,
            generator: generator,
            async: async,
            loc: cst.loc
        } as any

        return SlimeAstUtil.createMethodDefinition(key, value, kind, false, false, cst.loc)
    }

    /**
     * ClassElement CST �?AST
     * ClassElement -> MethodDefinition | static MethodDefinition | FieldDefinition | ...
     */
    createClassElementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        // 检查是否是 static
        let staticCst: SubhutiCst | null = null
        let startIndex = 0
        if (firstChild.name === 'Static' || firstChild.value === 'static') {
            staticCst = firstChild
            startIndex = 1
        }

        const actualChild = cst.children?.[startIndex]
        if (!actualChild) return null

        // 根据类型处理
        if (actualChild.name === SlimeParser.prototype.MethodDefinition?.name ||
            actualChild.name === 'MethodDefinition') {
            return this.createMethodDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.FieldDefinition?.name ||
            actualChild.name === 'FieldDefinition') {
            return this.createFieldDefinitionAst(staticCst, actualChild)
        } else if (actualChild.name === SlimeParser.prototype.ClassStaticBlock?.name ||
            actualChild.name === 'ClassStaticBlock') {
            return this.createClassStaticBlockAst(actualChild)
        }

        return null
    }


    /**
     * ClassElementList CST �?AST
     */
    createClassElementListAst(cst: SubhutiCst): any[] {
        const elements: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ClassElement?.name || child.name === 'ClassElement') {
                const element = this.createClassElementAst(child)
                if (element) {
                    elements.push(element)
                }
            }
        }
        return elements
    }

    /**
     * ClassStaticBlockBody CST �?AST
     */
    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        )
        if (stmtList) {
            return this.createClassStaticBlockStatementListAst(stmtList)
        }
        return []
    }

    /**
     * ClassStaticBlockStatementList CST �?AST
     */
    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            return this.createStatementListAst(stmtList)
        }
        return []
    }






    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 注意：参数顺序是 (staticCst, cst)，与调用保持一�?
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.MethodDefinition?.name);
        const first = cst.children?.[0]

        if (!first) {
            throw new Error('MethodDefinition has no children')
        }

        if (first.name === 'ClassElementName') {
            // MethodDefinition 分支: ClassElementName ( UniqueFormalParameters ) { FunctionBody }
            return this.createMethodDefinitionClassElementNameAst(staticCst, cst)
        } else if (first.name === 'Get') {
            // MethodDefinition 分支: get ClassElementName ( ) { FunctionBody }
            return this.createMethodDefinitionGetterMethodAst(staticCst, cst)
        } else if (first.name === 'Set') {
            // MethodDefinition 分支: set ClassElementName ( PropertySetParameterList ) { FunctionBody }
            return this.createMethodDefinitionSetterMethodAst(staticCst, cst)
        } else if (first.name === SlimeParser.prototype.GeneratorMethod?.name || first.name === 'GeneratorMethod') {
            // MethodDefinition 分支: GeneratorMethod
            return this.createMethodDefinitionGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'AsyncMethod' || first.name === SlimeParser.prototype.AsyncMethod?.name) {
            // MethodDefinition 分支: AsyncMethod
            return this.createMethodDefinitionAsyncMethodAst(staticCst, first)
        } else if (first.name === 'AsyncGeneratorMethod' || first.name === SlimeParser.prototype.AsyncGeneratorMethod?.name) {
            // MethodDefinition 分支: AsyncGeneratorMethod
            return this.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, first)
        } else if (first.name === 'Asterisk') {
            // MethodDefinition 分支: * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
            return this.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
        } else if (first.name === 'Async') {
            // MethodDefinition 分支: async [no LineTerminator here] ClassElementName ( ... ) { ... }
            return this.createMethodDefinitionAsyncMethodFromChildren(staticCst, cst)
        } else if (first.name === 'IdentifierName' || first.name === 'IdentifierName' ||
            first.name === 'PropertyName' || first.name === 'LiteralPropertyName') {
            // 检查是否是 getter/setter
            if (first.value === 'get' && cst.children[1]?.name === 'ClassElementName') {
                // getter方法：get ClassElementName ( ) { FunctionBody }
                return this.createMethodDefinitionGetterMethodFromIdentifier(staticCst, cst)
            } else if (first.value === 'set' && cst.children[1]?.name === 'ClassElementName') {
                // setter方法：set ClassElementName ( PropertySetParameterList ) { FunctionBody }
                return this.createMethodDefinitionSetterMethodFromIdentifier(staticCst, cst)
            }
            // MethodDefinition 分支: 直接的标识符作为方法名
            return this.createMethodDefinitionMethodDefinitionFromIdentifier(staticCst, cst)
        } else {
            throw new Error('不支持的类型: ' + first.name)
        }
    }

    // ==================== ES2025 内部辅助方法 ====================
    // 以下方法是处�?ES2025 Parser CST 结构的内部辅助方法，不直接对�?CST 规则�?
    // 存在必要性：ES2025 Parser �?CST 结构�?ES6 有差异，需要专门的处理逻辑�?

    /**
     * [内部方法] 从直接的标识符创建方法定�?
     * 处理 ES2025 Parser �?IdentifierNameTok ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionMethodDefinitionFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检�?static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // 第一个子节点是方法名（可能是 IdentifierNameTok, IdentifierName, PropertyName, LiteralPropertyName�?
        const firstChild = children[i++]
        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression

        if (firstChild.name === 'IdentifierName') {
            // 直接�?token
            key = SlimeAstUtil.createIdentifier(firstChild.value, firstChild.loc)
        } else if (firstChild.name === 'IdentifierName') {
            // IdentifierName 规则节点
            const tokenCst = firstChild.children[0]
            key = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
        } else if (firstChild.name === 'PropertyName' || firstChild.name === 'LiteralPropertyName') {
            key = this.createPropertyNameAst(firstChild)
        } else {
            key = this.createClassElementNameAst(firstChild)
        }

        // LParen
        if (children[i]?.name === 'LParen' || children[i]?.value === '(') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = this.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = this.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen
        if (children[i]?.name === 'RParen' || children[i]?.value === ')') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace
        if (children[i]?.name === 'LBrace' || children[i]?.value === '{') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            body = SlimeAstUtil.createBlockStatement(bodyStatements, children[i].loc, lBraceToken, rBraceToken)
            i++
        } else {
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // RBrace
        if (children[i]?.name === 'RBrace' || children[i]?.value === '}') {
            rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
        }

        // 创建函数表达�?
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && (key as SlimeIdentifier).name === "constructor" &&
            !this.isStaticModifier(staticCst)

        const isStatic = this.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, false, isStatic, cst.loc, staticToken)

        return methodDef
    }

    /**
     * [内部方法] 普通方法定�?
     * 处理 ES2025 Parser �?ClassElementName ( UniqueFormalParameters ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, FunctionBody?, RBrace]
        let i = 0
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // ClassElementName
        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters (使用包装类型)
        let params: SlimeFunctionParam[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = this.createUniqueFormalParametersAstWrapped(children[i])
            i++
        } else if (children[i]?.name === 'FormalParameters' || children[i]?.name === SlimeParser.prototype.FormalParameters?.name) {
            params = this.createFormalParametersAstWrapped(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            i++
            // RBrace - 在 FunctionBody 之后
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            // RBrace - 可能直接在这里
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        // 检查是否是计算属性
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // 检查是否是 constructor
        const isConstructor = key.type === "Identifier" && key.name === "constructor" &&
            !this.isStaticModifier(staticCst)

        const isStatic = this.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)

        return methodDef
    }

    /**
     * [内部方法] getter 方法
     * 处理 ES2025 Parser 的 get ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [GetTok, ClassElementName, LParen, RParen, LBrace, FunctionBody?, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // GetTok
        if (children[i]?.name === 'Get' || children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }

    /**
     * [内部方法] setter 方法
     * 处理 ES2025 Parser 的 set ClassElementName ( PropertySetParameterList ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // children: [SetTok, ClassElementName, LParen, PropertySetParameterList, RParen, LBrace, FunctionBody?, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // SetTok
        if (children[i]?.name === 'Set' || children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = this.createPropertySetParameterListAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }

    /**
     * [内部方法] getter 方法 (以 IdentifierNameTok="get" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="get" ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="get"
        if (children[i]?.value === 'get') {
            getToken = SlimeTokenCreate.createGetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }
        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'get', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, getToken)

        return methodDef
    }

    /**
     * [内部方法] setter 方法 (以 IdentifierNameTok="set" 开始)
     * 处理 ES2025 Parser 的 IdentifierNameTok="set" ClassElementName ( ... ) { FunctionBody } 结构
     * @internal
     */
    createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let setToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // IdentifierNameTok="set"
        if (children[i]?.value === 'set') {
            setToken = SlimeTokenCreate.createSetToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // PropertySetParameterList 或直接的 BindingIdentifier
        let params: SlimePattern[] = []
        if (children[i]?.name === 'PropertySetParameterList' || children[i]?.name === SlimeParser.prototype.PropertySetParameterList?.name) {
            params = this.createPropertySetParameterListAst(children[i])
            i++
        } else if (children[i]?.name === 'BindingIdentifier' || children[i]?.name === 'BindingElement') {
            // 直接的参数标识符
            params = [this.createBindingIdentifierAst(children[i])]
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // FunctionBody
        let body: SlimeBlockStatement
        if (children[i]?.name === 'FunctionBody' || children[i]?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(children[i])
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'set', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, setToken)

        return methodDef
    }

    /**
     * [内部方法] generator 方法
     * 处理 ES2025 Parser 的 * ClassElementName ( UniqueFormalParameters ) { GeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // GeneratorMethod children: [Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, GeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = this.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // GeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'GeneratorBody' || bodyChild?.name === SlimeParser.prototype.GeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, false, cst.loc,
            undefined, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken)

        return methodDef
    }

    /**
     * [内部方法] generator 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser 的 async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncMethod children: [AsyncTok, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = this.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncFunctionBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncFunctionBody' || bodyChild?.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, false, true, cst.loc,
            undefined, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, undefined, asyncToken)

        return methodDef
    }

    /**
     * [内部方法] async 方法 (�?MethodDefinition children 直接处理)
     * @internal
     */
    createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // 检查是否是 AsyncGeneratorMethod (async * ...)
        const children = cst.children
        if (children[1]?.name === 'Asterisk') {
            return this.createMethodDefinitionAsyncGeneratorMethodAst(staticCst, cst)
        }
        return this.createMethodDefinitionAsyncMethodAst(staticCst, cst)
    }

    /**
     * [内部方法] async generator 方法
     * 处理 ES2025 Parser 的 async * ClassElementName ( ... ) { AsyncGeneratorBody } 结构
     * @internal
     */
    createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        // AsyncGeneratorMethod children: [AsyncTok, Asterisk, ClassElementName, LParen, UniqueFormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]
        const children = cst.children
        let i = 0

        // Token fields
        let staticToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 检查 static token
        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        // AsyncTok
        if (children[i]?.name === 'Async' || children[i]?.value === 'async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(children[i].loc)
            i++
        }

        // Asterisk
        if (children[i]?.name === 'Asterisk' || children[i]?.value === '*') {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(children[i].loc)
            i++
        }

        const classElementNameCst = children[i++]
        const key = this.createClassElementNameAst(classElementNameCst)
        const isComputed = this.isComputedPropertyName(classElementNameCst)

        // LParen - 保存 token 信息
        if (children[i]?.name === 'LParen') {
            lParenToken = SlimeTokenCreate.createLParenToken(children[i].loc)
            i++
        }

        // UniqueFormalParameters
        let params: SlimePattern[] = []
        if (children[i]?.name === 'UniqueFormalParameters' || children[i]?.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
            params = this.createUniqueFormalParametersAst(children[i])
            i++
        }

        // RParen - 保存 token 信息
        if (children[i]?.name === 'RParen') {
            rParenToken = SlimeTokenCreate.createRParenToken(children[i].loc)
            i++
        }
        // LBrace - 保存 token 信息
        if (children[i]?.name === 'LBrace') {
            lBraceToken = SlimeTokenCreate.createLBraceToken(children[i].loc)
            i++
        }

        // AsyncGeneratorBody 或 FunctionBody
        let body: SlimeBlockStatement
        const bodyChild = children[i]
        if (bodyChild?.name === 'AsyncGeneratorBody' || bodyChild?.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            bodyChild?.name === 'FunctionBody' || bodyChild?.name === SlimeParser.prototype.FunctionBody?.name) {
            const bodyStatements = this.createFunctionBodyAst(bodyChild)
            i++
            // RBrace
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            if (children[i]?.name === 'RBrace') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(children[i].loc)
            }
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式，传递 token 信息
        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, params as any, true, true, cst.loc,
            undefined, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )

        const methodDef = SlimeAstUtil.createMethodDefinition(key, functionExpression, 'method', isComputed, this.isStaticModifier(staticCst), cst.loc, staticToken, undefined, undefined, asteriskToken, asyncToken)

        return methodDef
    }

    /**
     * 处理 UniqueFormalParameters CST 节点
     */
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeParser.prototype.FormalParameters?.name) {
            return this.createFormalParametersAst(first)
        }
        // 可能直接�?FormalParameterList
        return this.createFormalParametersAst(cst)
    }

    /** 返回包装类型的版�?*/
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeParser.prototype.FormalParameters?.name) {
            return this.createFormalParametersAstWrapped(first)
        }
        // 可能直接�?FormalParameterList
        return this.createFormalParametersAstWrapped(cst)
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
     * AssignmentOperator CST �?AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }








    // 生成器表达式处理：function* (...) { ... }
    createGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // GeneratorExpression: function* [name](params) { body }
        // 旧版 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameterList?, RParen, FunctionBodyDefine]
        // Es2025 CST children: [FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, GeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 GeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, false, cst.loc)
        return func
    }

    // Async 函数表达式处理：async function (...) { ... }
    createAsyncFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // AsyncFunctionExpression: async function [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncFunctionBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncFunctionBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, false, true, cst.loc)
        return func
    }

    // Async Generator 表达式处理：async function* (...) { ... }
    createAsyncGeneratorExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        // AsyncGeneratorExpression: async function* [name](params) { body }
        // Es2025 CST children: [AsyncTok, FunctionTok, Asterisk, BindingIdentifier?, LParen, FormalParameters?, RParen, LBrace, AsyncGeneratorBody, RBrace]

        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        // 查找 BindingIdentifier
        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = this.createBindingIdentifierAst(bindingId)
        }

        // 查找 FormalParameters �?FormalParameterList (使用包装类型)
        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = this.createFormalParametersAstWrapped(formalParams)
            } else {
                params = this.createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        // 查找 AsyncGeneratorBody �?FunctionBody
        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = this.createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        const func = SlimeAstUtil.createFunctionExpression(body, id, params, true, true, cst.loc)
        return func
    }




    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null // class 表达式可选的标识�?
        let tailStartIndex = 1 // 默认 ClassTail 位于索引 1
        const nextChild = cst.children[1]
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = this.createBindingIdentifierAst(nextChild) // 若存在标识符则解�?
            tailStartIndex = 2 // ClassTail 的位置后�?
        }
        const classTail = this.createClassTailAst(cst.children[tailStartIndex]) // 统一解析 ClassTail

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc) // 生成 ClassExpression AST
    }









}

const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
