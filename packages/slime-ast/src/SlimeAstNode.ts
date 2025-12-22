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
export interface SlimeFunctionTokens extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFunctionTokens {
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

export interface SlimeFunctionToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFunctionToken {
}

export interface SlimeAsyncToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAsyncToken {
}

export interface SlimeAsteriskToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAsteriskToken {
}

export interface SlimeArrowToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptArrowToken {
}

// 控制流关键字
export interface SlimeIfToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptIfToken {
}

export interface SlimeElseToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptElseToken {
}

export interface SlimeForToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptForToken {
}

export interface SlimeWhileToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptWhileToken {
}

export interface SlimeDoToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDoToken {
}

export interface SlimeInToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptInToken {
}

export interface SlimeOfToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptOfToken {
}

export interface SlimeSwitchToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSwitchToken {
}

export interface SlimeCaseToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptCaseToken {
}

export interface SlimeDefaultToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDefaultToken {
}

export interface SlimeBreakToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBreakToken {
}

export interface SlimeContinueToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptContinueToken {
}

export interface SlimeReturnToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptReturnToken {
}

export interface SlimeThrowToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptThrowToken {
}

export interface SlimeTryToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTryToken {
}

export interface SlimeCatchToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptCatchToken {
}

export interface SlimeFinallyToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFinallyToken {
}

export interface SlimeWithToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptWithToken {
}

export interface SlimeDebuggerToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDebuggerToken {
}

export interface SlimeAwaitToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAwaitToken {
}

export interface SlimeYieldToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptYieldToken {
}

// 类相关关键字
export interface SlimeClassToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptClassToken {
}

export interface SlimeExtendsToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExtendsToken {
}

export interface SlimeStaticToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptStaticToken {
}

export interface SlimeGetToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptGetToken {
}

export interface SlimeSetToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSetToken {
}

// 操作符关键字
export interface SlimeNewToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptNewToken {
}

export interface SlimeTypeofToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTypeofToken {
}

export interface SlimeVoidToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptVoidToken {
}

export interface SlimeDeleteToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDeleteToken {
}

export interface SlimeInstanceofToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptInstanceofToken {
}

// 模块关键字
export interface SlimeImportToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportToken {
}

export interface SlimeExportToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExportToken {
}

export interface SlimeFromToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFromToken {
}

export interface SlimeAsToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAsToken {
}

// 展开运算符 (Ellipsis)
export interface SlimeEllipsisToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptEllipsisToken {
}

// 点号
export interface SlimeDotToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDotToken {
}

// 可选链
export interface SlimeOptionalChainingToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptOptionalChainingToken {
}

// 问号
export interface SlimeQuestionToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptQuestionToken {
}

// ============================================
// 运算符 Token（用于表达式）
// ============================================

/** 二元运算符 Token */
export interface SlimeBinaryOperatorToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBinaryOperatorToken {
}

/** 一元运算符 Token */
export interface SlimeUnaryOperatorToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptUnaryOperatorToken {
}

/** 逻辑运算符 Token */
export interface SlimeLogicalOperatorToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptLogicalOperatorToken {
}

/** 赋值运算符 Token */
export interface SlimeAssignmentOperatorToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAssignmentOperatorToken {
}

/** 更新运算符 Token */
export interface SlimeUpdateOperatorToken extends Omit<SlimeBaseNode, "type">, SlimeJavascriptUpdateOperatorToken {
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

export interface SlimeComment extends Omit<SlimeBaseNode, "type">, SlimeJavascriptComment {
}

/** Program source type */
export const SlimeProgramSourceType = {
    Script: "script",
    Module: "module"
} as const;
export type SlimeProgramSourceType = typeof SlimeJavascriptProgramSourceType[keyof typeof SlimeJavascriptProgramSourceType];

export interface SlimeProgram extends Omit<SlimeBaseNode, "type">, SlimeJavascriptProgram {
}

export interface SlimeDirective extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDirective {
}

export interface SlimeBaseFunction extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseFunction {
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

export interface SlimeBaseStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseStatement {
}

export interface SlimeEmptyStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptEmptyStatement {
}

export interface SlimeBlockStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBlockStatement {
}

export interface SlimeStaticBlock extends Omit<SlimeBaseNode, "type">, SlimeJavascriptStaticBlock {
}

export interface SlimeExpressionStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExpressionStatement {
}

export interface SlimeIfStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptIfStatement {
}

export interface SlimeLabeledStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptLabeledStatement {
}

export interface SlimeBreakStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBreakStatement {
}

export interface SlimeContinueStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptContinueStatement {
}

export interface SlimeWithStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptWithStatement {
}

export interface SlimeSwitchStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSwitchStatement {
}

export interface SlimeReturnStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptReturnStatement {
}

export interface SlimeThrowStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptThrowStatement {
}

export interface SlimeTryStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTryStatement {
}

export interface SlimeWhileStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptWhileStatement {
}

export interface SlimeDoWhileStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDoWhileStatement {
}

export interface SlimeForStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptForStatement {
}

export interface SlimeBaseForXStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseForXStatement {
}

export interface SlimeForInStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptForInStatement {
}

export interface SlimeDebuggerStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptDebuggerStatement {
}

export type SlimeDeclaration = SlimeFunctionDeclaration | SlimeVariableDeclaration | SlimeClassDeclaration;

export interface SlimeBaseDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseDeclaration {
}

export interface SlimeMaybeNamedFunctionDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptMaybeNamedFunctionDeclaration {
}

export interface SlimeFunctionDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFunctionDeclaration {
}

export interface SlimeVariableDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptVariableDeclaration {
}

export interface SlimeVariableDeclarator extends Omit<SlimeBaseNode, "type">, SlimeJavascriptVariableDeclarator {
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

export interface SlimeBaseExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseExpression {
}

export type SlimeChainElement = SlimeSimpleCallExpression | SlimeMemberExpression;

export interface SlimeChainExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptChainExpression {
}

export interface SlimeThisExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptThisExpression {
}

export interface SlimeArrayExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptArrayExpression {
}

export interface SlimeObjectExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptObjectExpression {
}

export interface SlimePrivateIdentifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptPrivateIdentifier {
}

export interface SlimeProperty extends Omit<SlimeBaseNode, "type">, SlimeJavascriptProperty {
}

export interface SlimePropertyDefinition extends Omit<SlimeBaseNode, "type">, SlimeJavascriptPropertyDefinition {
}

export interface SlimeFunctionExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptFunctionExpression {
}

export interface SlimeSequenceExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSequenceExpression {
}

export interface SlimeUnaryExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptUnaryExpression {
}

export interface SlimeBinaryExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBinaryExpression {
}

export interface SlimeAssignmentExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAssignmentExpression {
}

export interface SlimeUpdateExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptUpdateExpression {
}

export interface SlimeLogicalExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptLogicalExpression {
}

export interface SlimeConditionalExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptConditionalExpression {
}

export interface SlimeBaseCallExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseCallExpression {
}

export type SlimeCallExpression = SlimeSimpleCallExpression | SlimeNewExpression;

export interface SlimeSimpleCallExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSimpleCallExpression {
}

export interface SlimeNewExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptNewExpression {
}

export interface SlimeMemberExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptMemberExpression {
}

export type SlimePattern =
    SlimeIdentifier
    | SlimeObjectPattern
    | SlimeArrayPattern
    | SlimeRestElement
    | SlimeAssignmentPattern
    | SlimeMemberExpression;

export interface SlimeBasePattern extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBasePattern {
}

export interface SlimeSwitchCase extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSwitchCase {
}

export interface SlimeCatchClause extends Omit<SlimeBaseNode, "type">, SlimeJavascriptCatchClause {
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

// ============================================
// TypeScript: 基础类型关键字 (Phase 1)
// ============================================

/** [TypeScript] number 类型关键字 */
export interface SlimeTSNumberKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNumberKeyword;
}

/** [TypeScript] string 类型关键字 */
export interface SlimeTSStringKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSStringKeyword;
}

/** [TypeScript] boolean 类型关键字 */
export interface SlimeTSBooleanKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSBooleanKeyword;
}

/** [TypeScript] any 类型关键字 */
export interface SlimeTSAnyKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSAnyKeyword;
}

/** [TypeScript] unknown 类型关键字 */
export interface SlimeTSUnknownKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSUnknownKeyword;
}

