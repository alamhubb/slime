import type { SubhutiSourceLocation } from "subhuti";
import { SlimeAstTypeName } from "./SlimeAstTypeName.ts";
import {
    SlimeJavascriptArrayExpression,
    SlimeJavascriptArrayPattern,
    SlimeJavascriptArrowFunctionExpression,
    SlimeJavascriptArrowToken,
    SlimeJavascriptAssignmentExpression, SlimeJavascriptAssignmentOperator,
    SlimeJavascriptAssignmentOperatorToken,
    SlimeJavascriptAssignmentPattern,
    SlimeJavascriptAssignmentProperty,
    SlimeJavascriptAssignToken,
    SlimeJavascriptAsteriskToken,
    SlimeJavascriptAsToken,
    SlimeJavascriptAsyncToken,
    SlimeJavascriptAwaitExpression,
    SlimeJavascriptAwaitToken,
    SlimeJavascriptBaseCallExpression,
    SlimeJavascriptBaseClass,
    SlimeJavascriptBaseDeclaration,
    SlimeJavascriptBaseExpression,
    SlimeJavascriptBaseForXStatement,
    SlimeJavascriptBaseFunction,
    SlimeJavascriptBaseModuleDeclaration,
    SlimeJavascriptBaseModuleSpecifier,
    SlimeJavascriptBaseNode,
    SlimeJavascriptBaseNodeWithoutComments,
    SlimeJavascriptBasePattern,
    SlimeJavascriptBaseStatement,
    SlimeJavascriptBigIntLiteral,
    SlimeJavascriptBinaryExpression, SlimeJavascriptBinaryOperator,
    SlimeJavascriptBinaryOperatorToken,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptBooleanLiteral,
    SlimeJavascriptBreakStatement,
    SlimeJavascriptBreakToken,
    SlimeJavascriptCaseToken,
    SlimeJavascriptCatchClause,
    SlimeJavascriptCatchToken,
    SlimeJavascriptChainExpression,
    SlimeJavascriptClassBody,
    SlimeJavascriptClassDeclaration,
    SlimeJavascriptClassExpression,
    SlimeJavascriptClassToken,
    SlimeJavascriptColonToken,
    SlimeJavascriptCommaToken,
    SlimeJavascriptComment,
    SlimeJavascriptConditionalExpression,
    SlimeJavascriptConstToken,
    SlimeJavascriptContinueStatement,
    SlimeJavascriptContinueToken,
    SlimeJavascriptDebuggerStatement,
    SlimeJavascriptDebuggerToken,
    SlimeJavascriptDefaultToken,
    SlimeJavascriptDeleteToken,
    SlimeJavascriptDirective,
    SlimeJavascriptDoToken,
    SlimeJavascriptDotToken,
    SlimeJavascriptDoWhileStatement,
    SlimeJavascriptEllipsisToken,
    SlimeJavascriptElseToken,
    SlimeJavascriptEmptyStatement,
    SlimeJavascriptExportAllDeclaration,
    SlimeJavascriptExportDefaultDeclaration,
    SlimeJavascriptExportNamedDeclaration,
    SlimeJavascriptExportSpecifier,
    SlimeJavascriptExportToken,
    SlimeJavascriptExpressionStatement,
    SlimeJavascriptExtendsToken,
    SlimeJavascriptFinallyToken,
    SlimeJavascriptForInStatement,
    SlimeJavascriptForOfStatement,
    SlimeJavascriptForStatement,
    SlimeJavascriptForToken,
    SlimeJavascriptFromToken,
    SlimeJavascriptFunctionDeclaration,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionToken,
    SlimeJavascriptFunctionTokens,
    SlimeJavascriptGetToken,
    SlimeJavascriptIdentifier,
    SlimeJavascriptIfStatement,
    SlimeJavascriptIfToken,
    SlimeJavascriptImportDeclaration,
    SlimeJavascriptImportDefaultSpecifier,
    SlimeJavascriptImportExpression,
    SlimeJavascriptImportNamespaceSpecifier,
    SlimeJavascriptImportSpecifier,
    SlimeJavascriptImportToken,
    SlimeJavascriptInstanceofToken,
    SlimeJavascriptInToken,
    SlimeJavascriptLabeledStatement,
    SlimeJavascriptLBraceToken,
    SlimeJavascriptLBracketToken,
    SlimeJavascriptLetToken,
    SlimeJavascriptLogicalExpression, SlimeJavascriptLogicalOperator,
    SlimeJavascriptLogicalOperatorToken,
    SlimeJavascriptLParenToken,
    SlimeJavascriptMaybeNamedClassDeclaration,
    SlimeJavascriptMaybeNamedFunctionDeclaration,
    SlimeJavascriptMemberExpression,
    SlimeJavascriptMetaProperty,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptNewExpression,
    SlimeJavascriptNewToken,
    SlimeJavascriptNullLiteral,
    SlimeJavascriptNumericLiteral,
    SlimeJavascriptObjectExpression,
    SlimeJavascriptObjectPattern,
    SlimeJavascriptOfToken,
    SlimeJavascriptOptionalChainingToken,
    SlimeJavascriptPrivateIdentifier,
    SlimeJavascriptProgram,
    SlimeJavascriptProgramSourceType,
    SlimeJavascriptProperty,
    SlimeJavascriptPropertyDefinition,
    SlimeJavascriptQuestionToken,
    SlimeJavascriptRBraceToken,
    SlimeJavascriptRBracketToken,
    SlimeJavascriptRegExpLiteral,
    SlimeJavascriptRestElement,
    SlimeJavascriptReturnStatement,
    SlimeJavascriptReturnToken,
    SlimeJavascriptRParenToken,
    SlimeJavascriptSemicolonToken,
    SlimeJavascriptSequenceExpression,
    SlimeJavascriptSetToken,
    SlimeJavascriptSimpleCallExpression,
    SlimeJavascriptSimpleLiteral,
    SlimeJavascriptSpreadElement,
    SlimeJavascriptStaticBlock,
    SlimeJavascriptStaticToken,
    SlimeJavascriptStringLiteral,
    SlimeJavascriptSuper,
    SlimeJavascriptSwitchCase,
    SlimeJavascriptSwitchStatement,
    SlimeJavascriptSwitchToken,
    SlimeJavascriptTaggedTemplateExpression,
    SlimeJavascriptTemplateElement,
    SlimeJavascriptTemplateLiteral,
    SlimeJavascriptThisExpression,
    SlimeJavascriptThrowStatement,
    SlimeJavascriptThrowToken,
    SlimeJavascriptTokenNode,
    SlimeJavascriptTryStatement,
    SlimeJavascriptTryToken,
    SlimeJavascriptTypeofToken,
    SlimeJavascriptUnaryExpression, SlimeJavascriptUnaryOperator,
    SlimeJavascriptUnaryOperatorToken,
    SlimeJavascriptUpdateExpression, SlimeJavascriptUpdateOperator,
    SlimeJavascriptUpdateOperatorToken,
    SlimeJavascriptVariableDeclaration,
    SlimeJavascriptVariableDeclarator,
    SlimeJavascriptVarToken,
    SlimeJavascriptVoidToken,
    SlimeJavascriptWhileStatement,
    SlimeJavascriptWhileToken,
    SlimeJavascriptWithStatement,
    SlimeJavascriptWithToken,
    SlimeJavascriptYieldExpression,
    SlimeJavascriptYieldToken
} from "./deprecated/SlimeJavascript/SlimeJavascriptAstNode.ts";

