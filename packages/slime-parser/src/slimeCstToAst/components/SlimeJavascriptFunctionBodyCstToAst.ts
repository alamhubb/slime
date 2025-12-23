import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptExpression,
    SlimeJavascriptMethodDefinition,
    SlimeJavascriptStatement,
    SlimeBlockStatement
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptFunctionBodyCstToAstSingle {

    createFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        // FunctionBody: FunctionStatementList | StatementList
        // GeneratorBody, AsyncFunctionBody, AsyncGeneratorBody 都包�?FunctionBody
        const children = cst.children || []

        if (children.length === 0) {
            return []
        }

        const first = children[0]
        if (!first) {
            return []
        }

        const name = first.name

        // Handle nested FunctionBody (from GeneratorBody, AsyncFunctionBody, AsyncGeneratorBody)
        if (name === 'FunctionBody' || name === SlimeJavascriptParser.prototype.FunctionBody?.name) {
            return SlimeCstToAstUtil.createFunctionBodyAst(first)
        }

        // Handle FunctionStatementList (ES2025)
        if (name === 'FunctionStatementList' || name === SlimeJavascriptParser.prototype.FunctionStatementList?.name) {
            return SlimeCstToAstUtil.createFunctionStatementListAst(first)
        }

        // Handle StatementList (legacy)
        if (name === 'StatementList' || name === SlimeJavascriptParser.prototype.StatementList?.name) {
            return SlimeCstToAstUtil.createStatementListAst(first)
        }

        // If the first child is a statement directly, process it
        return SlimeCstToAstUtil.createStatementListAst(first)
    }

    /**
     * GeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeCstToAstUtil.createFunctionBodyAst(cst)
    }


    /**
     * AsyncFunctionBody CST �?AST（透传�?FunctionBody�?
     */
    createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeCstToAstUtil.createFunctionBodyAst(cst)
    }


    /**
     * AsyncGeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        return SlimeCstToAstUtil.createFunctionBodyAst(cst)
    }


    /**
     * 创建箭头函数�?AST
     */
    createConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeJavascriptExpression {
        // 防御性检�?
        if (!cst) {
            throw new Error('createConciseBodyAst: cst is null or undefined')
        }

        // 支持 ConciseBody �?AsyncConciseBody
        const validNames = [
            SlimeJavascriptParser.prototype.ConciseBody?.name,
            'ConciseBody',
            'AsyncConciseBody'
        ]
        if (!validNames.includes(cst.name)) {
            throw new Error(`createConciseBodyAst: 期望 ConciseBody �?AsyncConciseBody，实�?${cst.name}`)
        }

        const first = cst.children[0]

        // Es2025Parser: { FunctionBody } 格式
        // children: [LBrace, FunctionBody/AsyncFunctionBody, RBrace]
        if (first.name === 'LBrace') {
            // 找到 FunctionBody �?AsyncFunctionBody
            const functionBodyCst = cst.children.find(child =>
                child.name === 'FunctionBody' || child.name === SlimeJavascriptParser.prototype.FunctionBody?.name ||
                child.name === 'AsyncFunctionBody' || child.name === SlimeJavascriptParser.prototype.AsyncFunctionBody?.name
            )
            if (functionBodyCst) {
                const bodyStatements = SlimeCstToAstUtil.createFunctionBodyAst(functionBodyCst)
                return SlimeJavascriptCreateUtils.createBlockStatement(bodyStatements, cst.loc)
            }
            // 空函数体
            return SlimeJavascriptCreateUtils.createBlockStatement([], cst.loc)
        }

        // 否则是表达式，解析为表达�?
        if (first.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name || first.name === 'AssignmentExpression') {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first)
        }

        // Es2025Parser: ExpressionBody 类型
        if (first.name === 'ExpressionBody') {
            // ExpressionBody 内部包含 AssignmentExpression
            const innerExpr = first.children[0]
            if (innerExpr) {
                if (innerExpr.name === 'AssignmentExpression' || innerExpr.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                    return SlimeCstToAstUtil.createAssignmentExpressionAst(innerExpr)
                }
                return SlimeCstToAstUtil.createExpressionAst(innerExpr)
            }
        }

        return SlimeCstToAstUtil.createExpressionAst(first)
    }


    /**
     * AsyncConciseBody CST �?AST
     */
    createAsyncConciseBodyAst(cst: SubhutiCst): SlimeBlockStatement | SlimeJavascriptExpression {
        return SlimeCstToAstUtil.createConciseBodyAst(cst)
    }

    createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        // FunctionStatementList: StatementList?
        const children = cst.children || []

        if (children.length === 0) {
            return []
        }

        const first = children[0]
        if (!first) {
            return []
        }

        // If child is StatementList, process it
        if (first.name === 'StatementList' || first.name === SlimeJavascriptParser.prototype.StatementList?.name) {
            return SlimeCstToAstUtil.createStatementListAst(first)
        }

        // If child is a statement directly
        return SlimeCstToAstUtil.createStatementListItemAst(first)
    }
}


export const SlimeJavascriptFunctionBodyCstToAst = new SlimeJavascriptFunctionBodyCstToAstSingle()