/** [TypeScript] void 类型关键字 */
export interface SlimeTSVoidKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSVoidKeyword;
}

/** [TypeScript] never 类型关键字 */
export interface SlimeTSNeverKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNeverKeyword;
}

/** [TypeScript] null 类型关键字 */
export interface SlimeTSNullKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNullKeyword;
}

/** [TypeScript] undefined 类型关键字 */
export interface SlimeTSUndefinedKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSUndefinedKeyword;
}

/** [TypeScript] object 类型关键字 */
export interface SlimeTSObjectKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSObjectKeyword;
}

/** [TypeScript] symbol 类型关键字 */
export interface SlimeTSSymbolKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSSymbolKeyword;
}

/** [TypeScript] bigint 类型关键字 */
export interface SlimeTSBigIntKeyword extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSBigIntKeyword;
}

// ============================================
// TypeScript: 字面量类型和类型引用 (Phase 1)
// ============================================

/** [TypeScript] 字面量类型 */
export interface SlimeTSLiteralType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSLiteralType;
    literal: SlimeStringLiteral | SlimeNumericLiteral | SlimeBooleanLiteral | SlimeNullLiteral;
}

/** [TypeScript] 模板字面量类型 */
export interface SlimeTSTemplateLiteralType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTemplateLiteralType;
    quasis: SlimeTemplateElement[];
    types: SlimeTSType[];
}

