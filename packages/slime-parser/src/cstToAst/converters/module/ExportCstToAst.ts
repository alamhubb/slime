import {
    type SlimeExportDefaultDeclaration,
    type SlimeExportNamedDeclaration,
    type SlimeExportAllDeclaration,
    type SlimeExportSpecifier,
    type SlimeExportSpecifierItem,
    type SlimeIdentifier,
    type SlimeLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate } from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";

import { checkCstName, getUtil } from "../core/CstToAstContext";


declare var require: any;

// 延迟导入
let _ImportCstToAst: any = null;
function getImportCstToAst() {
    if (!_ImportCstToAst) {
        _ImportCstToAst = require('./ImportCstToAst').ImportCstToAst;
    }
    return _ImportCstToAst;
}

/**
 * Export 相关的 CST to AST 转换
 */
export class ExportCstToAst {

    static createExportDeclarationAst(cst: SubhutiCst): SlimeExportDefaultDeclaration | SlimeExportNamedDeclaration | SlimeExportAllDeclaration {
        checkCstName(cst, SlimeParser.prototype.ExportDeclaration?.name);
        const children = cst.children || []

        let exportToken: any = undefined
        let defaultToken: any = undefined
        let asteriskToken: any = undefined
        let semicolonToken: any = undefined
        let asToken: any = undefined

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

        let attributes: any[] = []
        let withToken: any = undefined
        if (withClauseCst) {
            const parsed = getImportCstToAst().createWithClauseAst(withClauseCst)
            attributes = parsed.attributes
            withToken = parsed.withToken
        }

        // export default ...
        if (isDefault) {
            let decl: any = null
            if (hoistableDeclaration) {
                decl = getUtil().createHoistableDeclarationAst(hoistableDeclaration)
            } else if (classDeclaration) {
                decl = getUtil().createClassDeclarationAst(classDeclaration)
            } else if (assignmentExpression) {
                decl = getUtil().createAssignmentExpressionAst(assignmentExpression)
            }
            return SlimeAstUtil.createExportDefaultDeclaration(decl, cst.loc, exportToken, defaultToken)
        }

        // export ExportFromClause FromClause ;
        if (exportFromClause && fromClause) {
            const fromClauseResult = getImportCstToAst().createFromClauseAst(fromClause)

            const hasAsterisk = exportFromClause.children?.some((ch: any) =>
                ch.name === SlimeTokenConsumer.prototype.Asterisk?.name || ch.value === '*')

            if (hasAsterisk) {
                let exported: any = null
                const moduleExportName = exportFromClause.children?.find((ch: any) =>
                    ch.name === SlimeParser.prototype.ModuleExportName?.name)
                if (moduleExportName) {
                    exported = ExportCstToAst.createModuleExportNameAst(moduleExportName)
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
                    ? ExportCstToAst.createNamedExportsAst(namedExportsCst)
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

        // export NamedExports ;
        if (namedExports) {
            const specifiers = ExportCstToAst.createNamedExportsAst(namedExports)
            return SlimeAstUtil.createExportNamedDeclaration(
                null, specifiers, null, cst.loc, exportToken, undefined, semicolonToken
            )
        }

        // export VariableStatement
        if (variableStatement) {
            const decl = getUtil().createVariableStatementAst(variableStatement)
            return SlimeAstUtil.createExportNamedDeclaration(decl, [], null, cst.loc, exportToken)
        }

        // export Declaration
        if (declaration) {
            const decl = getUtil().createDeclarationAst(declaration)
            return SlimeAstUtil.createExportNamedDeclaration(decl, [], null, cst.loc, exportToken)
        }

        throw new Error(`Unsupported export declaration structure`)
    }

    static createNamedExportsAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportsList?.name) {
                return ExportCstToAst.createExportsListAst(child)
            } else if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                specifiers.push({ specifier: ExportCstToAst.createExportSpecifierAst(child) })
            }
        }
        return specifiers
    }

    static createExportsListAst(cst: SubhutiCst): SlimeExportSpecifierItem[] {
        const specifiers: SlimeExportSpecifierItem[] = []
        let lastSpecifier: SlimeExportSpecifier | null = null

        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.ExportSpecifier?.name) {
                if (lastSpecifier) {
                    specifiers.push({ specifier: lastSpecifier })
                }
                lastSpecifier = ExportCstToAst.createExportSpecifierAst(child)
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

    static createExportSpecifierAst(cst: SubhutiCst): SlimeExportSpecifier {
        const children = cst.children || []
        let local: any = null
        let exported: any = null
        let asToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === SlimeParser.prototype.ModuleExportName?.name) {
                if (!local) {
                    local = ExportCstToAst.createModuleExportNameAst(child)
                } else {
                    exported = ExportCstToAst.createModuleExportNameAst(child)
                }
            } else if (child.name === SlimeTokenConsumer.prototype.As?.name || child.value === 'as') {
                asToken = SlimeTokenCreate.createAsToken(child.loc)
            }
        }

        if (!exported) exported = local
        return SlimeAstUtil.createExportSpecifier(local, exported, cst.loc, asToken)
    }

    static createModuleExportNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        const first = cst.children?.[0]
        if (!first) throw new Error('ModuleExportName has no children')

        if (first.name === SlimeParser.prototype.IdentifierName?.name) {
            return getUtil().createIdentifierNameAst(first)
        } else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name) {
            return SlimeAstUtil.createStringLiteral(first.value, first.loc)
        } else {
            return SlimeAstUtil.createIdentifier(first.value, first.loc)
        }
    }

    static createExportFromClauseAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const asterisk = children.find(ch => ch.name === 'Asterisk' || ch.value === '*')
        if (asterisk) {
            const asTok = children.find(ch => ch.name === 'As' || ch.value === 'as')
            const exportedName = children.find(ch =>
                ch.name === SlimeParser.prototype.ModuleExportName?.name || ch.name === 'ModuleExportName'
            )

            if (asTok && exportedName) {
                return { type: 'exportAll', exported: ExportCstToAst.createModuleExportNameAst(exportedName) }
            } else {
                return { type: 'exportAll', exported: null }
            }
        }

        const namedExports = children.find(ch =>
            ch.name === SlimeParser.prototype.NamedExports?.name || ch.name === 'NamedExports'
        )
        if (namedExports) {
            return { type: 'namedExports', specifiers: ExportCstToAst.createNamedExportsAst(namedExports) }
        }

        return { type: 'unknown' }
    }
}
