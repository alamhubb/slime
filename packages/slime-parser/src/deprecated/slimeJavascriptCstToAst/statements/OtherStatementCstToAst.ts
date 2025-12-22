import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstUtil,
    SlimeJavascriptBlockStatement, SlimeJavascriptExpressionStatement,
    SlimeJavascriptFunctionDeclaration,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier,
    SlimeJavascriptAstTypeName, type SlimeJavascriptPattern, SlimeJavascriptReturnStatement, SlimeJavascriptTokenCreate, type SlimeJavascriptVariableDeclarator
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

/**
 * OtherStatementCstToAst - try/switch/break/continue/label 等转换
 */
export class OtherStatementCstToAst {

    static createReturnStatementAst(cst: SubhutiCst): SlimeJavascriptReturnStatement {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ReturnStatement?.name);

        // return 语句可能有或没有表达�?
        // children[0] = ReturnTok
        // children[1] = Expression? | Semicolon | SemicolonASI
        let argument: any = null
        let returnToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 return token
        const returnCst = cst.children[0]
        if (returnCst && (returnCst.name === 'Return' || returnCst.value === 'return')) {
            returnToken = SlimeJavascriptTokenCreate.createReturnToken(returnCst.loc)
        }

        if (cst.children.length > 1) {
            for (let i = 1; i < cst.children.length; i++) {
                const child = cst.children[i]
                // 跳过分号相关节点
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' ||
                    child.name === 'Semicolon' || child.value === ';') {
                    semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
                } else if (!argument) {
                    argument = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
                }
            }
        }

        return SlimeJavascriptAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }


    /**
     * 创建 break 语句 AST
     */
    static createBreakStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.BreakStatement?.name);
        // BreakStatement: break Identifier? ;

        let breakToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Break' || child.value === 'break') {
                breakToken = SlimeJavascriptTokenCreate.createBreakToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeJavascriptParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeJavascriptCstToAstUtil.createLabelIdentifierAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                label = SlimeJavascriptCstToAstUtil.createIdentifierNameAst(child)
            } else if (child.name === SlimeJavascriptTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeJavascriptCstToAstUtil.createIdentifierAst(child)
            }
        }

        return SlimeJavascriptAstUtil.createBreakStatement(label, cst.loc, breakToken, semicolonToken)
    }


    /**
     * 创建 continue 语句 AST
     */
    static createContinueStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ContinueStatement?.name);
        // ContinueStatement: continue Identifier? ;

        let continueToken: any = undefined
        let semicolonToken: any = undefined
        let label: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Continue' || child.value === 'continue') {
                continueToken = SlimeJavascriptTokenCreate.createContinueToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeJavascriptParser.prototype.LabelIdentifier?.name || child.name === 'LabelIdentifier') {
                label = SlimeJavascriptCstToAstUtil.createLabelIdentifierAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                label = SlimeJavascriptCstToAstUtil.createIdentifierNameAst(child)
            } else if (child.name === SlimeJavascriptTokenConsumer.prototype.IdentifierName?.name) {
                label = SlimeJavascriptCstToAstUtil.createIdentifierAst(child)
            }
        }

        return SlimeJavascriptAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }


    /**
     * 创建 try 语句 AST
     */
    static createTryStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.TryStatement?.name);
        // TryStatement: TryTok Block (Catch Finally? | Finally)

        let tryToken: any = undefined
        let finallyToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Try' || child.value === 'try') {
                tryToken = SlimeJavascriptTokenCreate.createTryToken(child.loc)
            } else if (child.name === 'Finally' || child.value === 'finally') {
                finallyToken = SlimeJavascriptTokenCreate.createFinallyToken(child.loc)
            }
        }

        const blockCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Block?.name)
        const catchCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Catch?.name)
        const finallyCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Finally?.name)

        const block = blockCst ? SlimeJavascriptCstToAstUtil.createBlockAst(blockCst) : null
        const handler = catchCst ? SlimeJavascriptCstToAstUtil.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? SlimeJavascriptCstToAstUtil.createFinallyAst(finallyCst) : null

        return SlimeJavascriptAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }


    /**
     * Catch CST �?CatchClause AST
     * Catch -> catch ( CatchParameter ) Block | catch Block
     */
    static createCatchAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Catch?.name);
        // Catch: CatchTok LParen CatchParameter RParen Block

        let catchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Catch' || child.value === 'catch') {
                catchToken = SlimeJavascriptTokenCreate.createCatchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
            }
        }

        const paramCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.CatchParameter?.name)
        const blockCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Block?.name)

        const param = paramCst ? SlimeJavascriptCstToAstUtil.createCatchParameterAst(paramCst) : null
        const body = blockCst ? SlimeJavascriptCstToAstUtil.createBlockAst(blockCst) : SlimeJavascriptAstUtil.createBlockStatement([])

        return SlimeJavascriptAstUtil.createCatchClause(body, param, cst.loc, catchToken, lParenToken, rParenToken)
    }


    /**
     * 创建 CatchParameter AST
     */
    static createCatchParameterAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.CatchParameter?.name);
        // CatchParameter: BindingIdentifier | BindingPattern
        const first = cst.children[0]

        if (first.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name) {
            return SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.BindingPattern?.name) {
            return SlimeJavascriptCstToAstUtil.createBindingPatternAst(first)
        }

        return null
    }


    /**
     * 创建 Finally 子句 AST
     */
    static createFinallyAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Finally?.name);
        // Finally: FinallyTok Block

        const blockCst = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Block?.name)
        return blockCst ? SlimeJavascriptCstToAstUtil.createBlockAst(blockCst) : null
    }


    /**
     * 创建 throw 语句 AST
     */
    static createThrowStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ThrowStatement?.name);
        // ThrowStatement: throw Expression ;

        let throwToken: any = undefined
        let semicolonToken: any = undefined
        let argument: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Throw' || child.value === 'throw') {
                throwToken = SlimeJavascriptTokenCreate.createThrowToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeJavascriptParser.prototype.Expression?.name || child.name === 'Expression') {
                argument = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
            }
        }

        return SlimeJavascriptAstUtil.createThrowStatement(argument, cst.loc, throwToken, semicolonToken)
    }


    static createExpressionStatementAst(cst: SubhutiCst): SlimeJavascriptExpressionStatement {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ExpressionStatement?.name);

        let semicolonToken: any = undefined
        let expression: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeJavascriptParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                !expression) {
                expression = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
            }
        }

        return SlimeJavascriptAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken)
    }


    /**
     * 创建空语�?AST
     */
    static createEmptyStatementAst(cst: SubhutiCst): any {
        // 兼容 EmptyStatement 和旧�?NotEmptySemicolon
        // SlimeJavascriptCstToAstUtil.checkCstName(cst, Es2025Parser.prototype.EmptyStatement?.name);

        let semicolonToken: any = undefined

        // EmptyStatement 可能直接�?Semicolon token
        if (cst.value === ';' || cst.name === SlimeJavascriptTokenConsumer.prototype.Semicolon?.name) {
            semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(cst.loc)
        } else {
            // �?semicolon token
            const semicolonCst = cst.children?.find(ch => ch.name === 'Semicolon' || ch.value === ';')
            if (semicolonCst) {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(semicolonCst.loc)
            }
        }

        return SlimeJavascriptAstUtil.createEmptyStatement(cst.loc, semicolonToken)
    }


    /**
     * SemicolonASI CST �?AST
     * 处理自动分号插入
     */
    static createSemicolonASIAst(cst: SubhutiCst): any {
        // ASI 不产生实际的 AST 节点，返�?null
        return null
    }


    /**
     * 创建 debugger 语句 AST
     */
    static createDebuggerStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.DebuggerStatement?.name);

        let debuggerToken: any = undefined
        let semicolonToken: any = undefined

        for (const child of cst.children || []) {
            if (child.name === 'Debugger' || child.value === 'debugger') {
                debuggerToken = SlimeJavascriptTokenCreate.createDebuggerToken(child.loc)
            } else if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            }
        }

        return SlimeJavascriptAstUtil.createDebuggerStatement(cst.loc, debuggerToken, semicolonToken)
    }


    /**
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     * LabelledItem -> Statement | FunctionDeclaration
     */
    static createLabelledStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.LabelledStatement?.name);

        let label: any = null
        let body: any = null

        if (cst.children && cst.children.length > 0) {
            for (const child of cst.children) {
                if (!child) continue
                const name = child.name

                // Skip tokens (Colon)
                if (child.value === ':' || name === 'Colon') continue

                // LabelIdentifier -> Identifier | yield | await
                if (name === SlimeJavascriptParser.prototype.LabelIdentifier?.name || name === 'LabelIdentifier') {
                    label = SlimeJavascriptCstToAstUtil.createLabelIdentifierAst(child)
                    continue
                }

                // LabelledItem -> Statement | FunctionDeclaration
                if (name === SlimeJavascriptParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                    // LabelledItem 内部�?Statement �?FunctionDeclaration
                    const itemChild = child.children?.[0]
                    if (itemChild) {
                        // 使用 createStatementDeclarationAst 而不�?createStatementAst
                        // 因为 LabelledItem 可能直接包含 FunctionDeclaration
                        body = SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(itemChild)
                    }
                    continue
                }

                // 旧版兼容：直接是 Statement
                if (name === SlimeJavascriptParser.prototype.Statement?.name || name === 'Statement') {
                    body = SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(child)
                    continue
                }

                // 旧版兼容：直接是 Identifier
                if (name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                    label = SlimeJavascriptCstToAstUtil.createIdentifierNameAst(child)
                    continue
                }
                if (name === SlimeJavascriptTokenConsumer.prototype.IdentifierName?.name) {
                    label = SlimeJavascriptCstToAstUtil.createIdentifierAst(child)
                    continue
                }
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.LabeledStatement,
            label: label,
            body: body,
            loc: cst.loc
        }
    }


    /**
     * LabelledItem CST �?AST（透传�?
     * LabelledItem -> Statement | FunctionDeclaration
     */
    static createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }


    /**
     * 创建 with 语句 AST
     * WithStatement: with ( Expression ) Statement
     */
    static createWithStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.WithStatement?.name);

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
            } else if (child.name === SlimeJavascriptParser.prototype.Expression?.name || child.name === 'Expression') {
                object = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.Statement?.name || child.name === 'Statement') {
                // createStatementAst 返回数组，取第一个元�?
                const bodyArray = SlimeJavascriptCstToAstUtil.createStatementAst(child)
                body = Array.isArray(bodyArray) && bodyArray.length > 0 ? bodyArray[0] : bodyArray
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.WithStatement,
            object,
            body,
            withToken,
            lParenToken,
            rParenToken,
            loc: cst.loc
        }
    }


}
