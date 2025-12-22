import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class ConditionCstToAst {

    static createIfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.IfStatement?.name || 'IfStatement');

        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const consequent = ConditionCstToAst.createIfStatementBodyAst(cst.children![4]);

        let alternate = null;
        if (cst.children![5] && cst.children![5].value === 'else') {
            alternate = ConditionCstToAst.createIfStatementBodyAst(cst.children![6]);
        }

        return SlimeAstUtil.createIfStatement(test, consequent, alternate, cst.loc);
    }

    static createIfStatementBodyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createAstFromCst(cst);
    }

    static createSwitchStatementAst(cst: SubhutiCst): any {
        const discriminant = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const cases = ConditionCstToAst.extractCasesFromCaseBlock(cst.children![4]);
        return SlimeAstUtil.createSwitchStatement(discriminant, cases, cst.loc);
    }

    static extractCasesFromCaseBlock(cst: SubhutiCst): any[] {
        const cases: any[] = [];
        const clauses = cst.children![1];
        if (clauses && clauses.name === 'CaseClauses') {
            cases.push(...ConditionCstToAst.createCaseClausesAst(clauses));
        }

        const defaultClause = cst.children!.find(c => c.name === 'DefaultClause');
        if (defaultClause) {
            cases.push(ConditionCstToAst.createDefaultClauseAst(defaultClause));
        }

        const trailingClauses = cst.children!.find(c => c.name === 'CaseClauses' && c !== clauses);
        if (trailingClauses) {
            cases.push(...ConditionCstToAst.createCaseClausesAst(trailingClauses));
        }

        return cases;
    }

    static createCaseClausesAst(cst: SubhutiCst): any[] {
        return cst.children!.map(c => ConditionCstToAst.createCaseClauseAst(c));
    }

    static createCaseClauseAst(cst: SubhutiCst): any {
        const test = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
        const consequent = (cst.children![3] as any)?.children?.map((c: any) => SlimeCstToAstUtil.createAstFromCst(c)) || [];
        return SlimeAstUtil.createSwitchCase(test, consequent, cst.loc);
    }

    static createDefaultClauseAst(cst: SubhutiCst): any {
        const consequent = (cst.children![2] as any)?.children?.map((c: any) => SlimeCstToAstUtil.createAstFromCst(c)) || [];
        return SlimeAstUtil.createSwitchCase(null, consequent, cst.loc);
    }

    static createSwitchCaseAst(test: SlimeExpression | null, consequent: any[], loc: any): any {
        return SlimeAstUtil.createSwitchCase(test, consequent, loc);
    }
}
