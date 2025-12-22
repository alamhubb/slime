import { SubhutiCst } from "subhuti";
import { SlimeDeclaration } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * Hoistable CST 到 AST 转换器
 * 
 * 负责处理：
 * - HoistableDeclaration: 可提升声明
 * - Declaration: 声明
 */
export class HoistableCstToAst {

    /**
     * 创建 HoistableDeclaration AST
     */
    static createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            return SlimeCstToAstUtil.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            return SlimeCstToAstUtil.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            return SlimeCstToAstUtil.createAsyncGeneratorDeclarationAst(first)
        }

        throw new Error(`Unknown HoistableDeclaration type: ${first.name}`)
    }

    /**
     * 创建 Declaration AST
     */
    static createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return SlimeCstToAstUtil.createVariableDeclarationAst(first);
        } else if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            return SlimeCstToAstUtil.createLexicalDeclarationAst(first);
        } else if (name === SlimeParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return SlimeCstToAstUtil.createClassDeclarationAst(first);
        } else if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(first);
        } else if (name === SlimeParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return this.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }
}