/**
 * 辅助类型：排除 ESTree 类型中与 Slime 冲突的属性
 * - loc: 使用 SubhutiSourceLocation 替代 SourceLocation
 * - leadingComments/trailingComments: 使用 SlimeComment[] 替代 Comment[]
 * - K: 可选的额外排除属性
 */
type SlimeExtends<T, K extends keyof any = never> = Omit<T, 'loc' | 'leadingComments' | 'trailingComments' | K>

export interface SlimeBaseNodeWithoutComments extends SlimeJavascriptBaseNodeWithoutComments {
}

export interface SlimeBaseNode extends SlimeJavascriptBaseNode {
}

// ============================================
// Token 节点基础类型
// ============================================

/**
 * Token 节点基础类型
 * 所有 token 节点都继承此类型，包含 value 和位置信息
 */
export interface SlimeTokenNode extends SlimeJavascriptTokenNode {
}

// ============================================
// 变量声明关键字 Token
// ============================================

export interface SlimeVarToken extends SlimeJavascriptVarToken {
}

export interface SlimeLetToken extends SlimeJavascriptLetToken {
}

export interface SlimeConstToken extends SlimeJavascriptConstToken {
}

/** 变量声明关键字 Token 联合类型 */
export type SlimeVariableDeclarationKindToken = SlimeVarToken | SlimeLetToken | SlimeConstToken;

