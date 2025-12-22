import { SubhutiCst } from "subhuti";
import { SlimeNodeType, SlimePattern, SlimeRestElement } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * 参数 CST 到 AST 转换器
 * 
 * 负责处理：
 * - FormalParameters: 形式参数
 * - FormalParameterList: 形式参数列表
 * - FormalParameter: 形式参数
 * - FunctionRestParameter: 函数剩余参数
 * - UniqueFormalParameters: 唯一形式参数
 */
export class ParametersCstToAst {

    /**
     * 处理 FormalParameters CST 节点
     */
    static createFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            if (name === SlimeParser.prototype.FormalParameterList?.name || name === 'FormalParameterList') {
                return this.createFormalParameterListAst(child)
            }

            if (name === SlimeParser.prototype.FormalParameter?.name || name === 'FormalParameter') {
                params.push(this.createFormalParameterAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                params.push(SlimeCstToAstUtil.createBindingIdentifierAst(child))
                continue
            }

            if (name === SlimeParser.prototype.BindingElement?.name || name === 'BindingElement') {
                params.push(SlimeCstToAstUtil.createBindingElementAst(child))
                continue
            }

            if (name === SlimeParser.prototype.FunctionRestParameter?.name || name === 'FunctionRestParameter') {
                params.push(this.createFunctionRestParameterAst(child))
                continue
            }

            if (child.value === ',' || child.value === '(' || child.value === ')') {
                continue
            }
        }

        return params
    }


    /**
     * 创建 FormalParameterList AST
     */
    static createFormalParameterListAst(cst: SubhutiCst): SlimePattern[] {
        checkCstName(cst, SlimeParser.prototype.FormalParameterList?.name);

        if (!cst.children || cst.children.length === 0) {
            return []
        }

        const params: SlimePattern[] = []

        for (const child of cst.children) {
            const name = child.name

            if (name === 'FunctionRestParameter' || name === SlimeParser.prototype.FunctionRestParameter?.name) {
                params.push(this.createFunctionRestParameterAst(child))
                continue
            }

            if (name === 'FormalParameter' || name === SlimeParser.prototype.FormalParameter?.name) {
                params.push(this.createFormalParameterAst(child))
                continue
            }

            if (name === 'BindingElement' || name === SlimeParser.prototype.BindingElement?.name) {
                params.push(SlimeCstToAstUtil.createBindingElementAst(child))
                continue
            }

            if (name === 'BindingIdentifier' || name === SlimeParser.prototype.BindingIdentifier?.name) {
                params.push(SlimeCstToAstUtil.createBindingIdentifierAst(child))
                continue
            }

            if (child.value === ',') {
                continue
            }
        }

        return params
    }

    /**
     * 创建 FormalParameter AST
     */
    static createFormalParameterAst(cst: SubhutiCst): SlimePattern {
        const first = cst.children[0]
        if (first.name === 'BindingElement' || first.name === SlimeParser.prototype.BindingElement?.name) {
            return SlimeCstToAstUtil.createBindingElementAst(first)
        }
        return SlimeCstToAstUtil.createBindingElementAst(cst)
    }

    /**
     * 创建 FunctionRestParameter AST
     */
    static createFunctionRestParameterAst(cst: SubhutiCst): SlimeRestElement {
        checkCstName(cst, SlimeParser.prototype.FunctionRestParameter?.name);
        const first = cst.children[0]
        return SlimeCstToAstUtil.createBindingRestElementAst(first)
    }

    /**
     * 创建 UniqueFormalParameters AST（透传）
     */
    static createUniqueFormalParametersAst(cst: SubhutiCst): SlimePattern[] {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return this.createFormalParametersAst(firstChild)
        }
        return []
    }
}
