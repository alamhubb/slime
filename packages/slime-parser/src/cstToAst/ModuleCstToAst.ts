import {
    type SlimeProgram,
    type SlimeStatement,
    type SlimeModuleDeclaration,
    type SlimeImportDeclaration,
    type SlimeImportSpecifier,
    type SlimeImportDefaultSpecifier,
    type SlimeImportNamespaceSpecifier,
    type SlimeImportSpecifierItem,
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration,
    type SlimeExportAllDeclaration,
    type SlimeExportSpecifier,
    type SlimeExportSpecifierItem,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeStringLiteral,
    type SlimeExpression,
    type SlimeDeclaration, type SlimeVariableDeclaration, type SlimeVariableDeclarator, type SlimePropertyDefinition,
    type SlimeMethodDefinition,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import {checkCstName} from "../SlimeCstToAstUtil.ts";


/**
 * 模块相关的 CST to AST 转换
 */
export class ModuleCstToAst {
    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        const asts = cst.children.map(item => {
            // Es2025Parser uses ModuleItem wrapper
            if (item.name === SlimeParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return this.createModuleItemAst(innerItem)
            }
            // Fallback: direct type
            return this.createModuleItemAst(item)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }




    // ==================== 模块相关转换方法 ====================

    /**
     * Program CST �?AST
     *
     * 存在必要性：Program 是顶层入口规则，需要处�?Script �?Module 两种情况�?
     */
    createProgramAst(cst: SubhutiCst): SlimeProgram {
        // 处理 Program -> Script | Module
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === 'Script' || firstChild.name === SlimeParser.prototype.Script?.name) {
                return this.createScriptAst(firstChild)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeParser.prototype.Module?.name) {
                return this.createModuleAst(firstChild)
            }
        }
        // 如果直接就是内容，调�?toProgram
        return this.toProgram(cst)
    }

    /**
     * Script CST �?AST
     */
    createScriptAst(cst: SubhutiCst): SlimeProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return this.createScriptBodyAst(scriptBody)
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * ScriptBody CST �?AST
     */
    createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            const body = this.createStatementListAst(stmtList)
            return SlimeAstUtil.createProgram(body, 'script')
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * Module CST �?AST
     */
    createModuleAst(cst: SubhutiCst): SlimeProgram {
        const moduleBody = cst.children?.find(ch =>
            ch.name === 'ModuleBody' || ch.name === SlimeParser.prototype.ModuleBody?.name
        )
        if (moduleBody) {
            return this.createModuleBodyAst(moduleBody)
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * ModuleBody CST �?AST
     */
    createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        const moduleItemList = cst.children?.find(ch =>
            ch.name === 'ModuleItemList' || ch.name === SlimeParser.prototype.ModuleItemList?.name
        )
        if (moduleItemList) {
            const body = this.createModuleItemListAst(moduleItemList)
            return SlimeAstUtil.createProgram(body, 'module')
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * NameSpaceImport CST �?AST
     * NameSpaceImport -> * as ImportedBinding
     */
    createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
        // NameSpaceImport: Asterisk as ImportedBinding
        // children: [Asterisk, AsTok, ImportedBinding]
        let asteriskToken: any = undefined
        let asToken: any = undefined

        for (const child of cst.children) {
            if (child.name === 'Asterisk' || child.value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        const binding = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportedBinding?.name)
        if (!binding) throw new Error('NameSpaceImport missing ImportedBinding')
        const local = this.createImportedBindingAst(binding)

        return SlimeAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }

    /**
     * NamedImports CST 转 AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        if (!importsList) return []

        const specifiers: Array<SlimeImportSpecifier> = []
        for (const child of importsList.children) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // ImportSpecifier有两种形式：
                // 1. ImportedBinding （简写）
                // 2. IdentifierName AsTok ImportedBinding （重命名）

                const identifierName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.IdentifierName?.name)
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name)

                if (identifierName && binding) {
                    // import {name as localName} 或 import {default as MyClass} - 重命名形式
                    const imported = this.createIdentifierNameAst(identifierName)
                    const local = this.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    // import {name} - 简写形式
                    const id = this.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any)
                }
            }
        }
        return specifiers
    }

    /**
     * ImportsList CST �?AST
     * ImportsList -> ImportSpecifier (, ImportSpecifier)*
     */
    createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(this.createImportSpecifierAst(child))
            }
        }
        return specifiers
    }

    /**
     * ImportSpecifier CST �?AST
     * ImportSpecifier -> ImportedBinding | ModuleExportName as ImportedBinding
     */
    createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        const children = cst.children || []
        let imported: SlimeIdentifier | null = null
        let local: SlimeIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = this.createImportedBindingAst(child)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = this.createModuleExportNameAst(child) as SlimeIdentifier
                }
            }
        }

        // 如果没有 as，imported �?local 相同
        if (!local && imported) {
            local = { ...imported }
        }
        if (!imported && local) {
            imported = { ...local }
        }

        return SlimeAstUtil.createImportSpecifier(imported!, local!, asToken)
    }

    /**
     * AttributeKey CST �?AST
     * AttributeKey -> IdentifierName | StringLiteral
     */
    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return this.createIdentifierNameAst(firstChild)
        } else {
            return this.createStringLiteralAst(firstChild)
        }
    }

    /**
     * ExportFromClause CST �?AST
     * ExportFromClause -> * | * as ModuleExportName | NamedExports
     */
    createExportFromClauseAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 检查是否是 * (export all)
        const asterisk = children.find(ch => ch.name === 'Asterisk' || ch.value === '*')
        if (asterisk) {
            const asTok = children.find(ch => ch.name === 'As' || ch.value === 'as')
            const exportedName = children.find(ch =>
                ch.name === SlimeParser.prototype.ModuleExportName?.name ||
                ch.name === 'ModuleExportName'
            )

            if (asTok && exportedName) {
                // * as name
                return {
                    type: 'exportAll',
                    exported: this.createModuleExportNameAst(exportedName)
                }
            } else {
                // * (export all)
                return { type: 'exportAll', exported: null }
            }
        }

        // NamedExports
        const namedExports = children.find(ch =>
            ch.name === SlimeParser.prototype.NamedExports?.name ||
            ch.name === 'NamedExports'
        )
        if (namedExports) {
            return {
                type: 'namedExports',
                specifiers: this.createNamedExportsAst(namedExports)
            }
        }

        return { type: 'unknown' }
    }

    /**
     * WithEntries CST �?AST
     * WithEntries -> AttributeKey : StringLiteral (, AttributeKey : StringLiteral)*
     */
    createWithEntriesAst(cst: SubhutiCst): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AttributeKey?.name ||
                child.name === 'AttributeKey') {
                currentKey = this.createAttributeKeyAst(child)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: this.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }

    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        const name = item.name
        if (name === SlimeParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return this.createExportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return this.createImportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return this.createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportDeclaration?.name);
        const first = cst.children[0]
        const first1 = cst.children[1]
        let importDeclaration!: SlimeImportDeclaration

        // Token fields
        let importToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 import token
        if (first && (first.name === 'Import' || first.value === 'import')) {
            importToken = SlimeTokenCreate.createImportToken(first.loc)
        }

        // 查找 semicolon
        const semicolonCst = cst.children.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
        }

        // 查找 WithClause (ES2025 Import Attributes)
        const withClauseCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.WithClause?.name || ch.name === 'WithClause'
        )
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = this.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = this.createImportClauseAst(first1)
            const fromClause = this.createFromClauseAst(cst.children[2])
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) �?import 'module' with {...}
            const source = this.createModuleSpecifierAst(first1)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    /** 解析 WithClause: with { type: "json" } */
    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        // WithClause: With, LBrace, WithEntries?, RBrace
        let withToken: any = undefined
        const attributes: any[] = []

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = { type: 'With', value: 'with', loc: child.loc }
            } else if (child.name === SlimeParser.prototype.WithEntries?.name || child.name === 'WithEntries') {
                // WithEntries 包含 AttributeKey, Colon, StringLiteral, 可能有多个用逗号分隔
                let currentKey: any = null
                for (const entry of child.children || []) {
                    if (entry.name === SlimeParser.prototype.AttributeKey?.name || entry.name === 'AttributeKey') {
                        // AttributeKey 可能�?IdentifierName �?StringLiteral
                        const keyChild = entry.children?.[0]
                        if (keyChild) {
                            if (keyChild.name === 'IdentifierName' || keyChild.name === SlimeParser.prototype.IdentifierName?.name) {
                                const nameToken = keyChild.children?.[0]
                                currentKey = {
                                    type: SlimeNodeType.Identifier,
                                    name: nameToken?.value || keyChild.value,
                                    loc: keyChild.loc
                                }
                            } else if (keyChild.name === 'StringLiteral' || keyChild.value?.startsWith('"') || keyChild.value?.startsWith("'")) {
                                currentKey = this.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        // 这是 attribute 的�?
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: this.createStringLiteralAst(entry),
                                loc: { ...currentKey.loc, end: entry.loc?.end }
                            })
                            currentKey = null
                        }
                    }
                    // 跳过 Colon �?Comma
                }
            }
        }

        return { attributes, withToken }
    }


    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        let astName = checkCstName(cst, SlimeParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = this.createModuleSpecifierAst(cst.children[1])

        // 提取 from token
        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeTokenCreate.createFromToken(first.loc)
        }

        return {
            source: ModuleSpecifier,
            fromToken: fromToken
        }
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        let astName = checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        const ast = SlimeAstUtil.createStringLiteral(first.value)
        return ast
    }

    createImportClauseAst(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportClause?.name);
        const result: Array<SlimeImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = this.createImportedDefaultBindingAst(first)
            // 查找后面的逗号
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeTokenCreate.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeAstUtil.createImportSpecifierItem(specifier, commaToken))

            // 检查是否还�?NamedImports �?NameSpaceImport（混合导入）
            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = this.createNamedImportsListAstWrapped(namedImportsCst)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeAstUtil.createImportSpecifierItem(
                    this.createNameSpaceImportAst(namespaceImportCst), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeAstUtil.createImportSpecifierItem(this.createNameSpaceImportAst(first), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = this.createNamedImportsListAstWrapped(first)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return { specifiers: result, lBraceToken, rBraceToken }
    }

    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = this.createImportedBindingAst(first)
        const importDefaultSpecifier: SlimeImportDefaultSpecifier = SlimeAstUtil.createImportDefaultSpecifier(id)
        return importDefaultSpecifier
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return this.createBindingIdentifierAst(first)
    }

    /** 返回包装类型的版本，包含 brace tokens */
    createNamedImportsListAstWrapped(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 提取 brace tokens
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        // 空命名导�?import {} from "foo" - 返回�?specifiers 但有 brace tokens
        if (!importsList) return { specifiers: [], lBraceToken, rBraceToken }

        const specifiers: Array<SlimeImportSpecifierItem> = []
        let currentSpec: SlimeImportSpecifier | null = null
        let hasSpec = false

        for (let i = 0; i < importsList.children.length; i++) {
            const child = importsList.children[i]

            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // 如果之前�?specifier 但没有逗号，先推入
                if (hasSpec) {
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
                }

                // ES2025: ImportSpecifier 结构可能�?
                // 1. ModuleExportName "as" ImportedBinding (别名形式)
                // 2. ImportedBinding (简写形�?
                const moduleExportName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name || ch.name === 'ModuleExportName')
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name || ch.name === 'ImportedBinding')

                if (moduleExportName && binding) {
                    // 别名形式: import { foo as bar }
                    const imported = this.createModuleExportNameAst(moduleExportName)
                    const local = this.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    // 简写形�? import { foo }
                    const id = this.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any
                }
                hasSpec = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的 specifier 配对
                if (hasSpec) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, commaToken))
                    hasSpec = false
                    currentSpec = null
                }
            }
        }

        // 处理最后一�?specifier（没有尾随逗号�?
        if (hasSpec) {
            specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
        }

        return { specifiers, lBraceToken, rBraceToken }
    }

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        let astName = checkCstName(cst, SlimeParser.prototype.ExportDeclaration?.name);
        const children = cst.children || []

        // Token fields
        let exportToken: any = undefined
        let defaultToken: any = undefined
        let asteriskToken: any = undefined
        let semicolonToken: any = undefined
        let asToken: any = undefined

        // 遍历子节点提取信�?
        let exportFromClause: SubhutiCst | null = null
        let fromClause: SubhutiCst | null = null
        let namedExports: SubhutiCst | null = null
        let variableStatement: SubhutiCst | null = null
        let declaration: SubhutiCst | null = null
        let hoistableDeclaration: SubhutiCst | null = null
        let classDeclaration: SubhutiCst | null = null
        let assignmentExpression: SubhutiCst | null = null
        let withClauseCst: SubhutiCst | null = null
        let isDefault = false

        for (const child of children) {
            const name = child.name
            if (name === SlimeTokenConsumer.prototype.Export?.name || child.value === 'export') {
                exportToken = SlimeTokenCreate.createExportToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.Default?.name || child.value === 'default') {
                defaultToken = SlimeTokenCreate.createDefaultToken(child.loc)
                isDefault = true
            } else if (name === SlimeTokenConsumer.prototype.Asterisk?.name || child.value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.Semicolon?.name || child.value === ';') {
                semicolonToken = SlimeTokenCreate.createSemicolonToken(child.loc)
            } else if (name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (name === SlimeParser.prototype.ExportFromClause?.name) {
                exportFromClause = child
            } else if (name === SlimeParser.prototype.FromClause?.name) {
                fromClause = child
            } else if (name === SlimeParser.prototype.NamedExports?.name) {
                namedExports = child
            } else if (name === SlimeParser.prototype.VariableStatement?.name) {
                variableStatement = child
            } else if (name === SlimeParser.prototype.Declaration?.name) {
                declaration = child
            } else if (name === SlimeParser.prototype.HoistableDeclaration?.name) {
                hoistableDeclaration = child
            } else if (name === SlimeParser.prototype.ClassDeclaration?.name) {
                classDeclaration = child
            } else if (name === SlimeParser.prototype.AssignmentExpression?.name) {
                assignmentExpression = child
            } else if (name === SlimeParser.prototype.WithClause?.name || name === 'WithClause') {
                withClauseCst = child
            }
        }

        // 解析 WithClause (ES2025 Import Attributes)
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = this.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        // export default ...
        if (isDefault) {
            let decl: any = null
            if (hoistableDeclaration) {
                decl = this.createHoistableDeclarationAst(hoistableDeclaration)
            } else if (classDeclaration) {
                decl = this.createClassDeclarationAst(classDeclaration)
            } else if (assignmentExpression) {
                decl = this.createAssignmentExpressionAst(assignmentExpression)
            }
            return SlimeAstUtil.createExportDefaultDeclaration(decl, cst.loc, exportToken, defaultToken)
        }

        // export ExportFromClause FromClause ; (export * from ... or export { } from ...)
        if (exportFromClause && fromClause) {
            const fromClauseResult = this.createFromClauseAst(fromClause)

            // Check if it's export * or export * as name
            const hasAsterisk = exportFromClause.children?.some((ch: any) =>
                ch.name === SlimeTokenConsumer.prototype.Asterisk?.name || ch.value === '*')

            if (hasAsterisk) {
                // export * from ... or export * as name from ...
                let exported: any = null
                const moduleExportName = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name)
                if (moduleExportName) {
                    exported = this.createModuleExportNameAst(moduleExportName)
                }
                const result = SlimeAstUtil.createExportAllDeclaration(
                    fromClauseResult.source, exported, cst.loc,
                    exportToken, asteriskToken, asToken, fromClauseResult.fromToken, semicolonToken
                ) as any
                // 添加 attributes（如果有 withToken，即�?attributes 为空也要添加�?
                if (withToken) {
                    result.attributes = attributes
                    result.withToken = withToken
                }
                return result
            } else {
                // export { ... } from ...
                // exportFromClause 的结构是 [NamedExports]，需要从中提�?NamedExports
                const namedExportsCst = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.NamedExports?.name || ch.name === 'NamedExports'
                )
                const specifiers = namedExportsCst
                    ? this.createNamedExportsAst(namedExportsCst)
                    : []
                const result = SlimeAstUtil.createExportNamedDeclaration(
                    null, specifiers, fromClauseResult.source, cst.loc,
                    exportToken, fromClauseResult.fromToken, semicolonToken
                )
                // 添加 attributes（如果有 withToken，即�?attributes 为空也要添加�?
                if (withToken) {
                    (result as any).attributes = attributes;
                    (result as any).withToken = withToken
                }
                return result
            }
        }

        // export NamedExports ; (export { ... })
        if (namedExports) {
            const specifiers = this.createNamedExportsAst(namedExports)
            return SlimeAstUtil.createExportNamedDeclaration(
                null, specifiers, null, cst.loc, exportToken, undefined, semicolonToken
            )
        }

        // export VariableStatement
        if (variableStatement) {
            const decl = this.createVariableStatementAst(variableStatement)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        // export Declaration
        if (declaration) {
            const decl = this.createDeclarationAst(declaration)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        throw new Error(`Unsupported export declaration structure`)
    }

    /**
     * 创建 NamedExports AST (export { a, b, c })
     */
    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        // NamedExports: { ExportsList? }
        const specifiers: SlimeExportSpecifierItem[] = []

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportsList?.name) {
                return this.createExportsListAst(child)
            } else if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                specifiers.push({ specifier: this.createExportSpecifierAst(child) })
            }
        }

        return specifiers
    }

    /**
     * 创建 ExportsList AST
     */
    createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []
        let lastSpecifier: SlimeExportSpecifier | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                if (lastSpecifier) {
                    specifiers.push({ specifier: lastSpecifier })
                }
                lastSpecifier = this.createExportSpecifierAst(child)
            } else if (child.name === SlimeTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastSpecifier) {
                    specifiers.push({
                        specifier: lastSpecifier,
                        commaToken: SlimeTokenCreate.createCommaToken(child.loc)
                    })
                    lastSpecifier = null
                }
            }
        }

        if (lastSpecifier) {
            specifiers.push({ specifier: lastSpecifier })
        }

        return specifiers
    }

    /**
     * 创建 ExportSpecifier AST
     */
    createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        // ExportSpecifier: ModuleExportName | ModuleExportName as ModuleExportName
        const children = cst.children || []
        let local: any = null
        let exported: any = null
        let asToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === SlimeParser.prototype.ModuleExportName?.name) {
                if (!local) {
                    local = this.createModuleExportNameAst(child)
                } else {
                    exported = this.createModuleExportNameAst(child)
                }
            } else if (child.name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        // If no 'as', exported is same as local
        if (!exported) {
            exported = local
        }

        return SlimeAstUtil.createExportSpecifier(local, exported, cst.loc, asToken)
    }

    /**
     * 创建 ModuleExportName AST
     */
    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const first = cst.children?.[0]
        if (!first) {
            throw new Error('ModuleExportName has no children')
        }

        if (first.name === SlimeParser.prototype.IdentifierName?.name) {
            return this.createIdentifierNameAst(first)
        } else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeAstUtil.createStringLiteral(first.value, first.loc)
        } else {
            // Direct token
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }
    }

}
