import {SubhutiCst} from "subhuti";
import {SlimeJavascriptClassDeclarationCstToAstSingle} from "../../deprecated/slimeJavascriptCstToAst";
import {
    SlimeAstCreateUtils,
    SlimeClassBody, SlimeClassDeclaration, SlimeClassExpression,
    SlimeExpression, SlimeIdentifier,
    SlimeMethodDefinition, SlimeAstTypeName,
    SlimePropertyDefinition, SlimeStatement,
    SlimeTokenCreateUtils, SlimeFunctionParam, SlimeBlockStatement, SlimeFunctionExpression
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
                classToken = SlimeTokenCreateUtils.createClassToken(child.loc)
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

        return SlimeAstCreateUtils.createClassDeclaration(
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
        return SlimeAstCreateUtils.createClassExpression(id, classTail.superClass, classTail.body, cst.loc)
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
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (childName === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
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
                extendsToken = SlimeTokenCreateUtils.createExtendsToken(child.loc)
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
        const ast = SlimeAstCreateUtils.createPropertyDefinition(key, value, isComputed, isStatic || false, cst.loc)
        
        if (typeAnnotation) {
            (ast as any).typeAnnotation = typeAnnotation
        }

        return ast
    }

    /**
     * [TypeScript] 重写 createMethodDefinitionClassElementNameAst
     * 支持返回类型注解
     *
     * MethodDefinition: ClassElementName ( UniqueFormalParameters ) TSTypeAnnotation_opt { FunctionBody }
     */
    override createMethodDefinitionClassElementNameAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        // Token fields
        let staticToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        // 遍历子节点提取各部分
        let classElementNameCst: SubhutiCst | null = null
        let paramsCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'UniqueFormalParameters' || name === SlimeParser.prototype.UniqueFormalParameters?.name ||
                name === 'FormalParameters' || name === SlimeParser.prototype.FormalParameters?.name) {
                paramsCst = child
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                // [TypeScript] 返回类型注解
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('MethodDefinition missing ClassElementName')
        }

        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)

        // 解析参数
        let params: SlimeFunctionParam[] = []
        if (paramsCst) {
            if (paramsCst.name === 'UniqueFormalParameters' || paramsCst.name === SlimeParser.prototype.UniqueFormalParameters?.name) {
                params = SlimeJavascriptCstToAstUtil.createUniqueFormalParametersAstWrapped(paramsCst)
            } else {
                params = SlimeJavascriptCstToAstUtil.createFormalParametersAstWrapped(paramsCst)
            }
        }

        // 解析函数体
        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式
        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, params, false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        // [TypeScript] 添加返回类型
        if (returnType) {
            functionExpression.returnType = returnType
        }

        // 检查属性
        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isConstructor = (key as any).type === "Identifier" && (key as any).name === "constructor" &&
            !SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)
        const kind = isConstructor ? 'constructor' : 'method' as "constructor" | "method" | "get" | "set"

        return SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
    }

    /**
     * [TypeScript] 重写 createMethodDefinitionGetterMethodAst
     * 支持返回类型注解
     */
    override createMethodDefinitionGetterMethodAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimeMethodDefinition {
        const children = cst.children

        let staticToken: any = undefined
        let getToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        let returnType: any = undefined

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreateUtils.createStaticToken(staticCst.loc)
        }

        let classElementNameCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'Get' || child.value === 'get') {
                getToken = SlimeTokenCreateUtils.createGetToken(child.loc)
            } else if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreateUtils.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreateUtils.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(child.loc)
            } else if (name === 'FunctionBody' || name === SlimeParser.prototype.FunctionBody?.name) {
                bodyCst = child
            } else if (name === 'TSTypeAnnotation') {
                returnType = SlimeIdentifierCstToAst.createTSTypeAnnotationAst(child)
            }
        }

        if (!classElementNameCst) {
            throw new Error('Getter missing ClassElementName')
        }

        const key = SlimeJavascriptCstToAstUtil.createClassElementNameAst(classElementNameCst)

        let body: SlimeBlockStatement
        if (bodyCst) {
            const bodyStatements = SlimeJavascriptCstToAstUtil.createFunctionBodyAst(bodyCst)
            body = SlimeAstCreateUtils.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstCreateUtils.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstCreateUtils.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        if (returnType) {
            functionExpression.returnType = returnType
        }

        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        const methodDef = SlimeAstCreateUtils.createMethodDefinition(key as any, functionExpression, 'get', isComputed, isStatic, cst.loc, staticToken)
        ;(methodDef as any).getToken = getToken

        return methodDef
    }
}

export const SlimeClassDeclarationCstToAst = new SlimeClassDeclarationCstToAstSingle()

