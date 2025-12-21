import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, SlimeBlockStatement, type SlimeStatement, SlimeNodeType, SlimeTokenCreate, SlimeVariableDeclaration
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { checkCstName, getUtil } from "../core/CstToAstContext";


/**
 * 控制流语句相关的 CST to AST 转换
 */
export class ControlFlowCstToAst {

    static createTryStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.TryStatement?.name);
        let tryToken: any, finallyToken: any
        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Try' || child.value === 'try') tryToken = SlimeTokenCreate.createTryToken(child.loc)
            else if (child.name === 'Finally' || child.value === 'finally') finallyToken = SlimeTokenCreate.createFinallyToken(child.loc)
        }
        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        const catchCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Catch?.name)
        const finallyCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Finally?.name)
        const block = blockCst ? getUtil().createBlockAst(blockCst) : null
        const handler = catchCst ? ControlFlowCstToAst.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? ControlFlowCstToAst.createFinallyAst(finallyCst) : null
        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }

    static createCatchAst(cst: SubhutiCst): any {
        let catchToken: any, lParenToken: any, rParenToken: any
        for (const child of cst.children || []) {
            if (child.name === 'Catch' || child.value === 'catch') catchToken = SlimeTokenCreate.createCatchToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
        }
        const paramCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CatchParameter?.name)
        const blockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        const param = paramCst ? getUtil().createCatchParameterAst(paramCst) : null
        const body = blockCst ? getUtil().createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([])
        return SlimeAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken)
    }

    static createFinallyAst(cst: SubhutiCst): SlimeBlockStatement {
        const blockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        if (blockCst) return getUtil().createBlockAst(blockCst)
        return SlimeAstUtil.createBlockStatement([], cst.loc)
    }

    static createThrowStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name);
        let throwToken: any
        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') { throwToken = SlimeTokenCreate.createThrowToken(child.loc); break }
        }
        const exprCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const argument = exprCst ? getUtil().createExpressionAst(exprCst) : null
        return SlimeAstUtil.createThrowStatement(argument, cst.loc, throwToken)
    }

    static createBreakStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.BreakStatement?.name);
        let breakToken: any, label: any = null
        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') breakToken = SlimeTokenCreate.createBreakToken(child.loc)
            else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                const idCst = child.children?.[0]
                if (idCst) label = SlimeAstUtil.createIdentifier(idCst.value, idCst.loc)
            }
        }
        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken)
    }

    static createContinueStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name);
        let continueToken: any, label: any = null
        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') continueToken = SlimeTokenCreate.createContinueToken(child.loc)
            else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                const idCst = child.children?.[0]
                if (idCst) label = SlimeAstUtil.createIdentifier(idCst.value, idCst.loc)
            }
        }
        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken)
    }

    static createLabelledStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);
        let colonToken: any, label: any = null, body: any = null
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                const idCst = child.children?.[0]
                if (idCst) label = SlimeAstUtil.createIdentifier(idCst.value, idCst.loc)
            } else if (child.name === 'Colon' || child.value === ':') {
                colonToken = SlimeTokenCreate.createColonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelledItem?.name || child.name === 'LabelledItem') {
                const itemChild = child.children?.[0]
                if (itemChild) body = getUtil().createStatementDeclarationAst(itemChild)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement' ||
                child.name === SlimeParser.prototype.FunctionDeclaration?.name || child.name === 'FunctionDeclaration') {
                body = getUtil().createStatementDeclarationAst(child)
            }
        }
        return SlimeAstUtil.createLabeledStatement(label, body, cst.loc)
    }

    static createWithStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WithStatement?.name);
        let withToken: any, lParenToken: any, rParenToken: any, object: any = null, body: any = null
        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') withToken = SlimeTokenCreate.createWithToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression')
                object = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement')
                body = getUtil().createStatementDeclarationAst(child)
        }
        return SlimeAstUtil.createWithStatement(object, body, cst.loc, withToken, lParenToken, rParenToken)
    }

    static createDebuggerStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DebuggerStatement?.name);
        let debuggerToken: any
        for (const child of cst.children || []) {
            if (child.name === 'Debugger' || child.value === 'debugger') { debuggerToken = SlimeTokenCreate.createDebuggerToken(child.loc); break }
        }
        return SlimeAstUtil.createDebuggerStatement(cst.loc, debuggerToken)
    }

    static createIfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.IfStatement?.name);
        let ifToken: any, elseToken: any, lParenToken: any, rParenToken: any
        let test: any = null, consequent: any = null, alternate: any = null
        let foundElse = false
        for (const child of cst.children || []) {
            if (child.name === 'If' || child.value === 'if') ifToken = SlimeTokenCreate.createIfToken(child.loc)
            else if (child.name === 'Else' || child.value === 'else') { elseToken = SlimeTokenCreate.createElseToken(child.loc); foundElse = true }
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') test = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const stmt = getUtil().createStatementDeclarationAst(child)
                if (!foundElse) consequent = stmt
                else alternate = stmt
            } else if (child.name === SlimeParser.prototype.IfStatementBody?.name || child.name === 'IfStatementBody') {
                const bodyResult = ControlFlowCstToAst.createIfStatementBodyAst(child)
                if (!foundElse) consequent = bodyResult
                else alternate = bodyResult
            }
        }
        return SlimeAstUtil.createIfStatement(test, consequent, alternate, cst.loc, ifToken, elseToken, lParenToken, rParenToken)
    }

    static createIfStatementBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []
        for (const child of children) {
            if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement')
                return getUtil().createStatementDeclarationAst(child)
            if (child.name === SlimeParser.prototype.Block?.name || child.name === 'Block')
                return getUtil().createBlockAst(child)
        }
        return null
    }

    static createForStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForStatement?.name);
        let forToken: any, lParenToken: any, rParenToken: any, initSemi: any, testSemi: any
        let init: any = null, test: any = null, update: any = null, body: any = null
        let semiCount = 0
        for (const child of cst.children || []) {
            if (child.name === 'For' || child.value === 'for') forToken = SlimeTokenCreate.createForToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'Semicolon' || child.value === ';') {
                semiCount++
                if (semiCount === 1) initSemi = SlimeTokenCreate.createSemicolonToken(child.loc)
                else if (semiCount === 2) testSemi = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                if (semiCount === 0) init = getUtil().createExpressionAst(child)
                else if (semiCount === 1) test = getUtil().createExpressionAst(child)
                else if (semiCount === 2) update = getUtil().createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.VariableDeclarationList?.name || child.name === 'VariableDeclarationList') {
                init = ControlFlowCstToAst.createForVarDeclaration(child, 'var')
            } else if (child.name === SlimeParser.prototype.LexicalDeclaration?.name || child.name === 'LexicalDeclaration') {
                init = getUtil().createLexicalDeclarationAst(child)
            } else if (child.name === SlimeParser.prototype.ForDeclaration?.name || child.name === 'ForDeclaration') {
                init = ControlFlowCstToAst.createForDeclarationAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                body = getUtil().createStatementDeclarationAst(child)
            }
        }
        return SlimeAstUtil.createForStatement(body, init, test, update, cst.loc, forToken, lParenToken, rParenToken, initSemi, testSemi)
    }

    static createForVarDeclaration(cst: SubhutiCst, kind: string): any {
        const declarations: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.VariableDeclaration?.name || child.name === 'VariableDeclaration')
                declarations.push(getUtil().createVariableDeclaratorFromVarDeclaration(child))
        }
        return { type: SlimeNodeType.VariableDeclaration, kind: kind as any, declarations, loc: cst.loc }
    }

    static createForDeclarationAst(cst: SubhutiCst): any {
        let kind = 'let'
        const declarations: any[] = []
        for (const child of cst.children || []) {
            if (child.name === 'Let' || child.value === 'let') kind = 'let'
            else if (child.name === 'Const' || child.value === 'const') kind = 'const'
            else if (child.name === SlimeParser.prototype.ForBinding?.name || child.name === 'ForBinding') {
                const binding = ControlFlowCstToAst.createForBindingAst(child)
                declarations.push({ type: SlimeNodeType.VariableDeclarator, id: binding, init: null, loc: child.loc })
            }
        }
        return { type: SlimeNodeType.VariableDeclaration, kind: kind as any, declarations, loc: cst.loc }
    }

    static createForBindingAst(cst: SubhutiCst): any {
        const first = cst.children?.[0]
        if (!first) return null
        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier')
            return getUtil().createBindingIdentifierAst(first)
        if (first.name === SlimeParser.prototype.BindingPattern?.name || first.name === 'BindingPattern')
            return getUtil().createBindingPatternAst(first)
        return null
    }

    static createForInOfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForInOfStatement?.name);
        let forToken: any, lParenToken: any, rParenToken: any, inToken: any, ofToken: any
        let left: any = null, right: any = null, body: any = null, isForOf = false, isAwait = false
        for (const child of cst.children || []) {
            if (child.name === 'For' || child.value === 'for') forToken = SlimeTokenCreate.createForToken(child.loc)
            else if (child.name === 'Await' || child.value === 'await') isAwait = true
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'In' || child.value === 'in') inToken = SlimeTokenCreate.createInToken(child.loc)
            else if (child.name === 'Of' || child.value === 'of') { ofToken = SlimeTokenCreate.createOfToken(child.loc); isForOf = true }
            else if (child.name === SlimeParser.prototype.ForDeclaration?.name || child.name === 'ForDeclaration')
                left = ControlFlowCstToAst.createForDeclarationAst(child)
            else if (child.name === SlimeParser.prototype.ForBinding?.name || child.name === 'ForBinding')
                left = ControlFlowCstToAst.createForBindingAst(child)
            else if (child.name === SlimeParser.prototype.LeftHandSideExpression?.name || child.name === 'LeftHandSideExpression')
                left = getUtil().createLeftHandSideExpressionAst(child)
            else if (child.name === SlimeParser.prototype.AssignmentExpression?.name || child.name === 'AssignmentExpression')
                right = getUtil().createAssignmentExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression')
                right = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement')
                body = getUtil().createStatementDeclarationAst(child)
        }
        if (isForOf) return SlimeAstUtil.createForOfStatement(left, right, body, isAwait, cst.loc, forToken, lParenToken, rParenToken, ofToken)
        return SlimeAstUtil.createForInStatement(left, right, body, cst.loc, forToken, lParenToken, rParenToken, inToken)
    }

    static createWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WhileStatement?.name);
        let whileToken: any, lParenToken: any, rParenToken: any, test: any = null, body: any = null
        for (const child of cst.children || []) {
            if (child.name === 'While' || child.value === 'while') whileToken = SlimeTokenCreate.createWhileToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') test = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement')
                body = getUtil().createStatementDeclarationAst(child)
        }
        return SlimeAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    static createDoWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DoWhileStatement?.name);
        let doToken: any, whileToken: any, lParenToken: any, rParenToken: any, test: any = null, body: any = null
        for (const child of cst.children || []) {
            if (child.name === 'Do' || child.value === 'do') doToken = SlimeTokenCreate.createDoToken(child.loc)
            else if (child.name === 'While' || child.value === 'while') whileToken = SlimeTokenCreate.createWhileToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') test = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement')
                body = getUtil().createStatementDeclarationAst(child)
        }
        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken)
    }

    static createSwitchStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.SwitchStatement?.name);
        let switchToken: any, lParenToken: any, rParenToken: any, lBraceToken: any, rBraceToken: any
        let discriminant: any = null, cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === 'Switch' || child.value === 'switch') switchToken = SlimeTokenCreate.createSwitchToken(child.loc)
            else if (child.name === 'LParen' || child.value === '(') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'RParen' || child.value === ')') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'LBrace' || child.value === '{') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'RBrace' || child.value === '}') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression')
                discriminant = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.CaseBlock?.name || child.name === 'CaseBlock')
                cases = ControlFlowCstToAst.extractCasesFromCaseBlock(child)
        }
        return SlimeAstUtil.createSwitchStatement(discriminant, cases, cst.loc, switchToken, lParenToken, rParenToken, lBraceToken, rBraceToken)
    }

    static extractCasesFromCaseBlock(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{' || child.name === 'RBrace' || child.value === '}') continue
            if (child.name === SlimeParser.prototype.CaseClauses?.name || child.name === 'CaseClauses')
                cases.push(...ControlFlowCstToAst.createCaseClausesAst(child))
            else if (child.name === SlimeParser.prototype.DefaultClause?.name || child.name === 'DefaultClause')
                cases.push(ControlFlowCstToAst.createSwitchCaseAst(child, true))
            else if (child.name === SlimeParser.prototype.CaseClause?.name || child.name === 'CaseClause')
                cases.push(ControlFlowCstToAst.createSwitchCaseAst(child, false))
        }
        return cases
    }

    static createCaseClausesAst(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.CaseClause?.name || child.name === 'CaseClause')
                cases.push(ControlFlowCstToAst.createSwitchCaseAst(child, false))
        }
        return cases
    }

    static createSwitchCaseAst(cst: SubhutiCst, isDefault: boolean): any {
        let test: any = null, caseToken: any, colonToken: any
        const consequent: any[] = []
        for (const child of cst.children || []) {
            if (child.name === 'Case' || child.value === 'case') caseToken = SlimeTokenCreate.createCaseToken(child.loc)
            else if (child.name === 'Default' || child.value === 'default') caseToken = SlimeTokenCreate.createDefaultToken(child.loc)
            else if (child.name === 'Colon' || child.value === ':') colonToken = SlimeTokenCreate.createColonToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') test = getUtil().createExpressionAst(child)
            else if (child.name === SlimeParser.prototype.StatementList?.name || child.name === 'StatementList') {
                const stmts = getUtil().createStatementListAst(child)
                consequent.push(...stmts)
            }
        }
        return SlimeAstUtil.createSwitchCase(consequent, isDefault ? null : test, cst.loc, isDefault ? undefined : caseToken, isDefault ? caseToken : undefined, colonToken)
    }

    static createBreakableStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) return getUtil().createStatementDeclarationAst(firstChild)
        return null
    }

    static createIterationStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) return getUtil().createStatementDeclarationAst(firstChild)
        return null
    }
}