// ============================================
// 赋值运算符 Token
// ============================================

export interface SlimeAssignToken extends SlimeJavascriptAssignToken {
}

// ============================================
// 标点符号 Token
// ============================================

export interface SlimeSemicolonToken extends SlimeJavascriptSemicolonToken {
}

export interface SlimeLBraceToken extends SlimeJavascriptLBraceToken {
}

export interface SlimeRBraceToken extends SlimeJavascriptRBraceToken {
}

export interface SlimeLBracketToken extends SlimeJavascriptLBracketToken {
}

export interface SlimeRBracketToken extends SlimeJavascriptRBracketToken {
}

export interface SlimeLParenToken extends SlimeJavascriptLParenToken {
}

export interface SlimeRParenToken extends SlimeJavascriptRParenToken {
}

export interface SlimeCommaToken extends SlimeJavascriptCommaToken {
}

export interface SlimeColonToken extends SlimeJavascriptColonToken {
}

// ============================================
// 通用 Token 组合接口
// ============================================

/** 包含大括号的节点 { } */
export interface SlimeBraceTokens {
    lBraceToken?: SlimeLBraceToken;
    rBraceToken?: SlimeRBraceToken;
}

/** 包含中括号的节点 [ ] */
export interface SlimeBracketTokens {
    lBracketToken?: SlimeLBracketToken;
    rBracketToken?: SlimeRBracketToken;
}

/** 包含小括号的节点 ( ) */
export interface SlimeParenTokens {
    lParenToken?: SlimeLParenToken;
    rParenToken?: SlimeRParenToken;
}

/** 函数结构：小括号 + 大括号 */
export interface SlimeFunctionTokens extends SlimeJavascriptFunctionTokens {
}

/** 包含冒号的节点 */
export interface SlimeColonTokens {
    colonToken?: SlimeColonToken;
}

/** 包含分号的节点 */
export interface SlimeSemicolonTokens {
    semicolonToken?: SlimeSemicolonToken;
}

// ============================================
// 关键字 Token
// ============================================

export interface SlimeFunctionToken extends SlimeJavascriptFunctionToken {
}

export interface SlimeAsyncToken extends SlimeJavascriptAsyncToken {
}

export interface SlimeAsteriskToken extends SlimeJavascriptAsteriskToken {
}

export interface SlimeArrowToken extends SlimeJavascriptArrowToken {
}

// 控制流关键字
export interface SlimeIfToken extends SlimeJavascriptIfToken {
}

export interface SlimeElseToken extends SlimeJavascriptElseToken {
}

export interface SlimeForToken extends SlimeJavascriptForToken {
}

export interface SlimeWhileToken extends SlimeJavascriptWhileToken {
}

export interface SlimeDoToken extends SlimeJavascriptDoToken {
}

export interface SlimeInToken extends SlimeJavascriptInToken {
}

export interface SlimeOfToken extends SlimeJavascriptOfToken {
}

export interface SlimeSwitchToken extends SlimeJavascriptSwitchToken {
}

export interface SlimeCaseToken extends SlimeJavascriptCaseToken {
}

