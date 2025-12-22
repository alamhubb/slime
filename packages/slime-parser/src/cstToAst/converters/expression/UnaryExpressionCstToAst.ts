/**
 * UnaryExpressionCstToAst - 一元/更新表达式转换
 */
import {
    type SlimeExpression,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class UnaryExpressionCstToAst {
    /**
     * 创建 UnaryExpression AST
     */
    static createUnaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.UnaryExpression?.name);

        if (!cst.children || cst.children.length === 0) {
            console.error('UnaryExpression CST没有children:', JSON.stringify(cst, null, 2));
            throw new Error(`UnaryExpression CST没有children，可能是Parser生成的CST不完整`);
        }

        if (cst.children.length === 1) {
            const child = cst.children[0];
            if (child.value !== undefined && !child.children) {
                throw new Error(
                    `UnaryExpression CST不完整：只有运算符token '${child.name}' (${child.value})，缺少操作数。`
                );
            }
            return SlimeCstToAstUtil.createExpressionAst(child);
        }

        const operatorToken = cst.children[0];
        const argumentCst = cst.children[1];

        const operatorMap: {[key: string]: string} = {
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
        const argument = SlimeCstToAstUtil.createExpressionAst(argumentCst);

        return {
            type: SlimeNodeType.UnaryExpression,
            operator: operator,
            prefix: true,
            argument: argument,
            loc: cst.loc
        } as any;
    }


    /**
     * 创建 UpdateExpression AST
     */
    static createUpdateExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length > 1) {
            const first = cst.children[0];
            const isPrefix = first.loc?.type === 'PlusPlus' || first.loc?.type === 'MinusMinus' ||
                first.value === '++' || first.value === '--';

            if (isPrefix) {
                const operator = first.value || first.loc?.value;
                const argument = SlimeCstToAstUtil.createExpressionAst(cst.children[1]);
                return {
                    type: SlimeNodeType.UpdateExpression,
                    operator: operator,
                    argument: argument,
                    prefix: true,
                    loc: cst.loc
                } as any;
            } else {
                const argument = SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
                let operator: string | undefined;
                for (let i = 1; i < cst.children.length; i++) {
                    const child = cst.children[i];
                    if (child.loc?.type === 'PlusPlus' || child.loc?.type === 'MinusMinus' ||
                        child.value === '++' || child.value === '--') {
                        operator = child.value || child.loc?.value;
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
        return SlimeCstToAstUtil.createExpressionAst(cst.children[0]);
    }
}
