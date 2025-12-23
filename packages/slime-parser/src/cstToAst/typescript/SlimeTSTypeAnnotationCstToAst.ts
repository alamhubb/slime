/**
 * SlimeTSTypeAnnotationCstToAst - TypeScript 类型注解入口
 *
 * 负责：
 * - createTSTypeAnnotationAst
 * - createTSTypeAst (入口分发)
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName, SlimeTokenCreateUtils} from "slime-ast";

export class SlimeTSTypeAnnotationCstToAstSingle {

    /**
     * [TypeScript] 转换 TSTypeAnnotation CST 为 AST
     */
    createTSTypeAnnotationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        if (children.length < 2) {
            throw new Error(`TSTypeAnnotation expected at least 2 children, got ${children.length}`)
        }

        const colonCst = children[0]
        const colonToken = SlimeTokenCreateUtils.createColonToken(colonCst.loc)

        const typeCst = children[1]
        const typeAnnotation = this.createTSTypeAst(typeCst)

        return {
            type: SlimeAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }
}

export const SlimeTSTypeAnnotationCstToAst = new SlimeTSTypeAnnotationCstToAstSingle()
