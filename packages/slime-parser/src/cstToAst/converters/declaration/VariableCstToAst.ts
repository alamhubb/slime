import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeNodeType, SlimeTokenCreate, SlimeVariableDeclaration, SlimeVariableDeclarator } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * Variable CST 到 AST 转换器
 * 
 * 负责处理：
 * - VariableStatement: var 变量声明语句
 * - VariableDeclaration: 变量声明
 * - VariableDeclarationList: 变量声明列表
 * - LexicalDeclaration: let/const 声明
 * - LetOrConst: let 或 const 关键字
 * - LexicalBinding: 词法绑定
 * - Initializer: 初始化器
 */
export class VariableCstToAst {

    /**
     * 创建 LexicalDeclaration AST (let/const)
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
                        declarations.push(this.createLexicalBindingAst(binding))
                    }
                    if (binding.value === ',') continue
                }
                continue
            }

            if (name === 'LexicalBinding' || name === SlimeParser.prototype.LexicalBinding?.name) {
                declarations.push(this.createLexicalBindingAst(child))
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
        const children = cst.children || []

        let id: any = null
        let init: any = null
        let assignToken: any = undefined

        for (const child of children) {
            if (!child) continue

            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeTokenCreate.createAssignToken(assignCst.loc)
                }
                init = SlimeCstToAstUtil.createInitializerAst(child)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id, assignToken, init, cst.loc)
    }

    /**
     * 创建 VariableStatement AST (var)
     */
    static createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue

            if (child.name === SlimeParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeParser.prototype.VariableDeclaration?.name ||
                        varDeclCst.name === 'VariableDeclaration') {
                        declarations.push(this.createVariableDeclaratorFromVarDeclaration(varDeclCst))
                    }
                }
            }
        }

        return {
            type: SlimeNodeType.VariableDeclaration,
            kind: 'var' as any,
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
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = SlimeCstToAstUtil.createInitializerAst(child)
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
     * 创建 VariableDeclaration AST
     */
    static createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const first = cst.children[0]
        let kindToken: any = undefined

        if (first.name === 'Var' || first.value === 'var') {
            kindToken = SlimeTokenCreate.createVarToken(first.loc)
        }

        let declarations: SlimeVariableDeclarator[] = []
        if (cst.children[1]) {
            declarations = this.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }

    /**
     * 创建 VariableDeclarationList AST
     */
    static createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        const declarators: SlimeVariableDeclarator[] = []
        for (const child of cst.children || []) {
            if (child.name === SlimeParser.prototype.VariableDeclaration?.name ||
                child.name === 'VariableDeclaration' ||
                child.name === SlimeParser.prototype.LexicalBinding?.name ||
                child.name === 'LexicalBinding') {
                declarators.push(this.createVariableDeclaratorFromVarDeclaration(child))
            }
        }
        return declarators
    }

    /**
     * 创建 LetOrConst AST
     */
    static createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }

    /**
     * 创建 Initializer AST
     */
    static createInitializerAst(cst: SubhutiCst): any {
        checkCstName(cst, SlimeParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return SlimeCstToAstUtil.createAssignmentExpressionAst(assignmentExpressionCst)
    }
}
