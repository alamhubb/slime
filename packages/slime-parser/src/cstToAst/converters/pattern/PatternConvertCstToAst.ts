import { SubhutiCst } from "subhuti";
import { SlimeNodeType, SlimePattern, SlimeArrayPattern, SlimeObjectPattern } from "slime-ast";
import { checkCstName, SlimeCstToAst } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * PatternConvert CST 到 AST 转换器
 * 
 * 负责处理：
 * - AssignmentPattern: 赋值模式
 * - ObjectAssignmentPattern: 对象赋值模式
 * - ArrayAssignmentPattern: 数组赋值模式
 * - AssignmentPropertyList: 赋值属性列表
 * - AssignmentProperty: 赋值属性
 * - AssignmentElementList: 赋值元素列表
 * - AssignmentElisionElement: 赋值省略元素
 * - AssignmentElement: 赋值元素
 * - AssignmentRestElement: 赋值剩余元素
 * - AssignmentRestProperty: 赋值剩余属性
 * - convertExpressionToPattern: 表达式转模式
 */
export class PatternConvertCstToAst {

    /**
     * 创建 AssignmentPattern AST
     */
    static createAssignmentPatternAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return this.createObjectAssignmentPatternAst(firstChild, util) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return this.createArrayAssignmentPatternAst(firstChild, util) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * 创建 ObjectAssignmentPattern AST
     * 委托到 ObjectBindingPattern
     */
    static createObjectAssignmentPatternAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeObjectPattern {
        return util.createObjectBindingPatternAst(cst)
    }

    /**
     * 创建 ArrayAssignmentPattern AST
     * 委托到 ArrayBindingPattern
     */
    static createArrayAssignmentPatternAst(cst: SubhutiCst, util: SlimeCstToAst): SlimeArrayPattern {
        return util.createArrayBindingPatternAst(cst)
    }

    /**
     * 创建 AssignmentPropertyList AST
     */
    static createAssignmentPropertyListAst(cst: SubhutiCst, util: SlimeCstToAst): any[] {
        const properties: any[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.AssignmentProperty?.name ||
                child.name === 'AssignmentProperty') {
                properties.push(this.createAssignmentPropertyAst(child, util))
            }
        }
        return properties
    }

    /**
     * 创建 AssignmentProperty AST
     * 委托到 BindingProperty
     */
    static createAssignmentPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return util.createBindingPropertyAst(cst)
    }

    /**
     * 创建 AssignmentElementList AST
     * 委托到 BindingElementList
     */
    static createAssignmentElementListAst(cst: SubhutiCst, util: SlimeCstToAst): any[] {
        return util.createBindingElementListAst(cst)
    }

    /**
     * 创建 AssignmentElement AST
     * 委托到 BindingElement
     */
    static createAssignmentElementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return util.createBindingElementAst(cst)
    }

    /**
     * 创建 AssignmentElisionElement AST
     * 委托到 BindingElisionElement
     */
    static createAssignmentElisionElementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return util.createBindingElisionElementAst(cst)
    }

    /**
     * 创建 AssignmentRestElement AST
     * 委托到 BindingRestElement
     */
    static createAssignmentRestElementAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return util.createBindingRestElementAst(cst)
    }

    /**
     * 创建 AssignmentRestProperty AST
     * 委托到 BindingRestProperty
     */
    static createAssignmentRestPropertyAst(cst: SubhutiCst, util: SlimeCstToAst): any {
        return util.createBindingRestPropertyAst(cst)
    }

    /**
     * 将表达式转换为模式
     * 用于处理 cover grammar
     */
    static convertExpressionToPattern(expr: any, util: SlimeCstToAst): SlimePattern {
        if (!expr) return expr

        // ObjectExpression -> ObjectPattern
        if (expr.type === SlimeNodeType.ObjectExpression) {
            const properties: any[] = []
            for (const item of expr.properties || []) {
                const prop = item.property || item
                if (prop.type === SlimeNodeType.SpreadElement) {
                    properties.push({
                        property: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(prop.argument, util),
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                } else if (prop.type === SlimeNodeType.Property) {
                    const convertedValue = this.convertExpressionToPattern(prop.value, util)
                    properties.push({
                        property: {
                            type: SlimeNodeType.Property,
                            key: prop.key,
                            value: convertedValue,
                            kind: 'init',
                            computed: prop.computed,
                            shorthand: prop.shorthand,
                            loc: prop.loc
                        },
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ObjectPattern,
                properties,
                loc: expr.loc
            } as any
        }

        // ArrayExpression -> ArrayPattern
        if (expr.type === SlimeNodeType.ArrayExpression) {
            const elements: any[] = []
            for (const item of expr.elements || []) {
                const elem = item.element || item
                if (elem === null) {
                    elements.push({ element: null, commaToken: item.commaToken })
                } else if (elem.type === SlimeNodeType.SpreadElement) {
                    elements.push({
                        element: {
                            type: SlimeNodeType.RestElement,
                            argument: this.convertExpressionToPattern(elem.argument, util),
                            loc: elem.loc
                        },
                        commaToken: item.commaToken
                    })
                } else {
                    elements.push({
                        element: this.convertExpressionToPattern(elem, util),
                        commaToken: item.commaToken
                    })
                }
            }
            return {
                type: SlimeNodeType.ArrayPattern,
                elements,
                loc: expr.loc
            } as any
        }

        // AssignmentExpression -> AssignmentPattern
        if (expr.type === SlimeNodeType.AssignmentExpression && expr.operator === '=') {
            return {
                type: SlimeNodeType.AssignmentPattern,
                left: this.convertExpressionToPattern(expr.left, util),
                right: expr.right,
                loc: expr.loc
            } as any
        }

        // SpreadElement -> RestElement
        if (expr.type === SlimeNodeType.SpreadElement) {
            return {
                type: SlimeNodeType.RestElement,
                argument: this.convertExpressionToPattern(expr.argument, util),
                loc: expr.loc
            } as any
        }

        // Identifier 和其他类型直接返回
        return expr
    }
}
