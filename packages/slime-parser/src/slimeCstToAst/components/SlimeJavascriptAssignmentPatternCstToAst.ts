import { SubhutiCst } from "subhuti";
import {
    SlimeArrayPattern,
    SlimeJavascriptArrayPattern,
    SlimeJavascriptBlockStatement,
    SlimeJavascriptFunctionExpression,
    SlimeJavascriptFunctionParam,
    SlimeJavascriptIdentifier, SlimeJavascriptObjectPattern,
    SlimeJavascriptTokenCreateUtils, SlimeObjectPattern
} from "slime-ast";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeJavascriptVariableCstToAstSingle} from "../statements/SlimeJavascriptVariableCstToAst.ts";

export class SlimeJavascriptAssignmentPatternCstToAstSingle {
    // ==================== è§£æž„ç›¸å…³è½¬æ¢æ–¹æ³• ====================

    /**
     * AssignmentPattern CST ï¿?AST
     * AssignmentPattern -> ObjectAssignmentPattern | ArrayAssignmentPattern
     */
    createAssignmentPatternAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeJavascriptParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return SlimeCstToAstUtil.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeJavascriptParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return SlimeCstToAstUtil.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * ObjectAssignmentPattern CST ï¿?AST
     */
    createObjectAssignmentPatternAst(cst: SubhutiCst): SlimeObjectPattern {
        return SlimeCstToAstUtil.createObjectBindingPatternAst(cst)
    }

    /**
     * ArrayAssignmentPattern CST ï¿?AST
     */
    createArrayAssignmentPatternAst(cst: SubhutiCst): SlimeArrayPattern {
        return SlimeCstToAstUtil.createArrayBindingPatternAst(cst)
    }


    /**
     * AssignmentPropertyList CST ï¿?AST
     */
    createAssignmentPropertyListAst(cst: SubhutiCst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeJavascriptParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(SlimeCstToAstUtil.createAssignmentPropertyAst(child))
            }
        }
        return properties
    }

    /**
     * AssignmentProperty CST ï¿?AST
     */
    createAssignmentPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingPropertyAst(cst)
    }

    /**
     * AssignmentElementList CST ï¿?AST
     */
    createAssignmentElementListAst(cst: SubhutiCst): any[] {
        return SlimeCstToAstUtil.createBindingElementListAst(cst)
    }

    /**
     * AssignmentElement CST ï¿?AST
     */
    createAssignmentElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElementAst(cst)
    }

    /**
     * AssignmentElisionElement CST ï¿?AST
     */
    createAssignmentElisionElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingElisionElementAst(cst)
    }

    /**
     * AssignmentRestElement CST ï¿?AST
     */
    createAssignmentRestElementAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestElementAst(cst)
    }

    /**
     * AssignmentRestProperty CST ï¿?AST
     */
    createAssignmentRestPropertyAst(cst: SubhutiCst): any {
        return SlimeCstToAstUtil.createBindingRestPropertyAst(cst)
    }
}


export const SlimeJavascriptAssignmentPatternCstToAst = new SlimeJavascriptAssignmentPatternCstToAstSingle()
