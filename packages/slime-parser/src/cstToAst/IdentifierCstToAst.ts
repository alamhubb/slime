import {type SlimeBlockStatement, type SlimeExpression, SlimeIdentifier, type SlimePattern} from "slime-ast";
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import { SlimeAstUtil } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer.ts";
import {checkCstName} from "../SlimeCstToAstUtil.ts";

/**
 * 标识符相关的 CST to AST 转换
 */
export class IdentifierCstToAst {
    /**
     * 在Expression中查找第一个Identifier（辅助方法）
     */
    findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (cst.name === SlimeTokenConsumer.prototype.IdentifierName?.name) {
            return cst
        }
        if (cst.children) {
            for (const child of cst.children) {
                const found = this.findFirstIdentifierInExpression(child)
                if (found) return found
            }
        }
        return null
    }

    /**
     * 将表达式转换为模式（用于箭头函数参数解构�?
     * ObjectExpression -> ObjectPattern
     * ArrayExpression -> ArrayPattern
     * Identifier -> Identifier
     * SpreadElement -> RestElement
     */
    convertExpressionToPattern(expr: any): SlimePattern {
        if (!expr) return expr

        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        }

        if (expr.type === SlimeNodeType.ObjectExpression) {
            // �?ObjectExpression 转换�?ObjectPattern
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property !== undefined ? item.property : item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(prop.argument),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
                    // 转换 Property �?value
                    const convertedValue = this.convertExpressionToPattern(prop.value)
                    properties.push({
                        property: {
                            ...prop,
                            value: convertedValue
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    properties.push(item)
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties: properties,
                loc: expr.loc,
                lBraceToken: expr.lBraceToken,
                rBraceToken: expr.rBraceToken
            } as any
        }

        if (expr.type === SlimeNodeType.ArrayExpression) {
            // �?ArrayExpression 转换�?ArrayPattern
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element !== undefined ? item.element : item
                if (elem === null) {
                    elements.push(item)
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    // SpreadElement -> RestElement
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(elem.argument),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: this.convertExpressionToPattern(elem),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements: elements,
                loc: expr.loc,
                lBracketToken: expr.lBracketToken,
                rBracketToken: expr.rBracketToken
            } as any
        }

        if (expr.type === SlimeNodeType.AssignmentExpression) {
            // �?AssignmentExpression 转换�?AssignmentPattern
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: this.convertExpressionToPattern(expr.left),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        if (expr.type === SlimeNodeType.SpreadElement) {
            // SpreadElement -> RestElement
            return {
                type: SlimeNodeType.RestElement,
                argument: this.convertExpressionToPattern(expr.argument),
                loc: expr.loc
            } as any
        }

        // 其他类型直接返回
        return expr
    }

}
