/**
 * ExpressionCstToAst - 核心表达式转换（Expression 路由和操作符）
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";
import {SlimeAstUtil, SlimeTokenCreate} from "slime-ast";

export class ExpressionCstToAst {


    createYieldExpressionAst(cst: SubhutiCst): any {
        // yield [*] AssignmentExpression?
        let yieldToken: any = undefined
        let asteriskToken: any = undefined
        let delegate = false
        let startIndex = 1

        // 提取 yield token
        if (cst.children[0] && (cst.children[0].name === 'Yield' || cst.children[0].value === 'yield')) {
            yieldToken = SlimeTokenCreate.createYieldToken(cst.children[0].loc)
        }

        if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.Asterisk?.name) {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(cst.children[1].loc)
            delegate = true
            startIndex = 2
        }
        let argument: any = null
        if (cst.children[startIndex]) {
            argument = this.createAssignmentExpressionAst(cst.children[startIndex])
        }

        return SlimeAstUtil.createYieldExpression(argument, delegate, cst.loc, yieldToken, asteriskToken)
    }

    createAwaitExpressionAst(cst: SubhutiCst): any {
        // await UnaryExpression
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined

        // 提取 await token
        if (cst.children[0] && (cst.children[0].name === 'Await' || cst.children[0].value === 'await')) {
            awaitToken = SlimeTokenCreate.createAwaitToken(cst.children[0].loc)
        }

        const argumentCst = cst.children[1]
        const argument = this.createExpressionAst(argumentCst)

        return SlimeAstUtil.createAwaitExpression(argument, cst.loc, awaitToken)
    }

    createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);
        const firstChild = cst.children[0]
        let test = this.createExpressionAst(firstChild)
        let alternate
        let consequent

        // Token fields
        let questionToken: any = undefined
        let colonToken: any = undefined

        if (cst.children.length === 1) {
            return this.createExpressionAst(cst.children[0])
        } else {
            // CST children: [LogicalORExpression, Question, AssignmentExpression, Colon, AssignmentExpression]
            const questionCst = cst.children[1]
            const colonCst = cst.children[3]

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeTokenCreate.createQuestionToken(questionCst.loc)
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)
            }

            consequent = this.createAssignmentExpressionAst(cst.children[2])
            alternate = this.createAssignmentExpressionAst(cst.children[4])
        }

        return SlimeAstUtil.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken)
    }
}
