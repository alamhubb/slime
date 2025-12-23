import { SubhutiCst } from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeFunctionParam,
    SlimeModuleDeclaration,
    SlimePattern,
    SlimeProgram,
    SlimeStatement,
    SlimeAstTypeName,
    SlimeTokenCreateUtils
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import { SlimeVariableCstToAstSingle } from "../statements/SlimeVariableCstToAst.ts";
import { SlimeJavascriptModuleCstToAstSingle, SlimeJavascriptExportCstToAst } from "../../deprecated/slimeJavascriptCstToAst";
import SlimeJavascriptCstToAstUtil from "../../deprecated/SlimeJavascriptCstToAstUtil.ts";
import { SlimeJavascriptCreateUtils } from "slime-ast";

export class SlimeModuleCstToAstSingle extends SlimeJavascriptModuleCstToAstSingle {

    /**
     * [TypeScript] 重写 toProgram 以使用新的 SlimeCstToAstUtil
     * 这确保了 TypeScript 类型注解能被正确处理
     */
    override toProgram(cst: SubhutiCst): SlimeProgram {
        const isModule = cst.name === SlimeParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeProgram
        let hashbangComment: string | null = null

        if (!cst.children || cst.children.length === 0) {
            return SlimeAstCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                child.name === 'ModuleItemList' || child.name === SlimeParser.prototype.ModuleItemList?.name ||
                child.name === 'StatementList' || child.name === SlimeParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeParser.prototype.ModuleItemList?.name)) {
                    const body = SlimeCstToAstUtil.createModuleItemListAst(moduleItemList)
                    program = SlimeAstCreateUtils.createProgram(body, 'module')
                } else {
                    program = SlimeAstCreateUtils.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = SlimeCstToAstUtil.createModuleItemListAst(bodyChild)
                program = SlimeAstCreateUtils.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                    const body = SlimeCstToAstUtil.createStatementListAst(statementList)
                    program = SlimeAstCreateUtils.createProgram(body, 'script')
                } else {
                    program = SlimeAstCreateUtils.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                const body = SlimeCstToAstUtil.createStatementListAst(bodyChild)
                program = SlimeAstCreateUtils.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            program = SlimeAstCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    // ============================================
    // [TypeScript] Phase 7 - 模块和命名空间
    // ============================================

    /**
     * [TypeScript] 重写 ImportDeclaration 转换，支持 import type
     * 
     * import type { User } from "./types"
     * import { type Config, getValue } from "./config"
     */
    createImportDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 检查是否是 import type
        let importKind: 'type' | 'value' = 'value'
        let hasTypeKeyword = false
        
        // 查找 type 关键字（在 import 之后）
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.value === 'type' && i > 0) {
                // 确保 type 在 import 之后，且不是 ImportClause 内部的 type
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
        const importToken = importTokenCst ? SlimeTokenCreateUtils.createImportToken(importTokenCst.loc) : undefined
        
        // 获取 ImportClause
        const importClauseCst = children.find(c => c.name === 'ImportClause')
        
        // 获取 FromClause
        const fromClauseCst = children.find(c => c.name === 'FromClause')
        
        // 获取 ModuleSpecifier (for side-effect imports)
        const moduleSpecifierCst = children.find(c => c.name === 'ModuleSpecifier')
        
        let specifiers: any[] = []
        let source: any = undefined
        let fromToken: any = undefined
        
        if (importClauseCst && fromClauseCst) {
            // import ... from "..."
            const clauseResult = this.createImportClauseAst(importClauseCst, importKind)
            specifiers = clauseResult.specifiers
            
            const fromResult = SlimeJavascriptCstToAstUtil.createFromClauseAst(fromClauseCst)
            source = fromResult.source
            fromToken = fromResult.fromToken
        } else if (moduleSpecifierCst) {
            // import "..." (side-effect import)
            source = SlimeJavascriptCstToAstUtil.createModuleSpecifierAst(moduleSpecifierCst)
        }
        
        const result = SlimeJavascriptCreateUtils.createImportDeclaration(
            importToken,
            specifiers,
            source,
            cst.loc,
            importToken,
            fromToken
        )
        
        // 添加 importKind 属性
        if (importKind === 'type') {
            result.importKind = 'type'
        }
        
        return result
    }

