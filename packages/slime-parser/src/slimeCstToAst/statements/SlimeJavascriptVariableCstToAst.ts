/**
 * VariableCstToAst - var/let/const 声明转换
 */
import { SubhutiCst } from "subhuti";

import SlimeJavascriptParser from "../../deprecated/SlimeJavascriptParser.ts";
import SlimeCstToAstUtil from "../../SlimeCstToAstUtil.ts";
import {
    type SlimeJavascriptBlockStatement, type SlimeJavascriptClassDeclaration, type SlimeJavascriptDeclaration,
    type SlimeJavascriptFunctionDeclaration, type SlimeJavascriptFunctionExpression,
    type SlimeJavascriptFunctionParam,
    type SlimeJavascriptIdentifier, SlimeJavascriptAstTypeName, type SlimeJavascriptPropertyDefinition,
    SlimeJavascriptTokenCreateUtils, type SlimeJavascriptVariableDeclaration, type SlimeJavascriptVariableDeclarator,
    SlimeJavascriptCreateUtils, type SlimeJavascriptPattern, type SlimeJavascriptExpression, SlimeDeclaration,
    SlimeVariableDeclarator, SlimeTokenCreateUtils, SlimeAstCreateUtils
} from "slime-ast";
import { SlimeJavascriptClassDeclarationCstToAstSingle } from "../class/SlimeJavascriptClassDeclarationCstToAst.ts";
// SlimeIdentifierCstToAst functions are accessed through SlimeCstToAstUtil



export class SlimeJavascriptVariableCstToAstSingle {

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

