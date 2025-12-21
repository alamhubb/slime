import { SubhutiCst } from "subhuti";
import {
    SlimeAstUtil,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimePropertyDefinition,
    SlimeTokenCreate
} from "slime-ast";
import SlimeParser from "../../SlimeParser";
import { getUtil, isComputedPropertyName, isStaticModifier } from "../core/CstToAstContext";
import { ClassElementNameCstToAst } from "./ClassElementNameCstToAst";

/**
 * 类字段相关的 CST to AST 转换
 * 处理 FieldDefinition
 */
export class ClassFieldCstToAst {
    /**
     * FieldDefinition CST 到 AST
     */
    static createFieldDefinitionAst(staticCst: SubhutiCst | null, cst: SubhutiCst): SlimePropertyDefinition {
        const children = cst.children || [];

        let staticToken: any = undefined;
        let assignToken: any = undefined;

        if (staticCst && (staticCst.name === 'Static' || staticCst.value === 'static')) {
            staticToken = SlimeTokenCreate.createStaticToken(staticCst.loc);
        }

        let key: SlimeIdentifier | SlimeLiteral | SlimeExpression | null = null;
        let value: SlimeExpression | null = null;
        let isComputed = false;

        for (const child of children) {
            if (child.name === SlimeParser.prototype.ClassElementName?.name ||
                child.name === 'ClassElementName') {
                key = ClassElementNameCstToAst.createClassElementNameAst(child);
                isComputed = isComputedPropertyName(child);
            } else if (child.name === SlimeParser.prototype.Initializer?.name ||
                child.name === 'Initializer') {
                const initChildren = child.children || [];
                for (const initChild of initChildren) {
                    if (initChild.name === 'Assign' || initChild.value === '=') {
                        assignToken = SlimeTokenCreate.createAssignToken(initChild.loc);
                    } else if (initChild.name === SlimeParser.prototype.AssignmentExpression?.name ||
                        initChild.name === 'AssignmentExpression') {
                        value = getUtil().createAssignmentExpressionAst(initChild);
                    }
                }
            }
        }

        if (!key) {
            throw new Error('FieldDefinition missing ClassElementName');
        }

        return SlimeAstUtil.createPropertyDefinition(
            key, value, isComputed, isStaticModifier(staticCst), cst.loc
        );
    }
}
