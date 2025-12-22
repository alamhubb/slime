import {SubhutiCst} from "subhuti";
import {SlimeAstUtil, SlimeTokenCreate} from "slime-ast";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export default class ConditionExpressionCstToAst{

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