import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeFunctionParam,
    SlimeModuleDeclaration,
    SlimePattern,
    SlimeProgram,
    SlimeStatement
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptModuleCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeModuleCstToAstSingle extends SlimeJavascriptModuleCstToAstSingle {
}

export const SlimeModuleCstToAst = new SlimeModuleCstToAstSingle()