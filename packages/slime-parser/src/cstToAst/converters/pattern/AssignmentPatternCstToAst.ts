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
            return this.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return this.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * ObjectAssignmentPattern CST �?AST
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return this.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST �?AST
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return this.createArrayBindingPatternAst(cst)
    }


    /**
     * AssignmentPropertyList CST �?AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(this.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * AssignmentProperty CST �?AST
     */
    static createAssignmentPropertyAst(cst: SubhutiCst): any {
        return this.createBindingPropertyAst(cst)
    }

    /**
     * AssignmentElementList CST �?AST
     */
    static createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return this.createBindingElementListAst(cst)
    }

    /**
     * AssignmentElement CST �?AST
     */
    static createAssignmentElementAst(cst: SubhutiCst): any {
        return this.createBindingElementAst(cst)
    }

    /**
     * AssignmentElisionElement CST �?AST
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return this.createBindingElisionElementAst(cst)
    }

    /**
     * AssignmentRestElement CST �?AST
     */
    static createAssignmentRestElementAst(cst: SubhutiCst): any {
        return this.createBindingRestElementAst(cst)
    }

    /**
     * AssignmentRestProperty CST �?AST
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return this.createBindingRestPropertyAst(cst)
    }
}