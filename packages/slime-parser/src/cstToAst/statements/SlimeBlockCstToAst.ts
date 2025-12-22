import {SubhutiCst} from "subhuti";

import SlimeParser from "../../SlimeParser.ts";
import {
    SlimeAstUtil, SlimeBlockStatement, type SlimeExportAllDeclaration,
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration, SlimeExpressionStatement,
    SlimeFunctionDeclaration, SlimeFunctionExpression, SlimeAstTypeName, SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "./SlimeVariableCstToAst.ts";
import {SlimeJavascriptBlockCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeBlockCstToAstSingle extends SlimeJavascriptBlockCstToAstSingle {

}

export const SlimeBlockCstToAst = new SlimeBlockCstToAstSingle()