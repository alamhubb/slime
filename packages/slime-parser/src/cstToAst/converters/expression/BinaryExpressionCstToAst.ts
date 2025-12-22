/**
 * BinaryExpressionCstToAst - 二元表达式转换
 */
import {
    type SlimeExpression,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class BinaryExpressionCstToAst {
    /**
     * 处理 ShortCircuitExpressionTail (|| 和 ?? 运算符的尾部)
     */
    static createShortCircuitExpressionTailAst(left: SlimeExpression, tailCst: SubhutiCst): SlimeExpression {
        const tailChildren = tailCst.children || [];

        if (tailCst.name === 'ShortCircuitExpressionTail' && tailChildren.length > 0) {
            const innerTail = tailChildren[0];
            return BinaryExpressionCstToAst.createShortCircuitExpressionTailAst(left, innerTail);
        }

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


    /**
     * 创建 ExponentiationExpression AST（ES2016）
     */
    static createExponentiationExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
        }
        const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
        const right = BinaryExpressionCstToAst.createExponentiationExpressionAst(cst.children[2]);
        return {
            type: SlimeNodeType.BinaryExpression,
            operator: '**',
            left: left,
            right: right
        } as any;
    }

    /**
     * 创建 LogicalORExpression AST
     */
    static createLogicalORExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 LogicalANDExpression AST
     */
    static createLogicalANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 BitwiseORExpression AST
     */
    static createBitwiseORExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 BitwiseXORExpression AST
     */
    static createBitwiseXORExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 BitwiseANDExpression AST
     */
    static createBitwiseANDExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }


    /**
     * 创建 EqualityExpression AST
     */
    static createEqualityExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name);
        if (cst.children.length > 1) {
            const left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            const operator = cst.children[1].value as any;
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[2]);
            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 RelationalExpression AST
     */
    static createRelationalExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 ShiftExpression AST
     */
    static createShiftExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 AdditiveExpression AST
     */
    static createAdditiveExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }

    /**
     * 创建 MultiplicativeExpression AST
     */
    static createMultiplicativeExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name);
        if (cst.children.length > 1) {
            let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.BinaryExpression,
                    operator: operator,
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }
}
