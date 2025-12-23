/**
 * SlimeMethodDefinitionCstToAst - TypeScript 方法定义 CST-to-AST 转换
 * 
 * 设计原则：采用 override 重写父类方法
 * 支持 TypeScript 方法返回类型注解
 */
import { SubhutiCst } from "subhuti";
import { SlimeJavascriptMethodDefinitionCstToAstSingle } from "../../deprecated/slimeJavascriptCstToAst";
import {
    SlimeAstUtil,
    SlimeBlockStatement,
    SlimeFunctionExpression,
    SlimeFunctionParam,
    SlimeMethodDefinition,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeJavascriptCstToAstUtil from "../../deprecated/SlimeJavascriptCstToAstUtil.ts";
import { SlimeIdentifierCstToAst } from "../identifier/SlimeIdentifierCstToAst.ts";

export class SlimeMethodDefinitionCstToAstSingle extends SlimeJavascriptMethodDefinitionCstToAstSingle {

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
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
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
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
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
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        // 创建函数表达式
        const functionExpression = SlimeAstUtil.createFunctionExpression(
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

        return SlimeAstUtil.createMethodDefinition(key as any, functionExpression, kind, isComputed, isStatic, cst.loc, staticToken)
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
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc)
        }

        let classElementNameCst: SubhutiCst | null = null
        let bodyCst: SubhutiCst | null = null

        for (const child of children) {
            const name = child.name
            if (name === 'Get' || child.value === 'get') {
                getToken = SlimeTokenCreate.createGetToken(child.loc)
            } else if (name === 'ClassElementName' || name === SlimeParser.prototype.ClassElementName?.name) {
                classElementNameCst = child
            } else if (name === 'LParen' || child.value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            } else if (name === 'RParen' || child.value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            } else if (name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
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
            body = SlimeAstUtil.createBlockStatement(bodyStatements, cst.loc, lBraceToken, rBraceToken)
        } else {
            body = SlimeAstUtil.createBlockStatement([], undefined, lBraceToken, rBraceToken)
        }

        const functionExpression = SlimeAstUtil.createFunctionExpression(
            body, null, [], false, false, cst.loc,
            undefined, undefined, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        ) as SlimeFunctionExpression & { returnType?: any }

        if (returnType) {
            functionExpression.returnType = returnType
        }

        const isComputed = SlimeJavascriptCstToAstUtil.isComputedPropertyName(classElementNameCst)
        const isStatic = SlimeJavascriptCstToAstUtil.isStaticModifier(staticCst)

        const methodDef = SlimeAstUtil.createMethodDefinition(key as any, functionExpression, 'get', isComputed, isStatic, cst.loc, staticToken)
        ;(methodDef as any).getToken = getToken

        return methodDef
    }
}

export const SlimeMethodDefinitionCstToAst = new SlimeMethodDefinitionCstToAstSingle()
