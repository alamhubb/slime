/**
 * BinaryExpressionCstToAst - 二元表达式转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils, type SlimeBlockStatement,
    SlimeExpression,
    type SlimeFunctionExpression, type SlimeFunctionParam,
    type SlimeIdentifier,
    SlimeAstTypeName
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptBinaryExpressionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeBinaryExpressionCstToAstSingle extends SlimeJavascriptBinaryExpressionCstToAstSingle {

}

export const SlimeBinaryExpressionCstToAst = new SlimeBinaryExpressionCstToAstSingle()