/** [TypeScript] 类型引用 */
export interface SlimeTSTypeReference extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeReference;
    typeName: SlimeIdentifier | SlimeTSQualifiedName;
    typeParameters?: SlimeTSTypeParameterInstantiation;
}

/** [TypeScript] 限定名称 (Namespace.Type) */
export interface SlimeTSQualifiedName extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSQualifiedName;
    left: SlimeIdentifier | SlimeTSQualifiedName;
    right: SlimeIdentifier;
}

// ============================================
// TypeScript: 复合类型 (Phase 2)
// ============================================

/** [TypeScript] 联合类型 */
export interface SlimeTSUnionType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSUnionType;
    types: SlimeTSType[];
}

/** [TypeScript] 交叉类型 */
export interface SlimeTSIntersectionType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSIntersectionType;
    types: SlimeTSType[];
}

/** [TypeScript] 数组类型 */
export interface SlimeTSArrayType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSArrayType;
    elementType: SlimeTSType;
}

/** [TypeScript] 元组类型 */
export interface SlimeTSTupleType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTupleType;
    elementTypes: (SlimeTSType | SlimeTSNamedTupleMember)[];
}

/** [TypeScript] 命名元组成员 */
export interface SlimeTSNamedTupleMember extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNamedTupleMember;
    label: SlimeIdentifier;
    elementType: SlimeTSType;
    optional?: boolean;
}

/** [TypeScript] 剩余类型 */
export interface SlimeTSRestType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSRestType;
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 可选类型 */
export interface SlimeTSOptionalType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSOptionalType;
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 对象类型字面量 */
export interface SlimeTSTypeLiteral extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeLiteral;
    members: SlimeTSTypeElement[];
}

/** [TypeScript] 类型元素联合 */
export type SlimeTSTypeElement =
    | SlimeTSPropertySignature
    | SlimeTSIndexSignature
    | SlimeTSMethodSignature
    | SlimeTSCallSignatureDeclaration
    | SlimeTSConstructSignatureDeclaration;

/** [TypeScript] 属性签名 */
export interface SlimeTSPropertySignature extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSPropertySignature;
    key: SlimeIdentifier | SlimeStringLiteral | SlimeNumericLiteral;
    computed?: boolean;
    optional?: boolean;
    readonly?: boolean;
    typeAnnotation?: SlimeTSTypeAnnotation;
}

/** [TypeScript] 索引签名 */
export interface SlimeTSIndexSignature extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSIndexSignature;
    parameters: SlimeIdentifier[];
    typeAnnotation?: SlimeTSTypeAnnotation;
    readonly?: boolean;
}

