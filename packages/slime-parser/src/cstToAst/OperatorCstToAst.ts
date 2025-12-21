import { SubhutiCst } from "subhuti";
import SlimeParser from "../SlimeParser";
import { checkCstName } from "../SlimeCstToAstUtil.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setOperatorCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for OperatorCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 运算符相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class OperatorCstToAst {
    /**
     * MultiplicativeOperator CST 到 AST
     * MultiplicativeOperator -> * | / | %
     */
    static createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '*'
    }

    /**
     * AssignmentOperator CST 到 AST
     * AssignmentOperator -> *= | /= | %= | += | -= | <<= | >>= | >>>= | &= | ^= | |= | **= | &&= | ||= | ??=
     */
    static createAssignmentOperatorAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || '='
    }

    /**
     * ExpressionBody CST 到 AST
     * ExpressionBody -> AssignmentExpression
     */
    static createExpressionBodyAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return getUtil().createAssignmentExpressionAst(firstChild)
        }
        throw new Error('ExpressionBody has no children')
    }
}
