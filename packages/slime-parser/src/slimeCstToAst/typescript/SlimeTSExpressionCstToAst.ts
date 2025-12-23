import {SubhutiCst} from "subhuti";
import {
    SlimeJavascriptAstCreateUtils,
    SlimeJavascriptAstTypeName,
    SlimeJavascriptClassDeclaration, SlimeJavascriptClassExpression, SlimeJavascriptExpression,
    SlimeJavascriptIdentifier,
    SlimeJavascriptTokenCreateUtils
} from "SlimeJavascript-ast";
import {SlimeJavascriptTSDeclarationCstToAstSingle} from "./SlimeTSDeclarationCstToAst.ts";

export class SlimeJavascriptTSExpressionCstToAstSingle {
    /**
     * [TypeScript] 转换 TSAsExpression CST �?AST
     * expression as Type
     */
    createTSAsExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return {
            type: SlimeAstTypeName.TSAsExpression,
            expression,
            typeAnnotation: this.createTSTypeAst(typeCst),
            loc,
        }
    }


    /**
     * [TypeScript] 转换 TSSatisfiesExpression CST �?AST
     * expression satisfies Type
     */
    createTSSatisfiesExpressionAst(expression: any, typeCst: SubhutiCst, loc: any): any {
        return {
            type: SlimeAstTypeName.TSSatisfiesExpression,
            expression,
            typeAnnotation: this.createTSTypeAst(typeCst),
            loc,
        }
    }


    /**
     * [TypeScript] 转换 TSNonNullExpression CST �?AST
     * expression!
     */
    createTSNonNullExpressionAst(expression: any, loc: any): any {
        return {
            type: SlimeAstTypeName.TSNonNullExpression,
            expression,
            loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypeAssertion CST �?AST
     * <Type>expression
     */
    createTSTypeAssertionAst(cst: SubhutiCst): any {
        const children = cst.children || []

        // 找到 TSType
        const typeCst = children.find(c => c.name === 'TSType')
        // 找到 UnaryExpression
        const exprCst = children.find(c => c.name === 'UnaryExpression')

        if (!typeCst || !exprCst) {
            throw new Error('TSTypeAssertion: missing TSType or UnaryExpression')
        }

        return {
            type: SlimeAstTypeName.TSTypeAssertion,
            typeAnnotation: this.createTSTypeAst(typeCst),
            expression: SlimeCstToAstUtil.createUnaryExpressionAst(exprCst),
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTypePredicate CST �?AST
     * x is Type / asserts x is Type / asserts x
     */
    createTSTypePredicateAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let asserts = false
        let parameterName: any = undefined
        let typeAnnotation: any = undefined

        for (const child of children) {
            if (child.name === 'TSAsserts' || child.value === 'asserts') {
                asserts = true
            } else if (child.name === 'This' || child.value === 'this') {
                parameterName = {
                    type: 'TSThisType',
                    loc: child.loc,
                }
            } else if (child.name === 'Identifier') {
                const tokenCst = child.children?.[0] || child
                parameterName = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSType') {
                typeAnnotation = this.createTSTypeAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.TSTypePredicate,
            asserts,
            parameterName,
            typeAnnotation,
            loc: cst.loc,
        }
    }
}

export const SlimeJavascriptTSExpressionCstToAst = new SlimeJavascriptTSExpressionCstToAstSingle()
