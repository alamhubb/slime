import {
    type SlimeVariableDeclaration,
    type SlimeVariableDeclarator,
    type SlimeExpression,
    type SlimeIdentifier,
    type SlimePattern, type SlimePropertyDefinition, type SlimeMethodDefinition, type SlimeStatement,
    type SlimeFunctionExpression, type SlimeBlockStatement, type SlimeFunctionParam,
    type SlimeFunctionDeclaration, type SlimeDeclaration
} from "slime-ast";
import { SubhutiCst } from "subhuti";
import { SlimeAstUtil, SlimeTokenCreate, SlimeNodeType } from "slime-ast";
import { SlimeCstToAstTools, checkCstName } from "./SlimeCstToAstTools.ts";
import SlimeParser from "../SlimeParser.ts";

// 使用全局变量存储 util 实例
let _slimeCstToAstUtil: any = null;

export function setDeclarationCstToAstUtil(util: any) {
    _slimeCstToAstUtil = util;
}

function getUtil(): any {
    if (!_slimeCstToAstUtil) {
        throw new Error('SlimeCstToAstUtil not initialized for DeclarationCstToAst');
    }
    return _slimeCstToAstUtil;
}

/**
 * 声明相关的 CST to AST 转换
 * 所有方法都是静态方法
 */
