/**
 * ImportCstToAst - import 相关转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil, SlimeCallArgument, SlimeExpression,
    SlimeIdentifier, type SlimeImportDeclaration, SlimeImportDefaultSpecifier, SlimeImportNamespaceSpecifier,
    SlimeImportSpecifier, SlimeImportSpecifierItem, SlimeLiteral,
    type SlimeModuleDeclaration, SlimeAstTypeName, SlimePattern, type SlimeStatement,
    SlimeStringLiteral, SlimeTokenCreate, SlimeVariableDeclarator
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";
import {SlimeJavascriptImportCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeImportCstToAstSingle extends SlimeJavascriptImportCstToAstSingle {
}

export const SlimeImportCstToAst = new SlimeImportCstToAstSingle()
