import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeBlockStatement, SlimeStatement, SlimeReturnStatement, SlimeIdentifier } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * 其他语句 CST 到 AST 转换器
 * 
 * 负责处理：
 * - TryStatement: try 语句
 * - Catch: catch 子句
 * - CatchParameter: catch 参数
 * - Finally: finally 子句
 * - SwitchStatement: switch 语句
 * - CaseBlock: case 块
 * - CaseClauses: case 子句列表
 * - CaseClause: case 子句
 * - DefaultClause: default 子句
 * - BreakStatement: break 语句
 * - ContinueStatement: continue 语句
 * - ReturnStatement: return 语句
 * - ThrowStatement: throw 语句
 * - WithStatement: with 语句
 * - LabelledStatement: 标签语句
 * - LabelledItem: 标签项
 * - DebuggerStatement: debugger 语句
 * - EmptyStatement: 空语句
 * - Block: 块语句
 * - BlockStatement: 块语句
 * - Statement: 语句
 * - StatementList: 语句列表
 * - StatementListItem: 语句列表项
 * - StatementDeclaration: 语句声明
 * - SemicolonASI: 自动分号插入
 */
export class OtherStatementCstToAst {

    /**
     * 创建 try 语句 AST
     */
    static createTryStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.TryStatement?.name);

        let tryToken: any = undefined
        let finallyToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Try' || child.value === 'try') {
                tryToken = SlimeTokenCreate.createTryToken(child.loc)
            } else if (child.name === 'Finally' || child.value === 'finally') {
                finallyToken = SlimeTokenCreate.createFinallyToken(child.loc)
            }
        }

        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        const catchCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Catch?.name)
        const finallyCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Finally?.name)

        const block = blockCst ? SlimeCstToAstUtil.createBlockAst(blockCst) : null
        const handler = catchCst ? SlimeCstToAstUtil.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? this.createFinallyAst(finallyCst) : null

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }


    /**
     * 创建 CatchParameter AST
     */
    static createCatchParameterAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return SlimeCstToAstUtil.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return SlimeCstToAstUtil.createBindingPatternAst(first)
        }

        return null
    }

    /**
     * 创建 Finally 子句 AST
     */
    static createFinallyAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.Finally?.name);

        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        return blockCst ? SlimeCstToAstUtil.createBlockAst(blockCst) : null
    }

    /**
     * 创建 throw 语句 AST
     */
    static createThrowStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name);

        let throwToken: any = undefined
        let semicolonToken: any = undefined
        let argument: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') {
                throwToken = SlimeTokenCreate.createThrowToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                argument = SlimeCstToAstUtil.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createThrowStatement(argument, cst.loc, throwToken, semicolonToken)
    }

    /**
     * 创建 break 语句 AST
     */
    static createBreakStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.BreakStatement?.name);

        let breakToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') {
                breakToken = SlimeTokenCreate.createBreakToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeCstToAstUtil.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken)
    }

    /**
     * 创建 continue 语句 AST
     */
    static createContinueStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name);

        let continueToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') {
                continueToken = SlimeTokenCreate.createContinueToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeCstToAstUtil.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeCstToAstUtil.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }


    /**
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     */
    static createLabelledStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);

        let label: any = null
        let body: any = null

        if (cst.children && cst.children.length > 0) {
            for (const child of cst.children) {
                if (!child) continue
                const name = child.name

                if (child.value === ':' || name === 'Colon') continue

                if (name === SlimeParser.prototype.LabelIdentifier?.name || name === 'LabelIdentifier') {
                    label = SlimeCstToAstUtil.createLabelIdentifierAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                    const itemChild = child.children?.[0]
                    if (itemChild) {
                        body = SlimeCstToAstUtil.createStatementDeclarationAst(itemChild)
                    }
                    continue
                }

                if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                    body = SlimeCstToAstUtil.createStatementDeclarationAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.IdentifierName?.name) {
                    label = SlimeCstToAstUtil.createIdentifierNameAst(child)
                    continue
                }
                if (name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                    label = SlimeCstToAstUtil.createIdentifierAst(child)
                    continue
                }
            }
        }

        return {
            type: SlimeNodeType.LabeledStatement,
            label: label,
            body: body,
            loc: cst.loc
        }
    }

    /**
     * 创建 LabelledItem AST（透传）
     */
    static createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }

    /**
     * 创建 with 语句 AST
     */
    static createWithStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WithStatement?.name);

        let object: any = null
        let body: any = null
        let withToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = child
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = child
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = child
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                object = SlimeCstToAstUtil.createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const bodyArray = SlimeCstToAstUtil.createStatementAst(child)
                body = Array.isArray(bodyArray) && bodyArray.length > 0 ? bodyArray[0] : bodyArray
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
        }
    }

    /**
     * 创建 debugger 语句 AST
     */
    static createDebuggerStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DebuggerStatement?.name);

        let debuggerToken: any = undefined
        let semicolonToken: any = undefined

        for (const child of cst.children || []) {
            if (child.name === 'Debugger' || child.value === 'debugger') {
                debuggerToken = SlimeTokenCreate.createDebuggerToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            }
        }

        return SlimeAstUtil.createDebuggerStatement(cst.loc, debuggerToken, semicolonToken)
    }

    /**
     * 创建空语句 AST
     */
    static createEmptyStatementAst(cst: SubhutiCst): any {
        let semicolonToken: any = undefined

        if (cst.value === ';' || cst.name === SlimeTokenConsumer.prototype.Semicolon?.name) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(cst.loc)
        } else {
            const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';')
            if (semicolonCst) {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
            }
        }

        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }

    /**
     * SemicolonASI CST 到 AST
     * 处理自动分号插入
     */
    static createSemicolonASIAst(cst: SubhutiCst): any {
        return null
    }

    /**
     * 创建 switch 语句 AST
     * SwitchStatement: switch ( Expression ) CaseBlock
     */
    static createSwitchStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.SwitchStatement?.name);

        let switchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Switch' || child.value === 'switch') {
                switchToken = SlimeTokenCreate.createSwitchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            }
        }

        // 提取 discriminant（判断表达式）
        const discriminantCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? SlimeCstToAstUtil.createExpressionAst(discriminantCst) : null

        // 提取 cases（从 CaseBlock 中）
        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? this.extractCasesFromCaseBlock(caseBlockCst) : []

        // 从 CaseBlock 提取 brace tokens
        if (caseBlockCst && caseBlockCst.children) {
            const lBraceCst = caseBlockCst.children.find(ch => ch.name === 'LBrace' || ch.value === '{')
            const rBraceCst = caseBlockCst.children.find(ch => ch.name === 'RBrace' || ch.value === '}')
            if (lBraceCst) lBraceToken = SlimeTokenCreate.createLBraceToken(lBraceCst.loc)
            if (rBraceCst) rBraceToken = SlimeTokenCreate.createRBraceToken(rBraceCst.loc)
        }

        return SlimeAstUtil.createSwitchStatement(
            discriminant, cases, cst.loc,
            switchToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }

    /**
     * 从 CaseBlock 提取所有 case/default 子句
     * CaseBlock: { CaseClauses? DefaultClause? CaseClauses? }
     */
    static extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        const cases: any[] = []

        if (!caseBlockCst.children) return cases

        caseBlockCst.children.forEach(child => {
            if (child.name === SlimeParser.prototype.CaseClauses?.name) {
                // CaseClauses 包含多个 CaseClause
                if (child.children) {
                    child.children.forEach(caseClauseCst => {
                        cases.push(this.createSwitchCaseAst(caseClauseCst))
                    })
                }
            } else if (child.name === SlimeParser.prototype.DefaultClause?.name) {
                // DefaultClause
                cases.push(this.createSwitchCaseAst(child))
            }
        })

        return cases
    }

    /**
     * [AST 类型映射] CaseClause/DefaultClause CST 到 SwitchCase AST
     * @internal
     */
    static createSwitchCaseAst(cst: SubhutiCst): any {
        let test = null
        let consequent: any[] = []
        let caseToken: any = undefined
        let defaultToken: any = undefined
        let colonToken: any = undefined

        if (cst.name === SlimeParser.prototype.CaseClause?.name) {
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
            for (const child of cst.children || []) {
                if (child.name === 'Default' || child.value === 'default') {
                    defaultToken = SlimeTokenCreate.createDefaultToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeTokenCreate.createColonToken(child.loc)
                }
            }

            test = null

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeCstToAstUtil.createStatementListAst(stmtListCst) : []
        }

        return SlimeAstUtil.createSwitchCase(consequent, test, cst.loc, caseToken, defaultToken, colonToken)
    }

    /**
     * 创建 return 语句 AST
     */
    static createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

        let argument: any = null
        let returnToken: any = undefined
        let semicolonToken: any = undefined

        const returnCst = cst.children[0]
        if (returnCst && (returnCst.name === 'Return' || returnCst.value === 'return')) {
            returnToken = SlimeTokenCreate.createReturnToken(returnCst.loc)
        }

        if (cst.children.length > 1) {
            for (let i = 1; i < cst.children.length; i++) {
                const child = cst.children[i]
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' || child.value === ';') {
                    semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
                } else if (!argument) {
                    argument = SlimeCstToAstUtil.createExpressionAst(child)
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }

    /**
     * 从Block CST创建BlockStatement AST
     * Block: LBrace StatementList? RBrace
     */
    static createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        checkCstName(cst, SlimeParser.prototype.Block?.name)

        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (cst.children) {
            for (const child of cst.children) {
                if (child.name === 'LBrace' || child.value === '{') {
                    lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                } else if (child.name === 'RBrace' || child.value === '}') {
                    rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                }
            }
        }

        const statementListCst = cst.children?.find(
            child => child.name === SlimeParser.prototype.StatementList?.name
        )

        const statements = statementListCst ? SlimeCstToAstUtil.createStatementListAst(statementListCst) : []

        return SlimeAstUtil.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken)
    }
}
