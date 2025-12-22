/**
 * ClassBodyCstToAst - class body/element 转换
 */
import {SubhutiCst} from "subhuti";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer.ts";

export class ClassBodyCstToAst {


    /**
     * ClassElementName CST �?AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.ClassElementName?.name)
        const first = cst.children[0]
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children')
        }
        if (first.name === 'PrivateIdentifier') {
            return this.createPrivateIdentifierAst(first)
        }
        // PropertyName
        return this.createPropertyNameAst(first)
    }


    /**
     * 检�?ClassElementName/PropertyName 是否是计算属性名
     */
    isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false

        // 递归查找 ComputedPropertyName
        function hasComputedPropertyName(node: SubhutiCst): boolean {
            if (!node) return false
            if (node.name === 'ComputedPropertyName' || node.name === SlimeParser.prototype.ComputedPropertyName?.name) {
                return true
            }
            if (node.children) {
                for (const child of node.children) {
                    if (hasComputedPropertyName(child)) return true
                }
            }
            return false
        }

        return hasComputedPropertyName(cst)
    }




    /**
     * 检�?CST 节点是否表示 static 修饰�?
     * 兼容 Static �?IdentifierNameTok (value='static') 两种情况
     */
    isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false
        // 方式1：直接是 Static
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static' || cst.name === 'Static') {
            return true
        }
        // 方式2：是 IdentifierNameTok �?value �?'static'
        if ((cst.name === 'IdentifierName' || cst.name === 'IdentifierName') && cst.value === 'static') {
            return true
        }
        return false
    }

}
