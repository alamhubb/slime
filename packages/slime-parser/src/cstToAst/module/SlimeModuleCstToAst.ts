import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    SlimeFunctionParam,
    SlimeModuleDeclaration,
    SlimePattern,
    SlimeProgram,
    SlimeStatement
} from "slime-ast";
import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import { SlimeVariableCstToAstSingle } from "../statements/SlimeVariableCstToAst.ts";
import { SlimeJavascriptModuleCstToAstSingle } from "../../deprecated/slimeJavascriptCstToAst";

export class SlimeModuleCstToAstSingle extends SlimeJavascriptModuleCstToAstSingle {

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
            return SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
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
                    // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                    const body = SlimeCstToAstUtil.createStatementListAst(statementList)
                    program = SlimeAstUtil.createProgram(body, 'script')
                } else {
                    program = SlimeAstUtil.createProgram([], 'script')
                }
            } else if (bodyChild.name === SlimeParser.prototype.StatementList?.name || bodyChild.name === 'StatementList') {
                // [TypeScript] 使用 SlimeCstToAstUtil 以支持 TypeScript 语法
                const body = SlimeCstToAstUtil.createStatementListAst(bodyChild)
                program = SlimeAstUtil.createProgram(body, 'script')
            } else {
                throw new Error(`Unexpected body child: ${bodyChild.name}`)
            }
        } else {
            program = SlimeAstUtil.createProgram([], isModule ? 'module' : 'script')
        }

        if (hashbangComment) {
            (program as any).hashbang = hashbangComment
        }

        program.loc = cst.loc
        return program
    }
}

export const SlimeModuleCstToAst = new SlimeModuleCstToAstSingle()