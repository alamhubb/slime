import {
    SlimeAstUtil,
    SlimeExpression,
    type SlimeFunctionExpression,
    type SlimeIdentifier,
    SlimeNodeType
} from "slime-ast";
import {SubhutiCst} from "subhuti";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export default class OptionalExpressionCstToAst{

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     *
     * 注意：只有紧跟在 ?. 后面的操作是 optional: true
     * 链式的后续操作（�?foo?.().bar() 中的 .bar()）是 optional: false
     */
    createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        // 追踪是否刚遇�??. token，下一个操作是 optional
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                // 遇到 ?. token，下一个操作是 optional
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                // ()调用 - 可能是可选调用或普通调�?
                const args = this.createArgumentsAst(child)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                // [expr] 计算属性访�?- 可能是可选或普�?
                // 下一个子节点是表达式，跳�?]
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = this.createExpressionAst(chainCst.children[exprIndex])
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
                // .prop 属性访�?- 可能是可选或普�?
                let property: SlimeIdentifier
                // IdentifierName 内部包含一�?Identifier 或关键字 token
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
                // 普�?. token 不改�?optional 状�?
                continue
            } else if (name === 'RBracket' || child.value === ']') {
                // 跳过 ] token
                continue
            } else if (name === 'PrivateIdentifier') {
                // #prop - 私有属性访�?
                const property = this.createPrivateIdentifierAst(child)
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
                // 计算属性的表达式部分，已在 LBracket 处理中处�?
                continue
            }
        }

        return result
    }


    /**
     * 创建 OptionalExpression AST（ES2020�?
     * 处理可选链语法 ?.
     *
     * OptionalExpression:
     *   MemberExpression OptionalChain
     *   CallExpression OptionalChain
     *   OptionalExpression OptionalChain
     */
    createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        // OptionalExpression 结构�?
        // children[0] = MemberExpression | CallExpression
        // children[1...n] = OptionalChain

        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式（MemberExpression �?CallExpression�?
        let result = this.createExpressionAst(cst.children[0])

        // 处理 OptionalChain（可能有多个链式调用�?
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = this.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

}