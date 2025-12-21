import {
    type SlimeImportDeclaration,
    type SlimeImportSpecifier,
    type SlimeImportDefaultSpecifier,
    type SlimeImportNamespaceSpecifier,
    type SlimeImportSpecifierItem,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeStringLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import SlimeParser from "../SlimeParser.ts";
import { checkCstName } from "./SlimeCstToAstTools.ts";

let _slimeCstToAstUtil: any = null;

export function setImportCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for ImportCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * Import 相关的 CST to AST 转换
 */
export class ImportCstToAst {

    static createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        checkCstName(cst, SlimeParser.prototype.ImportDeclaration?.name);
        const first = cst.children[0]
        const first1 = cst.children[1]
        let importDeclaration!: SlimeImportDeclaration

        let importToken: any = undefined
        let semicolonToken: any = undefined

        if (first && (first.name === 'Import' || first.value === 'import')) {
            importToken = SlimeTokenCreate.createImportToken(first.loc)
        }

        const semicolonCst = cst.children.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeTokenCreate.createSemicolonToken(semicolonCst.loc)
        }

        const withClauseCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.WithClause?.name || ch.name === 'WithClause'
        )
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = ImportCstToAst.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = ImportCstToAst.createImportClauseAst(first1)
            const fromClause = ImportCstToAst.createFromClauseAst(cst.children[2])
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            const source = ImportCstToAst.createModuleSpecifierAst(first1)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    static createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
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
                                currentKey = getUtil().createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: getUtil().createStringLiteralAst(entry),
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

    static createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        checkCstName(cst, SlimeParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = ImportCstToAst.createModuleSpecifierAst(cst.children[1])

        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeTokenCreate.createFromToken(first.loc)
        }
        return { source: ModuleSpecifier, fromToken }
    }

    static createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        return SlimeAstUtil.createStringLiteral(first.value)
    }

    static createImportClauseAst(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        checkCstName(cst, SlimeParser.prototype.ImportClause?.name);
        const result: Array<SlimeImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            const specifier = ImportCstToAst.createImportedDefaultBindingAst(first)
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeTokenCreate.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeAstUtil.createImportSpecifierItem(specifier, commaToken))

            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = ImportCstToAst.createNamedImportsListAstWrapped(namedImportsCst)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeAstUtil.createImportSpecifierItem(
                    ImportCstToAst.createNameSpaceImportAst(namespaceImportCst), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            result.push(SlimeAstUtil.createImportSpecifierItem(ImportCstToAst.createNameSpaceImportAst(first), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            const namedResult = ImportCstToAst.createNamedImportsListAstWrapped(first)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }
        return { specifiers: result, lBraceToken, rBraceToken }
    }

    static createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = ImportCstToAst.createImportedBindingAst(first)
        return SlimeAstUtil.createImportDefaultSpecifier(id)
    }

    static createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return getUtil().createBindingIdentifierAst(first)
    }

    static createNameSpaceImportAst(cst: SubhutiCst): SlimeImportNamespaceSpecifier {
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
        const local = ImportCstToAst.createImportedBindingAst(binding)
        return SlimeAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }

    static createNamedImportsAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
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
                    const imported = getUtil().createIdentifierNameAst(identifierName)
                    const local = ImportCstToAst.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    const id = ImportCstToAst.createImportedBindingAst(binding)
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

    static createImportsListAst(cst: SubhutiCst): Array<SlimeImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name || child.name === 'ImportSpecifier') {
                specifiers.push(ImportCstToAst.createImportSpecifierAst(child))
            }
        }
        return specifiers
    }

    static createImportSpecifierAst(cst: SubhutiCst): SlimeImportSpecifier {
        const children = cst.children || []
        let imported: SlimeIdentifier | null = null
        let local: SlimeIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name || child.name === 'ImportedBinding') {
                local = ImportCstToAst.createImportedBindingAst(child)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = ImportCstToAst.createModuleExportNameAst(child) as SlimeIdentifier
                }
            }
        }

        if (!local && imported) local = { ...imported }
        if (!imported && local) imported = { ...local }
        return SlimeAstUtil.createImportSpecifier(imported!, local!, asToken)
    }

    static createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const first = cst.children?.[0]
        if (!first) throw new Error('ModuleExportName has no children')

        if (first.name === SlimeParser.prototype.IdentifierName?.name) {
            return getUtil().createIdentifierNameAst(first)
        } else if (first.value?.startsWith('"') || first.value?.startsWith("'")) {
            return SlimeAstUtil.createStringLiteral(first.value, first.loc)
        } else {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }
    }

    static createNamedImportsListAstWrapped(cst: SubhutiCst): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
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
                    const imported = ImportCstToAst.createModuleExportNameAst(moduleExportName)
                    const local = ImportCstToAst.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    const id = ImportCstToAst.createImportedBindingAst(binding)
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

    static createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            (firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'"))) {
            return getUtil().createIdentifierNameAst(firstChild)
        } else {
            return getUtil().createStringLiteralAst(firstChild)
        }
    }

    static createWithEntriesAst(cst: SubhutiCst): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AttributeKey?.name || child.name === 'AttributeKey') {
                currentKey = ImportCstToAst.createAttributeKeyAst(child)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: getUtil().createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }
        return entries
    }
}
