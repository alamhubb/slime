import {
    type SlimeArrayExpression,
    type SlimeArrayElement,
    type SlimeExpression,
    type SlimeSpreadElement,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate } from "slime-ast";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import SlimeParser from "../../SlimeParser";

export class ArrayLiteralCstToAst {
    /**
     * 数组字面量 CST 转 AST
     * ArrayLiteral -> [ Elision? ] | [ ElementList ] | [ ElementList , Elision? ]
     */
    static createArrayLiteralAst(cst: SubhutiCst): SlimeArrayExpression {
        checkCstName(cst, SlimeParser.prototype.ArrayLiteral?.name);
        // ArrayLiteral: [LBracket, ElementList?, Comma?, Elision?, RBracket]

        // 提取 LBracket 和 RBracket tokens
        let lBracketToken: any = undefined
        let rBracketToken: any = undefined

        if (cst.children && cst.children.length > 0) {
            const firstChild = cst.children[0]
            if (firstChild && (firstChild.name === 'LBracket' || firstChild.value === '[')) {
                lBracketToken = SlimeTokenCreate.createLBracketToken(firstChild.loc)
            }

            const lastChild = cst.children[cst.children.length - 1]
            if (lastChild && (lastChild.name === 'RBracket' || lastChild.value === ']')) {
                rBracketToken = SlimeTokenCreate.createRBracketToken(lastChild.loc)
            }
        }

        const elementList = cst.children.find(ch => ch.name === SlimeParser.prototype.ElementList?.name)
        const elements = elementList ? ArrayLiteralCstToAst.createElementListAst(elementList) : []

        // 处理 ArrayLiteral 顶层的 Comma 和 Elision（尾随逗号和省略）
        for (const child of cst.children) {
            if (child.name === SlimeParser.prototype.Elision?.name || child.name === 'Elision') {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                    elements.push(SlimeAstUtil.createArrayElement(null, commaToken))
                }
            }
        }

        return SlimeAstUtil.createArrayExpression(elements, cst.loc, lBracketToken, rBracketToken)
    }

    /**
     * ElementList CST 转 AST
     */
    static createElementListAst(cst: SubhutiCst): Array<SlimeArrayElement> {
        checkCstName(cst, SlimeParser.prototype.ElementList?.name);
        const elements: Array<SlimeArrayElement> = []

        let currentElement: SlimeExpression | SlimeSpreadElement | null = null
        let hasElement = false

        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeParser.prototype.AssignmentExpression?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = getUtil().createAssignmentExpressionAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.SpreadElement?.name) {
                if (hasElement) {
                    elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
                }
                currentElement = ArrayLiteralCstToAst.createSpreadElementAst(child)
                hasElement = true
            } else if (child.name === SlimeParser.prototype.Elision?.name) {
                const elisionCommas = child.children?.filter((c: any) => c.name === 'Comma' || c.value === ',') || []
                for (let j = 0; j < elisionCommas.length; j++) {
                    if (hasElement) {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                        hasElement = false
                        currentElement = null
                    } else {
                        const commaToken = SlimeTokenCreate.createCommaToken(elisionCommas[j].loc)
                        elements.push(SlimeAstUtil.createArrayElement(null, commaToken))
                    }
                }
            } else if (child.name === 'Comma' || child.value === ',') {
                const commaToken = SlimeTokenCreate.createCommaToken(child.loc)
                elements.push(SlimeAstUtil.createArrayElement(currentElement, commaToken))
                hasElement = false
                currentElement = null
            }
        }

        if (hasElement) {
            elements.push(SlimeAstUtil.createArrayElement(currentElement, undefined))
        }

        return elements
    }

    /**
     * SpreadElement CST 转 AST
     */
    static createSpreadElementAst(cst: SubhutiCst): SlimeSpreadElement {
        checkCstName(cst, SlimeParser.prototype.SpreadElement?.name);
        let ellipsisToken: any = undefined
        const ellipsisCst = cst.children.find(ch =>
            ch.name === 'Ellipsis' || ch.value === '...'
        )
        if (ellipsisCst) {
            ellipsisToken = SlimeTokenCreate.createEllipsisToken(ellipsisCst.loc)
        }

        const expression = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.AssignmentExpression?.name
        )
        if (!expression) {
            throw new Error('SpreadElement missing AssignmentExpression')
        }

        return SlimeAstUtil.createSpreadElement(
            getUtil().createAssignmentExpressionAst(expression),
            cst.loc,
            ellipsisToken
        )
    }
}
