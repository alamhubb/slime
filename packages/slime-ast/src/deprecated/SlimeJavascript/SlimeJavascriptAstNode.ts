import type * as ESTree from "estree";
import {
    SlimeJavascriptAstTypeName
} from "./SlimeJavascriptAstTypeName.ts";

import {
    SlimeJavascriptTokenType,
    SlimeJavascriptUpdateOperatorTokenTypes,
    SlimeJavascriptUnaryOperatorTokenTypes,
    SlimeJavascriptBinaryOperatorTokenTypes,
    SlimeJavascriptLogicalOperatorTokenTypes,
    SlimeJavascriptAssignmentOperatorTokenTypes,
} from "slime-token";
import type { SubhutiSourceLocation } from "subhuti";

/**
 * 辅助类型：排除 ESTree 类型中与 SlimeJavascript 冲突的属性
 * - loc: 使用 SubhutiSourceLocation 替代 SourceLocation
 * - leadingComments/trailingComments: 使用 SlimeJavascriptComment[] 替代 Comment[]
 * - K: 可选的额外排除属性
 */
type SlimeJavascriptExtends<T, K extends keyof any = never> = Omit<T, 'loc' | 'leadingComments' | 'trailingComments' | K>

export interface SlimeJavascriptBaseNodeWithoutComments extends SlimeJavascriptExtends<ESTree.BaseNodeWithoutComments> {
    // Every leaf interface SlimeJavascriptthat extends ESTree.that, SlimeJavascriptBaseNode must specify a type property.
    // The type property should be a string literal. For example, Identifier
    // has: `type: "Identifier"`
    type: string;
    loc?: SubhutiSourceLocation | null | undefined;
    range?: [number, number] | undefined;
}

export interface SlimeJavascriptBaseNode extends SlimeJavascriptBaseNodeWithoutComments, SlimeJavascriptExtends<ESTree.BaseNode> {
    leadingComments?: SlimeJavascriptComment[] | undefined;
    trailingComments?: SlimeJavascriptComment[] | undefined;
}

// ============================================
// Token 节点基础类型
// ============================================

/**
 * Token 节点基础类型
 * 所有 token 节点都继承此类型，包含 value 和位置信息
 */
export interface SlimeJavascriptTokenNode extends SlimeJavascriptBaseNodeWithoutComments {
    /** Token 原始值 */
    value: string;
}

// ============================================
// 变量声明关键字 Token
// ============================================

export interface SlimeJavascriptVarToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Var;
    value: "var";
}

export interface SlimeJavascriptLetToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Let;
    value: "let";
}

export interface SlimeJavascriptConstToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Const;
    value: "const";
}

/** 变量声明关键字 Token 联合类型 */
export type SlimeJavascriptVariableDeclarationKindToken = SlimeJavascriptVarToken | SlimeJavascriptLetToken | SlimeJavascriptConstToken;

// ============================================
// 赋值运算符 Token
// ============================================

export interface SlimeJavascriptAssignToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Assign;
    value: "=";
}

// ============================================
// 标点符号 Token
// ============================================

export interface SlimeJavascriptSemicolonToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Semicolon;
    value: ";";
}

export interface SlimeJavascriptLBraceToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.LBrace;
    value: "{";
}

export interface SlimeJavascriptRBraceToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.RBrace;
    value: "}";
}

export interface SlimeJavascriptLBracketToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.LBracket;
    value: "[";
}

export interface SlimeJavascriptRBracketToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.RBracket;
    value: "]";
}

export interface SlimeJavascriptLParenToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.LParen;
    value: "(";
}

export interface SlimeJavascriptRParenToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.RParen;
    value: ")";
}

export interface SlimeJavascriptCommaToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Comma;
    value: ",";
}

export interface SlimeJavascriptColonToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Colon;
    value: ":";
}

// ============================================
// 通用 Token 组合接口
// ============================================

/** 包含大括号的节点 { } */
export interface SlimeJavascriptBraceTokens {
    lBraceToken?: SlimeJavascriptLBraceToken;
    rBraceToken?: SlimeJavascriptRBraceToken;
}

/** 包含中括号的节点 [ ] */
export interface SlimeJavascriptBracketTokens {
    lBracketToken?: SlimeJavascriptLBracketToken;
    rBracketToken?: SlimeJavascriptRBracketToken;
}

/** 包含小括号的节点 ( ) */
export interface SlimeJavascriptParenTokens {
    lParenToken?: SlimeJavascriptLParenToken;
    rParenToken?: SlimeJavascriptRParenToken;
}

/** 函数结构：小括号 + 大括号 */
export interface SlimeJavascriptFunctionTokens extends SlimeJavascriptParenTokens, SlimeJavascriptBraceTokens {
}

/** 包含冒号的节点 */
export interface SlimeJavascriptColonTokens {
    colonToken?: SlimeJavascriptColonToken;
}

/** 包含分号的节点 */
export interface SlimeJavascriptSemicolonTokens {
    semicolonToken?: SlimeJavascriptSemicolonToken;
}

// ============================================
// 关键字 Token
// ============================================

export interface SlimeJavascriptFunctionToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Function;
    value: "function";
}

export interface SlimeJavascriptAsyncToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Async;
    value: "async";
}

export interface SlimeJavascriptAsteriskToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Asterisk;
    value: "*";
}

export interface SlimeJavascriptArrowToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Arrow;
    value: "=>";
}

// 控制流关键字
export interface SlimeJavascriptIfToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.If;
    value: "if";
}

export interface SlimeJavascriptElseToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Else;
    value: "else";
}

export interface SlimeJavascriptForToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.For;
    value: "for";
}

export interface SlimeJavascriptWhileToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.While;
    value: "while";
}

export interface SlimeJavascriptDoToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Do;
    value: "do";
}

export interface SlimeJavascriptInToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.In;
    value: "in";
}

export interface SlimeJavascriptOfToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Of;
    value: "of";
}

export interface SlimeJavascriptSwitchToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Switch;
    value: "switch";
}

export interface SlimeJavascriptCaseToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Case;
    value: "case";
}

export interface SlimeJavascriptDefaultToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Default;
    value: "default";
}

export interface SlimeJavascriptBreakToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Break;
    value: "break";
}

export interface SlimeJavascriptContinueToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Continue;
    value: "continue";
}

export interface SlimeJavascriptReturnToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Return;
    value: "return";
}

export interface SlimeJavascriptThrowToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Throw;
    value: "throw";
}

export interface SlimeJavascriptTryToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Try;
    value: "try";
}

export interface SlimeJavascriptCatchToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Catch;
    value: "catch";
}

export interface SlimeJavascriptFinallyToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Finally;
    value: "finally";
}

