import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    type SlimeBlockStatement,
    SlimeFunctionExpression, type SlimeFunctionParam,
    SlimeIdentifier, type SlimeMethodDefinition, SlimeNodeType,
    SlimePattern, SlimeRestElement, type SlimeReturnStatement,
    SlimeStatement, SlimeTokenCreate,
    SlimeVariableDeclarator
} from "slime-ast";
import SlimeParser from "../../../SlimeParser.ts";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";

export default class FunctionParameterCstToAst{

    createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.BindingRestElement?.name);
        // BindingRestElement: ... BindingIdentifier | ... BindingPattern
        const argumentCst = cst.children[1]

        let argument: SlimeIdentifier | SlimePattern

        if (argumentCst.name === SlimeParser.prototype.BindingIdentifier?.name) {
            // 简单情况：...rest
            argument = this.createBindingIdentifierAst(argumentCst)
        } else if (argumentCst.name === SlimeParser.prototype.BindingPattern?.name) {
            // 嵌套解构�?..[a, b] �?...{x, y}
            argument = this.createBindingPatternAst(argumentCst)
        } else {
            throw new Error(`BindingRestElement: 不支持的类型 ${argumentCst.name}`)
        }

        return SlimeAstUtil.createRestElement(argument)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.FunctionRestParameter?.name);
        const first = cst.children[0]
        return this.createBindingRestElementAst(first)
    }


    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeRestElement {
        // FunctionRestParameter: ... BindingIdentifier | ... BindingPattern
        // 或�?FunctionRestParameter -> BindingRestElement
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = this.createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                // BindingRestElement 已经包含�?RestElement 的完整结构，直接返回
                return this.createBindingRestElementAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = this.createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        // FormalParameter: BindingElement
        const first = cst.children[0]
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return this.createBindingElementAst(first)
        }
        return this.createBindingElementAst(cst)
    }

    createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.FormalParameterList?.name);

        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            // FunctionRestParameter - rest参数
            if (name === 'FunctionRestParameter' || name === SlimeParser.prototype.FunctionRestParameter?.name) {
                params.push(this.createFunctionRestParameterAst(child))
                continue
            }

            // FormalParameter - 直接的参数
            if (name === 'FormalParameter' || name === SlimeParser.prototype.FormalParameter?.name) {
                params.push(this.createFormalParameterAst(child))
                continue
            }

            // BindingElement
            if (name === 'BindingElement' || name === SlimeParser.prototype.BindingElement?.name) {
                params.push(this.createBindingElementAst(child))
                continue
            }

            // BindingIdentifier
            if (name === 'BindingIdentifier' || name === SlimeParser.prototype.BindingIdentifier?.name) {
                params.push(this.createBindingIdentifierAst(child))
                continue
            }

            // 跳过逗号
            if (child.value === ',') {
                continue
            }
        }

        return params
    }

    /**
     * 创建 FormalParameterList AST (包装版本)
     */
    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const params: SlimeFunctionParam[] = []
        let lastParam: SlimePattern | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.FormalParameter?.name) {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam))
                }
                lastParam = this.createFormalParameterAst(child)
            } else if (child.name === SlimeParser.prototype.FunctionRestParameter?.name) {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam))
                }
                lastParam = this.createFunctionRestParameterAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastParam) {
                    params.push(SlimeAstUtil.createFunctionParam(lastParam, SlimeTokenCreate.createCommaToken(child.loc)))
                    lastParam = null
                }
            }
        }

        if (lastParam) {
            params.push(SlimeAstUtil.createFunctionParam(lastParam))
        }

        return params
    }

    /**
     * 处理 FormalParameters CST 节点
     */
    createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // FormalParameters 可能包含 FormalParameterList 或为�?
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            // FormalParameterList
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return this.createFormalParameterListAst(child)
            }

            // FormalParameter
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(this.createFormalParameterAst(child))
                continue
            }

            // BindingIdentifier - 直接作为参数
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(this.createBindingIdentifierAst(child))
                continue
            }

            // BindingElement
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(this.createBindingElementAst(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(this.createFunctionRestParameterAst(child))
                continue
            }

            // 跳过逗号和括�?
            if (child.value === ',' || child.value === '(' || child.value === ')') {
                continue
            }
        }

        return params
    }


    /**
     * Create FormalParameters AST
     * ES2025 FormalParameters:
     *   [empty]
     *   FunctionRestParameter
     *   FormalParameterList
     *   FormalParameterList ,
     *   FormalParameterList , FunctionRestParameter
     */
    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name

            // Skip parentheses
            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameterList：包�?FormalParameter (多个以逗号分隔)
            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                // 如果之前有参数没处理，先推入
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...this.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            // Direct FormalParameter（ES2025 结构�?
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            // Direct BindingElement or BindingIdentifier
            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        // 处理最后一个参数（没有尾随逗号�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }



    /**
     * �?ES2025 FormalParameterList 创建参数 AST（包装类型）
     * FormalParameterList: FormalParameter (, FormalParameter)*
     */
    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameter -> BindingElement
            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = this.createFormalParameterAst(child)
                hasParam = true
            }
        }

        // 处理最后一个参�?
        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 处理 UniqueFormalParameters CST 节点
     */
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeParser.prototype.FormalParameters?.name) {
            return this.createFormalParametersAst(first)
        }
        // 可能直接�?FormalParameterList
        return this.createFormalParametersAst(cst)
    }

    /** 返回包装类型的版�?*/
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeParser.prototype.FormalParameters?.name) {
            return this.createFormalParametersAstWrapped(first)
        }
        // 可能直接�?FormalParameterList
        return this.createFormalParametersAstWrapped(cst)
    }
}