/**
 * VariableCstToAst - var/let/const 声明转换
 */
import {SubhutiCst} from "subhuti";

import SlimeJavascriptParser from "../../SlimeJavascriptParser.ts";
import SlimeJavascriptCstToAstUtil from "../../SlimeJavascriptCstToAstUtil.ts";
import {
    type SlimeJavascriptBlockStatement, type SlimeJavascriptClassDeclaration, type SlimeJavascriptDeclaration,
    type SlimeJavascriptFunctionDeclaration, type SlimeJavascriptFunctionExpression,
    type SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, type SlimeJavascriptPropertyDefinition,
    SlimeJavascriptTokenCreateUtils, type SlimeJavascriptVariableDeclaration, type SlimeJavascriptVariableDeclarator,
    SlimeJavascriptCreateUtils, type SlimeJavascriptPattern, type SlimeJavascriptExpression
} from "slime-ast";
import {SlimeJavascriptClassDeclarationCstToAstSingle} from "../class/SlimeJavascriptClassDeclarationCstToAst.ts";



export class SlimeJavascriptVariableCstToAstSingle {

    /**
     * 创建 var 变量声明语句 AST
     * ES2025 VariableStatement: var VariableDeclarationList ;
     */
    createVariableStatementAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeJavascriptVariableDeclarator[] = []

