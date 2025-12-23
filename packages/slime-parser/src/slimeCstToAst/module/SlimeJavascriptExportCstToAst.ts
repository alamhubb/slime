/**
 * ExportCstToAst - export 相关转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptCreateUtils,
    SlimeJavascriptExportAllDeclaration,
    SlimeJavascriptExportDefaultDeclaration,
    SlimeJavascriptExportNamedDeclaration, SlimeJavascriptExportSpecifier, SlimeJavascriptExportSpecifierItem, SlimeJavascriptFunctionParam, SlimeJavascriptIdentifier,
    SlimeJavascriptLiteral,
    SlimeJavascriptModuleDeclaration, SlimeJavascriptPattern,
    SlimeJavascriptStatement, SlimeJavascriptTokenCreateUtils
} from "slime-ast";
import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";

import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import SlimeJavascriptTokenConsumer from "../../SlimeJavascriptTokenConsumer.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptExportCstToAstSingle {

    createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeJavascriptExportNamedDeclaration | SlimeJavascriptExportAllDeclaration {
        let astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.ExportDeclaration?.name);
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
            if (name === SlimeJavascriptTokenConsumer.prototype.Export?.name || child.value === 'export') {
                exportToken = SlimeJavascriptTokenCreateUtils.createExportToken(child.loc)
            } else if (name === SlimeJavascriptTokenConsumer.prototype.Default?.name || child.value === 'default') {
                defaultToken = SlimeJavascriptTokenCreateUtils.createDefaultToken(child.loc)
                isDefault = true
            } else if (name === SlimeJavascriptTokenConsumer.prototype.Asterisk?.name || child.value === '*') {
                asteriskToken = SlimeJavascriptTokenCreateUtils.createAsteriskToken(child.loc)
            } else if (name === SlimeJavascriptTokenConsumer.prototype.Semicolon?.name || child.value === ';') {
                semicolonToken = SlimeJavascriptTokenCreateUtils.createSemicolonToken(child.loc)
            } else if (name === SlimeJavascriptTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeJavascriptTokenCreateUtils.createAsToken(child.loc)
            } else if (name === SlimeJavascriptParser.prototype.ExportFromClause?.name) {
                exportFromClause = child
            } else if (name === SlimeJavascriptParser.prototype.FromClause?.name) {
                fromClause = child
            } else if (name === SlimeJavascriptParser.prototype.NamedExports?.name) {
                namedExports = child
            } else if (name === SlimeJavascriptParser.prototype.VariableStatement?.name) {
                variableStatement = child
            } else if (name === SlimeJavascriptParser.prototype.Declaration?.name) {
                declaration = child
            } else if (name === SlimeJavascriptParser.prototype.HoistableDeclaration?.name) {
                hoistableDeclaration = child
            } else if (name === SlimeJavascriptParser.prototype.ClassDeclaration?.name) {
                classDeclaration = child
            } else if (name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                assignmentExpression = child
            } else if (name === SlimeJavascriptParser.prototype.WithClause?.name || name === 'WithClause') {
                withClauseCst = child
            }
        }

        // 解析 WithClause (ES2025 Import Attributes)
        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = SlimeCstToAstUtil.createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        // export default ...
        if (isDefault) {
            let decl: any = null
            if (hoistableDeclaration) {
                decl = SlimeCstToAstUtil.createHoistableDeclarationAst(hoistableDeclaration)
            } else if (classDeclaration) {
                decl = SlimeCstToAstUtil.createClassDeclarationAst(classDeclaration)
            } else if (assignmentExpression) {
                decl = SlimeCstToAstUtil.createAssignmentExpressionAst(assignmentExpression)
            }
            return SlimeJavascriptCreateUtils.createExportDefaultDeclaration(decl, cst.loc, exportToken, defaultToken)
        }

        // export ExportFromClause FromClause ; (export * from ... or export { } from ...)
        if (exportFromClause && fromClause) {
            const fromClauseResult = SlimeCstToAstUtil.createFromClauseAst(fromClause)

            // Check if it's export * or export * as name
            const hasAsterisk = exportFromClause.children?.some((ch: any) =>
                ch.name === SlimeJavascriptTokenConsumer.prototype.Asterisk?.name || ch.value === '*')

            if (hasAsterisk) {
                // export * from ... or export * as name from ...
                let exported: any = null
                const moduleExportName = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeJavascriptParser.prototype.ModuleExportName?.name)
                if (moduleExportName) {
                    exported = SlimeCstToAstUtil.createModuleExportNameAst(moduleExportName)
                }
                const result = SlimeJavascriptCreateUtils.createExportAllDeclaration(
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
                    ch.name === SlimeJavascriptParser.prototype.NamedExports?.name || ch.name === 'NamedExports'
                )
                const specifiers = namedExportsCst
                    ? SlimeCstToAstUtil.createNamedExportsAst(namedExportsCst)
                    : []
                const result = SlimeJavascriptCreateUtils.createExportNamedDeclaration(
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
            const specifiers = SlimeCstToAstUtil.createNamedExportsAst(namedExports)
            return SlimeJavascriptCreateUtils.createExportNamedDeclaration(
                null, specifiers, null, cst.loc, exportToken, undefined, semicolonToken
            )
        }

        // export VariableStatement
        if (variableStatement) {
            const decl = SlimeCstToAstUtil.createVariableStatementAst(variableStatement)
            return SlimeJavascriptCreateUtils.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        // export Declaration
        if (declaration) {
            const decl = SlimeCstToAstUtil.createDeclarationAst(declaration)
            return SlimeJavascriptCreateUtils.createExportNamedDeclaration(
                decl, [], null, cst.loc, exportToken
            )
        }

        throw new Error(`Unsupported export declaration structure`)
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
                ch.name === SlimeJavascriptParser.prototype.ModuleExportName?.name ||
                ch.name === 'ModuleExportName'
            )

            if (asTok && exportedName) {
                // * as name
                return {
                    type: 'exportAll',
                    exported: SlimeCstToAstUtil.createModuleExportNameAst(exportedName)
                }
            } else {
                // * (export all)
                return {type: 'exportAll', exported: null}
            }
        }

        // NamedExports
        const namedExports = children.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.NamedExports?.name ||
            ch.name === 'NamedExports'
        )
        if (namedExports) {
            return {
                type: 'namedExports',
                specifiers: SlimeCstToAstUtil.createNamedExportsAst(namedExports)
            }
        }

        return {type: 'unknown'}
    }


    /**
     * 创建 NamedExports AST (export { a, b, c })
     */
    createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        // NamedExports: { ExportsList? }
        const specifiers: SlimeExportSpecifierItem[] = []

        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.ExportsList?.name) {
                return SlimeCstToAstUtil.createExportsListAst(child)
            } else if (child.name === SlimeJavascriptParser.prototype.ExportSpecifier?.name) {
                specifiers.push({specifier: SlimeCstToAstUtil.createExportSpecifierAst(child)})
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
            if (child.name === SlimeJavascriptParser.prototype.ExportSpecifier?.name) {
                if (lastSpecifier) {
                    specifiers.push({specifier: lastSpecifier})
                }
                lastSpecifier = SlimeCstToAstUtil.createExportSpecifierAst(child)
            } else if (child.name === SlimeJavascriptTokenConsumer.prototype.Comma?.name || child.value === ',') {
                if (lastSpecifier) {
                    specifiers.push({
                        specifier: lastSpecifier,
                        commaToken: SlimeTokenCreateUtils.createCommaToken(child.loc)
                    })
                    lastSpecifier = null
                }
            }
        }

        if (lastSpecifier) {
            specifiers.push({specifier: lastSpecifier})
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
            if (child.name === SlimeJavascriptParser.prototype.ModuleExportName?.name) {
                if (!local) {
                    local = SlimeCstToAstUtil.createModuleExportNameAst(child)
                } else {
                    exported = SlimeCstToAstUtil.createModuleExportNameAst(child)
                }
            } else if (child.name === SlimeJavascriptTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeJavascriptTokenCreateUtils.createAsToken(child.loc)
            }
        }

        // If no 'as', exported is same as local
        if (!exported) {
            exported = local
        }

        return SlimeJavascriptCreateUtils.createExportSpecifier(local, exported, cst.loc, asToken)
    }

    /**
     * 创建 ModuleExportName AST
     */
    createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeJavascriptLiteral {
        const first = cst.children?.[0]
        if (!first) {
            throw new Error('ModuleExportName has no children')
        }

        if (first.name === SlimeJavascriptParser.prototype.IdentifierName?.name) {
            return SlimeCstToAstUtil.createIdentifierNameAst(first)
        } else if (first.name === SlimeJavascriptTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeJavascriptCreateUtils.createStringLiteral(first.value, first.loc)
        } else {
            // Direct token
            return SlimeJavascriptCreateUtils.createIdentifier(first.value, first.loc)
        }
    }

}

export const SlimeJavascriptExportCstToAst = new SlimeJavascriptExportCstToAstSingle()
