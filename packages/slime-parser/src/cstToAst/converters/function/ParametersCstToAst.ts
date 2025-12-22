/**
 * ParametersCstToAst - 参数处理转换
 */
import {
    type SlimePattern,
    type SlimeFunctionParam,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class ParametersCstToAst {
    /**
     * 从 ArrowFormalParameters 提取参数
     */
    static createArrowFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const params: SlimePattern[] = [];

        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return SlimeCstToAstUtil.createUniqueFormalParametersAst(child);
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return SlimeCstToAstUtil.createFormalParametersAst(child);
            }
        }

        return params;
    }

    /**
     * 从 ArrowFormalParameters 提取参数 (包装类型版本)
     */
    static createArrowFormalParametersAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        for (const child of cst.children || []) {
            if (child.name === 'UniqueFormalParameters' || child.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                return SlimeCstToAstUtil.createUniqueFormalParametersAstWrapped(child);
            }
            if (child.name === 'FormalParameters' || child.name === SlimeParser.prototype.FormalParameters?.name) {
                return SlimeCstToAstUtil.createFormalParametersAstWrapped(child);
            }
        }

        return [];
    }

    /**
     * 从 CoverParenthesizedExpressionAndArrowParameterList 提取箭头函数参数
     */
    static createArrowParametersFromCoverGrammar(cst: SubhutiCst): SlimePattern[] {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name);

        if (cst.children.length === 0) {
            return [];
        }

        // () - 空参数
        if (cst.children.length === 2) {
            return [];
        }

        const params: SlimePattern[] = [];

        // 查找 FormalParameterList
        const formalParameterListCst = cst.children.find(
            child => child.name === SlimeParser.prototype.FormalParameterList?.name
        );
        if (formalParameterListCst) {
            return SlimeCstToAstUtil.createFormalParameterListAst(formalParameterListCst);
        }

        // 查找 Expression
        const expressionCst = cst.children.find(
            child => child.name === SlimeParser.prototype.Expression?.name
        );
        if (expressionCst && expressionCst.children?.length) {
            for (const child of expressionCst.children) {
                if (child.name === 'Comma' || child.value === ',') continue;
                const param = SlimeCstToAstUtil.convertCoverParameterCstToPattern(child, false);
                if (param) {
                    params.push(param);
                }
            }
        }

        // 检查是否有 rest 参数
        const hasEllipsis = cst.children.some(
            child => child.name === 'Ellipsis'
        );
        if (hasEllipsis) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            );
            const bindingPatternCst = bindingIdentifierCst
                ? null
                : cst.children.find(
                    child => child.name === SlimeParser.prototype.BindingPattern?.name ||
                        child.name === 'BindingPattern' ||
                        child.name === SlimeParser.prototype.ArrayBindingPattern?.name ||
                        child.name === 'ArrayBindingPattern' ||
                        child.name === SlimeParser.prototype.ObjectBindingPattern?.name ||
                        child.name === 'ObjectBindingPattern'
                );

            const restTarget = bindingIdentifierCst || bindingPatternCst;
            if (restTarget) {
                const restParam = SlimeCstToAstUtil.convertCoverParameterCstToPattern(restTarget, true);
                if (restParam) {
                    params.push(restParam);
                }
            }
        } else if (params.length === 0) {
            const bindingIdentifierCst = cst.children.find(
                child => child.name === SlimeParser.prototype.BindingIdentifier?.name || child.name === 'BindingIdentifier'
            );
            if (bindingIdentifierCst) {
                params.push(SlimeCstToAstUtil.createBindingIdentifierAst(bindingIdentifierCst));
            }
        }

        return params;
    }

    /**
     * 从 Expression 中提取箭头函数参数
     */
    static extractParametersFromExpression(expressionCst: SubhutiCst): SlimePattern[] {
        if (expressionCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const assignmentAst = SlimeCstToAstUtil.createAssignmentExpressionAst(expressionCst);
            if (assignmentAst.type === SlimeNodeType.Identifier) {
                return [assignmentAst as any];
            }
            if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                return [{
                    type: 'AssignmentPattern',
                    left: (assignmentAst as any).left,
                    right: (assignmentAst as any).right
                } as any];
            }
            return [assignmentAst as any];
        }

        if (expressionCst.children && expressionCst.children.length > 0) {
            const params: SlimePattern[] = [];

            for (const child of expressionCst.children) {
                if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const assignmentAst = SlimeCstToAstUtil.createAssignmentExpressionAst(child);
                    if (assignmentAst.type === SlimeNodeType.Identifier) {
                        params.push(assignmentAst as any);
                    } else if (assignmentAst.type === SlimeNodeType.AssignmentExpression) {
                        params.push({
                            type: 'AssignmentPattern',
                            left: (assignmentAst as any).left,
                            right: (assignmentAst as any).right
                        } as any);
                    } else if (assignmentAst.type === SlimeNodeType.ObjectExpression) {
                        params.push(SlimeCstToAstUtil.convertExpressionToPattern(assignmentAst) as any);
                    } else if (assignmentAst.type === SlimeNodeType.ArrayExpression) {
                        params.push(SlimeCstToAstUtil.convertExpressionToPattern(assignmentAst) as any);
                    } else {
                        const identifier = ParametersCstToAst.findFirstIdentifierInExpression(child);
                        if (identifier) {
                            params.push(SlimeCstToAstUtil.createIdentifierAst(identifier) as any);
                        }
                    }
                }
            }

            if (params.length > 0) {
                return params;
            }
        }

        const identifierCst = ParametersCstToAst.findFirstIdentifierInExpression(expressionCst);
        if (identifierCst) {
            return [SlimeCstToAstUtil.createIdentifierAst(identifierCst) as any];
        }

        return [];
    }

    /**
     * 在 Expression 中查找第一个 Identifier
     */
    static findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst;
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = ParametersCstToAst.findFirstIdentifierInExpression(child);
                if (found) return found;
            }
        }
        return null;
    }
}