export interface SlimeJavascriptWithToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.With;
    value: "with";
}

export interface SlimeJavascriptDebuggerToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Debugger;
    value: "debugger";
}

export interface SlimeJavascriptAwaitToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Await;
    value: "await";
}

export interface SlimeJavascriptYieldToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Yield;
    value: "yield";
}

// 类相关关键字
export interface SlimeJavascriptClassToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Class;
    value: "class";
}

export interface SlimeJavascriptExtendsToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Extends;
    value: "extends";
}

export interface SlimeJavascriptStaticToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Static;
    value: "static";
}

export interface SlimeJavascriptGetToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Get;
    value: "get";
}

export interface SlimeJavascriptSetToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Set;
    value: "set";
}

// 操作符关键字
export interface SlimeJavascriptNewToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.New;
    value: "new";
}

export interface SlimeJavascriptTypeofToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Typeof;
    value: "typeof";
}

export interface SlimeJavascriptVoidToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Void;
    value: "void";
}

export interface SlimeJavascriptDeleteToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Delete;
    value: "delete";
}

export interface SlimeJavascriptInstanceofToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Instanceof;
    value: "instanceof";
}

// 模块关键字
export interface SlimeJavascriptImportToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Import;
    value: "import";
}

export interface SlimeJavascriptExportToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Export;
    value: "export";
}

export interface SlimeJavascriptFromToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.From;
    value: "from";
}

export interface SlimeJavascriptAsToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.As;
    value: "as";
}

// 展开运算符 (Ellipsis)
export interface SlimeJavascriptEllipsisToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Ellipsis;
    value: "...";
}

// 点号
export interface SlimeJavascriptDotToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Dot;
    value: ".";
}

// 可选链
export interface SlimeJavascriptOptionalChainingToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.OptionalChaining;
    value: "?.";
}

// 问号
export interface SlimeJavascriptQuestionToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptTokenType.Question;
    value: "?";
}

// ============================================
// 运算符 Token（用于表达式）
// ============================================

/** 二元运算符 Token */
export interface SlimeJavascriptBinaryOperatorToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptBinaryOperatorTokenTypes[keyof typeof SlimeJavascriptBinaryOperatorTokenTypes];
    value: SlimeJavascriptBinaryOperator;
}

/** 一元运算符 Token */
export interface SlimeJavascriptUnaryOperatorToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptUnaryOperatorTokenTypes[keyof typeof SlimeJavascriptUnaryOperatorTokenTypes];
    value: SlimeJavascriptUnaryOperator;
}

/** 逻辑运算符 Token */
export interface SlimeJavascriptLogicalOperatorToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptLogicalOperatorTokenTypes[keyof typeof SlimeJavascriptLogicalOperatorTokenTypes];
    value: SlimeJavascriptLogicalOperator;
}

/** 赋值运算符 Token */
export interface SlimeJavascriptAssignmentOperatorToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptAssignmentOperatorTokenTypes[keyof typeof SlimeJavascriptAssignmentOperatorTokenTypes];
    value: SlimeJavascriptAssignmentOperator;
}

/** 更新运算符 Token */
export interface SlimeJavascriptUpdateOperatorToken extends SlimeJavascriptTokenNode {
    type: typeof SlimeJavascriptUpdateOperatorTokenTypes[keyof typeof SlimeJavascriptUpdateOperatorTokenTypes];
    value: SlimeJavascriptUpdateOperator;
}

// ============================================
// 元素/参数包装类型（用于精确关联逗号 Token）
// ============================================

/** 数组元素包装 - 用于 SlimeJavascriptArrayExpression */
export interface SlimeJavascriptArrayElement {
    element: SlimeJavascriptExpression | SlimeJavascriptSpreadElement | null;
    commaToken?: SlimeJavascriptCommaToken;
}

/** 对象属性包装 - 用于 SlimeJavascriptObjectExpression */
export interface SlimeJavascriptObjectPropertyItem {
    property: SlimeJavascriptProperty | SlimeJavascriptSpreadElement;
    commaToken?: SlimeJavascriptCommaToken;
}

/** 函数参数包装 - 用于 SlimeJavascriptBaseFunction.params */
export interface SlimeJavascriptFunctionParam {
    param: SlimeJavascriptPattern;
    commaToken?: SlimeJavascriptCommaToken;
}

/** 调用参数包装 - 用于 SlimeJavascriptBaseCallExpression.arguments */
export interface SlimeJavascriptCallArgument {
    argument: SlimeJavascriptExpression | SlimeJavascriptSpreadElement;
    commaToken?: SlimeJavascriptCommaToken;
}

/** 解构数组元素包装 - 用于 SlimeJavascriptArrayPattern */
export interface SlimeJavascriptArrayPatternElement {
    element: SlimeJavascriptPattern | null;
    commaToken?: SlimeJavascriptCommaToken;
}

/** 解构对象属性包装 - 用于 SlimeJavascriptObjectPattern */
export interface SlimeJavascriptObjectPatternProperty {
    property: SlimeJavascriptAssignmentProperty | SlimeJavascriptRestElement;
    commaToken?: SlimeJavascriptCommaToken;
}

/** Import specifier 包装 - 用于 SlimeJavascriptImportDeclaration */
export interface SlimeJavascriptImportSpecifierItem {
    specifier: SlimeJavascriptImportSpecifier | SlimeJavascriptImportDefaultSpecifier | SlimeJavascriptImportNamespaceSpecifier;
    commaToken?: SlimeJavascriptCommaToken;
}

/** Export specifier 包装 - 用于 SlimeJavascriptExportNamedDeclaration */
export interface SlimeJavascriptExportSpecifierItem {
    specifier: SlimeJavascriptExportSpecifier;
    commaToken?: SlimeJavascriptCommaToken;
}

