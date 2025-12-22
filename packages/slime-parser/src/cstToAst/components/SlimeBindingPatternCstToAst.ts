/**
 * BindingPatternCstToAst - 绑定模式转换
 */
import {SubhutiCst} from "subhuti";
import {
    type SlimeArrayPattern,
    SlimeAstUtil, type SlimeBlockStatement, type SlimeExpressionStatement,
    type SlimeFunctionExpression, type SlimeFunctionParam,
    SlimeIdentifier, type SlimeObjectPattern,
    SlimePattern,
    SlimeRestElement, type SlimeReturnStatement,
    type SlimeStatement, SlimeTokenCreate, SlimeAstTypeName,
    type SlimeArrayPatternElement, type SlimeLBracketToken, type SlimeRBracketToken,
    type SlimeCommaToken, type SlimeLBraceToken, type SlimeRBraceToken,
    type SlimeObjectPatternProperty, type SlimeAssignmentProperty
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptBindingPatternCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeBindingPatternCstToAstSingle extends SlimeJavascriptBindingPatternCstToAstSingle {

}

export const SlimeBindingPatternCstToAst = new SlimeBindingPatternCstToAstSingle()
