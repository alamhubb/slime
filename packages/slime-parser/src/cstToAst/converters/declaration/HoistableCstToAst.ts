import { SubhutiCst } from "subhuti";
import { SlimeDeclaration, SlimeFunctionDeclaration, SlimeIdentifier, SlimeFunctionParam, SlimeBlockStatement, SlimeAstUtil, SlimeTokenCreate } from "slime-ast";
import SlimeCstToAstUtil, { checkCstName } from "../../../SlimeCstToAstUtil.ts";
import SlimeParser from "../../../SlimeParser.ts";

/**
 * Hoistable CST 到 AST 转换器
 * 
 * 负责处理：
 * - HoistableDeclaration: 可提升声明
 * - Declaration: 声明
 */
export class HoistableCstToAst {

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
                functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
                continue
            }

            if (name === SlimeParser.prototype.FormalParameters?.name || name === 'FormalParameters') {
                params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
                continue
            }

            if (name === SlimeParser.prototype.FunctionBody?.name || name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
                continue
            }
        }

        if (!body) body = SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, isGenerator, isAsync, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken,
            lBraceToken, rBraceToken
        )
    }

    /**
     * 创建生成器声明 AST
     */
    static createGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []
        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null

        let functionToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === 'Function') functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            else if (child.name === 'Asterisk') asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            else if (child.name === 'BindingIdentifier') functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            else if (child.name === 'LParen') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'FormalParameters') params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
            else if (child.name === 'RParen') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'LBrace') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'GeneratorBody' || child.name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
            else if (child.name === 'RBrace') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
        }
        if (!body) body = SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, true, false, cst.loc,
            functionToken, undefined, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }

    /**
     * 创建异步函数声明 AST
     */
    static createAsyncFunctionDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []
        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null

        let asyncToken: any = undefined
        let functionToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === 'Async') asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            else if (child.name === 'Function') functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            else if (child.name === 'BindingIdentifier') functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            else if (child.name === 'LParen') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'FormalParameters') params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
            else if (child.name === 'RParen') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'LBrace') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'AsyncFunctionBody' || child.name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
            else if (child.name === 'RBrace') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
        }
        if (!body) body = SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, false, true, cst.loc,
            functionToken, asyncToken, undefined, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }

    /**
     * 创建异步生成器声明 AST
     */
    static createAsyncGeneratorDeclarationAst(cst: SubhutiCst): SlimeFunctionDeclaration {
        const children = cst.children || []
        let functionName: SlimeIdentifier | null = null
        let params: SlimeFunctionParam[] = []
        let body: SlimeBlockStatement | null = null

        let asyncToken: any = undefined
        let functionToken: any = undefined
        let asteriskToken: any = undefined
        let lParenToken: any = undefined
        let rParenToken: any = undefined
        let lBraceToken: any = undefined
        let rBraceToken: any = undefined

        for (let i = 0; i < children.length; i++) {
            const child = children[i]
            if (child.name === 'Async') asyncToken = SlimeTokenCreate.createAsyncToken(child.loc)
            else if (child.name === 'Function') functionToken = SlimeTokenCreate.createFunctionToken(child.loc)
            else if (child.name === 'Asterisk') asteriskToken = SlimeTokenCreate.createAsteriskToken(child.loc)
            else if (child.name === 'BindingIdentifier') functionName = SlimeCstToAstUtil.createBindingIdentifierAst(child)
            else if (child.name === 'LParen') lParenToken = SlimeTokenCreate.createLParenToken(child.loc)
            else if (child.name === 'FormalParameters') params = SlimeCstToAstUtil.createFormalParametersAstWrapped(child)
            else if (child.name === 'RParen') rParenToken = SlimeTokenCreate.createRParenToken(child.loc)
            else if (child.name === 'LBrace') lBraceToken = SlimeTokenCreate.createLBraceToken(child.loc)
            else if (child.name === 'AsyncGeneratorBody' || child.name === 'GeneratorBody' || child.name === 'FunctionBody') {
                const statements = SlimeCstToAstUtil.createFunctionBodyAst(child)
                body = SlimeAstUtil.createBlockStatement(statements, child.loc)
            }
            else if (child.name === 'RBrace') rBraceToken = SlimeTokenCreate.createRBraceToken(child.loc)
        }
        if (!body) body = SlimeAstUtil.createBlockStatement([])

        return SlimeAstUtil.createFunctionDeclaration(
            functionName, params, body, true, true, cst.loc,
            functionToken, asyncToken, asteriskToken, lParenToken, rParenToken, lBraceToken, rBraceToken
        )
    }

    /**
     * 创建 HoistableDeclaration AST
     */
    static createHoistableDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        checkCstName(cst, SlimeParser.prototype.HoistableDeclaration?.name);
        const first = cst.children[0]

        if (first.name === SlimeParser.prototype.FunctionDeclaration?.name || first.name === 'FunctionDeclaration') {
            return this.createFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.GeneratorDeclaration?.name || first.name === 'GeneratorDeclaration') {
            return this.createGeneratorDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncFunctionDeclaration?.name || first.name === 'AsyncFunctionDeclaration') {
            return this.createAsyncFunctionDeclarationAst(first)
        } else if (first.name === SlimeParser.prototype.AsyncGeneratorDeclaration?.name || first.name === 'AsyncGeneratorDeclaration') {
            return this.createAsyncGeneratorDeclarationAst(first)
        }

        throw new Error(`Unknown HoistableDeclaration type: ${first.name}`)
    }

    /**
     * 创建 Declaration AST
     */
    static createDeclarationAst(cst: SubhutiCst): SlimeDeclaration {
        const first = cst.name === SlimeParser.prototype.Declaration?.name || cst.name === 'Declaration'
            ? cst.children[0]
            : cst

        const name = first.name

        if (name === SlimeParser.prototype.VariableDeclaration?.name || name === 'VariableDeclaration') {
            return SlimeCstToAstUtil.createVariableDeclarationAst(first);
        } else if (name === SlimeParser.prototype.LexicalDeclaration?.name || name === 'LexicalDeclaration') {
            return SlimeCstToAstUtil.createLexicalDeclarationAst(first);
        } else if (name === SlimeParser.prototype.ClassDeclaration?.name || name === 'ClassDeclaration') {
            return SlimeCstToAstUtil.createClassDeclarationAst(first);
        } else if (name === SlimeParser.prototype.FunctionDeclaration?.name || name === 'FunctionDeclaration') {
            return SlimeCstToAstUtil.createFunctionDeclarationAst(first);
        } else if (name === SlimeParser.prototype.HoistableDeclaration?.name || name === 'HoistableDeclaration') {
            return this.createHoistableDeclarationAst(first);
        } else {
            throw new Error(`Unsupported Declaration type: ${name}`)
        }
    }
}
