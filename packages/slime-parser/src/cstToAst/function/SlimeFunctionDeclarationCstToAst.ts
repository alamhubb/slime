import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil, type SlimeBlockStatement, type SlimeClassBody, type SlimeClassDeclaration,
    SlimeClassExpression, type SlimeExpression,
    type SlimeFunctionDeclaration,
    type SlimeFunctionParam,
    SlimeIdentifier, SlimeMethodDefinition, SlimeAstTypeName, SlimeStatement, SlimeTokenCreate
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptFunctionDeclarationCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeFunctionDeclarationCstToAstSingle extends SlimeJavascriptFunctionDeclarationCstToAstSingle{

}

export const SlimeFunctionDeclarationCstToAst = new SlimeFunctionDeclarationCstToAstSingle()