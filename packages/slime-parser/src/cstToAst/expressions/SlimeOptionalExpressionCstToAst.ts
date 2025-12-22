import {
    SlimeAstUtil,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeIdentifier,
    SlimeAstTypeName
} from "slime-ast";
import {SubhutiCst} from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptOptionalExpressionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeOptionalExpressionCstToAstSingle extends SlimeJavascriptOptionalExpressionCstToAstSingle {

}

export const SlimeOptionalExpressionCstToAst = new SlimeOptionalExpressionCstToAstSingle()