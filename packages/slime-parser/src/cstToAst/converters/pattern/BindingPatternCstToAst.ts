/**
 * BindingPatternCstToAst - 绑定模式转换
 */
import {
    type SlimeArrayPattern,
    type SlimeArrayPatternElement,
    type SlimeRestElement,
    SlimeNodeType,
    SlimeTokenCreate,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class BindingPatternCstToAst {
    /**
     * 将 ArrayLiteral CST 转换为 ArrayPattern
     */
    static convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = [];
        let lBracketToken: any = undefined;
        let rBracketToken: any = undefined;

        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elisionChild.loc);
                    }
                    elements.push({ element: null });
                }
            }
        };

        for (const child of cst.children || []) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc);
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc);
            } else if (child.name === 'Elision') {
                processElision(child);
            } else if (child.name === 'ElementList') {
                const elemChildren = child.children || [];
                for (let i = 0; i < elemChildren.length; i++) {
                    const elem = elemChildren[i];
                    if (elem.value === ',') {
                        if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                            elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elem.loc);
                        }
                    } else if (elem.name === 'Elision') {
                        processElision(elem);
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = SlimeCstToAstUtil.createExpressionAst(elem);
                        const pattern = SlimeCstToAstUtil.convertExpressionToPatternFromAST(expr);
                        elements.push({ element: pattern || expr as any });
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = SlimeCstToAstUtil.createSpreadElementAst(elem);
                        elements.push({
                            element: {
                                type: SlimeNodeType.RestElement,
                                argument: restNode.argument,
                                loc: restNode.loc
                            } as SlimeRestElement
                        });
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeArrayPattern;
    }
}
