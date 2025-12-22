import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeImportDeclaration, SlimeImportSpecifier, SlimeImportDefaultSpecifier, SlimeImportNamespaceSpecifier, SlimeIdentifier, SlimeLiteral, SlimeStringLiteral, SlimeImportSpecifierItem } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * Import CST 到 AST 转换器
 * 
 * 负责处理：
 * - ImportDeclaration: import 声明
 * - ImportClause: import 子句
 * - NameSpaceImport: 命名空间导入
 * - NamedImports: 命名导入
 * - ImportsList: 导入列表
 * - ImportSpecifier: 导入说明符
 * - ImportedBinding: 导入绑定
 * - ImportedDefaultBinding: 默认导入绑定
 * - ModuleSpecifier: 模块说明符
 * - FromClause: from 子句
 * - WithClause: with 子句 (ES2025)
 * - WithEntries: with 条目
 * - AttributeKey: 属性键
 */
export class ImportCstToAst {

    /**
     * 创建 ImportDeclaration AST
     */
    static createImportDeclarationAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeImportDeclaration {
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
            const parsed = this.createWithClauseAst(withClauseCst, util)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }


        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = this.createImportClauseAst(first1, util)
            const fromClause = this.createFromClauseAst(cst.children[2], util)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) 或 import 'module' with {...}
            const source = this.createModuleSpecifierAst(first1, util)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    /**
     * 创建 ImportClause AST
     */
    static createImportClauseAst(cst: SubhutiCst, util: SlimeCstToAst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportClause?.name);
        const result: Array<SlimeImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = this.createImportedDefaultBindingAst(first, util)
            // 查找后面的逗号
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeTokenCreate.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeAstUtil.createImportSpecifierItem(specifier, commaToken))

            // 检查是否还有 NamedImports 或 NameSpaceImport（混合导入）
            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = this.createNamedImportsListAstWrapped(namedImportsCst, util)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeAstUtil.createImportSpecifierItem(
                    this.createNameSpaceImportAst(namespaceImportCst, util), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeAstUtil.createImportSpecifierItem(this.createNameSpaceImportAst(first, util), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = this.createNamedImportsListAstWrapped(first, util)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return { specifiers: result, lBraceToken, rBraceToken }
    }

    /**
     * 创建 NameSpaceImport AST
     */
    static createNameSpaceImportAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeImportNamespaceSpecifier {
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
        const local = this.createImportedBindingAst(binding, util)

        return SlimeAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }

    /**
     * 创建 NamedImports AST
     */
    static createNamedImportsAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeImportSpecifier> {
        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        if (!importsList) return []

        const specifiers: Array<SlimeImportSpecifier> = []
        for (const child of importsList.children) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                const identifierName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.IdentifierName?.name)
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name)

                if (identifierName && binding) {
                    const imported = util.createIdentifierNameAst(identifierName)
                    const local = this.createImportedBindingAst(binding, util)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    const id = this.createImportedBindingAst(binding, util)
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
     * 创建 ImportsList AST
     */
    static createImportsListAst(cst: SubhutiCst, util: SlimeCstToAst): Array<SlimeImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(this.createImportSpecifierAst(child, util))
            }
        }
        return specifiers
    }

    /**
     * 创建 ImportSpecifier AST
     */
    static createImportSpecifierAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeImportSpecifier {
        const children = cst.children || []
        let imported: SlimeIdentifier | null = null
        let local: SlimeIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = this.createImportedBindingAst(child, util)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = util.createModuleExportNameAst(child) as SlimeIdentifier
                }
            }
        }

        if (!local && imported) {
            local = { ...imported }
        }
        if (!imported && local) {
            imported = { ...local }
        }

        return SlimeAstUtil.createImportSpecifier(imported!, local!, asToken)
    }

    /**
     * 创建 ImportedBinding AST
     */
    static createImportedBindingAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeIdentifier {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return util.createBindingIdentifierAst(first)
    }

    /**
     * 创建 ImportedDefaultBinding AST
     */
    static createImportedDefaultBindingAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeImportDefaultSpecifier {
        let astName = checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = this.createImportedBindingAst(first, util)
        return SlimeAstUtil.createImportDefaultSpecifier(id)
    }

    /**
     * 创建 ModuleSpecifier AST
     */
    static createModuleSpecifierAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeStringLiteral {
        let astName = checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        return SlimeAstUtil.createStringLiteral(first.value)
    }

    /**
     * 创建 FromClause AST
     */
    static createFromClauseAst(cst: SubhutiCst, util: SlimeCstToAst): { source: SlimeStringLiteral, fromToken?: any } {
        let astName = checkCstName(cst, SlimeParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = this.createModuleSpecifierAst(cst.children[1], util)

        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeTokenCreate.createFromToken(first.loc)
        }

        return { source: ModuleSpecifier, fromToken: fromToken }
    }

    /**
     * 创建 WithClause AST (ES2025)
     */
    static createWithClauseAst(cst: SubhutiCst, util: SlimeCstToAst): { attributes: any[], withToken: any } {
        let withToken: any = undefined
        const attributes: any[] = []

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = { type: 'With', value: 'with', loc: child.loc }
            } else if (child.name === SlimeParser.prototype.WithEntries?.name || child.name === 'WithEntries') {
                let currentKey: any = null
                for (const entry of child.children || []) {
                    if (entry.name === SlimeParser.prototype.AttributeKey?.name || entry.name === 'AttributeKey') {
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
                                currentKey = util.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: util.createStringLiteralAst(entry),
                                loc: { ...currentKey.loc, end: entry.loc?.end }
                            })
                            currentKey = null
                        }
                    }
                }
            }
        }

        return { attributes, withToken }
    }

    /**
     * 创建 WithEntries AST
     */
    static createWithEntriesAst(cst: SubhutiCst, util: SlimeCstToAst): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AttributeKey?.name ||
                child.name === 'AttributeKey') {
                currentKey = this.createAttributeKeyAst(child, util)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: util.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }

    /**
     * 创建 AttributeKey AST
     */
    static createAttributeKeyAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return util.createIdentifierNameAst(firstChild)
        } else {
            return util.createStringLiteralAst(firstChild)
        }
    }

    /**
     * 创建 NamedImports 包装版本 AST
     */
    static createNamedImportsListAstWrapped(cst: SubhutiCst, util: SlimeCstToAst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            }
        }

        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        if (!importsList) return { specifiers: [], lBraceToken, rBraceToken }

        const specifiers: Array<SlimeImportSpecifierItem> = []
        let currentSpec: SlimeImportSpecifier | null = null
        let hasSpec = false

        for (let i = 0; i < importsList.children.length; i++) {
            const child = importsList.children[i]

            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                if (hasSpec) {
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
                }

                const moduleExportName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name || ch.name === 'ModuleExportName')
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name || ch.name === 'ImportedBinding')

                if (moduleExportName && binding) {
                    const imported = util.createModuleExportNameAst(moduleExportName)
                    const local = this.createImportedBindingAst(binding, util)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    const id = this.createImportedBindingAst(binding, util)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any
                }
                hasSpec = true
            } else if (child.name === 'Comma' || child.value === ',') {
                if (hasSpec) {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, commaToken))
                    hasSpec = false
                    currentSpec = null
                }
            }
        }

        if (hasSpec) {
            specifiers.push(SlimeAstUtil.createImportSpecifierItem(currentSpec!, undefined))
        }

        return { specifiers, lBraceToken, rBraceToken }
    }
}