export interface SlimeDefaultToken extends SlimeJavascriptDefaultToken {
}

export interface SlimeBreakToken extends SlimeJavascriptBreakToken {
}

export interface SlimeContinueToken extends SlimeJavascriptContinueToken {
}

export interface SlimeReturnToken extends SlimeJavascriptReturnToken {
}

export interface SlimeThrowToken extends SlimeJavascriptThrowToken {
}

export interface SlimeTryToken extends SlimeJavascriptTryToken {
}

export interface SlimeCatchToken extends SlimeJavascriptCatchToken {
}

export interface SlimeFinallyToken extends SlimeJavascriptFinallyToken {
}

export interface SlimeWithToken extends SlimeJavascriptWithToken {
}

export interface SlimeDebuggerToken extends SlimeJavascriptDebuggerToken {
}

export interface SlimeAwaitToken extends SlimeJavascriptAwaitToken {
}

export interface SlimeYieldToken extends SlimeJavascriptYieldToken {
}

// 类相关关键字
export interface SlimeClassToken extends SlimeJavascriptClassToken {
}

export interface SlimeExtendsToken extends SlimeJavascriptExtendsToken {
}

export interface SlimeStaticToken extends SlimeJavascriptStaticToken {
}

export interface SlimeGetToken extends SlimeJavascriptGetToken {
}

export interface SlimeSetToken extends SlimeJavascriptSetToken {
}

// 操作符关键字
export interface SlimeNewToken extends SlimeJavascriptNewToken {
}

export interface SlimeTypeofToken extends SlimeJavascriptTypeofToken {
}

export interface SlimeVoidToken extends SlimeJavascriptVoidToken {
}

export interface SlimeDeleteToken extends SlimeJavascriptDeleteToken {
}

export interface SlimeInstanceofToken extends SlimeJavascriptInstanceofToken {
}

// 模块关键字
export interface SlimeImportToken extends SlimeJavascriptImportToken {
}

export interface SlimeExportToken extends SlimeJavascriptExportToken {
}

export interface SlimeFromToken extends SlimeJavascriptFromToken {
}

export interface SlimeAsToken extends SlimeJavascriptAsToken {
}

// 展开运算符 (Ellipsis)
export interface SlimeEllipsisToken extends SlimeJavascriptEllipsisToken {
}

// 点号
export interface SlimeDotToken extends SlimeJavascriptDotToken {
}

// 可选链
export interface SlimeOptionalChainingToken extends SlimeJavascriptOptionalChainingToken {
}

// 问号
export interface SlimeQuestionToken extends SlimeJavascriptQuestionToken {
}

// ============================================
// 运算符 Token（用于表达式）
// ============================================

/** 二元运算符 Token */
export interface SlimeBinaryOperatorToken extends SlimeJavascriptBinaryOperatorToken {
}

/** 一元运算符 Token */
export interface SlimeUnaryOperatorToken extends SlimeJavascriptUnaryOperatorToken {
}

/** 逻辑运算符 Token */
export interface SlimeLogicalOperatorToken extends SlimeJavascriptLogicalOperatorToken {
}

/** 赋值运算符 Token */
export interface SlimeAssignmentOperatorToken extends SlimeJavascriptAssignmentOperatorToken {
}

/** 更新运算符 Token */
export interface SlimeUpdateOperatorToken extends SlimeJavascriptUpdateOperatorToken {
}

// ============================================
// 元素/参数包装类型（用于精确关联逗号 Token）
// ============================================

/** 数组元素包装 - 用于 SlimeArrayExpression */
export interface SlimeArrayElement {
    element: SlimeExpression | SlimeSpreadElement | null;
    commaToken?: SlimeCommaToken;
}

/** 对象属性包装 - 用于 SlimeObjectExpression */
export interface SlimeObjectPropertyItem {
    property: SlimeProperty | SlimeSpreadElement;
    commaToken?: SlimeCommaToken;
}

