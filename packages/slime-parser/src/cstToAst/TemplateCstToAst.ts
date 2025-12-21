import {
    type SlimeExpression,
    type SlimeTemplateElement,
    type SlimeTemplateLiteral,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType } from "slime-ast";
import SlimeParser from "../SlimeParser";
import SlimeTokenConsumer from "../SlimeTokenConsumer";
import { checkCstName } from "../SlimeCstToAstUtil.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setTemplateCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for TemplateCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 模板字符串相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class TemplateCstToAst {
    /**
     * TemplateLiteral CST 到 AST
     */
    static createTemplateLiteralAst(cst: SubhutiCst): SlimeExpression {
        checkCstName(cst, SlimeParser.prototype.TemplateLiteral?.name)

        const children = cst.children || []
        const quasis: SlimeTemplateElement[] = []
        const expressions: SlimeExpression[] = []

        // 简单模板：只有 NoSubstitutionTemplate
        const first = children[0]
        if (first?.name === SlimeTokenConsumer.prototype.NoSubstitutionTemplate?.name ||
            first?.name === 'NoSubstitutionTemplate') {
            const raw = first.value || ''
            const cooked = raw.slice(1, -1) // 去掉 ` 和 `
            const quasis = [SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc)]
            return SlimeAstUtil.createTemplateLiteral(quasis, [], cst.loc)
        }

        // 复杂模板：SubstitutionTemplate
        // 结构: TemplateHead Expression TemplateSpans
        // 或: TemplateHead Expression (TemplateMiddle Expression)* TemplateTail
        TemplateCstToAst.processTemplateSpans(children, quasis, expressions)

        return SlimeAstUtil.createTemplateLiteral(quasis, expressions, cst.loc)
    }

    /**
     * 处理模板字符串的各个部分
     */
    static processTemplateSpans(children: SubhutiCst[], quasis: SlimeTemplateElement[], expressions: SlimeExpression[]): void {
        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            const name = child.name

            if (name === SlimeTokenConsumer.prototype.TemplateHead?.name || name === 'TemplateHead') {
                // TemplateHead: `...${
                const raw = child.value || ''
                const cooked = raw.slice(1, -2) // 去掉 ` 和 ${
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression' ||
                name === SlimeParser.prototype.AssignmentExpression?.name || name === 'AssignmentExpression') {
                // 表达式部分
                expressions.push(getUtil().createExpressionAst(child))
            } else if (name === SlimeParser.prototype.TemplateSpans?.name || name === 'TemplateSpans') {
                // TemplateSpans: (TemplateMiddle Expression)* TemplateTail
                TemplateCstToAst.processTemplateMiddleList(child.children || [], quasis, expressions)
            } else if (name === SlimeTokenConsumer.prototype.TemplateMiddle?.name || name === 'TemplateMiddle') {
                // TemplateMiddle: }...${
                const raw = child.value || ''
                const cooked = raw.slice(1, -2) // 去掉 } 和 ${
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (name === SlimeTokenConsumer.prototype.TemplateTail?.name || name === 'TemplateTail') {
                // TemplateTail: }...`
                const raw = child.value || ''
                const cooked = raw.slice(1, -1) // 去掉 } 和 `
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, child.loc))
            } else if (name === 'TemplateMiddleList') {
                // ES2025 Parser 可能使用 TemplateMiddleList
                TemplateCstToAst.processTemplateMiddleList(child.children || [], quasis, expressions)
            }
        }
    }

    /**
     * 处理 TemplateMiddleList
     */
    static processTemplateMiddleList(children: SubhutiCst[], quasis: SlimeTemplateElement[], expressions: SlimeExpression[]): void {
        for (const child of children) {
            const name = child.name

            if (name === SlimeTokenConsumer.prototype.TemplateMiddle?.name || name === 'TemplateMiddle') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -2) // 去掉 } 和 ${
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc))
            } else if (name === SlimeTokenConsumer.prototype.TemplateTail?.name || name === 'TemplateTail') {
                const raw = child.value || ''
                const cooked = raw.slice(1, -1) // 去掉 } 和 `
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, child.loc))
            } else if (name === SlimeParser.prototype.Expression?.name || name === 'Expression' ||
                name === SlimeParser.prototype.AssignmentExpression?.name || name === 'AssignmentExpression') {
                expressions.push(getUtil().createExpressionAst(child))
            }
        }
    }
}
