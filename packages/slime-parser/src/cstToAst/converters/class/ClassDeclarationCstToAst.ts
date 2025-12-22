import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeClassDeclaration, SlimeClassExpression, SlimeClassBody, SlimeExpression, SlimeIdentifier } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 类声明 CST 到 AST 转换器
 * 
 * 负责处理：
 * - ClassDeclaration: 类声明
 * - ClassExpression: 类表达式
 * - ClassTail: 类尾部（继承和类体）
 * - ClassHeritage: 类继承
 */
export class ClassDeclarationCstToAst {

    /**
     * 创建 ClassDeclaration AST
     */
    static createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        // 检查 CST 节点名称是否为 ClassDeclaration
        const astName = checkCstName(cst, SlimeParser.prototype.ClassDeclaration?.name);

        // Token fields
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点，提取 class token、标识符和 ClassTail
        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        // ClassTail 是必须的
        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        // 解析 ClassTail，获取类体和父类信息
        const classTailResult = this.createClassTailAst(classTailCst)

        // 创建类声明 AST 节点（id 可能为 null，用于匿名类）
        const ast = SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )

        return ast
    }


    /**
     * 创建 ClassExpression AST
     */
    static createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassExpression?.name);

        let id: SlimeIdentifier | null = null // class 表达式可选的标识符
        let tailStartIndex = 1 // 默认 ClassTail 位于索引 1
        const nextChild = cst.children[1]
        if (nextChild && nextChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(nextChild) // 若存在标识符则解析
            tailStartIndex = 2 // ClassTail 的位置后移
        }
        const classTail = this.createClassTailAst(cst.children[tailStartIndex]) // 统一解析 ClassTail

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc) // 生成 ClassExpression AST
    }

    /**
     * 创建 ClassTail AST
     */
    static createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassTail?.name);
        let superClass: SlimeExpression | null = null // 超类默认为 null
        let body: SlimeClassBody = { type: SlimeNodeType.ClassBody as any, body: [], loc: cst.loc } // 默认空类体
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ClassTail = ClassHeritage? { ClassBody? }
        // 遍历 children 找到 ClassHeritage 和 ClassBody
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.ClassHeritage?.name) {
                const heritageResult = this.createClassHeritageAstWithToken(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (child.name === SlimeParser.prototype.ClassBody?.name) {
                body = SlimeCstToAstUtil.createClassBodyAst(child)
            } else if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        // 设置 body 的 brace tokens
        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return { superClass, body, extendsToken, lBraceToken, rBraceToken }
    }

    /**
     * 创建 ClassHeritage AST
     */
    static createClassHeritageAst(cst: SubhutiCst): SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        return SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1]) // ClassHeritage -> extends + LeftHandSideExpression
    }

    /**
     * 创建 ClassHeritage AST（带 token）
     */
    static createClassHeritageAstWithToken(cst: SubhutiCst): { superClass: SlimeExpression; extendsToken?: any } {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassHeritage?.name);
        let extendsToken: any = undefined

        // ClassHeritage: extends LeftHandSideExpression
        const extendsCst = cst.children.find(ch => ch.name === 'Extends' || ch.value === 'extends')
        if (extendsCst) {
            extendsToken = SlimeTokenCreate.createExtendsToken(extendsCst.loc)
        }

        const superClass = SlimeCstToAstUtil.createLeftHandSideExpressionAst(cst.children[1])
        return { superClass, extendsToken }
    }
}
