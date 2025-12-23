/**
 * FunctionExpressionCstToAst - 函数表达式转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils, SlimeBlockStatement,
    SlimeClassExpression,
    SlimeFunctionExpression,
    SlimeFunctionParam,
    SlimeIdentifier, SlimeTokenCreateUtils
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptFunctionExpressionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeFunctionExpressionCstToAstSingle extends SlimeJavascriptFunctionExpressionCstToAstSingle {

}


export const SlimeFunctionExpressionCstToAst = new SlimeFunctionExpressionCstToAstSingle()
