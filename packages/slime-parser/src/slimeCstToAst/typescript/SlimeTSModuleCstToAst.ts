import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstCreateUtils,
    SlimeAstTypeName,
    SlimeJavascriptCreateUtils,
    SlimeJavascriptProgram,
    SlimeJavascriptTokenCreateUtils
} from "SlimeJavascript-ast";
import {SlimeJavascriptExportCstToAst} from "../module/SlimeJavascriptExportCstToAst.ts";
import {SlimeJavascriptTSFunctionTypeCstToAstSingle} from "./SlimeTSFunctionTypeCstToAst.ts";

export class SlimeJavascriptTSModuleCstToAstSingle {

    /**
     * [TypeScript] 转换 TSModuleDeclaration CST �?AST
     * namespace A.B.C { } / module "name" { }
     */
    createTSModuleDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let id: any = undefined
        let body: any = undefined
        let declare = false
        let global = false

        // 检查是否是 namespace �?module
        const isNamespace = children.some(c => c.value === 'namespace')
        const isModule = children.some(c => c.value === 'module')

        // 找到模块标识�?
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

        // 找到模块�?
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
     * [TypeScript] 转换 TSModuleBlock CST �?AST
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
     * [TypeScript] 转换 TSModuleIdentifier CST �?AST
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
     * [TypeScript] 转换 TSDeclareStatement CST �?AST
     * declare const/let/var/function/class/namespace/module/global
     */
    createTSDeclareStatementAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查声明类�?
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



    // ============================================
    // [TypeScript] Phase 7 - 模块和命名空�?
    // ============================================

    /**
     * [TypeScript] 重写 ImportDeclaration 转换，支�?import type
     *
     * import type { User } from "./types"
     * import { type Config, getValue } from "./config"
     */
    createImportDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 import type
        let importKind: 'type' | 'value' = 'value'
        let hasTypeKeyword = false

