import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeExpressionStatement, SlimeAssignmentExpression, SlimeConditionalExpression } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

/**
 * 基础表达式 CST 到 AST 转换器
 * 
 * 负责处理：
 * - PrimaryExpression: 基础表达式
 * - Expression: 表达式（包括逗号表达式）
 * - AssignmentExpression: 赋值表达式
 * - ConditionalExpression: 条件表达式
 * - ParenthesizedExpression: 括号表达式
 * - ExpressionStatement: 表达式语句
 * - ExpressionBody: 表达式体
 * - CoverParenthesizedExpressionAndArrowParameterList: Cover Grammar
 * - CoverInitializedName: Cover Grammar
 * - AssignmentOperator: 赋值运算符
 * - MultiplicativeOperator: 乘法运算符
 */
export class PrimaryExpressionCstToAst {

    /**
     * 创建 PrimaryExpression AST
     */
    static createPrimaryExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            return util.createIdentifierAst(first.children[0])
        } else if (first.name === SlimeParser.prototype.Literal?.name) {
            return util.createLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ArrayLiteral?.name) {
            return util.createArrayLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.FunctionExpression?.name) {
            return util.createFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ObjectLiteral?.name) {
            return util.createObjectLiteralAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.ClassExpression?.name) {
            return util.createClassExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeTokenConsumer.prototype.This?.name) {
            return SlimeAstUtil.createThisExpression(first.loc)
        } else if (first.name === SlimeTokenConsumer.prototype.RegularExpressionLiteral?.name) {
            return util.createRegExpLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorExpression?.name || first.name === 'GeneratorExpression') {
            return util.createGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncFunctionExpression?.name || first.name === 'AsyncFunctionExpression') {
            return util.createAsyncFunctionExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorExpression?.name || first.name === 'AsyncGeneratorExpression') {
            return util.createAsyncGeneratorExpressionAst(first) as SlimeExpression
        } else if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name ||
            first.name === 'CoverParenthesizedExpressionAndArrowParameterList') {
            return this.createCoverParenthesizedExpressionAndArrowParameterListAst(first, util)
        } else if (first.name === SlimeParser.prototype.TemplateLiteral?.name) {
            return util.createTemplateLiteralAst(first)
        } else if (first.name === SlimeParser.prototype.ParenthesizedExpression?.name) {
            const expressionCst = first.children[1]
            const innerExpression = util.createExpressionAst(expressionCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpression, first.loc)
        } else if (first.name === 'RegularExpressionLiteral') {
            return util.createRegExpLiteralAst(first)
        } else {
            throw new Error('未知的 PrimaryExpression 类型: ' + first.name)
        }
    }


    /**
     * 创建 CoverParenthesizedExpressionAndArrowParameterList AST
     */
    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        // Empty parentheses: ()
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createIdentifier('undefined', cst.loc)
        }

        // Only 2 children (empty parens): LParen, RParen
        if (cst.children.length === 2) {
            return SlimeAstUtil.createIdentifier('undefined', cst.loc)
        }

        // Find the content (skip LParen at start, RParen at end)
        const middleCst = cst.children[1]
        if (!middleCst) {
            return SlimeAstUtil.createIdentifier('undefined', cst.loc)
        }

        // If it's an Expression, process it directly
        if (middleCst.name === SlimeParser.prototype.Expression?.name || middleCst.name === 'Expression') {
            const innerExpr = util.createExpressionAst(middleCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpr, cst.loc)
        }

        // If it's AssignmentExpression, process it
        if (middleCst.name === SlimeParser.prototype.AssignmentExpression?.name || middleCst.name === 'AssignmentExpression') {
            const innerExpr = util.createExpressionAst(middleCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpr, cst.loc)
        }

        // If it's FormalParameterList, convert to expression
        if (middleCst.name === SlimeParser.prototype.FormalParameterList?.name || middleCst.name === 'FormalParameterList') {
            const params = util.createFormalParameterListAst(middleCst)
            if (params.length === 1 && params[0].type === SlimeNodeType.Identifier) {
                return SlimeAstUtil.createParenthesizedExpression(params[0] as any, cst.loc)
            }
            if (params.length > 1) {
                const expressions = params.map(p => p as any)
                return SlimeAstUtil.createParenthesizedExpression({
                    type: 'SequenceExpression',
                    expressions: expressions
                } as any, cst.loc)
            }
            return SlimeAstUtil.createIdentifier('undefined', cst.loc)
        }

        // Try to process the middle content as an expression
        try {
            const innerExpr = util.createExpressionAst(middleCst)
            return SlimeAstUtil.createParenthesizedExpression(innerExpr, cst.loc)
        } catch (e) {
            return SlimeAstUtil.createIdentifier('undefined', cst.loc)
        }
    }

    /**
     * 创建 ParenthesizedExpression AST
     */
    static createParenthesizedExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return util.createExpressionAst(child)
            }
        }
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' && ch.value !== '(' && ch.value !== ')'
        )
        if (innerExpr) {
            return util.createExpressionAst(innerExpr)
        }
        throw new Error('ParenthesizedExpression has no inner expression')
    }

    /**
     * 创建 ComputedPropertyName AST
     */
    static createComputedPropertyNameAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return util.createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }

    /**
     * 创建 CoverInitializedName AST
     */
    static createCoverInitializedNameAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.IdentifierReference?.name ||
            ch.name === 'IdentifierReference'
        )
        const init = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name ||
            ch.name === 'Initializer'
        )

        const id = idRef ? util.createIdentifierReferenceAst(idRef) : null
        const initValue = init ? util.createInitializerAst(init) : null

        return {
            type: SlimeNodeType.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        }
    }

    /**
     * 创建 MultiplicativeOperator AST
     */
    static createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * 创建 AssignmentOperator AST
     */
    static createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    /**
     * 创建 ExpressionBody AST
     */
    static createExpressionBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return util.createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }

    /**
     * 创建 ExpressionStatement AST
     */
    static createExpressionStatementAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpressionStatement {
        checkCstName(cst, SlimeParser.prototype.ExpressionStatement?.name);

        let semicolonToken: any = undefined
        let expression: any = null

        for (const child of cst.children || []) {
            if (child.name === 'Semicolon' || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression' ||
                !expression) {
                expression = util.createExpressionAst(child)
            }
        }

        return SlimeAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken)
    }


    /**
     * 创建 AssignmentExpression AST
     */
    static createAssignmentExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return util.createArrowFunctionAst(child)
            }
            return util.createExpressionAst(child)
        }

        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = util.createExpressionAst(leftCst)
        const right = this.createAssignmentExpressionAst(rightCst, util)
        const operator = (operatorCst.children && operatorCst.children[0]?.value) || operatorCst.value || '='

        const ast: SlimeAssignmentExpression = {
            type: 'AssignmentExpression',
            operator: operator as any,
            left: left as any,
            right: right,
            loc: cst.loc
        }
        return ast
    }

    /**
     * 创建 ConditionalExpression AST
     */
    static createConditionalExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = util.createExpressionAst(firstChild)
        let alternate
        let consequent

        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return util.createExpressionAst(cst.children[0])
        } else {
            const questionCst = cst.children[1]
            const colonCst = cst.children[3]

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeTokenCreate.createQuestionToken(questionCst.loc)
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)
            }

            consequent = this.createAssignmentExpressionAst(cst.children[2], util)
            alternate = this.createAssignmentExpressionAst(cst.children[4], util)
        }

        return SlimeAstUtil.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }
}
