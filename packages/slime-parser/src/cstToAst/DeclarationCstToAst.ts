import {
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern,
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools } from "./SlimeCstToAstTools";
import SlimeParser from "../SlimeParser";

// 前向声明类型，避免循环依赖
type SlimeCstToAstType = {
    createAssignmentExpressionAst(cst: SubhutiCst): SlimeExpression;
    createExpressionAst(cst: SubhutiCst): SlimeExpression;
    createBindingIdentifierAst(cst: SubhutiCst): SlimeIdentifier;
    createBindingPatternAst(cst: SubhutiCst): SlimePattern;
    createBindingElementAst(cst: SubhutiCst): SlimePattern | SlimeIdentifier;
    createStatementDeclarationAst(cst: SubhutiCst): any;
};

/**
 * 声明相关的 CST to AST 转换
 */
export class DeclarationCstToAst {
    /**
     * 创建 VariableDeclaration 的 AST
     */
    static createVariableDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.VariableDeclaration?.name);

        const kindCst = cst.children[0].children[0]

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
            declarations = DeclarationCstToAst.createVariableDeclarationListAst(cst.children[1], converter)
        }

        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }

    /**
     * 创建 VariableDeclarationList 的 AST
     */
    static createVariableDeclarationListAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclarator[] {
        const declarations = cst.children
            .filter(item =>
                item.name === SlimeParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => DeclarationCstToAst.createVariableDeclaratorAst(item, converter))

        return declarations
    }

    /**
     * 创建 VariableDeclarator 的 AST
     */
    static createVariableDeclaratorAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclarator {
        // LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer
        const first = cst.children[0]
        let id: SlimeIdentifier | SlimePattern
        let init: SlimeExpression | null = null
        let eqToken: any = undefined

        // 获取标识符或模式
        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier') {
            id = converter.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name || first.name === 'BindingPattern') {
            id = converter.createBindingPatternAst(first)
        } else if (first.name === SlimeParser.prototype.SingleNameBinding?.name || first.name === 'SingleNameBinding') {
            // SingleNameBinding: BindingIdentifier Initializer?
            const bindingId = first.children?.find((ch: any) =>
                ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier'
            )
            if (bindingId) {
                id = converter.createBindingIdentifierAst(bindingId)
            } else {
                id = converter.createBindingIdentifierAst(first.children[0])
            }

            // 检查 SingleNameBinding 内部的 Initializer
            const innerInit = first.children?.find((ch: any) =>
                ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer'
            )
            if (innerInit) {
                const eqCst = innerInit.children?.find((ch: any) => ch.name === 'Eq' || ch.value === '=')
                if (eqCst) {
                    eqToken = SlimeTokenCreate.createAssignToken(eqCst.loc)
                }
                init = DeclarationCstToAst.createInitializerAst(innerInit, converter)
            }
        } else {
            id = converter.createBindingIdentifierAst(first)
        }

        // 检查外层的 Initializer
        if (cst.children.length > 1 && !init) {
            const initCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer'
            )
            if (initCst) {
                const eqCst = initCst.children?.find((ch: any) => ch.name === 'Eq' || ch.value === '=')
                if (eqCst) {
                    eqToken = SlimeTokenCreate.createAssignToken(eqCst.loc)
                }
                init = DeclarationCstToAst.createInitializerAst(initCst, converter)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id, eqToken, init, cst.loc)
    }

    /**
     * 创建 LexicalDeclaration 的 AST
     * ES2025 LexicalDeclaration: LetOrConst BindingList ;
     * BindingList: LexicalBinding (, LexicalBinding)*
     * LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer
     */
    static createLexicalDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LexicalDeclaration?.name);

        const children = cst.children || []
        let kind: string = 'const' // 默认值
        let kindToken: any = undefined
        const declarations: SlimeVariableDeclarator[] = []

        for (const child of children) {
            if (!child) continue
            const name = child.name

            // Skip tokens (semicolons, commas)
            if (child.loc?.type === 'Semicolon' || child.value === ';' || child.value === ',') {
                continue
            }

            // LetOrConst 规则
            if (name === SlimeParser.prototype.LetOrConst?.name || name === 'LetOrConst') {
                // 内部是 LetTok 或 ConstTok
                if (child.children && child.children.length > 0) {
                    const tokenCst = child.children[0]
                    kind = tokenCst.value as string || 'const'
                    if (kind === 'let') {
                        kindToken = SlimeTokenCreate.createLetToken(tokenCst.loc)
                    } else if (kind === 'const') {
                        kindToken = SlimeTokenCreate.createConstToken(tokenCst.loc)
                    }
                }
                continue
            }

            // 直接是 LetTok 或 ConstTok (ES2025 可能直接使用)
            if (name === 'Let' || child.value === 'let') {
                kind = 'let'
                kindToken = SlimeTokenCreate.createLetToken(child.loc)
                continue
            }
            if (name === 'Const' || child.value === 'const') {
                kind = 'const'
                kindToken = SlimeTokenCreate.createConstToken(child.loc)
                continue
            }

            // Handle BindingList wrapper
            if (name === 'BindingList' || name === SlimeParser.prototype.BindingList?.name) {
                for (const binding of child.children || []) {
                    if (binding.name === 'LexicalBinding' || binding.name === SlimeParser.prototype.LexicalBinding?.name) {
                        declarations.push(DeclarationCstToAst.createLexicalBindingAst(binding, converter))
                    }
                    // Skip commas
                    if (binding.value === ',') continue
                }
                continue
            }

            // Direct LexicalBinding
            if (name === 'LexicalBinding' || name === SlimeParser.prototype.LexicalBinding?.name) {
                declarations.push(DeclarationCstToAst.createLexicalBindingAst(child, converter))
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
     * 创建 LexicalBinding 的 AST
     * LexicalBinding: BindingIdentifier Initializer? | BindingPattern Initializer
     */
    static createLexicalBindingAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclarator {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LexicalBinding?.name);

        const children = cst.children || []

        let id: SlimeIdentifier | SlimePattern | null = null
        let init: SlimeExpression | null = null
        let assignToken: any = undefined

        for (const child of children) {
            if (!child) continue

            const name = child.name
            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                id = converter.createBindingIdentifierAst(child)
            } else if (name === SlimeParser.prototype.BindingPattern?.name || name === 'BindingPattern') {
                id = converter.createBindingPatternAst(child)
            } else if (name === SlimeParser.prototype.Initializer?.name || name === 'Initializer') {
                // Initializer: = AssignmentExpression
                // children[0] 是 Assign token，children[1] 是 AssignmentExpression
                if (child.children && child.children[0]) {
                    const assignCst = child.children[0]
                    assignToken = SlimeTokenCreate.createAssignToken(assignCst.loc)
                }
                init = DeclarationCstToAst.createInitializerAst(child, converter)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id!, assignToken, init, cst.loc)
    }

    /**
     * 创建 Initializer 的 AST
     */
    static createInitializerAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeExpression {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.Initializer?.name);
        // Initializer -> Eq + AssignmentExpression
        const assignmentExpressionCst = cst.children[1]
        return converter.createAssignmentExpressionAst(assignmentExpressionCst)
    }

    /**
     * 创建 VariableStatement 的 AST
     */
    static createVariableStatementAst(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclaration {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.VariableStatement?.name);

        // VariableStatement: var VariableDeclarationList ;
        let kindToken: any = undefined
        const varCst = cst.children.find(ch => ch.name === 'Var' || ch.value === 'var')
        if (varCst) {
            kindToken = SlimeTokenCreate.createVarToken(varCst.loc)
        }

        const declarations: SlimeVariableDeclarator[] = []
        const declListCst = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.VariableDeclarationList?.name ||
            ch.name === 'VariableDeclarationList'
        )

        if (declListCst) {
            for (const child of declListCst.children || []) {
                if (child.name === SlimeParser.prototype.VariableDeclaration?.name ||
                    child.name === 'VariableDeclaration') {
                    declarations.push(DeclarationCstToAst.createVariableDeclaratorFromVarDeclaration(child, converter))
                }
            }
        }

        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }

    /**
     * 从 VariableDeclaration 创建 VariableDeclarator
     */
    static createVariableDeclaratorFromVarDeclaration(cst: SubhutiCst, converter: SlimeCstToAstType): SlimeVariableDeclarator {
        // VariableDeclaration: BindingIdentifier Initializer? | BindingPattern Initializer
        const first = cst.children[0]
        let id: SlimeIdentifier | SlimePattern
        let init: SlimeExpression | null = null
        let eqToken: any = undefined

        if (first.name === SlimeParser.prototype.BindingIdentifier?.name || first.name === 'BindingIdentifier') {
            id = converter.createBindingIdentifierAst(first)
        } else if (first.name === SlimeParser.prototype.BindingPattern?.name || first.name === 'BindingPattern') {
            id = converter.createBindingPatternAst(first)
        } else {
            id = converter.createBindingIdentifierAst(first)
        }

        // 检查 Initializer
        if (cst.children.length > 1) {
            const initCst = cst.children.find(ch =>
                ch.name === SlimeParser.prototype.Initializer?.name || ch.name === 'Initializer'
            )
            if (initCst) {
                const eqCst = initCst.children?.find((ch: any) => ch.name === 'Eq' || ch.value === '=')
                if (eqCst) {
                    eqToken = SlimeTokenCreate.createAssignToken(eqCst.loc)
                }
                init = DeclarationCstToAst.createInitializerAst(initCst, converter)
            }
        }

        return SlimeAstUtil.createVariableDeclarator(id, eqToken, init, cst.loc)
    }

    /**
     * 创建 Declaration 的 AST (透传)
     */
    static createDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.Declaration?.name);
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return converter.createStatementDeclarationAst(firstChild)
        }
        throw new Error('Declaration has no children')
    }

    /**
     * 创建 HoistableDeclaration 的 AST (透传)
     */
    static createHoistableDeclarationAst(cst: SubhutiCst, converter: SlimeCstToAstType): any {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return converter.createStatementDeclarationAst(firstChild)
        }
        throw new Error('HoistableDeclaration has no children')
    }

    /**
     * 创建 LetOrConst 的 AST
     */
    static createLetOrConstAst(cst: SubhutiCst): string {
        SlimeCstToAstTools.checkCstName(cst, SlimeParser.prototype.LetOrConst?.name);
        const token = cst.children?.[0]
        return token?.value || 'let'
    }
}
