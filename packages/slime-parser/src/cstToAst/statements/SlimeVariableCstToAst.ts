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
    SlimeTokenCreateUtils, type SlimeVariableDeclaration, type SlimeVariableDeclarator,
    SlimeAstCreateUtils, type SlimePattern, type SlimeExpression
} from "slime-ast";
import { SlimeClassDeclarationCstToAstSingle } from "../class/SlimeClassDeclarationCstToAst.ts";
import {
    SlimeJavascriptOtherStatementCstToAstSingle,
    SlimeJavascriptVariableCstToAstSingle
} from "../../deprecated/slimeJavascriptCstToAst";
import { SlimeIdentifierCstToAst } from "../identifier/SlimeIdentifierCstToAst.ts";


export class SlimeVariableCstToAstSingle extends SlimeJavascriptVariableCstToAstSingle {

    /**
     * [TypeScript] 重写 createDeclarationAst 以支持 TypeScript 声明
     */
    override createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        // Support both Declaration wrapper and direct types
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        // TypeScript 声明
        if (name === 'TSInterfaceDeclaration') {
            return SlimeIdentifierCstToAst.createTSInterfaceDeclarationAst(first)
        }
        if (name === 'TSTypeAliasDeclaration') {
            return SlimeIdentifierCstToAst.createTSTypeAliasDeclarationAst(first)
        }
        if (name === 'TSEnumDeclaration') {
            return SlimeIdentifierCstToAst.createTSEnumDeclarationAst(first)
        }
        if (name === 'TSModuleDeclaration') {
            return SlimeIdentifierCstToAst.createTSModuleDeclarationAst(first)
        }
        if (name === 'TSDeclareStatement') {
            return SlimeIdentifierCstToAst.createTSDeclareStatementAst(first)
        }

        // 调用父类处理 JavaScript 声明
        return super.createDeclarationAst(cst)
    }

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
                    assignToken = SlimeTokenCreateUtils.createAssignToken(assignCst.loc)
                }
                init = SlimeCstToAstUtil.createInitializerAst(child)
            }
        }

        return SlimeAstCreateUtils.createVariableDeclarator(id, assignToken, init, cst.loc)
    }
}

export const SlimeVariableCstToAst = new SlimeVariableCstToAstSingle()