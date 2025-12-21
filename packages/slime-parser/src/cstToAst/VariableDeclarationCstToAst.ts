import {
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeIdentifier,
    type SlimePattern,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setVariableDeclarationCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for VariableDeclarationCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 变量声明相关的 CST to AST 转换
 */
export class VariableDeclarationCstToAst {

    /**
     * 从 VariableDeclarationList 创建 VariableDeclaration AST
     */
    static createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (child.value === ',' || name === 'Comma') continue

            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                declarations.push(VariableDeclarationCstToAst.createVariableDeclaratorFromVarDeclaration(child))
            }
        }

        return {
            type: SlimeNodeType.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }

    /**
     * 从 VariableDeclaration CST 创建 VariableDeclarator AST
     */
    static createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        const children = cst.children || []
        let id: any = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = getUtil().createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = VariableDeclarationCstToAst.createInitializerAst(child)
            }
        }

        return {
            type: SlimeNodeType.VariableDeclarator,
            id: id,
            init: init,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 Initializer AST
     */
    static createInitializerAst(cst: SubhutiCst): any {
        const assignExprCst = cst.children?.find(ch => 
            ch.name === SlimeParser.prototype.AssignmentExpression?.name || 
            ch.name === 'AssignmentExpression'
        )
        if (assignExprCst) {
            return getUtil().createAssignmentExpressionAst(assignExprCst)
        }
        if (cst.children && cst.children.length > 1) {
            return getUtil().createExpressionAst(cst.children[1])
        }
        return null
    }

    /**
     * 创建 VariableDeclaration AST
     */
    static createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const astName = checkCstName(cst, SlimeParser.prototype.VariableDeclaration?.name);
        let kindCst: SubhutiCst = cst.children[0].children[0]

        let kindToken: any = undefined
        const kindValue = kindCst.value as string
        if (kindValue === 'var') {
            kindToken = SlimeTokenCreate.createVarToken(kindCst.loc)
        } else if (kindValue === 'let') {
            kindToken = SlimeTokenCreate.createLetToken(kindCst.loc)
        } else if (kindValue === 'const') {
            kindToken = SlimeTokenCreate.createConstToken(kindCst.loc)
        }

        let declarations: SlimeVariableDeclarator[] = []
        if (cst.children[1]) {
            declarations = VariableDeclarationCstToAst.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }

    /**
     * 创建 VariableDeclarationList AST
     */
    static createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        let declarations = cst.children
            .filter(item =>
                item.name === SlimeParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => VariableDeclarationCstToAst.createVariableDeclaratorAst(item)) as any[]
        return declarations
    }

    /**
     * 创建 VariableDeclarator AST
     */
    static createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimePattern

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = getUtil().createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name) {
            id = getUtil().createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeTokenCreate.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                if (initCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const init = getUtil().createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                } else {
                    const init = getUtil().createExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                }
            } else {
                variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst)
            }
        } else {
            variableDeclarator = SlimeAstUtil.createVariableDeclarator(id)
        }
        variableDeclarator.loc = cst.loc
        return variableDeclarator
    }

    /**
     * 创建 LexicalDeclaration AST
     */
    static createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        let kind: string = 'const'
        const declarations: any[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (child.loc?.type === 'Semicolon' || child.value === ';' || child.value === ',') {
                continue
            }

            if (name === SlimeParser.prototype.LetOrConst?.name || name === 'LetOrConst') {
                if (child.children && child.children.length > 0) {
                    const tokenCst = child.children[0]
                    kind = tokenCst.value as string || 'const'
                }
                continue
            }

            if (name === 'Let' || child.value === 'let') {
                kind = 'let'
                continue
            }
            if (name === 'Const' || child.value === 'const') {
                kind = 'const'
                continue
            }

            if (name === 'BindingList' || name === SlimeParser.prototype.BindingList?.name) {
                for (const binding of child.children || []) {
                    if (binding.name === 'LexicalBinding' || binding.name === SlimeParser.prototype.LexicalBinding?.name) {
                        declarations.push(VariableDeclarationCstToAst.createLexicalBindingAst(binding))
                    }
                    if (binding.value === ',') continue
                }
                continue
            }

            if (name === 'LexicalBinding' || name === SlimeParser.prototype.LexicalBinding?.name) {
                declarations.push(VariableDeclarationCstToAst.createLexicalBindingAst(child))
            }
        }

        return {
            type: SlimeNodeType.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }

    /**
     * 创建 LexicalBinding AST
     */
    static createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        let id: any = null
        let init: any = null

        for (const child of cst.children || []) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = getUtil().createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = getUtil().createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = VariableDeclarationCstToAst.createInitializerAst(child)
            }
        }

        return {
            type: SlimeNodeType.VariableDeclarator,
            id: id,
            init: init,
            loc: cst.loc
        } as any
    }
}