/** 函数参数包装 - 用于 SlimeBaseFunction.params */
export interface SlimeFunctionParam {
    param: SlimePattern;
    commaToken?: SlimeCommaToken;
}

/** 调用参数包装 - 用于 SlimeBaseCallExpression.arguments */
export interface SlimeCallArgument {
    argument: SlimeExpression | SlimeSpreadElement;
    commaToken?: SlimeCommaToken;
}

/** 解构数组元素包装 - 用于 SlimeArrayPattern */
export interface SlimeArrayPatternElement {
    element: SlimePattern | null;
    commaToken?: SlimeCommaToken;
}

/** 解构对象属性包装 - 用于 SlimeObjectPattern */
export interface SlimeObjectPatternProperty {
    property: SlimeAssignmentProperty | SlimeRestElement;
    commaToken?: SlimeCommaToken;
}

/** Import specifier 包装 - 用于 SlimeImportDeclaration */
export interface SlimeImportSpecifierItem {
    specifier: SlimeImportSpecifier | SlimeImportDefaultSpecifier | SlimeImportNamespaceSpecifier;
    commaToken?: SlimeCommaToken;
}

/** Export specifier 包装 - 用于 SlimeExportNamedDeclaration */
export interface SlimeExportSpecifierItem {
    specifier: SlimeExportSpecifier;
    commaToken?: SlimeCommaToken;
}

export interface SlimeNodeMap {
    SlimeAssignmentProperty: SlimeAssignmentProperty;
    SlimeCatchClause: SlimeCatchClause;
    SlimeClass: SlimeClass;
    SlimeClassBody: SlimeClassBody;
    SlimeExpression: SlimeExpression;
    SlimeFunction: SlimeFunction;
    SlimeIdentifier: SlimeIdentifier;
    SlimeLiteral: SlimeLiteral;
    SlimeMethodDefinition: SlimeMethodDefinition;
    SlimeModuleDeclaration: SlimeModuleDeclaration;
    SlimeModuleSpecifier: SlimeModuleSpecifier;
    SlimePattern: SlimePattern;
    SlimePrivateIdentifier: SlimePrivateIdentifier;
    SlimeProgram: SlimeProgram;
    SlimeProperty: SlimeProperty;
    SlimePropertyDefinition: SlimePropertyDefinition;
    SlimeSpreadElement: SlimeSpreadElement;
    SlimeStatement: SlimeStatement;
    SlimeSuper: SlimeSuper;
    SlimeSwitchCase: SlimeSwitchCase;
    SlimeTemplateElement: SlimeTemplateElement;
    SlimeVariableDeclarator: SlimeVariableDeclarator;
}

export type SlimeNode = SlimeNodeMap[keyof SlimeNodeMap];

export interface SlimeComment extends SlimeJavascriptComment {
}

/** Program source type */
export const SlimeProgramSourceType = {
    Script: "script",
    Module: "module"
} as const;
export type SlimeProgramSourceType = typeof SlimeJavascriptProgramSourceType[keyof typeof SlimeJavascriptProgramSourceType];

export interface SlimeProgram extends SlimeJavascriptProgram {
}

export interface SlimeDirective extends SlimeJavascriptDirective {
}

export interface SlimeBaseFunction extends SlimeJavascriptBaseFunction {
}

export type SlimeFunction = SlimeFunctionDeclaration | SlimeFunctionExpression | SlimeArrowFunctionExpression;

export type SlimeStatement =
    | SlimeExpressionStatement
    | SlimeBlockStatement
    | SlimeStaticBlock
    | SlimeEmptyStatement
    | SlimeDebuggerStatement
    | SlimeWithStatement
    | SlimeReturnStatement
    | SlimeLabeledStatement
    | SlimeBreakStatement
    | SlimeContinueStatement
    | SlimeIfStatement
    | SlimeSwitchStatement
    | SlimeThrowStatement
    | SlimeTryStatement
    | SlimeWhileStatement
    | SlimeDoWhileStatement
    | SlimeForStatement
    | SlimeForInStatement
    | SlimeForOfStatement
    | SlimeDeclaration;

