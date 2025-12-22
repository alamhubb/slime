/**
 * ExpressionCstToAst - 核心表达式转换（Expression 路由和操作符）
 */
import {SubhutiCst} from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import {SlimeAstUtil, SlimeExpression, SlimeAstTypeName, SlimeTokenCreate} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {
    SlimeJavascriptBinaryExpressionCstToAstSingle,
    SlimeJavascriptExpressionCstToAstSingle
} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeExpressionCstToAstSingle extends SlimeJavascriptExpressionCstToAstSingle{

}

export const SlimeExpressionCstToAst = new SlimeExpressionCstToAstSingle()
