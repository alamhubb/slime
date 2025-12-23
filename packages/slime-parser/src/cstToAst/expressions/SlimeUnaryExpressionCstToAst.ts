/**
 * UnaryExpressionCstToAst - 一元/更新表达式转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils, type SlimeBlockStatement,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier, SlimeAstTypeName, SlimeTokenCreateUtils
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptUnaryExpressionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeUnaryExpressionCstToAstSingle extends SlimeJavascriptUnaryExpressionCstToAstSingle {

}


export const SlimeUnaryExpressionCstToAst = new SlimeUnaryExpressionCstToAstSingle()
