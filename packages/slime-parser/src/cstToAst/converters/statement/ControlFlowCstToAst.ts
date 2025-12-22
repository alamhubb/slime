import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class ControlFlowCstToAst {

    static createReturnStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name || 'ReturnStatement');
        let argument = null;
        if (cst.children![1] && cst.children![1].name !== 'Semicolon') {
            argument = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
        }
        return SlimeAstUtil.createReturnStatement(argument, cst.loc);
    }

    static createBreakStatementAst(cst: SubhutiCst): any {
        let label = null;
        if (cst.children![1] && cst.children![1].name === 'LabelIdentifier') {
            label = SlimeCstToAstUtil.createLabelIdentifierAst(cst.children![1]);
        }
        return SlimeAstUtil.createBreakStatement(label, cst.loc);
    }

    static createContinueStatementAst(cst: SubhutiCst): any {
        let label = null;
        if (cst.children![1] && cst.children![1].name === 'LabelIdentifier') {
            label = SlimeCstToAstUtil.createLabelIdentifierAst(cst.children![1]);
        }
        return SlimeAstUtil.createContinueStatement(label, cst.loc);
    }

    static createThrowStatementAst(cst: SubhutiCst): any {
        const argument = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
        return SlimeAstUtil.createThrowStatement(argument, cst.loc);
    }

    static createTryStatementAst(cst: SubhutiCst): any {
        const block = ControlFlowCstToAst.createBlockAst(cst.children![1]);
        let handler = null;
        let finalizer = null;

        for (let i = 2; i < cst.children!.length; i++) {
            const child = cst.children![i];
            if (child.name === 'Catch') {
                handler = ControlFlowCstToAst.createCatchClauseAst(child);
            } else if (child.name === 'Finally') {
                finalizer = ControlFlowCstToAst.createBlockAst(child.children![1]);
            }
        }

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc);
    }

    static createBlockAst(cst: SubhutiCst): any {
        const body = (cst.children![1] as any)?.children?.map((c: any) => SlimeCstToAstUtil.createAstFromCst(c)) || [];
        return SlimeAstUtil.createBlockStatement(body, cst.loc);
    }

    static createCatchClauseAst(cst: SubhutiCst): any {
        let param = null;
        let body;

        if (cst.children![1].value === '(') {
            param = SlimeCstToAstUtil.createAstFromCst(cst.children![2]);
            body = ControlFlowCstToAst.createBlockAst(cst.children![4]);
        } else {
            body = ControlFlowCstToAst.createBlockAst(cst.children![1]);
        }

        return SlimeAstUtil.createCatchClause(param, body, cst.loc);
    }

    static createDebuggerStatementAst(cst: SubhutiCst): any {
        return SlimeAstUtil.createDebuggerStatement(cst.loc);
    }

    static createEmptyStatementAst(cst: SubhutiCst): any {
        return SlimeAstUtil.createEmptyStatement(cst.loc);
    }

    static createWithStatementAst(cst: SubhutiCst): any {
        const object = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![4]);
        return SlimeAstUtil.createWithStatement(object, body, cst.loc);
    }

    static createLabelledStatementAst(cst: SubhutiCst): any {
        const label = SlimeCstToAstUtil.createLabelIdentifierAst(cst.children![0]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![2]);
        return SlimeAstUtil.createLabelledStatement(label, body, cst.loc);
    }
}
