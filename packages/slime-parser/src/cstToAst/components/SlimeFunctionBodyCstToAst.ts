import {SubhutiCst} from "subhuti";
import {SlimeAstUtil, SlimeBlockStatement, SlimeExpression, SlimeMethodDefinition, SlimeStatement} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptFunctionBodyCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeFunctionBodyCstToAstSingle extends SlimeJavascriptFunctionBodyCstToAstSingle {

}

export const SlimeFunctionBodyCstToAst = new SlimeFunctionBodyCstToAstSingle()