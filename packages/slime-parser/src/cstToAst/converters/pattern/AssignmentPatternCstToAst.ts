import { SubhutiCst } from "subhuti";
import {
    SlimeBlockStatement,
    SlimeFunctionExpression,
    SlimeFunctionParam,
    SlimeIdentifier,
    SlimeTokenCreate
} from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";

export default class AssignmentPatternCstToAst {
    // ==================== 解构相关转换方法 ====================

    /**
     * AssignmentPattern CST �?AST
     * AssignmentPattern -> ObjectAssignmentPattern | ArrayAssignmentPattern
     */
    static createAssignmentPatternAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return SlimeCstToAstUtil.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return SlimeCstToAstUtil.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * ObjectAssignmentPattern CST �?AST
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return SlimeCstToAstUtil.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST �?AST
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return SlimeCstToAstUtil.createArrayBindingPatternAst(cst)
    }


    /**
     * AssignmentPropertyList CST �?AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(SlimeCstToAstUtil.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * AssignmentProperty CST �?AST
     */
    static createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingPropertyAst(cst)
    }

    /**
     * AssignmentElementList CST �?AST
     */
    static createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeCstToAstUtil.createBindingElementListAst(cst)
    }

    /**
     * AssignmentElement CST �?AST
     */
    static createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElementAst(cst)
    }

    /**
     * AssignmentElisionElement CST �?AST
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElisionElementAst(cst)
    }

    /**
     * AssignmentRestElement CST �?AST
     */
    static createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestElementAst(cst)
    }

    /**
     * AssignmentRestProperty CST �?AST
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestPropertyAst(cst)
    }
}