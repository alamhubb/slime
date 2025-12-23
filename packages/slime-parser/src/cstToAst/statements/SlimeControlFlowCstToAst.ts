/**
 * ControlFlowCstToAst - if/for/while/do-while 转换
 */
import {SubhutiCst} from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import {
    SlimeAstCreateUtils,
    SlimeAstTypeName,
    SlimeTokenCreateUtils,
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator
} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "./SlimeVariableCstToAst.ts";
import {
    SlimeJavascriptBlockCstToAstSingle,
    SlimeJavascriptControlFlowCstToAstSingle
} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeControlFlowCstToAstSingle extends SlimeJavascriptControlFlowCstToAstSingle {

}

export const SlimeControlFlowCstToAst = new SlimeControlFlowCstToAstSingle()