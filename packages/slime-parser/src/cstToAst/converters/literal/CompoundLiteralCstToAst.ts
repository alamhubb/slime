/**
 * CompoundLiteralCstToAst - 数组/对象字面量转换
 */
import {
    type SlimeArrayExpression,
    type SlimeObjectExpression,
    type SlimeObjectPropertyItem,
    type SlimeProperty,
    type SlimeSpreadElement,
    type SlimeArrayElement,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeExpression,
    SlimeAstUtil,
    SlimeTokenCreate,
    SlimeNodeType,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import { SlimeAstUtils } from "../../SlimeAstUtils";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class CompoundLiteralCstToAst {
    /**
     * ArrayLiteral CST 转 ArrayExpression AST
     */
    static createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);

        let lBracketToken: any = undefined;
        let rBracketToken: any = undefined;

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0];
            if (firstChild && (firstChild.name === 'LBracket' || firstChild.value === '[')) {
                lBracketToken = SlimeTokenCreate.createLBracketToken(firstChild.loc);
            }
            const lastChild = cst.children[cst.children.length - 1];
            if (lastChild && (lastChild.name === 'RBracket' || lastChild.value === ']')) {
                rBracketToken = SlimeTokenCreate.createRBracketToken(lastChild.loc);
            }
        }

        const elementList = cst.children.find(ch => ch.name === SlimeParser.prototype.ElementList?.name);
        const elements = elementList ? CompoundLiteralCstToAst.createElementListAst(elementList) : [];

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || [];
                for (let j = 0; j < elisionCommas.length; j++) {
                    const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc);
                    elements.push(SlimeAstUtil.createArrayElement(null, commaToken));
                }
            }
        }

        return SlimeAstUtil.createArrayExpression(elements, cst.loc, lBracketToken, rBracketToken);
    }


    /**
     * 对象字面量 CST 转 AST
     */
    static createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
        const properties: Array<SlimeObjectPropertyItem> = [];

        let lBraceToken: any = undefined;
        let rBraceToken: any = undefined;

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0];
            if (firstChild && (firstChild.name === 'LBrace' || firstChild.value === '{')) {
                lBraceToken = SlimeTokenCreate.createLBraceToken(firstChild.loc);
            }
            const lastChild = cst.children[cst.children.length - 1];
            if (lastChild && (lastChild.name === 'RBrace' || lastChild.value === '}')) {
                rBraceToken = SlimeTokenCreate.createRBraceToken(lastChild.loc);
            }
        }

        if (cst.children.length > 2) {
            const PropertyDefinitionListCst = cst.children[1];
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null;
            let hasProperty = false;

            for (const child of PropertyDefinitionListCst.children) {
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined));
                    }
                    currentProperty = CompoundLiteralCstToAst.createPropertyDefinitionAst(child);
                    hasProperty = true;
                } else if (child.name === 'Comma' || child.value === ',') {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc);
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, commaToken));
                        hasProperty = false;
                        currentProperty = null;
                    }
                }
            }

            if (hasProperty) {
                properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined));
            }
        }
        return SlimeAstUtil.createObjectExpression(properties, cst.loc, lBraceToken, rBraceToken);
    }

    /**
     * PropertyDefinition CST 转 AST
     */
    static createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children');
        }

        const first = cst.children[0];

        // ES2018: 对象 spread {...obj}
        if (first.name === 'Ellipsis' || first.value === '...') {
            const AssignmentExpressionCst = cst.children[1];
            const argument = SlimeCstToAstUtil.createAssignmentExpressionAst(AssignmentExpressionCst);
            return {
                type: SlimeNodeType.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any;
        } else if (cst.children.length > 2) {
            // PropertyName : AssignmentExpression
            const PropertyNameCst = cst.children[0];
            const AssignmentExpressionCst = cst.children[2];
            const key = CompoundLiteralCstToAst.createPropertyNameAst(PropertyNameCst);
            const value = SlimeCstToAstUtil.createAssignmentExpressionAst(AssignmentExpressionCst);
            const keyAst = SlimeAstUtil.createPropertyAst(key, value);
            if (PropertyNameCst.children[0].name === SlimeParser.prototype.ComputedPropertyName?.name) {
                keyAst.computed = true;
            }
            return keyAst;
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name) {
            const SlimeMethodDefinition = SlimeCstToAstUtil.createMethodDefinitionAst(null, first);
            const keyAst = SlimeAstUtil.createPropertyAst(SlimeMethodDefinition.key, SlimeMethodDefinition.value);
            if (SlimeMethodDefinition.computed) {
                keyAst.computed = true;
            }
            if (SlimeMethodDefinition.kind === 'get' || SlimeMethodDefinition.kind === 'set') {
                keyAst.kind = SlimeMethodDefinition.kind;
            } else {
                keyAst.method = true;
            }
            return keyAst;
        } else if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            const identifierCst = first.children[0];
            const identifier = SlimeCstToAstUtil.createIdentifierAst(identifierCst);
            const keyAst = SlimeAstUtil.createPropertyAst(identifier, identifier);
            keyAst.shorthand = true;
            return keyAst;
        } else if (first.name === 'CoverInitializedName') {
            const identifierRefCst = first.children[0];
            const initializerCst = first.children[1];
            const identifierCst = identifierRefCst.children[0];
            const identifier = SlimeCstToAstUtil.createIdentifierAst(identifierCst);
            const defaultValue = SlimeCstToAstUtil.createAssignmentExpressionAst(initializerCst.children[1]);
            const assignmentPattern = {
                type: SlimeNodeType.AssignmentPattern,
                left: identifier,
                right: defaultValue,
                loc: first.loc
            };
            const keyAst = SlimeAstUtil.createPropertyAst(identifier, assignmentPattern as any);
            keyAst.shorthand = true;
            return keyAst;
        } else {
            throw new Error(`不支持的 PropertyDefinition 类型: ${first.name}`);
        }
    }


    /**
     * PropertyName CST 转 AST
     */
    static createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        if (!cst || !cst.children || cst.children.length === 0) {
            throw new Error('createPropertyNameAst: invalid cst or no children');
        }

        const first = cst.children[0];

        if (first.name === SlimeParser.prototype.LiteralPropertyName?.name || first.name === 'LiteralPropertyName') {
            return CompoundLiteralCstToAst.createLiteralPropertyNameAst(first);
        } else if (first.name === SlimeParser.prototype.ComputedPropertyName?.name || first.name === 'ComputedPropertyName') {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first.children[1]);
        }
        return CompoundLiteralCstToAst.createLiteralPropertyNameAst(first);
    }

    /**
     * LiteralPropertyName CST 转 AST
     */
    static createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        if (!cst) {
            throw new Error('createLiteralPropertyNameAst: cst is null');
        }

        let first = cst;
        if (cst.name === SlimeParser.prototype.LiteralPropertyName?.name || cst.name === 'LiteralPropertyName') {
            if (!cst.children || cst.children.length === 0) {
                throw new Error('createLiteralPropertyNameAst: LiteralPropertyName has no children');
            }
            first = cst.children[0];
        }

        if (first.name === 'IdentifierName' || first.name === SlimeParser.prototype.IdentifierName?.name) {
            if (first.value !== undefined) {
                return SlimeAstUtil.createIdentifier(first.value, first.loc);
            }
            let current = first;
            while (current.children && current.children.length > 0 && current.value === undefined) {
                current = current.children[0];
            }
            if (current.value !== undefined) {
                return SlimeAstUtil.createIdentifier(current.value, current.loc || first.loc);
            }
            throw new Error(`createLiteralPropertyNameAst: Cannot extract value from IdentifierName`);
        } else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return SlimeCstToAstUtil.createIdentifierAst(first);
        } else if (first.name === SlimeTokenConsumer.prototype.NumericLiteral?.name || first.name === 'NumericLiteral' || first.name === 'Number') {
            return SlimeCstToAstUtil.createNumericLiteralAst(first);
        } else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name || first.name === 'StringLiteral' || first.name === 'String') {
            return SlimeCstToAstUtil.createStringLiteralAst(first);
        } else if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc);
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`);
    }

    /**
     * ElementList CST 转 AST
     */
    static createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = [];

        let currentElement: SlimeExpression | SlimeSpreadElement | null = null;
        let hasElement = false;

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i];

            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined));
                }
                currentElement = SlimeCstToAstUtil.createAssignmentExpressionAst(child);
                hasElement = true;
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined));
                }
                currentElement = CompoundLiteralCstToAst.createSpreadElementAst(child);
                hasElement = true;
            } else if (child.name === SlimeParser.prototype.Elision?.name) {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || [];
                for (let j = 0; j < elisionCommas.length; j++) {
                    if (hasElement) {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc);
                        elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken));
                        hasElement = false;
                        currentElement = null;
                    } else {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc);
                        elements.push(SlimeAstUtil.createArrayElement(null, commaToken));
                    }
                }
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc);
                elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken));
                hasElement = false;
                currentElement = null;
            }
        }

        if (hasElement) {
            elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined));
        }

        return elements;
    }

    /**
     * SpreadElement CST 转 AST
     */
    static createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);

        let ellipsisToken: any = undefined;
        const ellipsisCst = cst.children.find(ch =>
            ch.name === 'Ellipsis' || ch.value === '...'
        );
        if (ellipsisCst) {
            ellipsisToken = SlimeTokenCreate.createEllipsisToken(ellipsisCst.loc);
        }

        const expression = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name
        );
        if (!expression) {
            throw new Error('SpreadElement missing AssignmentExpression');
        }

        return SlimeAstUtil.createSpreadElement(
            SlimeCstToAstUtil.createAssignmentExpressionAst(expression),
            cst.loc,
            ellipsisToken
        );
    }
}