export interface SlimeBaseStatement extends SlimeJavascriptBaseStatement {
}

export interface SlimeEmptyStatement extends SlimeJavascriptEmptyStatement {
}

export interface SlimeBlockStatement extends SlimeJavascriptBlockStatement {
}

export interface SlimeStaticBlock extends SlimeJavascriptStaticBlock {
}

export interface SlimeExpressionStatement extends SlimeJavascriptExpressionStatement {
}

export interface SlimeIfStatement extends SlimeJavascriptIfStatement {
}

export interface SlimeLabeledStatement extends SlimeJavascriptLabeledStatement {
}

export interface SlimeBreakStatement extends SlimeJavascriptBreakStatement {
}

export interface SlimeContinueStatement extends SlimeJavascriptContinueStatement {
}

export interface SlimeWithStatement extends SlimeJavascriptWithStatement {
}

export interface SlimeSwitchStatement extends SlimeJavascriptSwitchStatement {
}

export interface SlimeReturnStatement extends SlimeJavascriptReturnStatement {
}

export interface SlimeThrowStatement extends SlimeJavascriptThrowStatement {
}

export interface SlimeTryStatement extends SlimeJavascriptTryStatement {
}

export interface SlimeWhileStatement extends SlimeJavascriptWhileStatement {
}

export interface SlimeDoWhileStatement extends SlimeJavascriptDoWhileStatement {
}

export interface SlimeForStatement extends SlimeJavascriptForStatement {
}

export interface SlimeBaseForXStatement extends SlimeJavascriptBaseForXStatement {
}

export interface SlimeForInStatement extends SlimeJavascriptForInStatement {
}

export interface SlimeDebuggerStatement extends SlimeJavascriptDebuggerStatement {
}

export type SlimeDeclaration = SlimeFunctionDeclaration | SlimeVariableDeclaration | SlimeClassDeclaration;

export interface SlimeBaseDeclaration extends SlimeJavascriptBaseDeclaration {
}

export interface SlimeMaybeNamedFunctionDeclaration extends SlimeJavascriptMaybeNamedFunctionDeclaration {
}

export interface SlimeFunctionDeclaration extends SlimeJavascriptFunctionDeclaration {
}

export interface SlimeVariableDeclaration extends SlimeJavascriptVariableDeclaration {
}

export interface SlimeVariableDeclarator extends SlimeJavascriptVariableDeclarator {
}

export interface SlimeExpressionMap {
    SlimeArrayExpression: SlimeArrayExpression;
    SlimeArrowFunctionExpression: SlimeArrowFunctionExpression;
    SlimeAssignmentExpression: SlimeAssignmentExpression;
    SlimeAwaitExpression: SlimeAwaitExpression;
    SlimeBinaryExpression: SlimeBinaryExpression;
    SlimeCallExpression: SlimeCallExpression;
    SlimeChainExpression: SlimeChainExpression;
    SlimeClassExpression: SlimeClassExpression;
    SlimeConditionalExpression: SlimeConditionalExpression;
    SlimeFunctionExpression: SlimeFunctionExpression;
    SlimeIdentifier: SlimeIdentifier;
    SlimeImportExpression: SlimeImportExpression;
    SlimeLiteral: SlimeLiteral;
    SlimeLogicalExpression: SlimeLogicalExpression;
    SlimeMemberExpression: SlimeMemberExpression;
    SlimeMetaProperty: SlimeMetaProperty;
    SlimeNewExpression: SlimeNewExpression;
    SlimeObjectExpression: SlimeObjectExpression;
    SlimeSequenceExpression: SlimeSequenceExpression;
    SlimeTaggedTemplateExpression: SlimeTaggedTemplateExpression;
    SlimeTemplateLiteral: SlimeTemplateLiteral;
    SlimeThisExpression: SlimeThisExpression;
    SlimeUnaryExpression: SlimeUnaryExpression;
    SlimeUpdateExpression: SlimeUpdateExpression;
    SlimeYieldExpression: SlimeYieldExpression;
}

