import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class BinaryExpressionCstToAst {

    static createLogicalORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.LogicalORExpression?.name || 'LogicalORExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createLogicalANDExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.LogicalANDExpression?.name || 'LogicalANDExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createBitwiseORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseORExpression?.name || 'BitwiseORExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createBitwiseXORExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseXORExpression?.name || 'BitwiseXORExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createBitwiseANDExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.BitwiseANDExpression?.name || 'BitwiseANDExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createEqualityExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.EqualityExpression?.name || 'EqualityExpression');
        if (cst.children && cst.children.length > 1) {
            const left = util.createExpressionAst(cst.children[0]);
            const operator = cst.children[1].value as any;
            const right = util.createExpressionAst(cst.children[2]);

            return {
                type: SlimeNodeType.BinaryExpression,
                operator: operator,
                left: left,
                right: right,
                loc: cst.loc
            } as any;
        }
        return util.createExpressionAst(cst.children![0]);
    }

    static createRelationalExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.RelationalExpression?.name || 'RelationalExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createShiftExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ShiftExpression?.name || 'ShiftExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createAdditiveExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.AdditiveExpression?.name || 'AdditiveExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createMultiplicativeExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.MultiplicativeExpression?.name || 'MultiplicativeExpression');
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);

            for (let i = 1; i < cst.children.length; i += 2) {
                const operatorNode = cst.children[i];
                const operator = operatorNode.children ? operatorNode.children[0].value : operatorNode.value;
                const right = util.createExpressionAst(cst.children[i + 1]);

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
        return util.createExpressionAst(cst.children![0]);
    }

    static createExponentiationExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        if (cst.children && cst.children.length > 1) {
            const left = util.createExpressionAst(cst.children[0]);
            const right = BinaryExpressionCstToAst.createExponentiationExpressionAst(cst.children[2], util);
            return {
                type: SlimeNodeType.BinaryExpression,
                operator: '**',
                left: left,
                right: right,
                loc: cst.loc
            } as any;
        }
        return util.createExpressionAst(cst.children![0]);
    }

    static createCoalesceExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        if (cst.children && cst.children.length > 1) {
            let left = util.createExpressionAst(cst.children[0]);
            for (let i = 1; i < cst.children.length; i += 2) {
                const right = util.createExpressionAst(cst.children[i + 1]);
                left = {
                    type: SlimeNodeType.LogicalExpression,
                    operator: '??',
                    left: left,
                    right: right,
                    loc: cst.loc
                } as any;
            }
            return left;
        }
        return util.createExpressionAst(cst.children![0]);
    }
}
