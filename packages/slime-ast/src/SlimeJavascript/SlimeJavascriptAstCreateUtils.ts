/**
 * SlimeJavascriptAstCreateUtils.ts - AST 节点创建工厂
 *
 * 为每个 AST 节点类型提供创建方法
 * Token 创建方法请使用 SlimeJavascriptTokenCreateUtils.ts
 * 与 SlimeJavascriptAstNode.ts 中的 AST 类型一一对应
 */

import {
  // Base types
  type SlimeJavascriptBaseNode,
  SlimeJavascriptProgramSourceType,

  // Program
  type SlimeJavascriptProgram,
  type SlimeJavascriptDirective,

  // Statements
  type SlimeJavascriptStatement,
  type SlimeJavascriptBlockStatement,
  type SlimeJavascriptEmptyStatement,
  type SlimeJavascriptExpressionStatement,
  type SlimeJavascriptIfStatement,
  type SlimeJavascriptLabeledStatement,
  type SlimeJavascriptBreakStatement,
  type SlimeJavascriptContinueStatement,
  type SlimeJavascriptWithStatement,
  type SlimeJavascriptSwitchStatement,
  type SlimeJavascriptReturnStatement,
  type SlimeJavascriptThrowStatement,
  type SlimeJavascriptTryStatement,
  type SlimeJavascriptWhileStatement,
  type SlimeJavascriptDoWhileStatement,
  type SlimeJavascriptForStatement,
  type SlimeJavascriptForInStatement,
  type SlimeJavascriptForOfStatement,
  type SlimeJavascriptDebuggerStatement,
  type SlimeJavascriptStaticBlock,
  type SlimeJavascriptSwitchCase,
  type SlimeJavascriptCatchClause,

  // Declarations
  type SlimeJavascriptDeclaration,
  type SlimeJavascriptFunctionDeclaration,
  type SlimeJavascriptVariableDeclaration,
  type SlimeJavascriptVariableDeclarator,
  type SlimeJavascriptClassDeclaration,
  type SlimeJavascriptMaybeNamedFunctionDeclaration,
  type SlimeJavascriptMaybeNamedClassDeclaration,

  // Expressions
  type SlimeJavascriptExpression,
  type SlimeJavascriptThisExpression,
  type SlimeJavascriptArrayExpression,
  type SlimeJavascriptObjectExpression,
  type SlimeJavascriptFunctionExpression,
  type SlimeJavascriptArrowFunctionExpression,
  type SlimeJavascriptYieldExpression,
  type SlimeJavascriptAwaitExpression,
  type SlimeJavascriptUnaryExpression,
  type SlimeJavascriptBinaryExpression,
  type SlimeJavascriptLogicalExpression,
  type SlimeJavascriptAssignmentExpression,
  type SlimeJavascriptUpdateExpression,
  type SlimeJavascriptConditionalExpression,
  type SlimeJavascriptSimpleCallExpression,
  type SlimeJavascriptNewExpression,
  type SlimeJavascriptMemberExpression,
  type SlimeJavascriptChainExpression,
  type SlimeJavascriptChainElement,
  type SlimeJavascriptSequenceExpression,
  type SlimeJavascriptTemplateLiteral,
  type SlimeJavascriptTaggedTemplateExpression,
  type SlimeJavascriptTemplateElement,
  type SlimeJavascriptMetaProperty,
  type SlimeJavascriptImportExpression,
  type SlimeJavascriptClassExpression,

  // Literals
  type SlimeJavascriptLiteral,
  type SlimeJavascriptSimpleLiteral,
  type SlimeJavascriptRegExpLiteral,
  type SlimeJavascriptBigIntLiteral,
  type SlimeJavascriptStringLiteral,
  type SlimeJavascriptNumericLiteral,
  type SlimeJavascriptBooleanLiteral,
  type SlimeJavascriptNullLiteral,

  // Patterns
  type SlimeJavascriptPattern,
  type SlimeJavascriptObjectPattern,
  type SlimeJavascriptArrayPattern,
  type SlimeJavascriptRestElement,
  type SlimeJavascriptAssignmentPattern,
  type SlimeJavascriptAssignmentProperty,

  // Properties
  type SlimeJavascriptProperty,
  type SlimeJavascriptPropertyDefinition,
  type SlimeJavascriptSpreadElement,

  // Wrapper types (for comma token association)
  type SlimeJavascriptArrayElement,
  type SlimeJavascriptObjectPropertyItem,
  type SlimeJavascriptFunctionParam,
  type SlimeJavascriptCallArgument,
  type SlimeJavascriptArrayPatternElement,
  type SlimeJavascriptObjectPatternProperty,
  type SlimeJavascriptImportSpecifierItem,
  type SlimeJavascriptExportSpecifierItem,

  // Classes
  type SlimeJavascriptClassBody,
  type SlimeJavascriptMethodDefinition,

  // Modules
  type SlimeJavascriptModuleDeclaration,
  type SlimeJavascriptImportDeclaration,
  type SlimeJavascriptImportSpecifier,
  type SlimeJavascriptImportDefaultSpecifier,
  type SlimeJavascriptImportNamespaceSpecifier,
  type SlimeJavascriptExportNamedDeclaration,
  type SlimeJavascriptExportDefaultDeclaration,
  type SlimeJavascriptExportAllDeclaration,
  type SlimeJavascriptExportSpecifier,

  // Special nodes
  type SlimeJavascriptSuper,
  type SlimeJavascriptIdentifier,
  type SlimeJavascriptPrivateIdentifier,

  // Token types
  type SlimeJavascriptVariableDeclarationKindToken,
  type SlimeJavascriptLBraceToken,
  type SlimeJavascriptRBraceToken,
  type SlimeJavascriptLBracketToken,
  type SlimeJavascriptRBracketToken,
  type SlimeJavascriptLParenToken,
  type SlimeJavascriptRParenToken,
  type SlimeJavascriptDotToken,
  type SlimeJavascriptColonToken,
  type SlimeJavascriptSemicolonToken,
  type SlimeJavascriptCommaToken,
  type SlimeJavascriptFromToken,
  type SlimeJavascriptExportToken,
  type SlimeJavascriptImportToken,
  type SlimeJavascriptAssignToken,
  type SlimeJavascriptArrowToken,
  type SlimeJavascriptQuestionToken,
  type SlimeJavascriptEllipsisToken,
  type SlimeJavascriptAsteriskToken,
  type SlimeJavascriptAsToken,
  type SlimeJavascriptIfToken,
  type SlimeJavascriptElseToken,
  type SlimeJavascriptForToken,
  type SlimeJavascriptWhileToken,
  type SlimeJavascriptDoToken,
  type SlimeJavascriptInToken,
  type SlimeJavascriptOfToken,
  type SlimeJavascriptSwitchToken,
  type SlimeJavascriptCaseToken,
  type SlimeJavascriptDefaultToken,
  type SlimeJavascriptBreakToken,
  type SlimeJavascriptContinueToken,
  type SlimeJavascriptReturnToken,
  type SlimeJavascriptThrowToken,
  type SlimeJavascriptTryToken,
  type SlimeJavascriptCatchToken,
  type SlimeJavascriptFinallyToken,
  type SlimeJavascriptWithToken,
  type SlimeJavascriptDebuggerToken,
  type SlimeJavascriptNewToken,
  type SlimeJavascriptYieldToken,
  type SlimeJavascriptAwaitToken,
  type SlimeJavascriptFunctionToken,
  type SlimeJavascriptAsyncToken,
  type SlimeJavascriptClassToken,
  type SlimeJavascriptExtendsToken,
  type SlimeJavascriptStaticToken,
  type SlimeJavascriptGetToken,
  type SlimeJavascriptSetToken,
  type SlimeJavascriptOptionalChainingToken,

  // Operator tokens
  type SlimeJavascriptBinaryOperatorToken,
  type SlimeJavascriptUnaryOperatorToken,
  type SlimeJavascriptLogicalOperatorToken,
  type SlimeJavascriptAssignmentOperatorToken,
  type SlimeJavascriptUpdateOperatorToken,
} from "./SlimeJavascriptAstNode.ts";

