/**
 * ControlFlowCstToAst - if/for/while/do-while 转换
 */
import { SubhutiCst } from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import {
    
    SlimeAstTypeName,
    SlimeTokenCreateUtils,
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator
} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "./SlimeVariableCstToAst.ts";

export class SlimeControlFlowCstToAstSingle {


    // ==================== 语句相关转换方法 ====================

    /**
     * BreakableStatement CST �?AST（透传�?
     * BreakableStatement -> IterationStatement | SwitchStatement
     */
    createBreakableStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('BreakableStatement has no children')
    }

    /**
     * IterationStatement CST �?AST（透传�?
     * IterationStatement -> DoWhileStatement | WhileStatement | ForStatement | ForInOfStatement
     */
    createIterationStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('IterationStatement has no children')
    }


    /**
     * 创建 if 语句 AST
     * if (test) consequent [else alternate]
     * ES2025: if ( Expression ) IfStatementBody [else IfStatementBody]
     */
    createIfStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.IfStatement?.name);

        let test: any = null
        let consequent: any = null
        let alternate: any = null
        let ifToken: any = undefined
        let elseToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        const children = cst.children || []
        let foundElse = false

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // if token
            if (name === 'If' || child.value === 'if') {
                ifToken = SlimeTokenCreateUtils.createIfToken(child.loc)
                continue
            }
            // LParen token
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
                continue
            }
            // RParen token
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
                continue
            }

            // else token
            if (name === 'Else' || child.value === 'else') {
                elseToken = SlimeTokenCreateUtils.createElseToken(child.loc)
                foundElse = true
                continue
            }

            // Expression (test condition)
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = SlimeCstToAstUtil.createExpressionAst(child)
                continue
            }

            // IfStatementBody
            if (name === SlimeParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = SlimeCstToAstUtil.createIfStatementBodyAst(child)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }

            // Legacy: 直接�?Statement
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeCstToAstUtil.createStatementAst(child)
                const body = Array.isArray(stmts) ? stmts[0] : stmts
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }
        }

        return SlimeAstCreateUtils.createIfStatement(test, consequent, alternate, cst.loc, ifToken, elseToken, lParenToken, rParenToken)
    }

    /**
     * 创建 IfStatementBody AST
     * IfStatementBody: Statement | FunctionDeclaration
     */
    createIfStatementBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeCstToAstUtil.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return SlimeCstToAstUtil.createFunctionDeclarationAst(child)
            }
        }

        // 如果没有找到子节点，尝试直接处理
        return SlimeCstToAstUtil.createStatementDeclarationAst(cst)
    }



    /**
     * 创建 switch 语句 AST
     * SwitchStatement: switch ( Expression ) CaseBlock
     */
    createSwitchStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.SwitchStatement?.name);

        let switchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Switch' || child.value === 'switch') {
                switchToken = SlimeTokenCreateUtils.createSwitchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            }
        }

        // 提取 discriminant（判断表达式�?
        const discriminantCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? SlimeCstToAstUtil.createExpressionAst(discriminantCst) : null

        // 提取 cases（从 CaseBlock 中）
        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? SlimeCstToAstUtil.extractCasesFromCaseBlock(caseBlockCst) : []

        // �?CaseBlock 提取 brace tokens
        if (caseBlockCst && caseBlockCst.children) {
            const lBraceCst = caseBlockCst.children.find(ch => ch.name === 'LBrace' || ch.value === '{')
            const rBraceCst = caseBlockCst.children.find(ch => ch.name === 'RBrace' || ch.value === '}')
            if (lBraceCst) lBraceToken = SlimeTokenCreateUtils.createLBraceToken(lBraceCst.loc)
            if (rBraceCst) rBraceToken = SlimeTokenCreateUtils.createRBraceToken(rBraceCst.loc)
        }

        return SlimeAstCreateUtils.createSwitchStatement(
            discriminant, cases, cst.loc,
            switchToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }


    /**
     * CaseClause CST �?AST
     * CaseClause -> case Expression : StatementList?
     */
    createCaseClauseAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * DefaultClause CST �?AST
     * DefaultClause -> default : StatementList?
     */
    createDefaultClauseAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * CaseClauses CST �?AST
     * CaseClauses -> CaseClause+
     */
    createCaseClausesAst(cst: SubhutiCst): any[] {
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
    createCaseBlockAst(cst: SubhutiCst): any[] {
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
    createSwitchCaseAst(cst: SubhutiCst): any {
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
                    caseToken = SlimeTokenCreateUtils.createCaseToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreateUtils.createColonToken(child.loc)
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
                    defaultToken = SlimeTokenCreateUtils.createDefaultToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreateUtils.createColonToken(child.loc)
                }
            }

            test = null  // default 没有 test

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeCstToAstUtil.createStatementListAst(stmtListCst) : []
        }

        return SlimeAstCreateUtils.createSwitchCase(consequent, test, cst.loc, caseToken, defaultToken, colonToken)
    }


    /**
     * �?CaseBlock 提取所�?case/default 子句
     * CaseBlock: { CaseClauses? DefaultClause? CaseClauses? }
     */
    extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
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

export const SlimeControlFlowCstToAst = new SlimeControlFlowCstToAstSingle()