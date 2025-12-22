/**
 * VariableCstToAst - var/let/const 声明转换
 */
import { SubhutiCst } from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {
    type SlimeBlockStatement, type SlimeClassDeclaration, type SlimeDeclaration,
    type SlimeFunctionDeclaration, type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier, SlimeAstTypeName, type SlimePropertyDefinition,
    SlimeTokenCreate, type SlimeVariableDeclaration, type SlimeVariableDeclarator,
    SlimeAstUtil, type SlimePattern, type SlimeExpression
} from "slime-ast";
import { SlimeClassDeclarationCstToAstSingle } from "../class/SlimeClassDeclarationCstToAst.ts";
import {
    SlimeJavascriptOtherStatementCstToAstSingle,
    SlimeJavascriptVariableCstToAstSingle
} from "../../deprecated/slimeJavascriptCstToAst";
import { SlimeIdentifierCstToAst } from "../identifier/SlimeIdentifierCstToAst.ts";


export class SlimeVariableCstToAstSingle extends SlimeJavascriptVariableCstToAstSingle {

    /**
     * [TypeScript] 重写 createLexicalBindingAst 以使用新的 createBindingIdentifierAst
     * 该方法处理类似 `const a: number = 1` 的声明
     */
    override createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        const children = cst.children || []

        let id: any = null
        let init: any = null
        let assignToken: any = undefined

        for (const child of children) {
            if (!child) continue

            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                // [TypeScript] 使用新的 SlimeIdentifierCstToAst 来支持类型注解
                id = SlimeIdentifierCstToAst.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeTokenCreate.createAssignToken(assignCst.loc)
                }
                init = SlimeCstToAstUtil.createInitializerAst(child)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id, assignToken, init, cst.loc)
    }
}

export const SlimeVariableCstToAst = new SlimeVariableCstToAstSingle()