import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeBlockStatement } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
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
    static createTryStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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

        const block = blockCst ? util.createBlockAst(blockCst) : null
        const handler = catchCst ? util.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? this.createFinallyAst(finallyCst, util) : null

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }


    /**
     * 创建 CatchParameter AST
     */
    static createCatchParameterAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return util.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return util.createBindingPatternAst(first)
        }

        return null
    }

    /**
     * 创建 Finally 子句 AST
     */
    static createFinallyAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        checkCstName(cst, SlimeParser.prototype.Finally?.name);

        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        return blockCst ? util.createBlockAst(blockCst) : null
    }

    /**
     * 创建 throw 语句 AST
     */
    static createThrowStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                argument = util.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createThrowStatement(argument, cst.loc, throwToken, semicolonToken)
    }

    /**
     * 创建 break 语句 AST
     */
    static createBreakStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                label = util.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = util.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = util.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken)
    }

    /**
     * 创建 continue 语句 AST
     */
    static createContinueStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                label = util.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = util.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = util.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }


    /**
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     */
    static createLabelledStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);

        let label: any = null
        let body: any = null

        if (cst.children && cst.children.length > 0) {
            for (const child of cst.children) {
                if (!child) continue
                const name = child.name

                if (child.value === ':' || name === 'Colon') continue

                if (name === SlimeParser.prototype.LabelIdentifier?.name || name === 'LabelIdentifier') {
                    label = util.createLabelIdentifierAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                    const itemChild = child.children?.[0]
                    if (itemChild) {
                        body = util.createStatementDeclarationAst(itemChild)
                    }
                    continue
                }

                if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                    body = util.createStatementDeclarationAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.IdentifierName?.name) {
                    label = util.createIdentifierNameAst(child)
                    continue
                }
                if (name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                    label = util.createIdentifierAst(child)
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
    static createLabelledItemAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createStatementDeclarationAst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }

    /**
     * 创建 with 语句 AST
     */
    static createWithStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                object = util.createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const bodyArray = util.createStatementAst(child)
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
    static createDebuggerStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
    static createEmptyStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
    static createSemicolonASIAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return null
    }
}
