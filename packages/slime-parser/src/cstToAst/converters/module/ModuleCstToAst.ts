import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    SlimeFunctionParam,
    SlimeModuleDeclaration,
    SlimePattern,
    SlimeProgram,
    SlimeStatement
} from "slime-ast";
import SlimeParser from "../../../SlimeParser.ts";

export default class ModuleCstToAst{
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
                return SlimeCstToAstUtil.createScriptAst(firstChild)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeParser.prototype.Module?.name) {
                return SlimeCstToAstUtil.createModuleAst(firstChild)
            }
        }
        // 如果直接就是内容，调�?toProgram
        return SlimeCstToAstUtil.toProgram(cst)
    }

    /**
     * Script CST �?AST
     */
    createScriptAst(cst: SubhutiCst): SlimeProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return SlimeCstToAstUtil.createScriptBodyAst(scriptBody)
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
            const body = SlimeCstToAstUtil.createStatementListAst(stmtList)
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
            return SlimeCstToAstUtil.createModuleBodyAst(moduleBody)
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
            const body = SlimeCstToAstUtil.createModuleItemListAst(moduleItemList)
            return SlimeAstUtil.createProgram(body, 'module')
        }
        return SlimeAstUtil.createProgram([], 'module')
    }


    createModuleItemAst(item: SubhutiCst): SlimeStatement | SlimeModuleDeclaration | SlimeStatement[] | undefined {
        const name = item.name
        if (name === SlimeParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return SlimeCstToAstUtil.createExportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return SlimeCstToAstUtil.createImportDeclarationAst(item)
        } else if (name === SlimeParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return SlimeCstToAstUtil.createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }



    /**
     * 重置状态钩子方法
     *
     * [入口方法] 将顶层 CST 转换为 Program AST
     *
     * 存在必要性：这是外部调用的主入口，支持 Module、Script、Program 多种顶层 CST
     *
     * 注意：子类如需重置状态，应重写此方法，先调用自己的 resetState()，再调用 super.toProgram()
     */
    toProgram(cst: SubhutiCst): SlimeProgram {
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

        // 遍历子节点，处理 HashbangComment 和主体内�?
        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                // 提取 Hashbang 注释的�?
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
                    const body = SlimeCstToAstUtil.createModuleItemListAst(moduleItemList)
                    program = SlimeAstUtil.createProgram(body, 'module')
                } else {
                    program = SlimeAstUtil.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = SlimeCstToAstUtil.createModuleItemListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    const body = SlimeCstToAstUtil.createStatementListAst(statementList)
                    program = SlimeAstUtil.createProgram(body, 'script')
                } else {
                    program = SlimeAstUtil.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                const body = SlimeCstToAstUtil.createStatementListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            // 没有主体内容（可能只�?HashbangComment�?
            program = SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        // 设置 hashbang 注释（如果存在）
        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeStatement | SlimeModuleDeclaration> {
        const asts = cst.children.map(item => {
            // Es2025Parser uses ModuleItem wrapper
            if (item.name === SlimeParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return SlimeCstToAstUtil.createModuleItemAst(innerItem)
            }
            // Fallback: direct type
            return SlimeCstToAstUtil.createModuleItemAst(item)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }


}