export interface SlimeJavascriptNodeMap {
    SlimeJavascriptAssignmentProperty: SlimeJavascriptAssignmentProperty;
    SlimeJavascriptCatchClause: SlimeJavascriptCatchClause;
    SlimeJavascriptClass: SlimeJavascriptClass;
    SlimeJavascriptClassBody: SlimeJavascriptClassBody;
    SlimeJavascriptExpression: SlimeJavascriptExpression;
    SlimeJavascriptFunction: SlimeJavascriptFunction;
    SlimeJavascriptIdentifier: SlimeJavascriptIdentifier;
    SlimeJavascriptLiteral: SlimeJavascriptLiteral;
    SlimeJavascriptMethodDefinition: SlimeJavascriptMethodDefinition;
    SlimeJavascriptModuleDeclaration: SlimeJavascriptModuleDeclaration;
    SlimeJavascriptModuleSpecifier: SlimeJavascriptModuleSpecifier;
    SlimeJavascriptPattern: SlimeJavascriptPattern;
    SlimeJavascriptPrivateIdentifier: SlimeJavascriptPrivateIdentifier;
    SlimeJavascriptProgram: SlimeJavascriptProgram;
    SlimeJavascriptProperty: SlimeJavascriptProperty;
    SlimeJavascriptPropertyDefinition: SlimeJavascriptPropertyDefinition;
    SlimeJavascriptSpreadElement: SlimeJavascriptSpreadElement;
    SlimeJavascriptStatement: SlimeJavascriptStatement;
    SlimeJavascriptSuper: SlimeJavascriptSuper;
    SlimeJavascriptSwitchCase: SlimeJavascriptSwitchCase;
    SlimeJavascriptTemplateElement: SlimeJavascriptTemplateElement;
    SlimeJavascriptVariableDeclarator: SlimeJavascriptVariableDeclarator;
}

export type SlimeJavascriptNode = SlimeJavascriptNodeMap[keyof SlimeJavascriptNodeMap];

export interface SlimeJavascriptComment extends SlimeJavascriptBaseNodeWithoutComments, SlimeJavascriptExtends<ESTree.Comment> {
    type: "Line" | "Block";
    value: string;
}

/** Program source type */
export const SlimeJavascriptProgramSourceType = {
    Script: "script",
    Module: "module"
} as const;
export type SlimeJavascriptProgramSourceType = typeof SlimeJavascriptProgramSourceType[keyof typeof SlimeJavascriptProgramSourceType];

export interface SlimeJavascriptProgram extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.Program>, 'body'> {
    type: typeof SlimeJavascriptAstTypeName.Program;
    sourceType: SlimeJavascriptProgramSourceType;
    body: Array<SlimeJavascriptDirective | SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration>;
    comments?: SlimeJavascriptComment[] | undefined;
}

export interface SlimeJavascriptDirective extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.Directive>, 'expression'> {
    type: typeof SlimeJavascriptAstTypeName.ExpressionStatement;
    expression: SlimeJavascriptLiteral;
    directive: string;
}

export interface SlimeJavascriptBaseFunction extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.BaseFunction>, 'params' | 'body'>, SlimeJavascriptFunctionTokens {
    /** 函数参数列表（包装类型，每个参数可关联其后的逗号） */
    params: SlimeJavascriptFunctionParam[];
    generator?: boolean | undefined;
    async?: boolean | undefined;
    /** function 关键字 Token */
    functionToken?: SlimeJavascriptFunctionToken;
    /** async 关键字 Token */
    asyncToken?: SlimeJavascriptAsyncToken;
    /** generator * Token */
    asteriskToken?: SlimeJavascriptAsteriskToken;
    // The body is either BlockStatement or Expression because arrow functions
    // can have a body that's either. FunctionDeclarations and
    // FunctionExpressions have only BlockStatement bodies.
    body: SlimeJavascriptBlockStatement | SlimeJavascriptExpression;
}

export type SlimeJavascriptFunction = SlimeJavascriptFunctionDeclaration | SlimeJavascriptFunctionExpression | SlimeJavascriptArrowFunctionExpression;

export type SlimeJavascriptStatement =
    | SlimeJavascriptExpressionStatement
    | SlimeJavascriptBlockStatement
    | SlimeJavascriptStaticBlock
    | SlimeJavascriptEmptyStatement
    | SlimeJavascriptDebuggerStatement
    | SlimeJavascriptWithStatement
    | SlimeJavascriptReturnStatement
    | SlimeJavascriptLabeledStatement
    | SlimeJavascriptBreakStatement
    | SlimeJavascriptContinueStatement
    | SlimeJavascriptIfStatement
    | SlimeJavascriptSwitchStatement
    | SlimeJavascriptThrowStatement
    | SlimeJavascriptTryStatement
    | SlimeJavascriptWhileStatement
    | SlimeJavascriptDoWhileStatement
    | SlimeJavascriptForStatement
    | SlimeJavascriptForInStatement
    | SlimeJavascriptForOfStatement
    | SlimeJavascriptDeclaration;

export interface SlimeJavascriptBaseStatement extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.BaseStatement> {
}

export interface SlimeJavascriptEmptyStatement extends SlimeJavascriptBaseStatement, SlimeJavascriptExtends<ESTree.EmptyStatement>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.EmptyStatement;
}

export interface SlimeJavascriptBlockStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.BlockStatement>, 'body'>, SlimeJavascriptBraceTokens {
    type: typeof SlimeJavascriptAstTypeName.BlockStatement;
    body: SlimeJavascriptStatement[];
    innerComments?: SlimeJavascriptComment[] | undefined;
}

export interface SlimeJavascriptStaticBlock extends Omit<SlimeJavascriptExtends<ESTree.StaticBlock, 'innerComments'>, 'body'>, Omit<SlimeJavascriptBlockStatement, 'type' | 'body'> {
    type: typeof SlimeJavascriptAstTypeName.StaticBlock;
    body: SlimeJavascriptStatement[];
}

export interface SlimeJavascriptExpressionStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.ExpressionStatement>, 'expression'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ExpressionStatement;
    expression: SlimeJavascriptExpression;
}

export interface SlimeJavascriptIfStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.IfStatement>, 'test' | 'consequent' | 'alternate'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.IfStatement;
    test: SlimeJavascriptExpression;
    consequent: SlimeJavascriptStatement;
    alternate?: SlimeJavascriptStatement | null | undefined;
    /** if 关键字 Token */
    ifToken?: SlimeJavascriptIfToken;
    /** else 关键字 Token */
    elseToken?: SlimeJavascriptElseToken;
}

export interface SlimeJavascriptLabeledStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.LabeledStatement>, 'label' | 'body'> {
    type: typeof SlimeJavascriptAstTypeName.LabeledStatement;
    label: SlimeJavascriptIdentifier;
    body: SlimeJavascriptStatement;
}

export interface SlimeJavascriptBreakStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.BreakStatement>, 'label'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.BreakStatement;
    label?: SlimeJavascriptIdentifier | null | undefined;
    /** break 关键字 Token */
    breakToken?: SlimeJavascriptBreakToken;
}

export interface SlimeJavascriptContinueStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.ContinueStatement>, 'label'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ContinueStatement;
    label?: SlimeJavascriptIdentifier | null | undefined;
    /** continue 关键字 Token */
    continueToken?: SlimeJavascriptContinueToken;
}

export interface SlimeJavascriptWithStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.WithStatement>, 'object' | 'body'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.WithStatement;
    object: SlimeJavascriptExpression;
    body: SlimeJavascriptStatement;
    /** with 关键字 Token */
    withToken?: SlimeJavascriptWithToken;
}

export interface SlimeJavascriptSwitchStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.SwitchStatement>, 'discriminant' | 'cases'>, SlimeJavascriptParenTokens, SlimeJavascriptBraceTokens {
    type: typeof SlimeJavascriptAstTypeName.SwitchStatement;
    discriminant: SlimeJavascriptExpression;
    cases: SlimeJavascriptSwitchCase[];
    /** switch 关键字 Token */
    switchToken?: SlimeJavascriptSwitchToken;
}

export interface SlimeJavascriptReturnStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.ReturnStatement>, 'argument'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ReturnStatement;
    argument?: SlimeJavascriptExpression | null | undefined;
    /** return 关键字 Token */
    returnToken?: SlimeJavascriptReturnToken;
}

export interface SlimeJavascriptThrowStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.ThrowStatement>, 'argument'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ThrowStatement;
    argument: SlimeJavascriptExpression;
    /** throw 关键字 Token */
    throwToken?: SlimeJavascriptThrowToken;
}

export interface SlimeJavascriptTryStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.TryStatement>, 'block' | 'handler' | 'finalizer'> {
    type: typeof SlimeJavascriptAstTypeName.TryStatement;
    block: SlimeJavascriptBlockStatement;
    handler?: SlimeJavascriptCatchClause | null | undefined;
    finalizer?: SlimeJavascriptBlockStatement | null | undefined;
    /** try 关键字 Token */
    tryToken?: SlimeJavascriptTryToken;
    /** finally 关键字 Token */
    finallyToken?: SlimeJavascriptFinallyToken;
}

export interface SlimeJavascriptWhileStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.WhileStatement>, 'test' | 'body'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.WhileStatement;
    test: SlimeJavascriptExpression;
    body: SlimeJavascriptStatement;
    /** while 关键字 Token */
    whileToken?: SlimeJavascriptWhileToken;
}

export interface SlimeJavascriptDoWhileStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.DoWhileStatement>, 'body' | 'test'>, SlimeJavascriptParenTokens, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.DoWhileStatement;
    body: SlimeJavascriptStatement;
    test: SlimeJavascriptExpression;
    /** do 关键字 Token */
    doToken?: SlimeJavascriptDoToken;
    /** while 关键字 Token */
    whileToken?: SlimeJavascriptWhileToken;
}

export interface SlimeJavascriptForStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.ForStatement>, 'init' | 'test' | 'update' | 'body'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.ForStatement;
    init?: SlimeJavascriptVariableDeclaration | SlimeJavascriptExpression | null | undefined;
    test?: SlimeJavascriptExpression | null | undefined;
    update?: SlimeJavascriptExpression | null | undefined;
    body: SlimeJavascriptStatement;
    /** for 关键字 Token */
    forToken?: SlimeJavascriptForToken;
    /** 第一个分号 */
    semicolon1Token?: SlimeJavascriptSemicolonToken;
    /** 第二个分号 */
    semicolon2Token?: SlimeJavascriptSemicolonToken;
}

export interface SlimeJavascriptBaseForXStatement extends SlimeJavascriptBaseStatement, Omit<SlimeJavascriptExtends<ESTree.BaseForXStatement>, 'left' | 'right' | 'body'>, SlimeJavascriptParenTokens {
    left: SlimeJavascriptVariableDeclaration | SlimeJavascriptPattern;
    right: SlimeJavascriptExpression;
    body: SlimeJavascriptStatement;
    /** for 关键字 Token */
    forToken?: SlimeJavascriptForToken;
}

export interface SlimeJavascriptForInStatement extends SlimeJavascriptBaseForXStatement, Omit<SlimeJavascriptExtends<ESTree.ForInStatement>, 'body' | 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.ForInStatement;
    /** in 关键字 Token */
    inToken?: SlimeJavascriptInToken;
}

export interface SlimeJavascriptDebuggerStatement extends SlimeJavascriptBaseStatement, SlimeJavascriptExtends<ESTree.DebuggerStatement>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.DebuggerStatement;
    /** debugger 关键字 Token */
    debuggerToken?: SlimeJavascriptDebuggerToken;
}

export type SlimeJavascriptDeclaration = SlimeJavascriptFunctionDeclaration | SlimeJavascriptVariableDeclaration | SlimeJavascriptClassDeclaration;

export interface SlimeJavascriptBaseDeclaration extends SlimeJavascriptBaseStatement, SlimeJavascriptExtends<ESTree.BaseDeclaration> {
}

export interface SlimeJavascriptMaybeNamedFunctionDeclaration extends SlimeJavascriptBaseFunction, SlimeJavascriptBaseDeclaration, Omit<SlimeJavascriptExtends<ESTree.MaybeNamedFunctionDeclaration>, 'params' | 'body' | 'id'> {
    type: typeof SlimeJavascriptAstTypeName.FunctionDeclaration;
    /** It is null when a function declaration is a part of the `export default function` statement */
    id: SlimeJavascriptIdentifier | null;
    body: SlimeJavascriptBlockStatement;
}

export interface SlimeJavascriptFunctionDeclaration extends SlimeJavascriptMaybeNamedFunctionDeclaration, Omit<SlimeJavascriptExtends<ESTree.FunctionDeclaration>, 'body' | 'params'> {
    id: SlimeJavascriptIdentifier;
}

export interface SlimeJavascriptVariableDeclaration extends SlimeJavascriptBaseDeclaration, Omit<SlimeJavascriptExtends<ESTree.VariableDeclaration>, 'kind' | 'declarations'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.VariableDeclaration;
    declarations: SlimeJavascriptVariableDeclarator[];
    /** 变量声明关键字 Token (var/let/const) */
    kind: SlimeJavascriptVariableDeclarationKindToken;
}

export interface SlimeJavascriptVariableDeclarator extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.VariableDeclarator>, 'id' | 'init'> {
    type: typeof SlimeJavascriptAstTypeName.VariableDeclarator;
    id: SlimeJavascriptPattern;
    init?: SlimeJavascriptExpression | null | undefined;
    /** 赋值符号 Token，包含位置信息 */
    eqToken?: SlimeJavascriptAssignToken;
}