export type SlimeExpression = SlimeExpressionMap[keyof SlimeExpressionMap];

export interface SlimeBaseExpression extends SlimeJavascriptBaseExpression {
}

export type SlimeChainElement = SlimeSimpleCallExpression | SlimeMemberExpression;

export interface SlimeChainExpression extends SlimeJavascriptChainExpression {
}

export interface SlimeThisExpression extends SlimeJavascriptThisExpression {
}

export interface SlimeArrayExpression extends SlimeJavascriptArrayExpression {
}

export interface SlimeObjectExpression extends SlimeJavascriptObjectExpression {
}

export interface SlimePrivateIdentifier extends SlimeJavascriptPrivateIdentifier {
}

export interface SlimeProperty extends SlimeJavascriptProperty {
}

export interface SlimePropertyDefinition extends SlimeJavascriptPropertyDefinition {
}

export interface SlimeFunctionExpression extends SlimeJavascriptFunctionExpression {
}

export interface SlimeSequenceExpression extends SlimeJavascriptSequenceExpression {
}

export interface SlimeUnaryExpression extends SlimeJavascriptUnaryExpression {
}

export interface SlimeBinaryExpression extends SlimeJavascriptBinaryExpression {
}

export interface SlimeAssignmentExpression extends SlimeJavascriptAssignmentExpression {
}

export interface SlimeUpdateExpression extends SlimeJavascriptUpdateExpression {
}

export interface SlimeLogicalExpression extends SlimeJavascriptLogicalExpression {
}

export interface SlimeConditionalExpression extends SlimeJavascriptConditionalExpression {
}

export interface SlimeBaseCallExpression extends SlimeJavascriptBaseCallExpression {
}

export type SlimeCallExpression = SlimeSimpleCallExpression | SlimeNewExpression;

export interface SlimeSimpleCallExpression extends SlimeJavascriptSimpleCallExpression {
}

export interface SlimeNewExpression extends SlimeJavascriptNewExpression {
}

export interface SlimeMemberExpression extends SlimeJavascriptMemberExpression {
}

export type SlimePattern =
    SlimeIdentifier
    | SlimeObjectPattern
    | SlimeArrayPattern
    | SlimeRestElement
    | SlimeAssignmentPattern
    | SlimeMemberExpression;

export interface SlimeBasePattern extends SlimeJavascriptBasePattern {
}

export interface SlimeSwitchCase extends SlimeJavascriptSwitchCase {
}

export interface SlimeCatchClause extends SlimeJavascriptCatchClause {
}

export interface SlimeIdentifier extends SlimeJavascriptIdentifier {
    /** [TypeScript] 类型注解 */
    typeAnnotation?: SlimeTSTypeAnnotation;
}

// ============================================
// TypeScript 类型节点
// ============================================

/** [TypeScript] 类型注解节点 */
export interface SlimeTSTypeAnnotation extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeAnnotation;
    colonToken?: SlimeColonToken;
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 类型联合 */
export type SlimeTSType = SlimeTSNumberKeyword;

/** [TypeScript] number 类型关键字 */
export interface SlimeTSNumberKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNumberKeyword;
}

export type SlimeLiteral = SlimeSimpleLiteral | SlimeRegExpLiteral | SlimeBigIntLiteral;

export interface SlimeSimpleLiteral extends SlimeJavascriptSimpleLiteral {
}

export interface SlimeRegExpLiteral extends SlimeJavascriptRegExpLiteral {
}

export interface SlimeBigIntLiteral extends SlimeJavascriptBigIntLiteral {
}

/** String literal - 字符串字面量 */
export interface SlimeStringLiteral extends SlimeJavascriptStringLiteral {
}

/** Numeric literal - 数字字面量 */
export interface SlimeNumericLiteral extends SlimeJavascriptNumericLiteral {
}

/** Boolean literal - 布尔字面量 */
export interface SlimeBooleanLiteral extends SlimeJavascriptBooleanLiteral {
}

