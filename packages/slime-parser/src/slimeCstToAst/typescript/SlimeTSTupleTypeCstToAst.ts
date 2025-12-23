import {SubhutiCst} from "subhuti";
import {SlimeAstTypeName, SlimeAstTypeName} from "SlimeJavascript-ast";
import {SlimeJavascriptTSPrimaryTypeCstToAstSingle} from "./SlimeTSPrimaryTypeCstToAst.ts";

export class SlimeJavascriptTSTupleTypeCstToAstSingle {
    /**
     * [TypeScript] 转换 TSTupleType CST �?AST
     */
    createTSTupleTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const elementTypes: any[] = []

        for (const child of children) {
            if (child.name === 'TSTupleElement' || child.name === 'TSTupleElementType') {
                elementTypes.push(this.createTSTupleElementAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.TSTupleType,
            elementTypes,
            loc: cst.loc,
        }
    }


    /**
     * [TypeScript] 转换 TSTupleElement CST �?AST
     */
    createTSTupleElementAst(cst: SubhutiCst): any {
        const children = cst.children || []

        const restCst = children.find(c => c.name === 'TSRestType')
        if (restCst) {
            return this.createTSRestTypeAst(restCst)
        }

        const namedCst = children.find(c => c.name === 'TSNamedTupleMember')
        if (namedCst) {
            return this.createTSNamedTupleMemberAst(namedCst)
        }

        const hasEllipsis = children.some(c => c.name === 'Ellipsis' || c.value === '...')
        if (hasEllipsis) {
            const typeCst = children.find(c => c.name === 'TSType')
            return {
                type: SlimeAstTypeName.TSRestType,
                typeAnnotation: typeCst ? this.createTSTypeAst(typeCst) : undefined,
                loc: cst.loc,
            }
        }

        const typeCst = children.find(c => c.name === 'TSType')
        const hasQuestion = children.some(c => c.name === 'Question' || c.value === '?')

        if (typeCst) {
            const typeAst = this.createTSTypeAst(typeCst)
            if (hasQuestion) {
                return {
                    type: SlimeAstTypeName.TSOptionalType,
                    typeAnnotation: typeAst,
                    loc: cst.loc,
                }
            }
            return typeAst
        }

        const firstChild = children[0]
        if (firstChild && firstChild.name) {
            if (firstChild.name === 'TSConditionalType') {
                return this.createTSConditionalTypeAst(firstChild)
            }
            if (firstChild.name === 'TSUnionOrIntersectionType') {
                return this.createTSUnionOrIntersectionTypeAst(firstChild)
            }
        }

        throw new Error(`TSTupleElement: no type found, children: ${children.map(c => c.name).join(', ')}`)
    }


    /**
     * [TypeScript] 转换 TSRestType CST �?AST
     */
    createTSRestTypeAst(cst: SubhutiCst): any {
        const children = cst.children || []
        const typeCst = children.find(c => c.name === 'TSType')

        return {
            type: SlimeAstTypeName.TSRestType,
            typeAnnotation: typeCst ? this.createTSTypeAst(typeCst) : undefined,
            loc: cst.loc,
        }
    }

    /**
     * [TypeScript] 转换 TSNamedTupleMember CST �?AST
     */
    createTSNamedTupleMemberAst(cst: SubhutiCst): any {
        const children = cst.children || []

        let label: any = undefined
        let elementType: any = undefined
        let optional = false

        for (const child of children) {
            if (child.name === 'Identifier' || child.name === 'IdentifierName') {
                const tokenCst = child.children?.[0] || child
                label = {
                    type: 'Identifier',
                    name: tokenCst.value,
                    loc: tokenCst.loc,
                }
            } else if (child.name === 'TSType') {
                elementType = this.createTSTypeAst(child)
            } else if (child.name === 'Question' || child.value === '?') {
                optional = true
            }
        }

        return {
            type: SlimeAstTypeName.TSNamedTupleMember,
            label,
            elementType,
            optional,
            loc: cst.loc,
        }
    }
}

export const SlimeJavascriptTSTupleTypeCstToAst = new SlimeJavascriptTSTupleTypeCstToAstSingle()
