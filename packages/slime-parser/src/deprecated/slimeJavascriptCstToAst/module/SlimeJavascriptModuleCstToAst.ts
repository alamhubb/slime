import { SubhutiCst } from "subhuti";
import {
    SlimeAstCreateUtils,
    SlimeJavascriptCreateUtils,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptModuleDeclaration,
    SlimeJavascriptPattern,
    SlimeJavascriptProgram,
    SlimeJavascriptStatement, SlimeProgram
} from "slime-ast";
import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptModuleCstToAstSingle {

    /**
     * [TypeScript] 重写 toProgram 以使用新的 SlimeCstToAstUtil
     * 这确保了 TypeScript 类型注解能被正确处理
     */
    override toProgram(cst: SubhutiCst): SlimeProgram {
        const isModule = cst.name === SlimeParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeProgram
        let hashbangComment: string | null = null

        if (!cst.children || cst.children.length === 0) {
            return SlimeAstCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                child.name === 'ModuleItemList' || child.name === SlimeParser.prototype.ModuleItemList?.name ||
                child.name === 'StatementList' || child.name === SlimeParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeParser.prototype.ModuleItemList?.name)) {
                    const body = SlimeCstToAstUtil.createModuleItemListAst(moduleItemList)
                    program = SlimeAstCreateUtils.createProgram(body, 'module')
                } else {
                    program = SlimeAstCreateUtils.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = SlimeCstToAstUtil.createModuleItemListAst(bodyChild)
                program = SlimeAstCreateUtils.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeParser.prototype.StatementList?.name)) {
                    // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                    const body = SlimeCstToAstUtil.createStatementListAst(statementList)
                    program = SlimeAstCreateUtils.createProgram(body, 'script')
                } else {
                    program = SlimeAstCreateUtils.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                const body = SlimeCstToAstUtil.createStatementListAst(bodyChild)
                program = SlimeAstCreateUtils.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            program = SlimeAstCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
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
    toProgram(cst: SubhutiCst): SlimeJavascriptProgram {
        // Support both Module and Script entry points
        const isModule = cst.name === SlimeJavascriptParser.prototype.Module?.name || cst.name === 'Module'
        const isScript = cst.name === SlimeJavascriptParser.prototype.Script?.name || cst.name === 'Script'
        const isProgram = cst.name === SlimeJavascriptParser.prototype.Program?.name || cst.name === 'Program'

        if (!isModule && !isScript && !isProgram) {
            throw new Error(`Expected CST name 'Module', 'Script' or 'Program', but got '${cst.name}'`)
        }

        let program: SlimeJavascriptProgram
        let hashbangComment: string | null = null

        // If children is empty, return empty program
        if (!cst.children || cst.children.length === 0) {
            return SlimeJavascriptCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        // 遍历子节点，处理 HashbangComment 和主体内?
        let bodyChild: SubhutiCst | null = null
        for (const child of cst.children) {
            if (child.name === 'HashbangComment') {
                // 提取 Hashbang 注释的?
                hashbangComment = child.value || child.children?.[0]?.value || null
            } else if (child.name === 'ModuleBody' || child.name === 'ScriptBody' ||
                child.name === 'ModuleItemList' || child.name === SlimeJavascriptParser.prototype.ModuleItemList?.name ||
                child.name === 'StatementList' || child.name === SlimeJavascriptParser.prototype.StatementList?.name) {
                bodyChild = child
            }
        }

        // 处理主体内容
        if (bodyChild) {
            if (bodyChild.name === 'ModuleBody') {
                const moduleItemList = bodyChild.children?.[0]
                if (moduleItemList && (moduleItemList.name === 'ModuleItemList' || moduleItemList.name === SlimeJavascriptParser.prototype.ModuleItemList?.name)) {
                    const body = SlimeJavascriptCstToAstUtil.createModuleItemListAst(moduleItemList)
                    program = SlimeJavascriptCreateUtils.createProgram(body, 'module')
                } else {
                    program = SlimeJavascriptCreateUtils.createProgram([], 'module')
                }
            } else if (bodyChild.name === SlimeJavascriptParser.prototype.ModuleItemList?.name || bodyChild.name === 'ModuleItemList') {
                const body = SlimeJavascriptCstToAstUtil.createModuleItemListAst(bodyChild)
                program = SlimeJavascriptCreateUtils.createProgram(body, 'module')
            } else if (bodyChild.name === 'ScriptBody') {
                const statementList = bodyChild.children?.[0]
                if (statementList && (statementList.name === 'StatementList' || statementList.name === SlimeJavascriptParser.prototype.StatementList?.name)) {
                    const body = SlimeJavascriptCstToAstUtil.createStatementListAst(statementList)
                    program = SlimeJavascriptCreateUtils.createProgram(body, 'script')
                } else {
                    program = SlimeJavascriptCreateUtils.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeJavascriptParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                const body = SlimeJavascriptCstToAstUtil.createStatementListAst(bodyChild)
                program = SlimeJavascriptCreateUtils.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            // 没有主体内容（可能只?HashbangComment?
            program = SlimeJavascriptCreateUtils.createProgram([], isModule ? 'module' : 'script')
        }

        // 设置 hashbang 注释（如果存在）
        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }

    /**
     * Program CST ?AST
     *
     * 存在必要性：Program 是顶层入口规则，需要处?Script ?Module 两种情况?
     */
    createProgramAst(cst: SubhutiCst): SlimeJavascriptProgram {
        // 处理 Program -> Script | Module
        const firstChild = cst.children?.[0]
        if (firstChild) {
            if (firstChild.name === 'Script' || firstChild.name === SlimeJavascriptParser.prototype.Script?.name) {
                return SlimeJavascriptCstToAstUtil.createScriptAst(firstChild)
            } else if (firstChild.name === 'Module' || firstChild.name === SlimeJavascriptParser.prototype.Module?.name) {
                return SlimeJavascriptCstToAstUtil.createModuleAst(firstChild)
            }
        }
        // 如果直接就是内容，调?toProgram
        return SlimeJavascriptCstToAstUtil.toProgram(cst)
    }

    /**
     * Module CST ?AST
     */
    createModuleAst(cst: SubhutiCst): SlimeJavascriptProgram {
        const moduleBody = cst.children?.find(ch =>
            ch.name === 'ModuleBody' || ch.name === SlimeJavascriptParser.prototype.ModuleBody?.name
        )
        if (moduleBody) {
            return SlimeJavascriptCstToAstUtil.createModuleBodyAst(moduleBody)
        }
        return SlimeJavascriptCreateUtils.createProgram([], 'module')
    }

    /**
     * Script CST ?AST
     */
    createScriptAst(cst: SubhutiCst): SlimeJavascriptProgram {
        const scriptBody = cst.children?.find(ch =>
            ch.name === 'ScriptBody' || ch.name === SlimeJavascriptParser.prototype.ScriptBody?.name
        )
        if (scriptBody) {
            return SlimeJavascriptCstToAstUtil.createScriptBodyAst(scriptBody)
        }
        return SlimeJavascriptCreateUtils.createProgram([], 'script')
    }

    /**
     * ModuleBody CST ?AST
     */
    createModuleBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        const moduleItemList = cst.children?.find(ch =>
            ch.name === 'ModuleItemList' || ch.name === SlimeJavascriptParser.prototype.ModuleItemList?.name
        )
        if (moduleItemList) {
            const body = SlimeJavascriptCstToAstUtil.createModuleItemListAst(moduleItemList)
            return SlimeJavascriptCreateUtils.createProgram(body, 'module')
        }
        return SlimeJavascriptCreateUtils.createProgram([], 'module')
    }

    /**
     * ScriptBody CST ?AST
     */
    createScriptBodyAst(cst: SubhutiCst): SlimeJavascriptProgram {
        const stmtList = cst.children?.find(ch =>
            ch.name === 'StatementList' || ch.name === SlimeJavascriptParser.prototype.StatementList?.name
        )
        if (stmtList) {
            const body = SlimeJavascriptCstToAstUtil.createStatementListAst(stmtList)
            return SlimeJavascriptCreateUtils.createProgram(body, 'script')
        }
        return SlimeJavascriptCreateUtils.createProgram([], 'script')
    }

    createModuleItemListAst(cst: SubhutiCst): Array<SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration> {
        const asts = cst.children.map(item => {
            // Es2025Parser uses ModuleItem wrapper
            if (item.name === SlimeJavascriptParser.prototype.ModuleItem?.name || item.name === 'ModuleItem') {
                const innerItem = item.children?.[0]
                if (!innerItem) return undefined
                return SlimeJavascriptCstToAstUtil.createModuleItemAst(innerItem)
            }
            // Fallback: direct type
            return SlimeJavascriptCstToAstUtil.createModuleItemAst(item)
        }).filter(ast => ast !== undefined)

        return asts.flat()
    }

    createModuleItemAst(item: SubhutiCst): SlimeJavascriptStatement | SlimeJavascriptModuleDeclaration | SlimeJavascriptStatement[] | undefined {
        const name = item.name
        if (name === SlimeJavascriptParser.prototype.ExportDeclaration?.name || name === 'ExportDeclaration') {
            return SlimeJavascriptCstToAstUtil.createExportDeclarationAst(item)
        } else if (name === SlimeJavascriptParser.prototype.ImportDeclaration?.name || name === 'ImportDeclaration') {
            return SlimeJavascriptCstToAstUtil.createImportDeclarationAst(item)
        } else if (name === SlimeJavascriptParser.prototype.StatementListItem?.name || name === 'StatementListItem') {
            return SlimeJavascriptCstToAstUtil.createStatementListItemAst(item)
        }
        console.warn(`createModuleItemAst: Unknown item type: ${name}`)
        return undefined
    }

}

export const SlimeJavascriptModuleCstToAst = new SlimeJavascriptModuleCstToAstSingle()