/** Null literal - 空值字面量 */
export interface SlimeNullLiteral extends SlimeJavascriptNullLiteral {
}

export type SlimeUnaryOperator = SlimeJavascriptUnaryOperator;

export type SlimeBinaryOperator = SlimeJavascriptBinaryOperator;

export type SlimeLogicalOperator = SlimeJavascriptLogicalOperator;

export type SlimeAssignmentOperator = SlimeJavascriptAssignmentOperator;

export type SlimeUpdateOperator = SlimeJavascriptUpdateOperator;

export interface SlimeForOfStatement extends SlimeJavascriptForOfStatement {
}

export interface SlimeSuper extends SlimeJavascriptSuper {
}

export interface SlimeSpreadElement extends SlimeJavascriptSpreadElement {
}

export interface SlimeArrowFunctionExpression extends SlimeJavascriptArrowFunctionExpression {
}

export interface SlimeYieldExpression extends SlimeJavascriptYieldExpression {
}

export interface SlimeTemplateLiteral extends SlimeJavascriptTemplateLiteral {
}

export interface SlimeTaggedTemplateExpression extends SlimeJavascriptTaggedTemplateExpression {
}

export interface SlimeTemplateElement extends SlimeJavascriptTemplateElement {
}

export interface SlimeAssignmentProperty extends SlimeJavascriptAssignmentProperty {
}

export interface SlimeObjectPattern extends SlimeJavascriptObjectPattern {
}

export interface SlimeArrayPattern extends SlimeJavascriptArrayPattern {
}

export interface SlimeRestElement extends SlimeJavascriptRestElement {
}

export interface SlimeAssignmentPattern extends SlimeJavascriptAssignmentPattern {
}

export type SlimeClass = SlimeClassDeclaration | SlimeClassExpression;

export interface SlimeBaseClass extends SlimeJavascriptBaseClass {
}

export interface SlimeClassBody extends SlimeJavascriptClassBody {
}

export interface SlimeMethodDefinition extends SlimeJavascriptMethodDefinition {
}

export interface SlimeMaybeNamedClassDeclaration extends SlimeJavascriptMaybeNamedClassDeclaration {
}

export interface SlimeClassDeclaration extends SlimeJavascriptClassDeclaration {
}

export interface SlimeClassExpression extends SlimeJavascriptClassExpression {
}

export interface SlimeMetaProperty extends SlimeJavascriptMetaProperty {
}

export type SlimeModuleDeclaration =
    | SlimeImportDeclaration
    | SlimeExportNamedDeclaration
    | SlimeExportDefaultDeclaration
    | SlimeExportAllDeclaration;

export interface SlimeBaseModuleDeclaration extends SlimeJavascriptBaseModuleDeclaration {
}

export type SlimeModuleSpecifier =
    SlimeImportSpecifier
    | SlimeImportDefaultSpecifier
    | SlimeImportNamespaceSpecifier
    | SlimeExportSpecifier;

export interface SlimeBaseModuleSpecifier extends SlimeJavascriptBaseModuleSpecifier {
}

export interface SlimeImportDeclaration extends SlimeJavascriptImportDeclaration {
}

export interface SlimeImportSpecifier extends SlimeJavascriptImportSpecifier {
}

export interface SlimeImportExpression extends SlimeJavascriptImportExpression {
}

export interface SlimeImportDefaultSpecifier extends SlimeJavascriptImportDefaultSpecifier {
}

export interface SlimeImportNamespaceSpecifier extends SlimeJavascriptImportNamespaceSpecifier {
}

export interface SlimeExportNamedDeclaration extends SlimeJavascriptExportNamedDeclaration {
}

export interface SlimeExportSpecifier extends SlimeJavascriptExportSpecifier {
}

export interface SlimeExportDefaultDeclaration extends SlimeJavascriptExportDefaultDeclaration {
}

export interface SlimeExportAllDeclaration extends SlimeJavascriptExportAllDeclaration {
}

export interface SlimeAwaitExpression extends SlimeJavascriptAwaitExpression {
}
