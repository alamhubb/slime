/**
 * ClassDeclarationCstToAst - class 声明/表达式转换
 */
import {
    type SlimeClassExpression,
    type SlimeIdentifier,
    SlimeAstUtil,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class ClassDeclarationCstToAst {
    /**
     * 创建 ClassExpression AST
     */
    static createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null;
        let tailStartIndex = 1;
        const nextChild = cst.children[1];
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(nextChild) as SlimeIdentifier;
            tailStartIndex = 2;
        }
        const classTail = SlimeCstToAstUtil.createClassTailAst(cst.children[tailStartIndex]);

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc);
    }
}
