import {
    type SlimePattern,
    type SlimeRestElement,
    type SlimeFunctionParam,
    type SlimeIdentifier,
    type SlimeCallArgument,
    type SlimeExpression,
    type SlimeSpreadElement,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setParameterCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for ParameterCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 参数相关的 CST to AST 转换
 */
export class ParameterCstToAst {

    /**
     * 从 ArrowFormalParameters 提取参数
     */
    static createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return ParameterCstToAst.createUniqueFormalParametersAst(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return ParameterCstToAst.createFormalParametersAst(child)
            }
        }

        return params
    }

    /**
     * 从 ArrowFormalParameters 提取参数 (包装类型版本)
     */
    static createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return ParameterCstToAst.createUniqueFormalParametersAstWrapped(child)
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return ParameterCstToAst.createFormalParametersAstWrapped(child)
            }
        }

        return []
    }

    /**
     * Create FormalParameters AST (包装类型)
     */
    static createFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name

            if (child.value === '(' || name === 'LParen') continue
            if (child.value === ')' || name === 'RParen') continue

            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                    hasParam = false
                    currentParam = null
                }
                params.push(...ParameterCstToAst.createFormalParameterListFromEs2025Wrapped(child))
                continue
            }

            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = ParameterCstToAst.createFunctionRestParameterAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = ParameterCstToAst.createFormalParameterAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = ParameterCstToAst.createBindingElementAst(child)
                hasParam = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = getUtil().createBindingIdentifierAst(child)
                hasParam = true
                continue
            }
        }

        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 从 ES2025 FormalParameterList 创建参数 AST（包装类型）
     */
    static createFormalParameterListFromEs2025Wrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const children = cst.children || []
        const params: SlimeFunctionParam[] = []

        let currentParam: SlimePattern | null = null
        let hasParam = false

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue
            const name = child.name

            if (child.value === ',' || name === 'Comma') {
                if (hasParam) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, commaToken))
                    hasParam = false
                    currentParam = null
                }
                continue
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                if (hasParam) {
                    params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
                }
                currentParam = ParameterCstToAst.createFormalParameterAst(child)
                hasParam = true
            }
        }

        if (hasParam) {
            params.push(SlimeAstUtil.createFunctionParam(currentParam!, undefined))
        }

        return params
    }

    /**
     * 创建 FunctionRestParameter AST
     */
    static createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = getUtil().createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingRestElement?.name || child.name === 'BindingRestElement') {
                return ParameterCstToAst.createBindingRestElementAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = getUtil().createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 BindingRestElement AST
     */
    static createBindingRestElementAst(cst: SubhutiCst): SlimeRestElement {
        const children = cst.children || []
        let argument: any = null

        for (const child of children) {
            if (!child) continue
            if (child.value === '...' || child.name === 'Ellipsis') continue

            if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                argument = getUtil().createBindingIdentifierAst(child)
            } else if (child.name === SlimeParser.prototype.BindingPattern?.name || child.name === 'BindingPattern') {
                argument = getUtil().createBindingPatternAst(child)
            }
        }

        return {
            type: SlimeNodeType.RestElement,
            argument: argument,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 CatchParameter AST
     */
    static createCatchParameterAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.CatchParameter?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name) {
            return getUtil().createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name) {
            return getUtil().createBindingPatternAst(first)
        }

        return null
    }

    /**
     * 创建 Arguments AST
     */
    static createArgumentsAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.Arguments?.name);
        const first1 = cst.children[1]
        if (first1) {
            if (first1.name === SlimeParser.prototype.ArgumentList?.name) {
                const res = ParameterCstToAst.createArgumentListAst(first1)
                return res
            }
        }
        return []
    }

    /**
     * 创建 ArgumentList AST
     */
    static createArgumentListAst(cst: SubhutiCst): Array<SlimeCallArgument> {
        const astName = checkCstName(cst, SlimeParser.prototype.ArgumentList?.name);
        const arguments_: Array<SlimeCallArgument> = []

        let currentArg: SlimeExpression | SlimeSpreadElement | null = null
        let hasArg = false
        let pendingEllipsis: SubhutiCst | null = null

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === 'Ellipsis' || child.name === 'Ellipsis') {
                pendingEllipsis = child
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }

                const expr = getUtil().createAssignmentExpressionAst(child)
                if (pendingEllipsis) {
                    const ellipsisToken = SlimeTokenCreate.createEllipsisToken(pendingEllipsis.loc)
                    currentArg = SlimeAstUtil.createSpreadElement(expr, child.loc, ellipsisToken)
                    pendingEllipsis = null
                } else {
                    currentArg = expr
                }
                hasArg = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
                }
                currentArg = getUtil().createSpreadElementAst(child)
                hasArg = true
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, commaToken))
                    hasArg = false
                    currentArg = null
                }
            }
        }

        if (hasArg) {
            arguments_.push(SlimeAstUtil.createCallArgument(currentArg!, undefined))
        }

        return arguments_
    }

    /**
     * 处理 FormalParameters CST 节点
     */
    static createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return ParameterCstToAst.createFormalParameterListAst(child)
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(ParameterCstToAst.createFormalParameterAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(getUtil().createBindingIdentifierAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(ParameterCstToAst.createBindingElementAst(child))
                continue
            }

            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(ParameterCstToAst.createFunctionRestParameterAst(child))
                continue
            }

            if (child.value === ',' || child.value === '(' || child.value === ')') {
                continue
            }
        }

        return params
    }

    /**
     * 创建 FormalParameterList AST
     */
    static createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.value === ',') continue

            if (child.name === SlimeParser.prototype.FormalParameter?.name || child.name === 'FormalParameter') {
                params.push(ParameterCstToAst.createFormalParameterAst(child))
            } else if (child.name === SlimeParser.prototype.BindingElement?.name || child.name === 'BindingElement') {
                params.push(ParameterCstToAst.createBindingElementAst(child))
            } else if (child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier') {
                params.push(getUtil().createBindingIdentifierAst(child))
            }
        }

        return params
    }

    /**
     * 创建 FormalParameter AST
     */
    static createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === SlimeParser.prototype.BindingElement?.name || firstChild.name === 'BindingElement') {
                return ParameterCstToAst.createBindingElementAst(firstChild)
            }
            if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
                return getUtil().createBindingIdentifierAst(firstChild)
            }
        }
        return ParameterCstToAst.createBindingElementAst(cst)
    }

    /**
     * 创建 BindingElement AST
     */
    static createBindingElementAst(cst: SubhutiCst): SlimePattern {
        const children = cst.children || []
        let pattern: SlimePattern | null = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.SingleNameBinding?.name || name === 'SingleNameBinding') {
                return ParameterCstToAst.createSingleNameBindingAst(child)
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                pattern = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                pattern = getUtil().createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = getUtil().createInitializerAst(child)
            }
        }

        if (init && pattern) {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: pattern,
                right: init,
                loc: cst.loc
            } as any
        }

        return pattern || { type: SlimeNodeType.Identifier, name: '', loc: cst.loc } as any
    }

    /**
     * 创建 SingleNameBinding AST
     */
    static createSingleNameBindingAst(cst: SubhutiCst): SlimePattern {
        const children = cst.children || []
        let id: SlimeIdentifier | null = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = getUtil().createInitializerAst(child)
            }
        }

        if (init && id) {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: id,
                right: init,
                loc: cst.loc
            } as any
        }

        return id || { type: SlimeNodeType.Identifier, name: '', loc: cst.loc } as any
    }

    /**
     * 创建 UniqueFormalParameters AST
     */
    static createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters'
        )
        if (formalParams) {
            return ParameterCstToAst.createFormalParametersAst(formalParams)
        }
        return ParameterCstToAst.createFormalParametersAst(cst)
    }

    /**
     * 创建 UniqueFormalParameters AST (包装类型)
     */
    static createUniqueFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        const formalParams = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters'
        )
        if (formalParams) {
            return ParameterCstToAst.createFormalParametersAstWrapped(formalParams)
        }
        return ParameterCstToAst.createFormalParametersAstWrapped(cst)
    }

    /**
     * PropertySetParameterList CST 到 AST
     */
    static createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [ParameterCstToAst.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [ParameterCstToAst.createBindingElementAst(first)]
        }
        return []
    }

    /**
     * PropertySetParameterList CST 到 AST (包装类型版本)
     */
    static createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeAstUtil.createFunctionParam(ParameterCstToAst.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeAstUtil.createFunctionParam(ParameterCstToAst.createBindingElementAst(first), undefined)]
        }
        return []
    }
}
