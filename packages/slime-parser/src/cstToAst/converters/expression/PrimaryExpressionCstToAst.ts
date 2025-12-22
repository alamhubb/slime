import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType, SlimeTokenCreate } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class PrimaryExpressionCstToAst {

    static createPrimaryExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.PrimaryExpression?.name || 'PrimaryExpression');
        const child = cst.children![0];

        if (child.value === 'this') return SlimeAstUtil.createThisExpression(child.loc) as SlimeExpression;
        if (child.name === 'IdentifierReference') return SlimeCstToAstUtil.createIdentifierReferenceAst(child);
        if (child.name === 'Literal') return SlimeCstToAstUtil.createLiteralAst(child);
        if (child.name === 'ArrayLiteral') return SlimeCstToAstUtil.createArrayLiteralAst(child);
        if (child.name === 'ObjectLiteral') return SlimeCstToAstUtil.createObjectLiteralAst(child);
        if (child.name === 'FunctionExpression') return SlimeCstToAstUtil.createFunctionExpressionAst(child);
        if (child.name === 'ClassExpression') return SlimeCstToAstUtil.createClassExpressionAst(child);
        if (child.name === 'GeneratorExpression') return SlimeCstToAstUtil.createGeneratorExpressionAst(child);
        if (child.name === 'AsyncFunctionExpression') return SlimeCstToAstUtil.createAsyncFunctionExpressionAst(child);
        if (child.name === 'AsyncGeneratorExpression') return SlimeCstToAstUtil.createAsyncGeneratorExpressionAst(child);
        if (child.name === 'RegularExpressionLiteral') return SlimeCstToAstUtil.createRegExpLiteralAst(child);
        if (child.name === 'TemplateLiteral') return SlimeCstToAstUtil.createTemplateLiteralAst(child);
        if (child.name === 'ParenthesizedExpression') return PrimaryExpressionCstToAst.createParenthesizedExpressionAst(child);

        return SlimeCstToAstUtil.createExpressionAst(child);
    }

    static createParenthesizedExpressionAst(cst: SubhutiCst): SlimeExpression {
        const expression = SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
        return expression; // Usually we strip parentheses in AST unless needed
    }

    static createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
    }

    static createCoverInitializedNameAst(cst: SubhutiCst): any {
        const left = SlimeCstToAstUtil.createIdentifierReferenceAst(cst.children![0]);
        const right = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        return SlimeAstUtil.createAssignmentExpression('=', left, right, cst.loc);
    }

    static createShortCircuitExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ShortCircuitExpression?.name || 'ShortCircuitExpression');
        if (cst.children!.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        }

        const left = SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        const right = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        const operator = cst.children![1].value;

        return SlimeAstUtil.createLogicalExpression(operator, left, right, cst.loc) as SlimeExpression;
    }

    static createCoalesceExpressionHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
    }

    static createExpressionBodyAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
    }

    static createCoverParenthesizedExpressionAndArrowParameterListAst(cst: SubhutiCst): any {
        // This is a complex grammar cover, usually handled by checking the context
        // For now, we just pass through to the expression inside if it's a parenthesized expression
        return SlimeCstToAstUtil.createExpressionAst(cst.children![1]);
    }

    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
    }

    static createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
    }

    static createExpressionStatementAst(cst: SubhutiCst): any {
        const expression = SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        return SlimeAstUtil.createExpressionStatement(expression, cst.loc);
    }
}