export interface SlimeJavascriptExpressionMap {
    SlimeJavascriptArrayExpression: SlimeJavascriptArrayExpression;
    SlimeJavascriptArrowFunctionExpression: SlimeJavascriptArrowFunctionExpression;
    SlimeJavascriptAssignmentExpression: SlimeJavascriptAssignmentExpression;
    SlimeJavascriptAwaitExpression: SlimeJavascriptAwaitExpression;
    SlimeJavascriptBinaryExpression: SlimeJavascriptBinaryExpression;
    SlimeJavascriptCallExpression: SlimeJavascriptCallExpression;
    SlimeJavascriptChainExpression: SlimeJavascriptChainExpression;
    SlimeJavascriptClassExpression: SlimeJavascriptClassExpression;
    SlimeJavascriptConditionalExpression: SlimeJavascriptConditionalExpression;
    SlimeJavascriptFunctionExpression: SlimeJavascriptFunctionExpression;
    SlimeJavascriptIdentifier: SlimeJavascriptIdentifier;
    SlimeJavascriptImportExpression: SlimeJavascriptImportExpression;
    SlimeJavascriptLiteral: SlimeJavascriptLiteral;
    SlimeJavascriptLogicalExpression: SlimeJavascriptLogicalExpression;
    SlimeJavascriptMemberExpression: SlimeJavascriptMemberExpression;
    SlimeJavascriptMetaProperty: SlimeJavascriptMetaProperty;
    SlimeJavascriptNewExpression: SlimeJavascriptNewExpression;
    SlimeJavascriptObjectExpression: SlimeJavascriptObjectExpression;
    SlimeJavascriptSequenceExpression: SlimeJavascriptSequenceExpression;
    SlimeJavascriptTaggedTemplateExpression: SlimeJavascriptTaggedTemplateExpression;
    SlimeJavascriptTemplateLiteral: SlimeJavascriptTemplateLiteral;
    SlimeJavascriptThisExpression: SlimeJavascriptThisExpression;
    SlimeJavascriptUnaryExpression: SlimeJavascriptUnaryExpression;
    SlimeJavascriptUpdateExpression: SlimeJavascriptUpdateExpression;
    SlimeJavascriptYieldExpression: SlimeJavascriptYieldExpression;
}

export type SlimeJavascriptExpression = SlimeJavascriptExpressionMap[keyof SlimeJavascriptExpressionMap];

export interface SlimeJavascriptBaseExpression extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.BaseExpression> {
}

export type SlimeJavascriptChainElement = SlimeJavascriptSimpleCallExpression | SlimeJavascriptMemberExpression;

export interface SlimeJavascriptChainExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ChainExpression>, 'expression'> {
    type: typeof SlimeJavascriptAstTypeName.ChainExpression;
    expression: SlimeJavascriptChainElement;
}

export interface SlimeJavascriptThisExpression extends SlimeJavascriptBaseExpression, SlimeJavascriptExtends<ESTree.ThisExpression> {
    type: typeof SlimeJavascriptAstTypeName.ThisExpression;
}

export interface SlimeJavascriptArrayExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ArrayExpression>, 'elements'>, SlimeJavascriptBracketTokens {
    type: typeof SlimeJavascriptAstTypeName.ArrayExpression;
    /** 数组元素列表（包装类型，每个元素可关联其后的逗号） */
    elements: Array<SlimeJavascriptArrayElement>;
}

export interface SlimeJavascriptObjectExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ObjectExpression>, 'properties'>, SlimeJavascriptBraceTokens {
    type: typeof SlimeJavascriptAstTypeName.ObjectExpression;
    /** 对象属性列表（包装类型，每个属性可关联其后的逗号） */
    properties: Array<SlimeJavascriptObjectPropertyItem>;
}

export interface SlimeJavascriptPrivateIdentifier extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.PrivateIdentifier> {
    type: typeof SlimeJavascriptAstTypeName.PrivateIdentifier;
    name: string;
}

export interface SlimeJavascriptProperty extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.Property>, 'key' | 'value'>, SlimeJavascriptColonTokens, SlimeJavascriptBracketTokens {
    type: typeof SlimeJavascriptAstTypeName.Property;
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier;
    value: SlimeJavascriptExpression | SlimeJavascriptPattern; // Could be an AssignmentProperty
    kind: "init" | "get" | "set";
    method: boolean;
    /** get 关键字 Token */
    getToken?: SlimeJavascriptGetToken;
    /** set 关键字 Token */
    setToken?: SlimeJavascriptSetToken;
    /** async 关键字 Token */
    asyncToken?: SlimeJavascriptAsyncToken;
    /** * Token (generator) */
    asteriskToken?: SlimeJavascriptAsteriskToken;
    shorthand: boolean;
    computed: boolean;
}

export interface SlimeJavascriptPropertyDefinition extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.PropertyDefinition>, 'key' | 'value'> {
    type: typeof SlimeJavascriptAstTypeName.PropertyDefinition;
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier;
    value?: SlimeJavascriptExpression | null | undefined;
    computed: boolean;
    static: boolean;
}

export interface SlimeJavascriptFunctionExpression extends SlimeJavascriptBaseFunction, SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.FunctionExpression>, 'params' | 'body' | 'id'> {
    id?: SlimeJavascriptIdentifier | null | undefined;
    type: typeof SlimeJavascriptAstTypeName.FunctionExpression;
    body: SlimeJavascriptBlockStatement;
}

export interface SlimeJavascriptSequenceExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.SequenceExpression>, 'expressions'> {
    type: typeof SlimeJavascriptAstTypeName.SequenceExpression;
    expressions: SlimeJavascriptExpression[];
}

export interface SlimeJavascriptUnaryExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.UnaryExpression>, 'operator' | 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.UnaryExpression;
    /** 运算符 Token */
    operator: SlimeJavascriptUnaryOperatorToken;
    prefix: true;
    argument: SlimeJavascriptExpression;
}

export interface SlimeJavascriptBinaryExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.BinaryExpression>, 'operator' | 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.BinaryExpression;
    /** 运算符 Token */
    operator: SlimeJavascriptBinaryOperatorToken;
    left: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier;
    right: SlimeJavascriptExpression;
}

export interface SlimeJavascriptAssignmentExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.AssignmentExpression>, 'operator' | 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.AssignmentExpression;
    /** 运算符 Token */
    operator: SlimeJavascriptAssignmentOperatorToken;
    left: SlimeJavascriptPattern | SlimeJavascriptMemberExpression;
    right: SlimeJavascriptExpression;
}

export interface SlimeJavascriptUpdateExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.UpdateExpression>, 'operator' | 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.UpdateExpression;
    /** 运算符 Token */
    operator: SlimeJavascriptUpdateOperatorToken;
    argument: SlimeJavascriptExpression;
    prefix: boolean;
}

export interface SlimeJavascriptLogicalExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.LogicalExpression>, 'operator' | 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.LogicalExpression;
    /** 运算符 Token */
    operator: SlimeJavascriptLogicalOperatorToken;
    left: SlimeJavascriptExpression;
    right: SlimeJavascriptExpression;
}

export interface SlimeJavascriptConditionalExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ConditionalExpression>, 'test' | 'alternate' | 'consequent'>, SlimeJavascriptColonTokens {
    type: typeof SlimeJavascriptAstTypeName.ConditionalExpression;
    test: SlimeJavascriptExpression;
    alternate: SlimeJavascriptExpression;
    consequent: SlimeJavascriptExpression;
    /** ? Token */
    questionToken?: SlimeJavascriptQuestionToken;
}

export interface SlimeJavascriptBaseCallExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.BaseCallExpression>, 'callee' | 'arguments'>, SlimeJavascriptParenTokens {
    callee: SlimeJavascriptExpression | SlimeJavascriptSuper;
    /** 调用参数列表（包装类型，每个参数可关联其后的逗号） */
    arguments: Array<SlimeJavascriptCallArgument>;
}

export type SlimeJavascriptCallExpression = SlimeJavascriptSimpleCallExpression | SlimeJavascriptNewExpression;

export interface SlimeJavascriptSimpleCallExpression extends SlimeJavascriptBaseCallExpression, Omit<SlimeJavascriptExtends<ESTree.SimpleCallExpression>, 'arguments' | 'callee'> {
    type: typeof SlimeJavascriptAstTypeName.CallExpression;
    optional: boolean;
}

export interface SlimeJavascriptNewExpression extends SlimeJavascriptBaseCallExpression, Omit<SlimeJavascriptExtends<ESTree.NewExpression>, 'arguments' | 'callee'> {
    type: typeof SlimeJavascriptAstTypeName.NewExpression;
    /** new 关键字 Token */
    newToken?: SlimeJavascriptNewToken;
}

export interface SlimeJavascriptMemberExpression extends SlimeJavascriptBaseExpression, SlimeJavascriptBasePattern, Omit<SlimeJavascriptExtends<ESTree.MemberExpression>, 'object' | 'property'>, SlimeJavascriptBracketTokens {
    type: typeof SlimeJavascriptAstTypeName.MemberExpression;
    object: SlimeJavascriptExpression | SlimeJavascriptSuper;
    property: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier;
    computed: boolean;
    optional: boolean;
    /** 点号 Token (非计算属性) */
    dotToken?: SlimeJavascriptDotToken;
    /** 可选链 Token ?. */
    optionalChainingToken?: SlimeJavascriptOptionalChainingToken;
}

export type SlimeJavascriptPattern =
    SlimeJavascriptIdentifier
    | SlimeJavascriptObjectPattern
    | SlimeJavascriptArrayPattern
    | SlimeJavascriptRestElement
    | SlimeJavascriptAssignmentPattern
    | SlimeJavascriptMemberExpression;

export interface SlimeJavascriptBasePattern extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.BasePattern> {
}

export interface SlimeJavascriptSwitchCase extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.SwitchCase>, 'test' | 'consequent'>, SlimeJavascriptColonTokens {
    type: typeof SlimeJavascriptAstTypeName.SwitchCase;
    test?: SlimeJavascriptExpression | null | undefined;
    consequent: SlimeJavascriptStatement[];
    /** case 关键字 Token (如果是 case) */
    caseToken?: SlimeJavascriptCaseToken;
    /** default 关键字 Token (如果是 default) */
    defaultToken?: SlimeJavascriptDefaultToken;
}

export interface SlimeJavascriptCatchClause extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.CatchClause>, 'param' | 'body'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.CatchClause;
    param: SlimeJavascriptPattern | null;
    body: SlimeJavascriptBlockStatement;
    /** catch 关键字 Token */
    catchToken?: SlimeJavascriptCatchToken;
}

export interface SlimeJavascriptIdentifier extends SlimeJavascriptBaseNode, SlimeJavascriptBaseExpression, SlimeJavascriptBasePattern, SlimeJavascriptExtends<ESTree.Identifier> {
    type: typeof SlimeJavascriptAstTypeName.Identifier;
    name: string;
}

export type SlimeJavascriptLiteral = SlimeJavascriptSimpleLiteral | SlimeJavascriptRegExpLiteral | SlimeJavascriptBigIntLiteral;

export interface SlimeJavascriptSimpleLiteral extends SlimeJavascriptBaseNode, SlimeJavascriptBaseExpression, SlimeJavascriptExtends<ESTree.SimpleLiteral> {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value: string | boolean | number | null;
    raw?: string | undefined;
}

export interface SlimeJavascriptRegExpLiteral extends SlimeJavascriptBaseNode, SlimeJavascriptBaseExpression, SlimeJavascriptExtends<ESTree.RegExpLiteral> {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value?: RegExp | null | undefined;
    regex: {
        pattern: string;
        flags: string;
    };
    raw?: string | undefined;
}

export interface SlimeJavascriptBigIntLiteral extends SlimeJavascriptBaseNode, SlimeJavascriptBaseExpression, SlimeJavascriptExtends<ESTree.BigIntLiteral> {
    type: typeof SlimeJavascriptAstTypeName.Literal;
    value?: bigint | null | undefined;
    bigint: string;
    raw?: string | undefined;
}

/** String literal - 字符串字面量 */
export interface SlimeJavascriptStringLiteral extends SlimeJavascriptSimpleLiteral {
    value: string;
}

/** Numeric literal - 数字字面量 */
export interface SlimeJavascriptNumericLiteral extends SlimeJavascriptSimpleLiteral {
    value: number;
}

/** Boolean literal - 布尔字面量 */
export interface SlimeJavascriptBooleanLiteral extends SlimeJavascriptSimpleLiteral {
    value: boolean;
}

/** Null literal - 空值字面量 */
export interface SlimeJavascriptNullLiteral extends SlimeJavascriptSimpleLiteral {
    value: null;
}

export type SlimeJavascriptUnaryOperator = "-" | "+" | "!" | "~" | "typeof" | "void" | "delete";

export type SlimeJavascriptBinaryOperator =
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

export type SlimeJavascriptLogicalOperator = "||" | "&&" | "??";

export type SlimeJavascriptAssignmentOperator =
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

export type SlimeJavascriptUpdateOperator = "++" | "--";

export interface SlimeJavascriptForOfStatement extends SlimeJavascriptBaseForXStatement, Omit<SlimeJavascriptExtends<ESTree.ForOfStatement>, 'body' | 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.ForOfStatement;
    await: boolean;
    /** of 关键字 Token */
    ofToken?: SlimeJavascriptOfToken;
    /** await 关键字 Token (for await...of) */
    awaitToken?: SlimeJavascriptAwaitToken;
}

export interface SlimeJavascriptSuper extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.Super> {
    type: typeof SlimeJavascriptAstTypeName.Super;
}

export interface SlimeJavascriptSpreadElement extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.SpreadElement>, 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.SpreadElement;
    argument: SlimeJavascriptExpression;
    /** ... 展开运算符 Token */
    ellipsisToken?: SlimeJavascriptEllipsisToken;
}

