import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";
import { checkCstName, getUtil } from "../core/CstToAstContext";

/**
 * ClassElementName 相关的 CST to AST 转换
 * 处理 ClassElementName 和属性名相关的通用逻辑
 */
export class ClassElementNameCstToAst {
    /**
     * 检查 CST 节点是否表示 static 修饰符
     */
    static isStaticModifier(cst: SubhutiCst | null): boolean {
        if (!cst) return false;
        if (cst.name === SlimeTokenConsumer.prototype.Static?.name || cst.name === 'Static') {
            return true;
        }
        if ((cst.name === 'IdentifierName') && cst.value === 'static') {
            return true;
        }
        return false;
    }

    /**
     * ClassElementName CST 到 AST
     * ClassElementName :: PropertyName | PrivateIdentifier
     */
    static createClassElementNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        const astName = checkCstName(cst, SlimeParser.prototype.ClassElementName?.name);
        const first = cst.children[0];
        if (!first) {
            throw new Error('createClassElementNameAst: ClassElementName has no children');
        }
        if (first.name === 'PrivateIdentifier') {
            return getUtil().createPrivateIdentifierAst(first);
        }
        return getUtil().createPropertyNameAst(first);
    }

    /**
     * 检查是否是计算属性名
     */
    static isComputedPropertyName(cst: SubhutiCst): boolean {
        if (!cst || !cst.children) return false;

        const first = cst.children[0];
        if (first?.name === SlimeParser.prototype.ComputedPropertyName?.name ||
            first?.name === 'ComputedPropertyName') {
            return true;
        }

        if (first?.name === SlimeParser.prototype.PropertyName?.name ||
            first?.name === 'PropertyName') {
            return ClassElementNameCstToAst.isComputedPropertyName(first);
        }

        if (first?.name === 'LBracket' || first?.value === '[') {
            return true;
        }

        return false;
    }
}
