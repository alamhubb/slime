import {
    type SlimeStatement,
    type SlimeBlockStatement,
    type SlimeExpressionStatement,
    type SlimeReturnStatement,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createExpressionAst(cst: SubhutiCst): SlimeExpression;
    createStatementAst(cst: SubhutiCst): SlimeStatement[];
    createStatementListAst(cst: SubhutiCst): SlimeStatement[];
    createStatementDeclarationAst(cst: SubhutiCst): any;
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement;
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createBindingPatternAst(cst: SubhutiCst): SlimePattern;
    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression;
    createInitializerAst(cst: SubhutiCst): SlimeExpression;
    createCatchParameterAst(cst: SubhutiCst): SlimePattern | SlimeIdentifier;
    createFunctionDeclarationAst(cst: SubhutiCst): any;
    createVariableDeclarationAst(cst: SubhutiCst): any;
    createLexicalDeclarationAst(cst: SubhutiCst): any;
    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): any;
};

/**
 * 语句相关的 CST to AST 转换
 */
export class StatementCstToAst {
    /**
     * 创建 BlockStatement 的 AST
     */
    static createBlockStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeBlockStatement {
        let statements: SlimeStatement[]

        if (cst.name === SlimeParser.prototype.StatementList?.name) {
            statements = converter.createStatementListAst(cst)
        } else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            const blockCst = cst.children?.[0]
            if (blockCst && blockCst.name === SlimeParser.prototype.Block?.name) {
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeParser.prototype.StatementList?.name
                )
                statements = statementListCst ? converter.createStatementListAst(statementListCst) : []
            } else {
                statements = []
            }
        } else {
            throw new Error(`Expected StatementList or BlockStatement, got ${cst.name}`)
        }

        return {
            type: SlimeNodeType.BlockStatement as any,
            body: statements,
            loc: cst.loc
        }
    }

    /**
     * 创建 ReturnStatement 的 AST
     */
    static createReturnStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeReturnStatement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

        let argument: SlimeExpression | null = null
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
                    argument = converter.createExpressionAst(child)
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }

    /**
     * 创建 ExpressionStatement 的 AST
     */
    static createExpressionStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpressionStatement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);

        let semicolonToken: any = undefined
        let expression: SlimeExpression | null = null

        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                       child.name === 'Expression' ||
                       !expression) {
                expression = converter.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createExpressionStatement(expression!, cst.loc, semicolonToken)
    }

    /**
     * 创建 IfStatement 的 AST
     */
    static createIfStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.IfStatement?.name);

        let test: SlimeExpression | null = null
        let consequent: SlimeStatement | null = null
        let alternate: SlimeStatement | null = null
        let ifToken: any = undefined
        let elseToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        let foundElse = false

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name

            if (name === 'If' || child.value === 'if') {
                ifToken = SlimeTokenCreate.createIfToken(child.loc)
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'Else' || child.value === 'else') {
                elseToken = SlimeTokenCreate.createElseToken(child.loc)
                foundElse = true
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = converter.createExpressionAst(child)
            } else if (name === SlimeParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = StatementCstToAst.createIfStatementBodyAst(child, converter)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
            } else if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = converter.createStatementAst(child)
                const body = Array.isArray(stmts) ? stmts[0] : stmts
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
            }
        }

        return SlimeAstUtil.createIfStatement(test, consequent, alternate, cst.loc, ifToken, elseToken, lParenToken, rParenToken)
    }

    /**
     * 创建 IfStatementBody 的 AST
     */
    static createIfStatementBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = converter.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return converter.createFunctionDeclarationAst(child)
            }
        }

        return converter.createStatementDeclarationAst(cst)
    }

    /**
     * 创建 WhileStatement 的 AST
     */
    static createWhileStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.WhileStatement?.name);

        let whileToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'While' || child.value === 'while') {
                whileToken = SlimeTokenCreate.createWhileToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            }
        }

        const expression = cst.children.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const statement = cst.children.find(ch => ch.name === SlimeParser.prototype.Statement?.name)

        const test = expression ? converter.createExpressionAst(expression) : null
        const bodyArray = statement ? converter.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 DoWhileStatement 的 AST
     */
    static createDoWhileStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.DoWhileStatement?.name);

        let doToken: any = undefined
        let whileToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let semicolonToken: any = undefined
        let body: any = null
        let test: any = null

        for (const child of cst.children) {
            if (!child) continue
            const name = child.name

            if (name === 'Do' || child.value === 'do') {
                doToken = SlimeTokenCreate.createDoToken(child.loc)
            } else if (name === 'While' || child.value === 'while') {
                whileToken = SlimeTokenCreate.createWhileToken(child.loc)
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const bodyArray = converter.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = converter.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }

    /**
     * 创建 BreakStatement 的 AST
     */
    static createBreakStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.BreakStatement?.name);

        let breakToken: any = undefined
        let semicolonToken: any = undefined
        let label: SlimeIdentifier | null = null

        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') {
                breakToken = SlimeTokenCreate.createBreakToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = converter.createLabelIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken)
    }

    /**
     * 创建 ContinueStatement 的 AST
     */
    static createContinueStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name);

        let continueToken: any = undefined
        let semicolonToken: any = undefined
        let label: SlimeIdentifier | null = null

        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') {
                continueToken = SlimeTokenCreate.createContinueToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = converter.createLabelIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }

    /**
     * 创建 ThrowStatement 的 AST
     */
    static createThrowStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name);

        let throwToken: any = undefined
        let semicolonToken: any = undefined
        let argument: SlimeExpression | null = null

        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') {
                throwToken = SlimeTokenCreate.createThrowToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                argument = converter.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createThrowStatement(argument!, cst.loc, throwToken, semicolonToken)
    }

    /**
     * 创建 TryStatement 的 AST
     */
    static createTryStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.TryStatement?.name);

        let tryToken: any = undefined
        let block: SlimeBlockStatement | null = null
        let handler: any = null
        let finalizer: SlimeBlockStatement | null = null

        for (const child of cst.children || []) {
            if (child.name === 'Try' || child.value === 'try') {
                tryToken = SlimeTokenCreate.createTryToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Block?.name || child.name === 'Block') {
                if (!block) {
                    block = converter.createBlockAst(child)
                }
            } else if (child.name === SlimeParser.prototype.Catch?.name || child.name === 'Catch') {
                handler = StatementCstToAst.createCatchAst(child, converter)
            } else if (child.name === SlimeParser.prototype.Finally?.name || child.name === 'Finally') {
                finalizer = StatementCstToAst.createFinallyAst(child, converter)
            }
        }

        return SlimeAstUtil.createTryStatement(block!, handler, finalizer, cst.loc, tryToken)
    }

    /**
     * 创建 Catch 的 AST
     */
    static createCatchAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.Catch?.name);

        let catchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Catch' || child.value === 'catch') {
                catchToken = SlimeTokenCreate.createCatchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            }
        }

        const paramCst = cst.children.find(ch => ch.name === SlimeParser.prototype.CatchParameter?.name)
        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)

        const param = paramCst ? converter.createCatchParameterAst(paramCst) : null
        const body = blockCst ? converter.createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken)
    }

    /**
     * 创建 Finally 的 AST
     */
    static createFinallyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeBlockStatement {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.Finally?.name);

        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        return blockCst ? converter.createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([])
    }

    /**
     * 创建 LabelledStatement 的 AST
     */
    static createLabelledStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);

        let label: SlimeIdentifier | null = null
        let body: SlimeStatement | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = converter.createLabelIdentifierAst(child)
            } else if (child.name === 'Colon' || child.value === ':') {
                // colonToken 暂不使用
            } else if (child.name === SlimeParser.prototype.LabelledItem?.name || child.name === 'LabelledItem') {
                body = converter.createStatementDeclarationAst(child.children?.[0])
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const stmts = converter.createStatementAst(child)
                body = Array.isArray(stmts) ? stmts[0] : stmts
            }
        }

        return SlimeAstUtil.createLabeledStatement(label!, body!, cst.loc)
    }

    /**
     * 创建 WithStatement 的 AST
     */
    static createWithStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.WithStatement?.name);

        let withToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let object: SlimeExpression | null = null
        let body: SlimeStatement | null = null

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = SlimeTokenCreate.createWithToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = child
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                object = converter.createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const stmts = converter.createStatementAst(child)
                body = Array.isArray(stmts) ? stmts[0] : stmts
            }
        }

        return SlimeAstUtil.createWithStatement(object!, body!, cst.loc, withToken, lParenToken, rParenToken)
    }

    /**
     * 创建 DebuggerStatement 的 AST
     */
    static createDebuggerStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.DebuggerStatement?.name);

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
     * 创建 EmptyStatement 的 AST
     */
    static createEmptyStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.EmptyStatement?.name);

        let semicolonToken: any = undefined
        const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
        }

        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }
}
