import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    type SlimeBlockStatement,
    SlimeFunctionExpression, type SlimeFunctionParam,
    SlimeIdentifier, type SlimeMethodDefinition, SlimeAstTypeName,
    SlimePattern, SlimeRestElement, type SlimeReturnStatement,
    SlimeStatement, SlimeTokenCreate,
    SlimeVariableDeclarator
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeJavascriptFunctionParameterCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeFunctionParameterCstToAstSingle extends SlimeJavascriptFunctionParameterCstToAstSingle{

}

export const SlimeFunctionParameterCstToAst = new SlimeFunctionParameterCstToAstSingle()