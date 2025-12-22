/**
 * ImportCstToAst - import 相关转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstUtil, SlimeJavascriptCallArgument, SlimeJavascriptExpression,
    SlimeJavascriptIdentifier, type SlimeJavascriptImportDeclaration, SlimeJavascriptImportDefaultSpecifier, SlimeJavascriptImportNamespaceSpecifier,
    SlimeJavascriptImportSpecifier, SlimeJavascriptImportSpecifierItem, SlimeJavascriptLiteral,
    type SlimeJavascriptModuleDeclaration, SlimeJavascriptAstTypeName, SlimeJavascriptPattern, type SlimeJavascriptStatement,
    SlimeJavascriptStringLiteral, SlimeJavascriptTokenCreate, SlimeJavascriptVariableDeclarator
} from "slime-ast";
import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";

import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

export class ImportCstToAst {

    static createImportDeclarationAst(cst: SubhutiCst): SlimeJavascriptImportDeclaration {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ImportDeclaration?.name);
        const first = cst.children[0]
        const first1 = cst.children[1]
        let importDeclaration!: SlimeJavascriptImportDeclaration

        // Token fields
        let importToken: any = undefined
        let semicolonToken: any = undefined

        // 提取 import token
        if (first && (first.name === 'Import' || first.value === 'import')) {
            importToken = SlimeJavascriptTokenCreate.createImportToken(first.loc)
        }

        // 查找 semicolon
        const semicolonCst = cst.children.find(ch => ch.name === 'Semicolon' || ch.value === ';')
        if (semicolonCst) {
            semicolonToken = SlimeJavascriptTokenCreate.createSemicolonToken(semicolonCst.loc)
        }

        // 查找 WithClause (ES2025 Import Attributes)
        const withClauseCst = cst.children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.WithClause?.name || ch.name === 'WithClause'
        )
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = SlimeJavascriptCstToAstUtil.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeJavascriptParser.prototype.ImportClause?.name) {
            const clauseResult = SlimeJavascriptCstToAstUtil.createImportClauseAst(first1)
            const fromClause = SlimeJavascriptCstToAstUtil.createFromClauseAst(cst.children[2])
            importDeclaration = SlimeJavascriptAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeJavascriptParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) �?import 'module' with {...}
            const source = SlimeJavascriptCstToAstUtil.createModuleSpecifierAst(first1)
            importDeclaration = SlimeJavascriptAstUtil.createImportDeclaration(
                [], source, cst.loc,
                importToken, undefined,
                undefined, undefined,
                semicolonToken, attributes, withToken
            )
        }
        return importDeclaration
    }

    static createImportClauseAst(cst: SubhutiCst): {
        specifiers: Array<SlimeJavascriptImportSpecifierItem>,
        lBraceToken?: any,
        rBraceToken?: any
    } {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ImportClause?.name);
        const result: Array<SlimeJavascriptImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeJavascriptParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = SlimeJavascriptCstToAstUtil.createImportedDefaultBindingAst(first)
            // 查找后面的逗号
            const commaCst = cst.children.find(ch => ch.name === 'Comma' || ch.value === ',')
            const commaToken = commaCst ? SlimeJavascriptTokenCreate.createCommaToken(commaCst.loc) : undefined
            result.push(SlimeJavascriptAstUtil.createImportSpecifierItem(specifier, commaToken))

            // 检查是否还�?NamedImports �?NameSpaceImport（混合导入）
            const namedImportsCst = cst.children.find(ch =>
                ch.name === SlimeJavascriptParser.prototype.NamedImports?.name || ch.name === 'NamedImports'
            )
            const namespaceImportCst = cst.children.find(ch =>
                ch.name === SlimeJavascriptParser.prototype.NameSpaceImport?.name || ch.name === 'NameSpaceImport'
            )

            if (namedImportsCst) {
                const namedResult = SlimeJavascriptCstToAstUtil.createNamedImportsListAstWrapped(namedImportsCst)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeJavascriptAstUtil.createImportSpecifierItem(
                    SlimeJavascriptCstToAstUtil.createNameSpaceImportAst(namespaceImportCst), undefined
                ))
            }
        } else if (first.name === SlimeJavascriptParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeJavascriptAstUtil.createImportSpecifierItem(SlimeJavascriptCstToAstUtil.createNameSpaceImportAst(first), undefined))
        } else if (first.name === SlimeJavascriptParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = SlimeJavascriptCstToAstUtil.createNamedImportsListAstWrapped(first)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return {specifiers: result, lBraceToken, rBraceToken}
    }

    /**
     * NamedImports CST 转 AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    static createNamedImportsAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        // NamedImports: {LBrace, ImportsList?, RBrace}
        const importsList = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.ImportsList?.name)
        if (!importsList) return []

        const specifiers: Array<SlimeJavascriptImportSpecifier> = []
        for (const child of importsList.children) {
            if (child.name === SlimeJavascriptParser.prototype.ImportSpecifier?.name) {
                // ImportSpecifier有两种形式：
                // 1. ImportedBinding （简写）
                // 2. IdentifierName AsTok ImportedBinding （重命名）

                const identifierName = child.children.find((ch: any) =>
                    ch.name === SlimeJavascriptParser.prototype.IdentifierName?.name)
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeJavascriptParser.prototype.ImportedBinding?.name)

                if (identifierName && binding) {
                    // import {name as localName} 或 import {default as MyClass} - 重命名形式
                    const imported = SlimeJavascriptCstToAstUtil.createIdentifierNameAst(identifierName)
                    const local = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeJavascriptAstTypeName.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    // import {name} - 简写形式
                    const id = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)
                    specifiers.push({
                        type: SlimeJavascriptAstTypeName.ImportSpecifier,
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
    static createNamedImportsListAstWrapped(cst: SubhutiCst): {
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
                lBraceToken = SlimeJavascriptTokenCreate.createLBraceToken(child.loc)
            } else if (child.name === 'RBrace' || child.value === '}') {
                rBraceToken = SlimeJavascriptTokenCreate.createRBraceToken(child.loc)
            }
        }

        const importsList = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.ImportsList?.name)
        // 空命名导�?import {} from "foo" - 返回�?specifiers 但有 brace tokens
        if (!importsList) return {specifiers: [], lBraceToken, rBraceToken}

        const specifiers: Array<SlimeJavascriptImportSpecifierItem> = []
        let currentSpec: SlimeJavascriptImportSpecifier | null = null
        let hasSpec = false

        for (let i = 0; i < importsList.children.length; i++) {
            const child = importsList.children[i]

            if (child.name === SlimeJavascriptParser.prototype.ImportSpecifier?.name) {
                // 如果之前�?specifier 但没有逗号，先推入
                if (hasSpec) {
                    specifiers.push(SlimeJavascriptAstUtil.createImportSpecifierItem(currentSpec!, undefined))
                }

                // ES2025: ImportSpecifier 结构可能�?
                // 1. ModuleExportName "as" ImportedBinding (别名形式)
                // 2. ImportedBinding (简写形�?
                const moduleExportName = child.children.find((ch: any) =>
                    ch.name === SlimeJavascriptParser.prototype.ModuleExportName?.name || ch.name === 'ModuleExportName')
                const binding = child.children.find((ch: any) =>
                    ch.name === SlimeJavascriptParser.prototype.ImportedBinding?.name || ch.name === 'ImportedBinding')

                if (moduleExportName && binding) {
                    // 别名形式: import { foo as bar }
                    const imported = SlimeJavascriptCstToAstUtil.createModuleExportNameAst(moduleExportName)
                    const local = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeJavascriptAstTypeName.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    // 简写形�? import { foo }
                    const id = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)
                    currentSpec = {
                        type: SlimeJavascriptAstTypeName.ImportSpecifier,
                        imported: id,
                        local: id,
                        loc: child.loc
                    } as any
                }
                hasSpec = true
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的 specifier 配对
                if (hasSpec) {
                    const commaToken = SlimeJavascriptTokenCreate.createCommaToken(child.loc)
                    specifiers.push(SlimeJavascriptAstUtil.createImportSpecifierItem(currentSpec!, commaToken))
                    hasSpec = false
                    currentSpec = null
                }
            }
        }

        // 处理最后一�?specifier（没有尾随逗号�?
        if (hasSpec) {
            specifiers.push(SlimeJavascriptAstUtil.createImportSpecifierItem(currentSpec!, undefined))
        }

        return {specifiers, lBraceToken, rBraceToken}
    }

    /**
     * ImportSpecifier CST �?AST
     * ImportSpecifier -> ImportedBinding | ModuleExportName as ImportedBinding
     */
    static createImportSpecifierAst(cst: SubhutiCst): SlimeJavascriptImportSpecifier {
        const children = cst.children || []
        let imported: SlimeJavascriptIdentifier | null = null
        let local: SlimeJavascriptIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeJavascriptTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeJavascriptParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = SlimeJavascriptCstToAstUtil.createImportedBindingAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeJavascriptParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = SlimeJavascriptCstToAstUtil.createModuleExportNameAst(child) as SlimeJavascriptIdentifier
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

        return SlimeJavascriptAstUtil.createImportSpecifier(imported!, local!, asToken)
    }


    /**
     * 创建 ImportCall AST
     * ImportCall: import ( AssignmentExpression ,_opt )
     *           | import ( AssignmentExpression , AssignmentExpression ,_opt )
     */
    static createImportCallAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ImportCall?.name);
        // ImportCall -> ImportTok + LParen + AssignmentExpression + (Comma + AssignmentExpression)? + Comma? + RParen
        // children: [ImportTok, LParen, AssignmentExpression, (Comma, AssignmentExpression)?, Comma?, RParen]

        const args: SlimeJavascriptCallArgument[] = []

        for (const child of cst.children) {
            if (child.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                const expr = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(child)
                args.push(SlimeJavascriptAstUtil.createCallArgument(expr))
            }
        }

        // 创建 import 标识符作�?callee
        const importIdentifier: SlimeJavascriptIdentifier = SlimeJavascriptAstUtil.createIdentifier('import', cst.children[0].loc)

        return SlimeJavascriptAstUtil.createCallExpression(importIdentifier, args) as SlimeJavascriptExpression
    }


    /**
     * NameSpaceImport CST �?AST
     * NameSpaceImport -> * as ImportedBinding
     */
    static createNameSpaceImportAst(cst: SubhutiCst): SlimeJavascriptImportNamespaceSpecifier {
        // NameSpaceImport: Asterisk as ImportedBinding
        // children: [Asterisk, AsTok, ImportedBinding]
        let asteriskToken: any = undefined
        let asToken: any = undefined

        for (const child of cst.children) {
            if (child.name === 'Asterisk' || child.value === '*') {
                asteriskToken = SlimeJavascriptTokenCreate.createAsteriskToken(child.loc)
            } else if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeJavascriptTokenCreate.createAsToken(child.loc)
            }
        }

        const binding = cst.children.find(ch => ch.name === SlimeJavascriptParser.prototype.ImportedBinding?.name)
        if (!binding) throw new Error('NameSpaceImport missing ImportedBinding')
        const local = SlimeJavascriptCstToAstUtil.createImportedBindingAst(binding)

        return SlimeJavascriptAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }


    /**
     * ImportsList CST �?AST
     * ImportsList -> ImportSpecifier (, ImportSpecifier)*
     */
    static createImportsListAst(cst: SubhutiCst): Array<SlimeJavascriptImportSpecifier> {
        const specifiers: SlimeJavascriptImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(SlimeJavascriptCstToAstUtil.createImportSpecifierAst(child))
            }
        }
        return specifiers
    }


    /**
     * AttributeKey CST �?AST
     * AttributeKey -> IdentifierName | StringLiteral
     */
    static createAttributeKeyAst(cst: SubhutiCst): SlimeJavascriptIdentifier | SlimeJavascriptLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeJavascriptParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return SlimeJavascriptCstToAstUtil.createIdentifierNameAst(firstChild)
        } else {
            return SlimeJavascriptCstToAstUtil.createStringLiteralAst(firstChild)
        }
    }


    /**
     * WithEntries CST �?AST
     * WithEntries -> AttributeKey : StringLiteral (, AttributeKey : StringLiteral)*
     */
    static createWithEntriesAst(cst: SubhutiCst): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.AttributeKey?.name ||
                child.name === 'AttributeKey') {
                currentKey = SlimeJavascriptCstToAstUtil.createAttributeKeyAst(child)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: SlimeJavascriptCstToAstUtil.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }


    /** 解析 WithClause: with { type: "json" } */
    static createWithClauseAst(cst: SubhutiCst): { attributes: any[], withToken: any } {
        // WithClause: With, LBrace, WithEntries?, RBrace
        let withToken: any = undefined
        const attributes: any[] = []

        for (const child of cst.children || []) {
            if (child.name === 'With' || child.value === 'with') {
                withToken = {type: 'With', value: 'with', loc: child.loc}
            } else if (child.name === SlimeJavascriptParser.prototype.WithEntries?.name || child.name === 'WithEntries') {
                // WithEntries 包含 AttributeKey, Colon, StringLiteral, 可能有多个用逗号分隔
                let currentKey: any = null
                for (const entry of child.children || []) {
                    if (entry.name === SlimeJavascriptParser.prototype.AttributeKey?.name || entry.name === 'AttributeKey') {
                        // AttributeKey 可能�?IdentifierName �?StringLiteral
                        const keyChild = entry.children?.[0]
                        if (keyChild) {
                            if (keyChild.name === 'IdentifierName' || keyChild.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
                                const nameToken = keyChild.children?.[0]
                                currentKey = {
                                    type: SlimeJavascriptAstTypeName.Identifier,
                                    name: nameToken?.value || keyChild.value,
                                    loc: keyChild.loc
                                }
                            } else if (keyChild.name === 'StringLiteral' || keyChild.value?.startsWith('"') || keyChild.value?.startsWith("'")) {
                                currentKey = SlimeJavascriptCstToAstUtil.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        // 这是 attribute 的�?
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: SlimeJavascriptCstToAstUtil.createStringLiteralAst(entry),
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


    static createFromClauseAst(cst: SubhutiCst): { source: SlimeJavascriptStringLiteral, fromToken?: any } {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.FromClause?.name);
        const first = cst.children[0]
        const ModuleSpecifier = SlimeJavascriptCstToAstUtil.createModuleSpecifierAst(cst.children[1])

        // 提取 from token
        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeJavascriptTokenCreate.createFromToken(first.loc)
        }

        return {
            source: ModuleSpecifier,
            fromToken: fromToken
        }
    }

    static createModuleSpecifierAst(cst: SubhutiCst): SlimeJavascriptStringLiteral {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ModuleSpecifier?.name);
        const first = cst.children[0]
        const ast = SlimeJavascriptAstUtil.createStringLiteral(first.value)
        return ast
    }


    static createImportedDefaultBindingAst(cst: SubhutiCst): SlimeJavascriptImportDefaultSpecifier {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ImportedDefaultBinding?.name);
        const first = cst.children[0]
        const id = SlimeJavascriptCstToAstUtil.createImportedBindingAst(first)
        const importDefaultSpecifier: SlimeJavascriptImportDefaultSpecifier = SlimeJavascriptAstUtil.createImportDefaultSpecifier(id)
        return importDefaultSpecifier
    }

    static createImportedBindingAst(cst: SubhutiCst): SlimeJavascriptIdentifier {
        let astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ImportedBinding?.name);
        const first = cst.children[0]
        return SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(first)
    }


}
