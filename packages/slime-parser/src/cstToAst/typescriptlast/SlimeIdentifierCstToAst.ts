/**
 * IdentifierCstToAst - 标识符相关转换
 */
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeClassBody, SlimeFunctionParam,
    SlimeIdentifier,
    SlimeMethodDefinition, SlimePattern,
    SlimePropertyDefinition,
    SlimeStatement,
    SlimeAstTypeName,
    SlimeTokenCreateUtils,
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import { SlimeVariableCstToAstSingle } from "../statements/SlimeVariableCstToAst.ts";
import { SlimeJavascriptIdentifierCstToAstSingle } from "../../deprecated/slimeJavascriptCstToAst";
import SlimeJavascriptCstToAstUtil from "../../deprecated/SlimeJavascriptCstToAstUtil.ts";
import { SlimeJavascriptCreateUtils } from "slime-ast";

export class SlimeIdentifierCstToAstSingle extends SlimeJavascriptIdentifierCstToAstSingle {

    /**
     * [TypeScript] 重写 createBindingIdentifierAst 以支持可选的类型注解
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const children = cst.children || []
        const first = children[0]

        let identifier: SlimeIdentifier

        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                identifier = SlimeJavascriptCreateUtils.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                throw new Error(`createBindingIdentifierAst: Cannot extract value from Identifier`)
            }
        } else if (first.value !== undefined) {
            identifier = SlimeJavascriptCreateUtils.createIdentifier(first.value, first.loc)
        } else {
            throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
        }

        // [TypeScript] 检查是否有类型注解
        const tsTypeAnnotationName = SlimeParser.prototype.TSTypeAnnotation?.name || 'TSTypeAnnotation'
        const typeAnnotationCst = children.find(child =>
            child.name === tsTypeAnnotationName || child.name === 'TSTypeAnnotation'
        )
        if (typeAnnotationCst) {
            identifier.typeAnnotation = this.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
    }


    /**
     * [TypeScript] 转换 TSModuleDeclaration CST 为 AST
     * namespace A.B.C { } / module "name" { }
     */
    createTSModuleDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        let id: any = undefined
        let body: any = undefined
        let declare = false
        let global = false

        // 检查是否是 namespace 或 module
        const isNamespace = children.some(c => c.value === 'namespace')
        const isModule = children.some(c => c.value === 'module')

        // 找到模块标识符
        const moduleIdCst = children.find(c => c.name === 'TSModuleIdentifier')
        if (moduleIdCst) {
            id = this.createTSModuleIdentifierAst(moduleIdCst)
        } else {
            // 可能是字符串字面量模块名 module "name"
            const stringCst = children.find(c => c.name === 'StringLiteral')
            if (stringCst) {
                const tokenCst = stringCst.children?.[0] || stringCst
                id = {
                    type: 'Literal',
                    value: tokenCst.value,
                    raw: tokenCst.value,
                    loc: tokenCst.loc,
                }
            }
        }

        // 找到模块体
        const moduleBlockCst = children.find(c => c.name === 'TSModuleBlock')
        if (moduleBlockCst) {
            body = this.createTSModuleBlockAst(moduleBlockCst)
        }

