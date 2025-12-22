import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeBlockStatement,
    SlimeFunctionDeclaration,
    SlimeFunctionParam,
    SlimeIdentifier,
    SlimeNodeType, type SlimePattern, SlimeTokenCreate, type SlimeVariableDeclarator
} from "slime-ast";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * OtherStatementCstToAst - try/switch/break/continue/label 等转换
 */
export class OtherStatementCstToAst {


    /**
     * SemicolonASI CST �?AST
     * 处理自动分号插入
     */
    createSemicolonASIAst(cst: SubhutiCst): any {
        // ASI 不产生实际的 AST 节点，返�?null
        return null
    }

    /**
     * 创建空语�?AST
     */
    createEmptyStatementAst(cst: SubhutiCst): any {
        // 兼容 EmptyStatement 和旧�?NotEmptySemicolon
        // SlimeAstUtils.checkCstName(cst, Es2025Parser.prototype.EmptyStatement?.name);

        let semicolonToken: any = undefined

        // EmptyStatement 可能直接�?Semicolon token
        if (cst.value === ';' || cst.name === SlimeTokenConsumer.prototype.Semicolon?.name) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(cst.loc)
        } else {
            // �?semicolon token
            const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';')
            if (semicolonCst) {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
            }
        }

        return SlimeAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }

    /**
     * 创建 throw 语句 AST
     */
    createThrowStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name);
        // ThrowStatement: throw Expression ;

        let throwToken: any = undefined
        let semicolonToken: any = undefined
        let argument: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') {
                throwToken = SlimeTokenCreate.createThrowToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                argument = this.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createThrowStatement(argument, cst.loc, throwToken, semicolonToken)
    }

    /**
     * 创建 break 语句 AST
     */
    createBreakStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BreakStatement?.name);
        // BreakStatement: break Identifier? ;

        let breakToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') {
                breakToken = SlimeTokenCreate.createBreakToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = this.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = this.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = this.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken)
    }

    /**
     * 创建 continue 语句 AST
     */
    createContinueStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name);
        // ContinueStatement: continue Identifier? ;

        let continueToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') {
                continueToken = SlimeTokenCreate.createContinueToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = this.createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = this.createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = this.createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }


    /**
     * 创建 try 语句 AST
     */
    createTryStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.TryStatement?.name);
        // TryStatement: TryTok Block (Catch Finally? | Finally)

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

        const block = blockCst ? this.createBlockAst(blockCst) : null
        const handler = catchCst ? this.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? this.createFinallyAst(finallyCst) : null

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }




    /**
     * 创建 Finally 子句 AST
     */
    createFinallyAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.Finally?.name);
        // Finally: FinallyTok Block

        const blockCst = cst.children.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        return blockCst ? this.createBlockAst(blockCst) : null
    }





    /**
     * Catch CST �?CatchClause AST
     * Catch -> catch ( CatchParameter ) Block | catch Block
     */
    createCatchAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.Catch?.name);
        // Catch: CatchTok LParen CatchParameter RParen Block

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

        const param = paramCst ? this.createCatchParameterAst(paramCst) : null
        const body = blockCst ? this.createBlockAst(blockCst) : SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken)
    }

    /**
     * 创建 CatchParameter AST
     */
    createCatchParameterAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        // CatchParameter: BindingIdentifier | BindingPattern
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return this.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return this.createBindingPatternAst(first)
        }

        return null
    }

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

        // return 语句可能有或没有表达�?
        // children[0] = ReturnTok
        // children[1] = Expression? | Semicolon | SemicolonASI
        let argument: any = null
        let returnToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 return token
        const returnCst = cst.children[0]
        if (returnCst && (returnCst.name === 'Return' || returnCst.value === 'return')) {
            returnToken = SlimeTokenCreate.createReturnToken(returnCst.loc)
        }

        if (cst.children.length > 1) {
            for (let i = 1; i < cst.children.length; i++) {
                const child = cst.children[i]
                // 跳过分号相关节点
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' ||
                    child.name === 'Semicolon' || child.value === ';') {
                    semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
                } else if (!argument) {
                    argument = this.createExpressionAst(child)
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }

    createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);

        let semicolonToken: any = undefined
        let expression: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                !expression) {
                expression = this.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken)
    }



    /**
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     * LabelledItem -> Statement | FunctionDeclaration
     */
    createLabelledStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);

        let label: any = null
        let body: any = null

        if (cst.children && cst.children.length > 0) {
            for (const child of cst.children) {
                if (!child) continue
                const name = child.name

                // Skip tokens (Colon)
                if (child.value === ':' || name === 'Colon') continue

                // LabelIdentifier -> Identifier | yield | await
                if (name === SlimeParser.prototype.LabelIdentifier?.name || name === 'LabelIdentifier') {
                    label = this.createLabelIdentifierAst(child)
                    continue
                }

                // LabelledItem -> Statement | FunctionDeclaration
                if (name === SlimeParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                    // LabelledItem 内部�?Statement �?FunctionDeclaration
                    const itemChild = child.children?.[0]
                    if (itemChild) {
                        // 使用 createStatementDeclarationAst 而不�?createStatementAst
                        // 因为 LabelledItem 可能直接包含 FunctionDeclaration
                        body = this.createStatementDeclarationAst(itemChild)
                    }
                    continue
                }

                // 旧版兼容：直接是 Statement
                if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                    body = this.createStatementDeclarationAst(child)
                    continue
                }

                // 旧版兼容：直接是 Identifier
                if (name === SlimeParser.prototype.IdentifierName?.name) {
                    label = this.createIdentifierNameAst(child)
                    continue
                }
                if (name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                    label = this.createIdentifierAst(child)
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
     * 创建 with 语句 AST
     * WithStatement: with ( Expression ) Statement
     */
    createWithStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.WithStatement?.name);

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
                object = this.createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                // createStatementAst 返回数组，取第一个元�?
                const bodyArray = this.createStatementAst(child)
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
    createDebuggerStatementAst(cst: SubhutiCst): any {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.DebuggerStatement?.name);

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
     * LabelledItem CST �?AST（透传�?
     * LabelledItem -> Statement | FunctionDeclaration
     */
    createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createStatementDeclarationAst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }

}
