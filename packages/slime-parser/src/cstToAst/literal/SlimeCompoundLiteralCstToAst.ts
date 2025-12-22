/**
 * CompoundLiteralCstToAst - 数组/对象字面量转换
 */
import {SubhutiCst} from "subhuti";
import {
    type SlimeArrayElement,
    type SlimeArrayExpression, type SlimeArrowFunctionExpression,
    type SlimeAssignmentExpression,
    SlimeAstUtil,
    type SlimeClassBody,
    type SlimeExpression, type SlimeFunctionParam,
    SlimeIdentifier,
    SlimeLiteral,
    type SlimeMethodDefinition, SlimeAstTypeName,
    type SlimeObjectExpression,
    type SlimeObjectPropertyItem, SlimeProperty,
    type SlimePropertyDefinition,
    type SlimeSpreadElement,
    type SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptCompoundLiteralCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeCompoundLiteralCstToAstSingle extends SlimeJavascriptCompoundLiteralCstToAstSingle {

}

export const SlimeCompoundLiteralCstToAst = new SlimeCompoundLiteralCstToAstSingle()
