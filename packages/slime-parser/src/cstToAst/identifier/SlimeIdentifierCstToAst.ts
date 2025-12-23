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
    SlimeJavascriptCreateUtils,
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";

export class SlimeIdentifierCstToAstSingle {

    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier {
        // IdentifierName 可能�?
        // 1. 直接�?value �?token
        // 2. 包含子节点的规则节点

        // 如果直接�?value，使用它
        if (cst.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(cst.value as string)
            return SlimeAstCreateUtils.createIdentifier(decodedName, cst.loc)
        }

        // 否则递归查找 value
        let current = cst
        while (current.children && current.children.length > 0 && current.value === undefined) {
            current = current.children[0]
        }

        if (current.value !== undefined) {
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(current.value as string)
            return SlimeAstCreateUtils.createIdentifier(decodedName, current.loc || cst.loc)
        }

        throw new Error(`createIdentifierNameAst: Cannot extract value from IdentifierName`)
    }


    /**
     * [TypeScript] createBindingIdentifierAst 支持可选的类型注解
     */
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
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
            (identifier as any).typeAnnotation = SlimeCstToAstUtil.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
    }


    /**
     * [AST 类型映射] PrivateIdentifier 终端�?�?Identifier AST
     *
     * 存在必要性：PrivateIdentifier �?CST 中是一个终端符（token），
     * 但在 ESTree AST 中需要表示为 Identifier 节点，name �?# 开头�?
     *
     * PrivateIdentifier :: # IdentifierName
     * AST 表示：{ type: "Identifier", name: "#count" }
     */
    createPrivateIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Es2025Parser: PrivateIdentifier 是一个直接的 token，value 已经包含 #
        // 例如：{ name: 'PrivateIdentifier', value: '#count' } �?value: '#\u{61}'
        if (cst.value) {
            const rawName = cst.value as string
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
            // 保存原始值和解码后的�?
            const name = decodedName.startsWith('#') ? decodedName : '#' + decodedName
            const raw = rawName.startsWith('#') ? rawName : '#' + rawName
            const identifier = SlimeAstCreateUtils.createIdentifier(name, cst.loc)
            // 如果原始值与解码值不同，保存 raw 以便生成器使�?
            if (raw !== name) {
                (identifier as any).raw = raw
            }
            return identifier
        }

        // 旧版兼容：PrivateIdentifier -> HashTok + IdentifierName
        if (cst.children && cst.children.length >= 2) {
            const identifierNameCst = cst.children[1]
            const identifierCst = identifierNameCst.children[0]
            const rawName = identifierCst.value as string
            const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
            const identifier = SlimeAstCreateUtils.createIdentifier('#' + decodedName)
            // 保存原始�?
            if (rawName !== decodedName) {
                (identifier as any).raw = '#' + rawName
            }
            return identifier
        }

        // 如果只有一个子节点，可能是直接�?IdentifierName
        if (cst.children && cst.children.length === 1) {
            const child = cst.children[0]
            if (child.value) {
                const rawName = child.value as string
                const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(rawName)
                const identifier = SlimeAstCreateUtils.createIdentifier('#' + decodedName)
                if (rawName !== decodedName) {
                    (identifier as any).raw = '#' + rawName
                }
                return identifier
            }
        }

        throw new Error('createPrivateIdentifierAst: 无法解析 PrivateIdentifier')
    }

    /**
     * 创建 LabelIdentifier �?AST
     *
     * 语法：LabelIdentifier -> Identifier | [~Yield] yield | [~Await] await
     *
     * LabelIdentifier 用于 break/continue 语句的标签和 LabelledStatement 的标签�?
     * 结构�?IdentifierReference 相同�?
     */
    createLabelIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.LabelIdentifier?.name || 'LabelIdentifier'
        if (cst.name !== expectedName && cst.name !== 'LabelIdentifier') {
            throw new Error(`Expected LabelIdentifier, got ${cst.name}`)
        }

        // LabelIdentifier -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('LabelIdentifier has no children')
        }

        return SlimeCstToAstUtil.createIdentifierAst(child)
    }


    /**
     * 创建 IdentifierReference �?AST
     *
     * 语法：IdentifierReference -> Identifier | yield | await
     *
     * IdentifierReference 是对 Identifier 的引用包装，
     * �?ES 规范中用于区分标识符的不同使用场景�?
     */
    createIdentifierReferenceAst(cst: SubhutiCst): SlimeIdentifier {
        const expectedName = SlimeParser.prototype.IdentifierReference?.name || 'IdentifierReference'
        if (cst.name !== expectedName && cst.name !== 'IdentifierReference') {
            throw new Error(`Expected IdentifierReference, got ${cst.name}`)
        }

        // IdentifierReference -> Identifier | yield | await
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('IdentifierReference has no children')
        }

        return SlimeCstToAstUtil.createIdentifierAst(child)
    }


    createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        // Support Identifier, IdentifierName, and contextual keywords (yield, await) used as identifiers
        const expectedName = SlimeParser.prototype.Identifier?.name || 'Identifier'
        const isIdentifier = cst.name === expectedName || cst.name === 'Identifier'
        const isIdentifierName = cst.name === 'IdentifierName' || cst.name === SlimeParser.prototype.IdentifierName?.name
        const isYield = cst.name === 'Yield'
        const isAwait = cst.name === 'Await'

        // ES2025 Parser: Identifier 规则内部调用 IdentifierNameTok()
        // 所�?CST 结构是：Identifier -> IdentifierNameTok (token with value)
        let value: string
        let tokenLoc: SubhutiSourceLocation | undefined = undefined

        // 处理 yield/await 作为标识符的情况
        if (isYield || isAwait) {
            // 这是一�?token，直接使用其�?
            value = cst.value as string || cst.name.toLowerCase()
            tokenLoc = cst.loc
        } else if (isIdentifierName) {
            // IdentifierName 结构：IdentifierName -> token (with value)
            if (cst.value !== undefined && cst.value !== null) {
                value = cst.value as string
                tokenLoc = cst.loc
            } else if (cst.children && cst.children.length > 0) {
                const tokenCst = cst.children[0]
                if (tokenCst.value !== undefined) {
                    value = tokenCst.value as string
                    tokenLoc = tokenCst.loc || cst.loc
                } else {
                    throw new Error(`createIdentifierAst: Cannot extract value from IdentifierName CST`)
                }
            } else {
                throw new Error(`createIdentifierAst: Invalid IdentifierName CST structure`)
            }
        } else if (!isIdentifier) {
            throw new Error(`Expected Identifier, got ${cst.name}`)
        } else if (cst.value !== undefined && cst.value !== null) {
            // 直接�?token（旧版兼容）
            value = cst.value as string
            tokenLoc = cst.loc
        } else if (cst.children && cst.children.length > 0) {
            // ES2025: Identifier 规则，子节点�?IdentifierNameTok
            const tokenCst = cst.children[0]
            if (tokenCst.value !== undefined) {
                value = tokenCst.value as string
                tokenLoc = tokenCst.loc || cst.loc
            } else {
                throw new Error(`createIdentifierAst: Cannot extract value from Identifier CST`)
            }
        } else {
            throw new Error(`createIdentifierAst: Invalid Identifier CST structure`)
        }

        // 解码 Unicode 转义序列（如 \u0061 -> a�?
        const decodedName = SlimeCstToAstUtil.decodeUnicodeEscapes(value)
        // 使用 token �?loc（包含原始值），而不是规则的 loc
        const identifier = SlimeAstCreateUtils.createIdentifier(decodedName, tokenLoc || cst.loc)
        return identifier
    }

    // ============================================
    // TypeScript 模块声明相关方法
    // ============================================

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
                typeParameters: typeParamsCst ? SlimeCstToAstUtil.createTSTypeParameterDeclarationAst(typeParamsCst) : undefined,
                returnType: returnTypeCst ? SlimeCstToAstUtil.createTSTypeAnnotationAst(returnTypeCst) : undefined,
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
                typeParameters: typeParamsCst ? SlimeCstToAstUtil.createTSTypeParameterDeclarationAst(typeParamsCst) : undefined,
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
