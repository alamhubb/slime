/**
 * PrimaryExpressionCstToAst - 基础表达式转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeBlockStatement,
    SlimeExpression,
    SlimeFunctionExpression,
    SlimeFunctionParam,
    SlimeIdentifier, SlimeAstTypeName, SlimePattern, SlimeRestElement
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptPrimaryExpressionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimePrimaryExpressionCstToAstSingle extends SlimeJavascriptPrimaryExpressionCstToAstSingle {

}

export const SlimePrimaryExpressionCstToAst = new SlimePrimaryExpressionCstToAstSingle()
