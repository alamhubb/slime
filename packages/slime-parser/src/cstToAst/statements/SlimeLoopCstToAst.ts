/**
 * SlimeLoopCstToAst - 循环语句
 *
 * 负责：
 * - for 语句
 * - for-in 语句
 * - for-of 语句
 * - for-await-of 语句
 * - while 语句
 * - do-while 语句
 */
import {SubhutiCst} from "subhuti";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";
import {SlimeAstCreateUtils, SlimeAstTypeName, SlimeTokenCreateUtils} from "slime-ast";

export class SlimeLoopCstToAstSingle {

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
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ForStatement?.name);

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
                forToken = SlimeTokenCreateUtils.createForToken(child.loc)
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
            // var token - skip (kind handled separately)
            if (name === 'Var' || child.value === 'var') continue
            // Semicolon token
            if (name === 'Semicolon' || child.value === ';' || child.loc?.type === 'Semicolon') {
                semicolonTokens.push(SlimeTokenCreateUtils.createSemicolonToken(child.loc))
                continue
            }

            // VariableDeclarationList (for var) - init
            if (name === SlimeParser.prototype.VariableDeclarationList?.name || name === 'VariableDeclarationList') {
                init = SlimeCstToAstUtil.createVariableDeclarationFromList(child, 'var')
                continue
            }

            // LexicalDeclaration (for let/const) - init
            // 注意：LexicalDeclaration 内部包含了分�?
            if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
                init = SlimeCstToAstUtil.createLexicalDeclarationAst(child)
                hasLexicalDeclaration = true
                continue
            }

            // VariableDeclaration (legacy) - init
            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                init = SlimeCstToAstUtil.createVariableDeclarationAst(child)
                continue
            }

            // Expression - 收集所有表达式
            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                expressions.push(SlimeCstToAstUtil.createExpressionAst(child))
                continue
            }

            // Statement (body)
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = SlimeCstToAstUtil.createStatementAst(child)
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

        return SlimeAstCreateUtils.createForStatement(
            body, init, test, update, cst.loc,
            forToken, lParenToken, rParenToken,
            semicolonTokens[0], semicolonTokens[1]
        )
    }

    /**
     * 创建 for...in / for...of 语句 AST
     */
    createForInOfStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ForInOfStatement?.name);

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
                id = SlimeCstToAstUtil.createBindingPatternAst(actualBinding);
            } else if (actualBinding.name === SlimeParser.prototype.BindingIdentifier?.name || actualBinding.name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(actualBinding);
            } else {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(actualBinding);
            }

            const kind = letOrConstCst.children[0].value  // 'let' or 'const'

            left = {
                type: SlimeAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeAstTypeName.VariableDeclarator,
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
            const id = SlimeCstToAstUtil.createBindingIdentifierAst(bindingIdCst)
            const init = SlimeCstToAstUtil.createInitializerAst(initializerCst)
            left = {
                type: SlimeAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeAstTypeName.VariableDeclarator,
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
            left = SlimeCstToAstUtil.createLeftHandSideExpressionAst(leftHandSideCst)
        } else if (varBindingCst) {
            // var ForBinding
            const actualBinding = varBindingCst.children[0]
            let id;
            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(actualBinding);
            } else {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(actualBinding);
            }
            left = {
                type: SlimeAstTypeName.VariableDeclaration,
                declarations: [{
                    type: SlimeAstTypeName.VariableDeclarator,
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
                right = SlimeCstToAstUtil.createExpressionAst(rightCst)
            }
        }

        // 查找 Statement (body)
        const statementCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Statement?.name ||
            ch.name === 'Statement'
        )
        if (statementCst) {
            const bodyStatements = SlimeCstToAstUtil.createStatementAst(statementCst)
            body = Array.isArray(bodyStatements) && bodyStatements.length > 0
                ? bodyStatements[0]
                : bodyStatements
        }

        const result: any = {
            type: isForOf ? SlimeAstTypeName.ForOfStatement : SlimeAstTypeName.ForInStatement,
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
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.WhileStatement?.name);
        // WhileStatement: WhileTok LParen Expression RParen Statement

        let whileToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined

        for (const child of cst.children) {
            if (!child) continue
            if (child.name === 'While' || child.value === 'while') {
                whileToken = SlimeTokenCreateUtils.createWhileToken(child.loc)
            } else if (child.name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (child.name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            }
        }

        const expression = cst.children.find(ch => ch.name === SlimeParser.prototype.Expression?.name)
        const statement = cst.children.find(ch => ch.name === SlimeParser.prototype.Statement?.name)

        const test = expression ? SlimeCstToAstUtil.createExpressionAst(expression) : null
        // createStatementAst返回数组，取第一个元�?
        const bodyArray = statement ? SlimeCstToAstUtil.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeAstCreateUtils.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 do...while 语句 AST
     */
    createDoWhileStatementAst(cst: SubhutiCst): any {
        SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.DoWhileStatement?.name);
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
                doToken = SlimeTokenCreateUtils.createDoToken(child.loc)
            } else if (name === 'While' || child.value === 'while') {
                whileToken = SlimeTokenCreateUtils.createWhileToken(child.loc)
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreateUtils.createSemicolonToken(child.loc)
            } else if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const bodyArray = SlimeCstToAstUtil.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = SlimeCstToAstUtil.createExpressionAst(child)
            }
        }

        return SlimeAstCreateUtils.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }


    /**
     * ForDeclaration CST �?AST
     * ForDeclaration -> LetOrConst ForBinding
     */
    createForDeclarationAst(cst: SubhutiCst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? SlimeCstToAstUtil.createForBindingAst(forBinding) : null

        return {
            type: SlimeAstTypeName.VariableDeclaration,
            declarations: [{
                type: SlimeAstTypeName.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: {type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc},
            loc: cst.loc
        }
    }

    /**
     * ForBinding CST �?AST
     * ForBinding -> BindingIdentifier | BindingPattern
     */
    createForBindingAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return SlimeCstToAstUtil.createBindingPatternAst(firstChild)
        }
        return SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
    }
}

export const SlimeLoopCstToAst = new SlimeLoopCstToAstSingle()
