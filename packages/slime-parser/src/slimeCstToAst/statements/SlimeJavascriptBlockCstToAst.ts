import {SubhutiCst} from "subhuti";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import {
    SlimeJavascriptCreateUtils, SlimeJavascriptBlockStatement, type SlimeJavascriptExportAllDeclaration,
    type SlimeJavascriptExportDefaultDeclaration,
    type SlimeJavascriptExportNamedDeclaration, SlimeJavascriptExpressionStatement,
    SlimeJavascriptFunctionDeclaration, SlimeJavascriptFunctionExpression, SlimeJavascriptAstTypeName, SlimeJavascriptStatement,
    SlimeJavascriptTokenCreateUtils
} from "slime-ast";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "./SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptBlockCstToAstSingle {
    /**
     * 从Block CST创建BlockStatement AST
     * Block: LBrace StatementList? RBrace
     */
    createBlockAst(cst: SubhutiCst): SlimeBlockStatement {
        SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Block?.name)

        // Block 的结构：LBrace StatementList? RBrace
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (cst.children) {
            for (const child of cst.children) {
                if (child.name === 'LBrace' || child.value === '{') {
                    lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(child.loc)
                } else if (child.name === 'RBrace' || child.value === '}') {
                    rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(child.loc)
                }
            }
        }

        const statementListCst = cst.children?.find(
            child => child.name === SlimeJavascriptParser.prototype.StatementList?.name
        )

        const statements = statementListCst ? SlimeCstToAstUtil.createStatementListAst(statementListCst) : []

        return SlimeJavascriptCreateUtils.createBlockStatement(statements, cst.loc, lBraceToken, rBraceToken)
    }


    /**
     * 创建 BlockStatement AST
     * 处理两种情况�?
     * 1. 直接�?StatementList（旧的实现）
     * 2. �?BlockStatement，需要提取内部的 Block -> StatementList
     */
    createBlockStatementAst(cst: SubhutiCst): SlimeBlockStatement {
        let statements: Array<SlimeJavascriptStatement>

        // 如果�?StatementList，直接转�?
        if (cst.name === SlimeJavascriptParser.prototype.StatementList?.name) {
            statements = SlimeCstToAstUtil.createStatementListAst(cst)
        }
        // 如果�?BlockStatement，需要提�?Block -> StatementList
        else if (cst.name === SlimeJavascriptParser.prototype.BlockStatement?.name) {
            // BlockStatement -> Block -> StatementList
            const blockCst = cst.children?.[0]
            if (blockCst && blockCst.name === SlimeJavascriptParser.prototype.Block?.name) {
                // Block 的结构：LBrace StatementList RBrace
                const statementListCst = blockCst.children?.find(
                    child => child.name === SlimeJavascriptParser.prototype.StatementList?.name
                )
                if (statementListCst) {
                    statements = SlimeCstToAstUtil.createStatementListAst(statementListCst)
                } else {
                    statements = []
                }
            } else {
                statements = []
            }
        } else {
            throw new Error(`Expected StatementList or BlockStatement, got ${cst.name}`)
        }

        const ast: SlimeBlockStatement = {
            type: SlimeParser.prototype.BlockStatement?.name as any,
            body: statements,
            loc: cst.loc
        }
        return ast
    }


    createStatementListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.StatementList?.name);
        if (cst.children) {
            const statements = cst.children.map(item => SlimeCstToAstUtil.createStatementListItemAst(item)).flat()
            return statements
        }
        return []
    }


    createStatementAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Statement?.name);
        const statements: SlimeStatement[] = cst.children
            .map(item => SlimeCstToAstUtil.createStatementDeclarationAst(item))
            .filter(stmt => stmt !== undefined)  // 过滤�?undefined
        return statements
    }


    createStatementListItemAst(cst: SubhutiCst): Array<SlimeJavascriptStatement> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.StatementListItem?.name);
        const statements = cst.children.map(item => {
            // 如果�?Declaration，直接处�?
            if (item.name === SlimeJavascriptParser.prototype.Declaration?.name) {
                return [SlimeCstToAstUtil.createDeclarationAst(item) as any]
            }

            // 如果�?Statement，需要特殊处�?FunctionExpression �?ClassExpression
            const statement = SlimeCstToAstUtil.createStatementAst(item)
            const result = statement.flat()

            // 检查是否是命名�?FunctionExpression �?ClassExpression（应该转�?Declaration�?
            return result.map(stmt => {
                if (stmt.type === SlimeAstTypeName.ExpressionStatement) {
                    const expr = (stmt as SlimeJavascriptExpressionStatement).expression

                    // 命名�?FunctionExpression �?FunctionDeclaration
                    if (expr.type === SlimeAstTypeName.FunctionExpression) {
                        const funcExpr = expr as SlimeJavascriptFunctionExpression
                        if (funcExpr.id) {
                            return {
                                type: SlimeAstTypeName.FunctionDeclaration,
                                id: funcExpr.id,
                                params: funcExpr.params,
                                body: funcExpr.body,
                                generator: funcExpr.generator,
                                async: funcExpr.async,
                                loc: funcExpr.loc
                            } as SlimeJavascriptFunctionDeclaration
                        }
                    }

                    // ClassExpression �?ClassDeclaration
                    if (expr.type === SlimeAstTypeName.ClassExpression) {
                        const classExpr = expr as any
                        if (classExpr.id) {
                            return {
                                type: SlimeAstTypeName.ClassDeclaration,
                                id: classExpr.id,
                                superClass: classExpr.superClass,
                                body: classExpr.body,
                                loc: classExpr.loc
                            } as any
                        }
                    }
                }
                return stmt
            })
        }).flat()
        return statements
    }


    /**
     * [核心分发方法] 根据 CST 节点类型创建对应�?Statement/Declaration AST
     *
     * 存在必要性：ECMAScript 语法�?Statement �?Declaration 有多种具体类型，
     * 需要一个统一的分发方法来处理各种语句和声明�?
     *
     * 处理的节点类型包括：
     * - Statement 包装节点 �?递归处理子节�?
     * - BreakableStatement �?IterationStatement | SwitchStatement
     * - VariableStatement �?VariableDeclaration
     * - ExpressionStatement �?ExpressionStatement
     * - IfStatement, ForStatement, WhileStatement 等具体语�?
     * - FunctionDeclaration, ClassDeclaration 等声�?
     */
    createStatementDeclarationAst(cst: SubhutiCst) {
        // Statement - 包装节点，递归处理子节�?
        if (cst.name === SlimeJavascriptParser.prototype.Statement?.name || cst.name === 'Statement') {
            if (cst.children && cst.children.length > 0) {
                return SlimeCstToAstUtil.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // BreakableStatement - 包装节点，递归处理子节�?
        else if (cst.name === SlimeJavascriptParser.prototype.BreakableStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return SlimeCstToAstUtil.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // IterationStatement - 循环语句包装节点
        else if (cst.name === SlimeJavascriptParser.prototype.IterationStatement?.name) {
            if (cst.children && cst.children.length > 0) {
                return SlimeCstToAstUtil.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // IfStatementBody - if/else 语句体包装节点，递归处理子节�?
        else if (cst.name === 'IfStatementBody') {
            if (cst.children && cst.children.length > 0) {
                return SlimeCstToAstUtil.createStatementDeclarationAst(cst.children[0])
            }
            return undefined
        }
        // var 变量声明语句 (ES2025: VariableStatement)
        else if (cst.name === SlimeJavascriptParser.prototype.VariableStatement?.name || cst.name === 'VariableStatement') {
            return SlimeCstToAstUtil.createVariableStatementAst(cst)
        }
        // 变量声明 (用于 for 循环�?
        else if (cst.name === SlimeJavascriptParser.prototype.VariableDeclaration?.name) {
            return SlimeCstToAstUtil.createVariableDeclarationAst(cst)
        }
        // 表达式语�?
        else if (cst.name === SlimeJavascriptParser.prototype.ExpressionStatement?.name) {
            return SlimeCstToAstUtil.createExpressionStatementAst(cst)
        }
        // return 语句
        else if (cst.name === SlimeJavascriptParser.prototype.ReturnStatement?.name) {
            return SlimeCstToAstUtil.createReturnStatementAst(cst)
        }
        // if 语句
        else if (cst.name === SlimeJavascriptParser.prototype.IfStatement?.name) {
            return SlimeCstToAstUtil.createIfStatementAst(cst)
        }
        // for 语句
        else if (cst.name === SlimeJavascriptParser.prototype.ForStatement?.name) {
            return SlimeCstToAstUtil.createForStatementAst(cst)
        }
        // for...in / for...of 语句
        else if (cst.name === SlimeJavascriptParser.prototype.ForInOfStatement?.name) {
            return SlimeCstToAstUtil.createForInOfStatementAst(cst)
        }
        // while 语句
        else if (cst.name === SlimeJavascriptParser.prototype.WhileStatement?.name) {
            return SlimeCstToAstUtil.createWhileStatementAst(cst)
        }
        // do...while 语句
        else if (cst.name === SlimeJavascriptParser.prototype.DoWhileStatement?.name) {
            return SlimeCstToAstUtil.createDoWhileStatementAst(cst)
        }
        // 块语�?
        else if (cst.name === SlimeJavascriptParser.prototype.BlockStatement?.name) {
            return SlimeCstToAstUtil.createBlockStatementAst(cst)
        }
        // switch 语句
        else if (cst.name === SlimeJavascriptParser.prototype.SwitchStatement?.name) {
            return SlimeCstToAstUtil.createSwitchStatementAst(cst)
        }
        // try 语句
        else if (cst.name === SlimeJavascriptParser.prototype.TryStatement?.name) {
            return SlimeCstToAstUtil.createTryStatementAst(cst)
        }
        // throw 语句
        else if (cst.name === SlimeJavascriptParser.prototype.ThrowStatement?.name) {
            return SlimeCstToAstUtil.createThrowStatementAst(cst)
        }
        // break 语句
        else if (cst.name === SlimeJavascriptParser.prototype.BreakStatement?.name) {
            return SlimeCstToAstUtil.createBreakStatementAst(cst)
        }
        // continue 语句
        else if (cst.name === SlimeJavascriptParser.prototype.ContinueStatement?.name) {
            return SlimeCstToAstUtil.createContinueStatementAst(cst)
        }
        // 标签语句
        else if (cst.name === SlimeJavascriptParser.prototype.LabelledStatement?.name) {
            return SlimeCstToAstUtil.createLabelledStatementAst(cst)
        }
        // with 语句
        else if (cst.name === SlimeJavascriptParser.prototype.WithStatement?.name) {
            return SlimeCstToAstUtil.createWithStatementAst(cst)
        }
        // debugger 语句
        else if (cst.name === SlimeJavascriptParser.prototype.DebuggerStatement?.name) {
            return SlimeCstToAstUtil.createDebuggerStatementAst(cst)
        }
        // 空语�?
        else if (cst.name === SlimeJavascriptParser.prototype.EmptyStatement?.name) {
            return SlimeCstToAstUtil.createEmptyStatementAst(cst)
        }
        // 函数声明
        else if (cst.name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name) {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(cst)
        }
        // 类声�?
        else if (cst.name === SlimeJavascriptParser.prototype.ClassDeclaration?.name) {
            return SlimeCstToAstUtil.createClassDeclarationAst(cst)
        }
    }

}

export const SlimeJavascriptBlockCstToAst = new SlimeJavascriptBlockCstToAstSingle()
