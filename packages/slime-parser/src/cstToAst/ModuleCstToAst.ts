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
    type SlimeDeclaration,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createStatementListAst(cst: SubhutiCst): Array<SlimeStatement>;
    createStatementListItemAst(cst: SubhutiCst): Array<SlimeStatement>;
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createIdentifierNameAst(cst: SubhutiCst): SlimeIdentifier;
    createStringLiteralAst(cst: SubhutiCst): SlimeStringLiteral;
    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration;
    createHoistableDeclarationAst(cst: SubhutiCst): any;
    createClassDeclarationAst(cst: SubhutiCst): any;
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createVariableStatementAst(cst: SubhutiCst): any;
};

/**
 * 模块相关的 CST to AST 转换
 */
export class ModuleCstToAst {
    /**
     * [入口方法] 将顶层 CST 转换为 Program AST
     *
     * 支持 Module、Script、Program 多种顶层 CST
     */
    static toProgram(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        // Support both Module and Script entry points
        const isModule = cst.name === SlimeParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeProgram
        let hashbangComment: string | null = null

        // If children is empty, return empty program
        if (!cst.children || cst.children.length === 0) {
            return SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        // 遍历子节点，处理 HashbangComment 和主体内容
        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                // 提取 Hashbang 注释的值
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                child.name === 'ModuleItemList' || child.name === SlimeParser.prototype.ModuleItemList?.name ||
                child.name === 'StatementList' || child.name === SlimeParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        // 处理主体内容
        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeParser.prototype.ModuleItemList?.name)) {
                    const body = ModuleCstToAst.createModuleItemListAst(moduleItemList, converter)
                    program = SlimeAstUtil.createProgram(body, 'module')
                } else {
                    program = SlimeAstUtil.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = ModuleCstToAst.createModuleItemListAst(bodyChild, converter)
                program = SlimeAstUtil.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    const body = converter.createStatementListAst(statementList)
                    program = SlimeAstUtil.createProgram(body, 'script')
                } else {
                    program = SlimeAstUtil.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                const body = converter.createStatementListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            // 没有主体内容（可能只有 HashbangComment）
            program = SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        // 设置 hashbang 注释（如果存在）
        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    /**
     * Program CST 转 AST
     */
    static createProgramAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === 'Script' || firstChild.name === SlimeParser.prototype.Script?.name) {
                return ModuleCstToAst.createScriptAst(firstChild, converter)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeParser.prototype.Module?.name) {
                return ModuleCstToAst.createModuleAst(firstChild, converter)
            }
        }
        // 如果直接就是内容，调用 toProgram
        return ModuleCstToAst.toProgram(cst, converter)
    }


    /**
     * Script CST 转 AST
     */
    static createScriptAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return ModuleCstToAst.createScriptBodyAst(scriptBody, converter)
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * ScriptBody CST 转 AST
     */
    static createScriptBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            const body = converter.createStatementListAst(stmtList)
            return SlimeAstUtil.createProgram(body, 'script')
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    /**
     * Module CST 转 AST
     */
    static createModuleAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        const moduleBody = cst.children?.find(ch =>
            ch.name === 'ModuleBody' || ch.name === SlimeParser.prototype.ModuleBody?.name
        )
        if (moduleBody) {
            return ModuleCstToAst.createModuleBodyAst(moduleBody, converter)
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * ModuleBody CST 转 AST
     */
    static createModuleBodyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeProgram {
        const moduleItemList = cst.children?.find(ch =>
            ch.name === 'ModuleItemList' || ch.name === SlimeParser.prototype.ModuleItemList?.name
        )
        if (moduleItemList) {
            const body = ModuleCstToAst.createModuleItemListAst(moduleItemList, converter)
            return SlimeAstUtil.createProgram(body, 'module')
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    /**
     * ModuleItemList CST 转 AST
     */
    static createModuleItemListAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeStatement | SlimeModuleDeclaration> {
        const asts = cst.children.map(item => {
            if (item.name === SlimeParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return ModuleCstToAst.createModuleItemAst(innerItem, converter)
            }
            return ModuleCstToAst.createModuleItemAst(item, converter)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }

    /**
     * ModuleItem CST 转 AST
     */
    static createModuleItemAst(item: SubhutiCst, converter: SlimeCstToAstType): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        const name = item.name
        if (name === SlimeParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return ModuleCstToAst.createExportDeclarationAst(item, converter)
        } else if (name === SlimeParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return ModuleCstToAst.createImportDeclarationAst(item, converter)
        } else if (name === SlimeParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return converter.createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }


    // ==================== Import 相关方法 ====================

    /**
     * ImportDeclaration CST 转 AST
     */
    static createImportDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeImportDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ImportDeclaration?.name)
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
            const parsed = ModuleCstToAst.createWithClauseAst(withClauseCst, converter)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        if (first1.name === SlimeParser.prototype.ImportClause?.name) {
            const clauseResult = ModuleCstToAst.createImportClauseAst(first1, converter)
            const fromClause = ModuleCstToAst.createFromClauseAst(cst.children[2], converter)
            importDeclaration = SlimeAstUtil.createImportDeclaration(
                clauseResult.specifiers, fromClause.source, cst.loc,
                importToken, fromClause.fromToken,
                clauseResult.lBraceToken, clauseResult.rBraceToken,
                semicolonToken, attributes, withToken
            )
        } else if (first1.name === SlimeParser.prototype.ModuleSpecifier?.name) {
            // import 'module' (side effect import) 或 import 'module' with {...}
            const source = ModuleCstToAst.createModuleSpecifierAst(first1)
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
     * ImportClause CST 转 AST
     */
    static createImportClauseAst(cst: SubhutiCst, converter: SlimeCstToAstType): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ImportClause?.name)
        const result: Array<SlimeImportSpecifierItem> = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.ImportedDefaultBinding?.name) {
            // 默认导入
            const specifier = ModuleCstToAst.createImportedDefaultBindingAst(first, converter)
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
                const namedResult = ModuleCstToAst.createNamedImportsListAstWrapped(namedImportsCst, converter)
                result.push(...namedResult.specifiers)
                lBraceToken = namedResult.lBraceToken
                rBraceToken = namedResult.rBraceToken
            } else if (namespaceImportCst) {
                result.push(SlimeAstUtil.createImportSpecifierItem(
                    ModuleCstToAst.createNameSpaceImportAst(namespaceImportCst, converter), undefined
                ))
            }
        } else if (first.name === SlimeParser.prototype.NameSpaceImport?.name) {
            // import * as name from 'module'
            result.push(SlimeAstUtil.createImportSpecifierItem(ModuleCstToAst.createNameSpaceImportAst(first, converter), undefined))
        } else if (first.name === SlimeParser.prototype.NamedImports?.name) {
            // import {name, greet} from 'module'
            const namedResult = ModuleCstToAst.createNamedImportsListAstWrapped(first, converter)
            result.push(...namedResult.specifiers)
            lBraceToken = namedResult.lBraceToken
            rBraceToken = namedResult.rBraceToken
        }

        return { specifiers: result, lBraceToken, rBraceToken }
    }

    /**
     * ImportedDefaultBinding CST 转 AST
     */
    static createImportedDefaultBindingAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeImportDefaultSpecifier {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ImportedDefaultBinding?.name)
        const first = cst.children[0]
        const id = ModuleCstToAst.createImportedBindingAst(first, converter)
        return SlimeAstUtil.createImportDefaultSpecifier(id)
    }

    /**
     * ImportedBinding CST 转 AST
     */
    static createImportedBindingAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ImportedBinding?.name)
        const first = cst.children[0]
        return converter.createBindingIdentifierAst(first)
    }


    /**
     * NameSpaceImport CST 转 AST
     * NameSpaceImport -> * as ImportedBinding
     */
    static createNameSpaceImportAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeImportNamespaceSpecifier {
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
        const local = ModuleCstToAst.createImportedBindingAst(binding, converter)

        return SlimeAstUtil.createImportNamespaceSpecifier(local, cst.loc, asteriskToken, asToken)
    }

    /**
     * NamedImports CST 转 AST
     * NamedImports -> { } | { ImportsList } | { ImportsList , }
     */
    static createNamedImportsAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeImportSpecifier> {
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
                    const imported = converter.createIdentifierNameAst(identifierName)
                    const local = ModuleCstToAst.createImportedBindingAst(binding, converter)
                    specifiers.push({
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any)
                } else if (binding) {
                    const id = ModuleCstToAst.createImportedBindingAst(binding, converter)
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
     * 返回包装类型的版本，包含 brace tokens
     */
    static createNamedImportsListAstWrapped(cst: SubhutiCst, converter: SlimeCstToAstType): { specifiers: Array<SlimeImportSpecifierItem>, lBraceToken?: any, rBraceToken?: any } {
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
                    const imported = ModuleCstToAst.createModuleExportNameAst(moduleExportName, converter)
                    const local = ModuleCstToAst.createImportedBindingAst(binding, converter)
                    currentSpec = {
                        type: SlimeNodeType.ImportSpecifier,
                        imported: imported,
                        local: local,
                        loc: child.loc
                    } as any
                } else if (binding) {
                    const id = ModuleCstToAst.createImportedBindingAst(binding, converter)
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

    /**
     * ImportsList CST 转 AST
     */
    static createImportsListAst(cst: SubhutiCst, converter: SlimeCstToAstType): Array<SlimeImportSpecifier> {
        const specifiers: SlimeImportSpecifier[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ImportSpecifier?.name ||
                child.name === 'ImportSpecifier') {
                specifiers.push(ModuleCstToAst.createImportSpecifierAst(child, converter))
            }
        }
        return specifiers
    }

    /**
     * ImportSpecifier CST 转 AST
     */
    static createImportSpecifierAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeImportSpecifier {
        const children = cst.children || []
        let imported: SlimeIdentifier | null = null
        let local: SlimeIdentifier | null = null
        let asToken: any = undefined

        for (const child of children) {
            if (child.name === 'As' || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            } else if (child.name === SlimeParser.prototype.ImportedBinding?.name ||
                child.name === 'ImportedBinding') {
                local = ModuleCstToAst.createImportedBindingAst(child, converter)
            } else if (child.name === SlimeParser.prototype.ModuleExportName?.name ||
                child.name === 'ModuleExportName' ||
                child.name === SlimeParser.prototype.IdentifierName?.name ||
                child.name === 'IdentifierName') {
                if (!imported) {
                    imported = ModuleCstToAst.createModuleExportNameAst(child, converter) as SlimeIdentifier
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


    // ==================== Export 相关方法 ====================

    /**
     * ExportDeclaration CST 转 AST
     */
    static createExportDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ExportDeclaration?.name)
        const children = cst.children || []

        // Token fields
        let exportToken: any = undefined
        let defaultToken: any = undefined
        let asteriskToken: any = undefined
        let semicolonToken: any = undefined
        let asToken: any = undefined

        // 遍历子节点提取信息
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
            const parsed = ModuleCstToAst.createWithClauseAst(withClauseCst, converter)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        // export default ...
        if (isDefault) {
            let decl: any = null
            if (hoistableDeclaration) {
                decl = converter.createHoistableDeclarationAst(hoistableDeclaration)
            } else if (classDeclaration) {
                decl = converter.createClassDeclarationAst(classDeclaration)
            } else if (assignmentExpression) {
                decl = converter.createAssignmentExpressionAst(assignmentExpression)
            }
            return SlimeAstUtil.createExportDefaultDeclaration(decl, cst.loc, exportToken, defaultToken)
        }

        // export ExportFromClause FromClause ; (export * from ... or export { } from ...)
        if (exportFromClause && fromClause) {
            const fromClauseResult = ModuleCstToAst.createFromClauseAst(fromClause, converter)

            const hasAsterisk = exportFromClause.children?.some((ch: any) =>
                ch.name === SlimeTokenConsumer.prototype.Asterisk?.name || ch.value === '*')

            if (hasAsterisk) {
                let exported: any = null
                const moduleExportName = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name)
                if (moduleExportName) {
                    exported = ModuleCstToAst.createModuleExportNameAst(moduleExportName, converter)
                }
                const result = SlimeAstUtil.createExportAllDeclaration(
                    fromClauseResult.source, exported, cst.loc,
                    exportToken, asteriskToken, asToken, fromClauseResult.fromToken, semicolonToken
                ) as any
                if (withToken) {
                    result.attributes = attributes
                    result.withToken = withToken
                }
                return result
            } else {
                const namedExportsCst = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.NamedExports?.name || ch.name === 'NamedExports'
                )
                const specifiers = namedExportsCst
                    ? ModuleCstToAst.createNamedExportsAst(namedExportsCst, converter)
                    : []
                const result = SlimeAstUtil.createExportNamedDeclaration(
                    null, specifiers, fromClauseResult.source, cst.loc,
                    exportToken, fromClauseResult.fromToken, semicolonToken
                )
                if (withToken) {
                    (result as any).attributes = attributes;
                    (result as any).withToken = withToken
                }
                return result
            }
        }

        // export NamedExports ; (export { ... })
        if (namedExports) {
            const specifiers = ModuleCstToAst.createNamedExportsAst(namedExports, converter)
            return SlimeAstUtil.createExportNamedDeclaration(
                null, specifiers, null, cst.loc, exportToken, undefined, semicolonToken
            )
        }

        // export VariableStatement
        if (variableStatement) {
            const decl = converter.createVariableStatementAst(variableStatement)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        // export Declaration
        if (declaration) {
            const decl = converter.createDeclarationAst(declaration)
            return SlimeAstUtil.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        throw new Error(`Unsupported export declaration structure`)
    }


    /**
     * NamedExports CST 转 AST (export { a, b, c })
     */
    static createNamedExportsAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportsList?.name) {
                return ModuleCstToAst.createExportsListAst(child, converter)
            } else if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                specifiers.push({ specifier: ModuleCstToAst.createExportSpecifierAst(child, converter) })
            }
        }

        return specifiers
    }

    /**
     * ExportsList CST 转 AST
     */
    static createExportsListAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []
        let lastSpecifier: SlimeExportSpecifier | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                if (lastSpecifier) {
                    specifiers.push({ specifier: lastSpecifier })
                }
                lastSpecifier = ModuleCstToAst.createExportSpecifierAst(child, converter)
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
     * ExportSpecifier CST 转 AST
     */
    static createExportSpecifierAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExportSpecifier {
        const children = cst.children || []
        let local: any = null
        let exported: any = null
        let asToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === SlimeParser.prototype.ModuleExportName?.name) {
                if (!local) {
                    local = ModuleCstToAst.createModuleExportNameAst(child, converter)
                } else {
                    exported = ModuleCstToAst.createModuleExportNameAst(child, converter)
                }
            } else if (child.name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        if (!exported) {
            exported = local
        }

        return SlimeAstUtil.createExportSpecifier(local, exported, cst.loc, asToken)
    }

    /**
     * ExportFromClause CST 转 AST
     */
    static createExportFromClauseAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        const children = cst.children || []

        const asterisk = children.find(ch => ch.name === 'Asterisk' || ch.value === '*')
        if (asterisk) {
            const asTok = children.find(ch => ch.name === 'As' || ch.value === 'as')
            const exportedName = children.find(ch =>
                ch.name === SlimeParser.prototype.ModuleExportName?.name ||
                ch.name === 'ModuleExportName'
            )

            if (asTok && exportedName) {
                return {
                    type: 'exportAll',
                    exported: ModuleCstToAst.createModuleExportNameAst(exportedName, converter)
                }
            } else {
                return { type: 'exportAll', exported: null }
            }
        }

        const namedExports = children.find(ch =>
            ch.name === SlimeParser.prototype.NamedExports?.name ||
            ch.name === 'NamedExports'
        )
        if (namedExports) {
            return {
                type: 'namedExports',
                specifiers: ModuleCstToAst.createNamedExportsAst(namedExports, converter)
            }
        }

        return { type: 'unknown' }
    }


    // ==================== 辅助方法 ====================

    /**
     * ModuleExportName CST 转 AST
     */
    static createModuleExportNameAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral {
        const first = cst.children?.[0]
        if (!first) {
            throw new Error('ModuleExportName has no children')
        }

        if (first.name === SlimeParser.prototype.IdentifierName?.name) {
            return converter.createIdentifierNameAst(first)
        } else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeAstUtil.createStringLiteral(first.value, first.loc)
        } else {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }
    }

    /**
     * ModuleSpecifier CST 转 AST
     */
    static createModuleSpecifierAst(cst: SubhutiCst): SlimeStringLiteral {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.ModuleSpecifier?.name)
        const first = cst.children[0]
        return SlimeAstUtil.createStringLiteral(first.value)
    }

    /**
     * FromClause CST 转 AST
     */
    static createFromClauseAst(cst: SubhutiCst, converter: SlimeCstToAstType): { source: SlimeStringLiteral, fromToken?: any } {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.FromClause?.name)
        const first = cst.children[0]
        const ModuleSpecifier = ModuleCstToAst.createModuleSpecifierAst(cst.children[1])

        let fromToken: any = undefined
        if (first && (first.name === 'From' || first.value === 'from')) {
            fromToken = SlimeTokenCreate.createFromToken(first.loc)
        }

        return {
            source: ModuleSpecifier,
            fromToken: fromToken
        }
    }

    /**
     * WithClause CST 转 AST (ES2025 Import Attributes)
     */
    static createWithClauseAst(cst: SubhutiCst, converter: SlimeCstToAstType): { attributes: any[], withToken: any } {
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
                                currentKey = converter.createStringLiteralAst(keyChild)
                            }
                        }
                    } else if (entry.name === 'StringLiteral' || entry.value?.startsWith('"') || entry.value?.startsWith("'")) {
                        if (currentKey) {
                            attributes.push({
                                type: 'ImportAttribute',
                                key: currentKey,
                                value: converter.createStringLiteralAst(entry),
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
     * WithEntries CST 转 AST
     */
    static createWithEntriesAst(cst: SubhutiCst, converter: SlimeCstToAstType): any[] {
        const entries: any[] = []
        let currentKey: any = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AttributeKey?.name ||
                child.name === 'AttributeKey') {
                currentKey = ModuleCstToAst.createAttributeKeyAst(child, converter)
            } else if (child.name === 'StringLiteral' ||
                (child.value && (child.value.startsWith('"') || child.value.startsWith("'")))) {
                if (currentKey) {
                    entries.push({
                        type: 'ImportAttribute',
                        key: currentKey,
                        value: converter.createStringLiteralAst(child)
                    })
                    currentKey = null
                }
            }
        }

        return entries
    }

    /**
     * AttributeKey CST 转 AST
     */
    static createAttributeKeyAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeIdentifier | SlimeLiteral {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AttributeKey has no children')

        if (firstChild.name === SlimeParser.prototype.IdentifierName?.name ||
            firstChild.name === 'IdentifierName' ||
            firstChild.value !== undefined && !firstChild.value.startsWith('"') && !firstChild.value.startsWith("'")) {
            return converter.createIdentifierNameAst(firstChild)
        } else {
            return converter.createStringLiteralAst(firstChild)
        }
    }
}
