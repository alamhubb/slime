import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 控制流语句 CST 到 AST 转换器
 * 
 * 负责处理：
 * - IfStatement: if 语句
 * - IfStatementBody: if 语句体
 * - ForStatement: for 语句
 * - ForInOfStatement: for...in / for...of 语句
 * - ForDeclaration: for 声明
 * - ForBinding: for 绑定
 * - WhileStatement: while 语句
 * - DoWhileStatement: do...while 语句
 * - IterationStatement: 迭代语句
 * - BreakableStatement: 可中断语句
 */
export class ControlFlowCstToAst {

    /**
     * 创建 IfStatement AST
     */
    static createIfStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                test = util.createExpressionAst(child)
                continue
            }
            if (name === SlimeParser.prototype.IfStatementBody?.name || name === 'IfStatementBody') {
                const body = this.createIfStatementBodyAst(child, util)
                if (!foundElse) {
                    consequent = body
                } else {
                    alternate = body
                }
                continue
            }
            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = util.createStatementAst(child)
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
    static createIfStatementBodyAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const children = cst.children || []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = util.createStatementAst(child)
                return Array.isArray(stmts) ? stmts[0] : stmts
            }

            if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
                return util.createFunctionDeclarationAst(child)
            }
        }

        return util.createStatementDeclarationAst(cst)
    }


    /**
     * 创建 ForStatement AST
     */
    static createForStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                init = util.createVariableDeclarationFromList(child, 'var')
                continue
            }

            if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
                init = util.createLexicalDeclarationAst(child)
                hasLexicalDeclaration = true
                continue
            }

            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                init = util.createVariableDeclarationAst(child)
                continue
            }

            if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                expressions.push(util.createExpressionAst(child))
                continue
            }

            if (name === SlimeParser.prototype.Statement?.name || name === 'Statement') {
                const stmts = util.createStatementAst(child)
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
    static createForInOfStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                id = util.createBindingPatternAst(actualBinding);
            } else if (actualBinding.name === SlimeParser.prototype.BindingIdentifier?.name || actualBinding.name === 'BindingIdentifier') {
                id = util.createBindingIdentifierAst(actualBinding);
            } else {
                id = util.createBindingIdentifierAst(actualBinding);
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
            const id = util.createBindingIdentifierAst(bindingIdCst)
            const init = util.createInitializerAst(initializerCst)
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
            left = util.createLeftHandSideExpressionAst(leftHandSideCst)
        } else if (varBindingCst) {
            const actualBinding = varBindingCst.children[0]
            let id;
            if (actualBinding.name === SlimeParser.prototype.BindingPattern?.name || actualBinding.name === 'BindingPattern') {
                id = util.createBindingPatternAst(actualBinding);
            } else {
                id = util.createBindingIdentifierAst(actualBinding);
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
                right = util.createExpressionAst(rightCst)
            }
        }

        const statementCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.Statement?.name ||
            ch.name === 'Statement'
        )
        if (statementCst) {
            const bodyStatements = util.createStatementAst(statementCst)
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
    static createWhileStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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

        const test = expression ? util.createExpressionAst(expression) : null
        const bodyArray = statement ? util.createStatementAst(statement) : []
        const body = bodyArray.length > 0 ? bodyArray[0] : null

        return SlimeAstUtil.createWhileStatement(test, body, cst.loc, whileToken, lParenToken, rParenToken)
    }

    /**
     * 创建 do...while 语句 AST
     */
    static createDoWhileStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
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
                const bodyArray = util.createStatementAst(child)
                body = bodyArray.length > 0 ? bodyArray[0] : null
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression') {
                test = util.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createDoWhileStatement(body, test, cst.loc, doToken, whileToken, lParenToken, rParenToken, semicolonToken)
    }

    /**
     * IterationStatement CST 到 AST（透传）
     * IterationStatement -> DoWhileStatement | WhileStatement | ForStatement | ForInOfStatement
     */
    static createIterationStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createStatementDeclarationAst(firstChild)
        }
        throw new Error('IterationStatement has no children')
    }

    /**
     * BreakableStatement CST 到 AST（透传）
     * BreakableStatement -> IterationStatement | SwitchStatement
     */
    static createBreakableStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createStatementDeclarationAst(firstChild)
        }
        throw new Error('BreakableStatement has no children')
    }

    /**
     * ForDeclaration CST 到 AST
     * ForDeclaration -> LetOrConst ForBinding
     */
    static createForDeclarationAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? this.createForBindingAst(forBinding, util) : null

        return {
            type: SlimeNodeType.VariableDeclaration,
            declarations: [{
                type: SlimeNodeType.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: { type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc },
            loc: cst.loc
        }
    }

    /**
     * ForBinding CST 到 AST
     * ForBinding -> BindingIdentifier | BindingPattern
     */
    static createForBindingAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return util.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return util.createBindingPatternAst(firstChild)
        }
        return util.createBindingIdentifierAst(firstChild)
    }
}