export interface SlimeJavascriptArrowFunctionExpression extends SlimeJavascriptBaseExpression, SlimeJavascriptBaseFunction, Omit<SlimeJavascriptExtends<ESTree.ArrowFunctionExpression>, 'params' | 'body'> {
    type: typeof SlimeJavascriptAstTypeName.ArrowFunctionExpression;
    expression: boolean;
    body: SlimeJavascriptBlockStatement | SlimeJavascriptExpression;
    /** 箭头 Token => */
    arrowToken?: SlimeJavascriptArrowToken;
}

export interface SlimeJavascriptYieldExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.YieldExpression>, 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.YieldExpression;
    argument?: SlimeJavascriptExpression | null | undefined;
    delegate: boolean;
    /** yield 关键字 Token */
    yieldToken?: SlimeJavascriptYieldToken;
    /** * Token (delegate yield) */
    asteriskToken?: SlimeJavascriptAsteriskToken;
}

export interface SlimeJavascriptTemplateLiteral extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.TemplateLiteral>, 'quasis' | 'expressions'> {
    type: typeof SlimeJavascriptAstTypeName.TemplateLiteral;
    quasis: SlimeJavascriptTemplateElement[];
    expressions: SlimeJavascriptExpression[];
}

export interface SlimeJavascriptTaggedTemplateExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.TaggedTemplateExpression>, 'tag' | 'quasi'> {
    type: typeof SlimeJavascriptAstTypeName.TaggedTemplateExpression;
    tag: SlimeJavascriptExpression;
    quasi: SlimeJavascriptTemplateLiteral;
}

export interface SlimeJavascriptTemplateElement extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.TemplateElement> {
    type: typeof SlimeJavascriptAstTypeName.TemplateElement;
    tail: boolean;
    value: {
        /** It is null when the template literal is tagged and the text has an invalid escape (e.g. - tag`\unicode and \u{55}`) */
        cooked?: string | null | undefined;
        raw: string;
    };
}

export interface SlimeJavascriptAssignmentProperty extends SlimeJavascriptProperty, Omit<SlimeJavascriptExtends<ESTree.AssignmentProperty>, 'key' | 'value'> {
    value: SlimeJavascriptPattern;
    kind: "init";
    method: boolean; // false
}

export interface SlimeJavascriptObjectPattern extends SlimeJavascriptBasePattern, Omit<SlimeJavascriptExtends<ESTree.ObjectPattern>, 'properties'>, SlimeJavascriptBraceTokens {
    type: typeof SlimeJavascriptAstTypeName.ObjectPattern;
    /** 解构属性列表（包装类型，每个属性可关联其后的逗号） */
    properties: Array<SlimeJavascriptObjectPatternProperty>;
}

export interface SlimeJavascriptArrayPattern extends SlimeJavascriptBasePattern, Omit<SlimeJavascriptExtends<ESTree.ArrayPattern>, 'elements'>, SlimeJavascriptBracketTokens {
    type: typeof SlimeJavascriptAstTypeName.ArrayPattern;
    /** 解构元素列表（包装类型，每个元素可关联其后的逗号） */
    elements: Array<SlimeJavascriptArrayPatternElement>;
}

export interface SlimeJavascriptRestElement extends SlimeJavascriptBasePattern, Omit<SlimeJavascriptExtends<ESTree.RestElement>, 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.RestElement;
    argument: SlimeJavascriptPattern;
    /** ... 展开运算符 Token */
    ellipsisToken?: SlimeJavascriptEllipsisToken;
}

export interface SlimeJavascriptAssignmentPattern extends SlimeJavascriptBasePattern, Omit<SlimeJavascriptExtends<ESTree.AssignmentPattern>, 'left' | 'right'> {
    type: typeof SlimeJavascriptAstTypeName.AssignmentPattern;
    left: SlimeJavascriptPattern;
    right: SlimeJavascriptExpression;
}

export type SlimeJavascriptClass = SlimeJavascriptClassDeclaration | SlimeJavascriptClassExpression;

export interface SlimeJavascriptBaseClass extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.BaseClass>, 'superClass' | 'body'> {
    superClass?: SlimeJavascriptExpression | null | undefined;
    body: SlimeJavascriptClassBody;
    /** class 关键字 Token */
    classToken?: SlimeJavascriptClassToken;
    /** extends 关键字 Token */
    extendsToken?: SlimeJavascriptExtendsToken;
}

export interface SlimeJavascriptClassBody extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.ClassBody>, 'body'>, SlimeJavascriptBraceTokens {
    type: typeof SlimeJavascriptAstTypeName.ClassBody;
    body: Array<SlimeJavascriptMethodDefinition | SlimeJavascriptPropertyDefinition | SlimeJavascriptStaticBlock>;
}

export interface SlimeJavascriptMethodDefinition extends SlimeJavascriptBaseNode, Omit<SlimeJavascriptExtends<ESTree.MethodDefinition>, 'value' | 'key'> {
    type: typeof SlimeJavascriptAstTypeName.MethodDefinition;
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier;
    value: SlimeJavascriptFunctionExpression;
    kind: "constructor" | "method" | "get" | "set";
    computed: boolean;
    static: boolean;
    /** static 关键字 Token */
    staticToken?: SlimeJavascriptStaticToken;
    /** get 关键字 Token */
    getToken?: SlimeJavascriptGetToken;
    /** set 关键字 Token */
    setToken?: SlimeJavascriptSetToken;
    /** async 关键字 Token */
    asyncToken?: SlimeJavascriptAsyncToken;
    /** generator * Token */
    asteriskToken?: SlimeJavascriptAsteriskToken;
}

export interface SlimeJavascriptMaybeNamedClassDeclaration extends SlimeJavascriptBaseClass, SlimeJavascriptBaseDeclaration, Omit<SlimeJavascriptExtends<ESTree.MaybeNamedClassDeclaration>, 'body' | 'superClass'> {
    type: typeof SlimeJavascriptAstTypeName.ClassDeclaration;
    /** It is null when a class declaration is a part of the `export default class` statement */
    id: SlimeJavascriptIdentifier | null;
}

export interface SlimeJavascriptClassDeclaration extends SlimeJavascriptMaybeNamedClassDeclaration, Omit<SlimeJavascriptExtends<ESTree.ClassDeclaration>, 'body' | 'superClass'> {
    id: SlimeJavascriptIdentifier;
}

export interface SlimeJavascriptClassExpression extends SlimeJavascriptBaseClass, SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ClassExpression>, 'body' | 'superClass'> {
    type: typeof SlimeJavascriptAstTypeName.ClassExpression;
    id?: SlimeJavascriptIdentifier | null | undefined;
}