            if (child.name === SlimeJavascriptParser.prototype.VariableDeclarationList?.name ||
                child.name === 'VariableDeclarationList') {
                // VariableDeclarationList 包含多个 VariableDeclaration
                for (const varDeclCst of child.children || []) {
                    if (varDeclCst.name === SlimeJavascriptParser.prototype.VariableDeclaration?.name ||
                        varDeclCst.name === 'VariableDeclaration') {
                        declarations.push(SlimeCstToAstUtil.createVariableDeclaratorFromVarDeclaration(varDeclCst))
                    }
                }
            }
        }

        return {
            type: SlimeAstTypeName.VariableDeclaration,
            kind: 'var' as any,
            declarations: declarations,
            loc: cst.loc
        } as any
    }


    createVariableDeclarationAst(cst: SubhutiCst): SlimeVariableDeclaration {
        //直接返回声明
        //                 SlimeJavascriptCstToAstUtil.Statement()
        //                 SlimeJavascriptCstToAstUtil.Declaration()
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.VariableDeclaration?.name);
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

        let declarations: SlimeVariableDeclarator[] = []
        if (cst.children[1]) {
            declarations = SlimeCstToAstUtil.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeJavascriptCreateUtils.createVariableDeclaration(kindToken, declarations, cst.loc)
    }


    createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        // 过滤出VariableDeclarator节点（跳过Comma token�?
        // 兼容 VariableDeclarator �?LexicalBinding
        let declarations = cst.children
            .filter(item =>
                item.name === SlimeJavascriptParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => SlimeCstToAstUtil.createVariableDeclaratorAst(item)) as any[]
        return declarations
    }


    createVariableDeclaratorAst(cst: SubhutiCst): SlimeVariableDeclarator {
        // 兼容 LexicalBinding �?VariableDeclaration
        // const astName = SlimeJavascriptCstToAstUtil.checkCstName(cst, 'LexicalBinding');

        // children[0]可能是BindingIdentifier或BindingPattern（解构）
        const firstChild = cst.children[0]
        let id: SlimeIdentifier | SlimeJavascriptPattern

        if (firstChild.name === SlimeJavascriptParser.prototype.BindingIdentifier?.name) {
            id = SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.BindingPattern?.name) {
            id = SlimeCstToAstUtil.createBindingPatternAst(firstChild)
        } else {
            throw new Error(`Unexpected variable declarator id type: ${firstChild.name}`)
        }

        // console.log(6565656)
        // console.log(id)
        let variableDeclarator: SlimeVariableDeclarator
        const varCst = cst.children[1]
        if (varCst) {
            const eqCst = varCst.children[0]
            const eqAst = SlimeJavascriptTokenCreateUtils.createAssignToken(eqCst.loc)
            const initCst = varCst.children[1]
            if (initCst) {
                // 检查initCst是否是AssignmentExpression
                if (initCst.name === SlimeJavascriptParser.prototype.AssignmentExpression?.name) {
                    const init = SlimeCstToAstUtil.createAssignmentExpressionAst(initCst)
                    variableDeclarator = SlimeJavascriptCreateUtils.createVariableDeclarator(id, eqAst, init)
                } else {
                    // 如果不是AssignmentExpression，直接作为表达式处理
                    const init = SlimeCstToAstUtil.createExpressionAst(initCst)
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
    createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst): SlimeVariableDeclarator {
        const children = cst.children || []
        let id: any = null
        let init: any = null

        for (const child of children) {
            if (!child) continue
            const name = child.name

            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeJavascriptParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeJavascriptParser.prototype.Initializer?.name || name === 'Initializer') {
                init = SlimeCstToAstUtil.createInitializerAst(child)
            }
        }

        return {
            type: SlimeAstTypeName.VariableDeclarator,
            id: id,
            init: init,
            loc: cst.loc
        } as any
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
            if (name === SlimeJavascriptParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
                declarations.push(SlimeCstToAstUtil.createVariableDeclaratorFromVarDeclaration(child))
            }
        }

        return {
            type: SlimeAstTypeName.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
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
                        declarations.push(SlimeCstToAstUtil.createLexicalBindingAst(binding))
                    }
                    // Skip commas
                    if (binding.value === ',') continue
                }
                continue
            }

            // Direct LexicalBinding
            if (name === 'LexicalBinding' || name === SlimeJavascriptParser.prototype.LexicalBinding?.name) {
                declarations.push(SlimeCstToAstUtil.createLexicalBindingAst(child))
            }
        }

        return {
            type: SlimeAstTypeName.VariableDeclaration,
            kind: kind as any,
            declarations: declarations,
            loc: cst.loc
        } as any
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
            if (name === SlimeJavascriptParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            } else if (name === SlimeJavascriptParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = SlimeCstToAstUtil.createBindingPatternAst(child)
            } else if (name === SlimeJavascriptParser.prototype.Initializer?.name || name === 'Initializer') {
                // Initializer: = AssignmentExpression
                // children[0] �?Assign token，children[1] �?AssignmentExpression
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeJavascriptTokenCreateUtils.createAssignToken(assignCst.loc)
                }
                init = SlimeCstToAstUtil.createInitializerAst(child)
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


    createInitializerAst(cst: SubhutiCst): SlimeExpression {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return SlimeCstToAstUtil.createAssignmentExpressionAst(assignmentExpressionCst)
    }


    createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {

        // Support both Declaration wrapper and direct types
        const first = cst.name === SlimeJavascriptParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        // TypeScript 声明
        if (name === 'TSInterfaceDeclaration') {
            return SlimeCstToAstUtil.createTSInterfaceDeclarationAst(first)
        }
        if (name === 'TSTypeAliasDeclaration') {
            return SlimeCstToAstUtil.createTSTypeAliasDeclarationAst(first)
        }
        if (name === 'TSEnumDeclaration') {
            return SlimeCstToAstUtil.createTSEnumDeclarationAst(first)
        }
        if (name === 'TSModuleDeclaration') {
            return SlimeCstToAstUtil.createTSModuleDeclarationAst(first)
        }
        if (name === 'TSDeclareStatement') {
            return SlimeCstToAstUtil.createTSDeclareStatementAst(first)
        }



        if (name === SlimeJavascriptParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return SlimeCstToAstUtil.createVariableDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            // LexicalDeclaration: let/const declarations
            return SlimeCstToAstUtil.createLexicalDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return SlimeCstToAstUtil.createClassDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(first);
        } else if (name === SlimeJavascriptParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return SlimeCstToAstUtil.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }


    createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const astName = SlimeCstToAstUtil.checkCstName(cst, SlimeJavascriptParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]
        if (first.name === SlimeJavascriptParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            // GeneratorDeclaration -> 类似FunctionDeclaration但有*�?
            return SlimeCstToAstUtil.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            // AsyncFunctionDeclaration -> async function
            return SlimeCstToAstUtil.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeJavascriptParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            // AsyncGeneratorDeclaration -> async function*
            return SlimeCstToAstUtil.createAsyncGeneratorDeclarationAst(first)
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
        const id = forBinding ? SlimeCstToAstUtil.createForBindingAst(forBinding) : null

        return {
            type: SlimeAstTypeName.VariableDeclaration,
            declarations: [{
                type: SlimeAstTypeName.VariableDeclarator,
                id: id,
                init: null,
                loc: forBinding?.loc
            }],
            kind: { type: 'VariableDeclarationKind', value: kind, loc: letOrConst?.loc },
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
            return SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeJavascriptParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return SlimeCstToAstUtil.createBindingPatternAst(firstChild)
        }
        return SlimeCstToAstUtil.createBindingIdentifierAst(firstChild)
    }


}

export const SlimeJavascriptVariableCstToAst = new SlimeJavascriptVariableCstToAstSingle()
