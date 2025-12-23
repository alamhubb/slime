import {SubhutiCst} from "subhuti";
import {
    SlimeArrayPattern,
    SlimeBlockStatement,
    SlimeFunctionExpression,
    SlimeFunctionParam,
    SlimeIdentifier, SlimeObjectPattern,
    SlimeTokenCreateUtils
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptAssignmentPatternCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeAssignmentPatternCstToAstSingle extends SlimeJavascriptAssignmentPatternCstToAstSingle {

}


export const SlimeAssignmentPatternCstToAst = new SlimeAssignmentPatternCstToAstSingle()