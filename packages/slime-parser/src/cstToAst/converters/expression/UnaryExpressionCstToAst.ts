import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

export class UnaryExpressionCstToAst {

    static createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name || 'UnaryExpression');

        if (cst.children!.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        }

        const operatorNode = cst.children![0];
        const operator = operatorNode.value;
        const operand = UnaryExpressionCstToAst.createUnaryExpressionAst(cst.children![1]);

        if (operator === 'delete' || operator === 'void' || operator === 'typeof' || operator === '+' || operator === '-' || operator === '~' || operator === '!') {
            return SlimeAstUtil.createUnaryExpression(operator as any, operand, cst.loc) as SlimeExpression;
        }

        return operand;
    }

    static createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.UpdateExpression?.name || 'UpdateExpression');

        if (cst.children!.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        }

        // 处理前置更新 ++x, --x
        if (cst.children![0].name === 'PlusPlus' || cst.children![0].name === 'MinusMinus') {
            const operator = cst.children![0].value;
            const operand = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
            return SlimeAstUtil.createUpdateExpression(operator as any, operand, true, cst.loc) as SlimeExpression;
        }

        // 处理后置更新 x++, x--
        const operand = SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        const operator = cst.children![1].value;
        return SlimeAstUtil.createUpdateExpression(operator as any, operand, false, cst.loc) as SlimeExpression;
    }

    static createAwaitExpressionAst(cst: SubhutiCst): SlimeExpression {
        const argument = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
        return SlimeAstUtil.createAwaitExpression(argument, cst.loc) as SlimeExpression;
    }

    static createYieldExpressionAst(cst: SubhutiCst): SlimeExpression {
        let argument = null;
        let delegate = false;

        if (cst.children!.length > 1) {
            if (cst.children![1].value === '*') {
                delegate = true;
                argument = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
            } else {
                argument = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
            }
        }

        return SlimeAstUtil.createYieldExpression(argument, delegate, cst.loc) as SlimeExpression;
    }
}
