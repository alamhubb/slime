import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

/**
 * 控制流 CST 到 AST 转换器
 */
export class ControlFlowCstToAst {

    static createBlockAst(cst: SubhutiCst): any {
        const body = (cst.children![1] as any)?.children?.map((c: any) => SlimeCstToAstUtil.createAstFromCst(c)) || [];
        return SlimeAstUtil.createBlockStatement(body, cst.loc);
    }

    static createReturnStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name || 'ReturnStatement');
        let argument = null;
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
        const block = this.createBlockAst(cst.children![1]);
        let handler = null;
        let finalizer = null;

        for (let i = 2; i < cst.children!.length; i++) {
            const child = cst.children![i];
            if (child.name === 'Catch') {
                handler = SlimeCstToAstUtil.createCatchAst(child);
            } else if (child.name === 'Finally') {
                finalizer = this.createBlockAst(child.children![1]);
            }
        }

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc);
    }

    static createCatchClauseAst(cst: SubhutiCst): any {
        let param = null;
        let body;

        if (cst.children![1].value === '(') {
            param = SlimeCstToAstUtil.createAstFromCst(cst.children![2]);
            body = this.createBlockAst(cst.children![4]);
        } else {
            body = this.createBlockAst(cst.children![1]);
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

    static createIfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.IfStatement?.name || 'IfStatement');
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const consequent = this.createIfStatementBodyAst(cst.children![4]);
        let alternate = null;

        if (cst.children![5] && cst.children![5].value === 'else') {
            alternate = this.createIfStatementBodyAst(cst.children![6]);
        }

        return SlimeAstUtil.createIfStatement(test, consequent, alternate, cst.loc);
    }

    static createIfStatementBodyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }

    static createForStatementAst(cst: SubhutiCst): any {
        // 简化实现，实际逻辑较复杂，建议从 SlimeCstToAstUtil 迁移
        const head = cst.children![2];
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![cst.children!.length - 1]);

        // 这里需要更精细的解析逻辑
        // ... (省略部分复杂逻辑，假设已经处理好)
        return SlimeAstUtil.createForStatement(null, null, null, body, cst.loc);
    }

    static createForInOfStatementAst(cst: SubhutiCst): any {
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![cst.children!.length - 1]);
        return SlimeAstUtil.createForInStatement(null, null, body, cst.loc);
    }

    static createWhileStatementAst(cst: SubhutiCst): any {
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![4]);
        return SlimeAstUtil.createWhileStatement(test, body, cst.loc);
    }

    static createDoWhileStatementAst(cst: SubhutiCst): any {
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![1]);
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![4]);
        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc);
    }

    static createBreakableStatementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }

    static createIterationStatementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }

    static createForDeclarationAst(cst: SubhutiCst): any {
        const kind = cst.children![0].value;
        const declarations = SlimeCstToAstUtil.createVariableDeclarationListAst(cst.children![1]);
        return SlimeAstUtil.createVariableDeclaration(kind, declarations, cst.loc);
    }

    static createForBindingAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }
}
