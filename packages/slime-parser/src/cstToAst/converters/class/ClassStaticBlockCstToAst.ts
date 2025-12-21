import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    type SlimeBlockStatement,
    type SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { getUtil } from "../core/CstToAstContext";

/**
 * 类静态块相关的 CST to AST 转换 (ES2022)
 * 处理 ClassStaticBlock, ClassStaticBlockBody
 */
export class ClassStaticBlockCstToAst {
    /**
     * 创建 ClassStaticBlock AST
     * ClassStaticBlock: static { ClassStaticBlockBody }
     */
    static createClassStaticBlockAst(cst: SubhutiCst): any {
        let lBraceToken: any = undefined;
        let rBraceToken: any = undefined;
        let bodyStatements: SlimeStatement[] = [];

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc);
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc);
            } else if (child.name === 'ClassStaticBlockBody') {
                const stmtListCst = child.children?.find((c: any) =>
                    c.name === 'ClassStaticBlockStatementList' || c.name === 'StatementList'
                );
                if (stmtListCst) {
                    const actualStatementList = stmtListCst.name === 'ClassStaticBlockStatementList'
                        ? stmtListCst.children?.find((c: any) => c.name === 'StatementList')
                        : stmtListCst;
                    if (actualStatementList) {
                        bodyStatements = getUtil().createStatementListAst(actualStatementList);
                    }
                }
            }
        }

        return SlimeAstUtil.createStaticBlock(bodyStatements, cst.loc, lBraceToken, rBraceToken);
    }

    /**
     * ClassStaticBlockBody CST 到 AST
     */
    static createClassStaticBlockBodyAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'ClassStaticBlockStatementList' ||
            ch.name === SlimeParser.prototype.ClassStaticBlockStatementList?.name
        );
        if (stmtList) {
            return ClassStaticBlockCstToAst.createClassStaticBlockStatementListAst(stmtList);
        }
        return [];
    }

    /**
     * ClassStaticBlockStatementList CST 到 AST
     */
    static createClassStaticBlockStatementListAst(cst: SubhutiCst): Array<SlimeStatement> {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        );
        if (stmtList) {
            return getUtil().createStatementListAst(stmtList);
        }
        return [];
    }
}
