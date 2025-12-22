/**
 * IdentifierCstToAst - 标识符相关转换
 */
import { SubhutiCst, type SubhutiSourceLocation } from "subhuti";
import {
    SlimeAstUtil,
    SlimeClassBody, SlimeFunctionParam,
    SlimeIdentifier,
    SlimeMethodDefinition, SlimePattern,
    SlimePropertyDefinition,
    SlimeStatement,
    SlimeAstTypeName,
    SlimeTokenCreate,
} from "slime-ast";

import SlimeParser from "../../SlimeParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import SlimeTokenConsumer from "../../SlimeTokenConsumer.ts";
import { SlimeVariableCstToAstSingle } from "../statements/SlimeVariableCstToAst.ts";
import { SlimeJavascriptIdentifierCstToAstSingle } from "../../deprecated/slimeJavascriptCstToAst";
import { SlimeJavascriptAstUtil } from "slime-ast";

export class SlimeIdentifierCstToAstSingle extends SlimeJavascriptIdentifierCstToAstSingle {

    /**
     * [TypeScript] 重写 createBindingIdentifierAst 以支持可选的类型注解
     *
     * CST 结构 (TypeScript 扩展):
     *   BindingIdentifier -> Identifier [TSTypeAnnotation]
     *   TSTypeAnnotation -> Colon TSType
     *   TSType -> TSNumberKeyword
     */
    override createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        const children = cst.children || []
        const first = children[0]

        let identifier: SlimeIdentifier

        // 如果第一个子节点是 Identifier 规则
        if (first.name === 'Identifier' || first.name === SlimeParser.prototype.Identifier?.name) {
            const tokenCst = first.children?.[0]
            if (tokenCst && tokenCst.value !== undefined) {
                identifier = SlimeJavascriptAstUtil.createIdentifier(tokenCst.value, tokenCst.loc)
            } else {
                throw new Error(`createBindingIdentifierAst: Cannot extract value from Identifier`)
            }
        } else if (first.value !== undefined) {
            // 直接是 token 的情况（YieldTok, AwaitTok）
            identifier = SlimeJavascriptAstUtil.createIdentifier(first.value, first.loc)
        } else {
            throw new Error(`createBindingIdentifierAst: Cannot extract identifier value from ${first.name}`)
        }

        // [TypeScript] 检查是否有类型注解
        const tsTypeAnnotationName = SlimeParser.prototype.TSTypeAnnotation?.name || 'TSTypeAnnotation'
        const typeAnnotationCst = children.find(child =>
            child.name === tsTypeAnnotationName || child.name === 'TSTypeAnnotation'
        )
        if (typeAnnotationCst) {
            identifier.typeAnnotation = this.createTSTypeAnnotationAst(typeAnnotationCst)
        }

        return identifier
    }

    /**
     * [TypeScript] 转换 TSTypeAnnotation CST 为 AST
     * CST 结构：TSTypeAnnotation -> Colon + TSType
     */
    createTSTypeAnnotationAst(cst: SubhutiCst): any {
        const children = cst.children || []
        if (children.length < 2) {
            throw new Error(`TSTypeAnnotation expected at least 2 children, got ${children.length}`)
        }

        // 第一个子节点是 Colon token
        const colonCst = children[0]
        const colonToken = SlimeTokenCreate.createColonToken(colonCst.loc)

        // 第二个子节点是 TSType
        const typeCst = children[1]
        const typeAnnotation = this.createTSTypeAst(typeCst)

        return {
            type: SlimeAstTypeName.TSTypeAnnotation,
            colonToken,
            typeAnnotation,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSType CST 为 AST
     * CST 结构：TSType -> TSNumberKeyword | ...
     */
    createTSTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSType has no children')
        }

        const tsNumberKeywordName = SlimeParser.prototype.TSNumberKeyword?.name || 'TSNumberKeyword'
        if (child.name === tsNumberKeywordName || child.name === 'TSNumberKeyword') {
            return this.createTSNumberKeywordAst(child)
        }

        throw new Error(`Unknown TSType child: ${child.name}`)
    }

    /**
     * [TypeScript] 转换 TSNumberKeyword CST 为 AST
     */
    createTSNumberKeywordAst(cst: SubhutiCst): any {
        return {
            type: SlimeAstTypeName.TSNumberKeyword,
            loc: cst.loc,
        }
    }
}

export const SlimeIdentifierCstToAst = new SlimeIdentifierCstToAstSingle()

