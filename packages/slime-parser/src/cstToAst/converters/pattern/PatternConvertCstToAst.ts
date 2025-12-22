/**
 * PatternConvertCstToAst - 表达式->模式转换
 */
import {
    type SlimePattern,
    type SlimeObjectPattern,
    type SlimeArrayPattern,
    type SlimeRestElement,
    type SlimeAssignmentProperty,
    type SlimeObjectPatternProperty,
    type SlimeArrayPatternElement,
    SlimeNodeType,
    SlimeAstUtil,
    SlimeTokenCreate,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class PatternConvertCstToAst {
    /**
     * 将 ObjectExpression AST 转换为 ObjectPattern
     */
    static convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = [];
        for (const prop of expr.properties || []) {
            const property = prop.property || prop;
            if (property.type === SlimeNodeType.SpreadElement) {
                properties.push({
                    property: {
                        type: SlimeNodeType.RestElement,
                        argument: property.argument,
                        loc: property.loc
                    } as SlimeRestElement
                });
            } else {
                const value = PatternConvertCstToAst.convertExpressionToPatternFromAST(property.value);
                properties.push({
                    property: {
                        type: SlimeNodeType.Property,
                        key: property.key,
                        value: value || property.value,
                        kind: 'init',
                        computed: property.computed,
                        shorthand: property.shorthand,
                        loc: property.loc
                    } as SlimeAssignmentProperty
                });
            }
        }
        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken: expr.lBraceToken,
            rBraceToken: expr.rBraceToken,
            loc: expr.loc
        } as SlimeObjectPattern;
    }

    /**
     * 将 ArrayExpression AST 转换为 ArrayPattern
     */
    static convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = [];
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null });
            } else {
                const element = elem.element || elem;
                const pattern = PatternConvertCstToAst.convertExpressionToPatternFromAST(element);
                elements.push({ element: pattern || element, commaToken: elem.commaToken });
            }
        }
        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken: expr.lBracketToken,
            rBracketToken: expr.rBracketToken,
            loc: expr.loc
        } as SlimeArrayPattern;
    }

    /**
     * 将 AssignmentExpression AST 转换为 AssignmentPattern
     */
    static convertAssignmentExpressionToPattern(expr: any): any {
        const left = PatternConvertCstToAst.convertExpressionToPatternFromAST(expr.left);
        return {
            type: SlimeNodeType.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        };
    }

    /**
     * 将表达式 AST 转换为 Pattern
     */
    static convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        if (!expr) return null;
        if (expr.type === SlimeNodeType.Identifier) {
            return expr;
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return PatternConvertCstToAst.convertObjectExpressionToPattern(expr);
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return PatternConvertCstToAst.convertArrayExpressionToPattern(expr);
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr);
        }
        return null;
    }

    /**
     * 将表达式转换为模式（用于箭头函数参数解构）
     */
    static convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr;

        if (expr.type === SlimeNodeType.Identifier) {
            return expr;
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            const properties: any[] = [];
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item;
                if (prop.type === SlimeNodeType.SpreadElement) {
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: PatternConvertCstToAst.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    });
                } else if (prop.type === SlimeNodeType.Property) {
                    const convertedValue = PatternConvertCstToAst.convertExpressionToPattern(prop.value);
                    properties.push({
                        property: {
                            ...prop,
                            value: convertedValue
                        },
                        commaToken: item.commaToken
                    });
                } else {
                    properties.push(item);
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any;
        }

        if (expr.type === SlimeNodeType.ArrayExpression) {
            const elements: any[] = [];
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item;
                if (elem === null) {
                    elements.push(item);
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: PatternConvertCstToAst.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    });
                } else {
                    elements.push({
                        element: PatternConvertCstToAst.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    });
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any;
        }

        if (expr.type === SlimeNodeType.AssignmentExpression) {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: PatternConvertCstToAst.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any;
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            return {
                type: SlimeNodeType.RestElement,
                argument: PatternConvertCstToAst.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any;
        }

        return expr;
    }

    /**
     * 将 CST 表达式转换为 Pattern（用于 cover grammar）
     */
    static convertCstToPattern(cst: SubhutiCst): SlimePattern | null {
        // 首先检查是否是 AssignmentExpression (默认参数)
        if (cst.name === 'AssignmentExpression' || cst.name === SlimeParser.prototype.AssignmentExpression?.name) {
            const hasAssign = cst.children?.some(ch => ch.name === 'Assign' || ch.value === '=');
            if (hasAssign && cst.children && cst.children.length >= 3) {
                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(cst);
                if (expr.type === SlimeNodeType.AssignmentExpression) {
                    return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr);
                }
            }
        }

        const findInnerExpr = (node: SubhutiCst): SubhutiCst => {
            if (!node.children || node.children.length === 0) return node;
            const first = node.children[0];
            if (first.name === 'ObjectLiteral' || first.name === 'ArrayLiteral' ||
                first.name === 'IdentifierReference' || first.name === 'Identifier' ||
                first.name === 'BindingIdentifier') {
                return first;
            }
            return findInnerExpr(first);
        };

        const inner = findInnerExpr(cst);

        if (inner.name === 'ObjectLiteral') {
            return PatternConvertCstToAst.convertObjectLiteralToPattern(inner);
        } else if (inner.name === 'ArrayLiteral') {
            return SlimeCstToAstUtil.convertArrayLiteralToPattern(inner);
        } else if (inner.name === 'IdentifierReference' || inner.name === 'Identifier') {
            const idNode = inner.name === 'IdentifierReference' ? findInnerExpr(inner) : inner;
            const identifierName = idNode.children?.[0];
            if (identifierName) {
                return SlimeAstUtil.createIdentifier(identifierName.value, identifierName.loc);
            }
        } else if (inner.name === 'BindingIdentifier') {
            return SlimeCstToAstUtil.createBindingIdentifierAst(inner);
        }

        const expr = SlimeCstToAstUtil.createExpressionAst(cst);
        if (expr.type === SlimeNodeType.Identifier) {
            return expr as any;
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return PatternConvertCstToAst.convertObjectExpressionToPattern(expr);
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return PatternConvertCstToAst.convertArrayExpressionToPattern(expr);
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return PatternConvertCstToAst.convertAssignmentExpressionToPattern(expr);
        }

        return null;
    }

    /**
     * Cover 语法下，将单个参数相关的 CST 节点转换为 Pattern
     */
    static convertCoverParameterCstToPattern(cst: SubhutiCst, hasEllipsis: boolean): SlimePattern | null {
        let basePattern: SlimePattern | null = null;

        if (cst.name === SlimeParser.prototype.BindingIdentifier?.name || cst.name === 'BindingIdentifier') {
            basePattern = SlimeCstToAstUtil.createBindingIdentifierAst(cst);
        } else if (cst.name === SlimeParser.prototype.BindingPattern?.name || cst.name === 'BindingPattern') {
            basePattern = SlimeCstToAstUtil.createBindingPatternAst(cst);
        } else if (cst.name === SlimeParser.prototype.ArrayBindingPattern?.name || cst.name === 'ArrayBindingPattern') {
            basePattern = SlimeCstToAstUtil.createArrayBindingPatternAst(cst);
        } else if (cst.name === SlimeParser.prototype.ObjectBindingPattern?.name || cst.name === 'ObjectBindingPattern') {
            basePattern = SlimeCstToAstUtil.createObjectBindingPatternAst(cst);
        }

        if (!basePattern) {
            basePattern = PatternConvertCstToAst.convertCstToPattern(cst);
        }

        if (!basePattern) {
            const identifierCst = SlimeCstToAstUtil.findFirstIdentifierInExpression(cst);
            if (identifierCst) {
                basePattern = SlimeCstToAstUtil.createIdentifierAst(identifierCst) as any;
            }
        }

        if (!basePattern) return null;

        if (hasEllipsis) {
            return SlimeAstUtil.createRestElement(basePattern);
        }

        return basePattern;
    }

    /**
     * 将 ObjectLiteral CST 转换为 ObjectPattern
     */
    static convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = [];
        let lBraceToken: any = undefined;
        let rBraceToken: any = undefined;

        for (const child of cst.children || []) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc);
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc);
            } else if (child.name === 'PropertyDefinitionList') {
                for (const prop of child.children || []) {
                    if (prop.value === ',') {
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(prop.loc);
                        }
                        continue;
                    }
                    if (prop.name === 'PropertyDefinition') {
                        const ellipsis = prop.children?.find((c: any) => c.value === '...' || c.name === 'Ellipsis');
                        if (ellipsis) {
                            const assignExpr = prop.children?.find((c: any) => c.name === 'AssignmentExpression');
                            if (assignExpr) {
                                const idCst = SlimeCstToAstUtil.findFirstIdentifierInExpression(assignExpr);
                                if (idCst) {
                                    const restId = SlimeCstToAstUtil.createIdentifierAst(idCst);
                                    const restNode: SlimeRestElement = {
                                        type: SlimeNodeType.RestElement,
                                        argument: restId,
                                        ellipsisToken: SlimeTokenCreate.createEllipsisToken(ellipsis.loc),
                                        loc: prop.loc
                                    };
                                    properties.push({ property: restNode });
                                }
                            }
                        } else {
                            const patternProp = PatternConvertCstToAst.convertPropertyDefinitionToPatternProperty(prop);
                            if (patternProp) {
                                properties.push({ property: patternProp });
                            }
                        }
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeObjectPattern;
    }

    /**
     * 将 PropertyDefinition CST 转换为 Pattern 属性
     */
    static convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        const first = cst.children?.[0];
        if (!first) return null;

        if (first.name === 'IdentifierReference') {
            const idNode = first.children?.[0]?.children?.[0];
            if (idNode) {
                const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc);
                return {
                    type: SlimeNodeType.Property,
                    key: id,
                    value: id,
                    kind: 'init',
                    computed: false,
                    shorthand: true,
                    loc: cst.loc
                } as SlimeAssignmentProperty;
            }
        } else if (first.name === 'CoverInitializedName') {
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference');
            const initializer = first.children?.find((c: any) => c.name === 'Initializer');
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0];
                if (idNode) {
                    const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc);
                    let value: any = id;
                    if (initializer) {
                        const init = SlimeCstToAstUtil.createInitializerAst(initializer);
                        value = {
                            type: SlimeNodeType.AssignmentPattern,
                            left: id,
                            right: init,
                            loc: first.loc
                        };
                    }
                    return {
                        type: SlimeNodeType.Property,
                        key: id,
                        value: value,
                        kind: 'init',
                        computed: false,
                        shorthand: true,
                        loc: cst.loc
                    } as SlimeAssignmentProperty;
                }
            }
        } else if (first.name === 'PropertyName') {
            const propName = first;
            const colonCst = cst.children?.find((c: any) => c.value === ':');
            const valueCst = cst.children?.[2];
            if (colonCst && valueCst) {
                const key = SlimeCstToAstUtil.createPropertyNameAst(propName);
                const valueExpr = SlimeCstToAstUtil.createExpressionAst(valueCst);
                const value = PatternConvertCstToAst.convertExpressionToPatternFromAST(valueExpr);
                return {
                    type: SlimeNodeType.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: SlimeCstToAstUtil.isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeAssignmentProperty;
            }
        }

        return null;
    }
}
