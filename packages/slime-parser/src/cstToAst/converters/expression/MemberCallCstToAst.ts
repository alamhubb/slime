import { SubhutiCst } from "subhuti";
import { SlimeExpression, SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class MemberCallCstToAst {

    static createCallExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.CallExpression?.name || 'CallExpression');

        if (cst.children!.length === 1) {
            return SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        }

        const callee = SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        const args = this.createArgumentsAst(cst.children![1]);

        return SlimeAstUtil.createCallExpression(callee, args, cst.loc) as SlimeExpression;
    }

    static createSuperCallAst(cst: SubhutiCst): SlimeExpression {
        const args = this.createArgumentsAst(cst.children![1]);
        return SlimeAstUtil.createSuperCall(args, cst.loc) as SlimeExpression;
    }

    static createImportCallAst(cst: SubhutiCst): SlimeExpression {
        const source = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        return SlimeAstUtil.createImportCall(source, cst.loc) as SlimeExpression;
    }

    static createSuperPropertyAst(cst: SubhutiCst): SlimeExpression {
        let property;
        let computed = false;

        if (cst.children![1].value === '[') {
            computed = true;
            property = SlimeCstToAstUtil.createExpressionAst(cst.children![2]);
        } else {
            property = SlimeCstToAstUtil.createIdentifierNameAst(cst.children![2]);
        }

        return SlimeAstUtil.createSuperProperty(property, computed, cst.loc) as SlimeExpression;
    }

    static createMetaPropertyAst(cst: SubhutiCst): SlimeExpression {
        const meta = SlimeCstToAstUtil.createIdentifierAst(cst.children![0]);
        const property = SlimeCstToAstUtil.createIdentifierAst(cst.children![2]);
        return SlimeAstUtil.createMetaProperty(meta, property, cst.loc) as SlimeExpression;
    }

    static createArgumentsAst(cst: SubhutiCst): any[] {
        if (cst.children!.length <= 2) return [];
        return this.createArgumentListAst(cst.children![1]);
    }

    static createArgumentListAst(cst: SubhutiCst): any[] {
        const result = [];
        for (let i = 0; i < cst.children!.length; i += 2) {
            const child = cst.children![i];
            if (child.name === 'SpreadElement') {
                result.push({
                    type: SlimeNodeType.SpreadElement,
                    argument: SlimeCstToAstUtil.createExpressionAst(child.children![1]),
                    loc: child.loc
                });
            } else {
                result.push(SlimeCstToAstUtil.createExpressionAst(child));
            }
        }
        return result;
    }

    static createMemberExpressionFirstOr(cst: SubhutiCst): SlimeExpression {
        const name = cst.name;
        if (name === 'PrimaryExpression') return SlimeCstToAstUtil.createPrimaryExpressionAst(cst);
        if (name === 'MemberExpression') return this.createMemberExpressionAst(cst);
        if (name === 'SuperProperty') return this.createSuperPropertyAst(cst);
        if (name === 'MetaProperty') return this.createMetaPropertyAst(cst);
        if (name === 'NewExpression') return this.createNewExpressionAst(cst);
        return SlimeCstToAstUtil.createExpressionAst(cst);
    }

    static createNewExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.NewExpression?.name || 'NewExpression');

        if (cst.children![0].value === 'new') {
            const callee = this.createMemberExpressionFirstOr(cst.children![1]);
            const args = cst.children![2] ? this.createArgumentsAst(cst.children![2]) : [];
            return SlimeAstUtil.createNewExpression(callee, args, cst.loc) as SlimeExpression;
        }

        return this.createMemberExpressionAst(cst.children![0]);
    }

    static createMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.MemberExpression?.name || 'MemberExpression');

        if (cst.children && cst.children.length > 1) {
            let left = this.createMemberExpressionFirstOr(cst.children[0]);

            for (let i = 1; i < cst.children.length; i++) {
                const part = cst.children[i];

                if (part.name === 'MemberExpressionPart') {
                    const op = part.children![0];
                    if (op.value === '[') {
                        const property = SlimeCstToAstUtil.createExpressionAst(part.children![1]);
                        left = SlimeAstUtil.createMemberExpression(left, property, true, part.loc) as SlimeExpression;
                    } else if (op.value === '.') {
                        const property = SlimeCstToAstUtil.createIdentifierNameAst(part.children![1]);
                        left = SlimeAstUtil.createMemberExpression(left, property, false, part.loc) as SlimeExpression;
                    }
                } else if (part.name === 'TemplateLiteral') {
                    const quasi = SlimeCstToAstUtil.createTemplateLiteralAst(part);
                    left = SlimeAstUtil.createTaggedTemplateExpression(left, quasi, part.loc) as SlimeExpression;
                }
            }
            return left;
        }

        return this.createMemberExpressionFirstOr(cst.children![0]);
    }

    static createOptionalExpressionAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.OptionalExpression?.name || 'OptionalExpression');

        let object = SlimeCstToAstUtil.createExpressionAst(cst.children![0]);
        return this.createOptionalChainAst(cst.children![1], object);
    }

    static createOptionalChainAst(cst: SubhutiCst, object: SlimeExpression): SlimeExpression {
        const isOptional = cst.children![0].value === '?.';
        const part = isOptional ? cst.children![1] : cst.children![0];

        let current: SlimeExpression;
        if (part.name === 'Arguments') {
            const args = this.createArgumentsAst(part);
            current = SlimeAstUtil.createOptionalCallExpression(object, args, isOptional, cst.loc) as SlimeExpression;
        } else if (part.value === '[') {
            const property = SlimeCstToAstUtil.createExpressionAst(isOptional ? cst.children![2] : cst.children![1]);
            current = SlimeAstUtil.createOptionalMemberExpression(object, property, true, isOptional, cst.loc) as SlimeExpression;
        } else if (part.name === 'IdentifierName') {
            const property = SlimeCstToAstUtil.createIdentifierNameAst(part);
            current = SlimeAstUtil.createOptionalMemberExpression(object, property, false, isOptional, cst.loc) as SlimeExpression;
        } else {
            const property = SlimeCstToAstUtil.createIdentifierNameAst(part);
            current = SlimeAstUtil.createOptionalMemberExpression(object, property, false, isOptional, cst.loc) as SlimeExpression;
        }

        const nextChain = cst.children![cst.children!.length - 1];
        if (nextChain && nextChain.name === 'OptionalChain') {
            return this.createOptionalChainAst(nextChain, current);
        }

        return current;
    }

    static createCallMemberExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }

    static createCoverCallExpressionAndAsyncArrowHeadAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }

    static createLeftHandSideExpressionAst(cst: SubhutiCst): SlimeExpression {
        return SlimeCstToAstUtil.createAstFromCst(cst.children![0]);
    }
}
