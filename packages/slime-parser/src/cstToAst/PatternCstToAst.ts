import {
    type SlimePattern,
    type SlimeArrayPattern,
    type SlimeObjectPattern,
    type SlimeRestElement,
    type SlimeAssignmentProperty,
    type SlimeArrayPatternElement,
    type SlimeObjectPatternProperty,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import SlimeParser from "../SlimeParser";

// 导入拆分出去的类
import { BindingPatternCstToAst, setBindingPatternCstToAstUtil } from "./BindingPatternCstToAst";

// Re-export 拆分出去的类，保持向后兼容
export { BindingPatternCstToAst } from "./BindingPatternCstToAst";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setPatternCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
    // 同时设置拆分出去的类的 util
    setBindingPatternCstToAstUtil(util);
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for PatternCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 解构模式相关的 CST to AST 转换
 * 核心方法保留在此文件，Binding Pattern 相关方法已拆分到 BindingPatternCstToAst
 */
export class PatternCstToAst {

    // ==================== 委托到 BindingPatternCstToAst ====================
    static createBindingPatternAst = BindingPatternCstToAst.createBindingPatternAst;
    static createArrayBindingPatternAst = BindingPatternCstToAst.createArrayBindingPatternAst;
    static createObjectBindingPatternAst = BindingPatternCstToAst.createObjectBindingPatternAst;
    static createObjectAssignmentPatternAst = BindingPatternCstToAst.createObjectAssignmentPatternAst;
    static createArrayAssignmentPatternAst = BindingPatternCstToAst.createArrayAssignmentPatternAst;
    static createBindingPropertyAst = BindingPatternCstToAst.createBindingPropertyAst;
    static createBindingPropertyListAst = BindingPatternCstToAst.createBindingPropertyListAst;
    static createBindingElementListAst = BindingPatternCstToAst.createBindingElementListAst;
    static createBindingElisionElementAst = BindingPatternCstToAst.createBindingElisionElementAst;
    static createBindingRestPropertyAst = BindingPatternCstToAst.createBindingRestPropertyAst;

    // ==================== 核心方法 ====================

    /**
     * 将 ObjectLiteral CST 转换为 ObjectPattern
     */
    static convertObjectLiteralToPattern(cst: SubhutiCst): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (const child of cst.children || []) {
            if (child.value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            } else if (child.value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
            } else if (child.name === 'PropertyDefinitionList') {
                for (const prop of child.children || []) {
                    if (prop.value === ',') {
                        if (properties.length > 0 && !properties[properties.length - 1].commaToken) {
                            properties[properties.length - 1].commaToken = SlimeTokenCreate.createCommaToken(prop.loc)
                        }
                        continue
                    }
                    if (prop.name === 'PropertyDefinition') {
                        const ellipsis = prop.children?.find((c: any) => c.value === '...' || c.name === 'Ellipsis')
                        if (ellipsis) {
                            const assignExpr = prop.children?.find((c: any) => c.name === 'AssignmentExpression')
                            if (assignExpr) {
                                const idCst = PatternCstToAst.findFirstIdentifierInExpression(assignExpr)
                                if (idCst) {
                                    const restId = getUtil().createIdentifierAst(idCst)
                                    const restNode: SlimeRestElement = {
                                        type: SlimeNodeType.RestElement,
                                        argument: restId,
                                        ellipsisToken: SlimeTokenCreate.createEllipsisToken(ellipsis.loc),
                                        loc: prop.loc
                                    }
                                    properties.push({ property: restNode })
                                }
                            }
                        } else {
                            const patternProp = PatternCstToAst.convertPropertyDefinitionToPatternProperty(prop)
                            if (patternProp) {
                                properties.push({ property: patternProp })
                            }
                        }
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken,
            rBraceToken,
            loc: cst.loc
        } as SlimeObjectPattern
    }

    /**
     * 将 PropertyDefinition CST 转换为 Pattern 属性
     */
    static convertPropertyDefinitionToPatternProperty(cst: SubhutiCst): SlimeAssignmentProperty | null {
        const first = cst.children?.[0]
        if (!first) return null

        if (first.name === 'IdentifierReference') {
            const idNode = first.children?.[0]?.children?.[0]
            if (idNode) {
                const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                return {
                    type: SlimeNodeType.Property,
                    key: id,
                    value: id,
                    kind: 'init',
                    computed: false,
                    shorthand: true,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        } else if (first.name === 'CoverInitializedName') {
            const idRef = first.children?.find((c: any) => c.name === 'IdentifierReference')
            const initializer = first.children?.find((c: any) => c.name === 'Initializer')
            if (idRef) {
                const idNode = idRef.children?.[0]?.children?.[0]
                if (idNode) {
                    const id = SlimeAstUtil.createIdentifier(idNode.value, idNode.loc)
                    let value: any = id
                    if (initializer) {
                        const init = getUtil().createInitializerAst(initializer)
                        value = {
                            type: SlimeNodeType.AssignmentPattern,
                            left: id,
                            right: init,
                            loc: first.loc
                        }
                    }
                    return {
                        type: SlimeNodeType.Property,
                        key: id,
                        value: value,
                        kind: 'init',
                        computed: false,
                        shorthand: true,
                        loc: cst.loc
                    } as SlimeAssignmentProperty
                }
            }
        } else if (first.name === 'PropertyName') {
            const propName = first
            const colonCst = cst.children?.find((c: any) => c.value === ':')
            const valueCst = cst.children?.[2]
            if (colonCst && valueCst) {
                const key = getUtil().createPropertyNameAst(propName)
                const valueExpr = getUtil().createExpressionAst(valueCst)
                const value = PatternCstToAst.convertExpressionToPatternFromAST(valueExpr)
                return {
                    type: SlimeNodeType.Property,
                    key: key,
                    value: value || valueExpr,
                    kind: 'init',
                    computed: getUtil().isComputedPropertyName(propName),
                    shorthand: false,
                    loc: cst.loc
                } as SlimeAssignmentProperty
            }
        }

        return null
    }

    /**
     * 将 ObjectExpression AST 转换为 ObjectPattern
     */
    static convertObjectExpressionToPattern(expr: any): SlimeObjectPattern {
        const properties: SlimeObjectPatternProperty[] = []
        for (const prop of expr.properties || []) {
            const property = prop.property || prop
            if (property.type === SlimeNodeType.SpreadElement) {
                properties.push({
                    property: {
                        type: SlimeNodeType.RestElement,
                        argument: property.argument,
                        loc: property.loc
                    } as SlimeRestElement
                })
            } else {
                const value = PatternCstToAst.convertExpressionToPatternFromAST(property.value)
                properties.push({
                    property: {
                        type: SlimeNodeType.Property,
                        key: property.key,
                        value: value || property.value,
                        kind: 'init',
                        computed: property.computed,
                        shorthand: property.shorthand,
                        loc: property.loc
                    } as SlimeAssignmentProperty
                })
            }
        }
        return {
            type: SlimeNodeType.ObjectPattern,
            properties,
            lBraceToken: expr.lBraceToken,
            rBraceToken: expr.rBraceToken,
            loc: expr.loc
        } as SlimeObjectPattern
    }

    /**
     * 将 ArrayExpression AST 转换为 ArrayPattern
     */
    static convertArrayExpressionToPattern(expr: any): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        for (const elem of expr.elements || []) {
            if (elem === null || elem.element === null) {
                elements.push({ element: null })
            } else {
                const element = elem.element || elem
                const pattern = PatternCstToAst.convertExpressionToPatternFromAST(element)
                elements.push({ element: pattern || element, commaToken: elem.commaToken })
            }
        }
        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken: expr.lBracketToken,
            rBracketToken: expr.rBracketToken,
            loc: expr.loc
        } as SlimeArrayPattern
    }

    /**
     * 将 AssignmentExpression AST 转换为 AssignmentPattern
     */
    static convertAssignmentExpressionToPattern(expr: any): any {
        const left = PatternCstToAst.convertExpressionToPatternFromAST(expr.left)
        return {
            type: SlimeNodeType.AssignmentPattern,
            left: left || expr.left,
            right: expr.right,
            loc: expr.loc
        }
    }

    /**
     * 将表达式 AST 转换为 Pattern
     */
    static convertExpressionToPatternFromAST(expr: any): SlimePattern | null {
        if (!expr) return null
        if (expr.type === SlimeNodeType.Identifier) {
            return expr
        } else if (expr.type === SlimeNodeType.ObjectExpression) {
            return PatternCstToAst.convertObjectExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.ArrayExpression) {
            return PatternCstToAst.convertArrayExpressionToPattern(expr)
        } else if (expr.type === SlimeNodeType.AssignmentExpression) {
            return PatternCstToAst.convertAssignmentExpressionToPattern(expr)
        }
        return null
    }

    /**
     * 将 ArrayLiteral CST 转换为 ArrayPattern
     */
    static convertArrayLiteralToPattern(cst: SubhutiCst): SlimeArrayPattern {
        const elements: SlimeArrayPatternElement[] = []
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        const processElision = (elisionNode: SubhutiCst) => {
            for (const elisionChild of elisionNode.children || []) {
                if (elisionChild.value === ',') {
                    if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                        elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elisionChild.loc)
                    }
                    elements.push({ element: null })
                }
            }
        }

        for (const child of cst.children || []) {
            if (child.value === '[') {
                lBracketToken = SlimeTokenCreate.createLBracketToken(child.loc)
            } else if (child.value === ']') {
                rBracketToken = SlimeTokenCreate.createRBracketToken(child.loc)
            } else if (child.name === 'Elision') {
                processElision(child)
            } else if (child.name === 'ElementList') {
                const elemChildren = child.children || []
                for (let i = 0; i < elemChildren.length; i++) {
                    const elem = elemChildren[i]
                    if (elem.value === ',') {
                        if (elements.length > 0 && !elements[elements.length - 1].commaToken) {
                            elements[elements.length - 1].commaToken = SlimeTokenCreate.createCommaToken(elem.loc)
                        }
                    } else if (elem.name === 'Elision') {
                        processElision(elem)
                    } else if (elem.name === 'AssignmentExpression') {
                        const expr = getUtil().createExpressionAst(elem)
                        const pattern = PatternCstToAst.convertExpressionToPatternFromAST(expr)
                        elements.push({ element: pattern || expr as any })
                    } else if (elem.name === 'SpreadElement') {
                        const restNode = getUtil().createSpreadElementAst(elem)
                        elements.push({
                            element: {
                                type: SlimeNodeType.RestElement,
                                argument: restNode.argument,
                                loc: restNode.loc
                            } as SlimeRestElement
                        })
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.ArrayPattern,
            elements,
            lBracketToken,
            rBracketToken,
            loc: cst.loc
        } as SlimeArrayPattern
    }

    /**
     * AssignmentPattern CST 到 AST
     */
    static createAssignmentPatternAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) throw new Error('AssignmentPattern has no children')

        if (firstChild.name === SlimeParser.prototype.ObjectAssignmentPattern?.name ||
            firstChild.name === 'ObjectAssignmentPattern') {
            return PatternCstToAst.createObjectAssignmentPatternAst(firstChild) as any
        } else if (firstChild.name === SlimeParser.prototype.ArrayAssignmentPattern?.name ||
            firstChild.name === 'ArrayAssignmentPattern') {
            return PatternCstToAst.createArrayAssignmentPatternAst(firstChild) as any
        }

        throw new Error(`Unknown AssignmentPattern type: ${firstChild.name}`)
    }

    /**
     * 辅助方法：在表达式中查找第一个标识符
     */
    static findFirstIdentifierInExpression(cst: SubhutiCst): SubhutiCst | null {
        if (!cst) return null
        if (cst.name === 'Identifier' || cst.name === 'IdentifierReference' || cst.name === 'BindingIdentifier') {
            return cst
        }
        for (const child of cst.children || []) {
            const found = PatternCstToAst.findFirstIdentifierInExpression(child)
            if (found) return found
        }
        return null
    }
}
