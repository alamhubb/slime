import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeBlockStatement,
    type SlimeFunctionDeclaration, type SlimeFunctionParam,
    type SlimeIdentifier, SlimeNodeType, type SlimePattern,
    SlimeTokenCreate, type SlimeVariableDeclaration, type SlimeVariableDeclarator,
    type SlimeStatement, type SlimeExpressionStatement, type SlimeFunctionExpression,
    type SlimeReturnStatement
} from "slime-ast";
import SlimeParser from "../SlimeParser.ts";
import SlimeTokenConsumer from "../SlimeTokenConsumer.ts";
import {checkCstName} from "./SlimeCstToAstTools.ts";

// 使用全局变量存储 util 实例，由 SlimeCstToAstUtil 初始化
let _slimeCstToAstUtil: any = null;

export function setSlimeCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized. Call setSlimeCstToAstUtil first.');
    }
    return _slimeCstToAstUtil;
}

/**
 * 语句相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class StatementCstToAst {
    static createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => StatementCstToAst.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)
        return statements
    }

    /**
     * 创建 var 变量声明语句 AST
     * ES2025 VariableStatement: var VariableDeclarationList ;
     */
    static createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue

            if (child.name === SlimeParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeParser.prototype.VariableDeclaration?.name ||
                        varDeclCst.name === 'VariableDeclaration') {
                        declarations.push(getUtil().createVariableDeclaratorFromVarDeclaration(varDeclCst))
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.VariableDeclaration,
            kind: 'var' as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }

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

        const block = blockCst ? StatementCstToAst.createBlockAst(blockCst) : null
        const handler = catchCst ? StatementCstToAst.createCatchAst(catchCst) : null
        const finalizer = finallyCst ? StatementCstToAst.createFinallyAst(finallyCst) : null

        return SlimeAstUtil.createTryStatement(block, handler, finalizer, cst.loc, tryToken, finallyToken)
    }

    /**
     * 创建 Block AST
     */
    static createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        const statementListCst = cst.children?.find(
            child => child.name === SlimeParser.prototype.StatementList?.name
        )
        const statements = statementListCst ? StatementCstToAst.createStatementListAst(statementListCst) : []
        
        return {
            type: SlimeNodeType.BlockStatement as any,
            body: statements,
            loc: cst.loc
        }
    }

    /**
     * 创建 Catch 子句 AST
     */
    static createCatchAst(cst: SubhutiCst): any {
        let catchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let param: any = null
        let body: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Catch' || child.value === 'catch') {
                catchToken = SlimeTokenCreate.createCatchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (child.name === SlimeParser.prototype.CatchParameter?.name || child.name === 'CatchParameter') {
                param = getUtil().createAstFromCst(child.children[0])
            } else if (child.name === SlimeParser.prototype.Block?.name || child.name === 'Block') {
                body = StatementCstToAst.createBlockAst(child)
            }
        }

        return SlimeAstUtil.createCatchClause(param, body, cst.loc, catchToken, lParenToken, rParenToken)
    }

    /**
     * 创建 Finally 子句 AST
     */
    static createFinallyAst(cst: SubhutiCst): SlimeBlockStatement {
        const blockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Block?.name)
        if (blockCst) {
            return StatementCstToAst.createBlockAst(blockCst)
        }
        return {
            type: SlimeNodeType.BlockStatement as any,
            body: [],
            loc: cst.loc
        }
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
                argument = getUtil().createExpressionAst(child)
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
                label = getUtil().createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = getUtil().createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = getUtil().createIdentifierAst(child)
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
                label = getUtil().createLabelIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.IdentifierName?.name) {
                label = getUtil().createIdentifierNameAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                label = getUtil().createIdentifierAst(child)
            }
        }

        return SlimeAstUtil.createContinueStatement(label, cst.loc, continueToken, semicolonToken)
    }

    /**
     * 创建标签语句 AST
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
                    label = getUtil().createLabelIdentifierAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.LabelledItem?.name || name === 'LabelledItem') {
                    const itemChild = child.children?.[0]
                    if (itemChild) {
                        body = StatementCstToAst.createStatementDeclarationAst(itemChild)
                    }
                    continue
                }

                if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                    body = StatementCstToAst.createStatementDeclarationAst(child)
                    continue
                }

                if (name === SlimeParser.prototype.IdentifierName?.name) {
                    label = getUtil().createIdentifierNameAst(child)
                    continue
                }
                if (name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
                    label = getUtil().createIdentifierAst(child)
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
                object = getUtil().createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.Statement?.name || child.name === 'Statement') {
                const bodyArray = StatementCstToAst.createStatementAst(child)
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
     * 创建 BlockStatement AST
     */
    static createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeStatement>

        if (cst.name === SlimeParser.prototype.StatementList?.name) {
            statements = StatementCstToAst.createStatementListAst(cst)
        }
        else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            const blockCst = cst.children?.[0]
            if (blockCst && blockCst.name === SlimeParser.prototype.Block?.name) {
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeParser.prototype.StatementList?.name
                )
                if (statementListCst) {
                    statements = StatementCstToAst.createStatementListAst(statementListCst)
                } else {
                    statements = []
                }
            } else {
                statements = []
            }
        }
        else {
            throw new Error(`Expected StatementList or BlockStatement, got ${cst.name}`)
        }

        const ast: SlimeBlockStatement = {
            type: SlimeParser.prototype.BlockStatement?.name as any,
            body: statements,
            loc: cst.loc
        }
        return ast
    }

    static createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        const astName = checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

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
                if (child.name === 'Semicolon' || child.name === 'SemicolonASI' ||
                    child.name === 'Semicolon' || child.value === ';') {
                    semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
                } else if (!argument) {
                    argument = getUtil().createExpressionAst(child)
                }
            }
        }

        return SlimeAstUtil.createReturnStatement(argument, cst.loc, returnToken, semicolonToken)
    }

    static createExpressionStatementAst(cst: SubhutiCst): SlimeExpressionStatement {
        const astName = checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);

        let semicolonToken: any = undefined
        let expression: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                !expression) {
                expression = getUtil().createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken)
    }

    /**
     * 创建 if 语句 AST
     */
    static createIfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.IfStatement?.name);

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

            if (name === 'If' || child.value === 'if') {
                ifToken = SlimeTokenCreate.createIfToken(child.loc)
                continue
            }
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'Else' || child.value === 'else') {
                elseToken = SlimeTokenCreate.createElseToken(child.loc)
                foundElse = true
                continue
            }
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = getUtil().createExpressionAst(child)
                continue
            }
            if (name === SlimeParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = StatementCstToAst.createIfStatementBodyAst(child)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = StatementCstToAst.createStatementAst(child)
                const body = Array.isArray(stmts) ? stmts[0] : stmts
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }
        }

        return SlimeAstUtil.createIfStatement(test, consequent, alternate, cst.loc, ifToken, elseToken, lParenToken, rParenToken)
    }

    /**
     * 创建 IfStatementBody AST
     */
    static createIfStatementBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = StatementCstToAst.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return getUtil().createFunctionDeclarationAst(child)
            }
        }

        return StatementCstToAst.createStatementDeclarationAst(cst)
    }


    /**
     * 创建 for 语句 AST
     */
    static createForStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForStatement?.name);

        let init: any = null
        let test: any = null
        let update: any = null
        let body: any = null
        let forToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        const semicolonTokens: any[] = []

        const children = cst.children || []
        const expressions: any[] = []
        let hasLexicalDeclaration = false

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === 'For' || child.value === 'for') {
                forToken = SlimeTokenCreate.createForToken(child.loc)
                continue
            }
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'Var' || child.value === 'var') continue
            if (name === 'Semicolon' || child.value === ';' || child.loc?.type === 'Semicolon') {
                semicolonTokens.push(SlimeTokenCreate.createSemicolonToken(child.loc))
                continue
            }
            if (name === SlimeParser.prototype.VariableDeclarationList?.name || name === 'VariableDeclarationList') {
                init = getUtil().createVariableDeclarationFromList(child, 'var')
                continue
            }
            if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
                init = getUtil().createLexicalDeclarationAst(child)
                hasLexicalDeclaration = true
                continue
            }
            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                init = getUtil().createVariableDeclarationAst(child)
                continue
            }
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                expressions.push(getUtil().createExpressionAst(child))
                continue
            }
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = StatementCstToAst.createStatementAst(child)
                body = Array.isArray(stmts) ? stmts[0] : stmts
                continue
            }
        }

        if (hasLexicalDeclaration) {
            if (expressions.length >= 1) test = expressions[0]
            if (expressions.length >= 2) update = expressions[1]
        } else if (init) {
            if (expressions.length >= 1) test = expressions[0]
            if (expressions.length >= 2) update = expressions[1]
        } else {
            if (expressions.length >= 1) init = expressions[0]
            if (expressions.length >= 2) test = expressions[1]
            if (expressions.length >= 3) update = expressions[2]
        }

        return SlimeAstUtil.createForStatement(
            body, init, test, update, cst.loc,
            forToken, lParenToken, rParenToken,
            semicolonTokens[0], semicolonTokens[1]
        )
    }

    /**
     * 创建 for...in / for...of 语句 AST
     */
    static createForInOfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForInOfStatement?.name);

        const hasAwait = cst.children.some(ch => ch.name === 'Await')

        let left: any = null
        let right: any = null
        let body: any = null
        let isForOf = false

        const forDeclarationCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.ForDeclaration?.name ||
            ch.name === 'ForDeclaration'
        )
        const leftHandSideCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.LeftHandSideExpression?.name ||
            ch.name === 'LeftHandSideExpression'
        )
        const varBindingCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name ||
            ch.name === 'ForBinding'
        )

        const varTokenCst = cst.children.find(ch => ch.name === 'Var' || ch.value === 'var')
        const bindingIdCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier'
        )
        const initializerCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer'
        )

        if (forDeclarationCst) {
            const letOrConstCst = forDeclarationCst.children[0]
            const forBindingCst = forDeclarationCst.children[1]
            const actualBinding = forBindingCst.children[0]
            let id;

            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = getUtil().createBindingPatternAst(actualBinding);
            } else if (actualBinding.name === SlimeParser.prototype.BindingIdentifier?.name || actualBinding.name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(actualBinding);
            } else {
                id = getUtil().createBindingIdentifierAst(actualBinding);
            }

            const kind = letOrConstCst.children[0].value

            left = {
                type: SlimeNodeType.VariableDeclaration,
                declarations: [{
                    type: SlimeNodeType.VariableDeclarator,
                    id: id,
                    init: null,
                    loc: forBindingCst.loc
                }],
                kind: {
                    type: 'VariableDeclarationKind',
                    value: kind,
                    loc: letOrConstCst.loc
                },
                loc: forDeclarationCst.loc
            }
        } else if (varTokenCst && bindingIdCst && initializerCst) {
            const id = getUtil().createBindingIdentifierAst(bindingIdCst)
            const init = getUtil().createInitializerAst(initializerCst)
            left = {
                type: SlimeNodeType.VariableDeclaration,
                declarations: [{
                    type: SlimeNodeType.VariableDeclarator,
                    id: id,
                    init: init,
                    loc: {
                        ...bindingIdCst.loc,
                        end: initializerCst.loc.end
                    }
                }],
                kind: {
                    type: 'VariableDeclarationKind',
                    value: 'var',
                    loc: varTokenCst.loc
                },
                loc: {
                    ...varTokenCst.loc,
                    end: initializerCst.loc.end
                }
            }
        } else if (leftHandSideCst) {
            left = getUtil().createLeftHandSideExpressionAst(leftHandSideCst)
        } else if (varBindingCst) {
            const actualBinding = varBindingCst.children[0]
            let id;
            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = getUtil().createBindingPatternAst(actualBinding);
            } else {
                id = getUtil().createBindingIdentifierAst(actualBinding);
            }
            left = {
                type: SlimeNodeType.VariableDeclaration,
                declarations: [{
                    type: SlimeNodeType.VariableDeclarator,
                    id: id,
                    init: null,
                    loc: varBindingCst.loc
                }],
                kind: {
                    type: 'VariableDeclarationKind',
                    value: 'var',
                    loc: cst.children.find(ch => ch.name === 'Var')?.loc
                },
                loc: varBindingCst.loc
            }
        }

        const inOrOfCst = cst.children.find(ch =>
            ch.name === 'In' || ch.name === 'Of' ||
            ch.value === 'in' || ch.value === 'of'
        )
        isForOf = inOrOfCst?.value === 'of' || inOrOfCst?.name === 'OfTok'

        const inOrOfIndex = cst.children.indexOf(inOrOfCst)
        if (inOrOfIndex !== -1 && inOrOfIndex + 1 < cst.children.length) {
            const rightCst = cst.children[inOrOfIndex + 1]
            if (rightCst.name !== 'RParen') {
                right = getUtil().createExpressionAst(rightCst)
            }
        }

        const statementCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Statement?.name ||
            ch.name === 'Statement'
        )
        if (statementCst) {
            const bodyStatements = StatementCstToAst.createStatementAst(statementCst)
            body = Array.isArray(bodyStatements) && bodyStatements.length > 0
                ? bodyStatements[0]
                : bodyStatements
        }

        const result: any = {
            type: isForOf ? SlimeNodeType.ForOfStatement : SlimeNodeType.ForInStatement,
            left: left,
            right: right,
            body: body,
            loc: cst.loc
        }

        if (hasAwait) {
            result.await = true
        }

        return result
    }

    /**
     * 创建 while 语句 AST
     */
    static createWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WhileStatement?.name);

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

        const test = expression ? getUtil().createExpressionAst(expression) : null
        const bodyArray = statement ? StatementCstToAst.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 do...while 语句 AST
     */
    static createDoWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DoWhileStatement?.name);

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
                const bodyArray = StatementCstToAst.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = getUtil().createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }

    /**
     * 创建 switch 语句 AST
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

        const discriminantCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? getUtil().createExpressionAst(discriminantCst) : null

        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? StatementCstToAst.extractCasesFromCaseBlock(caseBlockCst) : []

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
     * 从 CaseBlock 提取 cases
     */
    static extractCasesFromCaseBlock(caseBlockCst: SubhutiCst): any[] {
        const cases: any[] = []
        
        for (const child of caseBlockCst.children || []) {
            if (child.name === SlimeParser.prototype.CaseClauses?.name || child.name === 'CaseClauses') {
                for (const caseClause of child.children || []) {
                    if (caseClause.name === SlimeParser.prototype.CaseClause?.name || caseClause.name === 'CaseClause') {
                        cases.push(StatementCstToAst.createSwitchCaseAst(caseClause, false))
                    }
                }
            } else if (child.name === SlimeParser.prototype.DefaultClause?.name || child.name === 'DefaultClause') {
                cases.push(StatementCstToAst.createSwitchCaseAst(child, true))
            }
        }
        
        return cases
    }

    /**
     * CaseBlock CST 转 AST
     * CaseBlock -> { CaseClauses? DefaultClause? CaseClauses? }
     */
    static createCaseBlockAst(cst: SubhutiCst): any[] {
        return StatementCstToAst.extractCasesFromCaseBlock(cst)
    }

    /**
     * CaseClauses CST 转 AST
     * CaseClauses -> CaseClause+
     */
    static createCaseClausesAst(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.CaseClause?.name || child.name === 'CaseClause') {
                cases.push(StatementCstToAst.createSwitchCaseAst(child, false))
            }
        }
        return cases
    }

    /**
     * CaseClause CST 转 AST
     * CaseClause -> case Expression : StatementList?
     */
    static createCaseClauseAst(cst: SubhutiCst): any {
        return StatementCstToAst.createSwitchCaseAst(cst, false)
    }

    /**
     * DefaultClause CST 转 AST
     * DefaultClause -> default : StatementList?
     */
    static createDefaultClauseAst(cst: SubhutiCst): any {
        return StatementCstToAst.createSwitchCaseAst(cst, true)
    }

    /**
     * 创建 SwitchCase AST
     */
    static createSwitchCaseAst(cst: SubhutiCst, isDefault: boolean): any {
        let test: any = null
        const consequent: any[] = []
        let caseToken: any = undefined
        let colonToken: any = undefined

        for (const child of cst.children || []) {
            if (child.name === 'Case' || child.value === 'case') {
                caseToken = SlimeTokenCreate.createCaseToken(child.loc)
            } else if (child.name === 'Default' || child.value === 'default') {
                caseToken = SlimeTokenCreate.createDefaultToken(child.loc)
            } else if (child.name === 'Colon' || child.value === ':') {
                colonToken = SlimeTokenCreate.createColonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name || child.name === 'Expression') {
                test = getUtil().createExpressionAst(child)
            } else if (child.name === SlimeParser.prototype.StatementList?.name || child.name === 'StatementList') {
                consequent.push(...StatementCstToAst.createStatementListAst(child))
            }
        }

        return {
            type: SlimeNodeType.SwitchCase,
            test: isDefault ? null : test,
            consequent: consequent,
            loc: cst.loc,
            caseToken,
            colonToken
        }
    }

    /**
     * BreakableStatement CST 到 AST（透传）
     */
    static createBreakableStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return StatementCstToAst.createStatementDeclarationAst(firstChild)
        }
        throw new Error('BreakableStatement has no children')
    }

    /**
     * IterationStatement CST 到 AST（透传）
     */
    static createIterationStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return StatementCstToAst.createStatementDeclarationAst(firstChild)
        }
        throw new Error('IterationStatement has no children')
    }

    static createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => StatementCstToAst.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    static createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            if (item.name === SlimeParser.prototype.Declaration?.name) {
                return [getUtil().createDeclarationAst(item) as any]
            }

            const statement = StatementCstToAst.createStatementAst(item)
            const result = statement.flat()

            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression

                    if (expr.type === SlimeNodeType.FunctionExpression) {
                        const funcExpr = expr as SlimeFunctionExpression
                        if (funcExpr.id) {
                            return {
                                type: SlimeNodeType.FunctionDeclaration,
                                id: funcExpr.id,
                                params: funcExpr.params,
                                body: funcExpr.body,
                                generator: funcExpr.generator,
                                async: funcExpr.async,
                                loc: funcExpr.loc
                            } as SlimeFunctionDeclaration
                        }
                    }

                    if (expr.type === SlimeNodeType.ClassExpression) {
                        const classExpr = expr as any
                        if (classExpr.id) {
                            return {
                                type: SlimeNodeType.ClassDeclaration,
                                id: classExpr.id,
                                superClass: classExpr.superClass,
                                body: classExpr.body,
                                loc: classExpr.loc
                            } as any
                        }
                    }
                }
                return stmt
            })
        }).flat()
        return statements
    }

    /**
     * 语句/声明分发方法
     */
    static createStatementDeclarationAst(cst: SubhutiCst): any {
        const name = cst.name

        // 语句类型
        if (name === SlimeParser.prototype.Statement?.name) return StatementCstToAst.createStatementAst(cst)[0]
        if (name === SlimeParser.prototype.BlockStatement?.name) return StatementCstToAst.createBlockStatementAst(cst)
        if (name === SlimeParser.prototype.VariableStatement?.name) return StatementCstToAst.createVariableStatementAst(cst)
        if (name === SlimeParser.prototype.EmptyStatement?.name) return StatementCstToAst.createEmptyStatementAst(cst)
        if (name === SlimeParser.prototype.ExpressionStatement?.name) return StatementCstToAst.createExpressionStatementAst(cst)
        if (name === SlimeParser.prototype.IfStatement?.name) return StatementCstToAst.createIfStatementAst(cst)
        if (name === SlimeParser.prototype.BreakableStatement?.name) return StatementCstToAst.createBreakableStatementAst(cst)
        if (name === SlimeParser.prototype.IterationStatement?.name) return StatementCstToAst.createIterationStatementAst(cst)
        if (name === SlimeParser.prototype.ContinueStatement?.name) return StatementCstToAst.createContinueStatementAst(cst)
        if (name === SlimeParser.prototype.BreakStatement?.name) return StatementCstToAst.createBreakStatementAst(cst)
        if (name === SlimeParser.prototype.ReturnStatement?.name) return StatementCstToAst.createReturnStatementAst(cst)
        if (name === SlimeParser.prototype.WithStatement?.name) return StatementCstToAst.createWithStatementAst(cst)
        if (name === SlimeParser.prototype.LabelledStatement?.name) return StatementCstToAst.createLabelledStatementAst(cst)
        if (name === SlimeParser.prototype.ThrowStatement?.name) return StatementCstToAst.createThrowStatementAst(cst)
        if (name === SlimeParser.prototype.TryStatement?.name) return StatementCstToAst.createTryStatementAst(cst)
        if (name === SlimeParser.prototype.DebuggerStatement?.name) return StatementCstToAst.createDebuggerStatementAst(cst)
        if (name === SlimeParser.prototype.SwitchStatement?.name) return StatementCstToAst.createSwitchStatementAst(cst)
        if (name === SlimeParser.prototype.ForStatement?.name) return StatementCstToAst.createForStatementAst(cst)
        if (name === SlimeParser.prototype.ForInOfStatement?.name) return StatementCstToAst.createForInOfStatementAst(cst)
        if (name === SlimeParser.prototype.WhileStatement?.name) return StatementCstToAst.createWhileStatementAst(cst)
        if (name === SlimeParser.prototype.DoWhileStatement?.name) return StatementCstToAst.createDoWhileStatementAst(cst)

        // 声明类型 - 委托给 SlimeCstToAstUtil
        return getUtil().createAstFromCst(cst)
    }

    /**
     * 处理自动分号插入
     * SemicolonASI 不产生实际的 AST 节点
     */
    static createSemicolonASIAst(cst: SubhutiCst): any {
        // ASI 不产生实际的 AST 节点，返回 null
        return null
    }

    /**
     * LetOrConst CST 转 AST
     * LetOrConst -> let | const
     */
    static createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }
}
