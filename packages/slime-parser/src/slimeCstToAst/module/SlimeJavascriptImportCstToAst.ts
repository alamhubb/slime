/**
 * ImportCstToAst - import 相关转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils, SlimeJavascriptCallArgument, SlimeJavascriptExpression,
    SlimeJavascriptIdentifier, type SlimeJavascriptImportDeclaration, SlimeJavascriptImportDefaultSpecifier, SlimeJavascriptImportNamespaceSpecifier,
    SlimeJavascriptImportSpecifier, SlimeJavascriptImportSpecifierItem, SlimeJavascriptLiteral,
    type SlimeJavascriptModuleDeclaration, SlimeJavascriptAstTypeName, SlimeJavascriptPattern, type SlimeJavascriptStatement,
    SlimeJavascriptStringLiteral, SlimeJavascriptTokenCreateUtils, SlimeJavascriptVariableDeclarator
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";

import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptImportCstToAstSingle {

    createImportDeclarationAst(cst: SubhutiCst): SlimeImportDeclaration {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ImportDeclaration?.name);
        const first = cst.children[0]
        const first1 = cst.children[1]
        let importDeclaration!: SlimeImportDeclaration

        // Token fields
        let importToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 import token
        if (first && (first.name === 'Import' || first.value === 'import')) {
            importToken = SlimeJavascriptTokenCreateUtils.createImportToken(first.loc)
        }

        // 查找 semicolon
        const semicolonCst = cst.children.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeJavascriptTokenCreateUtils.createSemicolonToken(semicolonCst.loc)
        }

        // 查找 WithClause (ES2025 Import Attributes)
        const withClauseCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.WithClause?.name || ch.name === 'WithClause'
        )
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = SlimeCstToAstUtil.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = SlimeCstToAstUtil.createImportClauseAst(first1)
            const fromClause = SlimeCstToAstUtil.createFromClauseAst(cst.children[2])
            importDeclaration = SlimeJavascriptCreateUtils.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) �?import 'module' with {...}
            const source = SlimeCstToAstUtil.createModuleSpecifierAst(first1)
            importDeclaration = SlimeJavascriptCreateUtils.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ImportClause?.name);
        const result: Array<SlimeJavascriptImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = SlimeCstToAstUtil.createImportedDefaultBindingAst(first)
            // 查找后面的逗号
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeJavascriptTokenCreateUtils.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(specifier, commaToken))

            // 检查是否还�?NamedImports �?NameSpaceImport（混合导入）
            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = SlimeCstToAstUtil.createNamedImportsListAstWrapped(namedImportsCst)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(
                    SlimeCstToAstUtil.createNameSpaceImportAst(namespaceImportCst), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(SlimeCstToAstUtil.createNameSpaceImportAst(first), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = SlimeCstToAstUtil.createNamedImportsListAstWrapped(first)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return {specifiers: result, lBraceToken, rBraceToken}
    }

    /**
     * NamedImports CST �?AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    createNamedImportsAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        if (!importsList) return []

        const specifiers: Array<SlimeJavascriptImportSpecifier> = []
        for (const child of importsList.children) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // ImportSpecifier有两种形式：
                // 1. ImportedBinding （简写）
                // 2. IdentifierName AsTok ImportedBinding （重命名�?

                const identifierName = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.IdentifierName?.name)
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ImportedBinding?.name)

                if (identifierName && binding) {
                    // import {name as localName} �?import {default as MyClass} - 重命名形�?
                    const imported = SlimeCstToAstUtil.createIdentifierNameAst(identifierName)
                    const local = SlimeCstToAstUtil.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeAstTypeName.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    // import {name} - 简写形�?
                    const id = SlimeCstToAstUtil.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeAstTypeName.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any)
                }
            }
        }
        return specifiers
    }

    /** 返回包装类型的版本，包含 brace tokens */
    createNamedImportsListAstWrapped(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // 提取 brace tokens
        for (const child of cst.children || []) {
            if (child.name === 'LBrace' || child.value === '{') {
                lBraceToken = SlimeJavascriptTokenCreateUtils.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreateUtils.createRBraceToken(child.loc)
            }
        }

        const importsList = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportsList?.name)
        // 空命名导�?import {} from "foo" - 返回�?specifiers 但有 brace tokens
        if (!importsList) return {specifiers: [], lBraceToken, rBraceToken}

        const specifiers: Array<SlimeJavascriptImportSpecifierItem> = []
        let currentSpec: SlimeImportSpecifier | null = null
        let hasSpec = false

        for (let i = 0; i < importsList.children.length; i++) {
            const child = importsList.children[i]

            if (child.name === SlimeParser.prototype.ImportSpecifier?.name) {
                // 如果之前�?specifier 但没有逗号，先推入
                if (hasSpec) {
                    specifiers.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(currentSpec!, undefined))
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
                    const imported = SlimeCstToAstUtil.createModuleExportNameAst(moduleExportName)
                    const local = SlimeCstToAstUtil.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeAstTypeName.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    // 简写形�? import { foo }
                    const id = SlimeCstToAstUtil.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeAstTypeName.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any
                }
                hasSpec = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的 specifier 配对
                if (hasSpec) {
                    const commaToken = SlimeJavascriptTokenCreateUtils.createCommaToken(child.loc)
                    specifiers.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(currentSpec!, commaToken))
                    hasSpec = false
                    currentSpec = null
                }
            }
        }

        // 处理最后一�?specifier（没有尾随逗号�?
        if (hasSpec) {
            specifiers.push(SlimeJavascriptCreateUtils.createImportSpecifierItem(currentSpec!, undefined))
        }

        return {specifiers, lBraceToken, rBraceToken}
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
                asToken = SlimeJavascriptTokenCreateUtils.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = SlimeCstToAstUtil.createImportedBindingAst(child)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = SlimeCstToAstUtil.createModuleExportNameAst(child) as SlimeJavascriptIdentifier
                }
            }
        }

        // 如果没有 as，imported �?local 相同
        if (!local && imported) {
            local = {...imported}
        }
        if (!imported && local) {
            imported = {...local}
        }

        return SlimeJavascriptCreateUtils.createImportSpecifier(imported!, local!, asToken)
    }


    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    createImportCallAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ImportCall?.name);
        // ImportCall -> ImportTok + LParen + AssignmentExpression + (Comma + AssignmentExpression)? + Comma? + RParen
        // children: [ImportTok, LParen, AssignmentExpression, (Comma, AssignmentExpression)?, Comma?, RParen]

        const args: SlimeCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                const expr = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                args.push(SlimeJavascriptCreateUtils.createCallArgument(expr))
            }
        }

        // 创建 import 标识符作�?callee
        const importIdentifier: SlimeIdentifier = SlimeJavascriptCreateUtils.createIdentifier('import', cst.children[0].loc)

        return SlimeJavascriptCreateUtils.createCallExpression(importIdentifier, args) as SlimeJavascriptExpression
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
                asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(child.loc)
            } else if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeJavascriptTokenCreateUtils.createAsToken(child.loc)
            }
        }

        const binding = cst.children.find(ch => ch.name === SlimeParser.prototype.ImportedBinding?.name)
        if (!binding) throw new Error('NameSpaceImport missing ImportedBinding')
        const local = SlimeCstToAstUtil.createImportedBindingAst(binding)

        return SlimeJavascriptCreateUtils.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }


    /**
     * ImportsList CST �?AST
     * ImportsList -> ImportSpecifier (, ImportSpecifier)*
     */
    createImportsListAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(SlimeCstToAstUtil.createImportSpecifierAst(child))
            }
        }
        return specifiers
    }


    /**
     * AttributeKey CST �?AST
     * AttributeKey -> IdentifierName | StringLiteral
     */
    createAttributeKeyAst(cst: SubhutiCst): SlimeIdentifier | SlimeJavascriptLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return SlimeCstToAstUtil.createIdentifierNameAst(firstChild)
        } else {
            return SlimeCstToAstUtil.createStringLiteralAst(firstChild)
        }
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
                currentKey = SlimeCstToAstUtil.createAttributeKeyAst(child)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: SlimeCstToAstUtil.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }


    /** 解析 WithClause: with { type: "json" } */
    createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        // WithClause: With, LBrace, WithEntries?, RBrace
        let withToken: any = undefined
        const attributes: any[] = []

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = {type: 'With', value: 'with', loc: child.loc}
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
                                    type: SlimeAstTypeName.Identifier,
                                    name: nameToken?.value || keyChild.value,
                                    loc: keyChild.loc
                                }
                            } else if (keyChild.name === 'StringLiteral' || keyChild.value?.startsWith('"') || keyChild.value?.startsWith("'")) {
                                currentKey = SlimeCstToAstUtil.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        // 这是 attribute 的�?
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: SlimeCstToAstUtil.createStringLiteralAst(entry),
                                loc: {...currentKey.loc, end: entry.loc?.end}
                            })
                            currentKey = null
                        }
                    }
                    // 跳过 Colon �?Comma
                }
            }
        }

        return {attributes, withToken}
    }


    createFromClauseAst(cst: SubhutiCst): { source: SlimeStringLiteral, fromToken?: any } {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = SlimeCstToAstUtil.createModuleSpecifierAst(cst.children[1])

        // 提取 from token
        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeJavascriptTokenCreateUtils.createFromToken(first.loc)
        }

        return {
            source: ModuleSpecifier,
            fromToken: fromToken
        }
    }

    createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        const ast = SlimeJavascriptCreateUtils.createStringLiteral(first.value)
        return ast
    }


    createImportedDefaultBindingAst(cst: SubhutiCst): SlimeImportDefaultSpecifier {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = SlimeCstToAstUtil.createImportedBindingAst(first)
        const importDefaultSpecifier: SlimeImportDefaultSpecifier = SlimeJavascriptCreateUtils.createImportDefaultSpecifier(id)
        return importDefaultSpecifier
    }

    createImportedBindingAst(cst: SubhutiCst): SlimeIdentifier {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return SlimeCstToAstUtil.createBindingIdentifierAst(first)
    }


}

export const SlimeJavascriptImportCstToAst = new SlimeJavascriptImportCstToAstSingle()
