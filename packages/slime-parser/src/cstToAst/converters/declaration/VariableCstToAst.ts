/**
 * VariableCstToAst - var/let/const 声明转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimePattern,
    type SlimeIdentifier,
    type SlimeVariableDeclarator,
    SlimeAstUtil,
    SlimeTokenCreate,
} from "slime-ast";
import SlimeParser from "../../../SlimeParser";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class VariableCstToAst {
    /**
     * 创建 VariableDeclarator AST
     * 兼容 LexicalBinding 和 VariableDeclaration
     */
    static createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimePattern

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name) {
            id = SlimeCstToAstUtil.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeTokenCreate.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const init = SlimeCstToAstUtil.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = SlimeCstToAstUtil.createExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                }
            } else {
                variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst)
            }
        } else {
            variableDeclarator = SlimeAstUtil.createVariableDeclarator(id)
        }
        variableDeclarator.loc = cst.loc
        return variableDeclarator
    }
}
