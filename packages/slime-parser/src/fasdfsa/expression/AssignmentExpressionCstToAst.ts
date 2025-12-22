import { SubhutiCst } from "subhuti";
import {
    SlimeArrowFunctionExpression, SlimeAssignmentExpression, SlimeAstUtil,
    type SlimeBlockStatement, type SlimeClassExpression,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier,
    SlimeTokenCreate
} from "slime-ast";
import { SlimeAstUtils } from "../SlimeAstUtils.ts";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

export class AssignmentExpressionCstToAst {



    static createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AssignmentExpression?.name);

        if (cst.children.length === 1) {
            const child = cst.children[0]
            // 检查是否是箭头函数
            if (child.name === SlimeParser.prototype.ArrowFunction?.name) {
                return SlimeCstToAstUtil.createArrowFunctionAst(child)
            }
            // 否则作为表达式处�?
            return SlimeCstToAstUtil.createExpressionAst(child)
        }

        // AssignmentExpression -> LeftHandSideExpression + Eq + AssignmentExpression
        // �?LeftHandSideExpression + AssignmentOperator + AssignmentExpression
        const leftCst = cst.children[0]
        const operatorCst = cst.children[1]
        const rightCst = cst.children[2]

        const left = SlimeCstToAstUtil.createExpressionAst(leftCst)
        const right = SlimeCstToAstUtil.createAssignmentExpressionAst(rightCst)
        // AssignmentOperator节点下有子节�?PlusEq/MinusEq�?，需要从children[0].value获取
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

}