import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil, SlimeBlockStatement,
    type SlimeFunctionDeclaration, type SlimeFunctionParam,
    type SlimeIdentifier, SlimeNodeType, type SlimePattern,
    SlimeTokenCreate, type SlimeVariableDeclaration, type SlimeVariableDeclarator,
    type SlimeStatement, type SlimeExpressionStatement, type SlimeFunctionExpression,
    type SlimeReturnStatement
} from "slime-ast";
import SlimeParser from "../SlimeParser.ts";
import { checkCstName } from "./SlimeCstToAstTools.ts";
import { ControlFlowCstToAst } from "./ControlFlowCstToAst.ts";

let _slimeCstToAstUtil: any = null;

export function setSlimeCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized. Call setSlimeCstToAstUtil first.');
    }
    return _slimeCstToAstUtil;
}

export class StatementCstToAst {
    // 委托给 ControlFlowCstToAst
    static createTryStatementAst = ControlFlowCstToAst.createTryStatementAst;
    static createCatchAst = ControlFlowCstToAst.createCatchAst;
    static createFinallyAst = ControlFlowCstToAst.createFinallyAst;
    static createThrowStatementAst = ControlFlowCstToAst.createThrowStatementAst;
    static createBreakStatementAst = ControlFlowCstToAst.createBreakStatementAst;
    static createContinueStatementAst = ControlFlowCstToAst.createContinueStatementAst;
    static createLabelledStatementAst = ControlFlowCstToAst.createLabelledStatementAst;
    static createWithStatementAst = ControlFlowCstToAst.createWithStatementAst;
    static createDebuggerStatementAst = ControlFlowCstToAst.createDebuggerStatementAst;
    static createIfStatementAst = ControlFlowCstToAst.createIfStatementAst;
    static createIfStatementBodyAst = ControlFlowCstToAst.createIfStatementBodyAst;
    static createForStatementAst = ControlFlowCstToAst.createForStatementAst;
    static createForInOfStatementAst = ControlFlowCstToAst.createForInOfStatementAst;
    static createWhileStatementAst = ControlFlowCstToAst.createWhileStatementAst;
    static createDoWhileStatementAst = ControlFlowCstToAst.createDoWhileStatementAst;
    static createSwitchStatementAst = ControlFlowCstToAst.createSwitchStatementAst;
    static createCaseBlockAst = ControlFlowCstToAst.extractCasesFromCaseBlock;
    static createCaseClausesAst = ControlFlowCstToAst.createCaseClausesAst;
    static createCaseClauseAst = (cst: SubhutiCst) => ControlFlowCstToAst.createSwitchCaseAst(cst, false);
    static createDefaultClauseAst = (cst: SubhutiCst) => ControlFlowCstToAst.createSwitchCaseAst(cst, true);
    static createSwitchCaseAst = ControlFlowCstToAst.createSwitchCaseAst;
    static createBreakableStatementAst = ControlFlowCstToAst.createBreakableStatementAst;
    static createIterationStatementAst = ControlFlowCstToAst.createIterationStatementAst;

