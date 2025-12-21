import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    type SlimeClassBody,
    SlimeClassDeclaration,
    type SlimeExpression,
    SlimeIdentifier,
    SlimeNodeType,
    SlimeTokenCreate,
    type SlimeClassExpression
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { checkCstName, getUtil } from "../core/CstToAstContext";

import { ClassBodyCstToAst } from "./ClassBodyCstToAst";

/**
 * 类相关的 CST to AST 转换 - 入口文件
 * 处理 ClassDeclaration 和 ClassExpression
 */
export class ClassCstToAst {
    /**
     * ClassDeclaration CST 到 AST
     */
    static createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        let classToken: any = undefined;
        let id: SlimeIdentifier | null = null;
        let classTailCst: SubhutiCst | null = null;

        for (const child of cst.children) {
            const name = child.name;
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc);
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child);
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child;
            }
        }

        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail');
        }

        const classTailResult = ClassCstToAst.createClassTailAst(classTailCst);

        return SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        );
    }

    /**
     * ClassExpression CST 到 AST
     */
    static createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null;
        let tailStartIndex = 1;
        const nextChild = cst.children[1];
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = getUtil().createBindingIdentifierAst(nextChild);
            tailStartIndex = 2;
        }
        const classTail = ClassCstToAst.createClassTailAst(cst.children[tailStartIndex]);

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc);
    }

    /**
     * ClassTail CST 到 AST
     * ClassTail = ClassHeritage? { ClassBody? }
     */
    static createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null;
        let body: SlimeClassBody = { type: SlimeNodeType.ClassBody as any, body: [], loc: cst.loc };
        let extendsToken: any = undefined;
        let lBraceToken: any = undefined;
        let rBraceToken: any = undefined;

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = ClassCstToAst.createClassHeritageAstWithToken(child);
                superClass = heritageResult.superClass;
                extendsToken = heritageResult.extendsToken;
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = ClassBodyCstToAst.createClassBodyAst(child);
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc);
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc);
            }
        }

        if (body) {
            body.lBraceToken = lBraceToken;
            body.rBraceToken = rBraceToken;
        }

        return { superClass, body, extendsToken, lBraceToken, rBraceToken };
    }

    /**
     * ClassHeritage CST 到 AST
     */
    static createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return getUtil().createLeftHandSideExpressionAst(cst.children[1]);
    }

    /**
     * ClassHeritage CST 到 AST (带 token)
     */
    static createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined;

        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends');
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc);
        }

        const superClass = getUtil().createLeftHandSideExpressionAst(cst.children[1]);
        return { superClass, extendsToken };
    }
}
