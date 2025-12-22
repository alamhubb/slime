import type * as ESTree from "estree";
import {
    SlimeAstTypeName
} from "./SlimeAstTypeName.ts";


import type { SubhutiSourceLocation } from "subhuti";
import {
    SlimeJavascriptArrayExpression,
    SlimeJavascriptArrayPattern,
    SlimeJavascriptArrowFunctionExpression,
    SlimeJavascriptArrowToken,
    SlimeJavascriptAssignmentExpression,
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
    SlimeJavascriptBinaryExpression,
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
    SlimeJavascriptLogicalExpression,
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
    SlimeJavascriptUnaryExpression,
    SlimeJavascriptUnaryOperatorToken,
    SlimeJavascriptUpdateExpression,
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
import {
    SlimeJavascriptAssignmentOperatorTokenTypes,
    SlimeJavascriptBinaryOperatorTokenTypes,
    SlimeJavascriptLogicalOperatorTokenTypes,
    SlimeJavascriptTokenType,
    SlimeJavascriptUnaryOperatorTokenTypes,
    SlimeJavascriptUpdateOperatorTokenTypes
} from "slime-token";
import {SlimeJavascriptAstTypeName} from "./deprecated/SlimeJavascript/SlimeJavascriptAstTypeName.ts";

/**
 * 辅助类型：排除 ESTree 类型中与 Slime 冲突的属性
 * - loc: 使用 SubhutiSourceLocation 替代 SourceLocation
 * - leadingComments/trailingComments: 使用 SlimeComment[] 替代 Comment[]
 * - K: 可选的额外排除属性
 */
type SlimeExtends<T, K extends keyof any = never> = Omit<T, 'loc' | 'leadingComments' | 'trailingComments' | K>

export interface SlimeBaseNodeWithoutComments extends SlimeJavascriptBaseNodeWithoutComments {
    // Every leaf interface Slimethat extends ESTree.that, SlimeBaseNode must specify a type property.
    // The type property should be a string literal. For example, Identifier
    // has: `type: "Identifier"`
    type: string;
    loc?: SubhutiSourceLocation | null | undefined;
    range?: [number, number] | undefined;
}

export interface SlimeBaseNode extends SlimeJavascriptBaseNode {
    leadingComments?: SlimeComment[] | undefined;
    trailingComments?: SlimeComment[] | undefined;
}

// ============================================
// Token 节点基础类型
// ============================================

/**
 * Token 节点基础类型
 * 所有 token 节点都继承此类型，包含 value 和位置信息
 */
export interface SlimeTokenNode extends SlimeJavascriptTokenNode {
    /** Token 原始值 */
    value: string;
}

// ============================================
// 变量声明关键字 Token
// ============================================

export interface SlimeVarToken extends SlimeJavascriptVarToken {
    type: typeof SlimeJavascriptTokenType.Var;
    value: "var";
}

export interface SlimeLetToken extends SlimeJavascriptLetToken {
    type: typeof SlimeJavascriptTokenType.Let;
    value: "let";
}

export interface SlimeConstToken extends SlimeJavascriptConstToken {
    type: typeof SlimeJavascriptTokenType.Const;
    value: "const";
}

/** 变量声明关键字 Token 联合类型 */
export type SlimeVariableDeclarationKindToken = SlimeVarToken | SlimeLetToken | SlimeConstToken;

// ============================================
// 赋值运算符 Token
// ============================================

export interface SlimeAssignToken extends SlimeJavascriptAssignToken {
    type: typeof SlimeJavascriptTokenType.Assign;
    value: "=";
}

// ============================================
// 标点符号 Token
// ============================================

export interface SlimeSemicolonToken extends SlimeJavascriptSemicolonToken {
    type: typeof SlimeJavascriptTokenType.Semicolon;
    value: ";";
}

export interface SlimeLBraceToken extends SlimeJavascriptLBraceToken {
    type: typeof SlimeJavascriptTokenType.LBrace;
    value: "{";
}

export interface SlimeRBraceToken extends SlimeJavascriptRBraceToken {
    type: typeof SlimeJavascriptTokenType.RBrace;
    value: "}";
}

export interface SlimeLBracketToken extends SlimeJavascriptLBracketToken {
    type: typeof SlimeJavascriptTokenType.LBracket;
    value: "[";
}

export interface SlimeRBracketToken extends SlimeJavascriptRBracketToken {
    type: typeof SlimeJavascriptTokenType.RBracket;
    value: "]";
}

export interface SlimeLParenToken extends SlimeJavascriptLParenToken {
    type: typeof SlimeJavascriptTokenType.LParen;
    value: "(";
}

export interface SlimeRParenToken extends SlimeJavascriptRParenToken {
    type: typeof SlimeJavascriptTokenType.RParen;
    value: ")";
}

export interface SlimeCommaToken extends SlimeJavascriptCommaToken {
    type: typeof SlimeJavascriptTokenType.Comma;
    value: ",";
}

export interface SlimeColonToken extends SlimeJavascriptColonToken {
    type: typeof SlimeJavascriptTokenType.Colon;
    value: ":";
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
    type: typeof SlimeJavascriptTokenType.Function;
    value: "function";
}

export interface SlimeAsyncToken extends SlimeJavascriptAsyncToken {
    type: typeof SlimeJavascriptTokenType.Async;
    value: "async";
}

export interface SlimeAsteriskToken extends SlimeJavascriptAsteriskToken {
    type: typeof SlimeJavascriptTokenType.Asterisk;
    value: "*";
}

export interface SlimeArrowToken extends SlimeJavascriptArrowToken {
    type: typeof SlimeJavascriptTokenType.Arrow;
    value: "=>";
}

// 控制流关键字
export interface SlimeIfToken extends SlimeJavascriptIfToken {
    type: typeof SlimeJavascriptTokenType.If;
    value: "if";
}

export interface SlimeElseToken extends SlimeJavascriptElseToken {
    type: typeof SlimeJavascriptTokenType.Else;
    value: "else";
}

export interface SlimeForToken extends SlimeJavascriptForToken {
    type: typeof SlimeJavascriptTokenType.For;
    value: "for";
}

export interface SlimeWhileToken extends SlimeJavascriptWhileToken {
    type: typeof SlimeJavascriptTokenType.While;
    value: "while";
}

export interface SlimeDoToken extends SlimeJavascriptDoToken {
    type: typeof SlimeJavascriptTokenType.Do;
    value: "do";
}

export interface SlimeInToken extends SlimeJavascriptInToken {
    type: typeof SlimeJavascriptTokenType.In;
    value: "in";
}

export interface SlimeOfToken extends SlimeJavascriptOfToken {
    type: typeof SlimeJavascriptTokenType.Of;
    value: "of";
}

export interface SlimeSwitchToken extends SlimeJavascriptSwitchToken {
    type: typeof SlimeJavascriptTokenType.Switch;
    value: "switch";
}

export interface SlimeCaseToken extends SlimeJavascriptCaseToken {
    type: typeof SlimeJavascriptTokenType.Case;
    value: "case";
}

export interface SlimeDefaultToken extends SlimeJavascriptDefaultToken {
    type: typeof SlimeJavascriptTokenType.Default;
    value: "default";
}

export interface SlimeBreakToken extends SlimeJavascriptBreakToken {
    type: typeof SlimeJavascriptTokenType.Break;
    value: "break";
}

export interface SlimeContinueToken extends SlimeJavascriptContinueToken {
    type: typeof SlimeJavascriptTokenType.Continue;
    value: "continue";
}

export interface SlimeReturnToken extends SlimeJavascriptReturnToken {
    type: typeof SlimeJavascriptTokenType.Return;
    value: "return";
}

export interface SlimeThrowToken extends SlimeJavascriptThrowToken {
    type: typeof SlimeJavascriptTokenType.Throw;
    value: "throw";
}

export interface SlimeTryToken extends SlimeJavascriptTryToken {
    type: typeof SlimeJavascriptTokenType.Try;
    value: "try";
}

export interface SlimeCatchToken extends SlimeJavascriptCatchToken {
    type: typeof SlimeJavascriptTokenType.Catch;
    value: "catch";
}

export interface SlimeFinallyToken extends SlimeJavascriptFinallyToken {
    type: typeof SlimeJavascriptTokenType.Finally;
    value: "finally";
}

export interface SlimeWithToken extends SlimeJavascriptWithToken {
    type: typeof SlimeJavascriptTokenType.With;
    value: "with";
}

export interface SlimeDebuggerToken extends SlimeJavascriptDebuggerToken {
    type: typeof SlimeJavascriptTokenType.Debugger;
    value: "debugger";
}

export interface SlimeAwaitToken extends SlimeJavascriptAwaitToken {
    type: typeof SlimeJavascriptTokenType.Await;
    value: "await";
}

export interface SlimeYieldToken extends SlimeJavascriptYieldToken {
    type: typeof SlimeJavascriptTokenType.Yield;
    value: "yield";
}

// 类相关关键字
export interface SlimeClassToken extends SlimeJavascriptClassToken {
    type: typeof SlimeJavascriptTokenType.Class;
    value: "class";
}

export interface SlimeExtendsToken extends SlimeJavascriptExtendsToken {
    type: typeof SlimeJavascriptTokenType.Extends;
    value: "extends";
}

export interface SlimeStaticToken extends SlimeJavascriptStaticToken {
    type: typeof SlimeJavascriptTokenType.Static;
    value: "static";
}

export interface SlimeGetToken extends SlimeJavascriptGetToken {
    type: typeof SlimeJavascriptTokenType.Get;
    value: "get";
}

export interface SlimeSetToken extends SlimeJavascriptSetToken {
    type: typeof SlimeJavascriptTokenType.Set;
    value: "set";
}

// 操作符关键字
export interface SlimeNewToken extends SlimeJavascriptNewToken {
    type: typeof SlimeJavascriptTokenType.New;
    value: "new";
}

export interface SlimeTypeofToken extends SlimeJavascriptTypeofToken {
    type: typeof SlimeJavascriptTokenType.Typeof;
    value: "typeof";
}

export interface SlimeVoidToken extends SlimeJavascriptVoidToken {
    type: typeof SlimeJavascriptTokenType.Void;
    value: "void";
}

export interface SlimeDeleteToken extends SlimeJavascriptDeleteToken {
    type: typeof SlimeJavascriptTokenType.Delete;
    value: "delete";
}

export interface SlimeInstanceofToken extends SlimeJavascriptInstanceofToken {
    type: typeof SlimeJavascriptTokenType.Instanceof;
    value: "instanceof";
}

// 模块关键字
export interface SlimeImportToken extends SlimeJavascriptImportToken {
    type: typeof SlimeJavascriptTokenType.Import;
    value: "import";
}

export interface SlimeExportToken extends SlimeJavascriptExportToken {
    type: typeof SlimeJavascriptTokenType.Export;
    value: "export";
}

export interface SlimeFromToken extends SlimeJavascriptFromToken {
    type: typeof SlimeJavascriptTokenType.From;
    value: "from";
}

export interface SlimeAsToken extends SlimeJavascriptAsToken {
    type: typeof SlimeJavascriptTokenType.As;
    value: "as";
}

// 展开运算符 (Ellipsis)
export interface SlimeEllipsisToken extends SlimeJavascriptEllipsisToken {
    type: typeof SlimeJavascriptTokenType.Ellipsis;
    value: "...";
}

// 点号
export interface SlimeDotToken extends SlimeJavascriptDotToken {
    type: typeof SlimeJavascriptTokenType.Dot;
    value: ".";
}

// 可选链
export interface SlimeOptionalChainingToken extends SlimeJavascriptOptionalChainingToken {
    type: typeof SlimeJavascriptTokenType.OptionalChaining;
    value: "?.";
}

// 问号
export interface SlimeQuestionToken extends SlimeJavascriptQuestionToken {
    type: typeof SlimeJavascriptTokenType.Question;
    value: "?";
}

// ============================================
// 运算符 Token（用于表达式）
// ============================================

/** 二元运算符 Token */
export interface SlimeBinaryOperatorToken extends SlimeJavascriptBinaryOperatorToken {
    type: typeof SlimeJavascriptBinaryOperatorTokenTypes[keyof typeof SlimeJavascriptBinaryOperatorTokenTypes];
    value: SlimeBinaryOperator;
}

/** 一元运算符 Token */
export interface SlimeUnaryOperatorToken extends SlimeJavascriptUnaryOperatorToken {
    type: typeof SlimeJavascriptUnaryOperatorTokenTypes[keyof typeof SlimeJavascriptUnaryOperatorTokenTypes];
    value: SlimeUnaryOperator;
}

/** 逻辑运算符 Token */
export interface SlimeLogicalOperatorToken extends SlimeJavascriptLogicalOperatorToken {
    type: typeof SlimeJavascriptLogicalOperatorTokenTypes[keyof typeof SlimeJavascriptLogicalOperatorTokenTypes];
    value: SlimeLogicalOperator;
}

/** 赋值运算符 Token */
export interface SlimeAssignmentOperatorToken extends SlimeJavascriptAssignmentOperatorToken {
    type: typeof SlimeJavascriptAssignmentOperatorTokenTypes[keyof typeof SlimeJavascriptAssignmentOperatorTokenTypes];
    value: SlimeAssignmentOperator;
}

/** 更新运算符 Token */
export interface SlimeUpdateOperatorToken extends SlimeJavascriptUpdateOperatorToken {
    type: typeof SlimeJavascriptUpdateOperatorTokenTypes[keyof typeof SlimeJavascriptUpdateOperatorTokenTypes];
    value: SlimeUpdateOperator;
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
    type: "Line" | "Block";
    value: string;
}

/** Program source type */
export const SlimeProgramSourceType = {
    Script: "script",
    Module: "module"
} as const;
export type SlimeProgramSourceType = typeof SlimeJavascriptProgramSourceType[keyof typeof SlimeJavascriptProgramSourceType];

export interface SlimeProgram extends SlimeJavascriptProgram {
    type: typeof SlimeJavascriptAstTypeName.Program;
    sourceType: SlimeProgramSourceType;
    body: Array<SlimeDirective | SlimeStatement | SlimeModuleDeclaration>;
    comments?: SlimeComment[] | undefined;
}

export interface SlimeDirective extends SlimeJavascriptDirective {
    type: typeof SlimeJavascriptAstTypeName.ExpressionStatement;
    expression: SlimeLiteral;
    directive: string;
}

export interface SlimeBaseFunction extends SlimeJavascriptBaseFunction {
    /** 函数参数列表（包装类型，每个参数可关联其后的逗号） */
    params: SlimeFunctionParam[];
    generator?: boolean | undefined;
    async?: boolean | undefined;
    /** function 关键字 Token */
    functionToken?: SlimeFunctionToken;
    /** async 关键字 Token */
    asyncToken?: SlimeAsyncToken;
    /** generator * Token */
    asteriskToken?: SlimeAsteriskToken;
    // The body is either BlockStatement or Expression because arrow functions
    // can have a body that's either. FunctionDeclarations and
    // FunctionExpressions have only BlockStatement bodies.
    body: SlimeBlockStatement | SlimeExpression;
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
    type: typeof SlimeJavascriptAstTypeName.EmptyStatement;
}

export interface SlimeBlockStatement extends SlimeJavascriptBlockStatement {
    type: typeof SlimeJavascriptAstTypeName.BlockStatement;
    body: SlimeStatement[];
    innerComments?: SlimeComment[] | undefined;
}

export interface SlimeStaticBlock extends SlimeJavascriptStaticBlock {
    type: typeof SlimeJavascriptAstTypeName.StaticBlock;
    body: SlimeStatement[];
}

export interface SlimeExpressionStatement extends SlimeJavascriptExpressionStatement {
    type: typeof SlimeJavascriptAstTypeName.ExpressionStatement;
    expression: SlimeExpression;
}

export interface SlimeIfStatement extends SlimeJavascriptIfStatement {
    type: typeof SlimeJavascriptAstTypeName.IfStatement;
    test: SlimeExpression;
    consequent: SlimeStatement;
    alternate?: SlimeStatement | null | undefined;
    /** if 关键字 Token */
    ifToken?: SlimeIfToken;
    /** else 关键字 Token */
    elseToken?: SlimeElseToken;
}

export interface SlimeLabeledStatement extends SlimeJavascriptLabeledStatement {
    type: typeof SlimeJavascriptAstTypeName.LabeledStatement;
    label: SlimeIdentifier;
    body: SlimeStatement;
}

export interface SlimeBreakStatement extends SlimeJavascriptBreakStatement {
    type: typeof SlimeJavascriptAstTypeName.BreakStatement;
    label?: SlimeIdentifier | null | undefined;
    /** break 关键字 Token */
    breakToken?: SlimeBreakToken;
}

export interface SlimeContinueStatement extends SlimeJavascriptContinueStatement {
    type: typeof SlimeJavascriptAstTypeName.ContinueStatement;
    label?: SlimeIdentifier | null | undefined;
    /** continue 关键字 Token */
    continueToken?: SlimeContinueToken;
}

export interface SlimeWithStatement extends SlimeJavascriptWithStatement {
    type: typeof SlimeJavascriptAstTypeName.WithStatement;
    object: SlimeExpression;
    body: SlimeStatement;
    /** with 关键字 Token */
    withToken?: SlimeWithToken;
}

export interface SlimeSwitchStatement extends SlimeJavascriptSwitchStatement {
    type: typeof SlimeJavascriptAstTypeName.SwitchStatement;
    discriminant: SlimeExpression;
    cases: SlimeSwitchCase[];
    /** switch 关键字 Token */
    switchToken?: SlimeSwitchToken;
}

export interface SlimeReturnStatement extends SlimeJavascriptReturnStatement {
    type: typeof SlimeJavascriptAstTypeName.ReturnStatement;
    argument?: SlimeExpression | null | undefined;
    /** return 关键字 Token */
    returnToken?: SlimeReturnToken;
}

export interface SlimeThrowStatement extends SlimeJavascriptThrowStatement {
    type: typeof SlimeJavascriptAstTypeName.ThrowStatement;
    argument: SlimeExpression;
    /** throw 关键字 Token */
    throwToken?: SlimeThrowToken;
}

export interface SlimeTryStatement extends SlimeJavascriptTryStatement {
    type: typeof SlimeJavascriptAstTypeName.TryStatement;
    block: SlimeBlockStatement;
    handler?: SlimeCatchClause | null | undefined;
    finalizer?: SlimeBlockStatement | null | undefined;
    /** try 关键字 Token */
    tryToken?: SlimeTryToken;
    /** finally 关键字 Token */
    finallyToken?: SlimeFinallyToken;
}

export interface SlimeWhileStatement extends SlimeJavascriptWhileStatement {
    type: typeof SlimeJavascriptAstTypeName.WhileStatement;
    test: SlimeExpression;
    body: SlimeStatement;
    /** while 关键字 Token */
    whileToken?: SlimeWhileToken;
}

export interface SlimeDoWhileStatement extends SlimeJavascriptDoWhileStatement {
    type: typeof SlimeJavascriptAstTypeName.DoWhileStatement;
    body: SlimeStatement;
    test: SlimeExpression;
    /** do 关键字 Token */
    doToken?: SlimeDoToken;
    /** while 关键字 Token */
    whileToken?: SlimeWhileToken;
}

export interface SlimeForStatement extends SlimeJavascriptForStatement {
    type: typeof SlimeJavascriptAstTypeName.ForStatement;
    init?: SlimeVariableDeclaration | SlimeExpression | null | undefined;
    test?: SlimeExpression | null | undefined;
    update?: SlimeExpression | null | undefined;
    body: SlimeStatement;
    /** for 关键字 Token */
    forToken?: SlimeForToken;
    /** 第一个分号 */
    semicolon1Token?: SlimeSemicolonToken;
    /** 第二个分号 */
    semicolon2Token?: SlimeSemicolonToken;
}

export interface SlimeBaseForXStatement extends SlimeJavascriptBaseForXStatement {
    left: SlimeVariableDeclaration | SlimePattern;
    right: SlimeExpression;
    body: SlimeStatement;
    /** for 关键字 Token */
    forToken?: SlimeForToken;
}

export interface SlimeForInStatement extends SlimeJavascriptForInStatement {
    type: typeof SlimeJavascriptAstTypeName.ForInStatement;
    /** in 关键字 Token */
    inToken?: SlimeInToken;
}

export interface SlimeDebuggerStatement extends SlimeJavascriptDebuggerStatement {
    type: typeof SlimeJavascriptAstTypeName.DebuggerStatement;
    /** debugger 关键字 Token */
    debuggerToken?: SlimeDebuggerToken;
}

export type SlimeDeclaration = SlimeFunctionDeclaration | SlimeVariableDeclaration | SlimeClassDeclaration;

export interface SlimeBaseDeclaration extends SlimeJavascriptBaseDeclaration {
}

export interface SlimeMaybeNamedFunctionDeclaration extends SlimeJavascriptMaybeNamedFunctionDeclaration {
    type: typeof SlimeJavascriptAstTypeName.FunctionDeclaration;
    /** It is null when a function declaration is a part of the `export default function` statement */
    id: SlimeIdentifier | null;
    body: SlimeBlockStatement;
}

export interface SlimeFunctionDeclaration extends SlimeJavascriptFunctionDeclaration {
    id: SlimeIdentifier;
}

export interface SlimeVariableDeclaration extends SlimeJavascriptVariableDeclaration {
    type: typeof SlimeJavascriptAstTypeName.VariableDeclaration;
    declarations: SlimeVariableDeclarator[];
    /** 变量声明关键字 Token (var/let/const) */
    kind: SlimeVariableDeclarationKindToken;
}

export interface SlimeVariableDeclarator extends SlimeJavascriptVariableDeclarator {
    type: typeof SlimeJavascriptAstTypeName.VariableDeclarator;
    id: SlimePattern;
    init?: SlimeExpression | null | undefined;
    /** 赋值符号 Token，包含位置信息 */
    assignToken?: SlimeAssignToken;
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
    type: typeof SlimeJavascriptAstTypeName.ChainExpression;
    expression: SlimeChainElement;
}

export interface SlimeThisExpression extends SlimeJavascriptThisExpression {
    type: typeof SlimeJavascriptAstTypeName.ThisExpression;
}

export interface SlimeArrayExpression extends SlimeJavascriptArrayExpression {
    type: typeof SlimeJavascriptAstTypeName.ArrayExpression;
    /** 数组元素列表（包装类型，每个元素可关联其后的逗号） */
    elements: Array<SlimeArrayElement>;
}

export interface SlimeObjectExpression extends SlimeJavascriptObjectExpression {
    type: typeof SlimeJavascriptAstTypeName.ObjectExpression;
    /** 对象属性列表（包装类型，每个属性可关联其后的逗号） */
    properties: Array<SlimeObjectPropertyItem>;
}

export interface SlimePrivateIdentifier extends SlimeJavascriptPrivateIdentifier {
    type: typeof SlimeJavascriptAstTypeName.PrivateIdentifier;
    name: string;
}

export interface SlimeProperty extends SlimeJavascriptProperty {
    type: typeof SlimeJavascriptAstTypeName.Property;
    key: SlimeExpression | SlimePrivateIdentifier;
    value: SlimeExpression | SlimePattern; // Could be an AssignmentProperty
    kind: "init" | "get" | "set";
    method: boolean;
    /** get 关键字 Token */
    getToken?: SlimeGetToken;
    /** set 关键字 Token */
    setToken?: SlimeSetToken;
    /** async 关键字 Token */
    asyncToken?: SlimeAsyncToken;
    /** * Token (generator) */
    asteriskToken?: SlimeAsteriskToken;
    shorthand: boolean;
    computed: boolean;
}

export interface SlimePropertyDefinition extends SlimeJavascriptPropertyDefinition {
    type: typeof SlimeJavascriptAstTypeName.PropertyDefinition;
    key: SlimeExpression | SlimePrivateIdentifier;
    value?: SlimeExpression | null | undefined;
    computed: boolean;
    static: boolean;
}

export interface SlimeFunctionExpression extends SlimeJavascriptFunctionExpression {
    id?: SlimeIdentifier | null | undefined;
    type: typeof SlimeJavascriptAstTypeName.FunctionExpression;
    body: SlimeBlockStatement;
}

export interface SlimeSequenceExpression extends SlimeJavascriptSequenceExpression {
    type: typeof SlimeJavascriptAstTypeName.SequenceExpression;
    expressions: SlimeExpression[];
}

export interface SlimeUnaryExpression extends SlimeJavascriptUnaryExpression {
    type: typeof SlimeJavascriptAstTypeName.UnaryExpression;
    /** 运算符 Token */
    operator: SlimeUnaryOperatorToken;
    prefix: true;
    argument: SlimeExpression;
}

export interface SlimeBinaryExpression extends SlimeJavascriptBinaryExpression {
    type: typeof SlimeJavascriptAstTypeName.BinaryExpression;
    /** 运算符 Token */
    operator: SlimeBinaryOperatorToken;
    left: SlimeExpression | SlimePrivateIdentifier;
    right: SlimeExpression;
}

export interface SlimeAssignmentExpression extends SlimeJavascriptAssignmentExpression {
    type: typeof SlimeJavascriptAstTypeName.AssignmentExpression;
    /** 运算符 Token */
    operator: SlimeAssignmentOperatorToken;
    left: SlimePattern | SlimeMemberExpression;
    right: SlimeExpression;
}

export interface SlimeUpdateExpression extends SlimeJavascriptUpdateExpression {
    type: typeof SlimeJavascriptAstTypeName.UpdateExpression;
    /** 运算符 Token */
    operator: SlimeUpdateOperatorToken;
    argument: SlimeExpression;
    prefix: boolean;
}

export interface SlimeLogicalExpression extends SlimeJavascriptLogicalExpression {
    type: typeof SlimeJavascriptAstTypeName.LogicalExpression;
    /** 运算符 Token */
    operator: SlimeLogicalOperatorToken;
    left: SlimeExpression;
    right: SlimeExpression;
}

export interface SlimeConditionalExpression extends SlimeJavascriptConditionalExpression {
    type: typeof SlimeJavascriptAstTypeName.ConditionalExpression;
    test: SlimeExpression;
    alternate: SlimeExpression;
    consequent: SlimeExpression;
    /** ? Token */
    questionToken?: SlimeQuestionToken;
}

export interface SlimeBaseCallExpression extends SlimeJavascriptBaseCallExpression {
    callee: SlimeExpression | SlimeSuper;
    /** 调用参数列表（包装类型，每个参数可关联其后的逗号） */
    arguments: Array<SlimeCallArgument>;
}

export type SlimeCallExpression = SlimeSimpleCallExpression | SlimeNewExpression;

export interface SlimeSimpleCallExpression extends SlimeJavascriptSimpleCallExpression {
    type: typeof SlimeJavascriptAstTypeName.CallExpression;
    optional: boolean;
}

export interface SlimeNewExpression extends SlimeJavascriptNewExpression {
    type: typeof SlimeJavascriptAstTypeName.NewExpression;
    /** new 关键字 Token */
    newToken?: SlimeNewToken;
}

export interface SlimeMemberExpression extends SlimeJavascriptMemberExpression {
    type: typeof SlimeJavascriptAstTypeName.MemberExpression;
    object: SlimeExpression | SlimeSuper;
    property: SlimeExpression | SlimePrivateIdentifier;
    computed: boolean;
    optional: boolean;
    /** 点号 Token (非计算属性) */
    dotToken?: SlimeDotToken;
    /** 可选链 Token ?. */
    optionalChainingToken?: SlimeOptionalChainingToken;
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
    type: typeof SlimeJavascriptAstTypeName.SwitchCase;
    test?: SlimeExpression | null | undefined;
    consequent: SlimeStatement[];
    /** case 关键字 Token (如果是 case) */
    caseToken?: SlimeCaseToken;
    /** default 关键字 Token (如果是 default) */
    defaultToken?: SlimeDefaultToken;
}

export interface SlimeCatchClause extends SlimeJavascriptCatchClause {
    type: typeof SlimeJavascriptAstTypeName.CatchClause;
    param: SlimePattern | null;
    body: SlimeBlockStatement;
    /** catch 关键字 Token */
    catchToken?: SlimeCatchToken;
}

export interface SlimeIdentifier extends SlimeJavascriptIdentifier {
    type: typeof SlimeJavascriptAstTypeName.Identifier;
    name: string;
    /** [TypeScript] 类型注解 */
    typeAnnotation?: SlimeTSTypeAnnotation;
}

// ============================================
// TypeScript 类型节点
// ============================================

/** [TypeScript] 类型注解节点 */
export interface SlimeTSTypeAnnotation extends SlimeJavascriptTSTypeAnnotation {
    type: typeof SlimeJavascriptAstTypeName.TSTypeAnnotation;
    colonToken?: SlimeColonToken;
    typeAnnotation: SlimeTSType;
}

/** [TypeScript] 类型联合 */
export type SlimeTSType = SlimeTSNumberKeyword;

/** [TypeScript] number 类型关键字 */
export interface SlimeTSNumberKeyword extends SlimeJavascriptTSNumberKeyword {
    type: typeof SlimeJavascriptAstTypeName.TSNumberKeyword;
}

export type SlimeLiteral = SlimeSimpleLiteral | SlimeRegExpLiteral | SlimeBigIntLiteral;

export interface SlimeSimpleLiteral extends SlimeJavascriptSimpleLiteral {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value: string | boolean | number | null;
    raw?: string | undefined;
}

export interface SlimeRegExpLiteral extends SlimeJavascriptRegExpLiteral {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value?: RegExp | null | undefined;
    regex: {
        pattern: string;
        flags: string;
    };
    raw?: string | undefined;
}

export interface SlimeBigIntLiteral extends SlimeJavascriptBigIntLiteral {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value?: bigint | null | undefined;
    bigint: string;
    raw?: string | undefined;
}

/** String literal - 字符串字面量 */
export interface SlimeStringLiteral extends SlimeJavascriptStringLiteral {
    value: string;
}

/** Numeric literal - 数字字面量 */
export interface SlimeNumericLiteral extends SlimeJavascriptNumericLiteral {
    value: number;
}

/** Boolean literal - 布尔字面量 */
export interface SlimeBooleanLiteral extends SlimeJavascriptBooleanLiteral {
    value: boolean;
}

/** Null literal - 空值字面量 */
export interface SlimeNullLiteral extends SlimeJavascriptNullLiteral {
    value: null;
}

export type SlimeUnaryOperator = "-" | "+" | "!" | "~" | "typeof" | "void" | "delete";

export type SlimeBinaryOperator =
    | "=="
    | "!="
    | "==="
    | "!=="
    | "<"
    | "<="
    | ">"
    | ">="
    | "<<"
    | ">>"
    | ">>>"
    | "+"
    | "-"
    | "*"
    | "/"
    | "%"
    | "**"
    | "|"
    | "^"
    | "&"
    | "in"
    | "instanceof";

export type SlimeLogicalOperator = "||" | "&&" | "??";

export type SlimeAssignmentOperator =
    | "="
    | "+="
    | "-="
    | "*="
    | "/="
    | "%="
    | "**="
    | "<<="
    | ">>="
    | ">>>="
    | "|="
    | "^="
    | "&="
    | "||="
    | "&&="
    | "??=";

export type SlimeUpdateOperator = "++" | "--";

export interface SlimeForOfStatement extends SlimeJavascriptForOfStatement {
    type: typeof SlimeJavascriptAstTypeName.ForOfStatement;
    await: boolean;
    /** of 关键字 Token */
    ofToken?: SlimeOfToken;
    /** await 关键字 Token (for await...of) */
    awaitToken?: SlimeAwaitToken;
}

export interface SlimeSuper extends SlimeJavascriptSuper {
    type: typeof SlimeJavascriptAstTypeName.Super;
}

export interface SlimeSpreadElement extends SlimeJavascriptSpreadElement {
    type: typeof SlimeJavascriptAstTypeName.SpreadElement;
    argument: SlimeExpression;
    /** ... 展开运算符 Token */
    ellipsisToken?: SlimeEllipsisToken;
}

export interface SlimeArrowFunctionExpression extends SlimeJavascriptArrowFunctionExpression {
    type: typeof SlimeJavascriptAstTypeName.ArrowFunctionExpression;
    expression: boolean;
    body: SlimeBlockStatement | SlimeExpression;
    /** 箭头 Token => */
    arrowToken?: SlimeArrowToken;
}

export interface SlimeYieldExpression extends SlimeJavascriptYieldExpression {
    type: typeof SlimeJavascriptAstTypeName.YieldExpression;
    argument?: SlimeExpression | null | undefined;
    delegate: boolean;
    /** yield 关键字 Token */
    yieldToken?: SlimeYieldToken;
    /** * Token (delegate yield) */
    asteriskToken?: SlimeAsteriskToken;
}

export interface SlimeTemplateLiteral extends SlimeJavascriptTemplateLiteral {
    type: typeof SlimeJavascriptAstTypeName.TemplateLiteral;
    quasis: SlimeTemplateElement[];
    expressions: SlimeExpression[];
}

export interface SlimeTaggedTemplateExpression extends SlimeJavascriptTaggedTemplateExpression {
    type: typeof SlimeJavascriptAstTypeName.TaggedTemplateExpression;
    tag: SlimeExpression;
    quasi: SlimeTemplateLiteral;
}

export interface SlimeTemplateElement extends SlimeJavascriptTemplateElement {
    type: typeof SlimeJavascriptAstTypeName.TemplateElement;
    tail: boolean;
    value: {
        /** It is null when the template literal is tagged and the text has an invalid escape (e.g. - tag`\unicode and \u{55}`) */
        cooked?: string | null | undefined;
        raw: string;
    };
}

export interface SlimeAssignmentProperty extends SlimeJavascriptAssignmentProperty {
    value: SlimePattern;
    kind: "init";
    method: boolean; // false
}

export interface SlimeObjectPattern extends SlimeJavascriptObjectPattern {
    type: typeof SlimeJavascriptAstTypeName.ObjectPattern;
    /** 解构属性列表（包装类型，每个属性可关联其后的逗号） */
    properties: Array<SlimeObjectPatternProperty>;
}

export interface SlimeArrayPattern extends SlimeJavascriptArrayPattern {
    type: typeof SlimeJavascriptAstTypeName.ArrayPattern;
    /** 解构元素列表（包装类型，每个元素可关联其后的逗号） */
    elements: Array<SlimeArrayPatternElement>;
}

export interface SlimeRestElement extends SlimeJavascriptRestElement {
    type: typeof SlimeJavascriptAstTypeName.RestElement;
    argument: SlimePattern;
    /** ... 展开运算符 Token */
    ellipsisToken?: SlimeEllipsisToken;
}

export interface SlimeAssignmentPattern extends SlimeJavascriptAssignmentPattern {
    type: typeof SlimeJavascriptAstTypeName.AssignmentPattern;
    left: SlimePattern;
    right: SlimeExpression;
}

export type SlimeClass = SlimeClassDeclaration | SlimeClassExpression;

export interface SlimeBaseClass extends SlimeJavascriptBaseClass {
    superClass?: SlimeExpression | null | undefined;
    body: SlimeClassBody;
    /** class 关键字 Token */
    classToken?: SlimeClassToken;
    /** extends 关键字 Token */
    extendsToken?: SlimeExtendsToken;
}

export interface SlimeClassBody extends SlimeJavascriptClassBody {
    type: typeof SlimeJavascriptAstTypeName.ClassBody;
    body: Array<SlimeMethodDefinition | SlimePropertyDefinition | SlimeStaticBlock>;
}

export interface SlimeMethodDefinition extends SlimeJavascriptMethodDefinition {
    type: typeof SlimeJavascriptAstTypeName.MethodDefinition;
    key: SlimeExpression | SlimePrivateIdentifier;
    value: SlimeFunctionExpression;
    kind: "constructor" | "method" | "get" | "set";
    computed: boolean;
    static: boolean;
    /** static 关键字 Token */
    staticToken?: SlimeStaticToken;
    /** get 关键字 Token */
    getToken?: SlimeGetToken;
    /** set 关键字 Token */
    setToken?: SlimeSetToken;
    /** async 关键字 Token */
    asyncToken?: SlimeAsyncToken;
    /** generator * Token */
    asteriskToken?: SlimeAsteriskToken;
}

export interface SlimeMaybeNamedClassDeclaration extends SlimeJavascriptMaybeNamedClassDeclaration {
    type: typeof SlimeJavascriptAstTypeName.ClassDeclaration;
    /** It is null when a class declaration is a part of the `export default class` statement */
    id: SlimeIdentifier | null;
}

export interface SlimeClassDeclaration extends SlimeJavascriptClassDeclaration {
    id: SlimeIdentifier;
}

export interface SlimeClassExpression extends SlimeJavascriptClassExpression {
    type: typeof SlimeJavascriptAstTypeName.ClassExpression;
    id?: SlimeIdentifier | null | undefined;
}

export interface SlimeMetaProperty extends SlimeJavascriptMetaProperty {
    type: typeof SlimeJavascriptAstTypeName.MetaProperty;
    meta: SlimeIdentifier;
    property: SlimeIdentifier;
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
    local: SlimeIdentifier;
}

export interface SlimeImportDeclaration extends SlimeJavascriptImportDeclaration {
    type: typeof SlimeJavascriptAstTypeName.ImportDeclaration;
    /** import specifiers 列表（包装类型，每个 specifier 可关联其后的逗号） */
    specifiers: Array<SlimeImportSpecifierItem>;
    source: SlimeLiteral;
    /** import 关键字 Token */
    importToken?: SlimeImportToken;
    /** from 关键字 Token */
    fromToken?: SlimeFromToken;
}

export interface SlimeImportSpecifier extends SlimeJavascriptImportSpecifier {
    type: typeof SlimeJavascriptAstTypeName.ImportSpecifier;
    imported: SlimeIdentifier | SlimeLiteral;
    /** as 关键字 Token */
    asToken?: SlimeAsToken;
}

export interface SlimeImportExpression extends SlimeJavascriptImportExpression {
    type: typeof SlimeJavascriptAstTypeName.ImportExpression;
    source: SlimeExpression;
    /** import 关键字 Token */
    importToken?: SlimeImportToken;
}

export interface SlimeImportDefaultSpecifier extends SlimeJavascriptImportDefaultSpecifier {
    type: typeof SlimeJavascriptAstTypeName.ImportDefaultSpecifier;
}

export interface SlimeImportNamespaceSpecifier extends SlimeJavascriptImportNamespaceSpecifier {
    type: typeof SlimeJavascriptAstTypeName.ImportNamespaceSpecifier;
    /** * Token */
    asteriskToken?: SlimeAsteriskToken;
    /** as 关键字 Token */
    asToken?: SlimeAsToken;
}

export interface SlimeExportNamedDeclaration extends SlimeJavascriptExportNamedDeclaration {
    type: typeof SlimeJavascriptAstTypeName.ExportNamedDeclaration;
    declaration?: SlimeDeclaration | null | undefined;
    /** export specifiers 列表（包装类型，每个 specifier 可关联其后的逗号） */
    specifiers: SlimeExportSpecifierItem[];
    source?: SlimeLiteral | null | undefined;
    /** export 关键字 Token */
    exportToken?: SlimeExportToken;
    /** from 关键字 Token */
    fromToken?: SlimeFromToken;
}

export interface SlimeExportSpecifier extends SlimeJavascriptExportSpecifier {
    type: typeof SlimeJavascriptAstTypeName.ExportSpecifier;
    local: SlimeIdentifier | SlimeLiteral;
    exported: SlimeIdentifier | SlimeLiteral;
    /** as 关键字 Token */
    asToken?: SlimeAsToken;
}

export interface SlimeExportDefaultDeclaration extends SlimeJavascriptExportDefaultDeclaration {
    type: typeof SlimeJavascriptAstTypeName.ExportDefaultDeclaration;
    declaration: SlimeMaybeNamedFunctionDeclaration | SlimeMaybeNamedClassDeclaration | SlimeExpression;
    /** export 关键字 Token */
    exportToken?: SlimeExportToken;
    /** default 关键字 Token */
    defaultToken?: SlimeDefaultToken;
}

export interface SlimeExportAllDeclaration extends SlimeJavascriptExportAllDeclaration {
    type: typeof SlimeJavascriptAstTypeName.ExportAllDeclaration;
    exported: SlimeIdentifier | SlimeLiteral | null;
    source: SlimeLiteral;
    /** export 关键字 Token */
    exportToken?: SlimeExportToken;
    /** * Token */
    asteriskToken?: SlimeAsteriskToken;
    /** as 关键字 Token */
    asToken?: SlimeAsToken;
    /** from 关键字 Token */
    fromToken?: SlimeFromToken;
}

export interface SlimeAwaitExpression extends SlimeJavascriptAwaitExpression {
    type: typeof SlimeJavascriptAstTypeName.AwaitExpression;
    argument: SlimeExpression;
    /** await 关键字 Token */
    awaitToken?: SlimeAwaitToken;
}
