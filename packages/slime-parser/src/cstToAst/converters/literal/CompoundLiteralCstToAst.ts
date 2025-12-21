import { SubhutiCst } from "subhuti";
import {
    SlimeArrayExpression,
    SlimeObjectExpression,
    SlimeProperty,
    SlimeSpreadElement,
    SlimeArrayElement,
    SlimeObjectPropertyItem,
    SlimeIdentifier,
    SlimeLiteral,
    SlimeExpression,
    SlimeAstUtil,
    SlimeTokenCreate,
    SlimeNodeType
} from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";
import { IdentifierCstToAst } from "../identifier/IdentifierCstToAst.ts";
import { LiteralCstToAst } from "./LiteralCstToAst.ts";

export class CompoundLiteralCstToAst {

    /**
     * ArrayLiteral CST -> ArrayExpression AST
     */
    static createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);

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

        // 处理尾随逗号和省略
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

    static createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        checkCstName(cst, SlimeParser.prototype.ElementList?.name);
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

    static createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);

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

    /**
     * ObjectLiteral CST -> ObjectExpression AST
     */
    static createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
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

        const propertyDefinitionList = cst.children.find(ch => ch.name === SlimeParser.prototype.PropertyDefinitionList?.name);
        if (propertyDefinitionList) {
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null;
            let hasProperty = false;

            for (const child of propertyDefinitionList.children) {
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

    static createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children');
        }

        const first = cst.children[0];

        if (first.name === 'Ellipsis' || first.value === '...') {
            const argument = SlimeCstToAstUtil.createAssignmentExpressionAst(cst.children[1]);
            return {
                type: SlimeNodeType.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any;
        } else if (cst.children.length > 2 && cst.children[1].value === ':') {
            const keyNode = cst.children[0];
            const valueNode = cst.children[2];

            const key = CompoundLiteralCstToAst.createPropertyNameAst(keyNode);
            const value = SlimeCstToAstUtil.createAssignmentExpressionAst(valueNode);

            const prop = SlimeAstUtil.createPropertyAst(key, value);
            if (keyNode.children?.[0]?.name === SlimeParser.prototype.ComputedPropertyName?.name) {
                prop.computed = true;
            }
            return prop;
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name || first.name === 'MethodDefinition') {
            const method = SlimeCstToAstUtil.createMethodDefinitionAst(null, first);
            const prop = SlimeAstUtil.createPropertyAst(method.key, method.value);
            prop.computed = method.computed;
            if (method.kind === 'get' || method.kind === 'set') {
                prop.kind = method.kind;
            } else {
                prop.method = true;
            }
            return prop;
        } else if (first.name === SlimeParser.prototype.IdentifierReference?.name || first.name === 'IdentifierReference') {
            const identifier = IdentifierCstToAst.createIdentifierAst(first.children[0]);
            const prop = SlimeAstUtil.createPropertyAst(identifier, identifier);
            prop.shorthand = true;
            return prop;
        } else if (first.name === 'CoverInitializedName') {
            const identifierRefCst = first.children[0];
            const initializerCst = first.children[1];

            const identifier = IdentifierCstToAst.createIdentifierAst(identifierRefCst.children[0]);
            const defaultValue = SlimeCstToAstUtil.createAssignmentExpressionAst(initializerCst.children[1]);

            const assignmentPattern = {
                type: SlimeNodeType.AssignmentPattern,
                left: identifier,
                right: defaultValue,
                loc: first.loc
            };

            const prop = SlimeAstUtil.createPropertyAst(identifier, assignmentPattern as any);
            prop.shorthand = true;
            return prop;
        } else {
            throw new Error(`Unsupported PropertyDefinition type: ${first.name}`);
        }
    }

    static createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const first = cst.children[0];

        if (first.name === 'LiteralPropertyName' || first.name === SlimeParser.prototype.LiteralPropertyName?.name) {
            return CompoundLiteralCstToAst.createLiteralPropertyNameAst(first);
        } else if (first.name === 'ComputedPropertyName' || first.name === SlimeParser.prototype.ComputedPropertyName?.name) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first.children[1]);
        }
        return CompoundLiteralCstToAst.createLiteralPropertyNameAst(first);
    }

    static createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        let first = cst;
        if (cst.name === 'LiteralPropertyName' || cst.name === SlimeParser.prototype.LiteralPropertyName?.name) {
            first = cst.children[0];
        }

        if (first.name === 'IdentifierName' || first.name === SlimeParser.prototype.IdentifierName?.name) {
            return IdentifierCstToAst.createIdentifierNameAst(first);
        } else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return IdentifierCstToAst.createIdentifierAst(first);
        } else if (first.name === 'NumericLiteral' || first.name === 'Number') {
            return LiteralCstToAst.createNumericLiteralAst(first);
        } else if (first.name === 'StringLiteral' || first.name === 'String') {
            return LiteralCstToAst.createStringLiteralAst(first);
        } else if (first.value !== undefined) {
            return SlimeAstUtil.createIdentifier(first.value, first.loc);
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`);
    }

    static createElisionAst(cst: SubhutiCst): number {
        let count = 0;
        for (const child of cst.children || []) {
            if (child.value === ',') {
                count++;
            }
        }
        return count;
    }
}
