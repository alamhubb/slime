/**
 * MethodDefinitionCstToAst - 方法定义转换
 */
import {SubhutiCst} from "subhuti";
import {
    SlimeAstUtil,
    type SlimeBlockStatement,
    type SlimeFunctionExpression,
    SlimeFunctionParam,
    type SlimeIdentifier
} from "slime-ast";
import SlimeParser from "../../../SlimeParser.ts";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";

export class MethodDefinitionCstToAst {

    /**
     * 处理 PropertySetParameterList
     */
    createPropertySetParameterListAst(cst: SubhutiCst): SlimePattern[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [this.createFormalParameterAst(first)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [this.createBindingElementAst(first)]
        }
        return []
    }



    /** 返回包装类型的版�?*/
    createPropertySetParameterListAstWrapped(cst: SubhutiCst): SlimeFunctionParam[] {
        // PropertySetParameterList: FormalParameter
        if (!cst.children || cst.children.length === 0) {
            return []
        }
        const first = cst.children[0]
        if (first.name === 'FormalParameter' || first.name === SlimeParser.prototype.FormalParameter?.name) {
            return [SlimeAstUtil.createFunctionParam(this.createFormalParameterAst(first), undefined)]
        }
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return [SlimeAstUtil.createFunctionParam(this.createBindingElementAst(first), undefined)]
        }
        return []
    }



}
