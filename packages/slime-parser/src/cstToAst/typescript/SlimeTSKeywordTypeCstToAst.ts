/**
 * SlimeTSKeywordTypeCstToAst - TypeScript 关键字类型
 *
 * 负责：
 * - createTSKeywordTypeWrapperAst
 * - createTSKeywordTypeAst
 * - createTSLiteralTypeAst
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName} from "slime-ast";

export class SlimeTSKeywordTypeCstToAstSingle {
    /**
     * [TypeScript] 转换 TSKeywordType 包装规则 CST 为 AST
     */
    createTSKeywordTypeWrapperAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSKeywordType has no children')
        }

        const name = child.name

        // 基础类型关键字
        if (name === 'TSNumberKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNumberKeyword)
        if (name === 'TSStringKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSStringKeyword)
        if (name === 'TSBooleanKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBooleanKeyword)
        if (name === 'TSAnyKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSAnyKeyword)
        if (name === 'TSUnknownKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUnknownKeyword)
        if (name === 'TSNeverKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNeverKeyword)
        if (name === 'TSUndefinedKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSUndefinedKeyword)
        if (name === 'TSNullKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSNullKeyword)
        if (name === 'TSVoidKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSVoidKeyword)
        if (name === 'TSObjectKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSObjectKeyword)
        if (name === 'TSSymbolKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSSymbolKeyword)
        if (name === 'TSBigIntKeyword') return this.createTSKeywordTypeAst(child, SlimeAstTypeName.TSBigIntKeyword)

        throw new Error(`Unknown TSKeywordType child: ${name}`)
    }

    /**
     * [TypeScript] 创建关键字类型 AST
     */
    createTSKeywordTypeAst(cst: SubhutiCst, typeName: string): any {
        return {
            type: typeName,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSLiteralType CST 为 AST
     */
    createTSLiteralTypeAst(cst: SubhutiCst): any {
        const child = cst.children?.[0]
        if (!child) {
            throw new Error('TSLiteralType has no children')
        }

        // 获取字面量值
        let literal: any
        if (child.name === 'StringLiteral' || child.name === 'Literal') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'NumericLiteral') {
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: Number(tokenCst.value),
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        } else if (child.name === 'TrueTok' || child.value === 'true') {
            literal = {
                type: 'Literal',
                value: true,
                raw: 'true',
                loc: child.loc,
            }
        } else if (child.name === 'FalseTok' || child.value === 'false') {
            literal = {
                type: 'Literal',
                value: false,
                raw: 'false',
                loc: child.loc,
            }
        } else {
            // 尝试从 token 获取值
            const tokenCst = child.children?.[0] || child
            literal = {
                type: 'Literal',
                value: tokenCst.value,
                raw: tokenCst.value,
                loc: tokenCst.loc,
            }
        }

        return {
            type: SlimeAstTypeName.TSLiteralType,
            literal,
            loc: cst.loc,
        }
    }
}

export const SlimeTSKeywordTypeCstToAst = new SlimeTSKeywordTypeCstToAstSingle()
