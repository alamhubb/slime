/**
 * CompoundLiteralCstToAst - 数组/对象字面量转换
 */
import {SubhutiCst} from "subhuti";
import {
    type SlimeArrayElement,
    type SlimeArrayExpression, type SlimeArrowFunctionExpression,
    type SlimeAssignmentExpression,
    
    type SlimeClassBody,
    type SlimeExpression, type SlimeFunctionParam,
    SlimeIdentifier,
    SlimeLiteral,
    type SlimeMethodDefinition, SlimeAstTypeName,
    type SlimeObjectExpression,
    type SlimeObjectPropertyItem, SlimeProperty,
    type SlimePropertyDefinition,
    type SlimeSpreadElement,
    type SlimeStatement,
    SlimeTokenCreateUtils
} from "slime-ast";
import SlimeParser from "../../../SlimeParser.ts";

import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil.ts";
import {SlimeVariableCstToAstSingle} from "../statements/SlimeVariableCstToAst.ts";

export class SlimeCompoundLiteralCstToAstSingle {
    /**
     * 对象字面�?CST �?AST（透传�?ObjectExpression�?
     * ObjectLiteral -> { } | { PropertyDefinitionList } | { PropertyDefinitionList , }
     */
    createObjectLiteralAst(cst: SubhutiCst): SlimeObjectExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ObjectLiteral?.name);
        const properties: Array<SlimeObjectPropertyItem> = []

        // 提取 LBrace �?RBrace tokens
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        // ObjectLiteral: { PropertyDefinitionList? ,? }
        // children[0] = LBrace, children[last] = RBrace (if exists)
        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBrace' || firstChild.value === '{')) {
                lBraceToken = SlimeTokenCreateUtils.createLBraceToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBrace' || lastChild.value === '}')) {
                rBraceToken = SlimeTokenCreateUtils.createRBraceToken(lastChild.loc)
            }
        }

        if (cst.children.length > 2) {
            const PropertyDefinitionListCst = cst.children[1]
            let currentProperty: SlimeProperty | SlimeSpreadElement | null = null
            let hasProperty = false

            for (const child of PropertyDefinitionListCst.children) {
                // 跳过没有children的PropertyDefinition节点（SubhutiParser优化导致�?
                if (child.name === SlimeParser.prototype.PropertyDefinition?.name && child.children && child.children.length > 0) {
                    // 如果之前有属性但没有逗号，先推入
                    if (hasProperty) {
                        properties.push(SlimeAstCreateUtils.createObjectPropertyItem(currentProperty!, undefined))
                    }
                    currentProperty = SlimeCstToAstUtil.createPropertyDefinitionAst(child)
                    hasProperty = true
                } else if (child.name === 'Comma' || child.value === ',') {
                    // 逗号与前面的属性配�?
                    const commaToken = SlimeTokenCreateUtils.createCommaToken(child.loc)
                    if (hasProperty) {
                        properties.push(SlimeAstCreateUtils.createObjectPropertyItem(currentProperty!, commaToken))
                        hasProperty = false
                        currentProperty = null
                    }
                }
            }

            // 处理最后一个属性（如果没有尾随逗号�?
            if (hasProperty) {
                properties.push(SlimeAstCreateUtils.createObjectPropertyItem(currentProperty!, undefined))
            }
        }
        return SlimeAstCreateUtils.createObjectExpression(properties, cst.loc, lBraceToken, rBraceToken)
    }


    /**
     * ArrayLiteral CST �?ArrayExpression AST
     * ArrayLiteral -> [ Elision? ] | [ ElementList ] | [ ElementList , Elision? ]
     */
    createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);
        // ArrayLiteral: [LBracket, ElementList?, Comma?, Elision?, RBracket]

        // 提取 LBracket �?RBracket tokens
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBracket' || firstChild.value === '[')) {
                lBracketToken = SlimeTokenCreateUtils.createLBracketToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBracket' || lastChild.value === ']')) {
                rBracketToken = SlimeTokenCreateUtils.createRBracketToken(lastChild.loc)
            }
        }

        const elementList = cst.children.find(ch => ch.name === SlimeParser.prototype.ElementList?.name)
        const elements = elementList ? SlimeCstToAstUtil.createElementListAst(elementList) : []

        // 处理 ArrayLiteral 顶层�?Comma �?Elision（尾随逗号和省略）
        // 例如 [x,,] -> ElementList 后面�?Comma �?Elision
        let hasTrailingComma = false
        for (const child of cst.children) {
            if (child.name === 'Comma' || child.value === ',') {
                // 顶层逗号，表示尾随逗号
                hasTrailingComma = true
            } else if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                // 顶层 Elision，添加空元素
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    const commaToken = SlimeTokenCreateUtils.createCommaToken(elisionCommas[j].loc)
                    elements.push(SlimeAstCreateUtils.createArrayElement(null, commaToken))
                }
            }
        }

        return SlimeAstCreateUtils.createArrayExpression(elements, cst.loc, lBracketToken, rBracketToken)
    }


    createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);
        // SpreadElement: [Ellipsis, AssignmentExpression]

        // 提取 Ellipsis token
        let ellipsisToken: any = undefined
        const ellipsisCst = cst.children.find(ch =>
            ch.name === 'Ellipsis' || ch.name === 'Ellipsis' || ch.value === '...'
        )
        if (ellipsisCst) {
            ellipsisToken = SlimeTokenCreateUtils.createEllipsisToken(ellipsisCst.loc)
        }

        const expression = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name
        )
        if (!expression) {
            throw new Error('SpreadElement missing AssignmentExpression')
        }

        return SlimeAstCreateUtils.createSpreadElement(
            SlimeCstToAstUtil.createAssignmentExpressionAst(expression),
            cst.loc,
            ellipsisToken
        )
    }


    createPropertyDefinitionAst(cst: SubhutiCst): SlimeProperty {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.PropertyDefinition?.name);

        // 防御性检查：如果 children 为空，说明是空对象的情况，不应该被调�?
        // 这种情况通常不会发生，因为空对象{}不会有PropertyDefinition节点
        if (!cst.children || cst.children.length === 0) {
            throw new Error('PropertyDefinition CST has no children - this should not happen for valid syntax');
        }

        const first = cst.children[0]

        // ES2018: 对象spread {...obj}
        // 检查first是否是Ellipsis token（name�?Ellipsis'�?
        if (first.name === 'Ellipsis' || first.value === '...') {
            // PropertyDefinition -> Ellipsis + AssignmentExpression
            const AssignmentExpressionCst = cst.children[1]
            const argument = SlimeCstToAstUtil.createAssignmentExpressionAst(AssignmentExpressionCst)

            // 返回SpreadElement（作为Property的一种特殊形式）
            return {
                type: SlimeAstTypeName.SpreadElement,
                argument: argument,
                loc: cst.loc
            } as any
        } else if (cst.children.length > 2) {
            // PropertyName : AssignmentExpression（完整形式）
            const PropertyNameCst = cst.children[0]
            const AssignmentExpressionCst = cst.children[2]

            const key = SlimeCstToAstUtil.createPropertyNameAst(PropertyNameCst)
            const value = SlimeCstToAstUtil.createAssignmentExpressionAst(AssignmentExpressionCst)

            const keyAst = SlimeAstCreateUtils.createPropertyAst(key, value)

            // 检查是否是计算属性名
            if (PropertyNameCst.children[0].name === SlimeParser.prototype.ComputedPropertyName?.name) {
                keyAst.computed = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.MethodDefinition?.name) {
            // 方法定义（对象中的方法没有static�?
            const SlimeMethodDefinition = SlimeCstToAstUtil.createMethodDefinitionAst(null, first)

            const keyAst = SlimeAstCreateUtils.createPropertyAst(SlimeMethodDefinition.key, SlimeMethodDefinition.value)

            // 继承MethodDefinition的computed标志
            if (SlimeMethodDefinition.computed) {
                keyAst.computed = true
            }

            // 继承MethodDefinition的kind标志（getter/setter/method�?
            if (SlimeMethodDefinition.kind === 'get' || SlimeMethodDefinition.kind === 'set') {
                keyAst.kind = SlimeMethodDefinition.kind
            } else {
                // 普通方法使�?method: true
                keyAst.method = true
            }

            return keyAst
        } else if (first.name === SlimeParser.prototype.IdentifierReference?.name) {
            // 属性简�?{name} -> {name: name}
            const identifierCst = first.children[0] // IdentifierReference -> Identifier
            const identifier = SlimeCstToAstUtil.createIdentifierAst(identifierCst)
            const keyAst = SlimeAstCreateUtils.createPropertyAst(identifier, identifier)
            keyAst.shorthand = true
            return keyAst
        } else if (first.name === 'CoverInitializedName') {
            // CoverInitializedName: 带默认值的属性简�?{name = 'default'}
            // CoverInitializedName -> IdentifierReference + Initializer
            const identifierRefCst = first.children[0]
            const initializerCst = first.children[1]

            const identifierCst = identifierRefCst.children[0] // IdentifierReference -> Identifier
            const identifier = SlimeCstToAstUtil.createIdentifierAst(identifierCst)

            // Initializer -> Assign + AssignmentExpression
            const defaultValue = SlimeCstToAstUtil.createAssignmentExpressionAst(initializerCst.children[1])

            // 创建 AssignmentPattern 作为 value
            const assignmentPattern = {
                type: SlimeAstTypeName.AssignmentPattern,
                left: identifier,
                right: defaultValue,
                loc: first.loc
            }

            const keyAst = SlimeAstCreateUtils.createPropertyAst(identifier, assignmentPattern as any)
            keyAst.shorthand = true
            return keyAst
        } else {
            throw new Error(`不支持的PropertyDefinition类型: ${first.name}`)
        }
    }


    createPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral | SlimeExpression {
        if (!cst || !cst.children || cst.children.length === 0) {
            throw new Error('createPropertyNameAst: invalid cst or no children')
        }

        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.LiteralPropertyName?.name || first.name === 'LiteralPropertyName') {
            return SlimeCstToAstUtil.createLiteralPropertyNameAst(first)
        } else if (first.name === SlimeParser.prototype.ComputedPropertyName?.name || first.name === 'ComputedPropertyName') {
            // [expression]: value
            // ComputedPropertyName -> LBracket + AssignmentExpression + RBracket
            return SlimeCstToAstUtil.createAssignmentExpressionAst(first.children[1])
        }
        // 回退：可能first直接就是 LiteralPropertyName 的内�?
        return SlimeCstToAstUtil.createLiteralPropertyNameAst(first)
    }


    createLiteralPropertyNameAst(cst: SubhutiCst): SlimeIdentifier | SlimeLiteral {
        if (!cst) {
            throw new Error('createLiteralPropertyNameAst: cst is null')
        }

        // 可能�?LiteralPropertyName 节点，也可能直接是内部节�?
        let first = cst
        if (cst.name === SlimeParser.prototype.LiteralPropertyName?.name || cst.name === 'LiteralPropertyName') {
            if (!cst.children || cst.children.length === 0) {
                throw new Error('createLiteralPropertyNameAst: LiteralPropertyName has no children')
            }
            first = cst.children[0]
        }

        // IdentifierName (Es2025Parser) - 可能是规则节点或 token
        if (first.name === 'IdentifierName' || first.name === SlimeParser.prototype.IdentifierName?.name) {
            // 如果�?value，直接使�?
            if (first.value !== undefined) {
                return SlimeAstCreateUtils.createIdentifier(first.value, first.loc)
            }
            // 否则递归查找 value
            let current = first
            while (current.children && current.children.length > 0 && current.value === undefined) {
                current = current.children[0]
            }
            if (current.value !== undefined) {
                return SlimeAstCreateUtils.createIdentifier(current.value, current.loc || first.loc)
            }
            throw new Error(`createLiteralPropertyNameAst: Cannot extract value from IdentifierName`)
        }
        // Identifier (旧版�?Es2025)
        else if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            return SlimeCstToAstUtil.createIdentifierAst(first)
        }
        // NumericLiteral
        else if (first.name === SlimeTokenConsumer.prototype.NumericLiteral?.name || first.name === 'NumericLiteral' || first.name === 'Number') {
            return SlimeCstToAstUtil.createNumericLiteralAst(first)
        }
        // StringLiteral
        else if (first.name === SlimeTokenConsumer.prototype.StringLiteral?.name || first.name === 'StringLiteral' || first.name === 'String') {
            return SlimeCstToAstUtil.createStringLiteralAst(first)
        }
        // 如果是直接的 token（有 value 属性），创�?Identifier
        else if (first.value !== undefined) {
            return SlimeAstCreateUtils.createIdentifier(first.value, first.loc)
        }

        throw new Error(`createLiteralPropertyNameAst: Unknown type: ${first.name}`)
    }


    /**
     * ComputedPropertyName CST �?AST
     * ComputedPropertyName -> [ AssignmentExpression ]
     */
    createComputedPropertyNameAst(cst: SubhutiCst): SlimeExpression {
        const expr = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name ||
            ch.name === 'AssignmentExpression'
        )
        if (expr) {
            return SlimeCstToAstUtil.createAssignmentExpressionAst(expr)
        }
        throw new Error('ComputedPropertyName missing AssignmentExpression')
    }


    createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = []

        // 遍历所有子节点，处�?AssignmentExpression、SpreadElement、Elision �?Comma
        // 每个元素与其后面的逗号配对
        let currentElement: SlimeExpression | SlimeSpreadElement | null = null
        let hasElement = false

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                // 如果之前有元素但没有逗号，先推入
                if (hasElement) {
                    elements.push(SlimeAstCreateUtils.createArrayElement(currentElement, undefined))
                }
                currentElement = SlimeCstToAstUtil.createAssignmentExpressionAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstCreateUtils.createArrayElement(currentElement, undefined))
                }
                currentElement = SlimeCstToAstUtil.createSpreadElementAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.Elision?.name) {
                // Elision 代表空元素：[1, , 3] - 可能包含多个逗号
                // 每个 Elision 内部的逗号数量决定空元素数�?
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    if (hasElement) {
                        const commaToken = SlimeTokenCreateUtils.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstCreateUtils.createArrayElement(currentElement, commaToken))
                        hasElement = false
                        currentElement = null
                    } else {
                        // 连续的空元素
                        const commaToken = SlimeTokenCreateUtils.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstCreateUtils.createArrayElement(null, commaToken))
                    }
                }
            } else if (child.name === 'Comma' || child.value === ',') {
                // 逗号与前面的元素配对
                const commaToken = SlimeTokenCreateUtils.createCommaToken(child.loc)
                elements.push(SlimeAstCreateUtils.createArrayElement(currentElement, commaToken))
                hasElement = false
                currentElement = null
            }
        }

        // 处理最后一个元素（如果没有尾随逗号�?
        if (hasElement) {
            elements.push(SlimeAstCreateUtils.createArrayElement(currentElement, undefined))
        }

        return elements
    }




    /**
     * CoverInitializedName CST �?AST
     * CoverInitializedName -> IdentifierReference Initializer
     */
    createCoverInitializedNameAst(cst: SubhutiCst): any {
        const idRef = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.IdentifierReference?.name ||
            ch.name === 'IdentifierReference'
        )
        const init = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.Initializer?.name ||
            ch.name === 'Initializer'
        )

        const id = idRef ? SlimeCstToAstUtil.createIdentifierReferenceAst(idRef) : null
        const initValue = init ? SlimeCstToAstUtil.createInitializerAst(init) : null

        return {
            type: SlimeAstTypeName.AssignmentPattern,
            left: id,
            right: initValue,
            loc: cst.loc
        }
    }


}

export const SlimeCompoundLiteralCstToAst = new SlimeCompoundLiteralCstToAstSingle()
