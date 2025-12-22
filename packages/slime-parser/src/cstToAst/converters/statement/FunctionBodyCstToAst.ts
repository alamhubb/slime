import { SubhutiCst } from "subhuti";
import type { SlimeMethodDefinition } from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export default class FunctionBodyCstToAst {


    static createFunctionStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
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
        if (first.name === 'StatementList' || first.name === SlimeParser.prototype.StatementList?.name) {
            return this.createStatementListAst(first)
        }

        // If child is a statement directly
        return this.createStatementListItemAst(first)
    }


    static createFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
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
        if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
            return this.createFunctionBodyAst(first)
        }

        // Handle FunctionStatementList (ES2025)
        if (name === 'FunctionStatementList' || name === SlimeParser.prototype.FunctionStatementList?.name) {
            return this.createFunctionStatementListAst(first)
        }

        // Handle StatementList (legacy)
        if (name === 'StatementList' || name === SlimeParser.prototype.StatementList?.name) {
            return this.createStatementListAst(first)
        }

        // If the first child is a statement directly, process it
        return this.createStatementListAst(first)
    }

    /**
     * GeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    static createGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }


    /**
     * AsyncFunctionBody CST �?AST（透传�?FunctionBody�?
     */
    static createAsyncFunctionBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }



    /**
     * AsyncGeneratorBody CST �?AST（透传�?FunctionBody�?
     */
    static createAsyncGeneratorBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        return this.createFunctionBodyAst(cst)
    }
}