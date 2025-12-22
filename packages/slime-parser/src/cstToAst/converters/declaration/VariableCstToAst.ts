/**
 * VariableCstToAst - var/let/const 声明转换
 */
import {SubhutiCst} from "subhuti";
import {SlimeAstUtils} from "../../SlimeAstUtils.ts";
import SlimeParser from "../../../SlimeParser.ts";
import {
    type SlimeBlockStatement, type SlimeClassDeclaration, type SlimeDeclaration,
    type SlimeFunctionDeclaration, type SlimeFunctionExpression,
    type SlimeFunctionParam,
    type SlimeIdentifier, SlimeNodeType, type SlimePropertyDefinition,
    SlimeTokenCreate, type SlimeVariableDeclaration, type SlimeVariableDeclarator
} from "slime-ast";

export class VariableCstToAst {

    /**
     * LetOrConst CST �?AST
     * LetOrConst -> let | const
     */
    createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }




    /**
     * �?VariableDeclarationList 创建 VariableDeclaration AST
     */
    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // Skip commas
            if (child.value === ',' || name === 'Comma') continue

            // VariableDeclaration
            if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                declarations.push(this.createVariableDeclaratorFromVarDeclaration(child))
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
     * ForBinding CST �?AST
     * ForBinding -> BindingIdentifier | BindingPattern
     */
    createForBindingAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return this.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return this.createBindingPatternAst(firstChild)
        }
        return this.createBindingIdentifierAst(firstChild)
    }




    /**
     * ForDeclaration CST �?AST
     * ForDeclaration -> LetOrConst ForBinding
     */
    createForDeclarationAst(cst: SubhutiCst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? this.createForBindingAst(forBinding) : null

        return {
            type: SlimeNodeType.VariableDeclaration,
            declarations: [{
                type: SlimeNodeType.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: { type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc },
            loc: cst.loc
        }
    }

    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return this.createAssignmentExpressionAst(assignmentExpressionCst)
    }





    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // 兼容 LexicalBinding �?VariableDeclaration
        // const astName = SlimeAstUtils.checkCstName(cst, 'LexicalBinding');

        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimePattern

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name) {
            id = this.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name) {
            id = this.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        // console.log(6565656)
        // console.log(id)
        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeTokenCreate.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeParser.prototype.AssignmentExpression?.name) {
                    const init = this.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeAstUtil.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = this.createExpressionAst(initCst)
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
     * �?VariableDeclaration CST 创建 VariableDeclarator AST
     * VariableDeclaration: BindingIdentifier Initializer? | BindingPattern Initializer
     */
    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        const children = cst.children || []
        let id: any = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = this.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = this.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                init = this.createInitializerAst(child)
            }
        }

        return {
            type: SlimeNodeType.VariableDeclarator,
            id: id,
            init: init,
            loc: cst.loc
        } as any
    }


    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        // 过滤出VariableDeclarator节点（跳过Comma token�?
        // 兼容 VariableDeclarator �?LexicalBinding
        let declarations = cst.children
            .filter(item =>
                item.name === SlimeParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => this.createVariableDeclaratorAst(item)) as any[]
        return declarations
    }


    createLexicalBindingAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer
        const children = cst.children || []

        let id: any = null
        let init: any = null
        let assignToken: any = undefined

        for (const child of children) {
            if (!child) continue

            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = this.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = this.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                // Initializer: = AssignmentExpression
                // children[0] �?Assign token，children[1] �?AssignmentExpression
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeTokenCreate.createAssignToken(assignCst.loc)
                }
                init = this.createInitializerAst(child)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id, assignToken, init, cst.loc)
    }


    createLexicalDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        // ES2025 LexicalDeclaration: LetOrConst BindingList ;
        // BindingList: LexicalBinding (, LexicalBinding)*
        // LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer

        const children = cst.children || []
        let kind: string = 'const' // 默认�?
        const declarations: any[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // Skip tokens (semicolons, commas)
            if (child.loc?.type === 'Semicolon' || child.value === ';' || child.value === ',') {
                continue
            }

            // LetOrConst 规则
            if (name === SlimeParser.prototype.LetOrConst?.name || name === 'LetOrConst') {
                // 内部�?LetTok �?ConstTok
                if (child.children && child.children.length > 0) {
                    const tokenCst = child.children[0]
                    kind = tokenCst.value as string || 'const'
                }
                continue
            }

            // 直接�?LetTok �?ConstTok (ES2025 可能直接使用)
            if (name === 'Let' || child.value === 'let') {
                kind = 'let'
                continue
            }
            if (name === 'Const' || child.value === 'const') {
                kind = 'const'
                continue
            }

            // Handle BindingList wrapper
            if (name === 'BindingList' || name === SlimeParser.prototype.BindingList?.name) {
                for (const binding of child.children || []) {
                    if (binding.name === 'LexicalBinding' || binding.name === SlimeParser.prototype.LexicalBinding?.name) {
                        declarations.push(this.createLexicalBindingAst(binding))
                    }
                    // Skip commas
                    if (binding.value === ',') continue
                }
                continue
            }

            // Direct LexicalBinding
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


    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        //直接返回声明
        //                 this.Statement()
        //                 this.Declaration()
        const astName = SlimeAstUtils.checkCstName(cst, SlimeParser.prototype.VariableDeclaration?.name);
        let kindCst: SubhutiCst = cst.children[0].children[0]

        // 创建 kind token
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
            declarations = this.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }


    /**
     * 创建 var 变量声明语句 AST
     * ES2025 VariableStatement: var VariableDeclarationList ;
     */
    createVariableStatementAst(cst: SubhutiCst): SlimeVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeVariableDeclarator[] = []

        // 查找 VariableDeclarationList
        for (const child of children) {
            if (!child) continue

            if (child.name === SlimeParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                // VariableDeclarationList 包含多个 VariableDeclaration
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


    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        // Support both Declaration wrapper and direct types
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return this.createVariableDeclarationAst(first);
        } else if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            // LexicalDeclaration: let/const declarations
            return this.createLexicalDeclarationAst(first);
        } else if (name === SlimeParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return this.createClassDeclarationAst(first);
        } else if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return this.createFunctionDeclarationAst(first);
        } else if (name === SlimeParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return this.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }

}
