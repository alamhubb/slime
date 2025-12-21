import {
    type SlimeProperty,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimePattern,
    type SlimeNumericLiteral,
    type SlimeStringLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createNumericLiteralAst(cst: SubhutiCst): SlimeNumericLiteral;
    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral;
    createMethodDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): any;
    createFormalParameterAst(cst: SubhutiCst): SlimePattern;
    createBindingElementAst(cst: SubhutiCst): SlimePattern;
};

/**
 * 对象属性相关的 CST to AST 转换
 */
export class PropertyCstToAst {
}
