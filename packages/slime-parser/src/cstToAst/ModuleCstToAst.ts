import {
    type SlimeProgram,
    type SlimeStatement,
    type SlimeModuleDeclaration,
    type SlimeImportDeclaration,
    type SlimeImportSpecifier,
    type SlimeImportDefaultSpecifier,
    type SlimeImportNamespaceSpecifier,
    type SlimeImportSpecifierItem,
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration,
    type SlimeExportAllDeclaration,
    type SlimeExportSpecifier,
    type SlimeExportSpecifierItem,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeStringLiteral,
    type SlimeExpression,
    type SlimeDeclaration,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";


/**
 * 模块相关的 CST to AST 转换
 */
export class ModuleCstToAst {
}
