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
import { IdentifierCstToAst } from "./cstToAst/converters/identifier/IdentifierCstToAst.ts";
import { LiteralCstToAst } from "./cstToAst/converters/literal/LiteralCstToAst.ts";
import { CompoundLiteralCstToAst } from "./cstToAst/converters/literal/CompoundLiteralCstToAst.ts";
import { UnaryExpressionCstToAst } from "./cstToAst/converters/expression/UnaryExpressionCstToAst.ts";
import { BinaryExpressionCstToAst } from "./cstToAst/converters/expression/BinaryExpressionCstToAst.ts";
import { MemberCallCstToAst } from "./cstToAst/converters/expression/MemberCallCstToAst.ts";
import { PrimaryExpressionCstToAst } from "./cstToAst/converters/expression/PrimaryExpressionCstToAst.ts";
import { ControlFlowCstToAst } from "./cstToAst/converters/statement/ControlFlowCstToAst.ts";
import { OtherStatementCstToAst } from "./cstToAst/converters/statement/OtherStatementCstToAst.ts";
import { ParametersCstToAst } from "./cstToAst/converters/function/ParametersCstToAst.ts";
import { FunctionExpressionCstToAst } from "./cstToAst/converters/function/FunctionExpressionCstToAst.ts";
import { ArrowFunctionCstToAst } from "./cstToAst/converters/function/ArrowFunctionCstToAst.ts";
import { ClassDeclarationCstToAst } from "./cstToAst/converters/class/ClassDeclarationCstToAst.ts";
import { ClassBodyCstToAst } from "./cstToAst/converters/class/ClassBodyCstToAst.ts";
import { MethodDefinitionCstToAst } from "./cstToAst/converters/class/MethodDefinitionCstToAst.ts";
import { ImportCstToAst } from "./cstToAst/converters/module/ImportCstToAst.ts";
import { ExportCstToAst } from "./cstToAst/converters/module/ExportCstToAst.ts";
import { BindingPatternCstToAst } from "./cstToAst/converters/pattern/BindingPatternCstToAst.ts";
import { PatternConvertCstToAst } from "./cstToAst/converters/pattern/PatternConvertCstToAst.ts";
import { TemplateCstToAst } from "./cstToAst/converters/misc/TemplateCstToAst.ts";
import { VariableCstToAst } from "./cstToAst/converters/declaration/VariableCstToAst.ts";
import { HoistableCstToAst } from "./cstToAst/converters/declaration/HoistableCstToAst.ts";


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
        return IdentifierCstToAst.createIdentifierReferenceAst(cst);
    }

    /**
     * 创建 LabelIdentifier �?AST
     *
     * 语法：LabelIdentifier -> Identifier | [~Yield] yield | [~Await] await
     *
     * LabelIdentifier 用于 break/continue 语句的标签和 LabelledStatement 的标签�?
     * 结构�?IdentifierReference 相同�?
     */
    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createLabelIdentifierAst(cst);
    }

    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierAst(cst);
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

        // 遍历子节点，处理 HashbangComment 和主体内?
        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                // 提取 Hashbang 注释的?
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
            // 没有主体内容（可能只?HashbangComment?
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
     * Program CST ?AST
     *
     * 存在必要性：Program 是顶层入口规则，需要处?Script ?Module 两种情况?
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
        // 如果直接就是内容，调?toProgram
        return this.toProgram(cst)
    }

    /**
     * Script CST ?AST
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
     * ScriptBody CST ?AST
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
     * Module CST ?AST
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
     * ModuleBody CST ?AST
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
     * NameSpaceImport CST 转 AST
     * NameSpaceImport -> * as ImportedBinding
     */
    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        return ImportCstToAst.createNameSpaceImportAst(cst, this)
    }

    /**
     * NamedImports CST 转 AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ImportCstToAst.createNamedImportsAst(cst, this)
    }

    /**
     * ImportsList CST 转 AST
     * ImportsList -> ImportSpecifier (, ImportSpecifier)*
     */
    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        return ImportCstToAst.createImportsListAst(cst, this)
    }

    /**
     * ImportSpecifier CST 转 AST
     * ImportSpecifier -> ImportedBinding | ModuleExportName as ImportedBinding
     */
    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        return ImportCstToAst.createImportSpecifierAst(cst, this)
    }

    /**
     * AttributeKey CST 转 AST
     * AttributeKey -> IdentifierName | StringLiteral
     */
    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ImportCstToAst.createAttributeKeyAst(cst, this)
    }

    /**
     * ExportFromClause CST 转 AST
     * ExportFromClause -> * | * as ModuleExportName | NamedExports
     */
    createExportFromClauseAst(cst: SubhutiCst): any {
        return ExportCstToAst.createExportFromClauseAst(cst, this)
    }

    /**
     * WithEntries CST 转 AST
     * WithEntries -> AttributeKey : StringLiteral (, AttributeKey : StringLiteral)*
     */
    createWithEntriesAst(cst: SubhutiCst): any[] {
        return ImportCstToAst.createWithEntriesAst(cst, this)
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
        return ImportCstToAst.createImportDeclarationAst(cst, this)
    }

    /** 解析 WithClause: with { type: "json" } */
    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        return ImportCstToAst.createWithClauseAst(cst, this)
    }


    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        return ImportCstToAst.createFromClauseAst(cst, this)
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        return ImportCstToAst.createModuleSpecifierAst(cst, this)
    }

    createImportClauseAst(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        return ImportCstToAst.createImportClauseAst(cst, this)
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        return ImportCstToAst.createImportedDefaultBindingAst(cst, this)
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        return ImportCstToAst.createImportedBindingAst(cst, this)
    }

    /** 返回包装类型的版本，包含 brace tokens */
    createNamedImportsListAstWrapped(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        return ImportCstToAst.createNamedImportsListAstWrapped(cst, this)
    }

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierNameAst(cst);
    }

    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createBindingIdentifierAst(cst);
    }


    /*createImportClauseAst(cst: SubhutiCst.ts):Array<SlimeImportSpecifier | SlimeImportDefaultSpecifier | SlimeImportNamespaceSpecifier>{
    let astName = checkCstName(cst, Es2025Parser.prototype.ImportClause?.name);


  }*/


    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => this.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            // 如果?Declaration，直接处?
            if (item.name === SlimeParser.prototype.Declaration?.name) {
                return [this.createDeclarationAst(item) as any]
            }

            // 如果?Statement，需要特殊处?FunctionExpression ?ClassExpression
            const statement = this.createStatementAst(item)
            const result = statement.flat()

            // 检查是否是命名?FunctionExpression ?ClassExpression（应该转?Declaration?
            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression

                    // 命名?FunctionExpression ?FunctionDeclaration
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

                    // ClassExpression ?ClassDeclaration
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
        const astName = checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => this.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)  // 过滤?undefined
        return statements
    }

    /**
     * [核心分发方法] 根据 CST 节点类型创建对应?Statement/Declaration AST
     *
     * 存在必要性：ECMAScript 语法?Statement ?Declaration 有多种具体类型，
     * 需要一个统一的分发方法来处理各种语句和声明?
     *
     * 处理的节点类型包括：
     * - Statement 包装节点 ?递归处理子节?
     * - BreakableStatement ?IterationStatement | SwitchStatement
     * - VariableStatement ?VariableDeclaration
     * - ExpressionStatement ?ExpressionStatement
     * - IfStatement, ForStatement, WhileStatement 等具体语?
     * - FunctionDeclaration, ClassDeclaration 等声?
     */
    createStatementDeclarationAst(cst: SubhutiCst) {
        // Statement - 包装节点，递归处理子节?
        if (cst.name === SlimeParser.prototype.Statement?.name || cst.name === 'Statement') {
            if (cst.children && cst.children.length > 0) {
                return this.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // BreakableStatement - 包装节点，递归处理子节?
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
        // IfStatementBody - if/else 语句体包装节点，递归处理子节?
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
        // 变量声明 (用于 for 循环?
        else if (cst.name === SlimeParser.prototype.VariableDeclaration?.name) {
            return this.createVariableDeclarationAst(cst)
        }
        // 表达式语?
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
        // 块语?
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
        // 空语?
        else if (cst.name === SlimeParser.prototype.EmptyStatement?.name) {
            return this.createEmptyStatementAst(cst)
        }
        // 函数声明
        else if (cst.name === SlimeParser.prototype.FunctionDeclaration?.name) {
            return this.createFunctionDeclarationAst(cst)
        }
        // 类声?
        else if (cst.name === SlimeParser.prototype.ClassDeclaration?.name) {
            return this.createClassDeclarationAst(cst)
        }
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        return ExportCstToAst.createExportDeclarationAst(cst, this)
    }

    /**
     * 创建 NamedExports AST (export { a, b, c })
     */
    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ExportCstToAst.createNamedExportsAst(cst, this)
    }

    /**
     * 创建 ExportsList AST
     */
    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        return ExportCstToAst.createExportsListAst(cst, this)
    }

    /**
     * 创建 ExportSpecifier AST
     */
    createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        return ExportCstToAst.createExportSpecifierAst(cst, this)
    }

    /**
     * 创建 ModuleExportName AST
     */
    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return ExportCstToAst.createModuleExportNameAst(cst, this)
    }

    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return HoistableCstToAst.createDeclarationAst(cst, this)
    }

    createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createLexicalDeclarationAst(cst, this)
    }

    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createLexicalBindingAst(cst, this)
    }

    /**
     * 创建 var 变量声明语句 AST
     * ES2025 VariableStatement: var VariableDeclarationList ;
     */
    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createVariableStatementAst(cst, this)
    }

    /**
     * ?VariableDeclaration CST 创建 VariableDeclarator AST
     * VariableDeclaration: BindingIdentifier Initializer? | BindingPattern Initializer
     */
    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        return VariableCstToAst.createVariableDeclaratorFromVarDeclaration(cst, this)
    }

    createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        return HoistableCstToAst.createHoistableDeclarationAst(cst, this)
    }

    createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionExpressionCstToAst.createGeneratorDeclarationAst(cst, this)
    }

    createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionExpressionCstToAst.createAsyncFunctionDeclarationAst(cst, this)
    }

    createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        return FunctionExpressionCstToAst.createAsyncGeneratorDeclarationAst(cst, this)
    }

    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        return VariableCstToAst.createVariableDeclarationAst(cst, this)
    }

    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        return VariableCstToAst.createVariableDeclarationListAst(cst, this)
    }

    createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        return ClassDeclarationCstToAst.createClassDeclarationAst(cst, this)
    }

    createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        return ClassDeclarationCstToAst.createClassTailAst(cst, this)
    }

    createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        return ClassDeclarationCstToAst.createClassHeritageAst(cst, this)
    }

    createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        return ClassDeclarationCstToAst.createClassHeritageAstWithToken(cst, this)
    }

    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return this.createAssignmentExpressionAst(assignmentExpressionCst)
    }

    createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        return MethodDefinitionCstToAst.createFieldDefinitionAst(staticCst, cst, this)
    }

    /**
     * 检查 ClassElementName/PropertyName 是否是计算属性名
     */
    isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false

        // 递归查找 ComputedPropertyName
        function hasComputedPropertyName(node: SubhutiCst): boolean {
            if (!node) return false
            if (node.name === 'ComputedPropertyName' || node.name === SlimeParser.prototype.ComputedPropertyName?.name) {
                return true
            }
            if (node.children) {
                for (const child of node.children) {
                    if (hasComputedPropertyName(child)) return true
                }
            }
            return false
        }

        return hasComputedPropertyName(cst)
    }

    /**
     * [AST 类型映射] PrivateIdentifier 终端??Identifier AST
     *
     * 存在必要性：PrivateIdentifier ?CST 中是一个终端符（token），
     * 但在 ESTree AST 中需要表示为 Identifier 节点，name ?# 开头?
     *
     * PrivateIdentifier :: # IdentifierName
     * AST 表示：{ type: "Identifier", name: "#count" }
     */
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createPrivateIdentifierAst(cst);
    }

    /**
     * 检?CST 节点是否表示 static 修饰?
     * 兼容 Static ?IdentifierNameTok (value='static') 两种情况
     */
    isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        // 方式1：直接是 Static
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static' || cst.name === 'Static') {
            return true
        }
        // 方式2：是 IdentifierNameTok �?value �?'static'
        if ((cst.name === 'IdentifierName' || cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }

    createClassBodyAst(cst: SubhutiCst): SlimeClassBody {
        return ClassBodyCstToAst.createClassBodyAst(cst, this)
    }

    /**
     * 创建 ClassStaticBlock AST (ES2022)
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    createClassStaticBlockAst(cst: SubhutiCst): any {
        return ClassBodyCstToAst.createClassStaticBlockAst(cst, this)
    }

    // ==================== 函数/类相关转换方法 ====================

    /**
     * GeneratorMethod CST 到 AST
     * GeneratorMethod -> * ClassElementName ( UniqueFormalParameters ) { GeneratorBody }
     */
    createGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createGeneratorMethodAst(cst, this)
    }

    /**
     * GeneratorBody CST 到 AST（透传到 FunctionBody）
     */
    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }

    /**
     * AsyncMethod CST 到 AST
     * AsyncMethod -> async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody }
     */
    createAsyncMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncMethodAst(cst, this)
    }

    /**
     * AsyncFunctionBody CST 到 AST（透传到 FunctionBody）
     */
    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }

    /**
     * AsyncGeneratorMethod CST 到 AST
     */
    createAsyncGeneratorMethodAst(cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createAsyncGeneratorMethodAst(cst, this)
    }

    /**
     * AsyncGeneratorBody CST 到 AST（透传到 FunctionBody）
     */
    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }

    /**
     * ClassElement CST 到 AST
     * ClassElement -> MethodDefinition | static MethodDefinition | FieldDefinition | ...
     */
    createClassElementAst(cst: SubhutiCst): any {
        return ClassBodyCstToAst.createClassElementAst(cst, this)
    }

    /**
     * ClassElementList CST 到 AST
     */
    createClassElementListAst(cst: SubhutiCst): any[] {
        return ClassBodyCstToAst.createClassElementListAst(cst, this)
    }

    /**
     * ClassStaticBlockBody CST 到 AST
     */
    createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassBodyCstToAst.createClassStaticBlockBodyAst(cst, this)
    }

    /**
     * ClassStaticBlockStatementList CST 到 AST
     */
    createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return ClassBodyCstToAst.createClassStaticBlockStatementListAst(cst, this)
    }

    /**
     * PropertySetParameterList CST 到 AST
     */
    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return MethodDefinitionCstToAst.createPropertySetParameterListAst(cst, this)
    }

    /**
     * ClassElementName CST 到 AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassElementName?.name)
        const first = cst.children[0]
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children')
        }
        if (first.name === 'PrivateIdentifier') {
            return this.createPrivateIdentifierAst(first)
        }
        // PropertyName
        return this.createPropertyNameAst(first)
    }

    /**
     * AsyncArrowBindingIdentifier CST 到 AST
     */
    createAsyncArrowBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const bindingId = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name ||
            ch.name === 'BindingIdentifier'
        )
        if (bindingId) {
            return this.createBindingIdentifierAst(bindingId)
        }
        // 直接是标识符
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createBindingIdentifierAst(firstChild)
        }
        throw new Error('AsyncArrowBindingIdentifier has no identifier')
    }

    /**
     * AsyncConciseBody CST 到 AST
     */
    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return this.createConciseBodyAst(cst)
    }

    /**
     * AsyncArrowHead CST 到 AST（透传）
     */
    createAsyncArrowHeadAst(cst: SubhutiCst): any {
        // AsyncArrowHead 主要用于解析，实际 AST 处理在 AsyncArrowFunction 中
        return cst.children?.[0] ? this.createAstFromCst(cst.children[0]) : null
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        return ParametersCstToAst.createFormalParameterListAst(cst, this)
    }

    createBindingElementAst(cst: SubhutiCst): any {
        const astName = checkCstName(cst, SlimeParser.prototype.BindingElement?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.SingleNameBinding?.name) {
            return this.createSingleNameBindingAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name ||
            first.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
            first.name === SlimeParser.prototype.ObjectBindingPattern?.name) {
            // 解构参数：function({name, age}) �?function([a, b])
            // 检查是否有 Initializer（默认值）
            const initializer = cst.children.find(ch => ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer')
            let pattern: SlimePattern
            if (first.name === SlimeParser.prototype.BindingPattern?.name) {
                pattern = this.createBindingPatternAst(first)
            } else if (first.name === SlimeParser.prototype.ArrayBindingPattern?.name) {
                pattern = this.createArrayBindingPatternAst(first)
            } else {
                pattern = this.createObjectBindingPatternAst(first)
            }

            if (initializer) {
                // 有默认值，创建 AssignmentPattern
                const init = this.createInitializerAst(initializer)
                return {
                    type: SlimeNodeType.AssignmentPattern,
                    left: pattern,
                    right: init,
                    loc: cst.loc
                }
            }
            return pattern
        }
        return this.createSingleNameBindingAst(first)
    }

    createSingleNameBindingAst(cst: SubhutiCst): any {
        const astName = checkCstName(cst, SlimeParser.prototype.SingleNameBinding?.name);
        //BindingIdentifier + Initializer?
        const first = cst.children[0]
        const id = this.createBindingIdentifierAst(first)

        // 检查是否有默认值（Initializer�?
        const initializer = cst.children.find(ch => ch.name === SlimeParser.prototype.Initializer?.name)
        if (initializer) {
            // 有默认值，创建AssignmentPattern
            const init = this.createInitializerAst(initializer)
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: id,
                right: init,
                loc: cst.loc
            }
        }

        return id
    }


    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        return ParametersCstToAst.createFunctionRestParameterAst(cst, this)
    }

    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        const astName = checkCstName(cst, SlimeParser.prototype.BindingRestElement?.name);
        // BindingRestElement: ... BindingIdentifier | ... BindingPattern
        const argumentCst = cst.children[1]

        let argument: SlimeIdentifier | SlimePattern

        if (argumentCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            // 简单情况：...rest
            argument = this.createBindingIdentifierAst(argumentCst)
        } else if (argumentCst.name === SlimeParser.prototype.BindingPattern?.name) {
            // 嵌套解构�?..[a, b] �?...{x, y}
            argument = this.createBindingPatternAst(argumentCst)
        } else {
            throw new Error(`BindingRestElement: 不支持的类型 ${argumentCst.name}`)
        }

        return SlimeAstUtil.createRestElement(argument)
    }

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionExpressionCstToAst.createFunctionBodyAst(cst, this)
    }

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        return FunctionExpressionCstToAst.createFunctionStatementListAst(cst, this)
    }

    /**
     * 创建 FormalParameterList AST (包装版本)
     */
    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const params: SlimeFunctionParam[] = []
        let lastParam: SlimePattern | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.FormalParameter?.name) {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam))
                }
                lastParam = this.createFormalParameterAst(child)
            } else if (child.name === SlimeParser.prototype.FunctionRestParameter?.name) {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam))
                }
                lastParam = this.createFunctionRestParameterAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam, SlimeTokenCreate.createCommaToken(child.loc)))
                    lastParam = null
                }
            }
        }

        if (lastParam) {
            params.push(SlimeAstUtil.createFunctionParam(lastParam))
        }

        return params
    }

    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return MethodDefinitionCstToAst.createMethodDefinitionAst(staticCst, cst, this)
    }

    /**
     * [内部方法] getter 方法
     * 处理 ES2025 Parser 的 get ClassElementName ( ) { FunctionBody } 结构
     * @internal
     */
    private createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionSetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionGetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionSetterMethodFromIdentifier(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionGeneratorMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        return this.createMethodDefinitionGeneratorMethodAst(staticCst, cst)
    }

    /**
     * [内部方法] async 方法
     * 处理 ES2025 Parser 的 async ClassElementName ( UniqueFormalParameters ) { AsyncFunctionBody } 结构
     * @internal
     */
    private createMethodDefinitionAsyncMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionAsyncMethodFromChildren(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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
    private createMethodDefinitionAsyncGeneratorMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
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

    /** 返回包装类型的版本 */
    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeAstUtil.createFunctionParam(this.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeAstUtil.createFunctionParam(this.createBindingElementAst(first), undefined)]
        }
        return []
    }

    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        return ParametersCstToAst.createFormalParameterAst(cst, this)
    }

    createBindingPatternAst(cst: SubhutiCst): SlimePattern {
        return BindingPatternCstToAst.createBindingPatternAst(cst, this)
    }

    createArrayBindingPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return BindingPatternCstToAst.createArrayBindingPatternAst(cst, this)
    }

    createObjectBindingPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return BindingPatternCstToAst.createObjectBindingPatternAst(cst, this)
    }

    // ==================== 解构相关转换方法 ====================

    /**
     * AssignmentPattern CST �?AST
     * AssignmentPattern -> ObjectAssignmentPattern | ArrayAssignmentPattern
     */
    createAssignmentPatternAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentPatternAst(cst, this)
    }

    /**
     * ObjectAssignmentPattern CST �?AST
     */
    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return PatternConvertCstToAst.createObjectAssignmentPatternAst(cst, this)
    }

    /**
     * ArrayAssignmentPattern CST �?AST
     */
    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return PatternConvertCstToAst.createArrayAssignmentPatternAst(cst, this)
    }

    /**
     * BindingProperty CST �?AST
     * BindingProperty -> SingleNameBinding | PropertyName : BindingElement
     */
    createBindingPropertyAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingPropertyAst(cst, this)
    }

    /**
     * BindingPropertyList CST 转 AST
     */
    createBindingPropertyListAst(cst: SubhutiCst): any[] {
        return BindingPatternCstToAst.createBindingPropertyListAst(cst, this)
    }

    /**
     * BindingElementList CST �?AST
     */
    createBindingElementListAst(cst: SubhutiCst): any[] {
        return BindingPatternCstToAst.createBindingElementListAst(cst, this)
    }

    /**
     * BindingElisionElement CST �?AST
     */
    createBindingElisionElementAst(cst: SubhutiCst): any {
        return BindingPatternCstToAst.createBindingElisionElementAst(cst, this)
    }

    /**
     * AssignmentPropertyList CST �?AST
     */
    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        return PatternConvertCstToAst.createAssignmentPropertyListAst(cst, this)
    }

    /**
     * AssignmentProperty CST �?AST
     */
    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentPropertyAst(cst, this)
    }

    /**
     * AssignmentElementList CST �?AST
     */
    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return PatternConvertCstToAst.createAssignmentElementListAst(cst, this)
    }

    /**
     * AssignmentElement CST �?AST
     */
    createAssignmentElementAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentElementAst(cst, this)
    }

    /**
     * AssignmentElisionElement CST �?AST
     */
    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentElisionElementAst(cst, this)
    }

    /**
     * AssignmentRestElement CST �?AST
     */
    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentRestElementAst(cst, this)
    }

    /**
     * AssignmentRestProperty CST �?AST
     */
    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return PatternConvertCstToAst.createAssignmentRestPropertyAst(cst, this)
    }

    /**
     * BindingRestProperty CST �?AST
     */
    createBindingRestPropertyAst(cst: SubhutiCst): SlimeRestElement {
        return BindingPatternCstToAst.createBindingRestPropertyAst(cst, this)
    }

    createFunctionExpressionAst(cst: SubhutiCst): SlimeFunctionExpression {
        return FunctionExpressionCstToAst.createFunctionExpressionAst(cst, this)
    }

    /**
     * 处理 FormalParameters CST 节点
     */
    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ParametersCstToAst.createFormalParametersAst(cst, this)
    }


    /**
     * 创建 BlockStatement AST
     * 处理两种情况�?
     * 1. 直接�?StatementList（旧的实现）
     * 2. �?BlockStatement，需要提取内部的 Block -> StatementList
     */
    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeStatement>

        // 如果�?StatementList，直接转�?
        if (cst.name === SlimeParser.prototype.StatementList?.name) {
            statements = this.createStatementListAst(cst)
        }
        // 如果�?BlockStatement，需要提�?Block -> StatementList
        else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            // BlockStatement -> Block -> StatementList
            const blockCst = cst.children?.[0]
            if (blockCst && blockCst.name === SlimeParser.prototype.Block?.name) {
                // Block 的结构：LBrace StatementList RBrace
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeParser.prototype.StatementList?.name
                )
                if (statementListCst) {
                    statements = this.createStatementListAst(statementListCst)
                } else {
                    statements = []
                }
            } else {
                statements = []
            }
        }
        else {
            throw new Error(`Expected StatementList or BlockStatement, got ${cst.name}`)
        }

        const ast: SlimeBlockStatement = {
            type: SlimeParser.prototype.BlockStatement?.name as any,
            body: statements,
            loc: cst.loc
        }
        return ast
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        const astName = checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

        // return 语句可能有或没有表达�?
        // children[0] = ReturnTok
        // children[1] = Expression? | Semicolon | SemicolonASI
        let argument: any = null
        let returnToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 return token
        const returnCst = cst.children[0]
        if (returnCst && (returnCst.name === 'Return' || returnCst.value === 'return')) {
            returnToken = SlimeTokenCreate.createReturnToken(returnCst.loc)
        }

        if (cst.children.length > 1) {
            for (let i = 1; i < cst.children.length; i++) {
                const child = cst.children[i]
                // 跳过分号相关节点
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' ||
                    child.name === 'Semicolon' || child.value === ';') {
                    semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
                } else if (!argument) {
                    argument = this.createExpressionAst(child)
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        return PrimaryExpressionCstToAst.createExpressionStatementAst(cst, this);
    }

    /**
     * 创建 if 语句 AST
     * if (test) consequent [else alternate]
     * ES2025: if ( Expression ) IfStatementBody [else IfStatementBody]
     */
    createIfStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIfStatementAst(cst, this)
    }

    /**
     * 创建 IfStatementBody AST
     * IfStatementBody: Statement | FunctionDeclaration
     */
    createIfStatementBodyAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIfStatementBodyAst(cst, this)
    }

    /**
     * 创建 for 语句 AST
     * ES2025 ForStatement:
     *   for ( var VariableDeclarationList ; Expression_opt ; Expression_opt ) Statement
     *   for ( LexicalDeclaration Expression_opt ; Expression_opt ) Statement
     *   for ( Expression_opt ; Expression_opt ; Expression_opt ) Statement
     *
     * 注意：LexicalDeclaration 内部已经包含分号（SemicolonASI）
     */
    createForStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForStatementAst(cst, this)
    }

    /**
     * 从 VariableDeclarationList 创建 VariableDeclaration AST
     */
    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // Skip commas
            if (child.value === ',' || name === 'Comma') continue

            // VariableDeclaration
            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                declarations.push(this.createVariableDeclaratorFromVarDeclaration(child))
            }
        }

        return {
            type: SlimeNodeType.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 for...in / for...of 语句 AST
     */
    createForInOfStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForInOfStatementAst(cst, this)
    }

    /**
     * 创建 while 语句 AST
     */
    createWhileStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createWhileStatementAst(cst, this)
    }

    /**
     * 创建 do...while 语句 AST
     */
    createDoWhileStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createDoWhileStatementAst(cst, this)
    }

    /**
     * 创建 switch 语句 AST
     * SwitchStatement: switch ( Expression ) CaseBlock
     */
    createSwitchStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.SwitchStatement?.name);

        let switchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Switch' || child.value === 'switch') {
                switchToken = SlimeTokenCreate.createSwitchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            }
        }

        // 提取 discriminant（判断表达式�?
        const discriminantCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? this.createExpressionAst(discriminantCst) : null

        // 提取 cases（从 CaseBlock 中）
        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? this.extractCasesFromCaseBlock(caseBlockCst) : []

        // �?CaseBlock 提取 brace tokens
        if (caseBlockCst && caseBlockCst.children) {
            const lBraceCst = caseBlockCst.children.find(ch => ch.name === 'LBrace' || ch.value === '{')
            const rBraceCst = caseBlockCst.children.find(ch => ch.name === 'RBrace' || ch.value === '}')
            if (lBraceCst) lBraceToken = SlimeTokenCreate.createLBraceToken(lBraceCst.loc)
            if (rBraceCst) rBraceToken = SlimeTokenCreate.createRBraceToken(rBraceCst.loc)
        }

        return SlimeAstUtil.createSwitchStatement(
            discriminant, cases, cst.loc,
            switchToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }

    // ==================== 语句相关转换方法 ====================

    /**
     * BreakableStatement CST 到 AST（透传）
     * BreakableStatement -> IterationStatement | SwitchStatement
     */
    createBreakableStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createBreakableStatementAst(cst, this)
    }

    /**
     * IterationStatement CST 到 AST（透传）
     * IterationStatement -> DoWhileStatement | WhileStatement | ForStatement | ForInOfStatement
     */
    createIterationStatementAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createIterationStatementAst(cst, this)
    }

    /**
     * CaseBlock CST 到 AST
     * CaseBlock -> { CaseClauses? DefaultClause? CaseClauses? }
     */
    createCaseBlockAst(cst: SubhutiCst): any[] {
        return this.extractCasesFromCaseBlock(cst)
    }

    /**
     * CaseClauses CST �?AST
     * CaseClauses -> CaseClause+
     */
    createCaseClausesAst(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.CaseClause?.name || child.name === 'CaseClause') {
                cases.push(this.createSwitchCaseAst(child))
            }
        }
        return cases
    }

    /**
     * CaseClause CST �?AST
     * CaseClause -> case Expression : StatementList?
     */
    createCaseClauseAst(cst: SubhutiCst): any {
        return this.createSwitchCaseAst(cst)
    }

    /**
     * DefaultClause CST �?AST
     * DefaultClause -> default : StatementList?
     */
    createDefaultClauseAst(cst: SubhutiCst): any {
        return this.createSwitchCaseAst(cst)
    }

    /**
     * Catch CST 到 CatchClause AST
     * Catch -> catch ( CatchParameter ) Block | catch Block
     */
    createCatchAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.Catch?.name);

        let catchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Catch' || child.value === 'catch') {
                catchToken = SlimeTokenCreate.createCatchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            }
        }

        const paramCst = cst.children.find(ch => ch.name === SlimeParser.prototype.CatchParameter?.name)
        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)

        const param = paramCst ? this.createCatchParameterAst(paramCst) : null
        const body = blockCst ? this.createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken)
    }

    /**
     * ForDeclaration CST 到 AST
     * ForDeclaration -> LetOrConst ForBinding
     */
    createForDeclarationAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForDeclarationAst(cst, this)
    }

    /**
     * ForBinding CST 到 AST
     * ForBinding -> BindingIdentifier | BindingPattern
     */
    createForBindingAst(cst: SubhutiCst): any {
        return ControlFlowCstToAst.createForBindingAst(cst, this)
    }

    /**
     * LetOrConst CST 到 AST
     * LetOrConst -> let | const
     */
    createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }

    /**
     * �?CaseBlock 提取所�?case/default 子句
     * CaseBlock: { CaseClauses? DefaultClause? CaseClauses? }
     */
    private extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        const cases: any[] = []

        if (!caseBlockCst.children) return cases

        // CaseBlock �?children:
        // [0]: LBrace
        // [1-n]: CaseClauses / DefaultClause（可能有多个，可能没有）
        // [last]: RBrace

        caseBlockCst.children.forEach(child => {
            if (child.name === SlimeParser.prototype.CaseClauses?.name) {
                // CaseClauses 包含多个 CaseClause
                if (child.children) {
                    child.children.forEach(caseClauseCst => {
                        cases.push(this.createSwitchCaseAst(caseClauseCst))
                    })
                }
            } else if (child.name === SlimeParser.prototype.DefaultClause?.name) {
                // DefaultClause
                cases.push(this.createSwitchCaseAst(child))
            }
        })

        return cases
    }

    /**
     * [AST 类型映射] CaseClause/DefaultClause CST �?SwitchCase AST
     *
     * 存在必要性：CST �?case �?default 是分开的规则（CaseClause/DefaultClause），
     * �?ESTree AST 统一使用 SwitchCase 类型，通过 test 是否�?null 区分�?
     *
     * CaseClause: case Expression : StatementList?
     * DefaultClause: default : StatementList?
     * @internal
     */
    private createSwitchCaseAst(cst: SubhutiCst): any {
        let test = null
        let consequent: any[] = []
        let caseToken: any = undefined
        let defaultToken: any = undefined
        let colonToken: any = undefined

        if (cst.name === SlimeParser.prototype.CaseClause?.name) {
            // CaseClause 结构�?
            // children[0]: CaseTok
            // children[1]: Expression - test
            // children[2]: Colon
            // children[3]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Case' || child.value === 'case') {
                    caseToken = SlimeTokenCreate.createCaseToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreate.createColonToken(child.loc)
                }
            }

            const testCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
            test = testCst ? this.createExpressionAst(testCst) : null

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? this.createStatementListAst(stmtListCst) : []
        } else if (cst.name === SlimeParser.prototype.DefaultClause?.name) {
            // DefaultClause 结构�?
            // children[0]: DefaultTok
            // children[1]: Colon
            // children[2]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Default' || child.value === 'default') {
                    defaultToken = SlimeTokenCreate.createDefaultToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreate.createColonToken(child.loc)
                }
            }

            test = null  // default 没有 test

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? this.createStatementListAst(stmtListCst) : []
        }

        return SlimeAstUtil.createSwitchCase(consequent, test, cst.loc, caseToken, defaultToken, colonToken)
    }

    /**
     * 创建 try 语句 AST
     */
    createTryStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createTryStatementAst(cst, this)
    }

    /**
     * 从Block CST创建BlockStatement AST
     * Block: LBrace StatementList? RBrace
     */
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        checkCstName(cst, SlimeParser.prototype.Block?.name)

        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (cst.children) {
            for (const child of cst.children) {
                if (child.name === 'LBrace' || child.value === '{') {
                    lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                } else if (child.name === 'RBrace' || child.value === '}') {
                    rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                }
            }
        }

        const statementListCst = cst.children?.find(
            child => child.name === SlimeParser.prototype.StatementList?.name
        )

        const statements = statementListCst ? this.createStatementListAst(statementListCst) : []

        return SlimeAstUtil.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * 创建 CatchParameter AST
     */
    createCatchParameterAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createCatchParameterAst(cst, this)
    }

    /**
     * 创建 Finally 子句 AST
     */
    createFinallyAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createFinallyAst(cst, this)
    }

    /**
     * 创建 throw 语句 AST
     */
    createThrowStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createThrowStatementAst(cst, this)
    }

    /**
     * 创建 break 语句 AST
     */
    createBreakStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createBreakStatementAst(cst, this)
    }

    /**
     * 创建 continue 语句 AST
     */
    createContinueStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createContinueStatementAst(cst, this)
    }

    /**
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     * LabelledItem -> Statement | FunctionDeclaration
     */
    createLabelledStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createLabelledStatementAst(cst, this)
    }

    /**
     * 创建 LabelledItem AST（透传）
     */
    createLabelledItemAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createLabelledItemAst(cst, this)
    }

    /**
     * 创建 with 语句 AST
     * WithStatement: with ( Expression ) Statement
     */
    createWithStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createWithStatementAst(cst, this)
    }

    /**
     * 创建 debugger 语句 AST
     */
    createDebuggerStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createDebuggerStatementAst(cst, this)
    }

    /**
     * 创建空语句 AST
     */
    createEmptyStatementAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createEmptyStatementAst(cst, this)
    }

    /**
     * SemicolonASI CST 到 AST
     * 处理自动分号插入
     */
    createSemicolonASIAst(cst: SubhutiCst): any {
        return OtherStatementCstToAst.createSemicolonASIAst(cst, this)
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
     * Create FormalParameters AST
     * ES2025 FormalParameters:
     *   [empty]
     *   FunctionRestParameter
     *   FormalParameterList
     *   FormalParameterList ,
     *   FormalParameterList , FunctionRestParameter
     */
    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name

            // Skip parentheses
            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameterList：包�?FormalParameter (多个以逗号分隔)
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                // 如果之前有参数没处理，先推入
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...this.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            // Direct FormalParameter（ES2025 结构�?
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            // Direct BindingElement or BindingIdentifier
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        // 处理最后一个参数（没有尾随逗号�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * �?ES2025 FormalParameterList 创建参数 AST（包装类型）
     * FormalParameterList: FormalParameter (, FormalParameter)*
     */
    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameter -> BindingElement
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
            }
        }

        // 处理最后一个参�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeRestElement {
        // FunctionRestParameter: ... BindingIdentifier | ... BindingPattern
        // 或�?FunctionRestParameter -> BindingRestElement
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = this.createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                // BindingRestElement 已经包含�?RestElement 的完整结构，直接返回
                return this.createBindingRestElementAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = this.createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCallExpressionAst(cst, this);
    }

    createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createSuperCallAst(cst, this);
    }

    /**
     * 创建 ImportCall AST
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createImportCallAst(cst, this);
    }

    createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createSuperPropertyAst(cst, this);
    }

    createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMetaPropertyAst(cst, this);
    }

    createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentsAst(cst, this);
    }

    createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        return MemberCallCstToAst.createArgumentListAst(cst, this);
    }

    createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression | SlimeSuper {
        return MemberCallCstToAst.createMemberExpressionFirstOr(cst, this);
    }

    createNewExpressionAst(cst: SubhutiCst): any {
        return MemberCallCstToAst.createNewExpressionAst(cst, this);
    }

    createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createMemberExpressionAst(cst, this);
    }

    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // 兼容 LexicalBinding �?VariableDeclaration
        // const astName = checkCstName(cst, 'LexicalBinding');

        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimePattern

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = this.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name) {
            id = this.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        // console.log(6565656)
        // console.log(id)
        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeTokenCreate.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const init = this.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = this.createExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                }
            } else {
                variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst)
            }
        } else {
            variableDeclarator = SlimeAstUtil.createVariableDeclarator(id)
        }
        variableDeclarator.loc = cst.loc
        return variableDeclarator
    }

    // ==================== 表达式相关转换方�?====================

    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST �?AST
     * 这是一�?cover grammar，根据上下文可能是括号表达式或箭头函数参�?
     */
    createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        // 通常作为括号表达式处理，箭头函数参数有专门的处理路径
        return this.createParenthesizedExpressionAst(cst)
    }

    /**
     * ParenthesizedExpression CST 转 AST
     */
    createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst, this);
    }

    /**
     * ComputedPropertyName CST 转 AST
     */
    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createComputedPropertyNameAst(cst, this);
    }

    /**
     * CoverInitializedName CST 转 AST
     */
    createCoverInitializedNameAst(cst: SubhutiCst): any {
        return PrimaryExpressionCstToAst.createCoverInitializedNameAst(cst, this);
    }

    /**
     * CoverCallExpressionAndAsyncArrowHead CST 转 AST
     */
    createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCoverCallExpressionAndAsyncArrowHeadAst(cst, this);
    }

    /**
     * CallMemberExpression CST 转 AST
     */
    createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createCallMemberExpressionAst(cst, this);
    }

    /**
     * ShortCircuitExpression CST 转 AST（透传）
     * ShortCircuitExpression -> LogicalORExpression | CoalesceExpression
     */
    createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShortCircuitExpressionAst(cst, this);
    }

    /**
     * CoalesceExpressionHead CST 转 AST
     * CoalesceExpressionHead -> CoalesceExpression | BitwiseORExpression
     */
    createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createCoalesceExpressionHeadAst(cst, this);
    }

    /**
     * MultiplicativeOperator CST 转 AST
     */
    createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return PrimaryExpressionCstToAst.createMultiplicativeOperatorAst(cst);
    }

    /**
     * AssignmentOperator CST 转 AST
     */
    createAssignmentOperatorAst(cst: SubhutiCst): string {
        return PrimaryExpressionCstToAst.createAssignmentOperatorAst(cst);
    }

    /**
     * ExpressionBody CST 转 AST
     */
    createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createExpressionBodyAst(cst, this);
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

    private createExpressionAstUncached(cst: SubhutiCst): SlimeExpression {
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
     * 创建 OptionalExpression AST（ES2020）
     */
    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createOptionalExpressionAst(cst, this);
    }

    /**
     * 创建 OptionalChain AST
     */
    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createOptionalChainAst(object, chainCst, this);
    }

    /**
     * 创建 CoalesceExpression AST（ES2020）
     * 处理 ?? 空值合并运算符
     */
    createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createCoalesceExpressionAst(cst, this);
    }

    /**
     * 创建 ExponentiationExpression AST（ES2016）
     * 处理 ** 幂运算符
     */
    createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createExponentiationExpressionAst(cst, this);
    }

    createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalORExpressionAst(cst, this);
    }

    createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createLogicalANDExpressionAst(cst, this);
    }

    createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseORExpressionAst(cst, this);
    }

    createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseXORExpressionAst(cst, this);
    }

    createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createBitwiseANDExpressionAst(cst, this);
    }

    createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createEqualityExpressionAst(cst, this);
    }

    createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createRelationalExpressionAst(cst, this);
    }

    createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createShiftExpressionAst(cst, this);
    }

    createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createAdditiveExpressionAst(cst, this);
    }

    createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        return BinaryExpressionCstToAst.createMultiplicativeExpressionAst(cst, this);
    }

    createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUnaryExpressionAst(cst, this);
    }

    // Renamed from createPostfixExpressionAst - ES2025 uses UpdateExpression
    createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        return UnaryExpressionCstToAst.createUpdateExpressionAst(cst, this);
    }

    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        return MemberCallCstToAst.createLeftHandSideExpressionAst(cst, this);
    }

    createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createPrimaryExpressionAst(cst, this);
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

    // 模板字符串处�?
    createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        return TemplateCstToAst.createTemplateLiteralAst(cst, this)
    }

    // 处理TemplateSpans：可能是TemplateTail或TemplateMiddleList+TemplateTail
    processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        TemplateCstToAst.processTemplateSpans(cst, quasis, expressions, this)
    }

    // 处理TemplateMiddleList：处理多个TemplateMiddle+Expression�?
    processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        TemplateCstToAst.processTemplateMiddleList(cst, quasis, expressions, this)
    }

    createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        return ClassDeclarationCstToAst.createClassExpressionAst(cst, this)
    }

    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        const astName = checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        // 防御性检查：如果 children 为空，说明是空对象的情况，不应该被调�?
        // 这种情况通常不会发生，因为空对象{}不会有PropertyDefinition节点
        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children - this should not happen for valid syntax');
        }

        const first = cst.children[0]

        // ES2018: 对象spread {...obj}
        // 检查first是否是Ellipsis token（name�?Ellipsis'�?
        if (first.name === 'Ellipsis' || first.value === '...') {
            // PropertyDefinition -> Ellipsis + AssignmentExpression
            const AssignmentExpressionCst = cst.children[1]
            const argument = this.createAssignmentExpressionAst(AssignmentExpressionCst)

            // 返回SpreadElement（作为Property的一种特殊形式）
            return {
                type: SlimeNodeType.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any
        } else if (cst.children.length > 2) {
            // PropertyName : AssignmentExpression（完整形式）
            const PropertyNameCst = cst.children[0]
            const AssignmentExpressionCst = cst.children[2]

            const key = this.createPropertyNameAst(PropertyNameCst)
            const value = this.createAssignmentExpressionAst(AssignmentExpressionCst)

            const keyAst = SlimeAstUtil.createPropertyAst(key, value)

            // 检查是否是计算属性名
            if (PropertyNameCst.children[0].name === SlimeParser.prototype.ComputedPropertyName?.name) {
                keyAst.computed = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name) {
            // 方法定义（对象中的方法没有static�?
            const SlimeMethodDefinition = this.createMethodDefinitionAst(null, first)

            const keyAst = SlimeAstUtil.createPropertyAst(SlimeMethodDefinition.key, SlimeMethodDefinition.value)

            // 继承MethodDefinition的computed标志
            if (SlimeMethodDefinition.computed) {
                keyAst.computed = true
            }

            // 继承MethodDefinition的kind标志（getter/setter/method�?
            if (SlimeMethodDefinition.kind === 'get' || SlimeMethodDefinition.kind === 'set') {
                keyAst.kind = SlimeMethodDefinition.kind
            } else {
                // 普通方法使�?method: true
                keyAst.method = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            // 属性简�?{name} -> {name: name}
            const identifierCst = first.children[0] // IdentifierReference -> Identifier
            const identifier = this.createIdentifierAst(identifierCst)
            const keyAst = SlimeAstUtil.createPropertyAst(identifier, identifier)
            keyAst.shorthand = true
            return keyAst
        } else if (first.name === 'CoverInitializedName') {
            // CoverInitializedName: 带默认值的属性简�?{name = 'default'}
            // CoverInitializedName -> IdentifierReference + Initializer
            const identifierRefCst = first.children[0]
            const initializerCst = first.children[1]

            const identifierCst = identifierRefCst.children[0] // IdentifierReference -> Identifier
            const identifier = this.createIdentifierAst(identifierCst)

            // Initializer -> Assign + AssignmentExpression
            const defaultValue = this.createAssignmentExpressionAst(initializerCst.children[1])

            // 创建 AssignmentPattern 作为 value
            const assignmentPattern = {
                type: SlimeNodeType.AssignmentPattern,
                left: identifier,
                right: defaultValue,
                loc: first.loc
            }

            const keyAst = SlimeAstUtil.createPropertyAst(identifier, assignmentPattern as any)
            keyAst.shorthand = true
            return keyAst
        } else {
            throw new Error(`不支持的PropertyDefinition类型: ${first.name}`)
        }
    }


    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        if (!cst || !cst.children || cst.children.length === 0) {
            throw new Error('createPropertyNameAst: invalid cst or no children')
        }

        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.LiteralPropertyName?.name || first.name === 'LiteralPropertyName') {
            return this.createLiteralPropertyNameAst(first)
        } else if (first.name === SlimeParser.prototype.ComputedPropertyName?.name || first.name === 'ComputedPropertyName') {
            // [expression]: value
            // ComputedPropertyName -> LBracket + AssignmentExpression + RBracket
            return this.createAssignmentExpressionAst(first.children[1])
        }
        // 回退：可能first直接就是 LiteralPropertyName 的内�?
        return this.createLiteralPropertyNameAst(first)
    }

    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        if (!cst) {
            throw new Error('createLiteralPropertyNameAst: cst is null')
        }

        // 可能�?LiteralPropertyName 节点，也可能直接是内部节�?
        let first = cst
        if (cst.name === SlimeParser.prototype.LiteralPropertyName?.name || cst.name === 'LiteralPropertyName') {
            if (!cst.children || cst.children.length === 0) {
                throw new Error('createLiteralPropertyNameAst: LiteralPropertyName has no children')
            }
            first = cst.children[0]
        }

        // IdentifierName (Es2025Parser) - 可能是规则节点或 token
        if (first.name === 'IdentifierName' || first.name === SlimeParser.prototype.IdentifierName?.name) {
            // 如果�?value，直接使�?
            if (first.value !== undefined) {
                return SlimeAstUtil.createIdentifier(first.value, first.loc)
            }
            // 否则递归查找 value
            let current = first
            while (current.children && current.children.length > 0 && current.value === undefined) {
                current = current.children[0]
            }
            if (current.value !== undefined) {
                return SlimeAstUtil.createIdentifier(current.value, current.loc || first.loc)
            }
            throw new Error(`createLiteralPropertyNameAst: Cannot extract value from IdentifierName`)
        }
        // Identifier (旧版�?Es2025)
        else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return this.createIdentifierAst(first)
        }
        // NumericLiteral
        else if (first.name === SlimeTokenConsumer.prototype.NumericLiteral?.name || first.name === 'NumericLiteral' || first.name === 'Number') {
            return this.createNumericLiteralAst(first)
        }
        // StringLiteral
        else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name || first.name === 'StringLiteral' || first.name === 'String') {
            return this.createStringLiteralAst(first)
        }
        // 如果是直接的 token（有 value 属性），创�?Identifier
        else if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`)
    }


    /**
     * [AST 类型映射] NumericLiteral 终端??Literal AST
     *
     * 存在必要性：NumericLiteral ?CST 中是终端符，?ESTree AST 中是 Literal 类型?
     */
    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral {
        return LiteralCstToAst.createNumericLiteralAst(cst);
    }

    /**
     * [AST 类型映射] StringLiteral 终端??Literal AST
     *
     * 存在必要性：StringLiteral ?CST 中是终端符，?ESTree AST 中是 Literal 类型?
     */
    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral {
        return LiteralCstToAst.createStringLiteralAst(cst);
    }

    /**
     * [AST 类型映射] RegularExpressionLiteral 终端??Literal AST
     *
     * 存在必要性：RegularExpressionLiteral ?CST 中是终端符，
     * ?ESTree AST 中是 Literal 类型，需要解析正则表达式?pattern ?flags?
     *
     * RegularExpressionLiteral: /pattern/flags
     */
    createRegExpLiteralAst(cst: SubhutiCst): any {
        return LiteralCstToAst.createRegExpLiteralAst(cst);
    }

    createLiteralFromToken(token: any): SlimeExpression {
        return LiteralCstToAst.createLiteralFromToken(token);
    }

    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        return CompoundLiteralCstToAst.createElementListAst(cst);
    }

    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        return CompoundLiteralCstToAst.createSpreadElementAst(cst);
    }

    // ==================== 字面量相关转换方?====================

    /**
     * 布尔字面?CST ?AST
     * BooleanLiteral -> true | false
     */
    createBooleanLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createBooleanLiteralAst(cst);
    }

    /**
     * ArrayLiteral CST ?ArrayExpression AST
     * ArrayLiteral -> [ Elision? ] | [ ElementList ] | [ ElementList , Elision? ]
     */
    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        return CompoundLiteralCstToAst.createArrayLiteralAst(cst);
    }

    /**
     * 对象字面?CST ?AST（透传?ObjectExpression?
     * ObjectLiteral -> { } | { PropertyDefinitionList } | { PropertyDefinitionList , }
     */
    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        return CompoundLiteralCstToAst.createObjectLiteralAst(cst);
    }

    /**
     * Elision（逗号空位）CST ?AST
     * Elision -> , | Elision ,
     * 返回 null 元素的数?
     */
    createElisionAst(cst: SubhutiCst): number {
        return CompoundLiteralCstToAst.createElisionAst(cst);
    }

    createLiteralAst(cst: SubhutiCst): SlimeLiteral {
        return LiteralCstToAst.createLiteralAst(cst);
    }


    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createAssignmentExpressionAst(cst, this);
    }

    /**
     * 创建箭头函数 AST
     */
    createArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        checkCstName(cst, SlimeParser.prototype.ArrowFunction?.name);
        // ArrowFunction 结构（带async）：
        // children[0]: AsyncTok (可选)
        // children[1]: BindingIdentifier 或 CoverParenthesizedExpressionAndArrowParameterList (参数)
        // children[2]: Arrow (=>)
        // children[3]: ConciseBody (函数体)

        // Token fields
        let asyncToken: any = undefined
        let arrowToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        const commaTokens: any[] = []

        // 检查是否有async
        let offset = 0;
        let isAsync = false;
        if (cst.children[0] && cst.children[0].name === 'Async') {
            asyncToken = SlimeTokenCreate.createAsyncToken(cst.children[0].loc)
            isAsync = true;
            offset = 1;
        }

        // 防御性检查：确保children存在且有足够元素
        if (!cst.children || cst.children.length < 3 + offset) {
            throw new Error(`createArrowFunctionAst: 期望${3 + offset}个children，实�?{cst.children?.length || 0}个`)
        }

        const arrowParametersCst = cst.children[0 + offset]
        const arrowCst = cst.children[1 + offset]
        const conciseBodyCst = cst.children[2 + offset]

        // 提取箭头 token
        if (arrowCst && (arrowCst.name === 'Arrow' || arrowCst.value === '=>')) {
            arrowToken = SlimeTokenCreate.createArrowToken(arrowCst.loc)
        }

        // 解析参数 - 根据节点类型分别处理
        // SlimeFunctionParam 是包装类型，包含 param 和可选的 commaToken
        let params: SlimeFunctionParam[];
        if (arrowParametersCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            // 单个参数：x => x * 2
            params = [{ param: this.createBindingIdentifierAst(arrowParametersCst) }]
        } else if (arrowParametersCst.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            // 括号参数�?a, b) => a + b �?() => 42
            // 提取括号 tokens
            for (const child of arrowParametersCst.children || []) {
                if (child.name === 'LParen' || child.value === '(') {
                    lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                } else if (child.name === 'RParen' || child.value === ')') {
                    rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                } else if (child.name === 'Comma' || child.value === ',') {
                    commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                }
            }
            // �?SlimePattern[] 转换�?SlimeFunctionParam[]
            const rawParams = this.createArrowParametersFromCoverGrammar(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i] // 为每个参数关联逗号 token（最后一个参数无逗号�?
            }))
        } else if (arrowParametersCst.name === SlimeParser.prototype.ArrowParameters?.name) {
            // ArrowParameters 规则：其子节点可能是 CoverParenthesizedExpressionAndArrowParameterList �?BindingIdentifier
            const firstChild = arrowParametersCst.children?.[0]
            if (firstChild?.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
                // �?CoverParenthesizedExpressionAndArrowParameterList 提取括号 tokens
                for (const child of firstChild.children || []) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                    } else if (child.name === 'Comma' || child.value === ',') {
                        commaTokens.push(SlimeTokenCreate.createCommaToken(child.loc))
                    }
                }
            }
            const rawParams = this.createArrowParametersAst(arrowParametersCst)
            params = rawParams.map((p, i) => ({
                param: p,
                commaToken: commaTokens[i] // 为每个参数关联逗号 token（最后一个参数无逗号�?
            }))
        } else {
            throw new Error(`createArrowFunctionAst: 不支持的参数类型 ${arrowParametersCst.name}`)
        }

        // 解析函数�?
        const body = this.createConciseBodyAst(conciseBodyCst)

        // 注意：createArrowFunctionExpression 参数顺序�?(body, params, expression, async, loc, arrowToken, asyncToken, lParenToken, rParenToken)
        // commaTokens 目前函数签名不支持，暂时忽略
        return SlimeAstUtil.createArrowFunctionExpression(
            body, params, body.type !== SlimeNodeType.BlockStatement, isAsync, cst.loc,
            arrowToken, asyncToken, lParenToken, rParenToken
        )
    }

    /**
     * 创建 Async 箭头函数 AST
     * AsyncArrowFunction: async AsyncArrowBindingIdentifier => AsyncConciseBody
     *                   | CoverCallExpressionAndAsyncArrowHead => AsyncConciseBody
     */
    createAsyncArrowFunctionAst(cst: SubhutiCst): SlimeArrowFunctionExpression {
        // AsyncArrowFunction 结构�?
        // 形式1: [AsyncTok, BindingIdentifier, Arrow, AsyncConciseBody]
        // 形式2: [CoverCallExpressionAndAsyncArrowHead, Arrow, AsyncConciseBody]

        let params: SlimePattern[] = []
        let body: SlimeExpression | SlimeBlockStatement
        let arrowIndex = -1
        let arrowToken: any = undefined
        let asyncToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        // 找到 Arrow token 的位�?
        for (let i = 0; i < cst.children.length; i++) {
            if (cst.children[i].name === 'Arrow' || cst.children[i].value === '=>') {
                arrowToken = SlimeTokenCreate.createArrowToken(cst.children[i].loc)
                arrowIndex = i
                break
            }
        }

        // 容错模式：如果找不到 Arrow token，尝试从不完整的 CST 中提取信�?
        if (arrowIndex === -1) {
            // 尝试�?CoverCallExpressionAndAsyncArrowHead 提取参数
            for (const child of cst.children) {
                if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                    params = this.createAsyncArrowParamsFromCover(child)
                    break
                } else if (child.name === 'Async') {
                    continue
                } else if (child.name === 'BindingIdentifier' || child.name === SlimeParser.prototype.BindingIdentifier?.name) {
                    params = [this.createBindingIdentifierAst(child)]
                    break
                }
            }
            // 返回不完整的箭头函数（没�?body�?
            return {
                type: SlimeNodeType.ArrowFunctionExpression,
                id: null,
                params: params,
                body: SlimeAstUtil.createBlockStatement([]),
                generator: false,
                async: true,
                expression: false,
                loc: cst.loc
            } as any
        }

        // 解析参数（Arrow 之前的部分）
        for (let i = 0; i < arrowIndex; i++) {
            const child = cst.children[i]
            if (child.name === 'Async' || (child.name === 'IdentifierName' && child.value === 'async')) {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                continue // 跳过 async 关键�?
            }
            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params = [this.createBindingIdentifierAst(child)]
            } else if (child.name === 'AsyncArrowBindingIdentifier' || child.name === SlimeParser.prototype.AsyncArrowBindingIdentifier?.name) {
                // AsyncArrowBindingIdentifier 包含一�?BindingIdentifier
                const bindingId = child.children?.find((c: any) =>
                    c.name === 'BindingIdentifier' || c.name === SlimeParser.prototype.BindingIdentifier?.name
                ) || child.children?.[0]
                if (bindingId) {
                    params = [this.createBindingIdentifierAst(bindingId)]
                }
            } else if (child.name === 'CoverCallExpressionAndAsyncArrowHead') {
                // �?CoverCallExpressionAndAsyncArrowHead 提取参数和括�?tokens
                params = this.createAsyncArrowParamsFromCover(child)
                // 提取括号 tokens
                for (const subChild of child.children || []) {
                    if (subChild.name === 'Arguments' || subChild.name === SlimeParser.prototype.Arguments?.name) {
                        for (const argChild of subChild.children || []) {
                            if (argChild.name === 'LParen' || argChild.value === '(') {
                                lParenToken = SlimeTokenCreate.createLParenToken(argChild.loc)
                            } else if (argChild.name === 'RParen' || argChild.value === ')') {
                                rParenToken = SlimeTokenCreate.createRParenToken(argChild.loc)
                            }
                        }
                    }
                }
            } else if (child.name === SlimeParser.prototype.ArrowFormalParameters?.name || child.name === 'ArrowFormalParameters') {
                params = this.createArrowFormalParametersAst(child)
                // 提取括号 tokens
                for (const subChild of child.children || []) {
                    if (subChild.name === 'LParen' || subChild.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(subChild.loc)
                    } else if (subChild.name === 'RParen' || subChild.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(subChild.loc)
                    }
                }
            }
        }

        // 解析函数体（Arrow 之后的部分）
        const bodyIndex = arrowIndex + 1
        if (bodyIndex < cst.children.length) {
            const bodyCst = cst.children[bodyIndex]
            if (bodyCst.name === 'AsyncConciseBody' || bodyCst.name === 'ConciseBody') {
                body = this.createConciseBodyAst(bodyCst)
            } else {
                body = this.createExpressionAst(bodyCst)
            }
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.ArrowFunctionExpression,
            id: null,
            params: params,
            body: body,
            generator: false,
            async: true,
            expression: body.type !== SlimeNodeType.BlockStatement,
            arrowToken: arrowToken,
            asyncToken: asyncToken,
            lParenToken: lParenToken,
            rParenToken: rParenToken,
            loc: cst.loc
        } as any
    }

    /**
     * �?CoverCallExpressionAndAsyncArrowHead 提取 async 箭头函数参数
     */
    createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        // CoverCallExpressionAndAsyncArrowHead 结构�?
        // [MemberExpression, Arguments] 或类似结�?
        // 我们需要从 Arguments 中提取参�?

        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'Arguments' || child.name === SlimeParser.prototype.Arguments?.name) {
                // �?Arguments 中提取参�?
                for (const argChild of child.children || []) {
                    if (argChild.name === 'ArgumentList' || argChild.name === SlimeParser.prototype.ArgumentList?.name) {
                        let hasEllipsis = false // 标记是否遇到�?...
                        for (const arg of argChild.children || []) {
                            if (arg.value === ',') continue // 跳过逗号
                            // 处理 rest 参数�?..ids
                            if (arg.name === 'Ellipsis' || arg.value === '...') {
                                hasEllipsis = true
                                continue
                            }
                            const param = this.convertCoverParameterCstToPattern(arg, hasEllipsis)
                            if (param) {
                                params.push(param)
                                hasEllipsis = false
                            }
                        }
                    }
                }
            }
        }

        return params
    }

    /**
     * 将表达式 CST 转换�?Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     */
    /**
     * �?CST 表达式转换为 Pattern（用�?cover grammar�?
     * 这用于处�?async (expr) => body 中的 expr �?pattern 的转�?
     * 注意：这个方法处�?CST 节点，convertExpressionToPattern 处理 AST 节点
     */
    convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数 options = {})
        // 这必须在 findInnerExpr 之前处理，否则会丢失 = 和默认�?
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            // 检查是否有 Assign token (=)
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                // 这是默认参数: left = right
                const expr = this.createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return this.convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        // 递归查找最内层的表达式
        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            // 如果�?ObjectLiteral、ArrayLiteral、Identifier 等，返回�?
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            // 否则递归向下
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            // �?ObjectLiteral 转换�?ObjectPattern
            return this.convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            // �?ArrayLiteral 转换�?ArrayPattern
            return this.convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            // 标识符直接转�?
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return this.createBindingIdentifierAst(inner)
        }

        // 尝试将表达式作为 AST 处理
        const expr = this.createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            // ObjectExpression 需要转换为 ObjectPattern
            return this.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            // ArrayExpression 需要转换为 ArrayPattern
            return this.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            // AssignmentExpression 转换�?AssignmentPattern
            return this.convertAssignmentExpressionToPattern(expr)
        }

        // 如果仍然无法转换，返�?null（不要返回原�?CST�?
        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换�?Pattern
     * 仅在“参数位置”调用，用于 Arrow / AsyncArrow 等场�?
     */
    convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        // 1. 已经�?BindingIdentifier / BindingPattern 系列的，直接走绑定模式基础方法
        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = this.createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = this.createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = this.createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = this.createObjectBindingPatternAst(cst)
        }

        // 2. 其它情况（AssignmentExpression / ObjectLiteral / ArrayLiteral 等），使用通用�?CST→Pattern 逻辑
        if (!basePattern) {
            basePattern = this.convertCstToPattern(cst)
        }

        // 3. 兼容兜底：仍然无法转换时，尝试从表达式中提取第一�?Identifier
        if (!basePattern) {
            const identifierCst = this.findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = this.createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        // 4. 处理 rest 参数：根据调用方传入�?hasEllipsis 决定是否包装�?RestElement
        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }


    /**
     * �?ObjectLiteral CST 转换�?ObjectPattern
     */
    convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'PropertyDefinitionList') {
                for (const prop of child.children || []) {
                    if (prop.value === ',') {
                        // 将逗号关联到前一个属�?
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(prop.loc)
                        }
                        continue
                    }
                    if (prop.name === 'PropertyDefinition') {
                        // 检查是否是 SpreadElement (... identifier)
                        const ellipsis = prop.children?.find((c: any) => c.value === '...' || c.name === 'Ellipsis')
                        if (ellipsis) {
                            // 这是一�?RestElement
                            const assignExpr = prop.children?.find((c: any) => c.name === 'AssignmentExpression')
                            if (assignExpr) {
                                // �?AssignmentExpression 中提�?identifier
                                const idCst = this.findFirstIdentifierInExpression(assignExpr)
                                if (idCst) {
                                    const restId = this.createIdentifierAst(idCst)
                                    const restNode: SlimeRestElement = {
                                        type: SlimeNodeType.RestElement,
                                        argument: restId,
                                        ellipsisToken: SlimeTokenCreate.createEllipsisToken(ellipsis.loc),
                                        loc: prop.loc
                                    }
                                    properties.push({ property: restNode })
                                }
                            }
                        } else {
                            const patternProp = this.convertPropertyDefinitionToPatternProperty(prop)
                            if (patternProp) {
                                properties.push({ property: patternProp })
                            }
                        }
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeObjectPattern
    }

    /**
     * �?PropertyDefinition CST 转换�?Pattern 属�?
     */
    convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        const first = cst.children?.[0]
        if (!first) return null

        if (first.name === 'IdentifierReference') {
            // 简写形�? { id } -> { id: id }
            const idNode = first.children?.[0]?.children?.[0]
            if (idNode) {
                const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                return {
                    type: SlimeNodeType.Property,
                    key: id,
                    value: id,
                    kind: 'init',
                    computed: false,
                    shorthand: true,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        } else if (first.name === 'CoverInitializedName') {
            // 带默认值的简写形�? { id = value }
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference')
            const initializer = first.children?.find((c: any) => c.name === 'Initializer')
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0]
                if (idNode) {
                    const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                    let value: any = id
                    if (initializer) {
                        const init = this.createInitializerAst(initializer)
                        value = {
                            type: SlimeNodeType.AssignmentPattern,
                            left: id,
                            right: init,
                            loc: first.loc
                        }
                    }
                    return {
                        type: SlimeNodeType.Property,
                        key: id,
                        value: value,
                        kind: 'init',
                        computed: false,
                        shorthand: true,
                        loc: cst.loc
                    } as SlimeAssignmentProperty
                }
            }
        } else if (first.name === 'PropertyName') {
            // 完整形式: { key: value }
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = this.createPropertyNameAst(propName)
                const valueExpr = this.createExpressionAst(valueCst)
                const value = this.convertExpressionToPatternFromAST(valueExpr)
                return {
                    type: SlimeNodeType.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: this.isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        }

        return null
    }

    /**
     * �?ObjectExpression AST 转换�?ObjectPattern
     */
    convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        for (const prop of expr.properties || []) {
            const property = prop.property || prop
            if (property.type === SlimeNodeType.SpreadElement) {
                properties.push({
                    property: {
                        type: SlimeNodeType.RestElement,
                        argument: property.argument,
                        loc: property.loc
                    } as SlimeRestElement
                })
            } else {
                const value = this.convertExpressionToPatternFromAST(property.value)
                properties.push({
                    property: {
                        type: SlimeNodeType.Property,
                        key: property.key,
                        value: value || property.value,
                        kind: 'init',
                        computed: property.computed,
                        shorthand: property.shorthand,
                        loc: property.loc
                    } as SlimeAssignmentProperty
                })
            }
        }
        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken: expr.lBraceToken,
            rBraceToken: expr.rBraceToken,
            loc: expr.loc
        } as SlimeObjectPattern
    }

    /**
     * �?ArrayExpression AST 转换�?ArrayPattern
     */
    convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null })
            } else {
                const element = elem.element || elem
                const pattern = this.convertExpressionToPatternFromAST(element)
                elements.push({ element: pattern || element, commaToken: elem.commaToken })
            }
        }
        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken: expr.lBracketToken,
            rBracketToken: expr.rBracketToken,
            loc: expr.loc
        } as SlimeArrayPattern
    }

    /**
     * �?AssignmentExpression AST 转换�?AssignmentPattern
     */
    convertAssignmentExpressionToPattern(expr: any): any {
        const left = this.convertExpressionToPatternFromAST(expr.left)
        return {
            type: SlimeNodeType.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        }
    }

    /**
     * 将表达式 AST 转换�?Pattern
     */
    convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        if (!expr) return null
        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return this.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return this.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return this.convertAssignmentExpressionToPattern(expr)
        }
        return null
    }

    /**
     * �?ArrayLiteral CST 转换�?ArrayPattern
     */
    convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        // 简化实现：使用 createArrayBindingPatternAst 的逻辑
        const elements: SlimeArrayPatternElement[] = []
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        // 辅助函数：处�?Elision 节点
        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    // 将逗号关联到前一个元素（如果有）
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elisionChild.loc)
                    }
                    // 添加一个省略元�?
                    elements.push({ element: null })
                }
            }
        }

        for (const child of cst.children || []) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            } else if (child.name === 'Elision') {
                // 直接�?ArrayLiteral 下的 Elision（如 [,,]�?
                processElision(child)
            } else if (child.name === 'ElementList') {
                const elemChildren = child.children || []
                for (let i = 0; i < elemChildren.length; i++) {
                    const elem = elemChildren[i]
                    if (elem.value === ',') {
                        // 将逗号关联到前一个元�?
                        if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                            elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elem.loc)
                        }
                    } else if (elem.name === 'Elision') {
                        // ElementList 内的 Elision
                        processElision(elem)
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = this.createExpressionAst(elem)
                        const pattern = this.convertExpressionToPatternFromAST(expr)
                        elements.push({ element: pattern || expr as any })
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = this.createSpreadElementAst(elem)
                        elements.push({
                            element: {
                                type: SlimeNodeType.RestElement,
                                argument: restNode.argument,
                                loc: restNode.loc
                            } as SlimeRestElement
                        })
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeArrayPattern
    }

    /**
     * �?ArrowFormalParameters 提取参数
     */
    createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // ArrowFormalParameters: ( UniqueFormalParameters )
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return this.createUniqueFormalParametersAst(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return this.createFormalParametersAst(child)
            }
        }

        return params
    }

    /**
     * �?ArrowFormalParameters 提取参数 (包装类型版本)
     */
    createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // ArrowFormalParameters: ( UniqueFormalParameters )
        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return this.createUniqueFormalParametersAstWrapped(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return this.createFormalParametersAstWrapped(child)
            }
        }

        return []
    }

    /**
     * 从CoverParenthesizedExpressionAndArrowParameterList提取箭头函数参数
     */
    createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name);

        // CoverParenthesizedExpressionAndArrowParameterList 的children结构�?
        // LParen + (FormalParameterList | Expression | ...) + RParen
        // 或�?LParen + Expression + Comma + Ellipsis + BindingIdentifier + RParen

        if (cst.children.length === 0) {
            return []
        }

        // () - 空参�?
        if (cst.children.length === 2) {
            return []
        }

        const params: SlimePattern[] = []

        // 查找FormalParameterList
        const formalParameterListCst = cst.children.find(
            child => child.name === SlimeParser.prototype.FormalParameterList?.name
        )
        if (formalParameterListCst) {
            return this.createFormalParameterListAst(formalParameterListCst)
        }

        // 查找Expression（可能是逗号表达式，�?(a, b) 或单个参�?(x)�?
        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        )
        if (expressionCst && expressionCst.children?.length) {
            // 直接�?Expression �?children 上遍�?AssignmentExpression 等候选参数节�?
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                const param = this.convertCoverParameterCstToPattern(child, false)
                if (param) {
                    params.push(param)
                }
            }
        }

        // 检查是否有 rest 参数（Ellipsis + BindingIdentifier �?BindingPattern�?
        const hasEllipsis = cst.children.some(
            child => child.name === 'Ellipsis' || child.name === 'Ellipsis'
        )
        if (hasEllipsis) {
            // 首先查找 BindingIdentifier / BindingPattern 作为 rest 的目�?
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            const bindingPatternCst = bindingIdentifierCst
                ? null
                : cst.children.find(
                    child => child.name === SlimeParser.prototype.BindingPattern?.name ||
                        child.name === 'BindingPattern' ||
                        child.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
                        child.name === 'ArrayBindingPattern' ||
                        child.name === SlimeParser.prototype.ObjectBindingPattern?.name ||
                        child.name === 'ObjectBindingPattern'
                )

            const restTarget = bindingIdentifierCst || bindingPatternCst
            if (restTarget) {
                const restParam = this.convertCoverParameterCstToPattern(restTarget, true)
                if (restParam) {
                    params.push(restParam)
                }
            }
        } else if (params.length === 0) {
            // 没有 Expression 也没�?rest，检查是否有单独�?BindingIdentifier
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            if (bindingIdentifierCst) {
                params.push(this.createBindingIdentifierAst(bindingIdentifierCst))
            }
        }

        return params
    }

    /**
     * 从Expression中提取箭头函数参�?
     * 处理逗号表达�?(a, b) 或单个参�?(x)
     */
    extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        // Expression可能是：
        // 1. 单个Identifier: x
        // 2. 逗号表达�? a, b �?a, b, c
        // 3. 赋值表达式（默认参数）: a = 1

        // 检查是否是AssignmentExpression
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = this.createAssignmentExpressionAst(expressionCst)
            // 如果是简单的identifier，返回它
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any]
            }
            // 如果是赋值（默认参数），返回AssignmentPattern
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        // 如果是Expression，检查children
        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = []

            // 遍历children，查找所有AssignmentExpression（用逗号分隔�?
            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = this.createAssignmentExpressionAst(child)
                    // 转换为参�?
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        // 默认参数
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        // 对象解构参数�?{ a, b }) => ...
                        // 需要将 ObjectExpression 转换�?ObjectPattern
                        params.push(this.convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        // 数组解构参数�?[a, b]) => ...
                        // 需要将 ArrayExpression 转换�?ArrayPattern
                        params.push(this.convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        // 其他复杂情况，尝试提取identifier
                        const identifier = this.findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(this.createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        // 回退：尝试查找第一个identifier
        const identifierCst = this.findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [this.createIdentifierAst(identifierCst) as any]
        }

        return []
    }

    /**
     * 在Expression中查找第一个Identifier（辅助方法）
     */
    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = this.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

    /**
     * 将表达式转换为模式（用于箭头函数参数解构�?
     * ObjectExpression -> ObjectPattern
     * ArrayExpression -> ArrayPattern
     * Identifier -> Identifier
     * SpreadElement -> RestElement
     */
    convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr

        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            // �?ObjectExpression 转换�?ObjectPattern
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
                    // 转换 Property �?value
                    const convertedValue = this.convertExpressionToPattern(prop.value)
                    properties.push({
                        property: {
                            ...prop,
                            value: convertedValue
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    properties.push(item)
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any
        }

        if (expr.type === SlimeNodeType.ArrayExpression) {
            // �?ArrayExpression 转换�?ArrayPattern
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: this.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any
        }

        if (expr.type === SlimeNodeType.AssignmentExpression) {
            // �?AssignmentExpression 转换�?AssignmentPattern
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: this.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            // SpreadElement -> RestElement
            return {
                type: SlimeNodeType.RestElement,
                argument: this.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        // 其他类型直接返回
        return expr
    }

    /**
     * 创建箭头函数参数 AST
     */
    createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        return ArrowFunctionCstToAst.createArrowParametersAst(cst, this)
    }

    /**
     * 创建箭头函数体 AST
     */
    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        return ArrowFunctionCstToAst.createConciseBodyAst(cst, this)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        return PrimaryExpressionCstToAst.createConditionalExpressionAst(cst, this);
    }

    createYieldExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createYieldExpressionAst(cst, this);
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        return UnaryExpressionCstToAst.createAwaitExpressionAst(cst, this);
    }

    /**
     * 处理 ShortCircuitExpressionTail (|| 和 ?? 运算符的尾部)
     * CST 结构：ShortCircuitExpressionTail -> LogicalORExpressionTail | CoalesceExpressionTail
     * LogicalORExpressionTail -> LogicalOr LogicalANDExpression LogicalORExpressionTail?
     */
    createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        const tailChildren = tailCst.children || []

        // 如果�?ShortCircuitExpressionTail，获取内部的 tail
        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0]
            return this.createShortCircuitExpressionTailAst(left, innerTail)
        }

        // LogicalORExpressionTail: (LogicalOr LogicalANDExpression)+
        // 结构是平坦的：[LogicalOr, expr, LogicalOr, expr, ...]
        if (tailCst.name === 'LogicalORExpressionTail') {
            let result = left

            // 循环处理 (operator, operand) �?
            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '||'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = this.createExpressionAst(rightCst)

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        // CoalesceExpressionTail: (?? BitwiseORExpression)+
        // 结构是平坦的：[??, expr, ??, expr, ...]
        if (tailCst.name === 'CoalesceExpressionTail') {
            let result = left

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i]
                const operator = operatorNode.value || '??'

                const rightCst = tailChildren[i + 1]
                if (!rightCst) break

                const right = this.createExpressionAst(rightCst)

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any
            }

            return result
        }

        // 未知�?tail 类型，返回左操作�?
        console.warn('Unknown ShortCircuitExpressionTail type:', tailCst.name)
        return left
    }
}

const SlimeCstToAstUtil = new SlimeCstToAst()

export default SlimeCstToAstUtil