/** [TypeScript] 方法签名 */
export interface SlimeTSMethodSignature extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSMethodSignature;
    key: SlimeIdentifier | SlimeStringLiteral | SlimeNumericLiteral;
    computed?: boolean;
    optional?: boolean;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType?: SlimeTSTypeAnnotation;
}

/** [TypeScript] 调用签名 */
export interface SlimeTSCallSignatureDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSCallSignatureDeclaration;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType?: SlimeTSTypeAnnotation;
}

/** [TypeScript] 构造签名 */
export interface SlimeTSConstructSignatureDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSConstructSignatureDeclaration;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType?: SlimeTSTypeAnnotation;
}

/** [TypeScript] 函数类型 */
export interface SlimeTSFunctionType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSFunctionType;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType: SlimeTSTypeAnnotation;
}

/** [TypeScript] 构造函数类型 */
export interface SlimeTSConstructorType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSConstructorType;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    params: SlimePattern[];
    returnType: SlimeTSTypeAnnotation;
    abstract?: boolean;
}

// ============================================
// TypeScript: 类型声明 (Phase 4)
// ============================================

/** [TypeScript] 接口声明 */
export interface SlimeTSInterfaceDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSInterfaceDeclaration;
    id: SlimeIdentifier;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    extends?: SlimeTSInterfaceHeritage[];
    body: SlimeTSInterfaceBody;
    declare?: boolean;
}

/** [TypeScript] 接口体 */
export interface SlimeTSInterfaceBody extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSInterfaceBody;
    body: SlimeTSTypeElement[];
}

/** [TypeScript] 接口继承 */
export interface SlimeTSInterfaceHeritage extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSInterfaceHeritage;
    expression: SlimeIdentifier | SlimeMemberExpression;
    typeParameters?: SlimeTSTypeParameterInstantiation;
}

/** [TypeScript] 类型别名声明 */
export interface SlimeTSTypeAliasDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeAliasDeclaration;
    id: SlimeIdentifier;
    typeParameters?: SlimeTSTypeParameterDeclaration;
    typeAnnotation: SlimeTSType;
    declare?: boolean;
}

/** [TypeScript] 枚举声明 */
export interface SlimeTSEnumDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSEnumDeclaration;
    id: SlimeIdentifier;
    members: SlimeTSEnumMember[];
    const?: boolean;
    declare?: boolean;
}

/** [TypeScript] 枚举成员 */
export interface SlimeTSEnumMember extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSEnumMember;
    id: SlimeIdentifier | SlimeStringLiteral;
    initializer?: SlimeExpression;
}

// ============================================
// TypeScript: 泛型 (Phase 5)
// ============================================

/** [TypeScript] 类型参数声明 */
export interface SlimeTSTypeParameterDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeParameterDeclaration;
    params: SlimeTSTypeParameter[];
}

/** [TypeScript] 类型参数 */
export interface SlimeTSTypeParameter extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeParameter;
    name: SlimeIdentifier;
    constraint?: SlimeTSType;
    default?: SlimeTSType;
    in?: boolean;   // 逆变
    out?: boolean;  // 协变
}

/** [TypeScript] 类型参数实例化 */
export interface SlimeTSTypeParameterInstantiation extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeParameterInstantiation;
    params: SlimeTSType[];
}

// ============================================
// TypeScript: 类型操作符 (Phase 6)
// ============================================

/** [TypeScript] 类型查询 (typeof x) */
export interface SlimeTSTypeQuery extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeQuery;
    exprName: SlimeIdentifier | SlimeTSQualifiedName;
    typeParameters?: SlimeTSTypeParameterInstantiation;
}

/** [TypeScript] 类型操作符 (keyof, readonly, unique) */
export interface SlimeTSTypeOperator extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeOperator;
    operator: 'keyof' | 'readonly' | 'unique';
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 索引访问类型 (T[K]) */
export interface SlimeTSIndexedAccessType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSIndexedAccessType;
    objectType: SlimeTSType;
    indexType: SlimeTSType;
}

/** [TypeScript] 条件类型 (T extends U ? X : Y) */
export interface SlimeTSConditionalType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSConditionalType;
    checkType: SlimeTSType;
    extendsType: SlimeTSType;
    trueType: SlimeTSType;
    falseType: SlimeTSType;
}

