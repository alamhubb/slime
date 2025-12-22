/**
 * ArrowFunctionCstToAst - 箭头函数转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeBlockStatement,
    SlimeExpression,
    type SlimeFunctionParam,
    SlimeMethodDefinition,
    SlimePattern,
    SlimeTokenCreate,
    SlimeAstTypeName, SlimeArrowFunctionExpression, SlimeIdentifier
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptArrowFunctionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeArrowFunctionCstToAstSingle extends SlimeJavascriptArrowFunctionCstToAstSingle {

}

export const SlimeArrowFunctionCstToAst = new SlimeArrowFunctionCstToAstSingle()