    /**
     * [TypeScript] 转换 ImportClause，支持内联 type 导入
     */
    createImportClauseAst(cst: SubhutiCst, importKind: 'type' | 'value'): { specifiers: any[] } {
        const children = cst.children || []
        const specifiers: any[] = []
        
        for (const child of children) {
            if (child.name === 'ImportedDefaultBinding') {
                // default import
                const binding = child.children?.[0]
                if (binding) {
                    const bindingId = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)
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
                    const bindingId = SlimeJavascriptCstToAstUtil.createImportedBindingAst(asBinding)
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
                const namedSpecs = this.createNamedImportsAst(child, importKind)
                specifiers.push(...namedSpecs)
            }
        }
        
        return { specifiers }
    }

    /**
     * [TypeScript] 转换 NamedImports，支持内联 type 导入
     */
    createNamedImportsAst(cst: SubhutiCst, importKind: 'type' | 'value'): any[] {
        const children = cst.children || []
        const specifiers: any[] = []
        
        // 找到 ImportsList
        const importsListCst = children.find(c => c.name === 'ImportsList')
        if (!importsListCst) return specifiers
        
        const importSpecifiers = importsListCst.children?.filter((c: SubhutiCst) => c.name === 'ImportSpecifier') || []
        
        for (const specCst of importSpecifiers) {
            const spec = this.createImportSpecifierAst(specCst, importKind)
            if (spec) {
                specifiers.push({ specifier: spec })
            }
        }
        
        return specifiers
    }

    /**
     * [TypeScript] 转换 ImportSpecifier，支持内联 type
     * 
     * import { type Config, getValue } from "./config"
     */
    createImportSpecifierAst(cst: SubhutiCst, parentImportKind: 'type' | 'value'): any {
        const children = cst.children || []
        
        // 检查是否有内联 type 关键字
        let hasInlineType = false
        for (const child of children) {
            if (child.value === 'type') {
                hasInlineType = true
                break
            }
        }
        
        // 找到标识符
        const identifiers = children.filter(c => 
            c.name === 'ImportedBinding' || 
            c.name === 'ModuleExportName' ||
            c.name === 'Identifier' ||
            c.name === 'IdentifierName'
        )
        
        let imported: any = undefined
        let local: any = undefined
        
        if (identifiers.length >= 2) {
            // ModuleExportName as ImportedBinding
            const importedCst = identifiers[0]
            const localCst = identifiers[1]
            
            imported = this.extractIdentifier(importedCst)
            local = this.extractIdentifier(localCst)
        } else if (identifiers.length === 1) {
            // ImportedBinding only
            const bindingCst = identifiers[0]
            imported = this.extractIdentifier(bindingCst)
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
     * 从 CST 节点提取标识符
     */
    extractIdentifier(cst: SubhutiCst): any {
        if (cst.name === 'ImportedBinding') {
            return SlimeJavascriptCstToAstUtil.createImportedBindingAst(cst)
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
        // 直接是 token
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
     * [TypeScript] 重写 ExportDeclaration 转换，支持 export type
     * 
     * export type { User }
     * export type { Config as AppConfig }
     */
    createExportDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 检查是否是 export type
        let exportKind: 'type' | 'value' = 'value'
        
        // 查找 type 关键字（在 export 之后）
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
        
        // 如果是 export type，使用特殊处理
        if (exportKind === 'type') {
            return this.createExportTypeDeclarationAst(cst)
        }
        
        // 否则直接调用原始实现（避免递归）
        return SlimeJavascriptExportCstToAst.createExportDeclarationAst(cst)
    }

    /**
     * [TypeScript] 转换 export type 声明
     */
    createExportTypeDeclarationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        
        // 获取 export token
        const exportTokenCst = children.find(c => c.name === 'Export' || c.value === 'export')
        const exportToken = exportTokenCst ? SlimeTokenCreateUtils.createExportToken(exportTokenCst.loc) : undefined
        
        // 获取 NamedExports
        const namedExportsCst = children.find(c => c.name === 'NamedExports')
        
        // 获取 FromClause (可选)
        const fromClauseCst = children.find(c => c.name === 'FromClause')
        
        let specifiers: any[] = []
        let source: any = undefined
        
        if (namedExportsCst) {
            specifiers = this.createNamedExportsAst(namedExportsCst)
        }
        
        if (fromClauseCst) {
            const fromResult = SlimeJavascriptCstToAstUtil.createFromClauseAst(fromClauseCst)
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
        
        // 找到标识符
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

export const SlimeModuleCstToAst = new SlimeModuleCstToAstSingle()