    static createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => StatementCstToAst.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)
        return statements
    }

    static createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []
        for (const child of children) {
            if (!child) continue
            if (child.name === SlimeParser.prototype.VariableDeclarationList?.name || child.name === 'VariableDeclarationList') {
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeParser.prototype.VariableDeclaration?.name || varDeclCst.name === 'VariableDeclaration')
                        declarations.push(getUtil().createVariableDeclaratorFromVarDeclaration(varDeclCst))
                }
            }
        }
        return { type: SlimeNodeType.VariableDeclaration, kind: 'var' as any, declarations, loc: cst.loc } as any
    }

    static createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        const statementListCst = cst.children?.find(child => child.name === SlimeParser.prototype.StatementList?.name)
        let statements: Array<SlimeStatement> = []
        if (statementListCst) statements = StatementCstToAst.createStatementListAst(statementListCst)
        let lBraceToken: any, rBraceToken: any
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'RBrace' || child.value === '}') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
        }
        return SlimeAstUtil.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken)
    }

    static createEmptyStatementAst(cst: SubhutiCst): any {
        let semicolonToken: any
        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') { semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc); break }
        }
        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }

    static createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeStatement>
        let lBraceToken: any, rBraceToken: any
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'RBrace' || child.value === '}') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
        }
        const blockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Block?.name || ch.name === 'Block')
        if (blockCst) {
            const innerStatementListCst = blockCst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            statements = innerStatementListCst ? StatementCstToAst.createStatementListAst(innerStatementListCst) : []
            for (const child of blockCst.children || []) {
                if (child.name === 'LBrace' || child.value === '{') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                else if (child.name === 'RBrace' || child.value === '}') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        } else {
            const statementListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            statements = statementListCst ? StatementCstToAst.createStatementListAst(statementListCst) : []
        }
        return SlimeAstUtil.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken)
    }

    static createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);
        let returnToken: any, argument: any = null
        for (const child of cst.children || []) {
            if (child.name === 'Return' || child.value === 'return') returnToken = SlimeTokenCreate.createReturnToken(child.loc)
            else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression')
                argument = getUtil().createExpressionAst(child)
        }
        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken)
    }

    static createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);
        const exprCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name || ch.name === 'Expression')
        let expression: any = null
        if (exprCst) expression = getUtil().createExpressionAst(exprCst)
        let semicolonToken: any
        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';' || child.name === 'SemicolonASI')
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
        }
        return SlimeAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken)
    }

    static createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => StatementCstToAst.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    static createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            if (item.name === SlimeParser.prototype.Declaration?.name) return [getUtil().createDeclarationAst(item) as any]
            const statement = StatementCstToAst.createStatementAst(item)
            const result = statement.flat()
            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression
                    if (expr.type === SlimeNodeType.FunctionExpression) {
                        const funcExpr = expr as SlimeFunctionExpression
                        if (funcExpr.id) {
                            return {
                                type: SlimeNodeType.FunctionDeclaration, id: funcExpr.id, params: funcExpr.params,
                                body: funcExpr.body, generator: funcExpr.generator, async: funcExpr.async, loc: funcExpr.loc
                            } as SlimeFunctionDeclaration
                        }
                    }
                    if (expr.type === SlimeNodeType.ClassExpression) {
                        const classExpr = expr as any
                        if (classExpr.id) {
                            return { type: SlimeNodeType.ClassDeclaration, id: classExpr.id, superClass: classExpr.superClass, body: classExpr.body, loc: classExpr.loc } as any
                        }
                    }
                }
                return stmt
            })
        }).flat()
        return statements
    }

    static createStatementDeclarationAst(cst: SubhutiCst): any {
        const name = cst.name
        if (name === SlimeParser.prototype.Statement?.name) return StatementCstToAst.createStatementAst(cst)[0]
        if (name === SlimeParser.prototype.BlockStatement?.name) return StatementCstToAst.createBlockStatementAst(cst)
        if (name === SlimeParser.prototype.VariableStatement?.name) return StatementCstToAst.createVariableStatementAst(cst)
        if (name === SlimeParser.prototype.EmptyStatement?.name) return StatementCstToAst.createEmptyStatementAst(cst)
        if (name === SlimeParser.prototype.ExpressionStatement?.name) return StatementCstToAst.createExpressionStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatement?.name) return StatementCstToAst.createIfStatementAst(cst)
        if (name === SlimeParser.prototype.BreakableStatement?.name) return StatementCstToAst.createBreakableStatementAst(cst)
        if (name === SlimeParser.prototype.IterationStatement?.name) return StatementCstToAst.createIterationStatementAst(cst)
        if (name === SlimeParser.prototype.ContinueStatement?.name) return StatementCstToAst.createContinueStatementAst(cst)
        if (name === SlimeParser.prototype.BreakStatement?.name) return StatementCstToAst.createBreakStatementAst(cst)
        if (name === SlimeParser.prototype.ReturnStatement?.name) return StatementCstToAst.createReturnStatementAst(cst)
        if (name === SlimeParser.prototype.WithStatement?.name) return StatementCstToAst.createWithStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledStatement?.name) return StatementCstToAst.createLabelledStatementAst(cst)
        if (name === SlimeParser.prototype.ThrowStatement?.name) return StatementCstToAst.createThrowStatementAst(cst)
        if (name === SlimeParser.prototype.TryStatement?.name) return StatementCstToAst.createTryStatementAst(cst)
        if (name === SlimeParser.prototype.DebuggerStatement?.name) return StatementCstToAst.createDebuggerStatementAst(cst)
        if (name === SlimeParser.prototype.SwitchStatement?.name) return StatementCstToAst.createSwitchStatementAst(cst)
        if (name === SlimeParser.prototype.ForStatement?.name) return StatementCstToAst.createForStatementAst(cst)
        if (name === SlimeParser.prototype.ForInOfStatement?.name) return StatementCstToAst.createForInOfStatementAst(cst)
        if (name === SlimeParser.prototype.WhileStatement?.name) return StatementCstToAst.createWhileStatementAst(cst)
        if (name === SlimeParser.prototype.DoWhileStatement?.name) return StatementCstToAst.createDoWhileStatementAst(cst)
        return getUtil().createAstFromCst(cst)
    }

    static createSemicolonASIAst(cst: SubhutiCst): any { return null }

    static createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }
}

export { ControlFlowCstToAst } from "./ControlFlowCstToAst.ts";
