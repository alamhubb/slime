import {
    type SlimeExpression,
    type SlimeTemplateLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import { checkCstName, getUtil } from "../core/CstToAstContext";
import SlimeParser from "../../SlimeParser";
import SlimeTokenConsumer from "../../SlimeTokenConsumer";

export class TemplateLiteralCstToAst {
    /**
     * 模板字符串 CST 转 AST
     */
    static createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.TemplateLiteral?.name)

        const first = cst.children[0]

        // 简单模板：`hello` (无插值)
        if (first.name === SlimeTokenConsumer.prototype.NoSubstitutionTemplate?.name ||
            first.name === 'NoSubstitutionTemplate') {
            const raw = first.value as string || '``'
            const cooked = raw.slice(1, -1)
            const quasis = [SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc)]
            return SlimeAstUtil.createTemplateLiteral(quasis, [], cst.loc)
        }

        // 带插值模板
        let targetCst = cst
        if (first.name === SlimeParser.prototype.SubstitutionTemplate?.name ||
            first.name === 'SubstitutionTemplate') {
            targetCst = first
        }

        const quasis: any[] = []
        const expressions: SlimeExpression[] = []

        for (let i = 0; i < targetCst.children.length; i++) {
            const child = targetCst.children[i]

            if (child.name === SlimeTokenConsumer.prototype.TemplateHead?.name ||
                child.name === 'TemplateHead') {
                const raw = child.value as string || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression') {
                expressions.push(getUtil().createExpressionAst(child))
            } else if (child.name === SlimeParser.prototype.TemplateSpans?.name ||
                child.name === 'TemplateSpans') {
                TemplateLiteralCstToAst.processTemplateSpans(child, quasis, expressions)
            }
        }

        return SlimeAstUtil.createTemplateLiteral(quasis, expressions, cst.loc)
    }

    static processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        const first = cst.children[0]

        if (first.name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
            const raw = first.value || ''
            const cooked = raw.slice(1, -1)
            quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc))
            return
        }

        if (first.name === SlimeParser.prototype.TemplateMiddleList?.name) {
            TemplateLiteralCstToAst.processTemplateMiddleList(first, quasis, expressions)

            if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
                const tail = cst.children[1]
                const raw = tail.value || ''
                const cooked = raw.slice(1, -1)
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, tail.loc))
            }
        }
    }

    static processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i]

            if (child.name === SlimeTokenConsumer.prototype.TemplateMiddle?.name ||
                child.name === 'TemplateMiddle') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -2)
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression') {
                expressions.push(getUtil().createExpressionAst(child))
            }
        }
    }
}
