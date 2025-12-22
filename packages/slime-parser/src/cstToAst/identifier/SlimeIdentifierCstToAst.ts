/**
 * IdentifierCstToAst - 标识符相关转换
 */
import {SubhutiCst, type SubhutiSourceLocation} from "subhuti";
import {
    SlimeAstUtil,
    SlimeClassBody, SlimeFunctionParam,
    SlimeIdentifier,
    SlimeMethodDefinition, SlimePattern,
    SlimePropertyDefinition,
    SlimeStatement
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptIdentifierCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeIdentifierCstToAstSingle extends SlimeJavascriptIdentifierCstToAstSingle {

}

export const SlimeIdentifierCstToAst = new SlimeIdentifierCstToAstSingle()
