/**
 * ImportCstToAst - import 相关转换
 */
import {SubhutiCst} from "subhuti";
import {SlimeIdentifier, SlimePattern, SlimeTokenCreate, SlimeVariableDeclarator} from "slime-ast";
import SlimeParser from "../../../SlimeParser.ts";

export class ImportCstToAst {



    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ImportCall?.name);
        // ImportCall -> ImportTok + LParen + AssignmentExpression + (Comma + AssignmentExpression)? + Comma? + RParen
        // children: [ImportTok, LParen, AssignmentExpression, (Comma, AssignmentExpression)?, Comma?, RParen]

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = this.createAssignmentExpressionAst(child)
                args.push(SlimeAstUtil.createCallArgument(expr))
            }
        }

        // 创建 import 标识符作�?callee
        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression
    }


}