        // 查找 VariableDeclarationList
        for (const child of children) {
            if (!child) continue

            if (child.name === SlimeJavascriptParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                // VariableDeclarationList 包含多个 VariableDeclaration
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeJavascriptParser.prototype.VariableDeclaration?.name ||
                        varDeclCst.name === 'VariableDeclaration') {
                        declarations.push(SlimeJavascriptCstToAstUtil.createVariableDeclaratorFromVarDeclaration(varDeclCst))
                    }
                }
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.VariableDeclaration,
            kind: 'var' as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }


    createVariableDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
        //直接返回声明
        //                 SlimeJavascriptCstToAstUtil.Statement()
        //                 SlimeJavascriptCstToAstUtil.Declaration()
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.VariableDeclaration?.name);
        let kindCst: SubhutiCst = cst.children[0].children[0]

        // 创建 kind token
        let kindToken: any = undefined
        const kindValue = kindCst.value as string
        if (kindValue === 'var') {
            kindToken = SlimeJavascriptTokenCreateUtils.createVarToken(kindCst.loc)
        } else if (kindValue === 'let') {
            kindToken = SlimeJavascriptTokenCreateUtils.createLetToken(kindCst.loc)
        } else if (kindValue === 'const') {
            kindToken = SlimeJavascriptTokenCreateUtils.createConstToken(kindCst.loc)
        }

        let declarations: SlimeJavascriptVariableDeclarator[] = []
        if (cst.children[1]) {
            declarations = SlimeJavascriptCstToAstUtil.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeJavascriptCreateUtils.createVariableDeclaration(kindToken, declarations, cst.loc)
    }


    createVariableDeclarationListAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator[] {
        // 过滤出VariableDeclarator节点（跳过Comma token�?
        // 兼容 VariableDeclarator �?LexicalBinding
        let declarations = cst.children
            .filter(item =>
                item.name === SlimeJavascriptParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => SlimeJavascriptCstToAstUtil.createVariableDeclaratorAst(item)) as any[]
        return declarations
    }


    createVariableDeclaratorAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        // 兼容 LexicalBinding �?VariableDeclaration
        // const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, 'LexicalBinding');

        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeJavascriptIdentifier | SlimeJavascriptPattern

        if (firstChild.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name) {
            id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.BindingPattern?.name) {
            id = SlimeJavascriptCstToAstUtil.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        // console.log(6565656)
        // console.log(id)
        let variableDeclarator: SlimeJavascriptVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeJavascriptTokenCreateUtils.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                    const init = SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeJavascriptCreateUtils.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = SlimeJavascriptCstToAstUtil.createExpressionAst(initCst)
                    variableDeclarator = SlimeJavascriptCreateUtils.createVariableDeclarator(id, eqAst, init)
                }
            } else {
                variableDeclarator = SlimeJavascriptCreateUtils.createVariableDeclarator(id, eqAst)
            }
        } else {
            variableDeclarator = SlimeJavascriptCreateUtils.createVariableDeclarator(id)
        }
        variableDeclarator.loc = cst.loc
        return variableDeclarator
    }


    /**
     * �?VariableDeclaration CST 创建 VariableDeclarator AST
     * VariableDeclaration: BindingIdentifier Initializer? | BindingPattern Initializer
     */
    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        const children = cst.children || []
        let id: any = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeJavascriptParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeJavascriptCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeJavascriptParser.prototype.Initializer?.name || name === 'Initializer') {
                init = SlimeJavascriptCstToAstUtil.createInitializerAst(child)
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.VariableDeclarator,
            id: id,
            init: init,
            loc: cst.loc
        } as any
    }


    /**
     * �?VariableDeclarationList 创建 VariableDeclaration AST
     */
    createVariableDeclarationFromList(cst: SubhutiCst, kind: string): SlimeJavascriptVariableDeclaration {
        const children = cst.children || []
        const declarations: SlimeJavascriptVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // Skip commas
            if (child.value === ',' || name === 'Comma') continue

            // VariableDeclaration
            if (name === SlimeJavascriptParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                declarations.push(SlimeJavascriptCstToAstUtil.createVariableDeclaratorFromVarDeclaration(child))
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }


    createLexicalDeclarationAst(cst: SubhutiCst): SlimeJavascriptVariableDeclaration {
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
            if (name === SlimeJavascriptParser.prototype.LetOrConst?.name || name === 'LetOrConst') {
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
            if (name === 'BindingList' || name === SlimeJavascriptParser.prototype.BindingList?.name) {
                for (const binding of child.children || []) {
                    if (binding.name === 'LexicalBinding' || binding.name === SlimeJavascriptParser.prototype.LexicalBinding?.name) {
                        declarations.push(SlimeJavascriptCstToAstUtil.createLexicalBindingAst(binding))
                    }
                    // Skip commas
                    if (binding.value === ',') continue
                }
                continue
            }

            // Direct LexicalBinding
            if (name === 'LexicalBinding' || name === SlimeJavascriptParser.prototype.LexicalBinding?.name) {
                declarations.push(SlimeJavascriptCstToAstUtil.createLexicalBindingAst(child))
            }
        }

        return {
            type: SlimeJavascriptAstTypeName.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }


    createLexicalBindingAst(cst: SubhutiCst): SlimeJavascriptVariableDeclarator {
        // LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer
        const children = cst.children || []

        let id: any = null
        let init: any = null
        let assignToken: any = undefined

        for (const child of children) {
            if (!child) continue

            const name = child.name
            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeJavascriptParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeJavascriptCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeJavascriptParser.prototype.Initializer?.name || name === 'Initializer') {
                // Initializer: = AssignmentExpression
                // children[0] �?Assign token，children[1] �?AssignmentExpression
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeJavascriptTokenCreateUtils.createAssignToken(assignCst.loc)
                }
                init = SlimeJavascriptCstToAstUtil.createInitializerAst(child)
            }
        }

        return SlimeJavascriptCreateUtils.createVariableDeclarator(id, assignToken, init, cst.loc)
    }


    /**
     * LetOrConst CST �?AST
     * LetOrConst -> let | const
     */
    createLetOrConstAst(cst: SubhutiCst): string {
        const token = cst.children?.[0]
        return token?.value || 'let'
    }


    createInitializerAst(cst: SubhutiCst): SlimeJavascriptExpression {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return SlimeJavascriptCstToAstUtil.createAssignmentExpressionAst(assignmentExpressionCst)
    }


    createDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        // Support both Declaration wrapper and direct types
        const first = cst.name === SlimeJavascriptParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeJavascriptParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return SlimeJavascriptCstToAstUtil.createVariableDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            // LexicalDeclaration: let/const declarations
            return SlimeJavascriptCstToAstUtil.createLexicalDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return SlimeJavascriptCstToAstUtil.createClassDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return SlimeJavascriptCstToAstUtil.createFunctionDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return SlimeJavascriptCstToAstUtil.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }


    createHoistableDeclarationAst(cst: SubhutiCst): SlimeJavascriptDeclaration {
        const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]
        if (first.name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return SlimeJavascriptCstToAstUtil.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            // GeneratorDeclaration -> 类似FunctionDeclaration但有*�?
            return SlimeJavascriptCstToAstUtil.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            // AsyncFunctionDeclaration -> async function
            return SlimeJavascriptCstToAstUtil.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            // AsyncGeneratorDeclaration -> async function*
            return SlimeJavascriptCstToAstUtil.createAsyncGeneratorDeclarationAst(first)
        } else {
            throw new Error(`Unsupported HoistableDeclaration type: ${first.name}`)
        }
    }


    /**
     * ForDeclaration CST �?AST
     * ForDeclaration -> LetOrConst ForBinding
     */
    createForDeclarationAst(cst: SubhutiCst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeJavascriptParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? SlimeJavascriptCstToAstUtil.createForBindingAst(forBinding) : null

        return {
            type: SlimeJavascriptAstTypeName.VariableDeclaration,
            declarations: [{
                type: SlimeJavascriptAstTypeName.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: {type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc},
            loc: cst.loc
        }
    }


    /**
     * ForBinding CST �?AST
     * ForBinding -> BindingIdentifier | BindingPattern
     */
    createForBindingAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return SlimeJavascriptCstToAstUtil.createBindingPatternAst(firstChild)
        }
        return SlimeJavascriptCstToAstUtil.createBindingIdentifierAst(firstChild)
    }


}

export const SlimeJavascriptVariableCstToAst = new SlimeJavascriptVariableCstToAstSingle()