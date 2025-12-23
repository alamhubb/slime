/**
 * ExportCstToAst - export 相关转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeExportAllDeclaration,
    SlimeExportDefaultDeclaration,
    SlimeExportNamedDeclaration, SlimeExportSpecifier, SlimeExportSpecifierItem, SlimeFunctionParam, SlimeIdentifier,
    SlimeLiteral,
    SlimeModuleDeclaration, SlimePattern,
    SlimeStatement, SlimeTokenCreateUtils
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptExportCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeExportCstToAstSingle extends SlimeJavascriptExportCstToAstSingle {

}

export const SlimeExportCstToAst = new SlimeExportCstToAstSingle()
