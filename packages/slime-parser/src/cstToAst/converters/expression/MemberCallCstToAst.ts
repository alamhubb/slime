import { SubhutiCst } from "subhuti";
import {
    SlimeExpression,
    SlimeAstUtil,
    SlimeTokenCreate,
    SlimeNodeType,
    SlimeCallArgument,
    SlimeSuper,
    SlimeIdentifier
} from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../SlimeParser.ts";

export class MemberCallCstToAst {

    static createCallExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const isCallExpr = cst.name === SlimeParser.prototype.CallExpression?.name || cst.name === 'CallExpression';
        const isCoverExpr = cst.name === 'CoverCallExpressionAndAsyncArrowHead';

        if (!isCallExpr && !isCoverExpr) {
            throw new Error(`createCallExpressionAst: Expected CallExpression or CoverCallExpressionAndAsyncArrowHead, got ${cst.name}`);
        }

        if (cst.children && cst.children.length === 1) {
            const first = cst.children[0];
            if (first.name === SlimeParser.prototype.SuperCall?.name) {
                return util.createSuperCallAst(first);
            }
            return util.createExpressionAst(first);
        }

        let current: SlimeExpression;
        const firstChild = cst.children![0];

        if (firstChild.name === 'CoverCallExpressionAndAsyncArrowHead') {
            current = MemberCallCstToAst.createCallExpressionAst(firstChild, util);
        } else if (firstChild.name === SlimeParser.prototype.MemberExpression?.name || firstChild.name === 'MemberExpression') {
            current = util.createMemberExpressionAst(firstChild);
        } else if (firstChild.name === SlimeParser.prototype.SuperCall?.name || firstChild.name === 'SuperCall') {
            current = util.createSuperCallAst(firstChild);
        } else if (firstChild.name === SlimeParser.prototype.ImportCall?.name || firstChild.name === 'ImportCall') {
            current = util.createImportCallAst(firstChild);
        } else {
            current = util.createExpressionAst(firstChild);
        }

