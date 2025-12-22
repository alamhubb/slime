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
import SlimeTokenConsumer from "./SlimeTokenConsumer.ts";
import {SlimeAstUtil, SlimeTokenCreate, SlimeNodeType} from "slime-ast";
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



    /*createImportClauseAst(cst: SubhutiCst.ts):Array<SlimeImportSpecifier | SlimeImportDefaultSpecifier | SlimeImportNamespaceSpecifier>{
    let astName = SlimeAstUtils.checkCstName(cst, Es2025Parser.prototype.ImportClause?.name);


  }*/



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
     * AssignmentOperator CST �?AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }


}

const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
