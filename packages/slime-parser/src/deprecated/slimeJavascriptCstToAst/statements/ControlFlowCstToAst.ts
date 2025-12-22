/**
 * ControlFlowCstToAst - if/for/while/do-while 转换
 */
import { SubhutiCst } from "subhuti";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import {
    SlimeJavascriptAstUtil,
    SlimeJavascriptAstTypeName,
    SlimeJavascriptTokenCreate,
    type SlimeJavascriptVariableDeclaration,
    type SlimeJavascriptVariableDeclarator
} from "slime-ast";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

export class ControlFlowCstToAst {


    // ==================== 语句相关转换方法 ====================

    /**
     * BreakableStatement CST �?AST（透传�?
     * BreakableStatement -> IterationStatement | SwitchStatement
     */
    static createBreakableStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('BreakableStatement has no children')
    }

    /**
     * IterationStatement CST �?AST（透传�?
     * IterationStatement -> DoWhileStatement | WhileStatement | ForStatement | ForInOfStatement
     */
    static createIterationStatementAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(firstChild)
        }
        throw new Error('IterationStatement has no children')
    }


    /**
     * 创建 if 语句 AST
     * if (test) consequent [else alternate]
     * ES2025: if ( Expression ) IfStatementBody [else IfStatementBody]
     */
    static createIfStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.IfStatement?.name);

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
                ifToken = SlimeJavascriptTokenCreate.createIfToken(child.loc)
                continue
            }
            // LParen token
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
                continue
            }
            // RParen token
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
                continue
            }

            // else token
            if (name === 'Else' || child.value === 'else') {
                elseToken = SlimeJavascriptTokenCreate.createElseToken(child.loc)
                foundElse = true
                continue
            }

            // Expression (test condition)
            if (name === SlimeJavascriptParser.prototype.Expression?.name || name === 'Expression') {
                test = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
                continue
            }

            // IfStatementBody
            if (name === SlimeJavascriptParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = SlimeJavascriptCstToAstUtil.createIfStatementBodyAst(child)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }

            // Legacy: 直接�?Statement
            if (name === SlimeJavascriptParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeJavascriptCstToAstUtil.createStatementAst(child)
                const body = Array.isArray(stmts) ? stmts[0] : stmts
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }
        }

        return SlimeJavascriptAstUtil.createIfStatement(test, consequent, alternate, cst.loc, ifToken, elseToken, lParenToken, rParenToken)
    }

    /**
     * 创建 IfStatementBody AST
     * IfStatementBody: Statement | FunctionDeclaration
     */
    static createIfStatementBodyAst(cst: SubhutiCst): any {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeJavascriptParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeJavascriptCstToAstUtil.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return SlimeJavascriptCstToAstUtil.createFunctionDeclarationAst(child)
            }
        }

        // 如果没有找到子节点，尝试直接处理
        return SlimeJavascriptCstToAstUtil.createStatementDeclarationAst(cst)
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
    static createForStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ForStatement?.name);

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
                forToken = SlimeJavascriptTokenCreate.createForToken(child.loc)
                continue
            }
            // LParen token
            if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
                continue
            }
            // RParen token
            if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
                continue
            }
            // var token - skip (kind handled separately)
            if (name === 'Var' || child.value === 'var') continue
            // Semicolon token
            if (name === 'Semicolon' || child.value === ';' || child.loc?.type === 'Semicolon') {
                semicolonTokens.push(SlimeJavascriptTokenCreate.createSemicolonToken(child.loc))
                continue
            }

            // VariableDeclarationList (for var) - init
            if (name === SlimeJavascriptParser.prototype.VariableDeclarationList?.name || name === 'VariableDeclarationList') {
                init = SlimeJavascriptCstToAstUtil.createVariableDeclarationFromList(child, 'var')
                continue
            }

            // LexicalDeclaration (for let/const) - init
            // 注意：LexicalDeclaration 内部包含了分�?
            if (name === SlimeJavascriptParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
                init = SlimeJavascriptCstToAstUtil.createLexicalDeclarationAst(child)
                hasLexicalDeclaration = true
                continue
            }

            // VariableDeclaration (legacy) - init
            if (name === SlimeJavascriptParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                init = SlimeJavascriptCstToAstUtil.createVariableDeclarationAst(child)
                continue
            }

            // Expression - 收集所有表达式
            if (name === SlimeJavascriptParser.prototype.Expression?.name || name === 'Expression') {
                expressions.push(SlimeJavascriptCstToAstUtil.createExpressionAst(child))
                continue
            }

            // Statement (body)
            if (name === SlimeJavascriptParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeJavascriptCstToAstUtil.createStatementAst(child)
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

        return SlimeJavascriptAstUtil.createForStatement(
            body, init, test, update, cst.loc,
            forToken, lParenToken, rParenToken,
            semicolonTokens[0], semicolonTokens[1]
        )
    }

    /**
     * 创建 for...in / for...of 语句 AST
     */
    static createForInOfStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ForInOfStatement?.name);

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
            ch.name === SlimeJavascriptParser.prototype.ForDeclaration?.name ||
            ch.name === 'ForDeclaration'
        )
        const leftHandSideCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.LeftHandSideExpression?.name ||
            ch.name === 'LeftHandSideExpression'
        )
        const varBindingCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.ForBinding?.name ||
            ch.name === 'ForBinding'
        )

        // 检查是否是 ES5 遗留语法: for (var x = init in expr)
        // CST 结构: [For, LParen, Var, BindingIdentifier, Initializer, In, Expression, RParen, Statement]
        const varTokenCst = cst.children.find(ch => ch.name === 'Var' || ch.value === 'var')
        const bindingIdCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier'
        )
        const initializerCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.Initializer?.name || ch.name === 'Initializer'
        )

        if (forDeclarationCst) {
            // ForDeclaration 内部�?LetOrConst + ForBinding
            const letOrConstCst = forDeclarationCst.children[0]
            const forBindingCst = forDeclarationCst.children[1]

            // ForBinding可能是BindingIdentifier或BindingPattern
            const actualBinding = forBindingCst.children[0]
            let id;

            if (actualBinding.name === SlimeJavascriptParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = SlimeJavascriptCstToAstUtil.createBindingPatternAst(actualBinding);
            } else if (actualBinding.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || actualBinding.name === 'BindingIdentifier') {
                id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(actualBinding);
            } else {
                id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(actualBinding);
            }

            const kind = letOrConstCst.children[0].value  // 'let' or 'const'

            left = {
                type: SlimeJavascriptAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeJavascriptAstTypeName.VariableDeclarator,
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
            const id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(bindingIdCst)
            const init = SlimeJavascriptCstToAstUtil.createInitializerAst(initializerCst)
            left = {
                type: SlimeJavascriptAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeJavascriptAstTypeName.VariableDeclarator,
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
            left = SlimeJavascriptCstToAstUtil.createLeftHandSideExpressionAst(leftHandSideCst)
        } else if (varBindingCst) {
            // var ForBinding
            const actualBinding = varBindingCst.children[0]
            let id;
            if (actualBinding.name === SlimeJavascriptParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = SlimeJavascriptCstToAstUtil.createBindingPatternAst(actualBinding);
            } else {
                id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(actualBinding);
            }
            left = {
                type: SlimeJavascriptAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeJavascriptAstTypeName.VariableDeclarator,
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
                right = SlimeJavascriptCstToAstUtil.createExpressionAst(rightCst)
            }
        }

        // 查找 Statement (body)
        const statementCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.Statement?.name ||
            ch.name === 'Statement'
        )
        if (statementCst) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createStatementAst(statementCst)
            body = Array.isArray(bodyStatements) && bodyStatements.length > 0
                ? bodyStatements[0]
                : bodyStatements
        }

        const result: any = {
            type: isForOf ? SlimeJavascriptAstTypeName.ForOfStatement : SlimeJavascriptAstTypeName.ForInStatement,
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
    static createWhileStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.WhileStatement?.name);
        // WhileStatement: WhileTok LParen Expression RParen Statement

        let whileToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'While' || child.value === 'while') {
                whileToken = SlimeJavascriptTokenCreate.createWhileToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
            }
        }

        const expression = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Expression?.name)
        const statement = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.Statement?.name)

        const test = expression ? SlimeJavascriptCstToAstUtil.createExpressionAst(expression) : null
        // createStatementAst返回数组，取第一个元�?
        const bodyArray = statement ? SlimeJavascriptCstToAstUtil.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeJavascriptAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 do...while 语句 AST
     */
    static createDoWhileStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.DoWhileStatement?.name);
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
                doToken = SlimeJavascriptTokenCreate.createDoToken(child.loc)
            } else if (name === 'While' || child.value === 'while') {
                whileToken = SlimeJavascriptTokenCreate.createWhileToken(child.loc)
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
            } else if (name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(child.loc)
            } else if (name === SlimeJavascriptParser.prototype.Statement?.name || name === 'Statement') {
                const bodyArray = SlimeJavascriptCstToAstUtil.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeJavascriptParser.prototype.Expression?.name || name === 'Expression') {
                test = SlimeJavascriptCstToAstUtil.createExpressionAst(child)
            }
        }

        return SlimeJavascriptAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }


    /**
     * 创建 switch 语句 AST
     * SwitchStatement: switch ( Expression ) CaseBlock
     */
    static createSwitchStatementAst(cst: SubhutiCst): any {
        SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.SwitchStatement?.name);

        let switchToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'Switch' || child.value === 'switch') {
                switchToken = SlimeJavascriptTokenCreate.createSwitchToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeJavascriptTokenCreate.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeJavascriptTokenCreate.createRParenToken(child.loc)
            }
        }

        // 提取 discriminant（判断表达式�?
        const discriminantCst = cst.children?.find(ch => ch.name === SlimeJavascriptParser.prototype.Expression?.name)
        const discriminant = discriminantCst ? SlimeJavascriptCstToAstUtil.createExpressionAst(discriminantCst) : null

        // 提取 cases（从 CaseBlock 中）
        const caseBlockCst = cst.children?.find(ch => ch.name === SlimeJavascriptParser.prototype.CaseBlock?.name)
        const cases = caseBlockCst ? SlimeJavascriptCstToAstUtil.extractCasesFromCaseBlock(caseBlockCst) : []

        // �?CaseBlock 提取 brace tokens
        if (caseBlockCst && caseBlockCst.children) {
            const lBraceCst = caseBlockCst.children.find(ch => ch.name === 'LBrace' || ch.value === '{')
            const rBraceCst = caseBlockCst.children.find(ch => ch.name === 'RBrace' || ch.value === '}')
            if (lBraceCst) lBraceToken = SlimeJavascriptTokenCreate.createLBraceToken(lBraceCst.loc)
            if (rBraceCst) rBraceToken = SlimeJavascriptTokenCreate.createRBraceToken(rBraceCst.loc)
        }

        return SlimeJavascriptAstUtil.createSwitchStatement(
            discriminant, cases, cst.loc,
            switchToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }


    /**
     * CaseClause CST �?AST
     * CaseClause -> case Expression : StatementList?
     */
    static createCaseClauseAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * DefaultClause CST �?AST
     * DefaultClause -> default : StatementList?
     */
    static createDefaultClauseAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createSwitchCaseAst(cst)
    }

    /**
     * CaseClauses CST �?AST
     * CaseClauses -> CaseClause+
     */
    static createCaseClausesAst(cst: SubhutiCst): any[] {
        const cases: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.CaseClause?.name || child.name === 'CaseClause') {
                cases.push(SlimeJavascriptCstToAstUtil.createSwitchCaseAst(child))
            }
        }
        return cases
    }

    /**
     * CaseBlock CST �?AST
     * CaseBlock -> { CaseClauses? DefaultClause? CaseClauses? }
     */
    static createCaseBlockAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptCstToAstUtil.extractCasesFromCaseBlock(cst)
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

        if (cst.name === SlimeJavascriptParser.prototype.CaseClause?.name) {
            // CaseClause 结构�?
            // children[0]: CaseTok
            // children[1]: Expression - test
            // children[2]: Colon
            // children[3]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Case' || child.value === 'case') {
                    caseToken = SlimeJavascriptTokenCreate.createCaseToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeJavascriptTokenCreate.createColonToken(child.loc)
                }
            }

            const testCst = cst.children?.find(ch => ch.name === SlimeJavascriptParser.prototype.Expression?.name)
            test = testCst ? SlimeJavascriptCstToAstUtil.createExpressionAst(testCst) : null

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeJavascriptParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeJavascriptCstToAstUtil.createStatementListAst(stmtListCst) : []
        } else if (cst.name === SlimeJavascriptParser.prototype.DefaultClause?.name) {
            // DefaultClause 结构�?
            // children[0]: DefaultTok
            // children[1]: Colon
            // children[2]: StatementList（可选）

            for (const child of cst.children || []) {
                if (child.name === 'Default' || child.value === 'default') {
                    defaultToken = SlimeJavascriptTokenCreate.createDefaultToken(child.loc)
                } else if (child.name === 'Colon' || child.value === ':') {
                    colonToken = SlimeJavascriptTokenCreate.createColonToken(child.loc)
                }
            }

            test = null  // default 没有 test

            const stmtListCst = cst.children?.find(ch => ch.name === SlimeJavascriptParser.prototype.StatementList?.name)
            consequent = stmtListCst ? SlimeJavascriptCstToAstUtil.createStatementListAst(stmtListCst) : []
        }

        return SlimeJavascriptAstUtil.createSwitchCase(consequent, test, cst.loc, caseToken, defaultToken, colonToken)
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
            if (child.name === SlimeJavascriptParser.prototype.CaseClauses?.name) {
                // CaseClauses 包含多个 CaseClause
                if (child.children) {
                    child.children.forEach(caseClauseCst => {
                        cases.push(SlimeJavascriptCstToAstUtil.createSwitchCaseAst(caseClauseCst))
                    })
                }
            } else if (child.name === SlimeJavascriptParser.prototype.DefaultClause?.name) {
                // DefaultClause
                cases.push(SlimeJavascriptCstToAstUtil.createSwitchCaseAst(child))
            }
        })

        return cases
    }
}
