import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstUtil,
    type SlimeJavascriptBlockStatement,
    SlimeJavascriptFunctionExpression, type SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, type SlimeJavascriptMethodDefinition, SlimeJavascriptAstTypeName,
    SlimeJavascriptPattern, SlimeJavascriptRestElement, type SlimeJavascriptReturnStatement,
    SlimeJavascriptStatement, SlimeJavascriptTokenCreate,
    SlimeJavascriptVariableDeclarator
} from "slime-ast";
import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";

import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";

export class SlimeJavascriptFunctionParameterCstToAstSingle {

    /**
     * 处理 FormalParameters CST 节点
     */
    createFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        // FormalParameters 可能包含 FormalParameterList 或为�?
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimeJavascriptPattern[] = []

        for (const child of cst.children) {
            const name = child.name

            // FormalParameterList
            if (name === SlimeJavascriptParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return SlimeJavascriptCstToAstUtil.createFormalParameterListAst(child)
            }

            // FormalParameter
            if (name === SlimeJavascriptParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(SlimeJavascriptCstToAstUtil.createFormalParameterAst(child))
                continue
            }

            // BindingIdentifier - 直接作为参数
            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child))
                continue
            }

            // BindingElement
            if (name === SlimeJavascriptParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(SlimeJavascriptCstToAstUtil.createBindingElementAst(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeJavascriptParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(SlimeJavascriptCstToAstUtil.createFunctionRestParameterAst(child))
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
    createFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        const children = cst.children || []
        const params: SlimeJavascriptFunctionParam[] = []

        let currentParam: SlimeJavascriptPattern | null = null
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
                    const commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameterList：包�?FormalParameter (多个以逗号分隔)
            if (name === SlimeJavascriptParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                // 如果之前有参数没处理，先推入
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...SlimeJavascriptCstToAstUtil.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            // FunctionRestParameter
            if (name === SlimeJavascriptParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = SlimeJavascriptCstToAstUtil.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            // Direct FormalParameter（ES2025 结构�?
            if (name === SlimeJavascriptParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = SlimeJavascriptCstToAstUtil.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            // Direct BindingElement or BindingIdentifier
            if (name === SlimeJavascriptParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = SlimeJavascriptCstToAstUtil.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        // 处理最后一个参数（没有尾随逗号�?
        if (hasParam) {
            params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }


    createFormalParameterListAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.FormalParameterList?.name);

        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimeJavascriptPattern[] = []

        for (const child of cst.children) {
            const name = child.name

            // FunctionRestParameter - rest参数
            if (name === 'FunctionRestParameter' || name === SlimeJavascriptParser.prototype.FunctionRestParameter?.name) {
                params.push(SlimeJavascriptCstToAstUtil.createFunctionRestParameterAst(child))
                continue
            }

            // FormalParameter - 直接的参数
            if (name === 'FormalParameter' || name === SlimeJavascriptParser.prototype.FormalParameter?.name) {
                params.push(SlimeJavascriptCstToAstUtil.createFormalParameterAst(child))
                continue
            }

            // BindingElement
            if (name === 'BindingElement' || name === SlimeJavascriptParser.prototype.BindingElement?.name) {
                params.push(SlimeJavascriptCstToAstUtil.createBindingElementAst(child))
                continue
            }

            // BindingIdentifier
            if (name === 'BindingIdentifier' || name === SlimeJavascriptParser.prototype.BindingIdentifier?.name) {
                params.push(SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child))
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
    createFormalParameterListAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        const params: SlimeJavascriptFunctionParam[] = []
        let lastParam: SlimeJavascriptPattern | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.FormalParameter?.name) {
                if (lastParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(lastParam))
                }
                lastParam = SlimeJavascriptCstToAstUtil.createFormalParameterAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.FunctionRestParameter?.name) {
                if (lastParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(lastParam))
                }
                lastParam = SlimeJavascriptCstToAstUtil.createFunctionRestParameterAst(child)
            } else if (child.name === SlimeJavascriptTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(lastParam, SlimeJavascriptTokenCreate.createCommaToken(child.loc)))
                    lastParam = null
                }
            }
        }

        if (lastParam) {
            params.push(SlimeJavascriptAstUtil.createFunctionParam(lastParam))
        }

        return params
    }


    /**
     * �?ES2025 FormalParameterList 创建参数 AST（包装类型）
     * FormalParameterList: FormalParameter (, FormalParameter)*
     */
    createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        const children = cst.children || []
        const params: SlimeJavascriptFunctionParam[] = []

        let currentParam: SlimeJavascriptPattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            // Handle comma - pair with previous param
            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            // FormalParameter -> BindingElement
            if (name === SlimeJavascriptParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = SlimeJavascriptCstToAstUtil.createFormalParameterAst(child)
                hasParam = true
            }
        }

        // 处理最后一个参�?
        if (hasParam) {
            params.push(SlimeJavascriptAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }


    createFormalParameterAst(cst: SubhutiCst): SlimeJavascriptPattern {
        // FormalParameter: BindingElement
        const first = cst.children[0]
        if (first.name === 'BindingElement' || first.name === SlimeJavascriptParser.prototype.BindingElement?.name) {
            return SlimeJavascriptCstToAstUtil.createBindingElementAst(first)
        }
        return SlimeJavascriptCstToAstUtil.createBindingElementAst(cst)
    }

    createFunctionRestParameterAst(cst: SubhutiCst): SlimeJavascriptRestElement {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.FunctionRestParameter?.name);
        const first = cst.children[0]
        return SlimeJavascriptCstToAstUtil.createBindingRestElementAst(first)
    }


    createFunctionRestParameterAstAlt(cst: SubhutiCst): SlimeJavascriptRestElement {
        // FunctionRestParameter: ... BindingIdentifier | ... BindingPattern
        // 或�?FunctionRestParameter -> BindingRestElement
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                // BindingRestElement 已经包含�?RestElement 的完整结构，直接返回
                return SlimeJavascriptCstToAstUtil.createBindingRestElementAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = SlimeJavascriptCstToAstUtil.createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }


    /**
     * 处理 UniqueFormalParameters CST 节点
     */
    createUniqueFormalParametersAst(cst: SubhutiCst): SlimeJavascriptPattern[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
            return SlimeJavascriptCstToAstUtil.createFormalParametersAst(first)
        }
        // 可能直接�?FormalParameterList
        return SlimeJavascriptCstToAstUtil.createFormalParametersAst(cst)
    }

    /** 返回包装类型的版�?*/
    createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeJavascriptFunctionParam[] {
        // UniqueFormalParameters: FormalParameters
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameters' || first.name === SlimeJavascriptParser.prototype.FormalParameters?.name) {
            return SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(first)
        }
        // 可能直接�?FormalParameterList
        return SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(cst)
    }


    /**
     * 从Expression中提取箭头函数参�?
     * 处理逗号表达�?(a, b) 或单个参�?(x)
     */
    extractParametersFromExpression(expressionCst: SubhutiCst): SlimeJavascriptPattern[] {
        // Expression可能是：
        // 1. 单个Identifier: x
        // 2. 逗号表达�? a, b �?a, b, c
        // 3. 赋值表达式（默认参数）: a = 1

        // 检查是否是AssignmentExpression
        if (expressionCst.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(expressionCst)
            // 如果是简单的identifier，返回它
            if (assignmentAst.type === SlimeJavascriptAstTypeName.Identifier) {
                return [assignmentAst as any]
            }
            // 如果是赋值（默认参数），返回AssignmentPattern
            if (assignmentAst.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        // 如果是Expression，检查children
        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimeJavascriptPattern[] = []

            // 遍历children，查找所有AssignmentExpression（用逗号分隔�?
            for (const child of expressionCst.children) {
                if (child.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(child)
                    // 转换为参�?
                    if (assignmentAst.type === SlimeJavascriptAstTypeName.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeJavascriptAstTypeName.AssignmentExpression) {
                        // 默认参数
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeJavascriptAstTypeName.ObjectExpression) {
                        // 对象解构参数�?{ a, b }) => ...
                        // 需要将 ObjectExpression 转换�?ObjectPattern
                        params.push(SlimeJavascriptCstToAstUtil.convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeJavascriptAstTypeName.ArrayExpression) {
                        // 数组解构参数�?[a, b]) => ...
                        // 需要将 ArrayExpression 转换�?ArrayPattern
                        params.push(SlimeJavascriptCstToAstUtil.convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        // 其他复杂情况，尝试提取identifier
                        const identifier = SlimeJavascriptCstToAstUtil.findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(SlimeJavascriptCstToAstUtil.createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        // 回退：尝试查找第一个identifier
        const identifierCst = SlimeJavascriptCstToAstUtil.findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [SlimeJavascriptCstToAstUtil.createIdentifierAst(identifierCst) as any]
        }

        return []
    }
}

export const SlimeJavascriptFunctionParameterCstToAst = new SlimeJavascriptFunctionParameterCstToAstSingle()