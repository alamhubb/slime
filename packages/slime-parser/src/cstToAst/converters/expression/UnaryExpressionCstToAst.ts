import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class UnaryExpressionCstToAst {

    static createUnaryExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name || 'UnaryExpression');

        if (!cst.children || cst.children.length === 0) {
            throw new Error(`UnaryExpression CST has no children`);
        }

        if (cst.children.length === 1) {
            const child = cst.children[0];
            if (child.value !== undefined && !child.children) {
                throw new Error(`UnaryExpression CST incomplete: only operator token '${child.name}'`);
            }
            return util.createExpressionAst(child);
        }

        const operatorToken = cst.children[0];
        const argumentCst = cst.children[1];

        const operatorMap: { [key: string]: string } = {
            'Exclamation': '!',
            'Plus': '+',
            'Minus': '-',
            'Tilde': '~',
            'Typeof': 'typeof',
            'Void': 'void',
            'Delete': 'delete',
            'PlusPlus': '++',
            'MinusMinus': '--',
        };

        const operator = operatorMap[operatorToken.name] || operatorToken.value;
        const argument = util.createExpressionAst(argumentCst);

        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,
            argument: argument,
            loc: cst.loc
        } as any;
    }

    static createUpdateExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        if (cst.children && cst.children.length > 1) {
            const first = cst.children[0];
            const isPrefix = first.loc?.type === 'PlusPlus' || first.loc?.type === 'MinusMinus' ||
                first.value === '++' || first.value === '--';

            if (isPrefix) {
                const operator = (first.value || first.loc?.value) as string;
                const argument = util.createExpressionAst(cst.children[1]);
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any;
            } else {
                const argument = util.createExpressionAst(cst.children[0]);
                let operator: string | undefined;
                for (let i = 1; i < cst.children.length; i++) {
                    const child = i < cst.children.length ? cst.children[i] : null;
                    if (child && (child.loc?.type === 'PlusPlus' || child.loc?.type === 'MinusMinus' ||
                        child.value === '++' || child.value === '--')) {
                        operator = (child.value || child.loc?.value) as string;
                        break;
                    }
                }
                if (operator) {
                    return {
                        type: SlimeNodeType.UpdateExpression,
                        operator: operator,
                        argument: argument,
                        prefix: false,
                        loc: cst.loc
                    } as any;
                }
            }
        }
        return util.createExpressionAst(cst.children![0]);
    }
}
