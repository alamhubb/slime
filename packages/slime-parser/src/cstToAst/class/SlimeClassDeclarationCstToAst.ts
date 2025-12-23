import {SubhutiCst} from "subhuti";
import {SlimeJavascriptClassDeclarationCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";
import {
    SlimeAstUtil,
    SlimeClassBody, SlimeClassDeclaration, SlimeClassExpression,
    SlimeExpression, SlimeIdentifier,
    SlimeMethodDefinition, SlimeAstTypeName,
    SlimePropertyDefinition, SlimeStatement,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeJavascriptCstToAstUtil from "../../deprecated/SlimeJavascriptCstToAstUtil.ts";
import { SlimeIdentifierCstToAst } from "../identifier/SlimeIdentifierCstToAst.ts";

/**
 * SlimeClassDeclarationCstToAst - TypeScript 类声明 CST-to-AST 转换
 * 
 * 设计原则：采用 override 重写父类方法，而不是新建类型
 * - ClassTail (override) 而不是 TSClassTail (new)
 * - ClassHeritage (override) 而不是 TSClassExtends (new)
 * 
 * 这样 CST 节点名称保持一致，只是内部结构扩展了 TypeScript 特性
 */
export class SlimeClassDeclarationCstToAstSingle extends SlimeJavascriptClassDeclarationCstToAstSingle{

    /**
     * [TypeScript] 重写 createClassDeclarationAst
     * 支持泛型参数和 implements（通过重写的 ClassTail）
     */
    override createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
            // TSTypeParameterDeclaration 当前忽略（ESTree 不支持泛型参数）
        }

        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail')
        }

        const classTailResult = this.createClassTailAst(classTailCst)

        return SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )
    }

    /**
     * [TypeScript] 重写 createClassExpressionAst
     */
    override createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        for (const child of cst.children) {
            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail') {
                classTailCst = child
            }
        }

        if (!classTailCst) {
            throw new Error('ClassExpression missing ClassTail')
        }

        const classTail = this.createClassTailAst(classTailCst)
        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
    }

    /**
     * [TypeScript] 重写 createClassTailAst
     * 
     * ClassTail 结构（TypeScript 扩展）：
     *   ClassHeritage_opt TSClassImplements_opt { ClassBody_opt }
     * 
     * ClassHeritage 已被重写以支持类型参数
     * TSClassImplements 是 TypeScript 特有的（JavaScript 没有 implements）
     */
    override createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        let superClass: SlimeExpression | null = null
        let body: SlimeClassBody = { type: SlimeAstTypeName.ClassBody as any, body: [], loc: cst.loc }
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children) {
            const childName = child.name
            if (childName === 'ClassHeritage' || childName === SlimeParser.prototype.ClassHeritage?.name) {
                // ClassHeritage: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
                const heritageResult = this.createClassHeritageAst(child)
                superClass = heritageResult.superClass
                extendsToken = heritageResult.extendsToken
            } else if (childName === 'TSClassImplements') {
                // TODO: 处理 implements 子句（当前忽略，ESTree 不支持）
            } else if (childName === 'ClassBody' || childName === SlimeParser.prototype.ClassBody?.name) {
                body = SlimeJavascriptCstToAstUtil.createClassBodyAst(child)
            } else if (childName === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (childName === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        if (body) {
            body.lBraceToken = lBraceToken
            body.rBraceToken = rBraceToken
        }

        return { superClass, body, extendsToken, lBraceToken, rBraceToken }
    }

    /**
     * [TypeScript] 重写 createClassHeritageAst
     * 
     * ClassHeritage: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
     */
    private createClassHeritageAst(cst: SubhutiCst): {
        superClass: SlimeExpression;
        extendsToken: any;
    } {
        let extendsToken: any = undefined
        let superClass: SlimeExpression | null = null

        for (const child of cst.children) {
            const childName = child.name
            if (childName === 'Extends' || child.value === 'extends') {
                extendsToken = SlimeTokenCreate.createExtendsToken(child.loc)
            } else if (childName === 'LeftHandSideExpression' || 
                       childName === SlimeParser.prototype.LeftHandSideExpression?.name) {
                superClass = SlimeJavascriptCstToAstUtil.createLeftHandSideExpressionAst(child)
            }
            // TSTypeParameterInstantiation 当前忽略（ESTree 不支持泛型参数）
        }

        if (!superClass) {
            throw new Error('ClassHeritage missing LeftHandSideExpression')
        }

        return { superClass, extendsToken }
    }

    /**
     * [TypeScript] 重写 createFieldDefinitionAst 以支持类型注解
     * 
     * FieldDefinition: ClassElementName TSTypeAnnotation_opt Initializer_opt
     */
    override createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const elementNameCst = cst.children[0]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(elementNameCst)
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(elementNameCst)

        let typeAnnotation: any = undefined
        let value: SlimeExpression | null = null

        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]
            const childName = child.name
            
            if (childName === 'TSTypeAnnotation') {
                typeAnnotation = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            } else if (childName === 'Initializer' || 
                       childName === SlimeParser.prototype.Initializer?.name) {
                value = SlimeJavascriptCstToAstUtil.createInitializerAst(child)
            }
        }

        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const ast = SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
        
        if (typeAnnotation) {
            (ast as any).typeAnnotation = typeAnnotation
        }

        return ast
    }
}

export const SlimeClassDeclarationCstToAst = new SlimeClassDeclarationCstToAstSingle()

