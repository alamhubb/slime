/**
 * ControlFlowCstToAst - if/for/while/do-while 转换
 */
import {SubhutiCst} from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import {
    SlimeAstUtil,
    SlimeAstTypeName,
    SlimeTokenCreate,
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator
} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "./SlimeVariableCstToAst.ts";
import {SlimeJavascriptBlockCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeControlFlowCstToAstSingle extends SlimeJavascriptBlockCstToAstSingle {

}

export const SlimeControlFlowCstToAst = new SlimeControlFlowCstToAstSingle()