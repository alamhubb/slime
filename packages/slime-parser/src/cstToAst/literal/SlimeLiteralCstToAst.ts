/**
 * LiteralCstToAst - 基础字面量（数字/字符串/布尔等）转换
 */
import {SubhutiCst} from "subhuti";
import {
    type SlimeArrayElement,
    type SlimeArrayExpression, type SlimeArrowFunctionExpression, type SlimeAssignmentExpression,
    SlimeAstCreateUtils, type SlimeClassExpression,
    type SlimeExpression, type SlimeFunctionParam, type SlimeIdentifier, SlimeLiteral,
    SlimeAstTypeName, SlimeNumericLiteral, type SlimeSpreadElement,
    SlimeStringLiteral, SlimeTokenCreateUtils
} from "slime-ast";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptLiteralCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeLiteralCstToAstSingle extends SlimeJavascriptLiteralCstToAstSingle {

}

export const SlimeLiteralCstToAst = new SlimeLiteralCstToAstSingle()
