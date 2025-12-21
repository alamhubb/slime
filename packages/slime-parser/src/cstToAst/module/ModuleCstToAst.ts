import {
    type SlimeProgram,
    type SlimeStatement,
    type SlimeModuleDeclaration,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil } from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import { ImportCstToAst } from "./ImportCstToAst";
import { ExportCstToAst } from "./ExportCstToAst";


/**
 * 模块相关的 CST to AST 转换（核心入口）
 * Import/Export 具体实现委托给 ImportCstToAst 和 ExportCstToAst
 */
export class ModuleCstToAst {
    // ==================== 委托给 ImportCstToAst ====================
    static createImportDeclarationAst = ImportCstToAst.createImportDeclarationAst;
    static createImportClauseAst = ImportCstToAst.createImportClauseAst;
    static createImportedDefaultBindingAst = ImportCstToAst.createImportedDefaultBindingAst;
    static createImportedBindingAst = ImportCstToAst.createImportedBindingAst;
    static createNameSpaceImportAst = ImportCstToAst.createNameSpaceImportAst;
    static createNamedImportsAst = ImportCstToAst.createNamedImportsAst;
    static createImportsListAst = ImportCstToAst.createImportsListAst;
    static createImportSpecifierAst = ImportCstToAst.createImportSpecifierAst;
    static createNamedImportsListAstWrapped = ImportCstToAst.createNamedImportsListAstWrapped;
    static createFromClauseAst = ImportCstToAst.createFromClauseAst;
    static createModuleSpecifierAst = ImportCstToAst.createModuleSpecifierAst;
    static createWithClauseAst = ImportCstToAst.createWithClauseAst;
    static createWithEntriesAst = ImportCstToAst.createWithEntriesAst;
    static createAttributeKeyAst = ImportCstToAst.createAttributeKeyAst;

    // ==================== 委托给 ExportCstToAst ====================
    static createExportDeclarationAst = ExportCstToAst.createExportDeclarationAst;
    static createNamedExportsAst = ExportCstToAst.createNamedExportsAst;
    static createExportsListAst = ExportCstToAst.createExportsListAst;
    static createExportSpecifierAst = ExportCstToAst.createExportSpecifierAst;
    static createModuleExportNameAst = ExportCstToAst.createModuleExportNameAst;
    static createExportFromClauseAst = ExportCstToAst.createExportFromClauseAst;

    // ==================== Program/Module/Script 核心方法 ====================

    static createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        const asts = cst.children.map(item => {
            if (item.name === SlimeParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return ModuleCstToAst.createModuleItemAst(innerItem)
            }
            return ModuleCstToAst.createModuleItemAst(item)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }

    static createProgramAst(cst: SubhutiCst): SlimeProgram {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === 'Script' || firstChild.name === SlimeParser.prototype.Script?.name) {
                return ModuleCstToAst.createScriptAst(firstChild)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeParser.prototype.Module?.name) {
                return ModuleCstToAst.createModuleAst(firstChild)
            }
        }
        return getUtil().toProgram(cst)
    }

    static createScriptAst(cst: SubhutiCst): SlimeProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return ModuleCstToAst.createScriptBodyAst(scriptBody)
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    static createScriptBodyAst(cst: SubhutiCst): SlimeProgram {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeParser.prototype.StatementList?.name
        )
        if (stmtList) {
            const body = getUtil().createStatementListAst(stmtList)
            return SlimeAstUtil.createProgram(body, 'script')
        }
        return SlimeAstUtil.createProgram([], 'script')
    }

    static createModuleAst(cst: SubhutiCst): SlimeProgram {
        const moduleBody = cst.children?.find(ch =>
            ch.name === 'ModuleBody' || ch.name === SlimeParser.prototype.ModuleBody?.name
        )
        if (moduleBody) {
            return ModuleCstToAst.createModuleBodyAst(moduleBody)
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    static createModuleBodyAst(cst: SubhutiCst): SlimeProgram {
        const moduleItemList = cst.children?.find(ch =>
            ch.name === 'ModuleItemList' || ch.name === SlimeParser.prototype.ModuleItemList?.name
        )
        if (moduleItemList) {
            const body = ModuleCstToAst.createModuleItemListAst(moduleItemList)
            return SlimeAstUtil.createProgram(body, 'module')
        }
        return SlimeAstUtil.createProgram([], 'module')
    }

    static createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        const name = item.name
        if (name === SlimeParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return ExportCstToAst.createExportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return ImportCstToAst.createImportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return getUtil().createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }
}

// 向后兼容：re-export
export { ImportCstToAst } from "./ImportCstToAst.ts";
export { ExportCstToAst } from "./ExportCstToAst.ts";
