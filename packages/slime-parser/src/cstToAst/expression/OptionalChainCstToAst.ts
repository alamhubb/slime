import {
    type SlimeExpression,
    type SlimeIdentifier,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";

import { getUtil } from "../core/CstToAstContext";

// 前向声明，用于调用 ExpressionCstToAst 的方法
function createExpressionAst(cst: SubhutiCst): SlimeExpression {
    return getUtil().createExpressionAst(cst);
}

/**
 * 可选链相关的 CST to AST 转换
 * 处理 ?. 可选链操作符
 */
export class OptionalChainCstToAst {

    /**
     * 创建 OptionalExpression AST
     */
    static createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        let result = createExpressionAst(cst.children[0])

        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = OptionalChainCstToAst.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     */
    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                const args = getUtil().createArgumentsAst(child)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = createExpressionAst(chainCst.children[exprIndex])
                    result = {
                        type: SlimeNodeType.OptionalMemberExpression,
                        object: result,
                        property: property,
                        computed: true,
                        optional: nextIsOptional,
                        loc: chainCst.loc
                    } as any
                    nextIsOptional = false
                }
            } else if (name === 'IdentifierName') {
                let property: SlimeIdentifier
                const tokenCst = child.children[0]
                property = SlimeAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Dot' || child.value === '.') {
                continue
            } else if (name === 'RBracket' || child.value === ']') {
                continue
            } else if (name === 'PrivateIdentifier') {
                const property = getUtil().createPrivateIdentifierAst(child)
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'Expression') {
                continue
            }
        }

        return result
    }
}
