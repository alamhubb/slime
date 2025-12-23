import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeBlockStatement, SlimeExpressionStatement,
    SlimeFunctionDeclaration,
    SlimeFunctionParam,
    SlimeIdentifier,
    SlimeAstTypeName, type SlimePattern, SlimeReturnStatement, SlimeTokenCreateUtils, type SlimeVariableDeclarator
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "./SlimeVariableCstToAst.ts";
import {SlimeJavascriptOtherStatementCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

/**
 * OtherStatementCstToAst - try/switch/break/continue/label 等转换
 */
export class SlimeOtherStatementCstToAstSingle extends SlimeJavascriptOtherStatementCstToAstSingle {
}

export const SlimeOtherStatementCstToAst = new SlimeOtherStatementCstToAstSingle()