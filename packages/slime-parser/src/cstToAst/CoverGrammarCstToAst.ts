import {
    type SlimePattern,
    type SlimeExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeParser from "../SlimeParser.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setCoverGrammarCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for CoverGrammarCstToAst');
    }
    return _slimeCstToAstUtil;
}

// 延迟导入以避免循环依赖
let _ParameterCstToAst: any = null;
function getParameterCstToAst() {
    if (!_ParameterCstToAst) {
        _ParameterCstToAst = require('./ParameterCstToAst.ts').ParameterCstToAst;
    }
    return _ParameterCstToAst;
}

/**
 * Cover 语法相关的 CST to AST 转换
 * 处理 JavaScript 中的 Cover Grammar（覆盖语法）转换
 */
export class CoverGrammarCstToAst {

    /**
     * 从 CoverCallExpressionAndAsyncArrowHead 提取 async 箭头函数参数
     */
    static createAsyncArrowParamsFromCover(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = []

        for (const child of cst.children || []) {
            if (child.name === 'Arguments' || child.name === SlimeParser.prototype.Arguments?.name) {
                for (const argChild of child.children || []) {
                    if (argChild.name === 'ArgumentList' || argChild.name === SlimeParser.prototype.ArgumentList?.name) {
                        let hasEllipsis = false
                        for (const arg of argChild.children || []) {
                            if (arg.value === ',') continue
                            if (arg.name === 'Ellipsis' || arg.value === '...') {
                                hasEllipsis = true
                                continue
                            }
                            const param = CoverGrammarCstToAst.convertCoverParameterCstToPattern(arg, hasEllipsis)
                            if (param) {
                                params.push(param)
                                hasEllipsis = false
                            }
                        }
                    }
                }
            }
        }

        return params
    }

    /**
     * 从 CST 表达式转换为 Pattern
     */
    static convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=')
            if (hasAssign && cst.children && cst.children.length >= 3) {
                const expr = getUtil().createAssignmentExpressionAst(cst)
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return getUtil().convertAssignmentExpressionToPattern(expr)
                }
            }
        }

        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node
            const first = node.children[0]
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first
            }
            return findInnerExpr(first)
        }

        const inner = findInnerExpr(cst)

        if (inner.name === 'ObjectLiteral') {
            return getUtil().convertObjectLiteralToPattern(inner)
        } else if (inner.name === 'ArrayLiteral') {
            return getUtil().convertArrayLiteralToPattern(inner)
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner
            const identifierName = idNode.children?.[0]
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc)
            }
        } else if (inner.name === 'BindingIdentifier') {
            return getUtil().createBindingIdentifierAst(inner)
        }

        const expr = getUtil().createExpressionAst(cst)
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return getUtil().convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return getUtil().convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return getUtil().convertAssignmentExpressionToPattern(expr)
        }

        return null
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换为 Pattern
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null

        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = getUtil().createBindingIdentifierAst(cst)
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = getUtil().createBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = getUtil().createArrayBindingPatternAst(cst)
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = getUtil().createObjectBindingPatternAst(cst)
        }

        if (!basePattern) {
            basePattern = CoverGrammarCstToAst.convertCstToPattern(cst)
        }

        if (!basePattern) {
            const identifierCst = getUtil().findFirstIdentifierInExpression(cst)
            if (identifierCst) {
                basePattern = getUtil().createIdentifierAst(identifierCst) as any
            }
        }

        if (!basePattern) return null

        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern)
        }

        return basePattern
    }

    /**
     * 从 CoverParenthesizedExpressionAndArrowParameterList 提取箭头函数参数
     */
    static createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        if (cst.children.length === 0) {
            return []
        }

        if (cst.children.length === 2) {
            return []
        }

        const params: SlimePattern[] = []

        const formalParameterListCst = cst.children.find(
            child => child.name === SlimeParser.prototype.FormalParameterList?.name
        )
        if (formalParameterListCst) {
            return getParameterCstToAst().createFormalParameterListAst(formalParameterListCst)
        }

        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        )
        if (expressionCst && expressionCst.children?.length) {
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue
                const param = CoverGrammarCstToAst.convertCoverParameterCstToPattern(child, false)
                if (param) {
                    params.push(param)
                }
            }
        }

        const hasEllipsis = cst.children.some(
            child => child.name === 'Ellipsis' || child.name === 'Ellipsis'
        )
        if (hasEllipsis) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            const bindingPatternCst = bindingIdentifierCst
                ? null
                : cst.children.find(
                    child => child.name === SlimeParser.prototype.BindingPattern?.name ||
                        child.name === 'BindingPattern' ||
                        child.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
                        child.name === 'ArrayBindingPattern' ||
                        child.name === SlimeParser.prototype.ObjectBindingPattern?.name ||
                        child.name === 'ObjectBindingPattern'
                )

            const restTarget = bindingIdentifierCst || bindingPatternCst
            if (restTarget) {
                const restParam = CoverGrammarCstToAst.convertCoverParameterCstToPattern(restTarget, true)
                if (restParam) {
                    params.push(restParam)
                }
            }
        } else if (params.length === 0) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            )
            if (bindingIdentifierCst) {
                params.push(getUtil().createBindingIdentifierAst(bindingIdentifierCst))
            }
        }

        return params
    }

    /**
     * 从 Expression 中提取箭头函数参数
     */
    static extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = getUtil().createAssignmentExpressionAst(expressionCst)
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any]
            }
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: assignmentAst.left,
                    right: assignmentAst.right
                } as any]
            }
            return [assignmentAst as any]
        }

        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = []

            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = getUtil().createAssignmentExpressionAst(child)
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any)
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        params.push({
                            type: 'AssignmentPattern',
                            left: assignmentAst.left,
                            right: assignmentAst.right
                        } as any)
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        params.push(getUtil().convertExpressionToPattern(assignmentAst) as any)
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        params.push(getUtil().convertExpressionToPattern(assignmentAst) as any)
                    } else {
                        const identifier = getUtil().findFirstIdentifierInExpression(child)
                        if (identifier) {
                            params.push(getUtil().createIdentifierAst(identifier) as any)
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params
            }
        }

        const identifierCst = getUtil().findFirstIdentifierInExpression(expressionCst)
        if (identifierCst) {
            return [getUtil().createIdentifierAst(identifierCst) as any]
        }

        return []
    }

    /**
     * CoverParenthesizedExpressionAndArrowParameterList CST 到 AST
     */
    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): SlimeExpression {
        return getUtil().createParenthesizedExpressionAst(cst)
    }
}
