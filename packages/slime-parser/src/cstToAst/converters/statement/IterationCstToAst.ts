import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class IterationCstToAst {

    static createForStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForStatement?.name || 'ForStatement');

        if (cst.children![2].value === 'var' || cst.children![2].name === 'LexicalDeclaration') {
            // Check if it's for-in or for-of
            const thirdChild = cst.children![3];
            if (thirdChild && (thirdChild.value === 'in' || thirdChild.value === 'of')) {
                return IterationCstToAst.createForInOfStatementAst(cst);
            }
        }

        const init = cst.children![2].name === 'Semicolon' ? null : SlimeCstToAstUtil.createAstFromCst(cst.children![2]);
        const test = cst.children![4].name === 'Semicolon' ? null : SlimeCstToAstUtil.createExpressionAst(cst.children![4]);
        const update = cst.children![6].name === 'CloseParen' ? null : SlimeCstToAstUtil.createExpressionAst(cst.children![6]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![cst.children!.length - 1]);

        return SlimeAstUtil.createForStatement(init, test, update, body, cst.loc);
    }

    static createForInOfStatementAst(cst: SubhutiCst): any {
        const left = SlimeCstToAstUtil.createAstFromCst(cst.children![2]);
        const operator = cst.children![3].value;
        const right = SlimeCstToAstUtil.createExpressionAst(cst.children![4]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![6]);

        if (operator === 'in') {
            return SlimeAstUtil.createForInStatement(left, right, body, cst.loc);
        } else {
            return SlimeAstUtil.createForOfStatement(left, right, body, false, cst.loc);
        }
    }

    static createWhileStatementAst(cst: SubhutiCst): any {
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![4]);
        return SlimeAstUtil.createWhileStatement(test, body, cst.loc);
    }

    static createDoWhileStatementAst(cst: SubhutiCst): any {
        const body = SlimeCstToAstUtil.createAstFromCst(cst.children![1]);
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![4]);
        return SlimeAstUtil.createDoWhileStatement(test, body, cst.loc);
    }

    static createForDeclarationAst(cst: SubhutiCst): any {
        const kind = cst.children![0].value as any;
        const declarators = [IterationCstToAst.createForBindingAst(cst.children![1])];
        return SlimeAstUtil.createVariableDeclaration(kind, declarators, cst.loc);
    }

    static createForBindingAst(cst: SubhutiCst): any {
        const id = SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
        return SlimeAstUtil.createVariableDeclarator(id, null, cst.loc);
    }

    static createLetOrConstAst(cst: SubhutiCst): string {
        return cst.children![0].value;
    }
}