export class DeclarationCstToAst {

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
                declarations.push(DeclarationCstToAst.createVariableDeclaratorFromVarDeclaration(child))
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
                id = DeclarationCstToAst.createInitializerAst(child)
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
        // Initializer: = AssignmentExpression
        const assignExprCst = cst.children?.find(ch => 
            ch.name === SlimeParser.prototype.AssignmentExpression?.name || 
            ch.name === 'AssignmentExpression'
        )
        if (assignExprCst) {
            return getUtil().createAssignmentExpressionAst(assignExprCst)
        }
        // 如果没有找到 AssignmentExpression，尝试处理第二个子节点（跳过 = 号）
        if (cst.children && cst.children.length > 1) {
            return getUtil().createExpressionAst(cst.children[1])
        }
        return null
    }

    static createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const astName = checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]
        if (first.name === SlimeParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return DeclarationCstToAst.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            return DeclarationCstToAst.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            return DeclarationCstToAst.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            return DeclarationCstToAst.createAsyncGeneratorDeclarationAst(first)
        } else {
            throw new Error(`Unsupported HoistableDeclaration type: ${first.name}`)
        }
    }

    static createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'GeneratorBody' || ch.name === SlimeParser.prototype.GeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: false,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

    static createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListAstWrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncFunctionBody' || ch.name === SlimeParser.prototype.AsyncFunctionBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(id, params, body, false, true, cst.loc)
    }

    static createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        let id: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement

        const bindingId = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.BindingIdentifier?.name || ch.name === 'BindingIdentifier')
        if (bindingId) {
            id = getUtil().createBindingIdentifierAst(bindingId)
        }

        const formalParams = cst.children.find(ch =>
            ch.name === SlimeParser.prototype.FormalParameters?.name || ch.name === 'FormalParameters' ||
            ch.name === SlimeParser.prototype.FormalParameterList?.name || ch.name === 'FormalParameterList')
        if (formalParams) {
            if (formalParams.name === 'FormalParameters' || formalParams.name === SlimeParser.prototype.FormalParameters?.name) {
                params = getUtil().createFormalParametersAstWrapped(formalParams)
            } else {
                params = getUtil().createFormalParameterListFromEs2025Wrapped(formalParams)
            }
        }

        const bodyNode = cst.children.find(ch =>
            ch.name === 'AsyncGeneratorBody' || ch.name === SlimeParser.prototype.AsyncGeneratorBody?.name ||
            ch.name === 'FunctionBody' || ch.name === SlimeParser.prototype.FunctionBody?.name)
        if (bodyNode) {
            const bodyStatements = getUtil().createFunctionBodyAst(bodyNode)
            body = SlimeAstUtil.createBlockStatement(bodyStatements, bodyNode.loc)
        } else {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return {
            type: SlimeNodeType.FunctionDeclaration,
            id: id,
            params: params,
            body: body,
            generator: true,
            async: true,
            loc: cst.loc
        } as SlimeFunctionDeclaration
    }

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
            declarations = DeclarationCstToAst.createVariableDeclarationListAst(cst.children[1])
        }
        return SlimeAstUtil.createVariableDeclaration(kindToken, declarations, cst.loc)
    }

    static createVariableDeclarationListAst(cst: SubhutiCst): SlimeVariableDeclarator[] {
        let declarations = cst.children
            .filter(item =>
                item.name === SlimeParser.prototype.LexicalBinding?.name ||
                item.name === 'VariableDeclarator'
            )
            .map(item => DeclarationCstToAst.createVariableDeclaratorAst(item)) as any[]
        return declarations
    }

    /**
     * LabelledItem CST 到 AST（透传）
     */
    static createLabelledItemAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (firstChild) {
            return getUtil().createAstFromCst(firstChild)
        }
        throw new Error('LabelledItem has no children')
    }

    /**
     * ForDeclaration CST 到 AST
     */
    static createForDeclarationAst(cst: SubhutiCst): any {
        const letOrConst = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.LetOrConst?.name || ch.name === 'LetOrConst'
        )
        const forBinding = cst.children?.find(ch =>
            ch.name === SlimeParser.prototype.ForBinding?.name || ch.name === 'ForBinding'
        )

        const kind = letOrConst?.children?.[0]?.value || 'let'
        const id = forBinding ? DeclarationCstToAst.createForBindingAst(forBinding) : null

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

    /**
     * ForBinding CST 到 AST
     */
    static createForBindingAst(cst: SubhutiCst): any {
        const firstChild = cst.children?.[0]
        if (!firstChild) return null

        if (firstChild.name === SlimeParser.prototype.BindingIdentifier?.name || firstChild.name === 'BindingIdentifier') {
            return getUtil().createBindingIdentifierAst(firstChild)
        } else if (firstChild.name === SlimeParser.prototype.BindingPattern?.name || firstChild.name === 'BindingPattern') {
            return getUtil().createBindingPatternAst(firstChild)
        }
        return null
    }

    /**
     * 创建函数声明 AST
     */
    static createFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []

        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null
        let isAsync = false
        let isGenerator = false

        let functionToken: any = undefined
        let asyncToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (!child) continue

            const name = child.name
            const value = child.value || child.loc?.value

            if (name === 'Function' || value === 'function') {
                functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
                continue
            }
            if (name === 'LParen' || value === '(') {
                lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
                continue
            }
            if (name === 'RParen' || value === ')') {
                rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
                continue
            }
            if (name === 'LBrace' || value === '{') {
                lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
                continue
            }
            if (name === 'RBrace' || value === '}') {
                rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
                continue
            }
            if (name === 'Async' || value === 'async') {
                asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
                isAsync = true
                continue
            }
            if (name === 'Asterisk' || value === '*') {
                asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
                isGenerator = true
                continue
            }

            if (name === SlimeParser.prototype.BindingIdentifier?.name || name === 'BindingIdentifier') {
                functionName = getUtil().createBindingIdentifierAst(child)
                continue
            }

            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = getUtil().createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = getUtil().createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
                continue
            }
        }

        if (!body) {
            body = SlimeAstUtil.createBlockStatement([])
        }

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

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

    static createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return DeclarationCstToAst.createVariableDeclarationAst(first);
        } else if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            return DeclarationCstToAst.createLexicalDeclarationAst(first);
        } else if (name === SlimeParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return getUtil().createClassDeclarationAst(first);
        } else if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return DeclarationCstToAst.createFunctionDeclarationAst(first);
        } else if (name === SlimeParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return DeclarationCstToAst.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }

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
                        declarations.push(DeclarationCstToAst.createLexicalBindingAst(binding))
                    }
                    if (binding.value === ',') continue
                }
                continue
            }

            if (name === 'LexicalBinding' || name === SlimeParser.prototype.LexicalBinding?.name) {
                declarations.push(DeclarationCstToAst.createLexicalBindingAst(child))
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
                init = DeclarationCstToAst.createInitializerAst(child)
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
