/**
 * PrimaryExpressionCstToAst - 基础表达式转换
 */
import {
    type SlimeExpression,
    SlimeAstUtil,
    SlimeTokenCreate,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import { checkCstName } from "../../utils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class PrimaryExpressionCstToAst {
    /**
     * 创建条件表达式 AST
     */
    static createConditionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ConditionalExpression?.name);
        
        const firstChild = cst.children[0];
        let test = SlimeCstToAstUtil.createExpressionAst(firstChild);
        let alternate;
        let consequent;

        let questionToken: any = undefined;
        let colonToken: any = undefined;

        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
        } else {
            const questionCst = cst.children[1];
            const colonCst = cst.children[3];

            if (questionCst && (questionCst.name === 'Question' || questionCst.value === '?')) {
                questionToken = SlimeTokenCreate.createQuestionToken(questionCst.loc);
            }
            if (colonCst && (colonCst.name === 'Colon' || colonCst.value === ':')) {
                colonToken = SlimeTokenCreate.createColonToken(colonCst.loc);
            }

            consequent = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[2]);
            alternate = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[4]);
        }

        return SlimeAstUtil.createConditionalExpression(test, consequent, alternate, cst.loc, questionToken, colonToken);
    }

    /**
     * 创建 yield 表达式 AST
     */
    static createYieldExpressionAst(cst: SubhutiCst): any {
        let yieldToken: any = undefined;
        let asteriskToken: any = undefined;
        let delegate = false;
        let startIndex = 1;

        if (cst.children[0] && (cst.children[0].name === 'Yield' || cst.children[0].value === 'yield')) {
            yieldToken = SlimeTokenCreate.createYieldToken(cst.children[0].loc);
        }

        if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.Asterisk?.name) {
            asteriskToken = SlimeTokenCreate.createAsteriskToken(cst.children[1].loc);
            delegate = true;
            startIndex = 2;
        }
        
        let argument: any = null;
        if (cst.children[startIndex]) {
            argument = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[startIndex]);
        }

        return SlimeAstUtil.createYieldExpression(argument, delegate, cst.loc, yieldToken, asteriskToken);
    }

    /**
     * 创建 await 表达式 AST
     */
    static createAwaitExpressionAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.AwaitExpression?.name);

        let awaitToken: any = undefined;

        if (cst.children[0] && (cst.children[0].name === 'Await' || cst.children[0].value === 'await')) {
            awaitToken = SlimeTokenCreate.createAwaitToken(cst.children[0].loc);
        }

        const argumentCst = cst.children[1];
        const argument = SlimeCstToAstUtil.createExpressionAst(argumentCst);

        return SlimeAstUtil.createAwaitExpression(argument, cst.loc, awaitToken);
    }
}
