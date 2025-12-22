/**
 * TemplateCstToAst - 模板字符串转换
 */
import {
    type SlimeExpression,
    SlimeAstUtil,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import SlimeParser from "../../../SlimeParser";
import SlimeTokenConsumer from "../../../SlimeTokenConsumer";
import SlimeCstToAstUtil from "../../../SlimeCstToAstUtil";

export class TemplateCstToAst {
    /**
     * 处理 TemplateSpans：可能是 TemplateTail 或 TemplateMiddleList + TemplateTail
     */
    static processTemplateSpans(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        const first = cst.children[0];

        // 情况1：直接是 TemplateTail -> }` 结束
        if (first.name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
            const raw = first.value || '';
            const cooked = raw.slice(1, -1); // 去掉 } 和 `
            quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, first.loc));
            return;
        }

        // 情况2：TemplateMiddleList -> 有更多插值
        if (first.name === SlimeParser.prototype.TemplateMiddleList?.name) {
            TemplateCstToAst.processTemplateMiddleList(first, quasis, expressions);

            // 然后处理 TemplateTail
            if (cst.children[1] && cst.children[1].name === SlimeTokenConsumer.prototype.TemplateTail?.name) {
                const tail = cst.children[1];
                const raw = tail.value || '';
                const cooked = raw.slice(1, -1); // 去掉 } 和 `
                quasis.push(SlimeAstUtil.createTemplateElement(true, raw, cooked, tail.loc));
            }
        }
    }

    /**
     * 处理 TemplateMiddleList：处理多个 TemplateMiddle + Expression 对
     */
    static processTemplateMiddleList(cst: SubhutiCst, quasis: any[], expressions: SlimeExpression[]): void {
        for (let i = 0; i < cst.children.length; i++) {
            const child = cst.children[i];

            if (child.name === SlimeTokenConsumer.prototype.TemplateMiddle?.name ||
                child.name === 'TemplateMiddle') {
                const raw = child.value || '';
                const cooked = raw.slice(1, -2); // 去掉 } 和 ${
                quasis.push(SlimeAstUtil.createTemplateElement(false, raw, cooked, child.loc));
            } else if (child.name === SlimeParser.prototype.Expression?.name ||
                child.name === 'Expression') {
                expressions.push(SlimeCstToAstUtil.createExpressionAst(child));
            } else if (child.name === SlimeParser.prototype.TemplateMiddleList?.name ||
                child.name === 'TemplateMiddleList') {
                // 递归处理嵌套的 TemplateMiddleList
                TemplateCstToAst.processTemplateMiddleList(child, quasis, expressions);
            }
        }
    }
}
