import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class PrimaryExpressionCstToAst {

    static createPrimaryExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name || 'PrimaryExpression');
        const first = cst.children![0];

        if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            return util.createIdentifierAst(first.children![0]);
        } else if (first.name === SlimeParser.prototype.Literal?.name) {
            return util.createLiteralAst(first);
        } else if (first.name === SlimeParser.prototype.ArrayLiteral?.name) {
            return util.createArrayLiteralAst(first) as SlimeExpression;
        } else if (first.name === SlimeParser.prototype.FunctionExpression?.name) {
            return util.createFunctionExpressionAst(first) as SlimeExpression;
        } else if (first.name === SlimeParser.prototype.ObjectLiteral?.name) {
            return util.createObjectLiteralAst(first) as SlimeExpression;
        } else if (first.name === SlimeParser.prototype.ClassExpression?.name) {
            return util.createClassExpressionAst(first) as SlimeExpression;
        } else if (first.name === 'This' || first.value === 'this') {
            return SlimeAstUtil.createThisExpression(first.loc);
        } else if (first.name === 'RegularExpressionLiteral') {
            return util.createRegExpLiteralAst(first);
        } else if (first.name === 'GeneratorExpression') {
            return util.createGeneratorExpressionAst(first) as SlimeExpression;
        } else if (first.name === 'AsyncFunctionExpression') {
            return util.createAsyncFunctionExpressionAst(first) as SlimeExpression;
        } else if (first.name === 'AsyncGeneratorExpression') {
            return util.createAsyncGeneratorExpressionAst(first) as SlimeExpression;
        } else if (first.name === 'CoverParenthesizedExpressionAndArrowParameterList' ||
            first.name === SlimeParser.prototype.CoverParenthesizedExpressionAndArrowParameterList?.name) {

            if (!first.children || first.children.length === 0 || first.children.length === 2) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc);
            }

            const middleCst = first.children[1];
            if (!middleCst) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc);
            }

            if (middleCst.name === 'Expression' || middleCst.name === SlimeParser.prototype.Expression?.name ||
                middleCst.name === 'AssignmentExpression' || middleCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const innerExpr = util.createExpressionAst(middleCst);
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc);
            }

            if (middleCst.name === 'FormalParameterList' || middleCst.name === SlimeParser.prototype.FormalParameterList?.name) {
                const params = util.createFormalParameterListAst(middleCst);
                if (params.length === 1 && params[0].type === SlimeNodeType.Identifier) {
                    return SlimeAstUtil.createParenthesizedExpression(params[0] as any, first.loc);
                }
                if (params.length > 1) {
                    const expressions = params.map(p => p as any);
                    return SlimeAstUtil.createParenthesizedExpression({
                        type: 'SequenceExpression',
                        expressions: expressions
                    } as any, first.loc);
                }
                return SlimeAstUtil.createIdentifier('undefined', first.loc);
            }

            try {
                const innerExpr = util.createExpressionAst(middleCst);
                return SlimeAstUtil.createParenthesizedExpression(innerExpr, first.loc);
            } catch (e) {
                return SlimeAstUtil.createIdentifier('undefined', first.loc);
            }
        } else if (first.name === SlimeParser.prototype.TemplateLiteral?.name) {
            return util.createTemplateLiteralAst(first);
        } else if (first.name === SlimeParser.prototype.ParenthesizedExpression?.name) {
            const innerExpression = util.createExpressionAst(first.children![1]);
            return SlimeAstUtil.createParenthesizedExpression(innerExpression, first.loc);
        } else {
            throw new Error('Unsupported PrimaryExpression type: ' + first.name);
        }
    }

    static createParenthesizedExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        for (const child of cst.children || []) {
            if (child.name === 'Expression' || child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'AssignmentExpression' || child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                return util.createExpressionAst(child);
            }
        }
        const innerExpr = cst.children?.find(ch =>
            ch.name !== 'LParen' && ch.name !== 'RParen' && ch.value !== '(' && ch.value !== ')'
        );
        if (innerExpr) {
            return util.createExpressionAst(innerExpr);
        }
        throw new Error('ParenthesizedExpression has no inner expression');
    }

    static createComputedPropertyNameAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === 'AssignmentExpression' || ch.name === SlimeParser.prototype.AssignmentExpression?.name
        );
        if (expr) {
            return util.createAssignmentExpressionAst(expr);
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression');
    }

    static createCoverInitializedNameAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === 'IdentifierReference' || ch.name === SlimeParser.prototype.IdentifierReference?.name
        );
        const init = cst.children?.find(ch =>
            ch.name === 'Initializer' || ch.name === SlimeParser.prototype.Initializer?.name
        );

        const id = idRef ? util.createIdentifierReferenceAst(idRef) : null;
        const initValue = init ? util.createInitializerAst(init) : null;

        return {
            type: SlimeNodeType.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        };
    }

    static createShortCircuitExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0];
        if (firstChild) {
            return util.createExpressionAst(firstChild);
        }
        throw new Error('ShortCircuitExpression has no children');
    }

    static createCoalesceExpressionHeadAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0];
        if (firstChild) {
            return util.createExpressionAst(firstChild);
        }
        throw new Error('CoalesceExpressionHead has no children');
    }

    static createMultiplicativeOperatorAst(cst: SubhutiCst): string {
        return (cst.children?.[0]?.value as string) || '*';
    }

    static createAssignmentOperatorAst(cst: SubhutiCst): string {
        return (cst.children?.[0]?.value as string) || '=';
    }

    static createExpressionBodyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const firstChild = cst.children?.[0];
        if (firstChild) {
            return util.createAssignmentExpressionAst(firstChild);
        }
        throw new Error('ExpressionBody has no children');
    }

    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        return PrimaryExpressionCstToAst.createParenthesizedExpressionAst(cst, util);
    }

    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        return util.createCallExpressionAst(cst);
    }

    static createCallMemberExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        return util.createCallExpressionAst(cst);
    }

    static createExpressionStatementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const expression = util.createExpressionAst(cst.children![0]);
        let semicolonToken: any = undefined;
        if (cst.children![1]) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(cst.children![1].loc);
        }
        return SlimeAstUtil.createExpressionStatement(expression, cst.loc, semicolonToken);
    }
}
