import {
    type SlimeObjectExpression,
    type SlimeObjectPropertyItem,
    type SlimeProperty,
    type SlimeSpreadElement,
    type SlimeIdentifier,
    type SlimeLiteral,
    type SlimeAssignmentPattern,
    type SlimeExpression,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { CstToAstContext, checkCstName, getUtil } from "../core/CstToAstContext";
import SlimeParser from "../../SlimeParser";
import { PropertyCstToAst } from "../expression/PropertyCstToAst";

export class ObjectLiteralCstToAst {
    /**
     * 对象字面量 CST 转 AST
     * ObjectLiteral -> { } | { PropertyDefinitionList } | { PropertyDefinitionList , }
     */
    static createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
        const properties: Array<SlimeObjectPropertyItem> = []

        // 提取 LBrace 和 RBrace tokens
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBrace' || firstChild.value === '{')) {
                lBraceToken = SlimeTokenCreate.createLBraceToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBrace' || lastChild.value === '}')) {
                rBraceToken = SlimeTokenCreate.createRBraceToken(lastChild.loc)
            }
        }

        if (cst.children.length > 2) {
            const PropertyDefinitionListCst = cst.children[1]
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null
            let hasProperty = false

            for (const child of PropertyDefinitionListCst.children) {
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
                    }
                    currentProperty = ObjectLiteralCstToAst.createPropertyDefinitionAst(child)
                    hasProperty = true
                } else if (child.name === 'Comma' || child.value === ',') {
                    const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                    if (hasProperty) {
                        properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, commaToken))
                        hasProperty = false
                        currentProperty = null
                    }
                }
            }

            if (hasProperty) {
                properties.push(SlimeAstUtil.createObjectPropertyItem(currentProperty!, undefined))
            }
        }
        return SlimeAstUtil.createObjectExpression(properties, cst.loc, lBraceToken, rBraceToken)
    }

    /**
     * 属性定义 CST 转 AST
     * 已迁移到 PropertyCstToAst.createPropertyDefinitionAst
     */
    static createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        return PropertyCstToAst.createPropertyDefinitionAst(cst)
    }

    /**
     * 属性名 CST 转 AST
     * 已迁移到 PropertyCstToAst.createPropertyNameAst
     */
    static createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | any {
        return PropertyCstToAst.createPropertyNameAst(cst)
    }

    /**
     * 字面量属性名 CST 转 AST
     * 已迁移到 PropertyCstToAst.createLiteralPropertyNameAst
     */
    static createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        return PropertyCstToAst.createLiteralPropertyNameAst(cst)
    }
}
