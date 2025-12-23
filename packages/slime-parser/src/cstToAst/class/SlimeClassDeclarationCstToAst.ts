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
 * ClassDeclarationCstToAst - class body/element 转换
 * 
 * [TypeScript] 重写以支持 TSClassTail（包含类型参数、implements 等）
 */
export class SlimeClassDeclarationCstToAstSingle extends SlimeJavascriptClassDeclarationCstToAstSingle{

    /**
     * [TypeScript] 重写 createClassDeclarationAst 以支持 TSClassTail
     */
    override createClassDeclarationAst(cst: SubhutiCst): SlimeClassDeclaration {
        // Token fields
        let classToken: any = undefined
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点，提取 class token、标识符和 ClassTail/TSClassTail
        for (const child of cst.children) {
            const name = child.name
            if (name === 'Class' || child.value === 'class') {
                classToken = SlimeTokenCreate.createClassToken(child.loc)
            } else if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail' ||
                       name === 'TSClassTail') {
                // [TypeScript] 支持 TSClassTail
                classTailCst = child
            }
        }

        // ClassTail/TSClassTail 是必须的
        if (!classTailCst) {
            throw new Error('ClassDeclaration missing ClassTail or TSClassTail')
        }

        // 解析 ClassTail，获取类体和父类信息
        const classTailResult = this.createClassTailAst(classTailCst)

        // 创建类声明 AST 节点
        const ast = SlimeAstUtil.createClassDeclaration(
            id, classTailResult.body, classTailResult.superClass, cst.loc,
            classToken, classTailResult.extendsToken
        )

        return ast
    }

    /**
     * [TypeScript] 重写 createClassExpressionAst 以支持 TSClassTail
     */
    override createClassExpressionAst(cst: SubhutiCst): SlimeClassExpression {
        let id: SlimeIdentifier | null = null
        let classTailCst: SubhutiCst | null = null

        // 遍历子节点
        for (const child of cst.children) {
            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.ClassTail?.name || name === 'ClassTail' ||
                       name === 'TSClassTail') {
                classTailCst = child
            }
        }

        if (!classTailCst) {
            throw new Error('ClassExpression missing ClassTail or TSClassTail')
        }

        const classTail = this.createClassTailAst(classTailCst)

        return SlimeAstUtil.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
    }

    /**
     * [TypeScript] 重写 createClassTailAst 以支持 TSClassTail
     * 
     * TSClassTail 与 ClassTail 的区别：
     * - ClassTail: ClassHeritage_opt { ClassBody_opt }
     * - TSClassTail: TSClassExtends_opt TSClassImplements_opt { ClassBody_opt }
     * 
     * TSClassExtends 比 ClassHeritage 多了可选的类型参数 <T>
     * TSClassImplements 是 TypeScript 特有的 implements 子句
     */
    override createClassTailAst(cst: SubhutiCst): {
        superClass: SlimeExpression | null;
        body: SlimeClassBody;
        extendsToken?: any;
        lBraceToken?: any;
        rBraceToken?: any;
    } {
        const name = cst.name
        
        // 如果是原始的 ClassTail，调用父类方法
        if (name === 'ClassTail' || name === SlimeParser.prototype.ClassTail?.name) {
            return super.createClassTailAst(cst)
        }
        
        // 处理 TSClassTail
        let superClass: SlimeExpression | null = null
        let body: SlimeClassBody = { type: SlimeAstTypeName.ClassBody as any, body: [], loc: cst.loc }
        let extendsToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // TSClassTail = TSClassExtends_opt TSClassImplements_opt { ClassBody_opt }
        for (const child of cst.children) {
            const childName = child.name
            if (childName === 'TSClassExtends') {
                // TSClassExtends: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
                const extendsResult = this.createTSClassExtendsAst(child)
                superClass = extendsResult.superClass
                extendsToken = extendsResult.extendsToken
            } else if (childName === 'TSClassImplements') {
                // TODO: 处理 implements 子句（当前忽略，因为 ESTree 不支持）
            } else if (childName === 'ClassBody' || childName === SlimeParser.prototype.ClassBody?.name) {
                body = SlimeJavascriptCstToAstUtil.createClassBodyAst(child)
            } else if (childName === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (childName === 'RBrace' || child.value === '}') {
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
     * [TypeScript] 处理 TSClassExtends
     * 
     * TSClassExtends: extends LeftHandSideExpression TSTypeParameterInstantiation_opt
     */
    private createTSClassExtendsAst(cst: SubhutiCst): {
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
            throw new Error('TSClassExtends missing LeftHandSideExpression')
        }

        return { superClass, extendsToken }
    }

    /**
     * [TypeScript] 重写 createFieldDefinitionAst 以支持类型注解
     * 
     * FieldDefinition: ClassElementName TSTypeAnnotation_opt Initializer_opt
     */
    override createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        // FieldDefinition -> ClassElementName + TSTypeAnnotation? + Initializer?
        const elementNameCst = cst.children[0]
        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(elementNameCst)

        // 检查是否是计算属性
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(elementNameCst)

        // 检查是否有类型注解和初始化器
        let typeAnnotation: any = undefined
        let value: SlimeExpression | null = null

        for (let i = 1; i < cst.children.length; i++) {
            const child = cst.children[i]
            const childName = child.name
            
            if (childName === 'TSTypeAnnotation') {
                // [TypeScript] 处理类型注解
                typeAnnotation = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            } else if (childName === 'Initializer' || 
                       childName === SlimeParser.prototype.Initializer?.name) {
                value = SlimeJavascriptCstToAstUtil.createInitializerAst(child)
            }
        }

        // 检查是否有 static 修饰符
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        // 创建 PropertyDefinition AST
        const ast = SlimeAstUtil.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
        
        // [TypeScript] 添加类型注解
        if (typeAnnotation) {
            (ast as any).typeAnnotation = typeAnnotation
        }

        return ast
    }
}

export const SlimeClassDeclarationCstToAst = new SlimeClassDeclarationCstToAstSingle()

