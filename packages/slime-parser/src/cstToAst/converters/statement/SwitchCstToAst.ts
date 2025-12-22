import { SubhutiCst } from "subhuti";
import { SlimeAstUtils } from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";
import {
    SlimeBlockStatement,
    SlimeFunctionDeclaration,
    SlimeFunctionParam,
    SlimeIdentifier,
    SlimeTokenCreate
} from "slime-ast";

export default class SwitchCstToAst {
    /**
     * CaseClause CST �?AST
     * CaseClause -> case Expression : StatementList?
     */
    static createCaseClauseAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * DefaultClause CST �?AST
     * DefaultClause -> default : StatementList?
     */
    static createDefaultClauseAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * CaseClauses CST �?AST
     * CaseClauses -> CaseClause+
     */
    static createCaseClausesAst(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.CaseClause?.name || child.name === 'CaseClause') {
                cases.push(SlimeCstToAstUtil.createSwitchCaseAst(child))
            }
        }
        return cases
    }

    /**
     * CaseBlock CST �?AST
     * CaseBlock -> { CaseClauses? DefaultClause? CaseClauses? }
     */
    static createCaseBlockAst(cst: SubhutiCst): any[] {
        return SlimeCstToAstUtil.extractCasesFromCaseBlock(cst)
    }


    /**
     * [AST 类型映射] CaseClause/DefaultClause CST �?SwitchCase AST
     *
     * 存在必要性：CST �?case �?default 是分开的规则（CaseClause/DefaultClause），
     * �?ESTree AST 统一使用 SwitchCase 类型，通过 test 是否�?null 区分�?
     *
     * CaseClause: case Expression : StatementList?
     * DefaultClause: default : StatementList?
     * @internal
     */
    static createSwitchCaseAst(cst: SubhutiCst): any {
        let test = null
        let consequent: any[] = []
        let caseToken: any = undefined
        let defaultToken: any = undefined
        let colonToken: any = undefined

        if (cst.name === SlimeParser.prototype.CaseClause?.name) {
            // CaseClause 结构�?
            // children[0]: CaseTok
            // children[1]: Expression - test
            // children[2]: Colon
            // children[3]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Case' || child.value === 'case') {
                    caseToken = SlimeTokenCreate.createCaseToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreate.createColonToken(child.loc)
                }
            }

            const testCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
            test = testCst ? SlimeCstToAstUtil.createExpressionAst(testCst) : null

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeCstToAstUtil.createStatementListAst(stmtListCst) : []
        } else if (cst.name === SlimeParser.prototype.DefaultClause?.name) {
            // DefaultClause 结构�?
            // children[0]: DefaultTok
            // children[1]: Colon
            // children[2]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Default' || child.value === 'default') {
                    defaultToken = SlimeTokenCreate.createDefaultToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreate.createColonToken(child.loc)
                }
            }

            test = null  // default 没有 test

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeCstToAstUtil.createStatementListAst(stmtListCst) : []
        }

        return SlimeAstUtil.createSwitchCase(consequent, test, cst.loc, caseToken, defaultToken, colonToken)
    }


    /**
     * �?CaseBlock 提取所�?case/default 子句
     * CaseBlock: { CaseClauses? DefaultClause? CaseClauses? }
     */
    static extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        const cases: any[] = []

        if (!caseBlockCst.children) return cases

        // CaseBlock �?children:
        // [0]: LBrace
        // [1-n]: CaseClauses / DefaultClause（可能有多个，可能没有）
        // [last]: RBrace

        caseBlockCst.children.forEach(child => {
            if (child.name === SlimeParser.prototype.CaseClauses?.name) {
                // CaseClauses 包含多个 CaseClause
                if (child.children) {
                    child.children.forEach(caseClauseCst => {
                        cases.push(SlimeCstToAstUtil.createSwitchCaseAst(caseClauseCst))
                    })
                }
            } else if (child.name === SlimeParser.prototype.DefaultClause?.name) {
                // DefaultClause
                cases.push(SlimeCstToAstUtil.createSwitchCaseAst(child))
            }
        })

        return cases
    }
}