export interface SlimeJavascriptMetaProperty extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.MetaProperty>, 'meta' | 'property'> {
    type: typeof SlimeJavascriptAstTypeName.MetaProperty;
    meta: SlimeJavascriptIdentifier;
    property: SlimeJavascriptIdentifier;
}

export type SlimeJavascriptModuleDeclaration =
    | SlimeJavascriptImportDeclaration
    | SlimeJavascriptExportNamedDeclaration
    | SlimeJavascriptExportDefaultDeclaration
    | SlimeJavascriptExportAllDeclaration;

export interface SlimeJavascriptBaseModuleDeclaration extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.BaseModuleDeclaration> {
}

export type SlimeJavascriptModuleSpecifier =
    SlimeJavascriptImportSpecifier
    | SlimeJavascriptImportDefaultSpecifier
    | SlimeJavascriptImportNamespaceSpecifier
    | SlimeJavascriptExportSpecifier;

export interface SlimeJavascriptBaseModuleSpecifier extends SlimeJavascriptBaseNode, SlimeJavascriptExtends<ESTree.BaseModuleSpecifier> {
    local: SlimeJavascriptIdentifier;
}

export interface SlimeJavascriptImportDeclaration extends SlimeJavascriptBaseModuleDeclaration, Omit<SlimeJavascriptExtends<ESTree.ImportDeclaration>, 'specifiers' | 'source'>, SlimeJavascriptBraceTokens, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ImportDeclaration;
    /** import specifiers 列表（包装类型，每个 specifier 可关联其后的逗号） */
    specifiers: Array<SlimeJavascriptImportSpecifierItem>;
    source: SlimeJavascriptLiteral;
    /** import 关键字 Token */
    importToken?: SlimeJavascriptImportToken;
    /** from 关键字 Token */
    fromToken?: SlimeJavascriptFromToken;
}

export interface SlimeJavascriptImportSpecifier extends SlimeJavascriptBaseModuleSpecifier, SlimeJavascriptExtends<ESTree.ImportSpecifier, 'local'> {
    type: typeof SlimeJavascriptAstTypeName.ImportSpecifier;
    imported: SlimeJavascriptIdentifier | SlimeJavascriptLiteral;
    /** as 关键字 Token */
    asToken?: SlimeJavascriptAsToken;
}

export interface SlimeJavascriptImportExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.ImportExpression>, 'source'>, SlimeJavascriptParenTokens {
    type: typeof SlimeJavascriptAstTypeName.ImportExpression;
    source: SlimeJavascriptExpression;
    /** import 关键字 Token */
    importToken?: SlimeJavascriptImportToken;
}

export interface SlimeJavascriptImportDefaultSpecifier extends SlimeJavascriptBaseModuleSpecifier, SlimeJavascriptExtends<ESTree.ImportDefaultSpecifier, 'local'> {
    type: typeof SlimeJavascriptAstTypeName.ImportDefaultSpecifier;
}

export interface SlimeJavascriptImportNamespaceSpecifier extends SlimeJavascriptBaseModuleSpecifier, SlimeJavascriptExtends<ESTree.ImportNamespaceSpecifier, 'local'> {
    type: typeof SlimeJavascriptAstTypeName.ImportNamespaceSpecifier;
    /** * Token */
    asteriskToken?: SlimeJavascriptAsteriskToken;
    /** as 关键字 Token */
    asToken?: SlimeJavascriptAsToken;
}

export interface SlimeJavascriptExportNamedDeclaration extends SlimeJavascriptBaseModuleDeclaration, Omit<SlimeJavascriptExtends<ESTree.ExportNamedDeclaration>, 'declaration' | 'specifiers'>, SlimeJavascriptBraceTokens, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ExportNamedDeclaration;
    declaration?: SlimeJavascriptDeclaration | null | undefined;
    /** export specifiers 列表（包装类型，每个 specifier 可关联其后的逗号） */
    specifiers: SlimeJavascriptExportSpecifierItem[];
    source?: SlimeJavascriptLiteral | null | undefined;
    /** export 关键字 Token */
    exportToken?: SlimeJavascriptExportToken;
    /** from 关键字 Token */
    fromToken?: SlimeJavascriptFromToken;
}

export interface SlimeJavascriptExportSpecifier extends Omit<SlimeJavascriptExtends<ESTree.ExportSpecifier>, 'local' | 'exported'>, Omit<SlimeJavascriptBaseModuleSpecifier, 'local'> {
    type: typeof SlimeJavascriptAstTypeName.ExportSpecifier;
    local: SlimeJavascriptIdentifier | SlimeJavascriptLiteral;
    exported: SlimeJavascriptIdentifier | SlimeJavascriptLiteral;
    /** as 关键字 Token */
    asToken?: SlimeJavascriptAsToken;
}

export interface SlimeJavascriptExportDefaultDeclaration extends SlimeJavascriptBaseModuleDeclaration, Omit<SlimeJavascriptExtends<ESTree.ExportDefaultDeclaration>, 'declaration'> {
    type: typeof SlimeJavascriptAstTypeName.ExportDefaultDeclaration;
    declaration: SlimeJavascriptMaybeNamedFunctionDeclaration | SlimeJavascriptMaybeNamedClassDeclaration | SlimeJavascriptExpression;
    /** export 关键字 Token */
    exportToken?: SlimeJavascriptExportToken;
    /** default 关键字 Token */
    defaultToken?: SlimeJavascriptDefaultToken;
}

export interface SlimeJavascriptExportAllDeclaration extends SlimeJavascriptBaseModuleDeclaration, Omit<SlimeJavascriptExtends<ESTree.ExportAllDeclaration>, 'exported' | 'source'>, SlimeJavascriptSemicolonTokens {
    type: typeof SlimeJavascriptAstTypeName.ExportAllDeclaration;
    exported: SlimeJavascriptIdentifier | SlimeJavascriptLiteral | null;
    source: SlimeJavascriptLiteral;
    /** export 关键字 Token */
    exportToken?: SlimeJavascriptExportToken;
    /** * Token */
    asteriskToken?: SlimeJavascriptAsteriskToken;
    /** as 关键字 Token */
    asToken?: SlimeJavascriptAsToken;
    /** from 关键字 Token */
    fromToken?: SlimeJavascriptFromToken;
}

export interface SlimeJavascriptAwaitExpression extends SlimeJavascriptBaseExpression, Omit<SlimeJavascriptExtends<ESTree.AwaitExpression>, 'argument'> {
    type: typeof SlimeJavascriptAstTypeName.AwaitExpression;
    argument: SlimeJavascriptExpression;
    /** await 关键字 Token */
    awaitToken?: SlimeJavascriptAwaitToken;
}
