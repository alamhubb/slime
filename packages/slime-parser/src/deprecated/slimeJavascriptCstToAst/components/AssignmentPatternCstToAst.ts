import { SubhutiCst } from "subhuti";
import {
    SlimeJavascriptArrayPattern,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, SlimeJavascriptObjectPattern,
    SlimeJavascriptTokenCreate
} from "slime-ast";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";

export class AssignmentPatternCstToAst {
    // ==================== 解构相关转换方法 ====================

    /**
     * AssignmentPattern CST �?AST
     * AssignmentPattern -> ObjectAssignmentPattern | ArrayAssignmentPattern
     */
    static createAssignmentPatternAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeJavascriptParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return SlimeJavascriptCstToAstUtil.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeJavascriptParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return SlimeJavascriptCstToAstUtil.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * ObjectAssignmentPattern CST �?AST
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptObjectPattern {
        return SlimeJavascriptCstToAstUtil.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST �?AST
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeJavascriptArrayPattern {
        return SlimeJavascriptCstToAstUtil.createArrayBindingPatternAst(cst)
    }


    /**
     * AssignmentPropertyList CST �?AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(SlimeJavascriptCstToAstUtil.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * AssignmentProperty CST �?AST
     */
    static createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createBindingPropertyAst(cst)
    }

    /**
     * AssignmentElementList CST �?AST
     */
    static createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeJavascriptCstToAstUtil.createBindingElementListAst(cst)
    }

    /**
     * AssignmentElement CST �?AST
     */
    static createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createBindingElementAst(cst)
    }

    /**
     * AssignmentElisionElement CST �?AST
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createBindingElisionElementAst(cst)
    }

    /**
     * AssignmentRestElement CST �?AST
     */
    static createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createBindingRestElementAst(cst)
    }

    /**
     * AssignmentRestProperty CST �?AST
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeJavascriptCstToAstUtil.createBindingRestPropertyAst(cst)
    }
}