/**
 * ArrowFunctionCstToAst - 箭头函数转换
 */
import {
    type SlimeBlockStatement,
    type SlimeExpression,
    type SlimePattern,
    SlimeAstUtil,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class ArrowFunctionCstToAst {
    /**
     * 创建箭头函数参数 AST
     */
    static createArrowParametersAst(cst: SubhutiCst): SlimePattern[] {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArrowParameters?.name);

        if (cst.children.length === 0) {
            return [];
        }

        const first = cst.children[0];

        // 单个参数：BindingIdentifier
        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            const param = SlimeCstToAstUtil.createBindingIdentifierAst(first);
            return [param];
        }

        // CoverParenthesizedExpressionAndArrowParameterList: 括号参数
        if (first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {
            return SlimeCstToAstUtil.createArrowParametersFromCoverGrammar(first);
        }

        // 参数列表：( FormalParameterList )
        if (first.name === SlimeTokenConsumer.prototype.LParen?.name) {
            const formalParameterListCst = cst.children.find(
                child => child.name === SlimeParser.prototype.FormalParameterList?.name
            );
            if (formalParameterListCst) {
                return SlimeCstToAstUtil.createFormalParameterListAst(formalParameterListCst);
            }
            return [];
        }

        return [];
    }

    /**
     * 创建箭头函数体 AST
     */
    static createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeExpression {
        if (!cst) {
            throw new Error('createConciseBodyAst: cst is null or undefined');
        }

        const validNames = [
            SlimeParser.prototype.ConciseBody?.name,
            'ConciseBody',
            'AsyncConciseBody'
        ];
        if (!validNames.includes(cst.name)) {
            throw new Error(`createConciseBodyAst: 期望 ConciseBody 或 AsyncConciseBody，实际 ${cst.name}`);
        }

        const first = cst.children[0];

        // Es2025Parser: { FunctionBody } 格式
        if (first.name === 'LBrace') {
            const functionBodyCst = cst.children.find(child =>
                child.name === 'FunctionBody' || child.name === SlimeParser.prototype.FunctionBody?.name ||
                child.name === 'AsyncFunctionBody' || child.name === SlimeParser.prototype.AsyncFunctionBody?.name
            );
            if (functionBodyCst) {
                const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(functionBodyCst);
                return SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc);
            }
            return SlimeAstUtil.createBlockStatement([], cst.loc);
        }

        // 否则是表达式
        if (first.name === SlimeParser.prototype.AssignmentExpression?.name || first.name === 'AssignmentExpression') {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first);
        }

        // Es2025Parser: ExpressionBody 类型
        if (first.name === 'ExpressionBody') {
            const innerExpr = first.children[0];
            if (innerExpr) {
                if (innerExpr.name === 'AssignmentExpression' || innerExpr.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    return SlimeCstToAstUtil.createAssignmentExpressionAst(innerExpr);
                }
                return SlimeCstToAstUtil.createExpressionAst(innerExpr);
            }
        }

        return SlimeCstToAstUtil.createExpressionAst(first);
    }
}
