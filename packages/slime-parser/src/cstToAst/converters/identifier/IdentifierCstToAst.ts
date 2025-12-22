/**
 * IdentifierCstToAst - 标识符相关转换
 */
import { SubhutiCst } from "subhuti";
import {
    type SlimeIdentifier,
    SlimeNodeType,
} from "slime-ast";
import { SlimeAstUtils } from "../../SlimeAstUtils";

export class IdentifierCstToAst {
    /**
     * 创建 Identifier AST
     */
    static createIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        let name: string
        if (cst.value) {
            name = cst.value
        } else if (cst.children && cst.children.length > 0) {
            name = cst.children[0].value || ''
        } else {
            name = ''
        }

        return {
            type: SlimeNodeType.Identifier,
            name: SlimeAstUtils.decodeUnicodeEscapes(name),
            loc: cst.loc
        } as SlimeIdentifier
    }

    /**
     * 创建 Identifier（从名称和位置）
     */
    static createIdentifier(name: string, loc?: any): SlimeIdentifier {
        return {
            type: SlimeNodeType.Identifier,
            name: SlimeAstUtils.decodeUnicodeEscapes(name),
            loc: loc
        } as SlimeIdentifier
    }

    /**
     * 创建 BindingIdentifier AST
     */
    static createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier {
        return IdentifierCstToAst.createIdentifierAst(cst)
    }

    /**
     * 创建 PrivateIdentifier AST
     * ES2022: #identifier
     */
    static createPrivateIdentifierAst(cst: SubhutiCst): any {
        const name = cst.value || cst.children?.[0]?.value || ''
        return {
            type: 'PrivateIdentifier',
            name: name.startsWith('#') ? name.slice(1) : name,
            loc: cst.loc
        }
    }

    /**
     * 创建 MetaProperty AST
     * new.target / import.meta
     */
    static createMetaPropertyAst(cst: SubhutiCst): any {
        // MetaProperty: NewTarget | ImportMeta
        // NewTarget: new . target
        // ImportMeta: import . meta
        const children = cst.children || []
        let meta: SlimeIdentifier
        let property: SlimeIdentifier

        if (children.length >= 3) {
            // 结构: keyword . identifier
            meta = IdentifierCstToAst.createIdentifier(children[0].value || children[0].name, children[0].loc)
            property = IdentifierCstToAst.createIdentifier(children[2].value || children[2].name, children[2].loc)
        } else if (cst.name === 'NewTarget') {
            meta = IdentifierCstToAst.createIdentifier('new', cst.loc)
            property = IdentifierCstToAst.createIdentifier('target', cst.loc)
        } else if (cst.name === 'ImportMeta') {
            meta = IdentifierCstToAst.createIdentifier('import', cst.loc)
            property = IdentifierCstToAst.createIdentifier('meta', cst.loc)
        } else {
            throw new Error('Invalid MetaProperty CST')
        }

        return {
            type: 'MetaProperty',
            meta: meta,
            property: property,
            loc: cst.loc
        }
    }

    /**
     * 创建 SuperProperty AST
     * super.prop / super[expr]
     */
    static createSuperPropertyAst(cst: SubhutiCst): any {
        // 延迟导入避免循环依赖
        const SlimeCstToAstUtil = require('../../../SlimeCstToAstUtil').default;
        
        const children = cst.children || []
        // SuperProperty: super [ Expression ] | super . IdentifierName
        
        const superNode = {
            type: 'Super',
            loc: children[0]?.loc || cst.loc
        }

        // 检查是否是计算属性 super[expr]
        const hasBracket = children.some(c => c.value === '[' || c.name === 'LBracket')
        
        if (hasBracket) {
            // super[expr]
            const exprChild = children.find(c => 
                c.name !== 'Super' && 
                c.value !== 'super' && 
                c.value !== '[' && 
                c.value !== ']' &&
                c.name !== 'LBracket' &&
                c.name !== 'RBracket'
            )
            const property = exprChild ? SlimeCstToAstUtil.createExpressionAst(exprChild) : null
            return {
                type: 'MemberExpression',
                object: superNode,
                property: property,
                computed: true,
                optional: false,
                loc: cst.loc
            }
        } else {
            // super.prop
            const identChild = children.find(c => 
                c.name === 'IdentifierName' || 
                (c.name !== 'Super' && c.value !== 'super' && c.value !== '.')
            )
            let property: SlimeIdentifier
            if (identChild) {
                if (identChild.children && identChild.children.length > 0) {
                    property = IdentifierCstToAst.createIdentifier(
                        identChild.children[0].value,
                        identChild.children[0].loc
                    )
                } else {
                    property = IdentifierCstToAst.createIdentifier(identChild.value, identChild.loc)
                }
            } else {
                property = IdentifierCstToAst.createIdentifier('', cst.loc)
            }
            return {
                type: 'MemberExpression',
                object: superNode,
                property: property,
                computed: false,
                optional: false,
                loc: cst.loc
            }
        }
    }
}