import {SlimeJavascriptAstTypeName} from "./SlimeJavascriptAstTypeName.ts";
import type { SubhutiSourceLocation } from "subhuti";

class SlimeJavascriptAstCreateUtils {
  // ============================================
  // 通用辅助方法
  // ============================================

  commonLocType<T extends SlimeJavascriptBaseNode>(node: T): T {
    if (!node.loc) {
      node.loc = {
        value: null,
        type: node.type,
        start: {
          index: 0,
          line: 0,
          column: 0,
        },
        end: {
          index: 0,
          line: 0,
          column: 0,
        }
      }
    }
    return node
  }

  // ============================================
  // Program
  // ============================================

  createProgram(body: Array<SlimeJavascriptDirective | SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration>, sourceType: SlimeJavascriptProgramSourceType = SlimeJavascriptProgramSourceType.Script): SlimeJavascriptProgram {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Program,
      sourceType: sourceType,
      body: body
    })
  }

  // ============================================
  // Expressions
  // ============================================

  createMemberExpression(object: SlimeJavascriptExpression | SlimeJavascriptSuper, dot: SlimeJavascriptDotToken, property?: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier): SlimeJavascriptMemberExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.MemberExpression,
      object: object,
      dot: dot,
      property: property,
      computed: false,
      optional: false,
      loc: object.loc
    })
  }

  createArrayExpression(
    elements?: Array<SlimeJavascriptArrayElement>,
    loc?: SubhutiSourceLocation,
    lBracketToken?: SlimeJavascriptLBracketToken,
    rBracketToken?: SlimeJavascriptRBracketToken
  ): SlimeJavascriptArrayExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ArrayExpression,
      elements: elements || [],
      lBracketToken: lBracketToken,
      rBracketToken: rBracketToken,
      loc: loc
    })
  }

  /** 创建数组元素包装 */
  createArrayElement(
    element: SlimeJavascriptExpression | SlimeJavascriptSpreadElement | null,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptArrayElement {
    return { element, commaToken }
  }

  createPropertyAst(key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier, value: SlimeJavascriptExpression | SlimeJavascriptPattern): SlimeJavascriptProperty {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Property,
      key: key,
      value: value,
      kind: "init",
      method: false,
      shorthand: false,
      computed: false,
    })
  }

  createObjectExpression(
    properties: Array<SlimeJavascriptObjectPropertyItem> = [],
    loc?: SubhutiSourceLocation,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptObjectExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ObjectExpression,
      properties: properties,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  /** 创建对象属性包装 */
  createObjectPropertyItem(
    property: SlimeJavascriptProperty | SlimeJavascriptSpreadElement,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptObjectPropertyItem {
    return { property, commaToken }
  }

  createParenthesizedExpression(expression: SlimeJavascriptExpression, loc?: SubhutiSourceLocation): any {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ParenthesizedExpression,
      expression: expression,
      loc: loc
    })
  }

  createClassExpression(id?: SlimeJavascriptIdentifier | null, superClass?: SlimeJavascriptExpression | null, body?: SlimeJavascriptClassBody, loc?: SubhutiSourceLocation): SlimeJavascriptClassExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ClassExpression,  // 节点类型
      id: id,                               // 类名（可选，匿名类为 null）
      body: body,                           // 类体（包含方法和属性）
      superClass: superClass,               // 父类表达式（可选，没有 extends 时为 null 或 undefined）
      loc: loc                              // 源码位置信息
    })
  }

  createCallExpression(
    callee: SlimeJavascriptExpression | SlimeJavascriptSuper,
    args: Array<SlimeJavascriptCallArgument>,
    loc?: SubhutiSourceLocation,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptSimpleCallExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.CallExpression,
      callee: callee,
      arguments: args,
      optional: false,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  /** 创建调用参数包装 */
  createCallArgument(
    argument: SlimeJavascriptExpression | SlimeJavascriptSpreadElement,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptCallArgument {
    return { argument, commaToken }
  }

  /** 创建函数参数包装 */
  createFunctionParam(
    param: SlimeJavascriptPattern,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptFunctionParam {
    return { param, commaToken }
  }

  createThisExpression(loc?: SubhutiSourceLocation): SlimeJavascriptThisExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ThisExpression,
      loc: loc
    })
  }

  createChainExpression(expression: SlimeJavascriptChainElement, loc?: SubhutiSourceLocation): SlimeJavascriptChainExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ChainExpression,
      expression: expression,
      loc: loc
    })
  }

  createSequenceExpression(expressions: SlimeJavascriptExpression[], loc?: SubhutiSourceLocation): SlimeJavascriptSequenceExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.SequenceExpression,
      expressions: expressions,
      loc: loc
    })
  }

  createUnaryExpression(
    operator: SlimeJavascriptUnaryOperatorToken,
    argument: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptUnaryExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.UnaryExpression,
      operator: operator,
      prefix: true,
      argument: argument,
      loc: loc
    })
  }

  createBinaryExpression(
    operator: SlimeJavascriptBinaryOperatorToken,
    left: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier,
    right: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptBinaryExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.BinaryExpression,
      operator: operator,
      left: left,
      right: right,
      loc: loc
    })
  }

  createAssignmentExpression(
    operator: SlimeJavascriptAssignmentOperatorToken,
    left: SlimeJavascriptPattern | SlimeJavascriptMemberExpression,
    right: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptAssignmentExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.AssignmentExpression,
      operator: operator,
      left: left,
      right: right,
      loc: loc
    })
  }

  createUpdateExpression(
    operator: SlimeJavascriptUpdateOperatorToken,
    argument: SlimeJavascriptExpression,
    prefix: boolean,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptUpdateExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.UpdateExpression,
      operator: operator,
      argument: argument,
      prefix: prefix,
      loc: loc
    })
  }

  createLogicalExpression(
    operator: SlimeJavascriptLogicalOperatorToken,
    left: SlimeJavascriptExpression,
    right: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptLogicalExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.LogicalExpression,
      operator: operator,
      left: left,
      right: right,
      loc: loc
    })
  }

  createConditionalExpression(
    test: SlimeJavascriptExpression,
    consequent: SlimeJavascriptExpression,
    alternate: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    questionToken?: SlimeJavascriptQuestionToken,
    colonToken?: SlimeJavascriptColonToken
  ): SlimeJavascriptConditionalExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ConditionalExpression,
      test: test,
      consequent: consequent,
      alternate: alternate,
      questionToken: questionToken,
      colonToken: colonToken,
      loc: loc
    })
  }

  createNewExpression(
    callee: SlimeJavascriptExpression,
    args: Array<SlimeJavascriptCallArgument>,
    loc?: SubhutiSourceLocation,
    newToken?: SlimeJavascriptNewToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptNewExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.NewExpression,
      callee: callee,
      arguments: args,
      newToken: newToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createArrowFunctionExpression(
    body: SlimeJavascriptBlockStatement | SlimeJavascriptExpression,
    params: SlimeJavascriptFunctionParam[],
    expression: boolean,
    async: boolean = false,
    loc?: SubhutiSourceLocation,
    arrowToken?: SlimeJavascriptArrowToken,
    asyncToken?: SlimeJavascriptAsyncToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptArrowFunctionExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ArrowFunctionExpression,
      body: body,
      params: params,
      expression: expression,
      async: async,
      arrowToken: arrowToken,
      asyncToken: asyncToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createYieldExpression(
    argument?: SlimeJavascriptExpression | null,
    delegate: boolean = false,
    loc?: SubhutiSourceLocation,
    yieldToken?: SlimeJavascriptYieldToken,
    asteriskToken?: SlimeJavascriptAsteriskToken
  ): SlimeJavascriptYieldExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.YieldExpression,
      argument: argument,
      delegate: delegate,
      yieldToken: yieldToken,
      asteriskToken: asteriskToken,
      loc: loc
    })
  }

  createTaggedTemplateExpression(
    tag: SlimeJavascriptExpression,
    quasi: SlimeJavascriptTemplateLiteral,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptTaggedTemplateExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.TaggedTemplateExpression,
      tag: tag,
      quasi: quasi,
      loc: loc
    })
  }

  createAwaitExpression(
    argument: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    awaitToken?: SlimeJavascriptAwaitToken
  ): SlimeJavascriptAwaitExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.AwaitExpression,
      argument: argument,
      awaitToken: awaitToken,
      loc: loc
    })
  }

  createMetaProperty(
    meta: SlimeJavascriptIdentifier,
    property: SlimeJavascriptIdentifier,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptMetaProperty {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.MetaProperty,
      meta: meta,
      property: property,
      loc: loc
    })
  }

  createImportExpression(
    source: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    importToken?: SlimeJavascriptImportToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptImportExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ImportExpression,
      source: source,
      importToken: importToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createSuper(loc?: SubhutiSourceLocation): SlimeJavascriptSuper {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Super,
      loc: loc
    })
  }

  createPrivateIdentifier(name: string, loc?: SubhutiSourceLocation): SlimeJavascriptPrivateIdentifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.PrivateIdentifier,
      name: name,
      loc: loc
    })
  }

  // ============================================
  // Statements
  // ============================================

  createBlockStatement(body: SlimeJavascriptStatement[], loc?: SubhutiSourceLocation, lBraceToken?: SlimeJavascriptLBraceToken, rBraceToken?: SlimeJavascriptRBraceToken): SlimeJavascriptBlockStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.BlockStatement,
      body: body,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  createEmptyStatement(loc?: SubhutiSourceLocation, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptEmptyStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.EmptyStatement,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createExpressionStatement(expression: SlimeJavascriptExpression, loc?: SubhutiSourceLocation, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptExpressionStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExpressionStatement,
      expression: expression,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createIfStatement(
    test: SlimeJavascriptExpression,
    consequent: SlimeJavascriptStatement,
    alternate?: SlimeJavascriptStatement | null,
    loc?: SubhutiSourceLocation,
    ifToken?: SlimeJavascriptIfToken,
    elseToken?: SlimeJavascriptElseToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptIfStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.IfStatement,
      test: test,
      consequent: consequent,
      alternate: alternate,
      ifToken: ifToken,
      elseToken: elseToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createLabeledStatement(label: SlimeJavascriptIdentifier, body: SlimeJavascriptStatement, loc?: SubhutiSourceLocation): SlimeJavascriptLabeledStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.LabeledStatement,
      label: label,
      body: body,
      loc: loc
    })
  }

  createBreakStatement(label?: SlimeJavascriptIdentifier | null, loc?: SubhutiSourceLocation, breakToken?: SlimeJavascriptBreakToken, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptBreakStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.BreakStatement,
      label: label,
      breakToken: breakToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createContinueStatement(label?: SlimeJavascriptIdentifier | null, loc?: SubhutiSourceLocation, continueToken?: SlimeJavascriptContinueToken, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptContinueStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ContinueStatement,
      label: label,
      continueToken: continueToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createWithStatement(
    object: SlimeJavascriptExpression,
    body: SlimeJavascriptStatement,
    loc?: SubhutiSourceLocation,
    withToken?: SlimeJavascriptWithToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptWithStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.WithStatement,
      object: object,
      body: body,
      withToken: withToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createSwitchStatement(
    discriminant: SlimeJavascriptExpression,
    cases: SlimeJavascriptSwitchCase[],
    loc?: SubhutiSourceLocation,
    switchToken?: SlimeJavascriptSwitchToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptSwitchStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.SwitchStatement,
      discriminant: discriminant,
      cases: cases,
      switchToken: switchToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  createReturnStatement(argument: SlimeJavascriptExpression | null | undefined, loc?: SubhutiSourceLocation, returnToken?: SlimeJavascriptReturnToken, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptReturnStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ReturnStatement,
      argument: argument,
      returnToken: returnToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createThrowStatement(argument: SlimeJavascriptExpression, loc?: SubhutiSourceLocation, throwToken?: SlimeJavascriptThrowToken, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptThrowStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ThrowStatement,
      argument: argument,
      throwToken: throwToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createTryStatement(
    block: SlimeJavascriptBlockStatement,
    handler?: SlimeJavascriptCatchClause | null,
    finalizer?: SlimeJavascriptBlockStatement | null,
    loc?: SubhutiSourceLocation,
    tryToken?: SlimeJavascriptTryToken,
    finallyToken?: SlimeJavascriptFinallyToken
  ): SlimeJavascriptTryStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.TryStatement,
      block: block,
      handler: handler,
      finalizer: finalizer,
      tryToken: tryToken,
      finallyToken: finallyToken,
      loc: loc
    })
  }

  createWhileStatement(
    test: SlimeJavascriptExpression,
    body: SlimeJavascriptStatement,
    loc?: SubhutiSourceLocation,
    whileToken?: SlimeJavascriptWhileToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptWhileStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.WhileStatement,
      test: test,
      body: body,
      whileToken: whileToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createDoWhileStatement(
    body: SlimeJavascriptStatement,
    test: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    doToken?: SlimeJavascriptDoToken,
    whileToken?: SlimeJavascriptWhileToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken,
    semicolonToken?: SlimeJavascriptSemicolonToken
  ): SlimeJavascriptDoWhileStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.DoWhileStatement,
      body: body,
      test: test,
      doToken: doToken,
      whileToken: whileToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createForStatement(
    body: SlimeJavascriptStatement,
    init?: SlimeJavascriptVariableDeclaration | SlimeJavascriptExpression | null,
    test?: SlimeJavascriptExpression | null,
    update?: SlimeJavascriptExpression | null,
    loc?: SubhutiSourceLocation,
    forToken?: SlimeJavascriptForToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken,
    semicolon1Token?: SlimeJavascriptSemicolonToken,
    semicolon2Token?: SlimeJavascriptSemicolonToken
  ): SlimeJavascriptForStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ForStatement,
      init: init,
      test: test,
      update: update,
      body: body,
      forToken: forToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      semicolon1Token: semicolon1Token,
      semicolon2Token: semicolon2Token,
      loc: loc
    })
  }

  createForInStatement(
    left: SlimeJavascriptVariableDeclaration | SlimeJavascriptPattern,
    right: SlimeJavascriptExpression,
    body: SlimeJavascriptStatement,
    loc?: SubhutiSourceLocation,
    forToken?: SlimeJavascriptForToken,
    inToken?: SlimeJavascriptInToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptForInStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ForInStatement,
      left: left,
      right: right,
      body: body,
      forToken: forToken,
      inToken: inToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createForOfStatement(
    left: SlimeJavascriptVariableDeclaration | SlimeJavascriptPattern,
    right: SlimeJavascriptExpression,
    body: SlimeJavascriptStatement,
    isAwait: boolean = false,
    loc?: SubhutiSourceLocation,
    forToken?: SlimeJavascriptForToken,
    ofToken?: SlimeJavascriptOfToken,
    awaitToken?: SlimeJavascriptAwaitToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptForOfStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ForOfStatement,
      left: left,
      right: right,
      body: body,
      await: isAwait,
      forToken: forToken,
      ofToken: ofToken,
      awaitToken: awaitToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createDebuggerStatement(loc?: SubhutiSourceLocation, debuggerToken?: SlimeJavascriptDebuggerToken, semicolonToken?: SlimeJavascriptSemicolonToken): SlimeJavascriptDebuggerStatement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.DebuggerStatement,
      debuggerToken: debuggerToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createSwitchCase(
    consequent: SlimeJavascriptStatement[],
    test?: SlimeJavascriptExpression | null,
    loc?: SubhutiSourceLocation,
    caseToken?: SlimeJavascriptCaseToken,
    defaultToken?: SlimeJavascriptDefaultToken,
    colonToken?: SlimeJavascriptColonToken
  ): SlimeJavascriptSwitchCase {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.SwitchCase,
      test: test,
      consequent: consequent,
      caseToken: caseToken,
      defaultToken: defaultToken,
      colonToken: colonToken,
      loc: loc
    })
  }

  createCatchClause(
    body: SlimeJavascriptBlockStatement,
    param?: SlimeJavascriptPattern | null,
    loc?: SubhutiSourceLocation,
    catchToken?: SlimeJavascriptCatchToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken
  ): SlimeJavascriptCatchClause {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.CatchClause,
      param: param,
      body: body,
      catchToken: catchToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      loc: loc
    })
  }

  createStaticBlock(body: SlimeJavascriptStatement[], loc?: SubhutiSourceLocation, lBraceToken?: SlimeJavascriptLBraceToken, rBraceToken?: SlimeJavascriptRBraceToken): SlimeJavascriptStaticBlock {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.StaticBlock,
      body: body,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  // ============================================
  // Functions
  // ============================================

  createFunctionExpression(
    body: SlimeJavascriptBlockStatement,
    id?: SlimeJavascriptIdentifier | null,
    params?: SlimeJavascriptFunctionParam[],
    generator?: boolean,
    async?: boolean,
    loc?: SubhutiSourceLocation,
    functionToken?: SlimeJavascriptFunctionToken,
    asyncToken?: SlimeJavascriptAsyncToken,
    asteriskToken?: SlimeJavascriptAsteriskToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptFunctionExpression {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.FunctionExpression,
      params: params || [],
      id: id,
      body: body,
      generator: generator || false,
      async: async || false,
      functionToken: functionToken,
      asyncToken: asyncToken,
      asteriskToken: asteriskToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  // ============================================
  // Declarations
  // ============================================

  createVariableDeclaration(kind: SlimeJavascriptVariableDeclarationKindToken, declarations: SlimeJavascriptVariableDeclarator[], loc?: SubhutiSourceLocation): SlimeJavascriptVariableDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.VariableDeclaration,
      declarations: declarations,
      kind: kind,
      loc: loc
    })
  }

  createVariableDeclarator(id: SlimeJavascriptPattern, assignToken?: SlimeJavascriptAssignToken, init?: SlimeJavascriptExpression | null, loc?: SubhutiSourceLocation): SlimeJavascriptVariableDeclarator {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.VariableDeclarator,
      id: id,
      assignToken: assignToken,
      init: init,
      loc: loc
    })
  }

  // ============================================
  // Patterns
  // ============================================

  createRestElement(
    argument: SlimeJavascriptPattern,
    loc?: SubhutiSourceLocation,
    ellipsisToken?: SlimeJavascriptEllipsisToken
  ): SlimeJavascriptRestElement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.RestElement,
      argument: argument,
      ellipsisToken: ellipsisToken,
      loc: loc
    })
  }

  createSpreadElement(
    argument: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    ellipsisToken?: SlimeJavascriptEllipsisToken
  ): SlimeJavascriptSpreadElement {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.SpreadElement,
      argument: argument,
      ellipsisToken: ellipsisToken,
      loc: loc
    })
  }

  createObjectPattern(
    properties: Array<SlimeJavascriptObjectPatternProperty>,
    loc?: SubhutiSourceLocation,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptObjectPattern {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ObjectPattern,
      properties: properties,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  /** 创建解构对象属性包装 */
  createObjectPatternProperty(
    property: SlimeJavascriptAssignmentProperty | SlimeJavascriptRestElement,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptObjectPatternProperty {
    return { property, commaToken }
  }

  createArrayPattern(
    elements: Array<SlimeJavascriptArrayPatternElement>,
    loc?: SubhutiSourceLocation,
    lBracketToken?: SlimeJavascriptLBracketToken,
    rBracketToken?: SlimeJavascriptRBracketToken
  ): SlimeJavascriptArrayPattern {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ArrayPattern,
      elements: elements,
      lBracketToken: lBracketToken,
      rBracketToken: rBracketToken,
      loc: loc
    })
  }

  /** 创建解构数组元素包装 */
  createArrayPatternElement(
    element: SlimeJavascriptPattern | null,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptArrayPatternElement {
    return { element, commaToken }
  }

  createAssignmentPattern(
    left: SlimeJavascriptPattern,
    right: SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptAssignmentPattern {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.AssignmentPattern,
      left: left,
      right: right,
      loc: loc
    })
  }

  createAssignmentProperty(
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier,
    value: SlimeJavascriptPattern,
    shorthand: boolean = false,
    computed: boolean = false,
    loc?: SubhutiSourceLocation,
    colonToken?: SlimeJavascriptColonToken,
    lBracketToken?: SlimeJavascriptLBracketToken,
    rBracketToken?: SlimeJavascriptRBracketToken
  ): SlimeJavascriptAssignmentProperty {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Property,
      key: key,
      value: value,
      kind: "init",
      method: false,
      shorthand: shorthand,
      computed: computed,
      colonToken: colonToken,
      lBracketToken: lBracketToken,
      rBracketToken: rBracketToken,
      loc: loc
    })
  }

  // ============================================
  // Modules
  // ============================================

  createImportDeclaration(
    specifiers: Array<SlimeJavascriptImportSpecifierItem>,
    source: SlimeJavascriptStringLiteral,
    loc?: SubhutiSourceLocation,
    importToken?: SlimeJavascriptImportToken,
    fromToken?: SlimeJavascriptFromToken,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken,
    semicolonToken?: SlimeJavascriptSemicolonToken,
    attributes?: any[],  // ES2025 Import Attributes
    withToken?: any
  ): SlimeJavascriptImportDeclaration {
    const decl: any = {
      type: SlimeJavascriptAstTypeName.ImportDeclaration,
      source: source,
      specifiers: specifiers,
      importToken: importToken,
      fromToken: fromToken,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      semicolonToken: semicolonToken,
      loc: loc
    }
    // ES2025: 添加 attributes（如果有 withToken，即使 attributes 为空也要添加）
    if (withToken) {
      decl.attributes = attributes || []
      decl.withToken = withToken
    }
    return this.commonLocType(decl)
  }

  /** 创建 import specifier 包装 */
  createImportSpecifierItem(
    specifier: SlimeJavascriptImportSpecifier | SlimeJavascriptImportDefaultSpecifier | SlimeJavascriptImportNamespaceSpecifier,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptImportSpecifierItem {
    return { specifier, commaToken }
  }

  createImportSpecifier(
    local: SlimeJavascriptIdentifier,
    imported: SlimeJavascriptIdentifier | SlimeJavascriptLiteral,
    loc?: SubhutiSourceLocation,
    asToken?: SlimeJavascriptAsToken
  ): SlimeJavascriptImportSpecifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ImportSpecifier,
      local: local,
      imported: imported,
      asToken: asToken,
      loc: loc
    })
  }

  createImportDefaultSpecifier(local: SlimeJavascriptIdentifier, loc?: SubhutiSourceLocation): SlimeJavascriptImportDefaultSpecifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ImportDefaultSpecifier,
      local: local,
      loc: loc
    })
  }

  createImportNamespaceSpecifier(
    local: SlimeJavascriptIdentifier,
    loc?: SubhutiSourceLocation,
    asteriskToken?: SlimeJavascriptAsteriskToken,
    asToken?: SlimeJavascriptAsToken
  ): SlimeJavascriptImportNamespaceSpecifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ImportNamespaceSpecifier,
      local: local,
      asteriskToken: asteriskToken,
      asToken: asToken,
      loc: loc
    })
  }

  createExportDefaultDeclaration(
    declaration: SlimeJavascriptMaybeNamedFunctionDeclaration | SlimeJavascriptMaybeNamedClassDeclaration | SlimeJavascriptExpression,
    loc?: SubhutiSourceLocation,
    exportToken?: SlimeJavascriptExportToken,
    defaultToken?: SlimeJavascriptDefaultToken
  ): SlimeJavascriptExportDefaultDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExportDefaultDeclaration,
      declaration: declaration,
      exportToken: exportToken,
      defaultToken: defaultToken,
      loc: loc
    })
  }

  createExportNamedDeclaration(
    declaration: SlimeJavascriptDeclaration | null,
    specifiers: SlimeJavascriptExportSpecifierItem[],
    source?: SlimeJavascriptLiteral | null,
    loc?: SubhutiSourceLocation,
    exportToken?: SlimeJavascriptExportToken,
    fromToken?: SlimeJavascriptFromToken,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken,
    semicolonToken?: SlimeJavascriptSemicolonToken
  ): SlimeJavascriptExportNamedDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExportNamedDeclaration,
      declaration: declaration,
      specifiers: specifiers,
      source: source,
      exportToken: exportToken,
      fromToken: fromToken,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  /** 创建 export specifier 包装 */
  createExportSpecifierItem(
    specifier: SlimeJavascriptExportSpecifier,
    commaToken?: SlimeJavascriptCommaToken
  ): SlimeJavascriptExportSpecifierItem {
    return { specifier, commaToken }
  }

  createExportSpecifier(
    local: SlimeJavascriptIdentifier | SlimeJavascriptLiteral,
    exported: SlimeJavascriptIdentifier | SlimeJavascriptLiteral,
    loc?: SubhutiSourceLocation,
    asToken?: SlimeJavascriptAsToken
  ): SlimeJavascriptExportSpecifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExportSpecifier,
      local: local,
      exported: exported,
      asToken: asToken,
      loc: loc
    })
  }

  createExportAllDeclaration(
    source: SlimeJavascriptLiteral,
    exported?: SlimeJavascriptIdentifier | SlimeJavascriptLiteral | null,
    loc?: SubhutiSourceLocation,
    exportToken?: SlimeJavascriptExportToken,
    asteriskToken?: SlimeJavascriptAsteriskToken,
    asToken?: SlimeJavascriptAsToken,
    fromToken?: SlimeJavascriptFromToken,
    semicolonToken?: SlimeJavascriptSemicolonToken
  ): SlimeJavascriptExportAllDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExportAllDeclaration,
      source: source,
      exported: exported,
      exportToken: exportToken,
      asteriskToken: asteriskToken,
      asToken: asToken,
      fromToken: fromToken,
      semicolonToken: semicolonToken,
      loc: loc
    })
  }

  createDirective(
    expression: SlimeJavascriptLiteral,
    directive: string,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptDirective {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ExpressionStatement,
      expression: expression,
      directive: directive,
      loc: loc
    })
  }

  // ============================================
  // Classes
  // ============================================

  createClassDeclaration(
    id: SlimeJavascriptIdentifier | null,
    body: SlimeJavascriptClassBody,
    superClass?: SlimeJavascriptExpression | null,
    loc?: SubhutiSourceLocation,
    classToken?: SlimeJavascriptClassToken,
    extendsToken?: SlimeJavascriptExtendsToken
  ): SlimeJavascriptClassDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ClassDeclaration,
      id: id,
      body: body,
      superClass: superClass,
      classToken: classToken,
      extendsToken: extendsToken,
      loc: loc
    })
  }

  createClassBody(
    body: Array<SlimeJavascriptMethodDefinition | SlimeJavascriptPropertyDefinition | SlimeJavascriptStaticBlock>,
    loc?: SubhutiSourceLocation,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptClassBody {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.ClassBody,
      body: body,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  createFunctionDeclaration(
    id: SlimeJavascriptIdentifier | null,
    params: SlimeJavascriptFunctionParam[],
    body: SlimeJavascriptBlockStatement,
    generator: boolean = false,
    async: boolean = false,
    loc?: SubhutiSourceLocation,
    functionToken?: SlimeJavascriptFunctionToken,
    asyncToken?: SlimeJavascriptAsyncToken,
    asteriskToken?: SlimeJavascriptAsteriskToken,
    lParenToken?: SlimeJavascriptLParenToken,
    rParenToken?: SlimeJavascriptRParenToken,
    lBraceToken?: SlimeJavascriptLBraceToken,
    rBraceToken?: SlimeJavascriptRBraceToken
  ): SlimeJavascriptFunctionDeclaration {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.FunctionDeclaration,
      id: id,
      params: params,
      body: body,
      generator: generator,
      async: async,
      functionToken: functionToken,
      asyncToken: asyncToken,
      asteriskToken: asteriskToken,
      lParenToken: lParenToken,
      rParenToken: rParenToken,
      lBraceToken: lBraceToken,
      rBraceToken: rBraceToken,
      loc: loc
    })
  }

  createIdentifier(name: string, loc?: SubhutiSourceLocation): SlimeJavascriptIdentifier {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Identifier,
      name: name,
      loc: loc
    })
  }

  createLiteral(value?: number | string): SlimeJavascriptLiteral {
    let ast: SlimeJavascriptLiteral
    if (value === undefined) {
      // ast = this.createNullLiteralToken()
    } else if (typeof value === "string") {
      ast = this.createStringLiteral(value)
    } else if (typeof value === "number") {
      ast = this.createNumericLiteral(value)
    }
    return ast
  }


  createNullLiteralToken(): SlimeJavascriptNullLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      value: null
    })
  }


  createStringLiteral(value: string, loc?: SubhutiSourceLocation, raw?: string): SlimeJavascriptStringLiteral {
    // 检查 value 是否已经有引号
    const hasQuotes = /^['"].*['"]$/.test(value)
    const cleanValue = value.replace(/^['"]|['"]$/g, '')
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      value: cleanValue,
      raw: raw || (hasQuotes ? value : `'${value}'`),  // 如果已有引号就保留，否则自动加引号
      loc: loc
    })
  }

  createNumericLiteral(value: number, raw?: string): SlimeJavascriptNumericLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      value: value,
      raw: raw || String(value)  // 保存原始值（保留格式如 0xFF）
    })
  }

  createBooleanLiteral(value: boolean, loc?: SubhutiSourceLocation): SlimeJavascriptBooleanLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      value: value,
      loc: loc
    })
  }

  createRegExpLiteral(
    pattern: string,
    flags: string,
    raw?: string,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptRegExpLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      regex: {
        pattern: pattern,
        flags: flags
      },
      raw: raw || `/${pattern}/${flags}`,
      loc: loc
    })
  }

  createBigIntLiteral(
    bigint: string,
    raw?: string,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptBigIntLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.Literal,
      bigint: bigint,
      raw: raw || `${bigint}n`,
      loc: loc
    })
  }

  createTemplateLiteral(quasis: SlimeJavascriptTemplateElement[], expressions: SlimeJavascriptExpression[], loc?: SubhutiSourceLocation): SlimeJavascriptTemplateLiteral {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.TemplateLiteral,
      quasis: quasis,
      expressions: expressions,
      loc: loc
    })
  }

  createTemplateElement(tail: boolean, raw: string, cooked?: string | null, loc?: SubhutiSourceLocation): any {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.TemplateElement,
      tail: tail,
      value: {
        raw: raw,
        cooked: cooked !== undefined ? cooked : raw
      },
      loc: loc
    })
  }

  createMethodDefinition(
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier,
    value: SlimeJavascriptFunctionExpression,
    kind: "constructor" | "method" | "get" | "set" = "method",
    computed: boolean = false,
    isStatic: boolean = false,
    loc?: SubhutiSourceLocation,
    staticToken?: SlimeJavascriptStaticToken,
    getToken?: SlimeJavascriptGetToken,
    setToken?: SlimeJavascriptSetToken,
    asyncToken?: SlimeJavascriptAsyncToken,
    asteriskToken?: SlimeJavascriptAsteriskToken
  ): SlimeJavascriptMethodDefinition {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.MethodDefinition,
      key: key,
      value: value,
      kind: kind,
      computed: computed,
      static: isStatic,
      staticToken: staticToken,
      getToken: getToken,
      setToken: setToken,
      asyncToken: asyncToken,
      asteriskToken: asteriskToken,
      loc: loc
    })
  }

  createPropertyDefinition(
    key: SlimeJavascriptExpression | SlimeJavascriptPrivateIdentifier,
    value?: SlimeJavascriptExpression | null,
    computed: boolean = false,
    isStatic: boolean = false,
    loc?: SubhutiSourceLocation
  ): SlimeJavascriptPropertyDefinition {
    return this.commonLocType({
      type: SlimeJavascriptAstTypeName.PropertyDefinition,
      key: key,
      value: value ?? null,
      computed: computed,
      static: isStatic,
      loc: loc
    })
  }
}

const SlimeJavascriptAstCreateUtil = new SlimeJavascriptAstCreateUtils()
export default SlimeJavascriptAstCreateUtil