        for (let i = 1; i < cst.children!.length; i++) {
            const child = cst.children![i];

            if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                const args = MemberCallCstToAst.createArgumentsAst(child, util);
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression;
            } else if (child.name === 'DotMemberExpression') {
                const dotChild = child.children![0];
                const identifierNameCst = child.children![1];
                const tokenCst = identifierNameCst.children![0];
                const property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
                const dotOp = SlimeTokenCreate.createDotToken(dotChild.loc);
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property);
            } else if (child.name === 'Dot') {
                const dotOp = SlimeTokenCreate.createDotToken(child.loc);
                const nextChild = cst.children![i + 1];
                let property: SlimeIdentifier | null = null;
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children![0];
                        property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
                        i++;
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = util.createPrivateIdentifierAst(nextChild);
                        i++;
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotOp, property);
            } else if (child.name === 'BracketExpression') {
                const propertyExpression = util.createExpressionAst(child.children![1]);
                current = {
                    type: SlimeNodeType.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any;
            } else if (child.name === 'LBracket') {
                const expressionChild = cst.children![i + 1];
                if (expressionChild && expressionChild.name !== 'RBracket') {
                    const propertyExpression = util.createExpressionAst(expressionChild);
                    current = {
                        type: SlimeNodeType.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any;
                    i += 2;
                }
            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                const quasi = util.createTemplateLiteralAst(child);
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any;
            }
        }

        return current;
    }

    static createSuperCallAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.SuperCall?.name || 'SuperCall');
        const argumentsCst = cst.children![1];
        const argumentsAst = MemberCallCstToAst.createArgumentsAst(argumentsCst, util);

        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children![0].loc
        };

        return SlimeAstUtil.createCallExpression(superNode, argumentsAst) as SlimeExpression;
    }

    static createImportCallAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.ImportCall?.name || 'ImportCall');
        const args: SlimeCallArgument[] = [];

        for (const child of cst.children!) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = util.createAssignmentExpressionAst(child);
                args.push(SlimeAstUtil.createCallArgument(expr));
            }
        }

        const importIdentifier: SlimeIdentifier = SlimeAstUtil.createIdentifier('import', cst.children![0].loc);
        return SlimeAstUtil.createCallExpression(importIdentifier, args) as SlimeExpression;
    }

    static createSuperPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const superNode: SlimeSuper = {
            type: "Super",
            loc: cst.children![0].loc
        };

        const second = cst.children![1];
        if (second.name === 'BracketExpression') {
            const propertyExpression = util.createExpressionAst(second.children![1]);
            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any;
        } else if (second.name === 'LBracket') {
            const expressionCst = cst.children![2];
            const propertyExpression = util.createExpressionAst(expressionCst);
            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: propertyExpression,
                computed: true,
                optional: false,
                loc: cst.loc
            } as any;
        } else if (second.name === 'Dot') {
            const identifierNameCst = cst.children![2];
            let property: SlimeIdentifier;
            if (identifierNameCst.name === 'IdentifierName' || identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                const tokenCst = identifierNameCst.children![0];
                property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
            } else {
                property = SlimeAstUtil.createIdentifier(identifierNameCst.value as string, identifierNameCst.loc);
            }

            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any;
        } else {
            const propToken = cst.children![2];
            const property = SlimeAstUtil.createIdentifier(propToken.value as string, propToken.loc);

            return {
                type: SlimeNodeType.MemberExpression,
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            } as any;
        }
    }

    static createMetaPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        const first = cst.children![0];
        if (first.name === SlimeParser.prototype.NewTarget?.name) {
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('new', first.loc),
                property: SlimeAstUtil.createIdentifier('target', first.loc),
                loc: cst.loc
            } as any;
        } else {
            return {
                type: 'MetaProperty',
                meta: SlimeAstUtil.createIdentifier('import', first.loc),
                property: SlimeAstUtil.createIdentifier('meta', first.loc),
                loc: cst.loc
            } as any;
        }
    }

    static createArgumentsAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeCallArgument> {
        checkCstName(cst, SlimeParser.prototype.Arguments?.name || 'Arguments');
        const first1 = cst.children![1];
        if (first1 && first1.name === SlimeParser.prototype.ArgumentList?.name) {
            return MemberCallCstToAst.createArgumentListAst(first1, util);
        }
        return [];
    }

    static createArgumentListAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeCallArgument> {
        checkCstName(cst, SlimeParser.prototype.ArgumentList?.name || 'ArgumentList');
        const arguments_: Array<SlimeCallArgument> = [];

        let currentArg: SlimeExpression | any = null;
        let hasArg = false;
        let pendingEllipsis: SubhutiCst | null = null;

        for (let i = 0; i < cst.children!.length; i++) {
            const child = cst.children![i];

            if (child.name === 'Ellipsis') {
                pendingEllipsis = child;
            } else if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg, undefined));
                }

                const expr = util.createAssignmentExpressionAst(child);
                if (pendingEllipsis) {
                    const ellipsisToken = SlimeTokenCreate.createEllipsisToken(pendingEllipsis.loc);
                    currentArg = SlimeAstUtil.createSpreadElement(expr, child.loc, ellipsisToken);
                    pendingEllipsis = null;
                } else {
                    currentArg = expr;
                }
                hasArg = true;
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg, undefined));
                }
                currentArg = util.createSpreadElementAst(child);
                hasArg = true;
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc);
                if (hasArg) {
                    arguments_.push(SlimeAstUtil.createCallArgument(currentArg, commaToken));
                    hasArg = false;
                    currentArg = null;
                }
            }
        }

        if (hasArg) {
            arguments_.push(SlimeAstUtil.createCallArgument(currentArg, undefined));
        }

        return arguments_;
    }

    static createMemberExpressionFirstOr(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression | SlimeSuper {
        if (cst.name === SlimeParser.prototype.PrimaryExpression?.name || cst.name === 'PrimaryExpression') {
            return util.createPrimaryExpressionAst(cst);
        } else if (cst.name === SlimeParser.prototype.SuperProperty?.name || cst.name === 'SuperProperty') {
            return MemberCallCstToAst.createSuperPropertyAst(cst, util);
        } else if (cst.name === SlimeParser.prototype.MetaProperty?.name || cst.name === 'MetaProperty') {
            return MemberCallCstToAst.createMetaPropertyAst(cst, util);
        } else if (cst.name === 'NewMemberExpressionArguments') {
            return MemberCallCstToAst.createNewExpressionAst(cst, util);
        } else {
            throw new Error('createMemberExpressionFirstOr: Unsupported type: ' + cst.name);
        }
    }

    static createNewExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const isNewMemberExpr = cst.name === 'NewMemberExpressionArguments';
        const isNewExpr = cst.name === SlimeParser.prototype.NewExpression?.name || cst.name === 'NewExpression';

        if (!isNewMemberExpr && !isNewExpr) {
            throw new Error('createNewExpressionAst: Unsupported type ' + cst.name);
        }

        if (isNewMemberExpr) {
            let newToken: any = undefined;
            let lParenToken: any = undefined;
            let rParenToken: any = undefined;

            const newCst = cst.children![0];
            if (newCst && (newCst.name === 'New' || newCst.value === 'new')) {
                newToken = SlimeTokenCreate.createNewToken(newCst.loc);
            }

            const argsCst = cst.children![2];
            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc);
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc);
                    }
                }
            }

            const calleeExpression = MemberCallCstToAst.createMemberExpressionAst(cst.children![1], util);
            const args = MemberCallCstToAst.createArgumentsAst(cst.children![2], util);

            return SlimeAstUtil.createNewExpression(
                calleeExpression, args, cst.loc,
                newToken, lParenToken, rParenToken
            );
        } else {
            const firstChild = cst.children![0];
            if (firstChild.name === 'New' || firstChild.value === 'new') {
                const newToken = SlimeTokenCreate.createNewToken(firstChild.loc);
                const innerNewExpr = cst.children![1];
                const calleeExpression = MemberCallCstToAst.createNewExpressionAst(innerNewExpr, util);

                return SlimeAstUtil.createNewExpression(
                    calleeExpression, [], cst.loc,
                    newToken, undefined, undefined
                );
            } else {
                return util.createExpressionAst(firstChild);
            }
        }
    }

    static createMemberExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.MemberExpression?.name || 'MemberExpression');

        if (!cst.children || cst.children.length === 0) {
            throw new Error('MemberExpression has no children');
        }

        let current: SlimeExpression;
        let startIdx = 1;

        if (cst.children[0].name === 'New') {
            const newCst = cst.children[0];
            const memberExprCst = cst.children[1];
            const argsCst = cst.children[2];

            const callee = MemberCallCstToAst.createMemberExpressionAst(memberExprCst, util);
            const args = argsCst ? MemberCallCstToAst.createArgumentsAst(argsCst, util) : [];

            const newToken = SlimeTokenCreate.createNewToken(newCst.loc);
            let lParenToken: any = undefined;
            let rParenToken: any = undefined;

            if (argsCst && argsCst.children) {
                for (const child of argsCst.children) {
                    if (child.name === 'LParen' || child.value === '(') {
                        lParenToken = SlimeTokenCreate.createLParenToken(child.loc);
                    } else if (child.name === 'RParen' || child.value === ')') {
                        rParenToken = SlimeTokenCreate.createRParenToken(child.loc);
                    }
                }
            }

            current = {
                type: 'NewExpression',
                callee: callee,
                arguments: args,
                newToken: newToken,
                lParenToken: lParenToken,
                rParenToken: rParenToken,
                loc: cst.loc
            } as any;

            startIdx = 3;
        } else {
            current = MemberCallCstToAst.createMemberExpressionFirstOr(cst.children[0], util) as SlimeExpression;
        }

        for (let i = startIdx; i < cst.children.length; i++) {
            const child = cst.children[i];

            if (child.name === 'DotIdentifier') {
                const dotToken = SlimeTokenCreate.createDotToken(child.children![0].loc);
                let property: SlimeIdentifier | null = null;
                if (child.children![1]) {
                    const identifierNameCst = child.children![1];
                    if (identifierNameCst.name === SlimeParser.prototype.IdentifierName?.name) {
                        const tokenCst = identifierNameCst.children![0];
                        property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
                    } else {
                        property = util.createIdentifierAst(identifierNameCst);
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property as SlimeIdentifier);
            } else if (child.name === 'Dot') {
                const dotToken = SlimeTokenCreate.createDotToken(child.loc);
                const nextChild = cst.children[i + 1];
                let property: SlimeIdentifier | null = null;
                if (nextChild) {
                    if (nextChild.name === SlimeParser.prototype.IdentifierName?.name || nextChild.name === 'IdentifierName') {
                        const tokenCst = nextChild.children![0];
                        property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
                        i++;
                    } else if (nextChild.name === 'PrivateIdentifier') {
                        property = util.createPrivateIdentifierAst(nextChild);
                        i++;
                    }
                }
                current = SlimeAstUtil.createMemberExpression(current, dotToken, property as SlimeIdentifier);
            } else if (child.name === 'BracketExpression') {
                const propertyExpression = util.createExpressionAst(child.children![1]);
                current = {
                    type: SlimeNodeType.MemberExpression,
                    object: current,
                    property: propertyExpression,
                    computed: true,
                    optional: false,
                    loc: cst.loc
                } as any;
            } else if (child.name === 'LBracket') {
                const expressionChild = cst.children[i + 1];
                if (expressionChild) {
                    const propertyExpression = util.createExpressionAst(expressionChild);
                    current = {
                        type: SlimeNodeType.MemberExpression,
                        object: current,
                        property: propertyExpression,
                        computed: true,
                        optional: false,
                        loc: cst.loc
                    } as any;
                    i += 2;
                }
            } else if (child.name === SlimeParser.prototype.Arguments?.name || child.name === 'Arguments') {
                const args = MemberCallCstToAst.createArgumentsAst(child, util);
                current = SlimeAstUtil.createCallExpression(current, args) as SlimeExpression;
            } else if (child.name === SlimeParser.prototype.TemplateLiteral?.name || child.name === 'TemplateLiteral') {
                const quasi = util.createTemplateLiteralAst(child);
                current = {
                    type: 'TaggedTemplateExpression',
                    tag: current,
                    quasi: quasi,
                    loc: cst.loc
                } as any;
            }
        }

        return current;
    }

    static createOptionalExpressionAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        if (!cst.children || cst.children.length === 0) {
            throw new Error('OptionalExpression: no children');
        }

        let result = util.createExpressionAst(cst.children[0]);

        for (let i = 1; i < cst.children.length; i++) {
            const chainCst = cst.children[i];
            if (chainCst.name === 'OptionalChain') {
                result = MemberCallCstToAst.createOptionalChainAst(result, chainCst, util);
            }
        }

        return result;
    }

    static createOptionalChainAst(object: SlimeExpression, chainCst: SubhutiCst, util: SlimeCstToAst): SlimeExpression {
        let result = object;
        let nextIsOptional = false;

        for (const child of chainCst.children!) {
            const name = child.name;

            if (name === 'OptionalChaining' || child.value === '?.') {
                nextIsOptional = true;
                continue;
            } else if (name === 'Arguments') {
                const args = MemberCallCstToAst.createArgumentsAst(child, util);
                result = {
                    type: SlimeNodeType.OptionalCallExpression,
                    callee: result,
                    arguments: args,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any;
                nextIsOptional = false;
            } else if (name === 'LBracket' || child.value === '[') {
                const exprIndex = chainCst.children!.indexOf(child) + 1;
                if (exprIndex < chainCst.children!.length) {
                    const property = util.createExpressionAst(chainCst.children![exprIndex]);
                    result = {
                        type: SlimeNodeType.OptionalMemberExpression,
                        object: result,
                        property: property,
                        computed: true,
                        optional: nextIsOptional,
                        loc: chainCst.loc
                    } as any;
                    nextIsOptional = false;
                }
            } else if (name === 'IdentifierName') {
                const tokenCst = child.children![0];
                const property = SlimeAstUtil.createIdentifier(tokenCst.value as string, tokenCst.loc);
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any;
                nextIsOptional = false;
            } else if (name === 'PrivateIdentifier') {
                const property = util.createPrivateIdentifierAst(child);
                result = {
                    type: SlimeNodeType.OptionalMemberExpression,
                    object: result,
                    property: property,
                    computed: false,
                    optional: nextIsOptional,
                    loc: chainCst.loc
                } as any;
                nextIsOptional = false;
            }
        }

        return result;
    }
}
