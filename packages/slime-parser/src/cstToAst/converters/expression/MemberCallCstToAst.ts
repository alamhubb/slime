/**
 * MemberCallCstToAst - 成员访问/调用表达式/可选链转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeExpression,
    type SlimeIdentifier,
    SlimeNodeType,
} from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class MemberCallCstToAst {
    /**
     * 创建 OptionalExpression AST（ES2020）
     * 处理可选链语法 ?.
     *
     * OptionalExpression:
     *   MemberExpression OptionalChain
     *   CallExpression OptionalChain
     *   OptionalExpression OptionalChain
     */
    static createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children')
        }

        // 首先处理基础表达式（MemberExpression 或 CallExpression）
        let result = SlimeCstToAstUtil.createExpressionAst(cst.children[0])

        // 处理 OptionalChain（可能有多个链式调用）
        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i]
            if (chainCst.name === 'OptionalChain') {
                result = MemberCallCstToAst.createOptionalChainAst(result, chainCst)
            }
        }

        return result
    }

    /**
     * 创建 OptionalChain AST
     * 处理 ?. 后的各种访问形式
     *
     * 注意：只有紧跟在 ?. 后面的操作是 optional: true
     * 链式的后续操作（如 foo?.().bar() 中的 .bar()）是 optional: false
     */
    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst): SlimeExpression {
        let result = object
        // 追踪是否刚遇到 ?. token，下一个操作是 optional
        let nextIsOptional = false

        for (const child of chainCst.children) {
            const name = child.name

            if (name === 'OptionalChaining' || child.value === '?.') {
                // 遇到 ?. token，下一个操作是 optional
                nextIsOptional = true
                continue
            } else if (name === 'Arguments') {
                // ()调用 - 可能是可选调用或普通调用
                const args = MemberCallCstToAst.createArgumentsAst(child)
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any
                nextIsOptional = false
            } else if (name === 'LBracket' || child.value === '[') {
                // [expr] 计算属性访问 - 可能是可选或普通
                const exprIndex = chainCst.children.indexOf(child) + 1
                if (exprIndex < chainCst.children.length) {
                    const property = SlimeCstToAstUtil.createExpressionAst(chainCst.children[exprIndex])
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
                // .prop 属性访问 - 可能是可选或普通
                let property: SlimeIdentifier
                const tokenCst = child.children[0]
                property = MemberCallCstToAst.createIdentifier(tokenCst.value, tokenCst.loc)
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
                // #prop - 私有属性访问
                const property = SlimeCstToAstUtil.createPrivateIdentifierAst(child)
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

    /**
     * 创建 CoalesceExpression AST（ES2020）
     * 处理 ?? 空值合并运算符
     */
    static createCoalesceExpressionAst(cst: SubhutiCst): SlimeExpression {
        if (cst.children.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        }

        // 有多个子节点，构建左结合的逻辑表达式
        let left = SlimeCstToAstUtil.createExpressionAst(cst.children[0])
        for (let i = 1; i < cst.children.length; i += 2) {
            const right = SlimeCstToAstUtil.createExpressionAst(cst.children[i + 1])
            left = {
                type: SlimeNodeType.LogicalExpression,
                operator: '??',
                left: left,
                right: right
            } as any
        }
        return left
    }

    /**
     * 创建 Arguments AST
     */
    static createArgumentsAst(cst: SubhutiCst): SlimeExpression[] {
        const args: SlimeExpression[] = []
        if (!cst.children) return args

        for (const child of cst.children) {
            if (child.name === 'ArgumentList' || child.name === 'ArgumentListElement') {
                // 递归处理参数列表
                args.push(...MemberCallCstToAst.createArgumentsAst(child))
            } else if (child.name === 'AssignmentExpression' || child.name === 'SpreadElement') {
                args.push(SlimeCstToAstUtil.createExpressionAst(child))
            } else if (child.value === '(' || child.value === ')' || child.value === ',') {
                // 跳过括号和逗号
                continue
            }
        }
        return args
    }

    /**
     * 创建 PrivateIdentifier AST
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): any {
        const name = cst.value || cst.children?.[0]?.value || ''
        return {
            type: 'PrivateIdentifier',
            name: name.startsWith('#') ? name.slice(1) : name,
            loc: cst.loc
        }
    }

    /**
     * 创建 Identifier
     */
    static createIdentifier(name: string, loc?: any): SlimeIdentifier {
        return {
            type: SlimeNodeType.Identifier,
            name: SlimeAstUtils.decodeUnicodeEscapes(name),
            loc: loc
        } as SlimeIdentifier
    }
}