        // 查找 type 关键字（�?import 之后�?
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.value === 'type' && i > 0) {
                // 确保 type �?import 之后，且不是 ImportClause 内部�?type
                const prevChild = children[i - 1]
                if (prevChild.name === 'Import' || prevChild.value === 'import') {
                    importKind = 'type'
                    hasTypeKeyword = true
                    break
                }
            }
        }

        // 获取 import token
        const importTokenCst = children.find(c => c.name === 'Import' || c.value === 'import')
        const importToken = importTokenCst ? SlimeJavascriptTokenCreateUtils.createImportToken(importTokenCst.loc) : undefined

        // 获取 ImportClause
        const importClauseCst = children.find(c => c.name === 'ImportClause')

        // 获取 FromClause
        const fromClauseCst = children.find(c => c.name === 'FromClause')

        // 获取 ModuleSpecifier (for side-effect imports)
        const moduleSpecifierCst = children.find(c => c.name === 'ModuleSpecifier')

        // 查找 WithClause (ES2025 Import Attributes)
        // 可能直接�?WithClause，也可能包装�?ImportWithClauseOpt �?
        let withClauseCst = children.find(c => c.name === 'WithClause')
        if (!withClauseCst) {
            const importWithClauseOptCst = children.find(c => c.name === 'ImportWithClauseOpt')
            if (importWithClauseOptCst) {
                withClauseCst = importWithClauseOptCst.children?.find((c: SubhutiCst) => c.name === 'WithClause')
            }
        }

        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = SlimeCstToAstUtil.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        let specifiers: any[] = []
        let source: any = undefined
        let fromToken: any = undefined

        if (importClauseCst && fromClauseCst) {
            // import ... from "..."
            const clauseResult = this.createImportClauseAst(importClauseCst, importKind)
            specifiers = clauseResult.specifiers

            const fromResult = SlimeCstToAstUtil.createFromClauseAst(fromClauseCst)
            source = fromResult.source
            fromToken = fromResult.fromToken
        } else if (moduleSpecifierCst) {
            // import "..." (side-effect import)
            source = SlimeCstToAstUtil.createModuleSpecifierAst(moduleSpecifierCst)
        }

        const result = SlimeJavascriptCreateUtils.createImportDeclaration(
            specifiers,
            source,
            cst.loc,
            importToken,
            fromToken,
            undefined, // lBraceToken
            undefined, // rBraceToken
            undefined, // semicolonToken
            attributes.length > 0 ? attributes : undefined,
            withToken
        )

        // 添加 importKind 属�?
        if (importKind === 'type') {
            result.importKind = 'type'
        }

        return result
    }

    /**
     * [TypeScript] 转换 ImportClause，支持内�?type 导入
     */
    createImportClauseAst(cst: SubhutiCst, importKind: 'type' | 'value'): {
        specifiers: any[],
        lBraceToken?: any,
        rBraceToken?: any
    } {
        const children = cst.children || []
        const specifiers: any[] = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of children) {
            if (child.name === 'ImportedDefaultBinding') {
                // default import
                const binding = child.children?.[0]
                if (binding) {
                    const bindingId = SlimeCstToAstUtil.createImportedBindingAst(binding)
                    const spec: any = {
                        type: 'ImportDefaultSpecifier',
                        local: bindingId,
                        loc: child.loc,
                    }
                    if (importKind === 'type') {
                        spec.importKind = 'type'
                    }
                    specifiers.push({ specifier: spec })
                }
            } else if (child.name === 'NameSpaceImport') {
                // * as name
                const asBinding = child.children?.find((c: SubhutiCst) => c.name === 'ImportedBinding')
                if (asBinding) {
                    const bindingId = SlimeCstToAstUtil.createImportedBindingAst(asBinding)
                    const spec: any = {
                        type: 'ImportNamespaceSpecifier',
                        local: bindingId,
                        loc: child.loc,
                    }
                    if (importKind === 'type') {
                        spec.importKind = 'type'
                    }
                    specifiers.push({ specifier: spec })
                }
            } else if (child.name === 'NamedImports') {
                // { a, b as c, type d }
                const namedResult = this.createNamedImportsAst(child, importKind)
                specifiers.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            }
        }

        return { specifiers, lBraceToken, rBraceToken }
    }

    /**
     * [TypeScript] 转换 NamedImports，支持内�?type 导入
     */
    createNamedImportsAst(cst: SubhutiCst, importKind: 'type' | 'value'): {
        specifiers: any[],
        lBraceToken?: any,
        rBraceToken?: any
    } {
        const children = cst.children || []
        const specifiers: any[] = []

        // 提取 brace tokens
        const lBraceCst = children.find(c => c.name === 'LBrace' || c.value === '{')
        const rBraceCst = children.find(c => c.name === 'RBrace' || c.value === '}')

        const lBraceToken = lBraceCst ? {
            type: 'LBrace',
            value: '{',
            loc: lBraceCst.loc
        } : undefined

        const rBraceToken = rBraceCst ? {
            type: 'RBrace',
            value: '}',
            loc: rBraceCst.loc
        } : undefined

        // 找到 ImportsList
        const importsListCst = children.find(c => c.name === 'ImportsList')
        if (!importsListCst) return { specifiers, lBraceToken, rBraceToken }

        const importSpecifiers = importsListCst.children?.filter((c: SubhutiCst) => c.name === 'ImportSpecifier') || []

        for (const specCst of importSpecifiers) {
            const spec = this.createImportSpecifierAst(specCst, importKind)
            if (spec) {
                specifiers.push({ specifier: spec })
            }
        }

        return { specifiers, lBraceToken, rBraceToken }
    }

    /**
     * [TypeScript] 转换 ImportSpecifier，支持内�?type
     *
     * import { type Config, getValue } from "./config"
     */
    createImportSpecifierAst(cst: SubhutiCst, parentImportKind: 'type' | 'value'): any {
        const children = cst.children || []

        // 检查是否有内联 type 关键�?
        let hasInlineType = false
        for (const child of children) {
            if (child.value === 'type') {
                hasInlineType = true
                break
            }
        }

        // 找到 ModuleExportName �?ImportedBinding
        // CST 结构: ModuleExportName [as ImportedBinding]
        // 或�? ImportedBinding (没有 as)
        const moduleExportNameCst = children.find(c => c.name === 'ModuleExportName')
        const importedBindingCst = children.find(c => c.name === 'ImportedBinding')

        let imported: any = undefined
        let local: any = undefined

        if (moduleExportNameCst && importedBindingCst) {
            // ModuleExportName as ImportedBinding
            imported = this.extractIdentifier(moduleExportNameCst)
            local = this.extractIdentifier(importedBindingCst)
        } else if (importedBindingCst) {
            // ImportedBinding only (没有 as)
            imported = this.extractIdentifier(importedBindingCst)
            local = { ...imported }
        } else if (moduleExportNameCst) {
            // ModuleExportName only (没有 as)
            imported = this.extractIdentifier(moduleExportNameCst)
            local = { ...imported }
        }

        if (!imported || !local) return null

        const spec: any = {
            type: 'ImportSpecifier',
            imported,
            local,
            loc: cst.loc,
        }

        // 设置 importKind
        if (hasInlineType) {
            spec.importKind = 'type'
        } else if (parentImportKind === 'type') {
            spec.importKind = 'type'
        }

        return spec
    }

    /**
     * �?CST 节点提取标识�?
     */
    extractIdentifier(cst: SubhutiCst): any {
        if (cst.name === 'ImportedBinding') {
            return SlimeCstToAstUtil.createImportedBindingAst(cst)
        }
        if (cst.name === 'ModuleExportName') {
            const inner = cst.children?.[0]
            if (inner) {
                return this.extractIdentifier(inner)
            }
        }
        if (cst.name === 'Identifier' || cst.name === 'IdentifierName') {
            const tokenCst = cst.children?.[0] || cst
            return {
                type: 'Identifier',
                name: tokenCst.value,
                loc: tokenCst.loc,
            }
        }
        // 直接�?token
        if (cst.value) {
            return {
                type: 'Identifier',
                name: cst.value,
                loc: cst.loc,
            }
        }
        return null
    }

    /**
     * [TypeScript] 重写 ExportDeclaration 转换，支�?export type
     *
     * export type { User }
     * export type { Config as AppConfig }
     */
    createExportDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 export type
        let exportKind: 'type' | 'value' = 'value'

        // 查找 type 关键字（�?export 之后�?
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.value === 'type' && i > 0) {
                const prevChild = children[i - 1]
                if (prevChild.name === 'Export' || prevChild.value === 'export') {
                    exportKind = 'type'
                    break
                }
            }
        }

        // 如果�?export type，使用特殊处�?
        if (exportKind === 'type') {
            return this.createExportTypeDeclarationAst(cst)
        }

        // 否则直接调用原始实现（避免递归�?
        return SlimeJavascriptExportCstToAst.createExportDeclarationAst(cst)
    }

    /**
     * [TypeScript] 转换 export type 声明
     */
    createExportTypeDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 获取 export token
        const exportTokenCst = children.find(c => c.name === 'Export' || c.value === 'export')
        const exportToken = exportTokenCst ? SlimeJavascriptTokenCreateUtils.createExportToken(exportTokenCst.loc) : undefined

        // 获取 NamedExports
        const namedExportsCst = children.find(c => c.name === 'NamedExports')

        // 获取 FromClause (可�?
        const fromClauseCst = children.find(c => c.name === 'FromClause')

        let specifiers: any[] = []
        let source: any = undefined

        if (namedExportsCst) {
            specifiers = this.createNamedExportsAst(namedExportsCst)
        }

        if (fromClauseCst) {
            const fromResult = SlimeCstToAstUtil.createFromClauseAst(fromClauseCst)
            source = fromResult.source
        }

        return {
            type: 'ExportNamedDeclaration',
            declaration: null,
            specifiers: specifiers.map(s => s.specifier || s),
            source,
            exportKind: 'type',
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 NamedExports
     */
    createNamedExportsAst(cst: SubhutiCst): any[] {
        const children = cst.children || []
        const specifiers: any[] = []

        // 找到 ExportsList
        const exportsListCst = children.find(c => c.name === 'ExportsList')
        if (!exportsListCst) return specifiers

        const exportSpecifiers = exportsListCst.children?.filter((c: SubhutiCst) => c.name === 'ExportSpecifier') || []

        for (const specCst of exportSpecifiers) {
            const spec = this.createExportSpecifierAst(specCst)
            if (spec) {
                specifiers.push({ specifier: spec })
            }
        }

        return specifiers
    }

    /**
     * [TypeScript] 转换 ExportSpecifier
     */
    createExportSpecifierAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到标识�?
        const identifiers = children.filter(c =>
            c.name === 'ModuleExportName' ||
            c.name === 'Identifier' ||
            c.name === 'IdentifierName'
        )

        let local: any = undefined
        let exported: any = undefined

        if (identifiers.length >= 2) {
            // local as exported
            local = this.extractIdentifier(identifiers[0])
            exported = this.extractIdentifier(identifiers[1])
        } else if (identifiers.length === 1) {
            // same name
            local = this.extractIdentifier(identifiers[0])
            exported = { ...local }
        }

        if (!local || !exported) return null

        return {
            type: 'ExportSpecifier',
            local,
            exported,
            loc: cst.loc,
        }
    }

}

export const SlimeJavascriptTSModuleCstToAst = new SlimeJavascriptTSModuleCstToAstSingle()
