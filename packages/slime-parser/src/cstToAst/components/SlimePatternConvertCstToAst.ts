import {
    SlimeAstCreateUtils,
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimeFunctionParam,
    SlimeAstTypeName,
    type SlimePattern,
    SlimeTokenCreateUtils,
    type SlimeArrayPattern,
    type SlimeArrayPatternElement,
    type SlimeObjectPattern,
    type SlimeObjectPatternProperty,
    type SlimeAssignmentProperty,
    type SlimeRestElement, SlimeStatement, SlimeIdentifier
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../SlimeParser.ts";

import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptPatternConvertCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimePatternConvertCstToAstSingle extends SlimeJavascriptPatternConvertCstToAstSingle{}


export const SlimePatternConvertCstToAst = new SlimePatternConvertCstToAstSingle()