        return {
            type: SlimeAstTypeName.TSModuleDeclaration,
            id,
            body,
            declare,
            global,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSModuleIdentifier CST 为 AST
     * 支持点分隔的嵌套命名空间 A.B.C
     */
    createTSModuleIdentifierAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const nameParts: string[] = []

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                if (tokenCst.value) {
                    nameParts.push(tokenCst.value)
                }
            }
        }

        if (nameParts.length === 0) {
            throw new Error('TSModuleIdentifier: no identifier found')
        }

        // 对于嵌套命名空间 A.B.C，返回第一个标识符
        // 嵌套部分会在 body 中递归处理
        return {
            type: 'Identifier',
            name: nameParts.join('.'),
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSModuleBlock CST 为 AST
     */
    createTSModuleBlockAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const body: any[] = []

        for (const child of children) {
            if (child.name === 'ModuleItem') {
                body.push(SlimeCstToAstUtil.createModuleItemAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSModuleBlock,
            body,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSDeclareStatement CST 为 AST
     * declare const/let/var/function/class/namespace/module/global
     */
    createTSDeclareStatementAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 检查声明类型
        const hasConst = children.some(c => c.name === 'Const' || c.value === 'const')
        const hasLet = children.some(c => c.name === 'Let' || c.value === 'let')
        const hasVar = children.some(c => c.name === 'Var' || c.value === 'var')
        const hasFunction = children.some(c => c.name === 'Function' || c.value === 'function')
        const hasClass = children.some(c => c.name === 'Class' || c.value === 'class')
        const hasNamespace = children.some(c => c.name === 'TSModuleDeclaration')
        const hasGlobal = children.some(c => c.value === 'global')

        if (hasConst || hasLet || hasVar) {
            // declare const/let/var x: Type
            const kind = hasConst ? 'const' : hasLet ? 'let' : 'var'
            const identifierCst = children.find(c => c.name === 'BindingIdentifier')
            const typeAnnotationCst = children.find(c => c.name === 'TSTypeAnnotation')
            
            let id: any = undefined
            if (identifierCst) {
                id = this.createBindingIdentifierAst(identifierCst)
            }

            return {
                type: 'VariableDeclaration',
                kind,
                declarations: [{
                    type: 'VariableDeclarator',
                    id,
                    init: null,
                    loc: cst.loc,
                }],
                declare: true,
                loc: cst.loc,
            }
        }

        if (hasFunction) {
            // declare function name(): Type
            const identifierCst = children.find(c => c.name === 'Identifier')
            const typeParamsCst = children.find(c => c.name === 'TSTypeParameterDeclaration')
            const formalParamsCst = children.find(c => c.name === 'FormalParameters')
            const returnTypeCst = children.find(c => c.name === 'TSTypeAnnotation')

            let id: any = undefined
            if (identifierCst) {
                const tokenCst = identifierCst.children?.[0] || identifierCst
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            }

            return {
                type: 'TSDeclareFunction',
                id,
                params: formalParamsCst ? SlimeCstToAstUtil.createFormalParametersAst(formalParamsCst) : [],
                typeParameters: typeParamsCst ? this.createTSTypeParameterDeclarationAst(typeParamsCst) : undefined,
                returnType: returnTypeCst ? this.createTSTypeAnnotationAst(returnTypeCst) : undefined,
                declare: true,
                loc: cst.loc,
            }
        }

        if (hasClass) {
            // declare class Name { }
            const identifierCst = children.find(c => c.name === 'Identifier')
            const typeParamsCst = children.find(c => c.name === 'TSTypeParameterDeclaration')
            const classTailCst = children.find(c => c.name === 'ClassTail')

            let id: any = undefined
            if (identifierCst) {
                const tokenCst = identifierCst.children?.[0] || identifierCst
                id = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            }

            return {
                type: 'ClassDeclaration',
                id,
                typeParameters: typeParamsCst ? this.createTSTypeParameterDeclarationAst(typeParamsCst) : undefined,
                body: classTailCst ? SlimeCstToAstUtil.createClassTailAst(classTailCst) : { type: 'ClassBody', body: [] },
                declare: true,
                loc: cst.loc,
            }
        }

        if (hasNamespace) {
            // declare namespace/module
            const moduleCst = children.find(c => c.name === 'TSModuleDeclaration')
            if (moduleCst) {
                const result = this.createTSModuleDeclarationAst(moduleCst)
                result.declare = true
                return result
            }
        }

        if (hasGlobal) {
            // declare global { }
            const moduleBlockCst = children.find(c => c.name === 'TSModuleBlock')
            return {
                type: SlimeAstTypeName.TSModuleDeclaration,
                id: { type: 'Identifier', name: 'global', loc: cst.loc },
                body: moduleBlockCst ? this.createTSModuleBlockAst(moduleBlockCst) : undefined,
                declare: true,
                global: true,
                loc: cst.loc,
            }
        }

        throw new Error(`TSDeclareStatement: unsupported declaration type`)
    }
}

export const SlimeIdentifierCstToAst = new SlimeIdentifierCstToAstSingle()
