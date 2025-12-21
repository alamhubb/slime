import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeBlockStatement,
    type SlimeFunctionDeclaration, type SlimeFunctionParam,
    type SlimeIdentifier, SlimeNodeType, type SlimePattern,
    SlimeTokenCreate, type SlimeVariableDeclaration, type SlimeVariableDeclarator
} from "slime-ast";
import SlimeParser from "../SlimeParser.ts";
import {checkCstName} from "../SlimeCstToAstUtil.ts";

/**
 * 语句相关的 CST to AST 转换
 */
export class StatementCstToAst {
    createStatementAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => this.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)  // 过滤�?undefined
        return statements
    }

    /**
     * 创建 var 变量声明语句 AST
     * ES2025 VariableStatement: var VariableDeclarationList ;
     */
    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        // 查找 VariableDeclarationList
        for (const child of children) {
            if (!child) continue

            if (child.name === SlimeParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                // VariableDeclarationList 包含多个 VariableDeclaration
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeParser.prototype.VariableDeclaration?.name ||
                        varDeclCst.name === 'VariableDeclaration') {
                        declarations.push(this.createVariableDeclaratorFromVarDeclaration(varDeclCst))
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
    createTryStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.TryStatement?.name);
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
     * 创建 throw 语句 AST
     */
    createThrowStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ThrowStatement?.name);
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
        checkCstName(cst, SlimeParser.prototype.BreakStatement?.name);
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
        checkCstName(cst, SlimeParser.prototype.ContinueStatement?.name);
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
     * 创建标签语句 AST
     * ES2025: LabelledStatement -> LabelIdentifier : LabelledItem
     * LabelledItem -> Statement | FunctionDeclaration
     */
    createLabelledStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.LabelledStatement?.name);

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
     * 创建空语�?AST
     */
    createEmptyStatementAst(cst: SubhutiCst): any {
        // 兼容 EmptyStatement 和旧�?NotEmptySemicolon
        // checkCstName(cst, Es2025Parser.prototype.EmptyStatement?.name);

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
     * 创建 BlockStatement AST
     * 处理两种情况�?
     * 1. 直接�?StatementList（旧的实现）
     * 2. �?BlockStatement，需要提取内部的 Block -> StatementList
     */
    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeStatement>

        // 如果�?StatementList，直接转�?
        if (cst.name === SlimeParser.prototype.StatementList?.name) {
            statements = this.createStatementListAst(cst)
        }
        // 如果�?BlockStatement，需要提�?Block -> StatementList
        else if (cst.name === SlimeParser.prototype.BlockStatement?.name) {
            // BlockStatement -> Block -> StatementList
            const blockCst = cst.children?.[0]
            if (blockCst && blockCst.name === SlimeParser.prototype.Block?.name) {
                // Block 的结构：LBrace StatementList RBrace
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeParser.prototype.StatementList?.name
                )
                if (statementListCst) {
                    statements = this.createStatementListAst(statementListCst)
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

    createReturnStatementAst(cst: SubhutiCst): SlimeReturnStatement {
        const astName = checkCstName(cst, SlimeParser.prototype.ReturnStatement?.name);

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
        const astName = checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);

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
     * 创建 if 语句 AST
     * if (test) consequent [else alternate]
     * ES2025: if ( Expression ) IfStatementBody [else IfStatementBody]
     */
    createIfStatementAst(cst: SubhutiCst): any {
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

            // if token
            if (name === 'If' || child.value === 'if') {
                ifToken = SlimeTokenCreate.createIfToken(child.loc)
                continue
            }
            // LParen token
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            // RParen token
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }

            // else token
            if (name === 'Else' || child.value === 'else') {
                elseToken = SlimeTokenCreate.createElseToken(child.loc)
                foundElse = true
                continue
            }

            // Expression (test condition)
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = this.createExpressionAst(child)
                continue
            }

            // IfStatementBody
            if (name === SlimeParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = this.createIfStatementBodyAst(child)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }

            // Legacy: 直接�?Statement
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = this.createStatementAst(child)
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
     * IfStatementBody: Statement | FunctionDeclaration
     */
    createIfStatementBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = this.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return this.createFunctionDeclarationAst(child)
            }
        }

        // 如果没有找到子节点，尝试直接处理
        return this.createStatementDeclarationAst(cst)
    }

    /**
     * 创建 for 语句 AST
     * ES2025 ForStatement:
     *   for ( var VariableDeclarationList ; Expression_opt ; Expression_opt ) Statement
     *   for ( LexicalDeclaration Expression_opt ; Expression_opt ) Statement
     *   for ( Expression_opt ; Expression_opt ; Expression_opt ) Statement
     *
     * 注意：LexicalDeclaration 内部已经包含分号（SemicolonASI�?
     */
    createForStatementAst(cst: SubhutiCst): any {
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

        // 收集所有表达式（可能是 test �?update�?
        const expressions: any[] = []
        let hasLexicalDeclaration = false

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // for token
            if (name === 'For' || child.value === 'for') {
                forToken = SlimeTokenCreate.createForToken(child.loc)
                continue
            }
            // LParen token
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            // RParen token
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            // var token - skip (kind handled separately)
            if (name === 'Var' || child.value === 'var') continue
            // Semicolon token
            if (name === 'Semicolon' || child.value === ';' || child.loc?.type === 'Semicolon') {
                semicolonTokens.push(SlimeTokenCreate.createSemicolonToken(child.loc))
                continue
            }

            // VariableDeclarationList (for var) - init
            if (name === SlimeParser.prototype.VariableDeclarationList?.name || name === 'VariableDeclarationList') {
                init = this.createVariableDeclarationFromList(child, 'var')
                continue
            }

            // LexicalDeclaration (for let/const) - init
            // 注意：LexicalDeclaration 内部包含了分�?
            if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
                init = this.createLexicalDeclarationAst(child)
                hasLexicalDeclaration = true
                continue
            }

            // VariableDeclaration (legacy) - init
            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                init = this.createVariableDeclarationAst(child)
                continue
            }

            // Expression - 收集所有表达式
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                expressions.push(this.createExpressionAst(child))
                continue
            }

            // Statement (body)
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = this.createStatementAst(child)
                body = Array.isArray(stmts) ? stmts[0] : stmts
                continue
            }
        }

        // 根据收集的表达式和是否有 LexicalDeclaration 来分�?
        if (hasLexicalDeclaration) {
            // for (let i = 0; test; update) - LexicalDeclaration 已经�?init
            // 后面两个表达式分别是 test �?update
            if (expressions.length >= 1) test = expressions[0]
            if (expressions.length >= 2) update = expressions[1]
        } else if (init) {
            // for (var i = 0; test; update) - init 已设�?
            // 后面两个表达式分别是 test �?update
            if (expressions.length >= 1) test = expressions[0]
            if (expressions.length >= 2) update = expressions[1]
        } else {
            // for (init; test; update) - 三个表达�?
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
    createForInOfStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.ForInOfStatement?.name);

        // ForInOfStatement 结构（多种形式）�?
        // 普�?for-in/of: [ForTok, LParen, ForDeclaration, InTok/OfTok, Expression, RParen, Statement]
        // for await: [ForTok, AwaitTok, LParen, ForDeclaration, OfTok, AssignmentExpression, RParen, Statement]

        // 检查是否是 for await
        const hasAwait = cst.children.some(ch => ch.name === 'Await')

        // 动态查找各个部�?
        let left: any = null
        let right: any = null
        let body: any = null
        let isForOf = false

        // 查找 ForDeclaration �?LeftHandSideExpression
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

        // 检查是否是 ES5 遗留语法: for (var x = init in expr)
        // CST 结构: [For, LParen, Var, BindingIdentifier, Initializer, In, Expression, RParen, Statement]
        const varTokenCst = cst.children.find(ch => ch.name === 'Var' || ch.value === 'var')
        const bindingIdCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier'
        )
        const initializerCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer'
        )

        if (forDeclarationCst) {
            // ForDeclaration 内部�?LetOrConst + ForBinding
            const letOrConstCst = forDeclarationCst.children[0]
            const forBindingCst = forDeclarationCst.children[1]

            // ForBinding可能是BindingIdentifier或BindingPattern
            const actualBinding = forBindingCst.children[0]
            let id;

            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = this.createBindingPatternAst(actualBinding);
            } else if (actualBinding.name === SlimeParser.prototype.BindingIdentifier?.name || actualBinding.name === 'BindingIdentifier') {
                id = this.createBindingIdentifierAst(actualBinding);
            } else {
                id = this.createBindingIdentifierAst(actualBinding);
            }

            const kind = letOrConstCst.children[0].value  // 'let' or 'const'

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
            // ES5 遗留语法: for (var x = init in expr) - 非严格模式下允许
            const id = this.createBindingIdentifierAst(bindingIdCst)
            const init = this.createInitializerAst(initializerCst)
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
            left = this.createLeftHandSideExpressionAst(leftHandSideCst)
        } else if (varBindingCst) {
            // var ForBinding
            const actualBinding = varBindingCst.children[0]
            let id;
            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = this.createBindingPatternAst(actualBinding);
            } else {
                id = this.createBindingIdentifierAst(actualBinding);
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

        // 查找 in/of token
        const inOrOfCst = cst.children.find(ch =>
            ch.name === 'In' || ch.name === 'Of' ||
            ch.value === 'in' || ch.value === 'of'
        )
        isForOf = inOrOfCst?.value === 'of' || inOrOfCst?.name === 'OfTok'

        // 查找 right expression (�?in/of 之后)
        const inOrOfIndex = cst.children.indexOf(inOrOfCst)
        if (inOrOfIndex !== -1 && inOrOfIndex + 1 < cst.children.length) {
            const rightCst = cst.children[inOrOfIndex + 1]
            if (rightCst.name !== 'RParen') {
                right = this.createExpressionAst(rightCst)
            }
        }

        // 查找 Statement (body)
        const statementCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Statement?.name ||
            ch.name === 'Statement'
        )
        if (statementCst) {
            const bodyStatements = this.createStatementAst(statementCst)
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

        // for await 需要设�?await 属�?
        if (hasAwait) {
            result.await = true
        }

        return result
    }

    /**
     * 创建 while 语句 AST
     */
    createWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.WhileStatement?.name);
        // WhileStatement: WhileTok LParen Expression RParen Statement

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

        const test = expression ? this.createExpressionAst(expression) : null
        // createStatementAst返回数组，取第一个元�?
        const bodyArray = statement ? this.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 do...while 语句 AST
     */
    createDoWhileStatementAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.DoWhileStatement?.name);
        // DoWhileStatement: do Statement while ( Expression ) ;

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
                const bodyArray = this.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = this.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }

    /**
     * 创建 switch 语句 AST
     * SwitchStatement: switch ( Expression ) CaseBlock
     */
    createSwitchStatementAst(cst: SubhutiCst): any {
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

        // 提取 discriminant（判断表达式�?
        const discriminantCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? this.createExpressionAst(discriminantCst) : null

        // 提取 cases（从 CaseBlock 中）
        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? this.extractCasesFromCaseBlock(caseBlockCst) : []

        // �?CaseBlock 提取 brace tokens
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

    // ==================== 语句相关转换方法 ====================

    /**
     * BreakableStatement CST �?AST（透传�?
     * BreakableStatement -> IterationStatement | SwitchStatement
     */
    createBreakableStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createStatementDeclarationAst(firstChild)
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
            return this.createStatementDeclarationAst(firstChild)
        }
        throw new Error('IterationStatement has no children')
    }

    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => this.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }

    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement> {
        const astName = checkCstName(cst, SlimeParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            // 如果�?Declaration，直接处�?
            if (item.name === SlimeParser.prototype.Declaration?.name) {
                return [this.createDeclarationAst(item) as any]
            }

            // 如果�?Statement，需要特殊处�?FunctionExpression �?ClassExpression
            const statement = this.createStatementAst(item)
            const result = statement.flat()

            // 检查是否是命名�?FunctionExpression �?ClassExpression（应该转�?Declaration�?
            return result.map(stmt => {
                if (stmt.type === SlimeNodeType.ExpressionStatement) {
                    const expr = (stmt as SlimeExpressionStatement).expression

                    // 命名�?FunctionExpression �?FunctionDeclaration
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

                    // ClassExpression �?ClassDeclaration
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
}
