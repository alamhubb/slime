import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType, SlimeBlockStatement, SlimeReturnStatement, SlimeStatement } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";

export class ControlFlowCstToAst {

    static createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name || 'ReturnStatement');

        let argument: any = null;
        let returnToken: any = undefined;
        let semicolonToken: any = undefined;

        const returnCst = cst.children![0];
        if (returnCst && (returnCst.name === 'Return' || returnCst.value === 'return')) {
            returnToken = SlimeTokenCreate.createReturnToken(returnCst.loc);
        }

        if (cst.children!.length > 1) {
            for (let i = 1; i < cst.children!.length; i++) {
                const child = cst.children![i];
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' || child.value === ';') {
                    semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc);
                } else if (!argument) {
                    argument = SlimeCstToAstUtil.createExpressionAst(child);
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken);
    }

    static createBreakStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.BreakStatement?.name || 'BreakStatement');

        let breakToken: any = undefined;
        let semicolonToken: any = undefined;
        let label: any = null;

        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') {
                breakToken = SlimeTokenCreate.createBreakToken(child.loc);
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc);
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeCstToAstUtil.createLabelIdentifierAst(child);
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierNameAst(child);
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierAst(child);
            }
        }

        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken);
    }

    static createContinueStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name || 'ContinueStatement');

        let continueToken: any = undefined;
        let semicolonToken: any = undefined;
        let label: any = null;

        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') {
                continueToken = SlimeTokenCreate.createContinueToken(child.loc);
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc);
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeCstToAstUtil.createLabelIdentifierAst(child);
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierNameAst(child);
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierAst(child);
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken);
    }

    static createThrowStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name || 'ThrowStatement');

        let throwToken: any = undefined;
        let semicolonToken: any = undefined;
        let argument: any = null;

        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') {
                throwToken = SlimeTokenCreate.createThrowToken(child.loc);
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc);
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                argument = SlimeCstToAstUtil.createExpressionAst(child);
            }
        }

        return SlimeAstUtil.createThrowStatement(argument, cst.loc, throwToken, semicolonToken);
    }

    static createTryStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.TryStatement?.name || 'TryStatement');

        let tryToken: any = undefined;
        let finallyToken: any = undefined;

        for (const child of cst.children!) {
            if (!child) continue;
            if (child.name === 'Try' || child.value === 'try') {
                tryToken = SlimeTokenCreate.createTryToken(child.loc);
            } else if (child.name === 'Finally' || child.value === 'finally') {
                finallyToken = SlimeTokenCreate.createFinallyToken(child.loc);
            }
        }

        const blockCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.Block?.name);
        const catchCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.Catch?.name);
        const finallyCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.Finally?.name);

        const block = blockCst ? ControlFlowCstToAst.createBlockAst(blockCst) : null;
        const handler = catchCst ? ControlFlowCstToAst.createCatchAst(catchCst) : null;
        const finalizer = finallyCst ? ControlFlowCstToAst.createFinallyAst(finallyCst) : null;

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken);
    }

    static createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        checkCstName(cst, SlimeParser.prototype.Block?.name || 'Block');

        let lBraceToken: any = undefined;
        let rBraceToken: any = undefined;

        if (cst.children) {
            for (const child of cst.children) {
                if (child.name === 'LBrace' || child.value === '{') {
                    lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc);
                } else if (child.name === 'RBrace' || child.value === '}') {
                    rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc);
                }
            }
        }

        const statementListCst = cst.children?.find(
            child => child.name === SlimeParser.prototype.StatementList?.name
        );

        const statements = statementListCst ? SlimeCstToAstUtil.createStatementListAst(statementListCst) : [];
        return SlimeAstUtil.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken);
    }

    static createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeStatement>;

        if (cst.name === SlimeParser.prototype.StatementList?.name || cst.name === 'StatementList') {
            statements = SlimeCstToAstUtil.createStatementListAst(cst);
        } else if (cst.name === SlimeParser.prototype.BlockStatement?.name || cst.name === 'BlockStatement') {
            const blockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Block?.name || ch.name === 'Block');
            if (blockCst) {
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeParser.prototype.StatementList?.name || child.name === 'StatementList'
                );
                statements = statementListCst ? SlimeCstToAstUtil.createStatementListAst(statementListCst) : [];
            } else {
                statements = [];
            }
        } else {
            throw new Error(`Expected StatementList or BlockStatement, got ${cst.name}`);
        }

        return {
            type: SlimeNodeType.BlockStatement,
            body: statements,
            loc: cst.loc
        } as any;
    }

    static createCatchAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.Catch?.name || 'Catch');

        let catchToken: any = undefined;
        let lParenToken: any = undefined;
        let rParenToken: any = undefined;

        for (const child of cst.children!) {
            if (!child) continue;
            if (child.name === 'Catch' || child.value === 'catch') {
                catchToken = SlimeTokenCreate.createCatchToken(child.loc);
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc);
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc);
            }
        }

        const paramCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.CatchParameter?.name);
        const blockCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.Block?.name);

        const param = paramCst ? ControlFlowCstToAst.createCatchParameterAst(paramCst) : null;
        const body = blockCst ? ControlFlowCstToAst.createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([]);

        return SlimeAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken);
    }

    static createCatchParameterAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name || 'CatchParameter');
        const first = cst.children![0];

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier') {
            return SlimeCstToAstUtil.createBindingIdentifierAst(first);
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name || first.name === 'BindingPattern') {
            return SlimeCstToAstUtil.createBindingPatternAst(first);
        }
        return null;
    }

    static createFinallyAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.Finally?.name || 'Finally');
        const blockCst = cst.children!.find(ch => ch.name === SlimeParser.prototype.Block?.name);
        return blockCst ? ControlFlowCstToAst.createBlockAst(blockCst) : null;
    }

    static createDebuggerStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DebuggerStatement?.name || 'DebuggerStatement');

        let debuggerToken: any = undefined;
        let semicolonToken: any = undefined;

        for (const child of cst.children || []) {
            if (child.name === 'Debugger' || child.value === 'debugger') {
                debuggerToken = SlimeTokenCreate.createDebuggerToken(child.loc);
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc);
            }
        }

        return SlimeAstUtil.createDebuggerStatement(cst.loc, debuggerToken, semicolonToken);
    }

    static createEmptyStatementAst(cst: SubhutiCst): any {
        let semicolonToken: any = undefined;

        if (cst.value === ';' || cst.name === SlimeTokenConsumer.prototype.Semicolon?.name || cst.name === 'Semicolon') {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(cst.loc);
        } else {
            const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';');
            if (semicolonCst) {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc);
            }
        }

        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken);
    }

    static createWithStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WithStatement?.name || 'WithStatement');

        let object: any = null;
        let body: any = null;
        let withToken: any = undefined;
        let lParenToken: any = undefined;
        let rParenToken: any = undefined;

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = child;
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = child;
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = child;
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                object = SlimeCstToAstUtil.createExpressionAst(child);
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const bodyArray = SlimeCstToAstUtil.createStatementAst(child);
                body = Array.isArray(bodyArray) && bodyArray.length > 0 ? bodyArray[0] : bodyArray;
            }
        }

        return {
            type: SlimeNodeType.WithStatement,
            object,
            body,
            withToken,
            lParenToken,
            rParenToken,
            loc: cst.loc
        };
    }

    static createLabelledStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name || 'LabelledStatement');

        let label: any = null;
        let body: any = null;

        for (const child of cst.children || []) {
            if (!child) continue;
            const name = child.name;

            if (child.value === ':' || name === 'Colon') continue;

            if (name === SlimeParser.prototype.LabelIdentifier?.name || name === 'LabelIdentifier') {
                label = SlimeCstToAstUtil.createLabelIdentifierAst(child);
            } else if (name === SlimeParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                const itemChild = child.children?.[0];
                if (itemChild) {
                    body = SlimeCstToAstUtil.createStatementDeclarationAst(itemChild);
                }
            } else if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                body = SlimeCstToAstUtil.createStatementDeclarationAst(child);
            } else if (name === SlimeParser.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierNameAst(child);
            } else if (name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierAst(child);
            }
        }

        return {
            type: SlimeNodeType.LabeledStatement,
            label: label,
            body: body,
            loc: cst.loc
        };
    }

    static createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0];
        if (firstChild) {
            return SlimeCstToAstUtil.createStatementDeclarationAst(firstChild);
        }
        throw new Error('LabelledItem has no children');
    }

    static createSemicolonASIAst(cst: SubhutiCst): any {
        return null;
    }
}