/** [TypeScript] 推断类型 (infer R) */
export interface SlimeTSInferType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSInferType;
    typeParameter: SlimeTSTypeParameter;
}

/** [TypeScript] 映射类型 */
export interface SlimeTSMappedType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSMappedType;
    typeParameter: SlimeTSTypeParameter;
    nameType?: SlimeTSType;
    typeAnnotation?: SlimeTSType;
    optional?: '+' | '-' | boolean;
    readonly?: '+' | '-' | boolean;
}

// ============================================
// TypeScript: 模块和命名空间 (Phase 7)
// ============================================

/** [TypeScript] 导入类型 */
export interface SlimeTSImportType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSImportType;
    argument: SlimeStringLiteral;
    qualifier?: SlimeIdentifier | SlimeTSQualifiedName;
    typeParameters?: SlimeTSTypeParameterInstantiation;
}

/** [TypeScript] 模块/命名空间声明 */
export interface SlimeTSModuleDeclaration extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSModuleDeclaration;
    id: SlimeIdentifier | SlimeStringLiteral;
    body?: SlimeTSModuleBlock | SlimeTSModuleDeclaration;
    declare?: boolean;
    global?: boolean;
}

/** [TypeScript] 模块块 */
export interface SlimeTSModuleBlock extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSModuleBlock;
    body: SlimeStatement[];
}

// ============================================
// TypeScript: 特殊语法 (Phase 8)
// ============================================

/** [TypeScript] as 表达式 */
export interface SlimeTSAsExpression extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSAsExpression;
    expression: SlimeExpression;
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 类型断言 (<T>x) */
export interface SlimeTSTypeAssertion extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypeAssertion;
    typeAnnotation: SlimeTSType;
    expression: SlimeExpression;
}

/** [TypeScript] 非空断言 (x!) */
export interface SlimeTSNonNullExpression extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSNonNullExpression;
    expression: SlimeExpression;
}

/** [TypeScript] satisfies 表达式 */
export interface SlimeTSSatisfiesExpression extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSSatisfiesExpression;
    expression: SlimeExpression;
    typeAnnotation: SlimeTSType;
}

// ============================================
// TypeScript: 其他
// ============================================

/** [TypeScript] this 类型 */
export interface SlimeTSThisType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSThisType;
}

/** [TypeScript] 类型谓词 (x is T) */
export interface SlimeTSTypePredicate extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSTypePredicate;
    parameterName: SlimeIdentifier | SlimeTSThisType;
    typeAnnotation?: SlimeTSTypeAnnotation;
    asserts?: boolean;
}

/** [TypeScript] 括号类型 */
export interface SlimeTSParenthesizedType extends SlimeBaseNode {
    type: typeof SlimeAstTypeName.TSParenthesizedType;
    typeAnnotation: SlimeTSType;
}

// ============================================
// TypeScript: 类型联合
// ============================================

/** [TypeScript] 所有类型的联合 */
export type SlimeTSType =
    // 基础类型关键字
    | SlimeTSNumberKeyword
    | SlimeTSStringKeyword
    | SlimeTSBooleanKeyword
    | SlimeTSAnyKeyword
    | SlimeTSUnknownKeyword
    | SlimeTSVoidKeyword
    | SlimeTSNeverKeyword
    | SlimeTSNullKeyword
    | SlimeTSUndefinedKeyword
    | SlimeTSObjectKeyword
    | SlimeTSSymbolKeyword
    | SlimeTSBigIntKeyword
    // 字面量和引用
    | SlimeTSLiteralType
    | SlimeTSTemplateLiteralType
    | SlimeTSTypeReference
    // 复合类型
    | SlimeTSUnionType
    | SlimeTSIntersectionType
    | SlimeTSArrayType
    | SlimeTSTupleType
    | SlimeTSTypeLiteral
    | SlimeTSFunctionType
    | SlimeTSConstructorType
    // 类型操作符
    | SlimeTSTypeQuery
    | SlimeTSTypeOperator
    | SlimeTSIndexedAccessType
    | SlimeTSConditionalType
    | SlimeTSMappedType
    | SlimeTSInferType
    // 其他
    | SlimeTSImportType
    | SlimeTSThisType
    | SlimeTSTypePredicate
    | SlimeTSParenthesizedType;

export type SlimeLiteral = SlimeSimpleLiteral | SlimeRegExpLiteral | SlimeBigIntLiteral;

