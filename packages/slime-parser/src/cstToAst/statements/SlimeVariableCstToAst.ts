/**
 * VariableCstToAst - var/let/const 声明转换
 */
import {SubhutiCst} from "subhuti";

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
import {SlimeClassDeclarationCstToAstSingle} from "../class/SlimeClassDeclarationCstToAst.ts";
import {SlimeJavascriptOtherStatementCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";


export class SlimeVariableCstToAstSingle extends SlimeJavascriptOtherStatementCstToAstSingle {

}

export const SlimeVariableCstToAst = new SlimeVariableCstToAstSingle()