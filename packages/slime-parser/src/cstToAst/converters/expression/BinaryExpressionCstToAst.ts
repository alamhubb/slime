/**
 * BinaryExpressionCstToAst - 二元表达式转换
 */
import {
    type SlimeExpression,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class BinaryExpressionCstToAst {
    /**
     * 处理 ShortCircuitExpressionTail (|| 和 ?? 运算符的尾部)
     * CST 结构：ShortCircuitExpressionTail -> LogicalORExpressionTail | CoalesceExpressionTail
     */
    static createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        const tailChildren = tailCst.children || [];

        // 如果是 ShortCircuitExpressionTail，获取内部的 tail
        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0];
            return BinaryExpressionCstToAst.createShortCircuitExpressionTailAst(left, innerTail);
        }

        // LogicalORExpressionTail: (LogicalOr LogicalANDExpression)+
        if (tailCst.name === 'LogicalORExpressionTail') {
            let result = left;

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i];
                const operator = operatorNode.value || '||';

                const rightCst = tailChildren[i + 1];
                if (!rightCst) break;

                const right = SlimeCstToAstUtil.createExpressionAst(rightCst);

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any;
            }

            return result;
        }

        // CoalesceExpressionTail: (?? BitwiseORExpression)+
        if (tailCst.name === 'CoalesceExpressionTail') {
            let result = left;

            for (let i = 0; i < tailChildren.length; i += 2) {
                const operatorNode = tailChildren[i];
                const operator = operatorNode.value || '??';

                const rightCst = tailChildren[i + 1];
                if (!rightCst) break;

                const right = SlimeCstToAstUtil.createExpressionAst(rightCst);

                result = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: result,
                    right: right,
                    loc: tailCst.loc
                } as any;
            }

            return result;
        }

        console.warn('Unknown ShortCircuitExpressionTail type:', tailCst.name);
        return left;
    }
}