export interface SlimeSimpleLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSimpleLiteral {
}

export interface SlimeRegExpLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptRegExpLiteral {
}

export interface SlimeBigIntLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBigIntLiteral {
}

/** String literal - 字符串字面量 */
export interface SlimeStringLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptStringLiteral {
}

/** Numeric literal - 数字字面量 */
export interface SlimeNumericLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptNumericLiteral {
}

/** Boolean literal - 布尔字面量 */
export interface SlimeBooleanLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBooleanLiteral {
}

/** Null literal - 空值字面量 */
export interface SlimeNullLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptNullLiteral {
}

export type SlimeUnaryOperator = SlimeJavascriptUnaryOperator;

export type SlimeBinaryOperator = SlimeJavascriptBinaryOperator;

export type SlimeLogicalOperator = SlimeJavascriptLogicalOperator;

export type SlimeAssignmentOperator = SlimeJavascriptAssignmentOperator;

export type SlimeUpdateOperator = SlimeJavascriptUpdateOperator;

export interface SlimeForOfStatement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptForOfStatement {
}

export interface SlimeSuper extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSuper {
}

export interface SlimeSpreadElement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptSpreadElement {
}

export interface SlimeArrowFunctionExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptArrowFunctionExpression {
}

export interface SlimeYieldExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptYieldExpression {
}

export interface SlimeTemplateLiteral extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTemplateLiteral {
}

export interface SlimeTaggedTemplateExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTaggedTemplateExpression {
}

export interface SlimeTemplateElement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptTemplateElement {
}

export interface SlimeAssignmentProperty extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAssignmentProperty {
}

export interface SlimeObjectPattern extends Omit<SlimeBaseNode, "type">, SlimeJavascriptObjectPattern {
}

export interface SlimeArrayPattern extends Omit<SlimeBaseNode, "type">, SlimeJavascriptArrayPattern {
}

export interface SlimeRestElement extends Omit<SlimeBaseNode, "type">, SlimeJavascriptRestElement {
}

export interface SlimeAssignmentPattern extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAssignmentPattern {
}

export type SlimeClass = SlimeClassDeclaration | SlimeClassExpression;

export interface SlimeBaseClass extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseClass {
}

export interface SlimeClassBody extends Omit<SlimeBaseNode, "type">, SlimeJavascriptClassBody {
}

export interface SlimeMethodDefinition extends Omit<SlimeBaseNode, "type">, SlimeJavascriptMethodDefinition {
}

export interface SlimeMaybeNamedClassDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptMaybeNamedClassDeclaration {
}

export interface SlimeClassDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptClassDeclaration {
}

export interface SlimeClassExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptClassExpression {
}

export interface SlimeMetaProperty extends Omit<SlimeBaseNode, "type">, SlimeJavascriptMetaProperty {
}

export type SlimeModuleDeclaration =
    | SlimeImportDeclaration
    | SlimeExportNamedDeclaration
    | SlimeExportDefaultDeclaration
    | SlimeExportAllDeclaration;

export interface SlimeBaseModuleDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseModuleDeclaration {
}

export type SlimeModuleSpecifier =
    SlimeImportSpecifier
    | SlimeImportDefaultSpecifier
    | SlimeImportNamespaceSpecifier
    | SlimeExportSpecifier;

export interface SlimeBaseModuleSpecifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptBaseModuleSpecifier {
}

export interface SlimeImportDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportDeclaration {
}

export interface SlimeImportSpecifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportSpecifier {
}

export interface SlimeImportExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportExpression {
}

export interface SlimeImportDefaultSpecifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportDefaultSpecifier {
}

export interface SlimeImportNamespaceSpecifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptImportNamespaceSpecifier {
}

export interface SlimeExportNamedDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExportNamedDeclaration {
}

export interface SlimeExportSpecifier extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExportSpecifier {
}

export interface SlimeExportDefaultDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExportDefaultDeclaration {
}

export interface SlimeExportAllDeclaration extends Omit<SlimeBaseNode, "type">, SlimeJavascriptExportAllDeclaration {
}

export interface SlimeAwaitExpression extends Omit<SlimeBaseNode, "type">, SlimeJavascriptAwaitExpression {
}
