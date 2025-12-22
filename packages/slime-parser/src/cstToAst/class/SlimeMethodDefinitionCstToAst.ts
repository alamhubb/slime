/**
 * MethodDefinitionCstToAst - 方法定义转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    type SlimeBlockStatement, SlimeExpression,
    type SlimeFunctionExpression,
    SlimeFunctionParam,
    type SlimeIdentifier, SlimeLiteral, SlimeMethodDefinition, SlimeAstTypeName, SlimePattern, SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptMethodDefinitionCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeMethodDefinitionCstToAstSingle extends SlimeJavascriptMethodDefinitionCstToAstSingle {
}

export const SlimeMethodDefinitionCstToAst = new SlimeMethodDefinitionCstToAstSingle()
