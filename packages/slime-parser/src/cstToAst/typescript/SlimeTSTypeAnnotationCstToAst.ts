/**
 * SlimeTSTypeAnnotationCstToAst - TypeScript 类型注解入口
 *
 * 负责：
 * - createTSTypeAnnotationAst
 * - createTSTypeAst (入口分发)
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName, SlimeTokenCreateUtils} from "slime-ast";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";

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
        const typeAnnotation = SlimeCstToAstUtil.createTSTypeAst(typeCst)

        return {
            type: SlimeAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSType CST 为 AST
     * 支持所有已实现的 TypeScript 类型
     */
    createTSTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSType has no children')
        }

        const name = child.name

        // 函数类型
        if (name === 'TSFunctionType') {
            return SlimeCstToAstUtil.createTSFunctionTypeAst(child)
        }
        if (name === 'TSConstructorType') {
            return SlimeCstToAstUtil.createTSConstructorTypeAst(child)
        }

        // 条件类型（包含联合/交叉类型）
        if (name === 'TSConditionalType') {
            return SlimeCstToAstUtil.createTSConditionalTypeAst(child)
        }

        // 联合/交叉类型（兼容旧代码）
        if (name === 'TSUnionOrIntersectionType') {
            return SlimeCstToAstUtil.createTSUnionOrIntersectionTypeAst(child)
        }

        throw new Error(`Unknown TSType child: ${name}`)
    }

}

export const SlimeTSTypeAnnotationCstToAst = new SlimeTSTypeAnnotationCstToAstSingle()
